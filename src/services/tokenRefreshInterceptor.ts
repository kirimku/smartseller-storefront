/**
 * Token Refresh Interceptor
 * 
 * Automatically handles token refresh for API requests:
 * - Intercepts 401 responses
 * - Refreshes tokens automatically
 * - Retries failed requests with new tokens
 * - Handles concurrent requests during refresh
 * - Manages request queuing
 */

import { jwtTokenManager } from './jwtTokenManager';
import { secureTokenStorage } from './secureTokenStorage';
import { csrfService } from '@/services/csrfService';

interface QueuedRequest {
  resolve: (value: Response) => void;
  reject: (reason: Error) => void;
  url: string;
  options: RequestInit;
}

interface InterceptorConfig {
  baseURL: string;
  maxRetries: number;
  retryDelay: number;
  excludeEndpoints: string[];
}

class TokenRefreshInterceptor {
  private static instance: TokenRefreshInterceptor;
  private isRefreshing = false;
  private requestQueue: QueuedRequest[] = [];
  private config: InterceptorConfig;
  private originalFetch: typeof fetch;

  private constructor(config: Partial<InterceptorConfig> = {}) {
    this.config = {
      baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api-seller.kirimku.app',
      maxRetries: 3,
      retryDelay: 1000,
      // Exclude auth endpoints from interception to avoid header overrides
      excludeEndpoints: [
        '/api/v1/auth/login',
        '/api/v1/auth/register',
        '/api/v1/auth/refresh',
        '/api/v1/csrf-token',
        // Storefront-scoped auth endpoints
        '/auth/login',
        '/auth/register',
        '/auth/refresh',
        // Tenant endpoints are public; skip interception to avoid noise in dev
        '/api/tenants'
      ],
      ...config
    };

    // Bind native fetch to window to avoid Illegal invocation on call
    this.originalFetch = window.fetch.bind(window);
    this.setupInterceptor();
  }

  public static getInstance(config?: Partial<InterceptorConfig>): TokenRefreshInterceptor {
    if (!TokenRefreshInterceptor.instance) {
      TokenRefreshInterceptor.instance = new TokenRefreshInterceptor(config);
    }
    return TokenRefreshInterceptor.instance;
  }

  /**
   * Setup the fetch interceptor
   */
  private setupInterceptor(): void {
    window.fetch = this.interceptedFetch.bind(this);
  }

  /**
   * Restore original fetch
   */
  public restore(): void {
    window.fetch = this.originalFetch;
  }

  /**
   * Intercepted fetch function
   */
  private async interceptedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input.toString();
    const options = { ...init };
    const skipByHeader = this.shouldSkipByHeader(options);

    // Skip interception when explicitly requested via header or for excluded endpoints
    if (skipByHeader || this.shouldSkipInterception(url)) {
      return this.originalFetch(input, options);
    }

    // Ensure cookies included for CSRF/refresh flows
    try {
      if (!options.credentials) {
        options.credentials = 'include';
      }
    } catch (_) {}

    // Bootstrap CSRF and inject header for unsafe methods
    try {
      await csrfService.bootstrapIfNeeded();
      const hdrs = (options.headers as Record<string, string>) || {};
      options.headers = csrfService.injectCsrfHeader(hdrs, options.method);
    } catch (_) {
      // non-blocking
    }

    // Add authorization header if token exists
    await this.addAuthorizationHeader(options, url);

