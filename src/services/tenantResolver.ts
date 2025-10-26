/**
 * Tenant Resolver Service
 * 
 * Implements the tenant resolution pattern from the multi-tenant migration strategy.
 * This service handles tenant detection from slugs (subdomains) and provides
 * backend-compatible tenant resolution for API routing.
 */

import { TenantConfig } from '@/types/tenant';

export interface TenantResolutionInfo {
  tenantId: string | null;
  slug: string | null;
  domain: string;
  subdomain: string | null;
  isLocalhost: boolean;
  detectionMethod: 'subdomain' | 'query_param' | 'path' | 'none';
  apiBaseUrl: string;
}

export interface TenantResolverConfig {
  defaultTenant?: string;
  apiBaseDomain: string;
  enablePathBasedRouting: boolean;
  enableQueryParamFallback: boolean;
  productionDomains: string[];
  developmentMode: boolean;
}

export interface TenantDatabaseResolver {
  /**
   * Resolve tenant information from current URL/context
   */
  resolveTenant(): TenantResolutionInfo;
  
  /**
   * Get tenant configuration by slug/subdomain
   */
  getTenantBySlug(slug: string): Promise<TenantConfig | null>;
  
  /**
   * Validate if a tenant slug is valid
   */
  validateTenantSlug(slug: string): Promise<boolean>;
  
  /**
   * Get API base URL for a specific tenant
   */
  getTenantApiUrl(tenantId: string): string;
  
  /**
   * Get tenant type for future migration compatibility
   */
  getTenantType(tenantId: string): Promise<TenantType>;
}

export enum TenantType {
  SHARED = 'shared',      // Current: Row-level isolation
  SCHEMA = 'schema',      // Future: Schema per tenant  
  DATABASE = 'database'   // Future: Database per tenant
}

export class TenantResolver implements TenantDatabaseResolver {
  private config: TenantResolverConfig;
  private cache: Map<string, TenantConfig> = new Map();
  private typeCache: Map<string, TenantType> = new Map();

  constructor(config: TenantResolverConfig) {
    this.config = config;
  }

  /**
   * Resolve tenant information from current URL/context
   */
  resolveTenant(): TenantResolutionInfo {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    
    const isLocalhost = this.isLocalhostEnvironment(hostname);
    const domain = this.extractDomain(hostname);
    
    // Hardcode tenant slug to "rexus" - can be overridden by environment variable
    const Tenant = import.meta.env.VITE_TENANT_SLUG || 'rexus';
    let tenantId: string | null = Tenant;
    let slug: string | null = Tenant;
    let subdomain: string | null = null;
    let detectionMethod: TenantResolutionInfo['detectionMethod'] = 'none';

    // Tenant is hardcoded to "rexus" - detection methods are disabled
    // Uncomment the methods below if you want to re-enable dynamic tenant detection
    
    /*
    // Method 1: Subdomain detection (primary method)
    if (!isLocalhost) {
      const subdomainInfo = this.extractSubdomain(hostname);
      if (subdomainInfo) {
        subdomain = subdomainInfo;
        slug = subdomainInfo;
        tenantId = subdomainInfo;
        detectionMethod = 'subdomain';
      }
    }

    // Method 2: Query parameter fallback (development & testing)
    if (!tenantId && this.config.enableQueryParamFallback) {
      const queryTenant = searchParams.get('tenant') || searchParams.get('slug');
      if (queryTenant) {
        tenantId = queryTenant;
        slug = queryTenant;
        detectionMethod = 'query_param';
      }
    }

    // Method 3: Path-based routing (if enabled)
    if (!tenantId && this.config.enablePathBasedRouting) {
      const pathTenant = this.extractTenantFromPath(pathname);
      if (pathTenant) {
        tenantId = pathTenant;
        slug = pathTenant;
        detectionMethod = 'path';
      }
    }

    // Method 4: Default tenant fallback
    if (!tenantId && this.config.defaultTenant) {
      tenantId = this.config.defaultTenant;
      slug = this.config.defaultTenant;
      detectionMethod = 'none'; // No detection method used, using default
    }
    */

    return {
      tenantId,
      slug,
      domain,
      subdomain,
      isLocalhost,
      detectionMethod,
      apiBaseUrl: this.buildApiBaseUrl(tenantId, isLocalhost)
    };
  }

