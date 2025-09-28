/**
 * Multi-Factor Authentication Service
 * 
 * Provides comprehensive MFA functionality including:
 * - TOTP (Time-based One-Time Password) authentication
 * - SMS-based authentication
 * - Backup codes generation and validation
 * - MFA setup and management
 */

import CryptoJS from 'crypto-js';

// MFA Method Types
export type MFAMethod = 'totp' | 'sms' | 'backup_codes';

// TOTP Configuration
export interface TOTPConfig {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: number;
  period: number;
}

// SMS Configuration
export interface SMSConfig {
  phoneNumber: string;
  isVerified: boolean;
  lastSentAt?: Date;
}

// MFA Setup Response
export interface MFASetupResponse {
  method: MFAMethod;
  config: TOTPConfig | SMSConfig;
  isEnabled: boolean;
}

// MFA Verification Request
export interface MFAVerificationRequest {
  method: MFAMethod;
  code: string;
  userId: string;
}

// MFA Verification Response
export interface MFAVerificationResponse {
  isValid: boolean;
  method: MFAMethod;
  remainingAttempts?: number;
  nextAttemptAt?: Date;
}

// MFA Status
export interface MFAStatus {
  isEnabled: boolean;
  enabledMethods: MFAMethod[];
  primaryMethod?: MFAMethod;
  backupCodesRemaining: number;
  lastUsedAt?: Date;
}

class MFAService {
  private readonly storageKey = 'mfa_config';
  private readonly attemptsKey = 'mfa_attempts';
  private readonly maxAttempts = 3;
  private readonly lockoutDuration = 15 * 60 * 1000; // 15 minutes

  /**
   * Generate TOTP secret and setup configuration
   */
  async setupTOTP(userId: string, issuer: string = 'SmartSeller'): Promise<TOTPConfig> {
    try {
      // Generate a random secret (32 characters, base32)
      const secret = this.generateTOTPSecret();
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      
      // Create QR code URL for authenticator apps
      const qrCodeUrl = this.generateQRCodeUrl(userId, secret, issuer);
      
      const config: TOTPConfig = {
        secret,
        qrCodeUrl,
        backupCodes,
        algorithm: 'SHA1',
        digits: 6,
        period: 30
      };

      // Store configuration (encrypted)
      await this.storeMFAConfig(userId, 'totp', config);
      
      console.log('✅ TOTP setup completed for user:', userId);
      return config;
    } catch (error) {
      console.error('❌ TOTP setup failed:', error);
      throw new Error('Failed to setup TOTP authentication');
    }
  }

