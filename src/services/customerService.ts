/**
 * Customer Service - Handles customer authentication and profile management
 * Updated to use generated OpenAPI client
 */

import { apiClient as generatedApiClient } from '@/lib/apiClient';
import type { 
  LoginRequest as GeneratedLoginRequest,
  LoginResponse as GeneratedLoginResponse,
  ForgotPasswordRequest as GeneratedForgotPasswordRequest,
  ResetPasswordRequest as GeneratedResetPasswordRequest,
  UserDTO 
} from '@/lib/apiClient';
import { apiClient, ApiResponse, handleApiError } from '@/lib/api';
import { secureTokenStorage, type TokenData, type CustomerData } from './secureTokenStorage';
import { deviceFingerprinting } from '@/utils/deviceFingerprint';
import { jwtTokenManager } from './jwtTokenManager';
import { tokenRefreshInterceptor } from './tokenRefreshInterceptor';

// Customer Types
export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  avatar?: string;
  addresses: CustomerAddress[];
  preferences: CustomerPreferences;
  loyaltyPoints: number;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  phoneVerified: boolean;
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

export interface CustomerPreferences {
  language: string;
  currency: string;
  timezone: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  orderUpdates: boolean;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  tenantId?: string; // Added for tenant-aware authentication
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  acceptTerms: boolean;
  marketingOptIn?: boolean;
  tenantId?: string; // Added for tenant-aware authentication
}