  /**
   * Get tenant configuration by slug/subdomain
   */
  async getTenantBySlug(slug: string): Promise<TenantConfig | null> {
    // Dev-mode short-circuit to avoid network calls
    // TODO: fix this routing development mode
    // if (this.config.developmentMode || import.meta.env.DEV || true) {
    if (true) {
      const mock: TenantConfig = {
        id: `tenant-${slug}`,
        name: slug.charAt(0).toUpperCase() + slug.slice(1),
        subdomain: slug,
        primaryColor: '#8B5CF6',
        secondaryColor: '#A78BFA',
        accentColor: '#C4B5FD',
        fontFamily: 'Inter',
        features: {
          loyaltyProgram: true,
          referralSystem: true,
          spinWheel: true,
          warrantyTracking: true,
          productReviews: true,
          wishlist: true,
          compareProducts: true,
          guestCheckout: true,
          socialLogin: true,
          multiCurrency: false,
          multiLanguage: false,
        },
        branding: {
          storeName: slug,
          tagline: 'Development storefront',
          description: 'Mock tenant configuration for development',
          logo: { light: '/src/assets/Rexus_Logo.png', favicon: '/favicon.ico' },
          colors: {
            primary: '#8B5CF6',
            secondary: '#A78BFA',
            accent: '#C4B5FD',
            background: '#FFFFFF',
            foreground: '#1F2937',
            muted: '#F3F4F6',
            border: '#E5E7EB',
          },
          typography: { fontFamily: 'Inter', headingFont: 'Inter', bodyFont: 'Inter' },
        },
        settings: {
          currency: 'USD',
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'MM/DD/YYYY',
          numberFormat: 'en-US',
          taxIncluded: false,
          shippingEnabled: true,
          inventoryTracking: true,
          orderNotifications: true,
          emailNotifications: true,
          smsNotifications: true,
        },
      };
      this.cache.set(slug, mock);
      return mock;
    }

    // Check cache first
    if (this.cache.has(slug)) {
      return this.cache.get(slug) || null;
    }

    try {
      const apiUrl = this.getTenantApiUrl(slug);
      const response = await fetch(`${apiUrl}/api/tenants/${slug}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Slug': slug, // Backend compatibility header
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Tenant not found
        }
        throw new Error(`Failed to fetch tenant: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const tenantConfig = data.data as TenantConfig;
        // Cache the result
        this.cache.set(slug, tenantConfig);
        return tenantConfig;
      }

      return null;
    } catch (error) {
      console.error(`Failed to fetch tenant configuration for slug "${slug}":`, error);
      return null;
    }
  }

  /**
   * Validate if a tenant slug is valid
   */
  async validateTenantSlug(slug: string): Promise<boolean> {
    // In development, assume tenant is valid to avoid network calls
    if (this.config.developmentMode) {
      return true;
    }
    try {
      const tenant = await this.getTenantBySlug(slug);
      return tenant !== null;
    } catch (error) {
      console.error(`Failed to validate tenant slug "${slug}":`, error);
      return false;
    }
  }

  /**
   * Get API base URL for a specific tenant
   */
  getTenantApiUrl(tenantId: string): string {
    console.log('🔍 [TenantResolver] getTenantApiUrl called with tenantId:', tenantId);
    
    const resolution = this.resolveTenant();
    
    if (resolution.isLocalhost || this.config.developmentMode) {
      // Development mode - use env override when available
      const envBase = import.meta.env.VITE_API_BASE_URL ?? 'https://smartseller-api.preproduction.kirimku.com';
      console.log('🔍 [TenantResolver] Using development mode, envBase:', envBase);
      return envBase;
    }

    // Check if we have a preproduction API URL from environment
    const preproductionApiUrl = import.meta.env.VITE_API_URL;
    if (preproductionApiUrl) {
      // Remove /api/v1 suffix if present to get base URL
      const finalUrl = preproductionApiUrl.replace(/\/api\/v1$/, '');
      console.log('🔍 [TenantResolver] Using preproduction API URL:', finalUrl);
      return finalUrl;
    }

    // Production mode - use tenant-aware API URL
    if (this.config.apiBaseDomain.includes('{tenant}')) {
      const tenantUrl = `https://${this.config.apiBaseDomain.replace('{tenant}', tenantId)}`;
      console.log('🔍 [TenantResolver] Using tenant-specific URL:', tenantUrl);
      return tenantUrl;
    }

    // Fallback to configured API domain
    const fallbackUrl = `https://${this.config.apiBaseDomain}`;
    console.log('🔍 [TenantResolver] Using fallback URL:', fallbackUrl);
    return fallbackUrl;
  }

