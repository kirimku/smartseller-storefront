/**
 * Customer Service - Handles customer authentication and profile management
 */

import { apiClient, ApiResponse, handleApiError } from '@/lib/api';

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
   * Login customer
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials);
      
      if (response.success && response.data) {
        // Store auth token
        apiClient.setAuthToken(response.data.token);
        this.storeAuthData(response.data);
        return response.data;
      }
      
      throw new Error(response.error || 'Login failed');
    } catch (error) {
      console.error('Login failed:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Register new customer
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/register', data);
      
      if (response.success && response.data) {
        // Store auth token
        apiClient.setAuthToken(response.data.token);
        this.storeAuthData(response.data);
        return response.data;
      }
      
      throw new Error(response.error || 'Registration failed');
    } catch (error) {
      console.error('Registration failed:', error);
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
   * Refresh authentication token
   */
  async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = this.getStoredRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post<AuthResponse>('/api/auth/refresh', {
        refreshToken,
      });
      
      if (response.success && response.data) {
        apiClient.setAuthToken(response.data.token);
        this.storeAuthData(response.data);
        return response.data;
      }
      
      throw new Error('Token refresh failed');
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearAuthData();
      throw handleApiError(error);
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    try {
      const response = await apiClient.post('/api/auth/password-reset', data);
      
      if (!response.success) {
        throw new Error(response.error || 'Password reset request failed');
      }
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(data: PasswordResetConfirm): Promise<void> {
    try {
      const response = await apiClient.post('/api/auth/password-reset/confirm', data);
      
      if (!response.success) {
        throw new Error(response.error || 'Password reset failed');
      }
    } catch (error) {
      console.error('Password reset failed:', error);
      throw handleApiError(error);
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
  private storeAuthData(authData: AuthResponse): void {
    localStorage.setItem('auth_token', authData.token);
    localStorage.setItem('refresh_token', authData.refreshToken);
    localStorage.setItem('customer_data', JSON.stringify(authData.customer));
  }

  private clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('customer_data');
  }

  private getStoredRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Get stored customer data
   */
  getStoredCustomer(): Customer | null {
    try {
      const customerData = localStorage.getItem('customer_data');
      return customerData ? JSON.parse(customerData) : null;
    } catch {
      return null;
    }
  }

  /**
   * Get stored auth token
   */
  getStoredAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Check if customer is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getStoredAuthToken();
  }

  /**
   * Initialize authentication from stored data
   */
  initializeAuth(): void {
    const token = this.getStoredAuthToken();
    if (token) {
      apiClient.setAuthToken(token);
    }
  }
}

// Create singleton instance
export const customerService = new CustomerService();