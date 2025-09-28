/**
 * Session Manager Hook
 * 
 * Provides React integration for secure session management with device fingerprinting.
 * Handles session creation, validation, monitoring, and security events.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { sessionManager, type SessionInfo, type SessionValidationResult, type SecurityEvent } from '../services/sessionManager';

interface UseSessionManagerReturn {
  // Session state
  currentSession: SessionInfo | null;
  isSessionValid: boolean;
  sessionRiskLevel: 'low' | 'medium' | 'high';
  
  // Session actions
  createSession: (userId: string, options?: { maxInactivity?: number; riskLevel?: 'low' | 'medium' | 'high' }) => Promise<SessionInfo>;
  validateSession: () => Promise<SessionValidationResult>;
  terminateSession: (reason?: string) => Promise<void>;
  updateActivity: () => void;
  
  // Security monitoring
  securityEvents: SecurityEvent[];
  hasHighRiskEvents: boolean;
  getSecurityEvents: () => Promise<SecurityEvent[]>;
  clearSecurityEvents: () => Promise<void>;
  
  // Loading states
  isValidating: boolean;
  isCreating: boolean;
  
  // Session info
  sessionTimeRemaining: number | null;
  isSessionExpiringSoon: boolean;
}

export const useSessionManager = (): UseSessionManagerReturn => {
  const [currentSession, setCurrentSession] = useState<SessionInfo | null>(null);
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [sessionRiskLevel, setSessionRiskLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number | null>(null);
  
  const validationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initialize session manager and load existing session
   */
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Load stored security events
        sessionManager.loadStoredSecurityEvents();
        
        // Get current session
        const session = sessionManager.getCurrentSession();
        if (session) {
          setCurrentSession(session);
          setSessionRiskLevel(session.riskLevel);
          
          // Validate existing session
          await validateSession();
        }
        
        // Load security events
        const events = sessionManager.getSecurityEvents();
        setSecurityEvents(events);
        
      } catch (error) {
        console.error('❌ Failed to initialize session manager:', error);
      }
    };

    initializeSession();

    // Set up periodic validation
    validationIntervalRef.current = setInterval(() => {
      if (currentSession) {
        validateSession();
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    // Set up time remaining updates
    timeUpdateIntervalRef.current = setInterval(() => {
      updateTimeRemaining();
    }, 30 * 1000); // Every 30 seconds

    return () => {
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
      }
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, []);

  /**
   * Update session time remaining
   */
  const updateTimeRemaining = useCallback(() => {
    if (currentSession) {
      const now = Date.now();
      const timeLeft = currentSession.maxInactivity - (now - currentSession.lastActivity);
      setSessionTimeRemaining(Math.max(0, timeLeft));
    } else {
      setSessionTimeRemaining(null);
    }
  }, [currentSession]);

  /**
   * Create new session
   */
  const createSession = useCallback(async (
    userId: string, 
    options: { maxInactivity?: number; riskLevel?: 'low' | 'medium' | 'high' } = {}
  ): Promise<SessionInfo> => {
    setIsCreating(true);
    try {
      const session = await sessionManager.createSession(userId, options);
      setCurrentSession(session);
      setIsSessionValid(true);
      setSessionRiskLevel(session.riskLevel);
      
      // Update security events
      const events = sessionManager.getSecurityEvents();
      setSecurityEvents(events);
      
      console.log('✅ Session created successfully:', session.sessionId);
      return session;
    } catch (error) {
      console.error('❌ Failed to create session:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, []);

  /**
   * Validate current session
   */
  const validateSession = useCallback(async (): Promise<SessionValidationResult> => {
    setIsValidating(true);
    try {
      const result = await sessionManager.validateCurrentSession();
      
      setIsSessionValid(result.isValid);
      setSessionRiskLevel(result.riskLevel);
      
      if (!result.isValid) {
        setCurrentSession(null);
        
        // Update security events if validation failed
        const events = sessionManager.getSecurityEvents();
        setSecurityEvents(events);
      } else {
        // Update current session data
        const session = sessionManager.getCurrentSession();
        setCurrentSession(session);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Session validation failed:', error);
      setIsSessionValid(false);
      setSessionRiskLevel('high');
      throw error;
    } finally {
      setIsValidating(false);
    }
  }, []);

  /**
   * Terminate current session
   */
  const terminateSession = useCallback(async (reason: string = 'User logout'): Promise<void> => {
    try {
      await sessionManager.terminateSession(reason);
      setCurrentSession(null);
      setIsSessionValid(false);
      setSessionRiskLevel('low');
      setSessionTimeRemaining(null);
      
      // Update security events
      const events = sessionManager.getSecurityEvents();
      setSecurityEvents(events);
      
      console.log('✅ Session terminated successfully');
    } catch (error) {
      console.error('❌ Failed to terminate session:', error);
      throw error;
    }
  }, []);

  /**
   * Update user activity
   */
  const updateActivity = useCallback(() => {
    sessionManager.updateLastActivity();
    if (currentSession) {
      const updatedSession = sessionManager.getCurrentSession();
      setCurrentSession(updatedSession);
    }
  }, [currentSession]);

  /**
   * Check for high-risk security events
   */
  const hasHighRiskEvents = securityEvents.some(event => 
    event.riskLevel === 'high' && 
    Date.now() - event.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
  );

  /**
   * Get security events
   */
  const getSecurityEvents = useCallback(async (): Promise<SecurityEvent[]> => {
    try {
      const events = sessionManager.getSecurityEvents();
      setSecurityEvents(events);
      return events;
    } catch (error) {
      console.error('❌ Failed to get security events:', error);
      return [];
    }
  }, []);

  /**
   * Clear security events
   */
  const clearSecurityEvents = useCallback(async (): Promise<void> => {
    try {
      sessionManager.clearSecurityEvents();
      setSecurityEvents([]);
      console.log('✅ Security events cleared');
    } catch (error) {
      console.error('❌ Failed to clear security events:', error);
      throw error;
    }
  }, []);

  /**
   * Check if session is expiring soon
   */
  const isSessionExpiringSoon = sessionTimeRemaining !== null && sessionTimeRemaining < 5 * 60 * 1000; // 5 minutes

  return {
    // Session state
    currentSession,
    isSessionValid,
    sessionRiskLevel,
    
    // Session actions
    createSession,
    validateSession,
    terminateSession,
    updateActivity,
    
    // Security monitoring
    securityEvents,
    hasHighRiskEvents,
    getSecurityEvents,
    clearSecurityEvents,
    
    // Loading states
    isValidating,
    isCreating,
    
    // Session info
    sessionTimeRemaining,
    isSessionExpiringSoon
  };
};