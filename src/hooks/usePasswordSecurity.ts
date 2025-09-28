/**
 * Password Security Hook
 * 
 * Provides real-time password strength validation and breach checking
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  passwordSecurity, 
  PasswordStrengthResult, 
  BreachCheckResult,
  PasswordGenerationOptions 
} from '../services/passwordSecurity';

export interface UsePasswordSecurityOptions {
  debounceMs?: number;
  enableBreachCheck?: boolean;
  autoCheckBreach?: boolean;
  minStrengthScore?: number;
}

export interface UsePasswordSecurityReturn {
  // Password analysis
  strength: PasswordStrengthResult | null;
  breach: BreachCheckResult | null;
  
  // Loading states
  isAnalyzing: boolean;
  isCheckingBreach: boolean;
  
  // Validation states
  isValid: boolean;
  isStrong: boolean;
  isSecure: boolean; // Strong + not breached
  
  // Actions
  analyzePassword: (password: string) => void;
  checkBreach: (password: string) => Promise<void>;
  generatePassword: (options?: Partial<PasswordGenerationOptions>) => string;
  clearAnalysis: () => void;
  
  // Computed properties
  strengthColor: string;
  strengthLabel: string;
  progressPercentage: number;
  
  // Error handling
  error: string | null;
}

export function usePasswordSecurity(
  initialPassword = '',
  options: UsePasswordSecurityOptions = {}
): UsePasswordSecurityReturn {
  const {
    debounceMs = 300,
    enableBreachCheck = true,
    autoCheckBreach = true,
    minStrengthScore = 60
  } = options;

  // State
  const [password, setPassword] = useState(initialPassword);
  const [strength, setStrength] = useState<PasswordStrengthResult | null>(null);
  const [breach, setBreach] = useState<BreachCheckResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCheckingBreach, setIsCheckingBreach] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Clear previous timer when password changes
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  }, [password]);

  // Analyze password strength
  const analyzePassword = useCallback((newPassword: string) => {
    setPassword(newPassword);
    setError(null);

    if (!newPassword.trim()) {
      setStrength(null);
      setBreach(null);
      return;
    }

    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer for debounced analysis
    const timer = setTimeout(async () => {
      setIsAnalyzing(true);
      
      try {
        // Analyze strength
        const strengthResult = passwordSecurity.analyzePasswordStrength(newPassword);
        setStrength(strengthResult);

        // Auto-check breach if enabled and password is strong enough
        if (enableBreachCheck && autoCheckBreach && strengthResult.score >= minStrengthScore) {
          await performBreachCheck(newPassword);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to analyze password');
      } finally {
        setIsAnalyzing(false);
      }
    }, debounceMs);

    setDebounceTimer(timer);
  }, [debounceMs, enableBreachCheck, autoCheckBreach, minStrengthScore, debounceTimer]);

  // Check password breach
  const performBreachCheck = useCallback(async (passwordToCheck: string) => {
    if (!enableBreachCheck) return;

    setIsCheckingBreach(true);
    setError(null);

    try {
      const breachResult = await passwordSecurity.checkPasswordBreach(passwordToCheck);
      setBreach(breachResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check password breach');
    } finally {
      setIsCheckingBreach(false);
    }
  }, [enableBreachCheck]);

  // Manual breach check
  const checkBreach = useCallback(async (passwordToCheck: string) => {
    await performBreachCheck(passwordToCheck);
  }, [performBreachCheck]);

  // Generate secure password
  const generatePassword = useCallback((generationOptions?: Partial<PasswordGenerationOptions>) => {
    try {
      const newPassword = passwordSecurity.generateSecurePassword(generationOptions);
      analyzePassword(newPassword);
      return newPassword;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate password');
      return '';
    }
  }, [analyzePassword]);

  // Clear analysis
  const clearAnalysis = useCallback(() => {
    setPassword('');
    setStrength(null);
    setBreach(null);
    setError(null);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }
  }, [debounceTimer]);

  // Computed properties
  const strengthColor = useMemo(() => {
    if (!strength) return '#e2e8f0'; // gray-300
    
    switch (strength.level) {
      case 'very-weak': return '#ef4444'; // red-500
      case 'weak': return '#f97316'; // orange-500
      case 'fair': return '#eab308'; // yellow-500
      case 'good': return '#22c55e'; // green-500
      case 'strong': return '#16a34a'; // green-600
      case 'very-strong': return '#15803d'; // green-700
      default: return '#e2e8f0';
    }
  }, [strength]);

  const strengthLabel = useMemo(() => {
    if (!strength) return 'Enter password';
    
    switch (strength.level) {
      case 'very-weak': return 'Very Weak';
      case 'weak': return 'Weak';
      case 'fair': return 'Fair';
      case 'good': return 'Good';
      case 'strong': return 'Strong';
      case 'very-strong': return 'Very Strong';
      default: return 'Unknown';
    }
  }, [strength]);

  const progressPercentage = useMemo(() => {
    return strength ? strength.score : 0;
  }, [strength]);

  const isValid = useMemo(() => {
    if (!strength) return false;
    return strength.score >= minStrengthScore && 
           strength.requirements.filter(r => r.required).every(r => r.met);
  }, [strength, minStrengthScore]);

  const isStrong = useMemo(() => {
    return strength ? strength.score >= 75 : false;
  }, [strength]);

  const isSecure = useMemo(() => {
    return isStrong && (breach ? !breach.isBreached : true);
  }, [isStrong, breach]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return {
    // Password analysis
    strength,
    breach,
    
    // Loading states
    isAnalyzing,
    isCheckingBreach,
    
    // Validation states
    isValid,
    isStrong,
    isSecure,
    
    // Actions
    analyzePassword,
    checkBreach,
    generatePassword,
    clearAnalysis,
    
    // Computed properties
    strengthColor,
    strengthLabel,
    progressPercentage,
    
    // Error handling
    error
  };
}

export default usePasswordSecurity;