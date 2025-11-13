/**
 * Slug Detection Service
 * 
 * Enhanced service for detecting tenant slugs from various sources:
 * - Subdomains (primary method)
 * - URL paths (alternative method)
 * - Query parameters (development/testing)
 * - Custom routing patterns
 */

export interface SlugDetectionResult {
  slug: string | null;
  source: SlugSource;
  confidence: SlugConfidence;
  metadata: SlugMetadata;
}

export enum SlugSource {
  SUBDOMAIN = 'subdomain',
  PATH = 'path',
  QUERY_PARAM = 'query_param',
  HEADER = 'header',
  COOKIE = 'cookie',
  DEFAULT = 'default',
  NONE = 'none'
}

export enum SlugConfidence {
  HIGH = 'high',       // Subdomain or explicit path
  MEDIUM = 'medium',   // Query parameter or header
  LOW = 'low',         // Cookie or default fallback
  NONE = 'none'        // No slug detected
}

export interface SlugMetadata {
  originalUrl: string;
  hostname: string;
  pathname: string;
  searchParams: Record<string, string>;
  isLocalhost: boolean;
  detectionMethod: string;
  alternativeSlugs?: string[];
  validationRequired: boolean;
}

export interface SlugDetectionConfig {
  enableSubdomainDetection: boolean;
  enablePathDetection: boolean;
  enableQueryParamDetection: boolean;
  enableHeaderDetection: boolean;
  enableCookieDetection: boolean;
  
  // Subdomain configuration
  excludedSubdomains: string[];
  subdomainPattern?: RegExp;
  
  // Path configuration
  pathPatterns: string[];
  pathPrefix?: string;
  
  // Query parameter configuration
  queryParamNames: string[];
  
  // Header configuration
  headerNames: string[];
  
  // Cookie configuration
  cookieNames: string[];
  
  // Validation
  slugValidationPattern: RegExp;
  minSlugLength: number;
  maxSlugLength: number;
  
  // Fallback
  defaultSlug?: string;
  fallbackEnabled: boolean;
}

export class SlugDetectionService {
  private config: SlugDetectionConfig;

  constructor(config: Partial<SlugDetectionConfig> = {}) {
    this.config = {
      enableSubdomainDetection: true,
      enablePathDetection: true,
      enableQueryParamDetection: true,
      enableHeaderDetection: false,
      enableCookieDetection: false,
      
      excludedSubdomains: ['www', 'api', 'admin', 'app', 'dashboard', 'cdn', 'static'],
      subdomainPattern: /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i,
      
      pathPatterns: [
        '/tenant/:slug',
        '/store/:slug',
        '/:slug/storefront',
        '/s/:slug'
      ],
      pathPrefix: '/tenant/',
      
      queryParamNames: ['tenant', 'slug', 'store', 'storefront'],
      headerNames: ['X-Storefront-Slug'],
      cookieNames: ['tenant_slug', 'store_slug'],
      
      slugValidationPattern: /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i,
      minSlugLength: 2,
      maxSlugLength: 63,
      
      defaultSlug: 'rexus',
      fallbackEnabled: true,
      
      ...config
    };
  }

  /**
   * Detect tenant slug from current context
   */
  detectSlug(): SlugDetectionResult {
    const url = new URL(window.location.href);
    const metadata: SlugMetadata = {
      originalUrl: url.href,
      hostname: url.hostname,
      pathname: url.pathname,
      searchParams: Object.fromEntries(url.searchParams.entries()),
      isLocalhost: this.isLocalhost(url.hostname),
      detectionMethod: '',
      validationRequired: false
    };

    // Try detection methods in order of confidence
    const detectionMethods = [
      () => this.detectFromSubdomain(url, metadata),
      () => this.detectFromPath(url, metadata),
      () => this.detectFromQueryParams(url, metadata),
      () => this.detectFromHeaders(metadata),
      () => this.detectFromCookies(metadata),
      () => this.detectFromDefault(metadata)
    ];

    for (const method of detectionMethods) {
      const result = method();
      if (result.slug && this.isValidSlug(result.slug)) {
        return result;
      }
    }

    // No valid slug found
    return {
      slug: null,
      source: SlugSource.NONE,
      confidence: SlugConfidence.NONE,
      metadata: {
        ...metadata,
        detectionMethod: 'none',
        validationRequired: false
      }
    };
  }

  /**
   * Detect slug from subdomain
   */
  private detectFromSubdomain(url: URL, metadata: SlugMetadata): SlugDetectionResult {
    if (!this.config.enableSubdomainDetection) {
      return this.createEmptyResult(metadata);
    }

    const hostname = url.hostname;
    const parts = hostname.split('.');

    // Need at least 3 parts for subdomain (subdomain.domain.tld)
    if (parts.length >= 3) {
      const subdomain = parts[0].toLowerCase();
      
      // Check if subdomain is excluded
      if (this.config.excludedSubdomains.includes(subdomain)) {
        return this.createEmptyResult(metadata);
      }

      // Validate subdomain pattern
      if (this.config.subdomainPattern && !this.config.subdomainPattern.test(subdomain)) {
        return this.createEmptyResult(metadata);
      }

      return {
        slug: subdomain,
        source: SlugSource.SUBDOMAIN,
        confidence: SlugConfidence.HIGH,
        metadata: {
          ...metadata,
          detectionMethod: 'subdomain',
          validationRequired: false
        }
      };
    }

    return this.createEmptyResult(metadata);
  }

