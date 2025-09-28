import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Customer, customerService, AuthResponse, LoginRequest, RegisterRequest } from '@/services/customerService';
import { useTenant } from './TenantContext';

// Auth Context Types
export interface AuthState {
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tenantId: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  updateProfile: (data: Partial<Customer>) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendEmailVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { tenant, isValidTenant } = useTenant();
  const tenantId = tenant?.id || null;

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Only initialize if we have a valid tenant
        if (!isValidTenant || !tenantId) {
          setIsLoading(false);
          return;
        }

        // Initialize customer service with stored token
        customerService.initializeAuth();
        
        // Check if user is authenticated
        if (customerService.isAuthenticated()) {
          try {
            // Fetch current customer profile
            const profile = await customerService.getProfile();
            setCustomer(profile);
            setIsAuthenticated(true);
          } catch (error) {
            // Token might be expired, clear auth data
            console.warn('Failed to fetch profile, clearing auth data:', error);
            await logout();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError(error instanceof Error ? error.message : 'Authentication initialization failed');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [isValidTenant, tenantId]);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        await customerService.refreshToken();
      } catch (error) {
        console.warn('Token refresh failed:', error);
        await logout();
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!tenantId) {
        throw new Error('Tenant not available');
      }

      // Add tenant context to login request
      const tenantAwareCredentials = {
        ...credentials,
        tenantId,
      };

      const authResponse: AuthResponse = await customerService.login(tenantAwareCredentials);
      
      setCustomer(authResponse.customer);
      setIsAuthenticated(true);
      
      // Merge guest cart if exists
      const guestCartId = localStorage.getItem('guest_cart_id');
      if (guestCartId) {
        try {
          // Import cart service dynamically to avoid circular dependency
          const { cartService } = await import('@/services/cartService');
          await cartService.mergeCart(guestCartId);
          localStorage.removeItem('guest_cart_id');
        } catch (error) {
          console.warn('Failed to merge guest cart:', error);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!tenantId) {
        throw new Error('Tenant not available');
      }

      // Add tenant context to registration request
      const tenantAwareData = {
        ...data,
        tenantId,
      };

      const authResponse: AuthResponse = await customerService.register(tenantAwareData);
      
      setCustomer(authResponse.customer);
      setIsAuthenticated(true);

      // Merge guest cart if exists
      const guestCartId = localStorage.getItem('guest_cart_id');
      if (guestCartId) {
        try {
          const { cartService } = await import('@/services/cartService');
          await cartService.mergeCart(guestCartId);
          localStorage.removeItem('guest_cart_id');
        } catch (error) {
          console.warn('Failed to merge guest cart:', error);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await customerService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCustomer(null);
      setIsAuthenticated(false);
      setError(null);
      setIsLoading(false);
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const authResponse = await customerService.refreshToken();
      setCustomer(authResponse.customer);
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
      throw error;
    }
  };

  const updateProfile = async (data: Partial<Customer>): Promise<void> => {
    try {
      setError(null);
      const updatedCustomer = await customerService.updateProfile(data);
      setCustomer(updatedCustomer);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      setError(errorMessage);
      throw error;
    }
  };

  const requestPasswordReset = async (email: string): Promise<void> => {
    try {
      setError(null);
      await customerService.requestPasswordReset({ email });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset request failed';
      setError(errorMessage);
      throw error;
    }
  };

  const confirmPasswordReset = async (token: string, newPassword: string): Promise<void> => {
    try {
      setError(null);
      await customerService.confirmPasswordReset({ token, newPassword });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      setError(errorMessage);
      throw error;
    }
  };

  const verifyEmail = async (token: string): Promise<void> => {
    try {
      setError(null);
      await customerService.verifyEmail(token);
      
      // Refresh customer profile to update verification status
      if (isAuthenticated) {
        const updatedProfile = await customerService.getProfile();
        setCustomer(updatedProfile);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Email verification failed';
      setError(errorMessage);
      throw error;
    }
  };

  const resendEmailVerification = async (): Promise<void> => {
    try {
      setError(null);
      await customerService.resendEmailVerification();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification email';
      setError(errorMessage);
      throw error;
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  const contextValue: AuthContextType = {
    customer,
    isAuthenticated,
    isLoading,
    error,
    tenantId,
    login,
    register,
    logout,
    refreshToken,
    clearError,
    updateProfile,
    requestPasswordReset,
    confirmPasswordReset,
    verifyEmail,
    resendEmailVerification,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;