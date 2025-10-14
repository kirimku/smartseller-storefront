/**
 * Customer Service - Handles customer authentication and profile management
 * Simplified to use only StorefrontApiClient methods that actually exist
 */

import { 
  StorefrontApiClient,
  type CustomerRegistrationRequest,
  type CustomerAuthRequest,
  type CustomerAuthResponse,
  type TokenRefreshResponse,
  type Customer as ApiCustomer,
  ApiError
} from '@/lib/storefrontApiClient';
import { secureTokenStorage, type TokenData, type CustomerData } from './secureTokenStorage';

// Customer Types (extending OpenAPI types)
export interface Customer extends ApiCustomer {
  addresses?: CustomerAddress[];
  preferences?: CustomerPreferences;
  loyaltyPoints?: number;
  totalOrders?: number;
  totalSpent?: number;
}

export interface CustomerAddress {
  id: string;
  type: 'billing' | 'shipping';
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

export interface CustomerPreferences extends Record<string, unknown> {
  language: string;
  currency: string;
  timezone: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  orderUpdates: boolean;
}

// Authentication Types (using OpenAPI types)
export interface LoginRequest extends CustomerAuthRequest {
  rememberMe?: boolean;
}

export interface RegisterRequest extends CustomerRegistrationRequest {
  acceptTerms: boolean;
  marketingOptIn?: boolean;
}

export interface AuthResponse extends CustomerAuthResponse {
  customer: Customer;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface EmailVerificationRequest {
  token: string;
}

export class CustomerService {
  private apiClient: StorefrontApiClient;
  private currentStorefrontSlug: string | null = null;

  constructor() {
    this.apiClient = new StorefrontApiClient();
    this.initializeStorefront();
  }

  /**
   * Initialize storefront context
   */
  private initializeStorefront(): void {
    // In development, automatically set to 'rexus' storefront
    if (import.meta.env.DEV) {
      this.currentStorefrontSlug = 'rexus';
      console.info('Development mode: Using "rexus" as default storefront slug');
    }
    // In production, this will be set by the tenant context
  }

  /**
   * Set the current storefront slug
   */
  public setStorefrontSlug(slug: string): void {
    this.currentStorefrontSlug = slug;
  }

  /**
   * Get the current storefront slug
   */
  private getStorefrontSlug(): string {
    if (!this.currentStorefrontSlug) {
      // In development, fallback to 'rexus' storefront
      if (import.meta.env.DEV) {
        console.warn('Storefront slug not set, falling back to "rexus" for development');
        return 'rexus';
      }
      throw new ApiError({ message: 'Storefront slug not set', status: 400, details: 'MISSING_STOREFRONT' });
    }
    return this.currentStorefrontSlug;
  }

  /**
   * Convert API Customer to local Customer interface
   */
  private convertApiCustomerToCustomer(apiCustomer: ApiCustomer): Customer {
    return {
      ...apiCustomer,
      addresses: [], // Will be loaded separately if needed
      preferences: {
        language: 'en',
        currency: 'USD',
        timezone: 'UTC',
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
        orderUpdates: true,
      },
      loyaltyPoints: 0,
      totalOrders: 0,
      totalSpent: 0,
    };
  }

  /**
   * Authenticate customer login
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await this.apiClient.loginCustomer(
        this.getStorefrontSlug(),
        credentials
      );

      // Store authentication data
      await this.storeAuthData(response);

      // Convert to our AuthResponse format
      const authResponse: AuthResponse = {
        ...response,
        customer: this.convertApiCustomerToCustomer(response.customer),
      };

      return authResponse;
    } catch (error) {
      console.error('❌ Login failed:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError({ message: 'Login failed', status: 500, details: 'INTERNAL_ERROR' });
    }
  }

  /**
   * Register new customer
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      // Prepare registration request
      const registrationRequest: CustomerRegistrationRequest = {
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
      };

      // Perform registration via storefront API
      const registrationResponse = await this.apiClient.registerCustomer(
        this.getStorefrontSlug(),
        registrationRequest
      );

      // Registration successful, now automatically log in the user
      // to get proper authentication tokens
      const loginCredentials: LoginRequest = {
        email: data.email,
        password: data.password,
      };

      // Perform automatic login after successful registration
      const authResponse = await this.login(loginCredentials);

      return authResponse;
    } catch (error) {
      console.error('❌ Registration failed:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError({ message: 'Registration failed', status: 500, details: 'INTERNAL_ERROR' });
    }
  }

  /**
   * Logout customer
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint
      await this.apiClient.logoutCustomer(this.getStorefrontSlug());
      
      // Clear stored authentication data
      this.clearAuthData();
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Clear auth data even if logout call fails
      this.clearAuthData();
    }
  }

  /**
   * Refresh access token using stored refresh token
   */
  async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = await this.getStoredRefreshToken();
      try {
        console.debug('🔐 Stored refresh token (pre-refresh)', {
          present: !!refreshToken,
          preview: refreshToken ? refreshToken.substring(0, 12) + '...' : undefined,
        });
      } catch {}
      if (!refreshToken) {
        throw new ApiError({ message: 'No refresh token available', status: 401, details: 'UNAUTHORIZED' });
      }

