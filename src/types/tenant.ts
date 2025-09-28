export interface TenantConfig {
  id: string;
  name: string;
  subdomain: string;
  domain?: string;
  logo?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  customCSS?: string;
  features: TenantFeatures;
  branding: TenantBranding;
  settings: TenantSettings;
}

export interface TenantFeatures {
  loyaltyProgram: boolean;
  referralSystem: boolean;
  spinWheel: boolean;
  warrantyTracking: boolean;
  productReviews: boolean;
  wishlist: boolean;
  compareProducts: boolean;
  guestCheckout: boolean;
  socialLogin: boolean;
  multiCurrency: boolean;
  multiLanguage: boolean;
}

export interface TenantBranding {
  storeName: string;
  tagline?: string;
  description?: string;
  logo: {
    light: string;
    dark?: string;
    favicon: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
  };
  typography: {
    fontFamily: string;
    headingFont?: string;
    bodyFont?: string;
  };
  customCSS?: string;
}

export interface TenantSettings {
  currency: string;
  language: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  taxIncluded: boolean;
  shippingEnabled: boolean;
  inventoryTracking: boolean;
  orderNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export interface TenantContext {
  tenant: TenantConfig | null;
  isLoading: boolean;
  error: string | null;
  subdomain: string | null;
  isValidTenant: boolean;
}

export interface TenantApiResponse {
  success: boolean;
  data?: TenantConfig;
  error?: string;
  message?: string;
}