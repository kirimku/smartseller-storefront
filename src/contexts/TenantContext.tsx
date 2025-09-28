import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { TenantConfig, TenantContext as TenantContextType } from '@/types/tenant';
import { getTenantId, getApiBaseDomain } from '@/utils/subdomain';

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

// Mock tenant configurations for development
const mockTenants: Record<string, TenantConfig> = {
  'rexus': {
    id: 'rexus-gaming',
    name: 'Rexus Gaming',
    subdomain: 'rexus',
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
      storeName: 'Rexus Gaming',
      tagline: 'Gaming Rewards & Premium Gear',
      description: 'Your ultimate destination for gaming peripherals and rewards',
      logo: {
        light: '/src/assets/Rexus_Logo.png',
        favicon: '/favicon.ico',
      },
      colors: {
        primary: '#8B5CF6',
        secondary: '#A78BFA',
        accent: '#C4B5FD',
        background: '#FFFFFF',
        foreground: '#1F2937',
        muted: '#F3F4F6',
        border: '#E5E7EB',
      },
      typography: {
        fontFamily: 'Inter',
        headingFont: 'Inter',
        bodyFont: 'Inter',
      },
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
      smsNotifications: false,
    },
  },
  'techstore': {
    id: 'techstore-demo',
    name: 'TechStore',
    subdomain: 'techstore',
    primaryColor: '#3B82F6',
    secondaryColor: '#60A5FA',
    accentColor: '#93C5FD',
    fontFamily: 'Roboto',
    features: {
      loyaltyProgram: true,
      referralSystem: false,
      spinWheel: false,
      warrantyTracking: true,
      productReviews: true,
      wishlist: true,
      compareProducts: true,
      guestCheckout: true,
      socialLogin: false,
      multiCurrency: true,
      multiLanguage: false,
    },
    branding: {
      storeName: 'TechStore',
      tagline: 'Technology at Your Fingertips',
      description: 'Premium electronics and tech accessories',
      logo: {
        light: '/src/assets/Rexus_Logo.png', // Will be replaced with actual logo
        favicon: '/favicon.ico',
      },
      colors: {
        primary: '#3B82F6',
        secondary: '#60A5FA',
        accent: '#93C5FD',
        background: '#FFFFFF',
        foreground: '#111827',
        muted: '#F9FAFB',
        border: '#D1D5DB',
      },
      typography: {
        fontFamily: 'Roboto',
        headingFont: 'Roboto',
        bodyFont: 'Roboto',
      },
    },
    settings: {
      currency: 'EUR',
      language: 'en',
      timezone: 'Europe/London',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: 'en-GB',
      taxIncluded: true,
      shippingEnabled: true,
      inventoryTracking: true,
      orderNotifications: true,
      emailNotifications: true,
      smsNotifications: true,
    },
  },
  'demo-store': {
    id: 'demo-store',
    name: 'Demo Store',
    subdomain: 'demo-store',
    primaryColor: '#10B981',
    secondaryColor: '#34D399',
    accentColor: '#6EE7B7',
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
      multiCurrency: true,
      multiLanguage: true,
    },
    branding: {
      storeName: 'Demo Store',
      tagline: 'Experience the Future of Shopping',
      description: 'A demonstration of SmartSeller multi-tenant capabilities',
      logo: {
        light: '/src/assets/Rexus_Logo.png',
        favicon: '/favicon.ico',
      },
      colors: {
        primary: '#10B981',
        secondary: '#34D399',
        accent: '#6EE7B7',
        background: '#FFFFFF',
        foreground: '#111827',
        muted: '#F9FAFB',
        border: '#D1D5DB',
      },
      typography: {
        fontFamily: 'Inter',
        headingFont: 'Inter',
        bodyFont: 'Inter',
      },
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
  },
};

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);

  const detectSubdomain = (): string | null => {
    if (typeof window === 'undefined') return null;
    
    const hostname = window.location.hostname;
    
    // For development (localhost), check for subdomain parameter or default to 'rexus'
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const urlParams = new URLSearchParams(window.location.search);
      const subdomainParam = urlParams.get('tenant');
      return subdomainParam || 'rexus'; // Default to rexus for development
    }
    
    // For production, extract subdomain from hostname
    const parts = hostname.split('.');
    if (parts.length > 2) {
      return parts[0]; // First part is the subdomain
    }
    
    return null;
  };

  const loadTenantConfig = async (detectedSubdomain: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In development, use mock data
      if (process.env.NODE_ENV === 'development') {
        const tenantConfig = mockTenants[detectedSubdomain];
        if (tenantConfig) {
          setTenant(tenantConfig);
          applyTenantTheme(tenantConfig);
        } else {
          setError(`Tenant '${detectedSubdomain}' not found`);
        }
        return;
      }
      
      // In production, fetch from SmartSeller API
      const apiBaseUrl = getApiBaseDomain();
      const response = await fetch(`${apiBaseUrl}/api/tenants/${detectedSubdomain}`);
      if (!response.ok) {
        throw new Error(`Failed to load tenant configuration: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.success && data.data) {
        setTenant(data.data);
        applyTenantTheme(data.data);
      } else {
        setError(data.error || 'Failed to load tenant configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const applyTenantTheme = (tenantConfig: TenantConfig) => {
    const root = document.documentElement;
    const { colors } = tenantConfig.branding;
    
    // Apply CSS custom properties for theming
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--secondary', colors.secondary);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--foreground', colors.foreground);
    root.style.setProperty('--muted', colors.muted);
    root.style.setProperty('--border', colors.border);
    
    // Apply font family
    root.style.setProperty('--font-family', tenantConfig.branding.typography.fontFamily);
    
    // Update document title and favicon
    document.title = tenantConfig.branding.storeName;
    
    // Update favicon if provided
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon && tenantConfig.branding.logo.favicon) {
      favicon.href = tenantConfig.branding.logo.favicon;
    }
    
    // Apply custom CSS if provided
    if (tenantConfig.branding.customCSS) {
      let customStyleElement = document.getElementById('tenant-custom-styles');
      if (!customStyleElement) {
        customStyleElement = document.createElement('style');
        customStyleElement.id = 'tenant-custom-styles';
        document.head.appendChild(customStyleElement);
      }
      customStyleElement.textContent = tenantConfig.branding.customCSS;
    }
  };

  useEffect(() => {
    const loadTenant = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get tenant ID from subdomain
        const tenantId = getTenantId();
        setSubdomain(tenantId);
        
        if (tenantId) {
          await loadTenantConfig(tenantId);
        } else {
          setError('No tenant subdomain detected');
          setIsLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setIsLoading(false);
      }
    };

    loadTenant();
  }, []);

  const contextValue: TenantContextType = {
    tenant,
    isLoading,
    error,
    subdomain,
    isValidTenant: !!tenant && !error,
  };

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

export default TenantContext;