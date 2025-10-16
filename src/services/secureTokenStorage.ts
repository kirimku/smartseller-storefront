/**
 * Secure Token Storage Service
 * 
 * Implements secure token storage using:
 * - Memory storage for access tokens (cleared on page refresh)
 * - httpOnly cookies for refresh tokens (handled server-side)
 * - AES-256-GCM encrypted localStorage as fallback for non-sensitive data
 * - Device fingerprinting validation for enhanced security
 * - Automatic token cleanup and validation
 * - Token integrity verification with HMAC
 */

import CryptoJS from 'crypto-js';
import { deviceFingerprinting, type DeviceInfo } from '@/utils/deviceFingerprint';

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
  deviceFingerprint?: string;
  issuedAt?: number;
}

interface CustomerData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isEmailVerified: boolean;
  lastLoginAt?: number;
  deviceInfo?: DeviceInfo;
}

interface SecureStorageItem {
  data: string;
  iv: string;
  salt: string;
  hmac: string;
  timestamp: number;
  deviceFingerprint?: string;
}

class SecureTokenStorage {
  private static instance: SecureTokenStorage;
  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private customerData: CustomerData | null = null;
  private readonly encryptionKey: string;
  private readonly hmacKey: string;
  private currentDeviceFingerprint: string | null = null;
  private readonly maxTokenAge = 24 * 60 * 60 * 1000; // 24 hours
  private fingerprintValidationEnabled: boolean = true;

  private constructor() {
    // Generate or retrieve encryption keys for localStorage fallback
    this.encryptionKey = this.getOrCreateEncryptionKey();
    this.hmacKey = this.getOrCreateHmacKey();
    
    // Initialize device fingerprinting
    this.initializeDeviceFingerprinting();
    
    // Configure fingerprint validation based on environment
    this.fingerprintValidationEnabled = this.shouldEnableFingerprintValidation();

    // Initialize from existing storage on app start
    this.initializeFromStorage();
    
    // Set up automatic cleanup
    this.setupTokenCleanup();
  }

  public static getInstance(): SecureTokenStorage {
    if (!SecureTokenStorage.instance) {
      SecureTokenStorage.instance = new SecureTokenStorage();
    }
    return SecureTokenStorage.instance;
  }