export interface AuthResponse {
  customer: Customer;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  preferences?: Partial<CustomerPreferences>;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export class CustomerService {
  /**
   * Convert UserDTO to Customer interface
   */
  private convertUserDtoToCustomer(userDto: UserDTO): Customer {
    return {
      id: userDto.id || '',
      email: userDto.email || '',
      firstName: userDto.firstName || '',
      lastName: userDto.lastName || '',
      phone: userDto.phone,
      avatar: userDto.avatar,
      emailVerified: userDto.emailVerified || false,
      phoneVerified: userDto.phoneVerified || false,
      createdAt: userDto.createdAt || '',
      updatedAt: userDto.updatedAt || '',
      // Default values for fields not in UserDTO
      dateOfBirth: undefined,
      gender: undefined,
      addresses: [],
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
   * Convert GeneratedLoginResponse to AuthResponse
   */
  private convertLoginResponse(response: GeneratedLoginResponse): AuthResponse {
    const userData = response.data;
    if (!userData?.user || !userData?.access_token) {
      throw new Error('Invalid login response format');
    }

    return {
      customer: this.convertUserDtoToCustomer(userData.user),
      token: userData.access_token,
      refreshToken: userData.refresh_token || '',
      expiresIn: userData.token_expiry ? new Date(userData.token_expiry).getTime() - Date.now() : 3600000, // Default 1 hour
    };
  }

  /**
   * Login customer using generated API client with enhanced security
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      // Validate device before login attempt
      const deviceValidation = await deviceFingerprinting.validateDeviceForAuth();
      
      if (deviceValidation.riskLevel === 'high') {
        console.warn('⚠️ High-risk device detected during login attempt');
        // In production, you might want to require additional verification
      }

      // Convert to generated API format
      const loginRequest: GeneratedLoginRequest = {
        email_or_phone: credentials.email,
        password: credentials.password,
      };

      const response = await generatedApiClient.login(loginRequest);
      const authResponse = this.convertLoginResponse(response);
      
      // Store authentication data securely
      await this.storeAuthData(authResponse);
      
      console.log('✅ Login successful with secure token storage');
      return authResponse;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error instanceof Error ? error : new Error('Login failed');
    }
  }

  /**
   * Register new customer with enhanced security
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      // Validate device before registration attempt
      const deviceValidation = await deviceFingerprinting.validateDeviceForAuth();
      
      if (deviceValidation.riskLevel === 'high') {
        console.warn('⚠️ High-risk device detected during registration attempt');
        // In production, you might want to require additional verification
      }

      const response = await apiClient.post<AuthResponse>('/api/auth/register', data);
      
      if (response.success && response.data) {
        // Store authentication data securely
        await this.storeAuthData(response.data);
        
        console.log('✅ Registration successful with secure token storage');
        return response.data;
      }
      
      throw new Error(response.error || 'Registration failed');
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Logout customer
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout', {}, { requiresAuth: true });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear auth data regardless of API response
      apiClient.setAuthToken(null);
      this.clearAuthData();
    }
  }

  /**
   * Refresh authentication token using JWT token manager
   */
  async refreshToken(): Promise<AuthResponse> {
    try {
      console.log('🔄 CustomerService: Attempting token refresh...');
      
      // Use JWT token manager for enhanced token refresh
      const refreshed = await jwtTokenManager.refreshToken();
      
      if (refreshed) {
        // Get the updated token data
        const accessToken = secureTokenStorage.getAccessToken();
        const refreshToken = secureTokenStorage.getRefreshToken();
        const customerData = secureTokenStorage.getCustomerData();
        
        if (accessToken && refreshToken && customerData) {
           // Update API client with new token
           apiClient.setAuthToken(accessToken);
           
           // Convert to AuthResponse format for compatibility
           const authResponse: AuthResponse = {
             customer: customerData as unknown as Customer,
             token: accessToken,
             refreshToken: refreshToken,
             expiresIn: 3600 // Default to 1 hour, will be updated by JWT manager
           };
          
          console.log('✅ CustomerService: Token refresh successful');
          return authResponse;
        }
      }
      
      throw new Error('Token refresh failed - no valid tokens available');
    } catch (error) {
      console.error('❌ CustomerService: Token refresh failed:', error);
      this.clearAuthData();
      throw handleApiError(error);
    }
  }

  /**
   * Request password reset using generated API client
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    try {
      const forgotPasswordRequest: GeneratedForgotPasswordRequest = {
        email_or_phone: data.email,
      };
      
      await generatedApiClient.forgotPassword(forgotPasswordRequest);
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw error instanceof Error ? error : new Error('Password reset request failed');
    }
  }

  /**
   * Confirm password reset using generated API client
   */
  async confirmPasswordReset(data: PasswordResetConfirm): Promise<void> {
    try {
      const resetPasswordRequest: GeneratedResetPasswordRequest = {
        token: data.token,
        new_password: data.newPassword,
        confirm_password: data.newPassword, // Assuming the frontend validates this
      };
      
      await generatedApiClient.resetPassword(resetPasswordRequest);
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error instanceof Error ? error : new Error('Password reset failed');
    }
  }

  /**
   * Get current customer profile
   */
  async getProfile(): Promise<Customer> {
    try {
      const response = await apiClient.get<Customer>('/api/customers/profile', {
        requiresAuth: true,
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error('Failed to fetch profile');
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Update customer profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<Customer> {
    try {
      const response = await apiClient.put<Customer>('/api/customers/profile', data, {
        requiresAuth: true,
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to update profile');
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      const response = await apiClient.post('/api/customers/change-password', data, {
        requiresAuth: true,
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Add customer address
   */
  async addAddress(address: Omit<CustomerAddress, 'id'>): Promise<CustomerAddress> {
    try {
      const response = await apiClient.post<CustomerAddress>('/api/customers/addresses', address, {
        requiresAuth: true,
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to add address');
    } catch (error) {
      console.error('Failed to add address:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Update customer address
   */
  async updateAddress(addressId: string, address: Partial<CustomerAddress>): Promise<CustomerAddress> {
    try {
      const response = await apiClient.put<CustomerAddress>(
        `/api/customers/addresses/${addressId}`,
        address,
        { requiresAuth: true }
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to update address');
    } catch (error) {
      console.error('Failed to update address:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Delete customer address
   */
  async deleteAddress(addressId: string): Promise<void> {
    try {
      const response = await apiClient.delete(`/api/customers/addresses/${addressId}`, {
        requiresAuth: true,
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete address');
      }
    } catch (error) {
      console.error('Failed to delete address:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      const response = await apiClient.post('/api/auth/verify-email', { token });
      
      if (!response.success) {
        throw new Error(response.error || 'Email verification failed');
      }
    } catch (error) {
      console.error('Email verification failed:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(): Promise<void> {
    try {
      const response = await apiClient.post('/api/auth/resend-verification', {}, {
        requiresAuth: true,
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      throw handleApiError(error);
    }
  }

  // Local storage helpers
  /**
   * Store authentication data securely
   */
  async storeAuthData(authData: AuthResponse): Promise<void> {
    try {
      // Generate device fingerprint for security
      const deviceValidation = await deviceFingerprinting.validateDeviceForAuth();
      
      // Convert to secure storage format
      const tokenData: TokenData = {
        accessToken: authData.token,
        refreshToken: authData.refreshToken,
        expiresAt: Date.now() + (authData.expiresIn * 1000),
        tokenType: 'Bearer'
      };

      const customerData: CustomerData = {
        id: authData.customer.id,
        email: authData.customer.email,
        firstName: authData.customer.firstName,
        lastName: authData.customer.lastName,
        phone: authData.customer.phone,
        isEmailVerified: authData.customer.emailVerified
      };

      // Store tokens securely
      secureTokenStorage.storeTokens(tokenData, customerData);
      
      // Store device fingerprint for security validation
      secureTokenStorage.setTokenFingerprint(deviceValidation.fingerprint);

      // Update API clients with new token
      apiClient.setAuthToken(authData.token);
      generatedApiClient.setAccessToken(authData.token);

      // Start token monitoring with JWT token manager
      jwtTokenManager.validateAndRefreshIfNeeded();

      console.log('✅ Authentication data stored securely with JWT token manager active');
    } catch (error) {
      console.error('❌ Failed to store auth data:', error);
      throw new Error('Failed to store authentication data securely');
    }
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    try {
      // Cleanup JWT token manager
      jwtTokenManager.cleanup();
      
      secureTokenStorage.clearTokens();
      deviceFingerprinting.clearStoredFingerprint();
      
      // Clear API client tokens
      apiClient.setAuthToken('');
      generatedApiClient.setAccessToken('');

      console.log('✅ Authentication data cleared and JWT token manager cleaned up');
    } catch (error) {
      console.error('❌ Failed to clear auth data:', error);
    }
  }

  /**
   * Get stored refresh token
   */
  private getStoredRefreshToken(): string | null {
    return secureTokenStorage.getRefreshToken();
  }

  /**
   * Get stored customer data
   */
  getStoredCustomer(): Customer | null {
    try {
      const customerData = secureTokenStorage.getCustomerData();
      if (!customerData) return null;

      // Convert back to full Customer interface
      // Note: This is a simplified version, you might need to fetch full profile
      return {
        id: customerData.id,
        email: customerData.email,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        phone: customerData.phone,
        emailVerified: customerData.isEmailVerified,
        phoneVerified: false, // Default values for missing data
        dateOfBirth: '',
        gender: undefined,
        avatar: '',
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
        createdAt: '',
        updatedAt: ''
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
   * Check if customer is authenticated
   */
  isAuthenticated(): boolean {
    return secureTokenStorage.isAuthenticated();
  }

  /**
   * Initialize authentication from stored data
   */
  async initializeAuth(): Promise<void> {
    try {
      const token = this.getStoredAuthToken();
      
      if (token) {
        // Validate device fingerprint for security
        const deviceValidation = await deviceFingerprinting.validateDeviceForAuth();
        const storedFingerprint = secureTokenStorage.getTokenFingerprint();
        
        if (storedFingerprint && deviceValidation.riskLevel === 'high') {
          console.warn('⚠️ Device fingerprint mismatch detected, clearing tokens');
          this.clearAuthData();
          return;
        }

        // Set tokens in API clients
        apiClient.setAuthToken(token);
        generatedApiClient.setAccessToken(token);

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
        console.log('ℹ️ No stored authentication found');
      }
    } catch (error) {
      console.error('❌ Failed to initialize auth:', error);
      this.clearAuthData();
    }
  }

  /**
   * Validate current session security
   */
  async validateSessionSecurity(): Promise<{
    isValid: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    requiresReauth: boolean;
  }> {
    try {
      if (!this.isAuthenticated()) {
        return { isValid: false, riskLevel: 'high', requiresReauth: true };
      }

      const deviceValidation = await deviceFingerprinting.validateDeviceForAuth();
      const storedFingerprint = secureTokenStorage.getTokenFingerprint();

      if (!storedFingerprint) {
        return { isValid: true, riskLevel: 'medium', requiresReauth: false };
      }

      const fingerprintValidation = deviceFingerprinting.validateFingerprint(
        deviceValidation.fingerprint,
        storedFingerprint
      );

      return {
        isValid: fingerprintValidation.isValid,
        riskLevel: fingerprintValidation.riskLevel,
        requiresReauth: fingerprintValidation.riskLevel === 'high'
      };
    } catch (error) {
      console.error('❌ Session validation failed:', error);
      return { isValid: false, riskLevel: 'high', requiresReauth: true };
    }
  }
}

// Create singleton instance
export const customerService = new CustomerService();