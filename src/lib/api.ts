/**
 * SmartSeller API Integration Layer
 * Handles all communication with the SmartSeller platform
 * Enhanced with tenant-aware routing capabilities
 */

import { getApiBaseDomain } from '@/utils/subdomain';
import { tokenRefreshInterceptor } from '@/services/tokenRefreshInterceptor';
import { tenantAwareApiClient, TenantAwareRequestConfig } from './tenantAwareApiClient';
import { tenantResolver } from '@/services/tenantResolver';
import { secureTokenStorage } from '@/services/secureTokenStorage';

// API Configuration
export const API_CONFIG = {
  baseUrl: getApiBaseDomain(),
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
};

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  statusCode?: number;
}

// Request Options
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  requiresAuth?: boolean;
  tenantConfig?: TenantAwareRequestConfig;
}

// Base API Client Class
export class SmartSellerApiClient {
  private baseUrl: string;
  private tenantId: string | null;
  private authToken: string | null = null;
  private useTenantAwareRouting: boolean = true;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    // Use tenant resolver to get current tenant
    const resolution = tenantResolver.resolveTenant();
    this.tenantId = resolution.tenantId;
    this.initializeTenantAwareClient();
    this.setupAuthSync();
  }

  // Initialize tenant-aware client
  private async initializeTenantAwareClient() {
    if (this.useTenantAwareRouting) {
      try {
        await tenantAwareApiClient.setAccessToken(this.authToken);
      } catch (error) {
        console.warn('Failed to initialize tenant-aware client:', error);
        this.useTenantAwareRouting = false;
      }
    }
  }

  // Keep API client auth token in sync with secure storage
  private setupAuthSync(): void {
    try {
      const token = secureTokenStorage.getAccessToken();
      if (token) {
        void this.setAuthToken(token);
      }

      if (typeof window !== 'undefined') {
        window.addEventListener('tokenUpdate', async () => {
          const updated = secureTokenStorage.getAccessToken();
          await this.setAuthToken(updated);
        });
        window.addEventListener('tokenClear', async () => {
          await this.setAuthToken(null);
        });
      }
    } catch (err) {
      console.warn('Auth sync setup failed:', err);
    }
  }

  // Set authentication token
  async setAuthToken(token: string | null) {
    this.authToken = token;
    
    if (this.useTenantAwareRouting) {
      try {
        await tenantAwareApiClient.setAccessToken(token);
      } catch (error) {
        console.warn('Failed to update tenant-aware client token:', error);
      }
    }
  }

  // Enable/disable tenant-aware routing
  setTenantAwareRouting(enabled: boolean) {
    this.useTenantAwareRouting = enabled;
    if (enabled) {
      this.initializeTenantAwareClient();
    }
  }

  // Get tenant-aware base URL
  private getTenantAwareBaseUrl(tenantId?: string): string {
    if (this.useTenantAwareRouting) {
      try {
        return tenantAwareApiClient.getTenantApiUrl(tenantId);
      } catch (error) {
        console.warn('Failed to get tenant-aware URL, falling back to default:', error);
      }
    }
    return this.baseUrl;
  }

  // Get default headers
  private getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.tenantId) {
      headers['X-Tenant-ID'] = this.tenantId;
    }

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  // Make HTTP request with retry logic
  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions & { tenantConfig?: TenantAwareRequestConfig } = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = API_CONFIG.timeout,
      retries = API_CONFIG.retries,
      requiresAuth = false,
      tenantConfig,
    } = options;

    // Attempt to hydrate token from secure storage just-in-time
    if (requiresAuth && !this.authToken) {
      const storedToken = secureTokenStorage.getAccessToken();
      if (storedToken) {
        await this.setAuthToken(storedToken);
      }
    }

    // Check authentication if required
    if (requiresAuth && !this.authToken) {
      throw new Error('Authentication required');
    }

    // Use tenant-aware base URL if enabled
    const baseUrl = this.useTenantAwareRouting 
      ? this.getTenantAwareBaseUrl(tenantConfig?.tenantId)
      : this.baseUrl;
    
    const url = `${baseUrl}${endpoint}`;
    const requestHeaders = { ...this.getDefaultHeaders(), ...headers };

    // Add tenant-specific headers if using tenant-aware routing
    if (this.useTenantAwareRouting && tenantConfig) {
      if (tenantConfig.tenantId) {
        requestHeaders['X-Tenant-ID'] = tenantConfig.tenantId;
      }
      if (tenantConfig.customHeaders) {
        Object.assign(requestHeaders, tenantConfig.customHeaders);
      }
    }

    // For explicitly public endpoints, ensure we do not attach any Authorization header
    const explicitlyMarkedPublic = Object.prototype.hasOwnProperty.call(options, 'requiresAuth') && !requiresAuth;
    if (explicitlyMarkedPublic) {
      delete requestHeaders['Authorization'];
      // Also remove lowercase variant if present
      // Some code paths may accidentally set 'authorization' (lowercase)
      // Ensure both are stripped for public calls
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (requestHeaders as Record<string, string>)['authorization'];
    }

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    };

    // Avoid unnecessary preflight: remove Content-Type for GET without body
    if (requestOptions.method === 'GET' && !requestOptions.body) {
      const hdrs = requestOptions.headers as Record<string, string>;
      if (hdrs && hdrs['Content-Type']) {
        delete hdrs['Content-Type'];
      }
    }

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await tokenRefreshInterceptor.enhancedFetch(url, {
          ...requestOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();
        return data;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on authentication errors or client errors (4xx)
        if (error instanceof Error) {
          if (error.message.includes('401') || error.message.includes('403')) {
            throw error;
          }
        }

        // Wait before retrying
        if (attempt < retries) {
          await new Promise(resolve => 
            setTimeout(resolve, API_CONFIG.retryDelay * (attempt + 1))
          );
        }
      }
    }

    throw lastError!;
  }

  // Public API methods
  async get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async patch<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Tenant-aware HTTP method shortcuts
  async getTenant<T>(
    endpoint: string, 
    tenantId: string, 
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { 
      ...options, 
      method: 'GET',
      tenantConfig: { tenantId, ...options?.tenantConfig }
    });
  }

  async postTenant<T>(
    endpoint: string, 
    tenantId: string, 
    body?: unknown, 
    options?: Omit<RequestOptions, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { 
      ...options, 
      method: 'POST', 
      body,
      tenantConfig: { tenantId, ...options?.tenantConfig }
    });
  }

  async putTenant<T>(
    endpoint: string, 
    tenantId: string, 
    body?: unknown, 
    options?: Omit<RequestOptions, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { 
      ...options, 
      method: 'PUT', 
      body,
      tenantConfig: { tenantId, ...options?.tenantConfig }
    });
  }

  async patchTenant<T>(
    endpoint: string, 
    tenantId: string, 
    body?: unknown, 
    options?: Omit<RequestOptions, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { 
      ...options, 
      method: 'PATCH', 
      body,
      tenantConfig: { tenantId, ...options?.tenantConfig }
    });
  }

  async deleteTenant<T>(
    endpoint: string, 
    tenantId: string, 
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { 
      ...options, 
      method: 'DELETE',
      tenantConfig: { tenantId, ...options?.tenantConfig }
    });
  }

  // Tenant management methods
  async switchTenant(tenantId: string): Promise<void> {
    this.tenantId = tenantId;
    if (this.useTenantAwareRouting) {
      try {
        await tenantAwareApiClient.switchTenant(tenantId);
      } catch (error) {
        console.warn('Failed to switch tenant in tenant-aware client:', error);
      }
    }
  }

  async validateTenantAccess(tenantId: string): Promise<boolean> {
    if (this.useTenantAwareRouting) {
      try {
        await tenantAwareApiClient.switchTenant(tenantId);
        return await tenantAwareApiClient.validateTenantConfiguration();
      } catch (error) {
        console.warn('Failed to validate tenant access:', error);
        return false;
      }
    }
    return true; // Fallback for non-tenant-aware mode
  }

  getCurrentTenant(): string | null {
    return this.tenantId;
  }
}

// Create singleton instance
export const apiClient = new SmartSellerApiClient();

// Utility function for handling API errors
export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof Error) {
    return {
      code: 'API_ERROR',
      message: error.message,
      details: error,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    details: error,
  };
};

// Helper function to check if response is successful
export const isApiSuccess = <T>(response: ApiResponse<T>): response is ApiResponse<T> & { data: T } => {
  return response.success && response.data !== undefined;
};