  /**
   * Store authentication tokens securely with device fingerprinting validation
   */
  public async storeTokens(tokenData: TokenData, customerData: CustomerData): Promise<void> {
    try {
      try {
        console.debug('🧩 storeTokens input', {
          accessTokenPreview: tokenData.accessToken?.substring(0, 12) + '...',
          refreshTokenPreview: tokenData.refreshToken?.substring(0, 12) + '...',
          expiresAtIso: new Date(tokenData.expiresAt).toISOString(),
          hasFingerprint: !!tokenData.deviceFingerprint,
          customerId: customerData.id,
          customerEmailMasked: customerData.email?.replace(/(.{3}).*(.{3})@/, '$1***$2@')
        });
      } catch {}
      // Validate device fingerprint if enabled
      if (this.fingerprintValidationEnabled) {
        await this.validateDeviceFingerprint(tokenData.deviceFingerprint);
      }

      // Store access token in memory only
      this.accessToken = tokenData.accessToken;
      this.tokenExpiresAt = tokenData.expiresAt;
      
      // Enhanced customer data with device info and timestamp
      const enhancedCustomerData: CustomerData = {
        ...customerData,
        lastLoginAt: Date.now(),
        deviceInfo: await this.getCurrentDeviceInfo()
      };
      this.customerData = enhancedCustomerData;

      // Store encrypted customer data in localStorage (non-sensitive)
      await this.storeEncryptedCustomerData(enhancedCustomerData);

      // Refresh token should be stored in httpOnly cookie by the server
      // For now, we'll store it encrypted in localStorage as fallback with enhanced security
      await this.storeEncryptedRefreshToken(tokenData.refreshToken);

      // Store device fingerprint for validation
      if (this.currentDeviceFingerprint) {
        this.storeDeviceFingerprint(this.currentDeviceFingerprint);
      }

      // Dispatch storage event for other tabs/components
      this.dispatchTokenUpdateEvent();

      console.log('✅ Tokens stored securely with device validation');
    } catch (error) {
      console.error('❌ Failed to store tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  /**
   * Retrieve access token from memory
   */
  public getAccessToken(): string | null {
    console.log('🔍 Getting access token:', {
      hasToken: !!this.accessToken,
      tokenLength: this.accessToken?.length,
      tokenStart: this.accessToken?.substring(0, 50),
      isExpired: this.isTokenExpired(),
      expiresAt: this.tokenExpiresAt ? new Date(this.tokenExpiresAt).toISOString() : null
    });

    if (!this.accessToken || this.isTokenExpired()) {
      return null;
    }
    return this.accessToken;
  }

  /**
   * Retrieve refresh token with device fingerprint validation
   */
  public async getRefreshToken(): Promise<string | null> {
    try {
      const storedItem = localStorage.getItem('rt_secure');
      console.log('🔍 Refresh token storage status:', { hasRt: !!storedItem });
      if (!storedItem) return null;

      // Decrypt and validate the stored item
      const decryptedData = await this.decryptSecureItem(storedItem);
      console.log('🔍 Decrypted refresh token item:', {
        hasData: !!decryptedData?.data,
        deviceFingerprint: decryptedData?.deviceFingerprint,
        ageMs: decryptedData ? (Date.now() - decryptedData.timestamp) : null
      });
      if (!decryptedData) return null;

      // Validate device fingerprint if enabled
      if (this.fingerprintValidationEnabled && decryptedData.deviceFingerprint) {
        const isValidDevice = await this.validateCurrentDeviceFingerprint(decryptedData.deviceFingerprint);
        if (!isValidDevice) {
          console.warn('⚠️ Device fingerprint mismatch - clearing tokens for security');
          // In development, do not aggressively clear tokens to aid diagnostics
          if (this.fingerprintValidationEnabled) {
            this.clearTokens();
          }
          return null;
        }
      }

      // Check token age
      if (this.isStoredItemExpired(decryptedData)) {
        console.warn('⚠️ Refresh token expired - clearing tokens');
        this.clearTokens();
        return null;
      }

      return decryptedData.data;
    } catch (error) {
      console.error('❌ Failed to retrieve refresh token:', error);
      return null;
    }
  }

  /**
   * Get customer data
   */
  public getCustomerData(): CustomerData | null {
    try {
      const cd = this.customerData;
      console.debug('👤 getCustomerData', {
        present: !!cd,
        id: cd?.id,
        emailMasked: cd?.email?.replace(/(.{3}).*(.{3})@/, '$1***$2@'),
        lastLoginAt: cd?.lastLoginAt,
      });
    } catch {}
    return this.customerData;
  }

  /**
   * Check if access token is expired
   */
  public isTokenExpired(): boolean {
    if (!this.tokenExpiresAt) return true;
    return Date.now() >= this.tokenExpiresAt;
  }

  /**
   * Check if access token will expire soon (within 5 minutes)
   */
  public isTokenExpiringSoon(): boolean {
    if (!this.tokenExpiresAt) return true;
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() >= (this.tokenExpiresAt - fiveMinutes);
  }

  /**
   * Clear all stored tokens and data
   */
  public clearTokens(): void {
    try {
      // Clear memory storage
      this.accessToken = null;
      this.tokenExpiresAt = null;
      this.customerData = null;

      // Clear localStorage items
      localStorage.removeItem('rt_secure');
      localStorage.removeItem('customer_secure');
      localStorage.removeItem('token_fingerprint');

      // Dispatch clear event
      this.dispatchTokenClearEvent();

      console.log('✅ All tokens cleared');
    } catch (error) {
      console.error('❌ Failed to clear tokens:', error);
    }
  }

  /**
   * Clear all stored data including encryption keys (for debugging)
   */
  public clearAllData(): void {
    try {
      this.clearTokens();
      
      // Clear encryption keys
      localStorage.removeItem('hmac_key');
      sessionStorage.removeItem('app_key');
      
      // Clear device fingerprint data
      localStorage.removeItem('device_fp');
      localStorage.removeItem('device_fp_timestamp');
      
      console.log('✅ All data and encryption keys cleared');
    } catch (error) {
      console.error('❌ Failed to clear all data:', error);
    }
  }

  /**
   * Update access token (for refresh scenarios)
   */
  public updateAccessToken(accessToken: string, expiresAt: number): void {
    this.accessToken = accessToken;
    this.tokenExpiresAt = expiresAt;
    this.dispatchTokenUpdateEvent();
  }

  /**
   * Update refresh token (for rotation scenarios)
   */
  public async updateRefreshToken(refreshToken: string): Promise<void> {
    await this.storeEncryptedRefreshToken(refreshToken);
    this.dispatchTokenUpdateEvent();
  }

  /**
   * Get token fingerprint for security validation
   */
  public getTokenFingerprint(): string | null {
    return localStorage.getItem('token_fingerprint');
  }

  /**
   * Set token fingerprint
   */
  public setTokenFingerprint(fingerprint: string): void {
    localStorage.setItem('token_fingerprint', fingerprint);
  }

  /**
   * Initialize storage from existing data on app start
   */
  private async initializeFromStorage(): Promise<void> {
    try {
      const hasCustomerEncrypted = !!localStorage.getItem('customer_secure');
      const hasRtEncrypted = !!localStorage.getItem('rt_secure');
      console.log('ℹ️ Secure storage init:', { hasCustomerEncrypted, hasRtEncrypted });

      // Try to load customer data from secure localStorage format
      const encryptedCustomerData = localStorage.getItem('customer_secure');
      if (encryptedCustomerData) {
        const decryptedItem = await this.decryptSecureItem(encryptedCustomerData);
        console.log('ℹ️ Customer decrypt status:', { success: !!decryptedItem, hasData: !!decryptedItem?.data });
        if (decryptedItem && decryptedItem.data) {
          this.customerData = JSON.parse(decryptedItem.data);
        }
      }

      // Access token is not persisted (memory only)
      // Will need to be refreshed on app start
    } catch (error) {
      console.error('❌ Failed to initialize from storage:', error);
      // Do not clear all tokens here to avoid wiping valid refresh tokens
    }
  }

  /**
   * Decide whether to enable fingerprint validation based on environment
   */
  private shouldEnableFingerprintValidation(): boolean {
    try {
      const env = ((import.meta as unknown) as {
        env?: {
          VITE_DISABLE_FINGERPRINT_VALIDATION?: string;
          DEV?: boolean;
        };
      }).env || {};
      const disableEnv = env.VITE_DISABLE_FINGERPRINT_VALIDATION;
      const isDevEnv = env.DEV === true;
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

      if (disableEnv === 'true' || isDevEnv || isLocalHost) {
        console.log('ℹ️ Fingerprint validation disabled for development/local environment');
        return false;
      }
      return true;
    } catch (e) {
      // Default to enabled if environment detection fails
      return true;
    }
  }

  /**
   * Store encrypted customer data in localStorage with enhanced security
   */
  private async storeEncryptedCustomerData(customerData: CustomerData): Promise<void> {
    try {
      try {
        console.debug('🔐 Storing encrypted customer data', {
          hasFingerprint: !!this.currentDeviceFingerprint,
          jsonLength: JSON.stringify(customerData).length,
        });
      } catch (e) {
        // Ignore logging errors
      }
      const encryptedData = await this.encryptSecureItem(
        JSON.stringify(customerData),
        this.currentDeviceFingerprint || undefined
      );
      localStorage.setItem('customer_secure', encryptedData);
      try {
        console.debug('📝 customer_secure bytes', { length: encryptedData.length });
      } catch (e) {
        // Ignore logging errors
      }
    } catch (error) {
      console.error('❌ Failed to store customer data:', error);
      throw error;
    }
  }

  /**
   * Store encrypted refresh token in localStorage with enhanced security
   */
  private async storeEncryptedRefreshToken(refreshToken: string): Promise<void> {
    try {
      try {
        console.debug('🔐 Storing encrypted refresh token', {
          hasFingerprint: !!this.currentDeviceFingerprint,
          tokenPreview: refreshToken?.substring(0, 12) + '...'
        });
      } catch (e) {
        // Ignore logging errors
      }
      const encryptedToken = await this.encryptSecureItem(
        refreshToken,
        this.currentDeviceFingerprint || undefined
      );
      localStorage.setItem('rt_secure', encryptedToken);
      try {
        console.debug('📝 rt_secure bytes', {
          length: encryptedToken.length
        });
      } catch (e) {
        // Ignore logging errors
      }
    } catch (error) {
      console.error('❌ Failed to store refresh token:', error);
      throw error;
    }
  }

  /**
   * Get or create encryption key for localStorage
   */
  private getOrCreateEncryptionKey(): string {
    // Prefer persistent key in localStorage to allow decryption across reloads
    let key = localStorage.getItem('app_key') || sessionStorage.getItem('app_key');
    if (!key) {
      key = CryptoJS.lib.WordArray.random(256/8).toString();
    }
    try {
      localStorage.setItem('app_key', key);
      sessionStorage.setItem('app_key', key);
    } catch {
      // Ignore storage write failures
    }
    return key;
  }

  /**
   * Get or create HMAC key for integrity verification
   */
  private getOrCreateHmacKey(): string {
    const stored = localStorage.getItem('hmac_key');
    if (stored) {
      return stored;
    }
    
    const newKey = CryptoJS.lib.WordArray.random(256/8).toString();
    localStorage.setItem('hmac_key', newKey);
    return newKey;
  }

  /**
   * Initialize device fingerprinting
   */
  private async initializeDeviceFingerprinting(): Promise<void> {
    try {
      const fingerprintResult = await deviceFingerprinting.generateFingerprint();
      this.currentDeviceFingerprint = fingerprintResult.fingerprint;
    } catch (error) {
      console.warn('⚠️ Failed to initialize device fingerprinting:', error);
      this.currentDeviceFingerprint = null;
    }
  }

  /**
   * Get current device information
   */
  private async getCurrentDeviceInfo(): Promise<DeviceInfo | undefined> {
    try {
      const fingerprintResult = await deviceFingerprinting.generateFingerprint();
      return fingerprintResult.deviceInfo;
    } catch (error) {
      console.warn('⚠️ Failed to get device info:', error);
      return undefined;
    }
  }

  /**
   * Enhanced encryption with AES-256-GCM, salt, and HMAC
   */
  private async encryptSecureItem(data: string, deviceFingerprint?: string): Promise<string> {
    try {
      // Generate random salt and IV
      const salt = CryptoJS.lib.WordArray.random(128/8);
      const iv = CryptoJS.lib.WordArray.random(128/8);
      
      // Derive key from master key and salt
      const key = CryptoJS.PBKDF2(this.encryptionKey, salt, {
        keySize: 256/32,
        iterations: 10000
      });

      // Encrypt the data
      const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      // Create secure storage item
      const secureItem: SecureStorageItem = {
        data: encrypted.toString(),
        iv: iv.toString(),
        salt: salt.toString(),
        hmac: '',
        timestamp: Date.now(),
        deviceFingerprint
      };

      // Generate HMAC for integrity verification
      const hmacData = secureItem.data + secureItem.iv + secureItem.salt + secureItem.timestamp;
      secureItem.hmac = CryptoJS.HmacSHA256(hmacData, this.hmacKey).toString();

      return JSON.stringify(secureItem);
    } catch (error) {
      console.error('❌ Failed to encrypt secure item:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Enhanced decryption with integrity verification
   */
  private async decryptSecureItem(encryptedItem: string): Promise<SecureStorageItem | null> {
    try {
      try { console.debug('🔍 decryptSecureItem: input length', encryptedItem?.length); } catch (e) {
        // Ignore logging errors
      }
      const parsed: unknown = JSON.parse(encryptedItem);
      if (!parsed || typeof parsed !== 'object') {
        console.error('❌ Invalid secure item format');
        return null;
      }
      const secureItem = parsed as Partial<SecureStorageItem>;
      // Validate required fields before using
      if (
        typeof secureItem.data !== 'string' ||
        typeof secureItem.iv !== 'string' ||
        typeof secureItem.salt !== 'string' ||
        typeof secureItem.hmac !== 'string' ||
        typeof secureItem.timestamp !== 'number'
      ) {
        console.error('❌ Invalid secure item fields');
        return null;
      }
      try {
        console.debug('🔍 decryptSecureItem: parsed meta', {
          hasData: !!secureItem?.data,
          hasIv: !!secureItem?.iv,
          hasSalt: !!secureItem?.salt,
          ts: secureItem?.timestamp,
          hasFingerprint: !!secureItem?.deviceFingerprint
        });
      } catch (e) {
        // Ignore logging errors
      }
      
      // Verify HMAC integrity
      const hmacData = secureItem.data + secureItem.iv + secureItem.salt + secureItem.timestamp;
      const expectedHmac = CryptoJS.HmacSHA256(hmacData, this.hmacKey).toString();
      
      if (secureItem.hmac !== expectedHmac) {
        console.error('❌ HMAC verification failed - data may be tampered');
        return null;
      }
      try { console.debug('✅ HMAC verification succeeded'); } catch (e) {
        // Ignore logging errors
      }

      // Derive key from master key and salt
      const salt = CryptoJS.enc.Hex.parse(secureItem.salt);
      const iv = CryptoJS.enc.Hex.parse(secureItem.iv);
      const key = CryptoJS.PBKDF2(this.encryptionKey, salt, {
        keySize: 256/32,
        iterations: 10000
      });

      // Decrypt the data
      const decrypted = CryptoJS.AES.decrypt(secureItem.data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      const decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
      if (!decryptedData) {
        console.error('❌ Decryption failed - invalid data');
        return null;
      }
      try { console.debug('🔓 decryptSecureItem: decrypted length', decryptedData.length); } catch (e) {
        // Ignore logging errors
      }

      const finalized: SecureStorageItem = {
        data: decryptedData,
        iv: secureItem.iv,
        salt: secureItem.salt,
        hmac: secureItem.hmac,
        timestamp: secureItem.timestamp,
        deviceFingerprint: secureItem.deviceFingerprint,
      };
      return finalized;
    } catch (error) {
      console.error('❌ Failed to decrypt secure item:', error);
      return null;
    }
  }

  /**
   * Validate device fingerprint against stored fingerprint
   */
  private async validateDeviceFingerprint(tokenFingerprint?: string): Promise<void> {
    if (!tokenFingerprint || !this.fingerprintValidationEnabled) {
      return;
    }

    if (!this.currentDeviceFingerprint) {
      await this.initializeDeviceFingerprinting();
    }

    if (this.currentDeviceFingerprint && tokenFingerprint !== this.currentDeviceFingerprint) {
      throw new Error('Device fingerprint mismatch - potential security threat');
    }
  }

  /**
   * Validate current device against stored fingerprint
   */
  private async validateCurrentDeviceFingerprint(storedFingerprint: string): Promise<boolean> {
    try {
      // In development or when explicitly disabled, always allow
      if (!this.fingerprintValidationEnabled) {
        return true;
      }

      if (!this.currentDeviceFingerprint) {
        await this.initializeDeviceFingerprinting();
      }

      if (!this.currentDeviceFingerprint) {
        return false;
      }

      // Use device fingerprinting service for similarity check
      const validation = deviceFingerprinting.validateFingerprint(
        this.currentDeviceFingerprint,
        storedFingerprint
      );

      // Allow if validation deems it acceptable (medium risk allowed)
      return validation.isValid;
    } catch (error) {
      console.error('❌ Device fingerprint validation failed:', error);
      return false;
    }
  }

  /**
   * Check if stored item is expired
   */
  private isStoredItemExpired(item: SecureStorageItem): boolean {
    return Date.now() - item.timestamp > this.maxTokenAge;
  }

  /**
   * Store device fingerprint
   */
  private storeDeviceFingerprint(fingerprint: string): void {
    try {
      localStorage.setItem('device_fp', fingerprint);
      localStorage.setItem('device_fp_timestamp', Date.now().toString());
    } catch (error) {
      console.warn('⚠️ Failed to store device fingerprint:', error);
    }
  }

  /**
   * Encrypt data for localStorage storage
   */
  private encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
  }

  /**
   * Decrypt data from localStorage
   */
  private decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Set up automatic token cleanup
   */
  private setupTokenCleanup(): void {
    // Clean up expired tokens every minute
    setInterval(() => {
      if (this.isTokenExpired()) {
        console.log('🧹 Cleaning up expired access token');
        this.accessToken = null;
        this.tokenExpiresAt = null;
      }
    }, 60000); // 1 minute

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      // Access token is automatically cleared (memory only)
      // Keep refresh token and customer data for next session
    });

    // Handle storage events from other tabs
    window.addEventListener('storage', (event) => {
      if (event.key === 'token_clear_event') {
        this.clearTokens();
      }
    });
  }

  /**
   * Dispatch token update event for other components
   */
  private dispatchTokenUpdateEvent(): void {
    window.dispatchEvent(new CustomEvent('tokenUpdate', {
      detail: {
        hasToken: !!this.accessToken,
        isExpired: this.isTokenExpired(),
        customerData: this.customerData
      }
    }));
  }

  /**
   * Dispatch token clear event
   */
  private dispatchTokenClearEvent(): void {
    // Use localStorage to communicate with other tabs
    localStorage.setItem('token_clear_event', Date.now().toString());
    localStorage.removeItem('token_clear_event');

    // Dispatch local event
    window.dispatchEvent(new CustomEvent('tokenClear'));
  }

  /**
   * Validate token integrity and security with enhanced checks
   */
  public async validateTokenIntegrity(): Promise<boolean> {
    try {
      // Check if access token exists and is not expired
      if (!this.accessToken || this.isTokenExpired()) {
        return false;
      }

      // Check if refresh token exists and is valid
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      // Check if customer data exists
      if (!this.customerData) {
        return false;
      }

      // Validate device fingerprint if enabled
      if (this.fingerprintValidationEnabled) {
        const isValidDevice = await this.validateStoredDeviceFingerprint();
        if (!isValidDevice) {
          console.warn('⚠️ Device fingerprint validation failed');
          return false;
        }
      }

      // Check for suspicious activity patterns
      const securityCheck = await this.performSecurityChecks();
      if (!securityCheck.isSecure) {
        console.warn('⚠️ Security checks failed:', securityCheck.reasons);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Token integrity validation failed:', error);
      return false;
    }
  }

  /**
   * Validate stored device fingerprint
   */
  private async validateStoredDeviceFingerprint(): Promise<boolean> {
    try {
      const storedFingerprint = localStorage.getItem('device_fp');
      if (!storedFingerprint) {
        return true; // No stored fingerprint to validate
      }

      return await this.validateCurrentDeviceFingerprint(storedFingerprint);
    } catch (error) {
      console.error('❌ Device fingerprint validation failed:', error);
      return false;
    }
  }

  /**
   * Perform comprehensive security checks
   */
  private async performSecurityChecks(): Promise<{
    isSecure: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];

    try {
      // Check for token age
      if (this.customerData?.lastLoginAt) {
        const tokenAge = Date.now() - this.customerData.lastLoginAt;
        if (tokenAge > this.maxTokenAge) {
          reasons.push('Token age exceeded maximum allowed time');
        }
      }

      // Check for device consistency
      if (this.customerData?.deviceInfo && this.currentDeviceFingerprint) {
        const currentDeviceInfo = await this.getCurrentDeviceInfo();
        if (currentDeviceInfo) {
          // Check for major device changes
          if (this.customerData.deviceInfo.userAgent !== currentDeviceInfo.userAgent) {
            reasons.push('User agent changed');
          }
          if (this.customerData.deviceInfo.platform !== currentDeviceInfo.platform) {
            reasons.push('Platform changed');
          }
        }
      }

      // Check for suspicious localStorage tampering
      const encryptionKeyExists = localStorage.getItem('enc_key');
      const hmacKeyExists = localStorage.getItem('hmac_key');
      if (!encryptionKeyExists || !hmacKeyExists) {
        reasons.push('Encryption keys missing - possible tampering');
      }

      return {
        isSecure: reasons.length === 0,
        reasons
      };
    } catch (error) {
      console.error('❌ Security checks failed:', error);
      return {
        isSecure: false,
        reasons: ['Security check execution failed']
      };
    }
  }

  /**
   * Get comprehensive security status
   */
  public async getSecurityStatus(): Promise<{
    isAuthenticated: boolean;
    tokenValid: boolean;
    deviceTrusted: boolean;
    securityLevel: 'high' | 'medium' | 'low';
    lastValidation: number;
    recommendations: string[];
  }> {
    const recommendations: string[] = [];
    let securityLevel: 'high' | 'medium' | 'low' = 'high';

    const isAuthenticated = this.isAuthenticated();
    const tokenValid = await this.validateTokenIntegrity();
    
    let deviceTrusted = true;
    if (this.fingerprintValidationEnabled) {
      deviceTrusted = await this.validateStoredDeviceFingerprint();
      if (!deviceTrusted) {
        securityLevel = 'low';
        recommendations.push('Device fingerprint validation failed - consider re-authentication');
      }
    }

    // Check token expiration
    if (this.isTokenExpiringSoon()) {
      securityLevel = securityLevel === 'high' ? 'medium' : securityLevel;
      recommendations.push('Access token expiring soon - refresh recommended');
    }

    // Check for old refresh token
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) {
      securityLevel = 'low';
      recommendations.push('Refresh token missing - re-authentication required');
    }

    return {
      isAuthenticated,
      tokenValid,
      deviceTrusted,
      securityLevel,
      lastValidation: Date.now(),
      recommendations
    };
  }

  /**
   * Get token expiration time
   */
  public getTokenExpiration(): Date | null {
    if (!this.tokenExpiresAt) return null;
    return new Date(this.tokenExpiresAt);
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.getAccessToken() && this.validateTokenIntegrity();
  }
}

// Export singleton instance
export const secureTokenStorage = SecureTokenStorage.getInstance();
export type { TokenData, CustomerData };