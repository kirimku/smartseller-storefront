/**
 * Tenant-Aware API Client
 * 
 * Extends the existing API client with tenant resolution capabilities.
 * Automatically routes requests to the appropriate tenant-specific endpoints
 * based on the current tenant context and migration strategy.
 */

import { Configuration } from '@/generated/api/configuration';
import { AuthenticationApi } from '@/generated/api/apis/authentication-api';
import { DefaultApi } from '@/generated/api/apis/default-api';
import { tenantResolver, TenantType } from '@/services/tenantResolver';
import { slugDetectionService } from '@/services/slugDetectionService';


export interface TenantAwareRequestConfig {
  tenantId?: string;
  forceRefresh?: boolean;
  bypassTenantRouting?: boolean;
  customHeaders?: Record<string, string>;
}

export interface TenantApiContext {
  tenantId: string | null;
  tenantType: TenantType;
  apiBaseUrl: string;
  slug: string | null;
  isValid: boolean;
}

/**
 * Tenant-aware API client that automatically handles tenant routing
 */
export class TenantAwareApiClient {
  private authApi: AuthenticationApi | null = null;
  private defaultApi: DefaultApi | null = null;
  private accessToken: string | null = null;
  private currentTenantContext: TenantApiContext | null = null;
  private configurationCache: Map<string, Configuration> = new Map();

  constructor() {
    this.initializeApis();
  }

  /**
   * Initialize API instances with current tenant context
   */
  private async initializeApis(): Promise<void> {
    const context = await this.resolveTenantContext();
    this.currentTenantContext = context;
    
    const config = this.createTenantConfiguration(context);
    this.authApi = new AuthenticationApi(config);
    this.defaultApi = new DefaultApi(config);
  }

  /**
   * Resolve current tenant context
   */
  private async resolveTenantContext(tenantId?: string): Promise<TenantApiContext> {
    const resolvedTenantId = tenantId || tenantResolver.resolveTenant().tenantId;
    
    if (!resolvedTenantId) {
      return {
        tenantId: null,
        tenantType: TenantType.SHARED,
        apiBaseUrl: this.getDefaultApiUrl(),
        slug: null,
        isValid: false,
      };
    }

    try {
      // Get tenant resolution info
      const resolution = tenantResolver.resolveTenant();
      const tenantType = await tenantResolver.getTenantType(resolvedTenantId);
      const apiBaseUrl = tenantResolver.getTenantApiUrl(resolvedTenantId);
      const isValid = await tenantResolver.validateTenantSlug(resolvedTenantId);

      return {
        tenantId: resolvedTenantId,
        tenantType,
        apiBaseUrl,
        slug: resolution.slug,
        isValid,
      };
    } catch (error) {
      console.error('Failed to resolve tenant context:', error);
      return {
        tenantId: resolvedTenantId,
        tenantType: TenantType.SHARED,
        apiBaseUrl: this.getDefaultApiUrl(),
        slug: resolvedTenantId,
        isValid: false,
      };
    }
  }

  /**
   * Create tenant-specific configuration
   */
  private createTenantConfiguration(context: TenantApiContext): Configuration {
    const cacheKey = `${context.tenantId}-${context.tenantType}-${context.apiBaseUrl}`;
    
    if (this.configurationCache.has(cacheKey)) {
      const cachedConfig = this.configurationCache.get(cacheKey)!;
      // Update access token if it has changed
      if (this.accessToken) {
        cachedConfig.accessToken = this.accessToken;
      }
      return cachedConfig;
    }

    const config = new Configuration({
      basePath: context.apiBaseUrl,
      accessToken: this.accessToken || undefined,
      baseOptions: {
        headers: {
          'Content-Type': 'application/json',
          'X-Storefront-Slug': 'rexus',
          'X-Tenant-ID': context.tenantId || '',
          'X-Tenant-Type': context.tenantType,
          'X-Tenant-Slug': context.slug || '',
          ...(this.accessToken && { 'Authorization': `Bearer ${this.accessToken}` }),
        },
      },
    });

    this.configurationCache.set(cacheKey, config);
    return config;
  }

