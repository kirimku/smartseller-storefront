/**
 * Storefront-Aware API Client
 * 
 * Implements the customer authentication API endpoints as specified in the OpenAPI documentation.
 * Uses storefront-specific endpoints: /api/v1/storefront/{storefront_slug}/auth/*
 */

import { useTenant } from '@/contexts/TenantContext';

// Types based on OpenAPI specification
export interface CustomerRegistrationRequest {
  email: string;
  phone?: string;
  password: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  tags?: string[];
  preferences?: Record<string, unknown>;
}

export interface CustomerAuthRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface Customer {
  id: string;
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  tags?: string[];
  preferences?: Record<string, unknown>;
  storefront_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CustomerAuthResponse {
  customer: Customer;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// Actual API response structure based on real API response
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface CustomerRegistrationApiResponse {
  id: string;
  storefront_id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  status: string;
  customer_type: string;
  preferences: {
    language: string;
    currency: string;
    timezone: string;
    notification_email: boolean;
    notification_sms: boolean;
    notification_push: boolean;
    marketing_emails: boolean;
    newsletter_subscribed: boolean;
    preferred_payment_method: string;
    preferred_shipping_method: string;
    custom_fields: Record<string, unknown>;
  };
  created_at: string;
  updated_at: string;
}

export interface CustomerLoginApiResponse {
  customer: {
    id: string;
    storefront_id: string;
    email: string;
    first_name: string;
    last_name: string;
    status: string;
    customer_type: string;
    preferences: {
      language: string;
      currency: string;
      timezone: string;
      notification_email: boolean;
      notification_sms: boolean;
      notification_push: boolean;
      marketing_emails: boolean;
      newsletter_subscribed: boolean;
      preferred_payment_method: string;
      preferred_shipping_method: string;
      custom_fields: Record<string, unknown>;
    };
    created_at: string;
    updated_at: string;
  };
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface TokenRefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export class ApiError extends Error {
  public status: number;
  public details?: unknown;

  constructor(options: { message: string; status: number; details?: unknown }) {
    super(options.message);
    this.name = 'ApiError';
    this.status = options.status;
    this.details = options.details;
  }
}

export class StorefrontApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090';
  }

  /**
   * Set the access token for authenticated requests
   */
  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  /**
   * Get the current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Build storefront-specific endpoint URL
   */
  private buildStorefrontUrl(storefrontSlug: string, endpoint: string): string {
    const cleanSlug = storefrontSlug.replace(/^\/+|\/+$/g, '');
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    return `${this.baseUrl}/api/v1/storefront/${cleanSlug}/auth/${cleanEndpoint}`;
  }

  /**
   * Make HTTP request with error handling
   */
  private async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.accessToken && !headers.Authorization) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError({
        message: errorText || `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        details: errorText,
      });
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text() as T;
  }

  /**
   * Register a new customer
   */
  async registerCustomer(
    storefrontSlug: string,
    data: CustomerRegistrationRequest
  ): Promise<CustomerAuthResponse> {
    const url = this.buildStorefrontUrl(storefrontSlug, 'register');
    
    // Get the actual API response structure
    const apiResponse = await this.makeRequest<ApiResponse<CustomerRegistrationApiResponse>>(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Transform the API response to the expected CustomerAuthResponse format
    const customer: Customer = {
      id: apiResponse.data.id,
      email: apiResponse.data.email,
      phone: apiResponse.data.phone,
      first_name: apiResponse.data.first_name,
      last_name: apiResponse.data.last_name,
      storefront_id: apiResponse.data.storefront_id,
      created_at: apiResponse.data.created_at,
      updated_at: apiResponse.data.updated_at,
      created_by: '', // Not provided in the API response
      preferences: apiResponse.data.preferences,
    };

    // Note: The actual API response doesn't include auth tokens
    // This might need to be handled differently based on your authentication flow
    return {
      customer,
      access_token: '', // Not provided in registration response
      refresh_token: '', // Not provided in registration response
      token_type: 'Bearer',
      expires_in: 0, // Not provided in registration response
    };
  }

  /**
   * Authenticate customer login
   */
  async loginCustomer(
    storefrontSlug: string,
    credentials: CustomerAuthRequest
  ): Promise<CustomerAuthResponse> {
    const url = this.buildStorefrontUrl(storefrontSlug, 'login');
    
    // Get the actual API response structure
    const apiResponse = await this.makeRequest<ApiResponse<CustomerLoginApiResponse>>(url, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Transform the API response to the expected CustomerAuthResponse format
    const customer: Customer = {
      id: apiResponse.data.customer.id,
      email: apiResponse.data.customer.email,
      phone: '', // Not provided in the login response
      first_name: apiResponse.data.customer.first_name,
      last_name: apiResponse.data.customer.last_name,
      storefront_id: apiResponse.data.customer.storefront_id,
      created_at: apiResponse.data.customer.created_at,
      updated_at: apiResponse.data.customer.updated_at,
      created_by: '', // Not provided in the API response
      preferences: apiResponse.data.customer.preferences,
    };

    return {
      customer,
      access_token: apiResponse.data.access_token,
      refresh_token: apiResponse.data.refresh_token,
      token_type: apiResponse.data.token_type,
      expires_in: apiResponse.data.expires_in,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(storefrontSlug: string): Promise<TokenRefreshResponse> {
    const url = this.buildStorefrontUrl(storefrontSlug, 'refresh');
    
    return this.makeRequest<TokenRefreshResponse>(url, {
      method: 'POST',
    });
  }

  /**
   * Logout customer
   */
  async logoutCustomer(storefrontSlug: string): Promise<void> {
    const url = this.buildStorefrontUrl(storefrontSlug, 'logout');
    
    await this.makeRequest<void>(url, {
      method: 'POST',
    });
  }

  /**
   * Verify email address
   */
  async verifyEmail(
    storefrontSlug: string,
    token: string
  ): Promise<{ message: string }> {
    const url = this.buildStorefrontUrl(storefrontSlug, 'verify-email');
    
    return this.makeRequest<{ message: string }>(url, {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(
    storefrontSlug: string,
    email: string
  ): Promise<{ message: string }> {
    const url = this.buildStorefrontUrl(storefrontSlug, 'resend-verification');
    
    return this.makeRequest<{ message: string }>(url, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(
    storefrontSlug: string,
    email: string
  ): Promise<{ message: string }> {
    const url = this.buildStorefrontUrl(storefrontSlug, 'forgot-password');
    
    return this.makeRequest<{ message: string }>(url, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    storefrontSlug: string,
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const url = this.buildStorefrontUrl(storefrontSlug, 'reset-password');
    
    return this.makeRequest<{ message: string }>(url, {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  }
}

// Create singleton instance
export const storefrontApiClient = new StorefrontApiClient();

// Hook to get storefront-aware API client
export function useStorefrontApiClient() {
  const { slug } = useTenant();
  
  return {
    client: storefrontApiClient,
    storefrontSlug: slug || 'default',
    isReady: !!slug,
  };
}