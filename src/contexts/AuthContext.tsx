import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Customer, customerService, AuthResponse, LoginRequest, RegisterRequest } from '@/services/customerService';
import { useTenant } from './TenantContext';
import { useSessionManager } from '@/hooks/useSessionManager';
import { secureTokenStorage } from '@/services/secureTokenStorage';
import { jwtTokenManager } from '@/services/jwtTokenManager';

// Social login data interface
export interface SocialLoginData {
  accessToken: string;
  refreshToken: string;
  customer: Customer;
  expiresIn: number;
  provider: string;
}

// Auth Context Types
export interface AuthState {
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tenantId: string | null;
  // Session management state
  sessionRiskLevel: 'low' | 'medium' | 'high';
  isSessionValid: boolean;
  hasHighRiskEvents: boolean;
  isSessionExpiringSoon: boolean;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  socialLogin: (socialLoginData: SocialLoginData) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  updateProfile: (data: Partial<Customer>) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendEmailVerification: () => Promise<void>;
  // Session management methods
  validateSession: () => Promise<void>;
  updateActivity: () => void;
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
  
  const { tenant, isValidTenant, slug } = useTenant();
  const tenantId = tenant?.id || null;

  // Session management
  const {
    isSessionValid,
    sessionRiskLevel,
    hasHighRiskEvents,
    isSessionExpiringSoon,
    createSession,
    validateSession: validateSessionManager,
    terminateSession,
    updateActivity
  } = useSessionManager();

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Wait until storefront slug is available before initializing auth
        // Keep loading state true to prevent premature route guards
        if (!slug) {
          return;
        }

        // Ensure customer service has the current storefront slug
        try {
          customerService.setStorefrontSlug(slug);
        } catch (err) {
          console.warn('Failed to set storefront slug during auth init:', err);
        }

        // Initialize customer service with stored token
        await customerService.initializeAuth();
        
        // Check if user is authenticated
        if (customerService.isAuthenticated()) {
          try {
            // Fetch current customer profile
            const profile = await customerService.getProfile();
            setCustomer(profile);
            setIsAuthenticated(true);
            
            // Validate existing session if user is authenticated
            if (profile) {
              try {
                await validateSessionManager();
              } catch (sessionError) {
                console.warn('Session validation failed during initialization:', sessionError);
              }
            }
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
  }, [isValidTenant, slug]);

