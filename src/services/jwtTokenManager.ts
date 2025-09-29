/**
 * JWT Token Manager Service
 * 
 * Handles JWT token lifecycle management including:
 * - Token validation and parsing
 * - Automatic token refresh with rotation
 * - Token expiration monitoring
 * - Secure token storage integration
 * - Event-driven token updates
 */

import { jwtVerify, decodeJwt, JWTPayload } from 'jose';
import { secureTokenStorage } from './secureTokenStorage';
import { deviceFingerprinting } from '../utils/deviceFingerprint';

// Token-related interfaces
interface TokenData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: number;
}

interface JWTClaims extends JWTPayload {
  sub: string;
  email?: string;
  role?: string;
  permissions?: string[];
  device_id?: string;
  session_id?: string;
}

interface TokenRefreshResponse {
  success: boolean;
  data?: {
    access_token: string;
    refresh_token: string;
    token_expiry: string;
  };
  message?: string;
}

interface TokenValidationResult {
  isValid: boolean;
  isExpired: boolean;
  needsRefresh: boolean;
  claims?: JWTClaims;
  timeToExpiry?: number;
}

// Token refresh event types
type TokenEventType = 'token_refreshed' | 'token_expired' | 'refresh_failed' | 'token_rotated';

interface TokenEvent {
  type: TokenEventType;
  timestamp: number;
  data?: Record<string, unknown>;
}

class JWTTokenManager {
  private static instance: JWTTokenManager;
  private refreshPromise: Promise<boolean> | null = null;
  private isRefreshing = false;
  private refreshBuffer = 5 * 60 * 1000; // 5 minutes before expiry
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second
  private eventListeners: Map<TokenEventType, Array<(event: TokenEvent) => void>> = new Map();
  private refreshTimer: NodeJS.Timeout | null = null;
  private baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  private constructor() {
    this.initializeEventListeners();
    this.startTokenMonitoring();
  }

  public static getInstance(): JWTTokenManager {
    if (!JWTTokenManager.instance) {
      JWTTokenManager.instance = new JWTTokenManager();
    }
    return JWTTokenManager.instance;
  }