  /**
   * Get tenant type for future migration compatibility
   */
  async getTenantType(tenantId: string): Promise<TenantType> {
    // Check cache first
    if (this.typeCache.has(tenantId)) {
      return this.typeCache.get(tenantId)!;
    }

    // In development, short-circuit to SHARED to avoid network errors
    // if (this.config.developmentMode) {
    if (true) {
      const devType = TenantType.SHARED;
      this.typeCache.set(tenantId, devType);
      return devType;
    }

    try {
      const apiUrl = this.getTenantApiUrl(tenantId);
      const response = await fetch(`${apiUrl}/api/tenants/${tenantId}/type`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Slug': tenantId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const tenantType = data.type as TenantType || TenantType.SHARED;
        this.typeCache.set(tenantId, tenantType);
        return tenantType;
      }
    } catch (error) {
      console.warn(`Failed to fetch tenant type for "${tenantId}":`, error);
    }

    // Default to shared for backward compatibility
    const defaultType = TenantType.SHARED;
    this.typeCache.set(tenantId, defaultType);
    return defaultType;
  }

  /**
   * Clear caches (useful for testing or when tenant config changes)
   */
  clearCache(): void {
    this.cache.clear();
    this.typeCache.clear();
  }

  /**
   * Get development mode status
   */
  isDevelopmentMode(): boolean {
    return this.config.developmentMode;
  }

  /**
   * Private helper methods
   */
  private isLocalhostEnvironment(hostname: string): boolean {
    return hostname === 'localhost' || 
           hostname === '127.0.0.1' || 
           hostname.startsWith('192.168.') ||
           hostname.startsWith('10.') ||
           hostname.endsWith('.local');
  }

  private extractDomain(hostname: string): string {
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }
    return hostname;
  }

  private extractSubdomain(hostname: string): string | null {
    const parts = hostname.split('.');
    
    // Need at least 3 parts for subdomain (subdomain.domain.tld)
    if (parts.length >= 3) {
      const subdomain = parts[0];
      
      // Filter out common non-tenant subdomains
      const excludedSubdomains = ['www', 'api', 'admin', 'app', 'dashboard'];
      if (!excludedSubdomains.includes(subdomain.toLowerCase())) {
        return subdomain;
      }
    }
    
    return null;
  }

  private extractTenantFromPath(pathname: string): string | null {
    // Extract tenant from path like /tenant/storefront-slug/...
    const pathParts = pathname.split('/').filter(part => part.length > 0);
    
    if (pathParts.length >= 2 && pathParts[0] === 'tenant') {
      return pathParts[1];
    }
    
    return null;
  }

  private buildApiBaseUrl(tenantId: string | null, isLocalhost: boolean): string {
    console.log('🔍 [TenantResolver] buildApiBaseUrl called with:', { tenantId, isLocalhost, developmentMode: this.config.developmentMode });
    
    if (isLocalhost || this.config.developmentMode) {
      const envBase = import.meta.env.VITE_API_BASE_URL ?? 'https://smartseller-api.preproduction.kirimku.com';
      console.log('🔍 [TenantResolver] Using localhost/dev mode, envBase:', envBase);
      console.log('🔍 [TenantResolver] VITE_API_BASE_URL from env:', import.meta.env.VITE_API_BASE_URL);
      return envBase;
    }

    // Check if we have a preproduction API URL from environment
    const preproductionApiUrl = import.meta.env.VITE_API_URL;
    console.log('🔍 [TenantResolver] VITE_API_URL from env:', preproductionApiUrl);
    if (preproductionApiUrl) {
      // Remove /api/v1 suffix if present to get base URL
      const finalUrl = preproductionApiUrl.replace(/\/api\/v1$/, '');
      console.log('🔍 [TenantResolver] Using preproduction API URL:', finalUrl);
      return finalUrl;
    }

    if (tenantId && this.config.apiBaseDomain.includes('{tenant}')) {
      const tenantUrl = `https://${this.config.apiBaseDomain.replace('{tenant}', tenantId)}`;
      console.log('🔍 [TenantResolver] Using tenant-specific URL:', tenantUrl);
      return tenantUrl;
    }

    const fallbackUrl = `https://${this.config.apiBaseDomain}`;
    console.log('🔍 [TenantResolver] Using fallback URL:', fallbackUrl);
    return fallbackUrl;
  }
}

/**
 * Default configuration for the tenant resolver
 */
export const defaultTenantResolverConfig: TenantResolverConfig = {
  defaultTenant: 'rexus', // Default for development
  apiBaseDomain: 'smartseller-api.preproduction.kirimku.com',
  enablePathBasedRouting: false,
  enableQueryParamFallback: true,
  productionDomains: ['smartseller.com'],
  developmentMode: import.meta.env.DEV || true,
};

/**
 * Create a singleton instance of the tenant resolver
 */
export const createTenantResolver = (config?: Partial<TenantResolverConfig>): TenantResolver => {
  const finalConfig = { ...defaultTenantResolverConfig, ...config };
  return new TenantResolver(finalConfig);
};

// Export singleton instance
export const tenantResolver = createTenantResolver();