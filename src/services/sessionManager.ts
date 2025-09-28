/**
 * Secure Session Management Service
 * 
 * Provides comprehensive session management with device fingerprinting,
 * session validation, security monitoring, and anomaly detection.
 */

import { deviceFingerprinting, type DeviceInfo, type FingerprintResult } from '../utils/deviceFingerprint';

interface SessionInfo {
  sessionId: string;
  userId: string;
  deviceFingerprint: string;
  deviceInfo: DeviceInfo;
  createdAt: number;
  lastActivity: number;
  ipAddress?: string;
  userAgent: string;
  isActive: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  loginAttempts: number;
  maxInactivity: number; // in milliseconds
}

interface SessionValidationResult {
  isValid: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
  requiresReauth: boolean;
  deviceChanged: boolean;
}

interface SecurityEvent {
  type: 'login' | 'logout' | 'device_change' | 'suspicious_activity' | 'session_expired' | 'concurrent_session';
  timestamp: number;
  sessionId: string;
  deviceFingerprint: string;
  riskLevel: 'low' | 'medium' | 'high';
  details: Record<string, unknown>;
}

class SessionManager {
  private static instance: SessionManager;
  private currentSession: SessionInfo | null = null;
  private securityEvents: SecurityEvent[] = [];
  private maxConcurrentSessions = 3;
  private defaultMaxInactivity = 30 * 60 * 1000; // 30 minutes
  private sessionCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeSessionMonitoring();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Initialize session monitoring
   */
  private initializeSessionMonitoring(): void {
    // Check session validity every 5 minutes
    this.sessionCheckInterval = setInterval(() => {
      this.validateCurrentSession();
    }, 5 * 60 * 1000);

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.updateLastActivity();
      }
    });

    // Listen for user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => {
        this.updateLastActivity();
      }, { passive: true });
    });
  }

  /**
   * Create a new session
   */
  public async createSession(userId: string, options: {
    maxInactivity?: number;
    riskLevel?: 'low' | 'medium' | 'high';
  } = {}): Promise<SessionInfo> {
    try {
      // Generate device fingerprint
      const fingerprintResult = await deviceFingerprinting.validateDeviceForAuth();
      
      // Check for concurrent sessions
      await this.handleConcurrentSessions(userId);

      // Create session
      const sessionId = this.generateSessionId();
      const now = Date.now();

      const session: SessionInfo = {
        sessionId,
        userId,
        deviceFingerprint: fingerprintResult.fingerprint,
        deviceInfo: fingerprintResult.deviceInfo,
        createdAt: now,
        lastActivity: now,
        userAgent: navigator.userAgent,
        isActive: true,
        riskLevel: options.riskLevel || fingerprintResult.riskLevel,
        loginAttempts: 0,
        maxInactivity: options.maxInactivity || this.defaultMaxInactivity
      };

      // Store session
      this.currentSession = session;
      this.storeSession(session);

      // Log security event
      this.logSecurityEvent({
        type: 'login',
        timestamp: now,
        sessionId,
        deviceFingerprint: fingerprintResult.fingerprint,
        riskLevel: session.riskLevel,
        details: {
          isNewDevice: fingerprintResult.isNewDevice,
          deviceInfo: fingerprintResult.deviceInfo
        }
      });

      console.log('✅ Session created successfully:', {
        sessionId,
        riskLevel: session.riskLevel,
        isNewDevice: fingerprintResult.isNewDevice
      });

      return session;
    } catch (error) {
      console.error('❌ Failed to create session:', error);
      throw new Error('Session creation failed');
    }
  }

  /**
   * Validate current session
   */
  public async validateCurrentSession(): Promise<SessionValidationResult> {
    if (!this.currentSession) {
      return {
        isValid: false,
        riskLevel: 'high',
        reasons: ['No active session'],
        requiresReauth: true,
        deviceChanged: false
      };
    }

    const reasons: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let requiresReauth = false;
    let deviceChanged = false;

    try {
      // Check session expiry
      const now = Date.now();
      const inactiveTime = now - this.currentSession.lastActivity;

      if (inactiveTime > this.currentSession.maxInactivity) {
        reasons.push('Session expired due to inactivity');
        riskLevel = 'high';
        requiresReauth = true;
      }

      // Validate device fingerprint
      const currentFingerprint = await deviceFingerprinting.generateFingerprint();
      const fingerprintValidation = deviceFingerprinting.validateFingerprint(
        currentFingerprint.fingerprint,
        this.currentSession.deviceFingerprint
      );

      if (!fingerprintValidation.isValid) {
        reasons.push('Device fingerprint mismatch');
        deviceChanged = true;
        riskLevel = 'high';
        requiresReauth = true;
      } else if (fingerprintValidation.riskLevel === 'medium') {
        reasons.push('Device fingerprint partially changed');
        riskLevel = 'medium';
      }

      // Check for suspicious activity
      const riskAssessment = deviceFingerprinting.assessDeviceRisk(currentFingerprint.deviceInfo);
      if (riskAssessment.recommendation === 'block') {
        reasons.push('Suspicious device activity detected');
        riskLevel = 'high';
        requiresReauth = true;
      } else if (riskAssessment.recommendation === 'challenge') {
        reasons.push('Elevated risk detected');
        riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      }

      // Update session if valid
      if (!requiresReauth) {
        this.currentSession.lastActivity = now;
        this.currentSession.riskLevel = riskLevel;
        this.storeSession(this.currentSession);
      } else {
        // Log security event for invalid session
        this.logSecurityEvent({
          type: 'suspicious_activity',
          timestamp: now,
          sessionId: this.currentSession.sessionId,
          deviceFingerprint: currentFingerprint.fingerprint,
          riskLevel,
          details: { reasons, deviceChanged }
        });
      }

      return {
        isValid: !requiresReauth,
        riskLevel,
        reasons,
        requiresReauth,
        deviceChanged
      };

    } catch (error) {
      console.error('❌ Session validation failed:', error);
      return {
        isValid: false,
        riskLevel: 'high',
        reasons: ['Session validation error'],
        requiresReauth: true,
        deviceChanged: false
      };
    }
  }

  /**
   * Update last activity timestamp
   */
  public updateLastActivity(): void {
    if (this.currentSession && this.currentSession.isActive) {
      this.currentSession.lastActivity = Date.now();
      this.storeSession(this.currentSession);
    }
  }

  /**
   * Terminate current session
   */
  public async terminateSession(reason: string = 'User logout'): Promise<void> {
    if (this.currentSession) {
      const sessionId = this.currentSession.sessionId;
      
      // Log security event
      this.logSecurityEvent({
        type: 'logout',
        timestamp: Date.now(),
        sessionId,
        deviceFingerprint: this.currentSession.deviceFingerprint,
        riskLevel: this.currentSession.riskLevel,
        details: { reason }
      });

      // Clear session data
      this.currentSession.isActive = false;
      this.removeStoredSession();
      this.currentSession = null;

      console.log('✅ Session terminated:', { sessionId, reason });
    }
  }

  /**
   * Get current session info
   */
  public getCurrentSession(): SessionInfo | null {
    return this.currentSession;
  }

  /**
   * Check if user has active session
   */
  public hasActiveSession(): boolean {
    return this.currentSession !== null && this.currentSession.isActive;
  }

  /**
   * Get session security events
   */
  public getSecurityEvents(limit: number = 50): SecurityEvent[] {
    return this.securityEvents
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Handle concurrent sessions
   */
  private async handleConcurrentSessions(userId: string): Promise<void> {
    const storedSessions = this.getStoredSessions();
    const userSessions = storedSessions.filter(s => s.userId === userId && s.isActive);

    if (userSessions.length >= this.maxConcurrentSessions) {
      // Remove oldest session
      const oldestSession = userSessions.sort((a, b) => a.lastActivity - b.lastActivity)[0];
      
      this.logSecurityEvent({
        type: 'concurrent_session',
        timestamp: Date.now(),
        sessionId: oldestSession.sessionId,
        deviceFingerprint: oldestSession.deviceFingerprint,
        riskLevel: 'medium',
        details: { reason: 'Max concurrent sessions exceeded' }
      });

      // Remove from storage
      this.removeStoredSession(oldestSession.sessionId);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    const randomString = Array.from(randomBytes, byte => byte.toString(36)).join('');
    return `${timestamp}-${randomString}`;
  }

  /**
   * Store session in secure storage
   */
  private storeSession(session: SessionInfo): void {
    try {
      const sessions = this.getStoredSessions();
      const existingIndex = sessions.findIndex(s => s.sessionId === session.sessionId);
      
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.push(session);
      }

      localStorage.setItem('user_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('❌ Failed to store session:', error);
    }
  }

  /**
   * Get stored sessions
   */
  private getStoredSessions(): SessionInfo[] {
    try {
      const stored = localStorage.getItem('user_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Failed to get stored sessions:', error);
      return [];
    }
  }

  /**
   * Remove stored session
   */
  private removeStoredSession(sessionId?: string): void {
    try {
      if (sessionId) {
        const sessions = this.getStoredSessions();
        const filtered = sessions.filter(s => s.sessionId !== sessionId);
        localStorage.setItem('user_sessions', JSON.stringify(filtered));
      } else {
        localStorage.removeItem('user_sessions');
      }
    } catch (error) {
      console.error('❌ Failed to remove stored session:', error);
    }
  }

  /**
   * Log security event
   */
  private logSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);
    
    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    // Store in secure storage
    try {
      localStorage.setItem('security_events', JSON.stringify(this.securityEvents));
    } catch (error) {
      console.error('❌ Failed to store security events:', error);
    }

    // Log high-risk events
    if (event.riskLevel === 'high') {
      console.warn('🚨 High-risk security event:', event);
    }
  }

  /**
   * Load stored security events
   */
  public loadStoredSecurityEvents(): void {
    try {
      const stored = localStorage.getItem('security_events');
      if (stored) {
        this.securityEvents = JSON.parse(stored);
      }
    } catch (error) {
      console.error('❌ Failed to load security events:', error);
    }
  }

  /**
   * Clear all session data
   */
  public clearAllSessionData(): void {
    this.currentSession = null;
    this.securityEvents = [];
    localStorage.removeItem('user_sessions');
    localStorage.removeItem('security_events');
    deviceFingerprinting.clearStoredFingerprint();
    
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  /**
   * Cleanup on destroy
   */
  public destroy(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
export type { SessionInfo, SessionValidationResult, SecurityEvent };