  /**
   * Initialize event listeners for token management
   */
  private initializeEventListeners(): void {
    // Listen for storage events to sync across tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange.bind(this));
      window.addEventListener('beforeunload', this.cleanup.bind(this));
    }
  }

  /**
   * Handle storage changes from other tabs
   */
  private handleStorageChange(event: StorageEvent): void {
    if (event.key === 'secure_tokens_updated') {
      // Token was updated in another tab, refresh our local state
      this.validateAndRefreshIfNeeded();
    }
  }

  /**
   * Start automatic token monitoring
   */
  private startTokenMonitoring(): void {
    // Check token status every minute
    this.refreshTimer = setInterval(() => {
      this.validateAndRefreshIfNeeded();
    }, 60 * 1000);
  }

  /**
   * Stop token monitoring
   */
  private stopTokenMonitoring(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Validate current token and refresh if needed
   */
  public async validateAndRefreshIfNeeded(): Promise<boolean> {
    try {
      // Check if we have any token first to avoid unnecessary validation
      const hasToken = !!secureTokenStorage.getAccessToken();
      if (!hasToken) {
        // No token available - user is not authenticated, this is normal
        return false;
      }

      const validation = await this.validateCurrentToken();
      
      if (!validation.isValid) {
        // Only emit token_expired event if we actually had a token that became invalid
        if (hasToken) {
          this.emitEvent('token_expired', { validation });
        }
        return false;
      }

      if (validation.needsRefresh && !this.isRefreshing) {
        console.log('🔄 Token needs refresh, initiating automatic refresh...');
        return await this.refreshToken();
      }

      return true;
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      return false;
    }
  }

  /**
   * Validate the current access token
   */
  public async validateCurrentToken(): Promise<TokenValidationResult> {
    try {
      const accessToken = secureTokenStorage.getAccessToken();
      
      if (!accessToken) {
        // No token available - this is normal for unauthenticated users
        return {
          isValid: false,
          isExpired: true,
          needsRefresh: true
        };
      }

      return await this.validateToken(accessToken);
    } catch (error) {
      console.error('❌ Current token validation failed:', error);
      // Clear any corrupted data
      await this.clearCorruptedTokenData();
      return {
        isValid: false,
        isExpired: true,
        needsRefresh: true
      };
    }
  }

  /**
   * Validate a specific JWT token
   */
  public async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      // Check if token exists and has basic JWT structure
      if (!token || typeof token !== 'string') {
        console.warn('⚠️ Invalid token: Token is null, undefined, or not a string');
        return {
          isValid: false,
          isExpired: true,
          needsRefresh: true
        };
      }

      // Check JWT structure (should have 3 parts separated by dots)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.warn('⚠️ Invalid token: Token does not have valid JWT structure (3 parts)');
        // Clear corrupted token data
        await this.clearCorruptedTokenData();
        return {
          isValid: false,
          isExpired: true,
          needsRefresh: true
        };
      }

      // Decode without verification first to check structure
      const claims = decodeJwt(token) as JWTClaims;
      const currentTime = Math.floor(Date.now() / 1000);
      const timeToExpiry = (claims.exp || 0) - currentTime;
      
      const isExpired = timeToExpiry <= 0;
      const needsRefresh = timeToExpiry <= (this.refreshBuffer / 1000);

      // Additional security validations
      const deviceValidation = await this.validateTokenDevice(claims);
      
      return {
        isValid: !isExpired && deviceValidation,
        isExpired,
        needsRefresh,
        claims,
        timeToExpiry: Math.max(0, timeToExpiry)
      };
    } catch (error) {
      console.error('❌ Token validation error:', error);
      // Clear corrupted token data when validation fails
      await this.clearCorruptedTokenData();
      return {
        isValid: false,
        isExpired: true,
        needsRefresh: true
      };
    }
  }

  /**
   * Clear corrupted token data
   */
  private async clearCorruptedTokenData(): Promise<void> {
    try {
      console.log('🧹 Clearing corrupted token data...');
      await secureTokenStorage.clearTokens();
      // Stop monitoring to prevent repeated validation attempts
      this.stopTokenMonitoring();
      console.log('✅ Corrupted token data cleared');
    } catch (error) {
      console.error('❌ Failed to clear corrupted token data:', error);
    }
  }

  /**
   * Validate token device information
   */
  private async validateTokenDevice(claims: JWTClaims): Promise<boolean> {
    try {
      if (!claims.device_id) {
        return true; // No device validation required
      }

      const currentDevice = await deviceFingerprinting.generateFingerprint();
      const storedFingerprint = deviceFingerprinting.getStoredFingerprint();
      
      if (storedFingerprint) {
        const validation = deviceFingerprinting.validateFingerprint(
          currentDevice.fingerprint,
          storedFingerprint
        );
        return validation.riskLevel !== 'high';
      }

      return true;
    } catch (error) {
      console.error('❌ Device validation failed:', error);
      return false;
    }
  }

  /**
   * Refresh the access token using refresh token
   */
  public async refreshToken(): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      return await this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh with retry logic
   */
  private async performTokenRefresh(): Promise<boolean> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Token refresh attempt ${attempt}/${this.maxRetries}`);
        
        const refreshToken = secureTokenStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Validate device before refresh
        const deviceValidation = await deviceFingerprinting.validateDeviceForAuth();
        if (deviceValidation.riskLevel === 'high') {
          throw new Error('Device validation failed - high risk detected');
        }

        const response = await this.callRefreshEndpoint(refreshToken);
        
        if (response.success && response.data) {
          await this.handleSuccessfulRefresh(response.data);
          this.emitEvent('token_refreshed', { 
            attempt, 
            deviceValidation,
            rotated: response.data.refresh_token !== refreshToken
          });
          return true;
        } else {
          throw new Error(response.message || 'Token refresh failed');
        }
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Token refresh attempt ${attempt} failed:`, error);
        
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    // All attempts failed
    console.error('❌ All token refresh attempts failed:', lastError);
    this.emitEvent('refresh_failed', { error: lastError?.message, attempts: this.maxRetries });
    await this.handleRefreshFailure();
    return false;
  }

  /**
   * Call the refresh token endpoint
   */
  private async callRefreshEndpoint(refreshToken: string): Promise<TokenRefreshResponse> {
    const response = await fetch(`${this.baseURL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Handle successful token refresh
   */
  private async handleSuccessfulRefresh(data: TokenRefreshResponse['data']): Promise<void> {
    if (!data) return;

    const tokenData: TokenData = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: 'Bearer',
      expiresIn: 3600, // Default 1 hour
      expiresAt: new Date(data.token_expiry).getTime()
    };

    // Store the new tokens securely
    await secureTokenStorage.storeTokens(tokenData, null);

    // Notify other tabs about token update
    if (typeof window !== 'undefined') {
      localStorage.setItem('secure_tokens_updated', Date.now().toString());
      localStorage.removeItem('secure_tokens_updated');
    }

    console.log('✅ Token refreshed successfully');
  }

  /**
   * Handle refresh failure
   */
  private async handleRefreshFailure(): Promise<void> {
    // Clear all tokens and redirect to login
    await secureTokenStorage.clearTokens();
    deviceFingerprinting.clearStoredFingerprint();
    
    // Emit logout event for app to handle
    this.emitEvent('token_expired', { reason: 'refresh_failed' });
  }

  /**
   * Get token expiration info
   */
  public async getTokenExpirationInfo(): Promise<{
    isValid: boolean;
    expiresAt?: Date;
    timeToExpiry?: number;
    needsRefresh: boolean;
  }> {
    const validation = await this.validateCurrentToken();
    
    return {
      isValid: validation.isValid,
      expiresAt: validation.claims?.exp ? new Date(validation.claims.exp * 1000) : undefined,
      timeToExpiry: validation.timeToExpiry,
      needsRefresh: validation.needsRefresh
    };
  }

  /**
   * Force token refresh
   */
  public async forceRefresh(): Promise<boolean> {
    this.isRefreshing = false; // Reset flag to allow forced refresh
    return await this.refreshToken();
  }

  /**
   * Get current token claims
   */
  public getCurrentTokenClaims(): JWTClaims | null {
    try {
      const accessToken = secureTokenStorage.getAccessToken();
      if (!accessToken) return null;
      
      return decodeJwt(accessToken) as JWTClaims;
    } catch (error) {
      console.error('❌ Failed to decode token claims:', error);
      return null;
    }
  }

  /**
   * Check if user has specific permission
   */
  public hasPermission(permission: string): boolean {
    const claims = this.getCurrentTokenClaims();
    return claims?.permissions?.includes(permission) || false;
  }

  /**
   * Check if user has specific role
   */
  public hasRole(role: string): boolean {
    const claims = this.getCurrentTokenClaims();
    return claims?.role === role;
  }

  /**
   * Event management
   */
  public addEventListener(type: TokenEventType, listener: (event: TokenEvent) => void): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  public removeEventListener(type: TokenEventType, listener: (event: TokenEvent) => void): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(type: TokenEventType, data?: Record<string, unknown>): void {
    const event: TokenEvent = {
      type,
      timestamp: Date.now(),
      data
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`❌ Token event listener error for ${type}:`, error);
        }
      });
    }
  }

  /**
   * Utility methods
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stopTokenMonitoring();
    this.eventListeners.clear();
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageChange.bind(this));
      window.removeEventListener('beforeunload', this.cleanup.bind(this));
    }
  }

  /**
   * Get manager status for debugging
   */
  public getStatus(): {
    isRefreshing: boolean;
    hasRefreshTimer: boolean;
    eventListenerCount: number;
    tokenValid: boolean;
  } {
    return {
      isRefreshing: this.isRefreshing,
      hasRefreshTimer: this.refreshTimer !== null,
      eventListenerCount: Array.from(this.eventListeners.values()).reduce((sum, listeners) => sum + listeners.length, 0),
      tokenValid: !!secureTokenStorage.getAccessToken()
    };
  }
}

// Export singleton instance
export const jwtTokenManager = JWTTokenManager.getInstance();

// Export types
export type {
  TokenData,
  JWTClaims,
  TokenValidationResult,
  TokenEvent,
  TokenEventType
};