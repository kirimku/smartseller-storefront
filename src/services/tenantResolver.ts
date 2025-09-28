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
    
    let tenantId: string | null = null;
    let slug: string | null = null;
    let subdomain: string | null = null;
    let detectionMethod: TenantResolutionInfo['detectionMethod'] = 'none';

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
    const resolution = this.resolveTenant();
    
    if (resolution.isLocalhost || this.config.developmentMode) {
      // Development mode - use localhost with tenant parameter
      return `http://localhost:8080`; // Assuming backend runs on 8080
    }

    // Production mode - use tenant-aware API URL
    if (this.config.apiBaseDomain.includes('{tenant}')) {
      return this.config.apiBaseDomain.replace('{tenant}', tenantId);
    }

    // Fallback to subdomain pattern
    return `https://${tenantId}.${this.config.apiBaseDomain}`;
  }

  /**
   * Get tenant type for future migration compatibility
   */
  async getTenantType(tenantId: string): Promise<TenantType> {
    // Check cache first
    if (this.typeCache.has(tenantId)) {
      return this.typeCache.get(tenantId)!;
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
    if (isLocalhost || this.config.developmentMode) {
      return 'http://localhost:8080'; // Development API
    }

    if (tenantId && this.config.apiBaseDomain.includes('{tenant}')) {
      return this.config.apiBaseDomain.replace('{tenant}', tenantId);
    }

    return this.config.apiBaseDomain;
  }
}

/**
 * Default configuration for the tenant resolver
 */
export const defaultTenantResolverConfig: TenantResolverConfig = {
  defaultTenant: 'rexus', // Default for development
  apiBaseDomain: 'api.smartseller.com',
  enablePathBasedRouting: false,
  enableQueryParamFallback: true,
  productionDomains: ['smartseller.com'],
  developmentMode: process.env.NODE_ENV === 'development',
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