  // Session validation and monitoring
  useEffect(() => {
    if (!isAuthenticated) return;

    // Validate session every 5 minutes
    const sessionValidationInterval = setInterval(async () => {
      try {
        await validateSession();
      } catch (error) {
        console.warn('Periodic session validation failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Update activity on user interactions
    const updateActivityOnInteraction = () => {
      updateActivity();
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivityOnInteraction, { passive: true });
    });

    return () => {
      clearInterval(sessionValidationInterval);
      events.forEach(event => {
        document.removeEventListener(event, updateActivityOnInteraction);
      });
    };
  }, [isAuthenticated]);

  // Periodic validation: refresh only when needed
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        // Quick pre-check to avoid work when far from expiry
        if (!secureTokenStorage.isTokenExpiringSoon()) {
          return;
        }
        // Centralized validator handles refresh if required
        await jwtTokenManager.validateAndRefreshIfNeeded();
      } catch (error) {
        console.warn('Token validation/refresh failed:', error);
        await logout();
      }
    }, 10 * 60 * 1000); // Validate every 10 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Forced hourly refresh to keep tokens fresh even if far from expiry
  useEffect(() => {
    if (!isAuthenticated) return;

    const hourly = setInterval(async () => {
      try {
        await jwtTokenManager.refreshToken();
      } catch (error) {
        console.warn('Hourly token refresh failed:', error);
        await logout();
      }
    }, 60 * 60 * 1000); // Every hour

    return () => clearInterval(hourly);
  }, [isAuthenticated]);

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Ensure storefront slug is set for the service
      if (slug) {
        customerService.setStorefrontSlug(slug);
      }

      const authResponse: AuthResponse = await customerService.login(credentials);
      
      setCustomer(authResponse.customer);
      setIsAuthenticated(true);

      // Create secure session with device fingerprinting
      try {
        await createSession(authResponse.customer.id, {
          maxInactivity: 30 * 60 * 1000, // 30 minutes
          riskLevel: 'low'
        });
      } catch (sessionError) {
        console.warn('Failed to create session:', sessionError);
        // Continue with login even if session creation fails
      }
      
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

  const socialLogin = async (socialLoginData: SocialLoginData): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Persist tokens and customer data via secureTokenStorage
      const tokenData = {
        accessToken: socialLoginData.accessToken,
        refreshToken: socialLoginData.refreshToken,
        expiresAt: Date.now() + socialLoginData.expiresIn * 1000,
        tokenType: 'Bearer',
      };
      const customerData = {
        id: socialLoginData.customer.id,
        email: socialLoginData.customer.email,
        firstName: socialLoginData.customer.first_name,
        lastName: socialLoginData.customer.last_name,
        phone: socialLoginData.customer.phone || '',
        isEmailVerified: true,
      };

      await secureTokenStorage.storeTokens(tokenData, customerData);

      // Ensure storefront slug is set for the service and initialize auth
      if (slug) {
        customerService.setStorefrontSlug(slug);
      }
      await customerService.initializeAuth();
      
      setCustomer(socialLoginData.customer);
      setIsAuthenticated(true);

      // Create secure session with device fingerprinting
      try {
        await createSession(socialLoginData.customer.id, {
          maxInactivity: 30 * 60 * 1000, // 30 minutes
          riskLevel: 'low'
        });
      } catch (sessionError) {
        console.warn('Failed to create session:', sessionError);
        // Continue with social login even if session creation fails
      }
      
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
      const errorMessage = error instanceof Error ? error.message : 'Social login failed';
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

      // Ensure storefront slug is set for the service
      if (slug) {
        customerService.setStorefrontSlug(slug);
      }

      // Transform camelCase field names to snake_case for API compatibility
      const dataWithCamelCase = data as RegisterRequest & { firstName?: string; lastName?: string };
      const transformedData = {
        ...data,
        first_name: dataWithCamelCase.firstName || data.first_name,
        last_name: dataWithCamelCase.lastName || data.last_name,
      };

      // Remove camelCase fields if they exist
      if ('firstName' in transformedData) {
        delete (transformedData as RegisterRequest & { firstName?: string }).firstName;
      }
      if ('lastName' in transformedData) {
        delete (transformedData as RegisterRequest & { lastName?: string }).lastName;
      }

      const authResponse: AuthResponse = await customerService.register(transformedData);
      
      setCustomer(authResponse.customer);
      setIsAuthenticated(true);

      // Create secure session with device fingerprinting
      try {
        await createSession(authResponse.customer.id, {
          maxInactivity: 30 * 60 * 1000, // 30 minutes
          riskLevel: 'low'
        });
      } catch (sessionError) {
        console.warn('Failed to create session:', sessionError);
        // Continue with registration even if session creation fails
      }

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
      
      // Terminate session
      try {
        await terminateSession('User logout');
      } catch (sessionError) {
        console.warn('Failed to terminate session:', sessionError);
      }
      
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
      await customerService.verifyEmail({ token });
      
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
      if (!customer?.email) {
        throw new Error('No email available for verification');
      }
      await customerService.resendEmailVerification(customer.email);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification email';
      setError(errorMessage);
      throw error;
    }
  };

  const validateSession = async (): Promise<void> => {
    try {
      await validateSessionManager();
      updateActivity();
    } catch (error) {
      console.warn('Session validation failed:', error);
      // If session is invalid, logout the user
      if (isAuthenticated) {
        await logout();
      }
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
    // Session management state
    sessionRiskLevel,
    isSessionValid,
    hasHighRiskEvents,
    isSessionExpiringSoon,
    // Auth methods
    login,
    socialLogin,
    register,
    logout,
    refreshToken,
    clearError,
    updateProfile,
    requestPasswordReset,
    confirmPasswordReset,
    verifyEmail,
    resendEmailVerification,
    // Session management methods
    validateSession,
    updateActivity,
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