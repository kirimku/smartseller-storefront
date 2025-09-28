/**
 * MFA (Multi-Factor Authentication) Hook
 * 
 * Provides React integration for MFA functionality including:
 * - TOTP setup and verification
 * - SMS setup and verification
 * - Backup codes management
 * - MFA status tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  mfaService, 
  type MFAMethod, 
  type TOTPConfig, 
  type SMSConfig, 
  type MFAStatus, 
  type MFAVerificationResponse 
} from '../services/mfaService';

interface UseMFAReturn {
  // MFA Status
  mfaStatus: MFAStatus | null;
  isLoading: boolean;
  error: string | null;
  
  // TOTP Management
  totpConfig: TOTPConfig | null;
  setupTOTP: (userId: string, issuer?: string) => Promise<TOTPConfig>;
  verifyTOTP: (userId: string, code: string) => Promise<MFAVerificationResponse>;
  
  // SMS Management
  smsConfig: SMSConfig | null;
  setupSMS: (userId: string, phoneNumber: string) => Promise<SMSConfig>;
  sendSMSCode: (userId: string) => Promise<void>;
  verifySMS: (userId: string, code: string) => Promise<MFAVerificationResponse>;
  
  // Backup Codes
  backupCodes: string[];
  regenerateBackupCodes: (userId: string) => Promise<string[]>;
  
  // General MFA Management
  refreshMFAStatus: (userId: string) => Promise<void>;
  disableMFA: (userId: string, method?: MFAMethod) => Promise<void>;
  clearError: () => void;
  
  // Verification State
  verificationResult: MFAVerificationResponse | null;
  clearVerificationResult: () => void;
}

export const useMFA = (): UseMFAReturn => {
  const [mfaStatus, setMfaStatus] = useState<MFAStatus | null>(null);
  const [totpConfig, setTotpConfig] = useState<TOTPConfig | null>(null);
  const [smsConfig, setSmsConfig] = useState<SMSConfig | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<MFAVerificationResponse | null>(null);

  /**
   * Setup TOTP authentication
   */
  const setupTOTP = useCallback(async (userId: string, issuer: string = 'SmartSeller'): Promise<TOTPConfig> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const config = await mfaService.setupTOTP(userId, issuer);
      setTotpConfig(config);
      setBackupCodes(config.backupCodes);
      
      // Refresh MFA status
      await refreshMFAStatus(userId);
      
      console.log('✅ TOTP setup completed');
      return config;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to setup TOTP';
      setError(errorMessage);
      console.error('❌ TOTP setup failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Setup SMS authentication
   */
  const setupSMS = useCallback(async (userId: string, phoneNumber: string): Promise<SMSConfig> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const config = await mfaService.setupSMS(userId, phoneNumber);
      setSmsConfig(config);
      
      console.log('✅ SMS setup initiated');
      return config;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to setup SMS';
      setError(errorMessage);
      console.error('❌ SMS setup failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Verify TOTP code
   */
  const verifyTOTP = useCallback(async (userId: string, code: string): Promise<MFAVerificationResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await mfaService.verifyTOTP(userId, code);
      setVerificationResult(result);
      
      if (result.isValid) {
        // Refresh MFA status after successful verification
        await refreshMFAStatus(userId);
        console.log('✅ TOTP verification successful');
      } else {
        console.log('❌ TOTP verification failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'TOTP verification failed';
      setError(errorMessage);
      console.error('❌ TOTP verification error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Send SMS verification code
   */
  const sendSMSCode = useCallback(async (userId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await mfaService.sendSMSCode(userId);
      console.log('✅ SMS code sent');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send SMS code';
      setError(errorMessage);
      console.error('❌ SMS send failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Verify SMS code
   */
  const verifySMS = useCallback(async (userId: string, code: string): Promise<MFAVerificationResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await mfaService.verifySMS(userId, code);
      setVerificationResult(result);
      
      if (result.isValid) {
        // Refresh MFA status and SMS config after successful verification
        await refreshMFAStatus(userId);
        
        // Update SMS config to reflect verification status
        if (smsConfig) {
          setSmsConfig({ ...smsConfig, isVerified: true });
        }
        
        console.log('✅ SMS verification successful');
      } else {
        console.log('❌ SMS verification failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'SMS verification failed';
      setError(errorMessage);
      console.error('❌ SMS verification error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [smsConfig]);

  /**
   * Regenerate backup codes
   */
  const regenerateBackupCodes = useCallback(async (userId: string): Promise<string[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newCodes = await mfaService.regenerateBackupCodes(userId);
      setBackupCodes(newCodes);
      
      // Update TOTP config with new backup codes
      if (totpConfig) {
        setTotpConfig({ ...totpConfig, backupCodes: newCodes });
      }
      
      // Refresh MFA status
      await refreshMFAStatus(userId);
      
      console.log('✅ Backup codes regenerated');
      return newCodes;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate backup codes';
      setError(errorMessage);
      console.error('❌ Backup codes regeneration failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [totpConfig]);

  /**
   * Refresh MFA status
   */
  const refreshMFAStatus = useCallback(async (userId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const status = await mfaService.getMFAStatus(userId);
      setMfaStatus(status);
      console.log('✅ MFA status refreshed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh MFA status';
      setError(errorMessage);
      console.error('❌ MFA status refresh failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Disable MFA
   */
  const disableMFA = useCallback(async (userId: string, method?: MFAMethod): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await mfaService.disableMFA(userId, method);
      
      if (method === 'totp' || !method) {
        setTotpConfig(null);
        setBackupCodes([]);
      }
      
      if (method === 'sms' || !method) {
        setSmsConfig(null);
      }
      
      // Refresh MFA status
      await refreshMFAStatus(userId);
      
      console.log(`✅ MFA ${method ? method.toUpperCase() : 'all methods'} disabled`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disable MFA';
      setError(errorMessage);
      console.error('❌ MFA disable failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear verification result
   */
  const clearVerificationResult = useCallback(() => {
    setVerificationResult(null);
  }, []);

  return {
    // MFA Status
    mfaStatus,
    isLoading,
    error,
    
    // TOTP Management
    totpConfig,
    setupTOTP,
    verifyTOTP,
    
    // SMS Management
    smsConfig,
    setupSMS,
    sendSMSCode,
    verifySMS,
    
    // Backup Codes
    backupCodes,
    regenerateBackupCodes,
    
    // General MFA Management
    refreshMFAStatus,
    disableMFA,
    clearError,
    
    // Verification State
    verificationResult,
    clearVerificationResult
  };
};

export default useMFA;