      try {
        console.debug('🚀 Calling refresh endpoint', {
          slug: this.getStorefrontSlug(),
        });
      } catch {}

      const response = await this.apiClient.refreshToken(this.getStorefrontSlug(), refreshToken);

      try {
        console.debug('✅ Refresh response received', {
          hasAccessToken: !!response?.access_token,
          accessTokenPreview: response?.access_token?.substring(0, 12) + '...',
          hasRefreshToken: !!response?.refresh_token,
          refreshTokenPreview: response?.refresh_token?.substring(0, 12) + '...',
          tokenType: response?.token_type,
          expiresIn: response?.expires_in,
        });
      } catch {}

      // Store new tokens
      const tokenData: TokenData = {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresAt: Date.now() + (response.expires_in * 1000),
        tokenType: response.token_type,
      };

      const customerData = secureTokenStorage.getCustomerData();
      if (customerData) {
        try {
          console.debug('💾 Persisting refreshed tokens with customer data', {
            customerId: customerData.id,
          });
        } catch {}
        await secureTokenStorage.storeTokens(tokenData, customerData);
      } else {
        // Fallback: persist access token in secure storage even without customer data
        // This ensures the app has a usable access token after refresh on reload
        try {
          console.debug('💾 Fallback: updating access token only (no customer data)');
        } catch {}
        secureTokenStorage.updateAccessToken(tokenData.accessToken, tokenData.expiresAt);
      }

      // Update API client with new access token
      this.apiClient.setAccessToken(response.access_token);

      // Return auth response format
      const authResponse: AuthResponse = {
        customer: this.getStoredCustomer()!,
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        token_type: response.token_type,
        expires_in: response.expires_in,
      };

      return authResponse;
    } catch (error) {
      console.error('Token refresh failed:', error);
      try {
        console.debug('🧯 Refresh failure handling: clearing auth data');
      } catch {}
      this.clearAuthData();
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError({ message: 'Token refresh failed', status: 401, details: 'UNAUTHORIZED' });
    }
  }

