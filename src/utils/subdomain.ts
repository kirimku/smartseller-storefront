/**
 * Utility functions for subdomain detection and parsing
 */

export interface SubdomainInfo {
  subdomain: string | null;
  domain: string;
  fullDomain: string;
  isLocalhost: boolean;
  isProduction: boolean;
}

/**
 * Extracts subdomain information from the current hostname
 */
export const getSubdomainInfo = (): SubdomainInfo => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // Check if we're on localhost
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
  
  // For localhost development, we can simulate subdomains using different ports or query params
  if (isLocalhost) {
    // Check for subdomain simulation via query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const simulatedSubdomain = urlParams.get('tenant') || urlParams.get('subdomain');
    
    return {
      subdomain: simulatedSubdomain,
      domain: hostname,
      fullDomain: hostname,
      isLocalhost: true,
      isProduction: false,
    };
  }
  
  // For production domains like tenant.smartseller.com
  let subdomain: string | null = null;
  let domain = hostname;
  
  if (parts.length >= 3) {
    // Extract subdomain (first part)
    subdomain = parts[0];
    // Domain is everything after the subdomain
    domain = parts.slice(1).join('.');
  }
  
  return {
    subdomain,
    domain,
    fullDomain: hostname,
    isLocalhost: false,
    isProduction: true,
  };
};

/**
 * Checks if a subdomain is valid (not www, api, admin, etc.)
 */
export const isValidTenantSubdomain = (subdomain: string | null): boolean => {
  if (!subdomain) return false;
  
  const reservedSubdomains = [
    'www',
    'api',
    'admin',
    'app',
    'mail',
    'ftp',
    'blog',
    'shop',
    'store',
    'support',
    'help',
    'docs',
    'cdn',
    'static',
    'assets',
    'images',
    'files',
    'download',
    'upload',
    'test',
    'staging',
    'dev',
    'demo',
  ];
  
  return !reservedSubdomains.includes(subdomain.toLowerCase());
};

/**
 * Gets the tenant identifier from the current URL
 */
export const getTenantId = (): string | null => {
  const { subdomain, isLocalhost } = getSubdomainInfo();
  
  if (isLocalhost) {
    // For development, return the simulated subdomain or a default
    return subdomain || 'demo-store';
  }
  
  if (subdomain && isValidTenantSubdomain(subdomain)) {
    return subdomain;
  }
  
  return null;
};

/**
 * Constructs a tenant-specific URL
 */
export const buildTenantUrl = (tenantId: string, path: string = ''): string => {
  const { domain, isLocalhost } = getSubdomainInfo();
  
  if (isLocalhost) {
    // For localhost, use query parameter
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('tenant', tenantId);
    currentUrl.pathname = path;
    return currentUrl.toString();
  }
  
  // For production, use subdomain
  const protocol = window.location.protocol;
  return `${protocol}//${tenantId}.${domain}${path}`;
};

/**
 * Redirects to a tenant-specific URL
 */
export const redirectToTenant = (tenantId: string, path: string = ''): void => {
  const url = buildTenantUrl(tenantId, path);
  window.location.href = url;
};

/**
 * Gets the base domain for API calls
 */
export const getApiBaseDomain = (): string => {
  const { domain, isLocalhost } = getSubdomainInfo();
  
  if (isLocalhost) {
    // For development, use localhost with API port
    return 'http://localhost:3000'; // Assuming API runs on port 3000
  }
  
  // For production, use api subdomain
  return `https://api.${domain}`;
};