  /**
   * Get default API URL for fallback scenarios
   */
  private getDefaultApiUrl(): string {
    return import.meta.env.VITE_API_BASE_URL || 'https://smartseller-api.preproduction.kirimku.com';
  }

  /**
   * Set access token and refresh API instances
   */
  public async setAccessToken(token: string | null): Promise<void> {
    this.accessToken = token;
    
    // Clear configuration cache to force recreation with new token
    this.configurationCache.clear();
    
    // Reinitialize APIs with new token
    await this.initializeApis();
  }

  /**
   * Switch to a different tenant context
   */
  public async switchTenant(tenantId: string): Promise<void> {
    const newContext = await this.resolveTenantContext(tenantId);
    this.currentTenantContext = newContext;
    
    const config = this.createTenantConfiguration(newContext);
    this.authApi = new AuthenticationApi(config);
    this.defaultApi = new DefaultApi(config);
  }

  /**
   * Get current tenant context
   */
  public getCurrentTenantContext(): TenantApiContext | null {
    return this.currentTenantContext;
  }

  /**
   * Refresh tenant context (useful after tenant configuration changes)
   */
  public async refreshTenantContext(): Promise<void> {
    if (this.currentTenantContext?.tenantId) {
      await this.switchTenant(this.currentTenantContext.tenantId);
    } else {
      await this.initializeApis();
    }
  }

  /**
   * Get authentication API instance
   */
  public getAuthApi(): AuthenticationApi {
    if (!this.authApi) {
      throw new Error('Authentication API not initialized. Call initializeApis() first.');
    }
    return this.authApi;
  }

  /**
   * Get default API instance
   */
  public getDefaultApi(): DefaultApi {
    if (!this.defaultApi) {
      throw new Error('Default API not initialized. Call initializeApis() first.');
    }
    return this.defaultApi;
  }

  /**
   * Execute a request with tenant-aware configuration
   */
  public async executeWithTenantContext<T>(
    apiCall: (api: DefaultApi | AuthenticationApi) => Promise<T>,
    config?: TenantAwareRequestConfig
  ): Promise<T> {
    try {
      // Switch tenant if specified
      if (config?.tenantId && config.tenantId !== this.currentTenantContext?.tenantId) {
        await this.switchTenant(config.tenantId);
      }

      // Refresh context if requested
      if (config?.forceRefresh) {
        await this.refreshTenantContext();
      }

      // Execute the API call
      const api = this.defaultApi || this.authApi;
      if (!api) {
        throw new Error('No API instance available');
      }

      return await apiCall(api);
    } catch (error) {
      console.error('Tenant-aware API call failed:', error);
      throw error;
    }
  }

  /**
   * Validate current tenant configuration
   */
  public async validateTenantConfiguration(): Promise<boolean> {
    if (!this.currentTenantContext) {
      return false;
    }

    try {
      const isValid = await tenantResolver.validateTenantSlug(
        this.currentTenantContext.tenantId || ''
      );
      return isValid && this.currentTenantContext.isValid;
    } catch {
      return false;
    }
  }

  /**
   * Get tenant-specific API URL for external use
   */
  public getTenantApiUrl(tenantId?: string): string {
    if (tenantId) {
      return tenantResolver.getTenantApiUrl(tenantId);
    }
    return this.currentTenantContext?.apiBaseUrl || this.getDefaultApiUrl();
  }

  /**
   * Clear all caches and reset to initial state
   */
  public reset(): void {
    this.configurationCache.clear();
    this.currentTenantContext = null;
    this.authApi = null;
    this.defaultApi = null;
    this.accessToken = null;
  }
}

// Create and export singleton instance
export const tenantAwareApiClient = new TenantAwareApiClient();

// Export for backward compatibility and specific use cases
export default tenantAwareApiClient;