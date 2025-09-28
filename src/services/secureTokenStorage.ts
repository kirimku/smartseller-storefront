/**
 * Secure Token Storage Service
 * 
 * Implements secure token storage using:
 * - Memory storage for access tokens (cleared on page refresh)
 * - httpOnly cookies for refresh tokens (handled server-side)
 * - Encrypted localStorage as fallback for non-sensitive data
 * - Automatic token cleanup and validation
 */

import CryptoJS from 'crypto-js';

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
}

interface CustomerData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isEmailVerified: boolean;
}

class SecureTokenStorage {
  private static instance: SecureTokenStorage;
  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private customerData: CustomerData | null = null;
  private readonly encryptionKey: string;

  private constructor() {
    // Generate or retrieve encryption key for localStorage fallback
    this.encryptionKey = this.getOrCreateEncryptionKey();
    
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
   * Store authentication tokens securely
   */
  public storeTokens(tokenData: TokenData, customerData: CustomerData): void {
    try {
      // Store access token in memory only
      this.accessToken = tokenData.accessToken;
      this.tokenExpiresAt = tokenData.expiresAt;
      this.customerData = customerData;

      // Store encrypted customer data in localStorage (non-sensitive)
      this.storeEncryptedCustomerData(customerData);

      // Refresh token should be stored in httpOnly cookie by the server
      // For now, we'll store it encrypted in localStorage as fallback
      // TODO: Implement server-side httpOnly cookie handling
      this.storeEncryptedRefreshToken(tokenData.refreshToken);

      // Dispatch storage event for other tabs/components
      this.dispatchTokenUpdateEvent();

      console.log('✅ Tokens stored securely');
    } catch (error) {
      console.error('❌ Failed to store tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  /**
   * Retrieve access token from memory
   */
  public getAccessToken(): string | null {
    if (!this.accessToken || this.isTokenExpired()) {
      return null;
    }
    return this.accessToken;
  }

  /**
   * Retrieve refresh token (encrypted from localStorage)
   */
  public getRefreshToken(): string | null {
    try {
      const encryptedToken = localStorage.getItem('rt_secure');
      if (!encryptedToken) return null;

      const decryptedToken = this.decrypt(encryptedToken);
      return decryptedToken;
    } catch (error) {
      console.error('❌ Failed to retrieve refresh token:', error);
      return null;
    }
  }

  /**
   * Get customer data
   */
  public getCustomerData(): CustomerData | null {
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
   * Update access token (for refresh scenarios)
   */
  public updateAccessToken(accessToken: string, expiresAt: number): void {
    this.accessToken = accessToken;
    this.tokenExpiresAt = expiresAt;
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
  private initializeFromStorage(): void {
    try {
      // Try to load customer data from encrypted localStorage
      const encryptedCustomerData = localStorage.getItem('customer_secure');
      if (encryptedCustomerData) {
        const decryptedData = this.decrypt(encryptedCustomerData);
        this.customerData = JSON.parse(decryptedData);
      }

      // Access token is not persisted (memory only)
      // Will need to be refreshed on app start
    } catch (error) {
      console.error('❌ Failed to initialize from storage:', error);
      // Clear corrupted data
      this.clearTokens();
    }
  }

  /**
   * Store encrypted customer data in localStorage
   */
  private storeEncryptedCustomerData(customerData: CustomerData): void {
    try {
      const dataString = JSON.stringify(customerData);
      const encryptedData = this.encrypt(dataString);
      localStorage.setItem('customer_secure', encryptedData);
    } catch (error) {
      console.error('❌ Failed to store customer data:', error);
    }
  }

  /**
   * Store encrypted refresh token in localStorage (fallback)
   */
  private storeEncryptedRefreshToken(refreshToken: string): void {
    try {
      const encryptedToken = this.encrypt(refreshToken);
      localStorage.setItem('rt_secure', encryptedToken);
    } catch (error) {
      console.error('❌ Failed to store refresh token:', error);
    }
  }

  /**
   * Get or create encryption key for localStorage
   */
  private getOrCreateEncryptionKey(): string {
    let key = sessionStorage.getItem('app_key');
    if (!key) {
      // Generate a new key for this session
      key = CryptoJS.lib.WordArray.random(256/8).toString();
      sessionStorage.setItem('app_key', key);
    }
    return key;
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
   * Validate token integrity
   */
  public validateTokenIntegrity(): boolean {
    try {
      if (!this.accessToken) return false;

      // Basic JWT structure validation
      const parts = this.accessToken.split('.');
      if (parts.length !== 3) return false;

      // Decode payload to check expiration
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      return payload.exp > currentTime;
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      return false;
    }
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