    try {
      let response = await this.originalFetch(input, options);

      // Handle 401 responses: attempt refresh when auth was present OR a refresh token exists
      if (response.status === 401 && !this.shouldSkipInterception(url)) {
        const hadAuthHeader = this.hasAuthorizationHeader(options);
        const hasRefreshToken = await this.hasRefreshTokenAvailable();
        if (hadAuthHeader || hasRefreshToken) {
          console.log('🔄 401 detected, attempting token refresh');
          const refreshed = await this.handleTokenRefresh();
          if (refreshed) {
            // Update authorization header with new token and retry
            await this.addAuthorizationHeader(options, url);
            response = await this.originalFetch(input, options);
          }
        }
      }

      return response;
    } catch (error) {
      console.error('❌ Intercepted fetch error:', error);
      throw error;
    }
  }

  /**
   * Check if request should skip interception
   */
  private shouldSkipInterception(url: string): boolean {
    return this.config.excludeEndpoints.some(endpoint => url.includes(endpoint));
  }

  /**
   * Add authorization header and storefront slug to request
   */
  private async addAuthorizationHeader(options: RequestInit, url?: string): Promise<void> {
    const accessToken = secureTokenStorage.getAccessToken();
    const existingHeaders = (options.headers as Record<string, string>) || {};
    const hasAuthHeader = 'Authorization' in existingHeaders || 'authorization' in existingHeaders;

    // Always add X-Storefront-Slug header
    const baseHeaders = {
      ...existingHeaders,
      'X-Storefront-Slug': 'rexus'
    };

    // If the request already has Authorization, normalize and update it
    if (hasAuthHeader) {
      const normalizedHeaders = { ...baseHeaders };
      if ('authorization' in normalizedHeaders) {
        delete (normalizedHeaders as Record<string, string>)['authorization'];
      }
      if (accessToken) {
        normalizedHeaders['Authorization'] = `Bearer ${accessToken}`;
      }
      options.headers = normalizedHeaders;
      return;
    }

    // Inject Authorization for non-excluded endpoints when token exists
    const isExcluded = url ? this.shouldSkipInterception(url) : false;
    if (accessToken && !isExcluded) {
      options.headers = {
        ...baseHeaders,
        Authorization: `Bearer ${accessToken}`
      };
      return;
    }

    // Leave headers with storefront slug for excluded endpoints
    options.headers = baseHeaders;
  }

  /**
   * Check if request has authorization header
   */
  private hasAuthorizationHeader(options: RequestInit): boolean {
    const headers = options.headers as Record<string, string> || {};
    return 'Authorization' in headers || 'authorization' in headers;
  }

  /**
   * Check if request explicitly opts out of interception via header
   */
  private shouldSkipByHeader(options?: RequestInit): boolean {
    try {
      const headers = (options?.headers as Record<string, string>) || {};
      const flag = headers['X-Skip-Intercept'] || headers['x-skip-intercept'];
      return !!flag;
    } catch {
      return false;
    }
  }

  /**
   * Check if a refresh token is available in secure storage
   */
  private async hasRefreshTokenAvailable(): Promise<boolean> {
    try {
      const rt = await secureTokenStorage.getRefreshToken();
      return !!rt;
    } catch {
      return false;
    }
  }

  /**
   * Handle token refresh with request queuing
   */
  private async handleTokenRefresh(): Promise<boolean> {
    // If already refreshing, queue this request
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push({
          resolve: () => resolve(true),
          reject: (error) => reject(error),
          url: '',
          options: {}
        });
      });
    }

    this.isRefreshing = true;

    try {
      console.log('🔄 Starting token refresh process...');
      const refreshed = await jwtTokenManager.refreshToken();

      if (refreshed) {
        console.log('✅ Token refresh successful, processing queued requests...');
        this.processQueuedRequests(true);
        return true;
      } else {
        console.log('❌ Token refresh failed');
        this.processQueuedRequests(false);
        return false;
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      this.processQueuedRequests(false);
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Process queued requests after refresh attempt
   */
  private processQueuedRequests(success: boolean): void {
    const queue = [...this.requestQueue];
    this.requestQueue = [];

    queue.forEach(({ resolve, reject }) => {
      if (success) {
        resolve(new Response());
      } else {
        reject(new Error('Token refresh failed'));
      }
    });
  }

  /**
   * Enhanced fetch with automatic retry logic
   */
  public async enhancedFetch(
    input: RequestInfo | URL, 
    init?: RequestInit,
    retries = this.config.maxRetries
  ): Promise<Response> {
    try {
      const response = await this.interceptedFetch(input, init);
      
      // If still getting 401 after refresh, don't retry
      if (response.status === 401) {
        throw new Error('Authentication failed after token refresh');
      }
      
      return response;
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        console.log(`🔄 Retrying request, ${retries} attempts remaining...`);
        await this.delay(this.config.retryDelay);
        return this.enhancedFetch(input, init, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      // Network errors are retryable
      return error.message.includes('fetch') || 
             error.message.includes('network') ||
             error.message.includes('timeout');
    }
    return false;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get interceptor status
   */
  public getStatus(): {
    isRefreshing: boolean;
    queueLength: number;
    isActive: boolean;
  } {
    return {
      isRefreshing: this.isRefreshing,
      queueLength: this.requestQueue.length,
      isActive: window.fetch === this.interceptedFetch
    };
  }

  /**
   * Clear request queue
   */
  public clearQueue(): void {
    this.requestQueue.forEach(({ reject }) => {
      reject(new Error('Request queue cleared'));
    });
    this.requestQueue = [];
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<InterceptorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Axios-style interceptor for compatibility
 */
class AxiosStyleInterceptor {
  private tokenInterceptor: TokenRefreshInterceptor;

  constructor() {
    this.tokenInterceptor = TokenRefreshInterceptor.getInstance();
  }

  /**
   * Request interceptor
   */
  public async requestInterceptor(config: RequestInit & { url?: string }): Promise<RequestInit & { url?: string }> {
    // Add authorization header and storefront slug
    const accessToken = secureTokenStorage.getAccessToken();
    const currentHeaders = (config.headers as Record<string, string>) || {};
    const hasAuthHeader = 'Authorization' in currentHeaders || 'authorization' in currentHeaders;

    // Always add X-Storefront-Slug header
    config.headers = {
      ...currentHeaders,
      'X-Storefront-Slug': 'rexus',
    };

    if (accessToken && config.url && !this.isExcludedEndpoint(config.url) && !hasAuthHeader) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${accessToken}`
      };
    }

    return config;
  }

  /**
   * Response interceptor
   */
  public async responseInterceptor(response: Response, originalRequest: RequestInit & { url?: string }): Promise<Response> {
    // Handle 401 responses
    if (response.status === 401 && originalRequest.url && !this.isExcludedEndpoint(originalRequest.url)) {
      // Avoid redundant refresh if a refresh is in progress elsewhere
      const refreshed = await jwtTokenManager.refreshToken();
      
      if (refreshed && originalRequest.url) {
        // Retry original request with new token
        const newConfig = await this.requestInterceptor(originalRequest);
        return fetch(originalRequest.url, newConfig);
      }
    }

    return response;
  }

  private isExcludedEndpoint(url: string): boolean {
    const excludeEndpoints = [
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/auth/refresh',
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/api/tenants'
    ];
    return excludeEndpoints.some(endpoint => url.includes(endpoint));
  }
}

// Export instances
export const tokenRefreshInterceptor = TokenRefreshInterceptor.getInstance();
export const axiosStyleInterceptor = new AxiosStyleInterceptor();

// Export types
export type { InterceptorConfig, QueuedRequest };