  /**
   * Setup SMS-based MFA
   */
  async setupSMS(userId: string, phoneNumber: string): Promise<SMSConfig> {
    try {
      // Validate phone number format
      if (!this.isValidPhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      const config: SMSConfig = {
        phoneNumber: this.normalizePhoneNumber(phoneNumber),
        isVerified: false
      };

      // Store configuration
      await this.storeMFAConfig(userId, 'sms', config);
      
      // Send verification SMS
      await this.sendVerificationSMS(userId, config.phoneNumber);
      
      console.log('✅ SMS MFA setup initiated for user:', userId);
      return config;
    } catch (error) {
      console.error('❌ SMS MFA setup failed:', error);
      throw new Error('Failed to setup SMS authentication');
    }
  }

  /**
   * Verify TOTP code
   */
  async verifyTOTP(userId: string, code: string): Promise<MFAVerificationResponse> {
    try {
      // Check rate limiting
      if (await this.isRateLimited(userId, 'totp')) {
        const nextAttempt = await this.getNextAttemptTime(userId, 'totp');
        return {
          isValid: false,
          method: 'totp',
          remainingAttempts: 0,
          nextAttemptAt: nextAttempt
        };
      }

      const config = await this.getMFAConfig(userId, 'totp') as TOTPConfig;
      if (!config) {
        throw new Error('TOTP not configured for this user');
      }

      // Check if it's a backup code
      if (config.backupCodes.includes(code)) {
        // Remove used backup code
        config.backupCodes = config.backupCodes.filter(c => c !== code);
        await this.storeMFAConfig(userId, 'totp', config);
        
        await this.clearAttempts(userId, 'totp');
        return { isValid: true, method: 'backup_codes' };
      }

      // Verify TOTP code
      const isValid = this.verifyTOTPCode(config.secret, code, config);
      
      if (isValid) {
        await this.clearAttempts(userId, 'totp');
        await this.updateLastUsed(userId, 'totp');
      } else {
        await this.recordFailedAttempt(userId, 'totp');
      }

      const remainingAttempts = await this.getRemainingAttempts(userId, 'totp');
      
      return {
        isValid,
        method: 'totp',
        remainingAttempts
      };
    } catch (error) {
      console.error('❌ TOTP verification failed:', error);
      throw new Error('TOTP verification failed');
    }
  }

  /**
   * Verify SMS code
   */
  async verifySMS(userId: string, code: string): Promise<MFAVerificationResponse> {
    try {
      // Check rate limiting
      if (await this.isRateLimited(userId, 'sms')) {
        const nextAttempt = await this.getNextAttemptTime(userId, 'sms');
        return {
          isValid: false,
          method: 'sms',
          remainingAttempts: 0,
          nextAttemptAt: nextAttempt
        };
      }

      // Get stored verification code
      const storedCode = await this.getStoredSMSCode(userId);
      if (!storedCode) {
        throw new Error('No SMS code found or code expired');
      }

      const isValid = storedCode === code;
      
      if (isValid) {
        await this.clearAttempts(userId, 'sms');
        await this.clearStoredSMSCode(userId);
        await this.updateLastUsed(userId, 'sms');
        
        // Mark SMS as verified if this is initial setup
        const config = await this.getMFAConfig(userId, 'sms') as SMSConfig;
        if (config && !config.isVerified) {
          config.isVerified = true;
          await this.storeMFAConfig(userId, 'sms', config);
        }
      } else {
        await this.recordFailedAttempt(userId, 'sms');
      }

      const remainingAttempts = await this.getRemainingAttempts(userId, 'sms');
      
      return {
        isValid,
        method: 'sms',
        remainingAttempts
      };
    } catch (error) {
      console.error('❌ SMS verification failed:', error);
      throw new Error('SMS verification failed');
    }
  }

  /**
   * Send SMS verification code
   */
  async sendSMSCode(userId: string): Promise<void> {
    try {
      const config = await this.getMFAConfig(userId, 'sms') as SMSConfig;
      if (!config || !config.isVerified) {
        throw new Error('SMS MFA not properly configured');
      }

      // Check if we can send (rate limiting)
      if (config.lastSentAt && Date.now() - config.lastSentAt.getTime() < 60000) {
        throw new Error('Please wait before requesting another SMS code');
      }

      await this.sendVerificationSMS(userId, config.phoneNumber);
      
      // Update last sent time
      config.lastSentAt = new Date();
      await this.storeMFAConfig(userId, 'sms', config);
      
      console.log('✅ SMS code sent to user:', userId);
    } catch (error) {
      console.error('❌ Failed to send SMS code:', error);
      throw error;
    }
  }

  /**
   * Get MFA status for user
   */
  async getMFAStatus(userId: string): Promise<MFAStatus> {
    try {
      const totpConfig = await this.getMFAConfig(userId, 'totp') as TOTPConfig;
      const smsConfig = await this.getMFAConfig(userId, 'sms') as SMSConfig;
      
      const enabledMethods: MFAMethod[] = [];
      
      if (totpConfig) {
        enabledMethods.push('totp');
        if (totpConfig.backupCodes.length > 0) {
          enabledMethods.push('backup_codes');
        }
      }
      
      if (smsConfig && smsConfig.isVerified) {
        enabledMethods.push('sms');
      }

      const lastUsed = await this.getLastUsed(userId);
      
      return {
        isEnabled: enabledMethods.length > 0,
        enabledMethods,
        primaryMethod: enabledMethods[0],
        backupCodesRemaining: totpConfig?.backupCodes.length || 0,
        lastUsedAt: lastUsed
      };
    } catch (error) {
      console.error('❌ Failed to get MFA status:', error);
      return {
        isEnabled: false,
        enabledMethods: [],
        backupCodesRemaining: 0
      };
    }
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(userId: string, method?: MFAMethod): Promise<void> {
    try {
      if (method) {
        // Disable specific method
        await this.removeMFAConfig(userId, method);
        console.log(`✅ ${method.toUpperCase()} MFA disabled for user:`, userId);
      } else {
        // Disable all MFA methods
        await this.removeAllMFAConfig(userId);
        console.log('✅ All MFA methods disabled for user:', userId);
      }
    } catch (error) {
      console.error('❌ Failed to disable MFA:', error);
      throw new Error('Failed to disable MFA');
    }
  }

  /**
   * Generate new backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    try {
      const config = await this.getMFAConfig(userId, 'totp') as TOTPConfig;
      if (!config) {
        throw new Error('TOTP not configured for this user');
      }

      const newBackupCodes = this.generateBackupCodes();
      config.backupCodes = newBackupCodes;
      
      await this.storeMFAConfig(userId, 'totp', config);
      
      console.log('✅ Backup codes regenerated for user:', userId);
      return newBackupCodes;
    } catch (error) {
      console.error('❌ Failed to regenerate backup codes:', error);
      throw new Error('Failed to regenerate backup codes');
    }
  }

  // Private helper methods

  private generateTOTPSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  private generateQRCodeUrl(userId: string, secret: string, issuer: string): string {
    const label = encodeURIComponent(`${issuer}:${userId}`);
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: 'SHA1',
      digits: '6',
      period: '30'
    });
    
    return `otpauth://totp/${label}?${params.toString()}`;
  }

  private verifyTOTPCode(secret: string, code: string, config: TOTPConfig): boolean {
    const timeStep = Math.floor(Date.now() / 1000 / config.period);
    
    // Check current time step and previous/next for clock skew tolerance
    for (let i = -1; i <= 1; i++) {
      const testCode = this.generateTOTPCode(secret, timeStep + i, config);
      if (testCode === code) {
        return true;
      }
    }
    
    return false;
  }

  private generateTOTPCode(secret: string, timeStep: number, config: TOTPConfig): string {
    // Convert secret from base32
    const key = this.base32Decode(secret);
    
    // Convert time step to 8-byte buffer
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeUInt32BE(Math.floor(timeStep / 0x100000000), 0);
    timeBuffer.writeUInt32BE(timeStep & 0xffffffff, 4);
    
    // Generate HMAC
    const hmac = CryptoJS.HmacSHA1(CryptoJS.lib.WordArray.create(timeBuffer), CryptoJS.lib.WordArray.create(key));
    const hmacBytes = hmac.toString(CryptoJS.enc.Hex);
    
    // Dynamic truncation
    const offset = parseInt(hmacBytes.slice(-1), 16);
    const code = parseInt(hmacBytes.substr(offset * 2, 8), 16) & 0x7fffffff;
    
    // Return code with leading zeros
    return (code % Math.pow(10, config.digits)).toString().padStart(config.digits, '0');
  }

  private base32Decode(encoded: string): number[] {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const decoded: number[] = [];
    let bits = 0;
    let value = 0;
    
    for (const char of encoded.toUpperCase()) {
      const index = alphabet.indexOf(char);
      if (index === -1) continue;
      
      value = (value << 5) | index;
      bits += 5;
      
      if (bits >= 8) {
        decoded.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }
    
    return decoded;
  }

  private isValidPhoneNumber(phone: string): boolean {
    // Basic phone number validation (E.164 format)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  private normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    return phone.replace(/[^\d+]/g, '');
  }

  private async sendVerificationSMS(userId: string, phoneNumber: string): Promise<void> {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code temporarily (5 minutes expiry)
    const codeData = {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
      phoneNumber
    };
    
    localStorage.setItem(`sms_code_${userId}`, JSON.stringify(codeData));
    
    // In a real implementation, you would send SMS via SMS provider (Twilio, AWS SNS, etc.)
    console.log(`📱 SMS Code for ${phoneNumber}: ${code}`);
    
    // For demo purposes, show code in console
    // In production, remove this and implement actual SMS sending
    if (process.env.NODE_ENV === 'development') {
      alert(`SMS Code sent to ${phoneNumber}: ${code}`);
    }
  }

  private async getStoredSMSCode(userId: string): Promise<string | null> {
    const stored = localStorage.getItem(`sms_code_${userId}`);
    if (!stored) return null;
    
    try {
      const codeData = JSON.parse(stored);
      if (Date.now() > codeData.expiresAt) {
        localStorage.removeItem(`sms_code_${userId}`);
        return null;
      }
      
      return codeData.code;
    } catch {
      return null;
    }
  }

  private async clearStoredSMSCode(userId: string): Promise<void> {
    localStorage.removeItem(`sms_code_${userId}`);
  }

  private async storeMFAConfig(userId: string, method: MFAMethod, config: TOTPConfig | SMSConfig): Promise<void> {
    const key = `${this.storageKey}_${userId}_${method}`;
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(config), userId).toString();
    localStorage.setItem(key, encrypted);
  }

  private async getMFAConfig(userId: string, method: MFAMethod): Promise<TOTPConfig | SMSConfig | null> {
    const key = `${this.storageKey}_${userId}_${method}`;
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    
    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, userId).toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }

  private async removeMFAConfig(userId: string, method: MFAMethod): Promise<void> {
    const key = `${this.storageKey}_${userId}_${method}`;
    localStorage.removeItem(key);
  }

  private async removeAllMFAConfig(userId: string): Promise<void> {
    const methods: MFAMethod[] = ['totp', 'sms', 'backup_codes'];
    methods.forEach(method => {
      const key = `${this.storageKey}_${userId}_${method}`;
      localStorage.removeItem(key);
    });
  }

  private async isRateLimited(userId: string, method: MFAMethod): Promise<boolean> {
    const attempts = await this.getFailedAttempts(userId, method);
    return attempts >= this.maxAttempts;
  }

  private async getFailedAttempts(userId: string, method: MFAMethod): Promise<number> {
    const key = `${this.attemptsKey}_${userId}_${method}`;
    const stored = localStorage.getItem(key);
    if (!stored) return 0;
    
    try {
      const data = JSON.parse(stored);
      if (Date.now() > data.resetAt) {
        localStorage.removeItem(key);
        return 0;
      }
      return data.attempts;
    } catch {
      return 0;
    }
  }

  private async getRemainingAttempts(userId: string, method: MFAMethod): Promise<number> {
    const failed = await this.getFailedAttempts(userId, method);
    return Math.max(0, this.maxAttempts - failed);
  }

  private async recordFailedAttempt(userId: string, method: MFAMethod): Promise<void> {
    const key = `${this.attemptsKey}_${userId}_${method}`;
    const attempts = await this.getFailedAttempts(userId, method);
    
    const data = {
      attempts: attempts + 1,
      resetAt: Date.now() + this.lockoutDuration
    };
    
    localStorage.setItem(key, JSON.stringify(data));
  }

  private async clearAttempts(userId: string, method: MFAMethod): Promise<void> {
    const key = `${this.attemptsKey}_${userId}_${method}`;
    localStorage.removeItem(key);
  }

  private async getNextAttemptTime(userId: string, method: MFAMethod): Promise<Date> {
    const key = `${this.attemptsKey}_${userId}_${method}`;
    const stored = localStorage.getItem(key);
    if (!stored) return new Date();
    
    try {
      const data = JSON.parse(stored);
      return new Date(data.resetAt);
    } catch {
      return new Date();
    }
  }

  private async updateLastUsed(userId: string, method: MFAMethod): Promise<void> {
    const key = `mfa_last_used_${userId}_${method}`;
    localStorage.setItem(key, Date.now().toString());
  }

  private async getLastUsed(userId: string): Promise<Date | undefined> {
    const methods: MFAMethod[] = ['totp', 'sms'];
    let lastUsed = 0;
    
    for (const method of methods) {
      const key = `mfa_last_used_${userId}_${method}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const timestamp = parseInt(stored);
        if (timestamp > lastUsed) {
          lastUsed = timestamp;
        }
      }
    }
    
    return lastUsed > 0 ? new Date(lastUsed) : undefined;
  }
}

export const mfaService = new MFAService();
export default mfaService;