  /**
   * Detect slug from URL path
   */
  private detectFromPath(url: URL, metadata: SlugMetadata): SlugDetectionResult {
    if (!this.config.enablePathDetection) {
      return this.createEmptyResult(metadata);
    }

    const pathname = url.pathname;

    // Try each path pattern
    for (const pattern of this.config.pathPatterns) {
      const slug = this.extractSlugFromPathPattern(pathname, pattern);
      if (slug) {
        return {
          slug,
          source: SlugSource.PATH,
          confidence: SlugConfidence.HIGH,
          metadata: {
            ...metadata,
            detectionMethod: `path:${pattern}`,
            validationRequired: true
          }
        };
      }
    }

    // Try simple prefix matching
    if (this.config.pathPrefix && pathname.startsWith(this.config.pathPrefix)) {
      const slug = pathname.substring(this.config.pathPrefix.length).split('/')[0];
      if (slug) {
        return {
          slug,
          source: SlugSource.PATH,
          confidence: SlugConfidence.HIGH,
          metadata: {
            ...metadata,
            detectionMethod: `path:prefix`,
            validationRequired: true
          }
        };
      }
    }

    return this.createEmptyResult(metadata);
  }

  /**
   * Detect slug from query parameters
   */
  private detectFromQueryParams(url: URL, metadata: SlugMetadata): SlugDetectionResult {
    if (!this.config.enableQueryParamDetection) {
      return this.createEmptyResult(metadata);
    }

    for (const paramName of this.config.queryParamNames) {
      const slug = url.searchParams.get(paramName);
      if (slug) {
        return {
          slug,
          source: SlugSource.QUERY_PARAM,
          confidence: SlugConfidence.MEDIUM,
          metadata: {
            ...metadata,
            detectionMethod: `query:${paramName}`,
            validationRequired: true
          }
        };
      }
    }

    return this.createEmptyResult(metadata);
  }

  /**
   * Detect slug from HTTP headers (for server-side rendering)
   */
  private detectFromHeaders(metadata: SlugMetadata): SlugDetectionResult {
    if (!this.config.enableHeaderDetection || typeof window === 'undefined') {
      return this.createEmptyResult(metadata);
    }

    // In browser environment, we can't access arbitrary headers
    // This would be used in SSR context
    return this.createEmptyResult(metadata);
  }

  /**
   * Detect slug from cookies
   */
  private detectFromCookies(metadata: SlugMetadata): SlugDetectionResult {
    if (!this.config.enableCookieDetection || typeof document === 'undefined') {
      return this.createEmptyResult(metadata);
    }

    const cookies = this.parseCookies(document.cookie);

    for (const cookieName of this.config.cookieNames) {
      const slug = cookies[cookieName];
      if (slug) {
        return {
          slug,
          source: SlugSource.COOKIE,
          confidence: SlugConfidence.LOW,
          metadata: {
            ...metadata,
            detectionMethod: `cookie:${cookieName}`,
            validationRequired: true
          }
        };
      }
    }

    return this.createEmptyResult(metadata);
  }

  /**
   * Use default slug as fallback
   */
  private detectFromDefault(metadata: SlugMetadata): SlugDetectionResult {
    if (!this.config.fallbackEnabled || !this.config.defaultSlug) {
      return this.createEmptyResult(metadata);
    }

    return {
      slug: this.config.defaultSlug,
      source: SlugSource.DEFAULT,
      confidence: SlugConfidence.LOW,
      metadata: {
        ...metadata,
        detectionMethod: 'default',
        validationRequired: false
      }
    };
  }

  /**
   * Validate if a slug meets the requirements
   */
  private isValidSlug(slug: string): boolean {
    if (!slug || typeof slug !== 'string') {
      return false;
    }

    // Check length
    if (slug.length < this.config.minSlugLength || slug.length > this.config.maxSlugLength) {
      return false;
    }

    // Check pattern
    if (!this.config.slugValidationPattern.test(slug)) {
      return false;
    }

    return true;
  }

  /**
   * Extract slug from path using pattern
   */
  private extractSlugFromPathPattern(pathname: string, pattern: string): string | null {
    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/:[^/]+/g, '([^/]+)')  // Replace :param with capture group
      .replace(/\//g, '\\/');         // Escape forward slashes

    const regex = new RegExp(`^${regexPattern}(?:/.*)?$`);
    const match = pathname.match(regex);

    if (match && match[1]) {
      return match[1];
    }

    return null;
  }

  /**
   * Parse cookies string into object
   */
  private parseCookies(cookieString: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    
    cookieString.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });

    return cookies;
  }

  /**
   * Check if hostname is localhost
   */
  private isLocalhost(hostname: string): boolean {
    return hostname === 'localhost' || 
           hostname === '127.0.0.1' || 
           hostname.startsWith('192.168.') ||
           hostname.startsWith('10.') ||
           hostname.endsWith('.local');
  }

  /**
   * Create empty result
   */
  private createEmptyResult(metadata: SlugMetadata): SlugDetectionResult {
    return {
      slug: null,
      source: SlugSource.NONE,
      confidence: SlugConfidence.NONE,
      metadata
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SlugDetectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): SlugDetectionConfig {
    return { ...this.config };
  }
}

/**
 * Default slug detection service instance
 */
export const slugDetectionService = new SlugDetectionService();

/**
 * Create a custom slug detection service
 */
export const createSlugDetectionService = (config?: Partial<SlugDetectionConfig>): SlugDetectionService => {
  return new SlugDetectionService(config);
};