  /**
   * Request password reset using storefront API client
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    try {
      await this.apiClient.requestPasswordReset(
        this.getStorefrontSlug(),
        data.email
      );
    } catch (error) {
      console.error('Password reset request failed:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError({ message: 'Password reset request failed', status: 500, details: 'INTERNAL_ERROR' });
    }
  }

  /**
   * Confirm password reset using storefront API client
   */
  async confirmPasswordReset(data: PasswordResetConfirm): Promise<void> {
    try {
      await this.apiClient.resetPassword(
        this.getStorefrontSlug(),
        data.token,
        data.newPassword
      );
    } catch (error) {
      console.error('Password reset failed:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError({ message: 'Password reset failed', status: 500, details: 'INTERNAL_ERROR' });
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(data: EmailVerificationRequest): Promise<void> {
    try {
      await this.apiClient.verifyEmail(
        this.getStorefrontSlug(),
        data.token
      );
    } catch (error) {
      console.error('Email verification failed:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError({ message: 'Email verification failed', status: 500, details: 'INTERNAL_ERROR' });
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(email: string): Promise<void> {
    try {
      await this.apiClient.resendEmailVerification(this.getStorefrontSlug(), email);
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError({ message: 'Failed to resend verification email', status: 500, details: 'INTERNAL_ERROR' });
    }
  }

  /**
   * Store authentication data securely
   */
  private async storeAuthData(authResponse: CustomerAuthResponse): Promise<void> {
    try {
      console.log('🔍 Debug - Auth response structure:', JSON.stringify(authResponse, null, 2));

      // Validate response structure
      if (!authResponse) {
        throw new Error('Auth response is null or undefined');
      }

      if (!authResponse.access_token || !authResponse.refresh_token) {
        throw new Error('Missing required tokens in auth response');
      }

      if (!authResponse.customer) {
        throw new Error('Missing customer data in auth response');
      }

      if (!authResponse.customer.id) {
        throw new Error('Missing customer ID in auth response');
      }

      // Store tokens securely
      const tokenData: TokenData = {
        accessToken: authResponse.access_token,
        refreshToken: authResponse.refresh_token,
        expiresAt: Date.now() + (authResponse.expires_in * 1000),
        tokenType: authResponse.token_type,
      };

      // Store customer data
      const customerData: CustomerData = {
        id: authResponse.customer.id,
        email: authResponse.customer.email,
        firstName: authResponse.customer.first_name,
        lastName: authResponse.customer.last_name,
        phone: authResponse.customer.phone || '',
        isEmailVerified: true, // Assuming verified if login successful
      };

      await secureTokenStorage.storeTokens(tokenData, customerData);

      // Set token in API client for subsequent requests
      this.apiClient.setAccessToken(authResponse.access_token);
    } catch (error) {
      console.error('Failed to store auth data:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    try {
      // Clear stored tokens and customer data
      secureTokenStorage.clearTokens();
      
      // Clear API client token
      this.apiClient.setAccessToken(null);

      console.log('✅ Authentication data cleared');
    } catch (error) {
      console.error('❌ Failed to clear auth data:', error);
    }
  }

  /**
   * Get stored refresh token
   */
  private async getStoredRefreshToken(): Promise<string | null> {
    return await secureTokenStorage.getRefreshToken();
  }

  /**
   * Get stored customer data
   */
  getStoredCustomer(): Customer | null {
    try {
      const customerData = secureTokenStorage.getCustomerData();
      if (!customerData) return null;

      // Convert back to full Customer interface
      return {
        id: customerData.id,
        email: customerData.email,
        first_name: customerData.firstName,
        last_name: customerData.lastName,
        phone: customerData.phone,
        storefront_id: '',
        created_at: '',
        updated_at: '',
        created_by: '',
        addresses: [],
        preferences: {
          language: 'en',
          currency: 'USD',
          timezone: 'UTC',
          emailNotifications: true,
          smsNotifications: false,
          marketingEmails: false,
          orderUpdates: true
        },
        loyaltyPoints: 0,
        totalOrders: 0,
        totalSpent: 0,
      };
    } catch (error) {
      console.error('❌ Failed to get stored customer:', error);
      return null;
    }
  }

  /**
   * Get stored auth token
   */
  getStoredAuthToken(): string | null {
    return secureTokenStorage.getAccessToken();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getStoredAuthToken() && !!this.getStoredCustomer();
  }

  /**
   * Initialize authentication from stored data
   */
  async initializeAuth(): Promise<void> {
    try {
      const token = this.getStoredAuthToken();
      const storedCustomer = this.getStoredCustomer();
      
      if (token) {
        // Set token in API client
        this.apiClient.setAccessToken(token);

        // Check if token needs refresh
        if (secureTokenStorage.isTokenExpiringSoon()) {
          console.log('🔄 Token expiring soon, attempting refresh...');
          try {
            await this.refreshToken();
          } catch (error) {
            console.error('❌ Token refresh failed during initialization:', error);
            this.clearAuthData();
          }
        }

        console.log('✅ Authentication initialized successfully');
      } else {
        // No access token on reload; attempt refresh if we have a refresh token
        const storedRefreshToken = await this.getStoredRefreshToken();
        if (storedRefreshToken) {
          console.log('🔄 No access token on reload, refreshing using stored refresh token...');
          try {
            await this.refreshToken();
            console.log('✅ Startup refresh successful');
          } catch (error) {
            console.error('❌ Startup refresh failed:', error);
            this.clearAuthData();
          }
        } else if (storedCustomer) {
          // We have customer data but no refresh token
          console.log('ℹ️ Customer data found but no refresh token; user not authenticated');
        } else {
          console.log('ℹ️ No stored authentication found');
        }
      }
    } catch (error) {
      console.error('❌ Failed to initialize auth:', error);
      this.clearAuthData();
    }
  }

  /**
   * Get current customer profile
   */
  async getProfile(): Promise<Customer> {
    const storedCustomer = this.getStoredCustomer();
    if (storedCustomer) {
      return storedCustomer;
    }
    throw new ApiError({ message: 'Profile not available', status: 404, details: 'NOT_FOUND' });
  }

  /**
   * Social login (placeholder - not implemented in StorefrontApiClient)
   */
  async socialLogin(socialData: { accessToken: string; provider: string; tenantId?: string }): Promise<AuthResponse> {
    // Placeholder - not yet implemented in StorefrontApiClient
    throw new ApiError({
      message: 'Social login not yet implemented in StorefrontApiClient',
      status: 501,
      details: { method: 'socialLogin' }
    });
  }

  /**
   * Update customer profile (placeholder - not implemented in StorefrontApiClient)
   */
  async updateProfile(data: Partial<Customer>): Promise<Customer> {
    // Placeholder - not yet implemented in StorefrontApiClient
    throw new ApiError({
      message: 'Profile update not yet implemented in StorefrontApiClient',
      status: 501,
      details: { method: 'updateProfile' }
    });
  }
}

// Export singleton instance
export const customerService = new CustomerService();