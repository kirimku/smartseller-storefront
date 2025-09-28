import { useContext, useCallback, useMemo } from 'react';
import AuthContext from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';

/**
 * Custom hook for authentication
 * Provides convenient access to auth context and additional utilities
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  const { tenant } = useTenant();

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const {
    customer: user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    requestPasswordReset,
    confirmPasswordReset,
    verifyEmail,
    resendEmailVerification: resendVerificationEmail,
    clearError,
  } = context;

  // Memoized user permissions based on tenant configuration
  const permissions = useMemo(() => {
    if (!user || !tenant) return {};

    return {
      canViewOrders: true, // Always available
      canManageAddresses: true, // Always available
      canUseLoyalty: tenant.features?.loyaltyProgram !== false,
      canUseWishlist: tenant.features?.wishlist !== false,
      canLeaveReviews: tenant.features?.productReviews !== false,
      canUseSocialLogin: tenant.features?.socialLogin !== false,
    };
  }, [user, tenant]);

  // Helper function to check if user has specific permission
  const hasPermission = useCallback((permission: keyof typeof permissions) => {
    return permissions[permission] || false;
  }, [permissions]);

  // Helper function to get user display name
  const getUserDisplayName = useCallback(() => {
    if (!user) return '';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    if (user.firstName) {
      return user.firstName;
    }
    
    return user.email;
  }, [user]);

  // Helper function to check if user profile is complete
  const isProfileComplete = useCallback(() => {
    if (!user) return false;
    
    const requiredFields = ['firstName', 'lastName', 'email'];
    
    return requiredFields.every(field => {
      const value = user[field as keyof typeof user];
      return value && value.toString().trim() !== '';
    });
  }, [user]);

  // Helper function to get user initials for avatar
  const getUserInitials = useCallback(() => {
    if (!user) return '';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    
    if (user.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    
    return user.email.charAt(0).toUpperCase();
  }, [user]);

  // Helper function to check if email is verified
  const isEmailVerified = useCallback(() => {
    return user?.emailVerified || false;
  }, [user]);

  // Helper function to check if phone is verified
  const isPhoneVerified = useCallback(() => {
    return user?.phoneVerified || false;
  }, [user]);

  // Helper function to get user's primary address
  const getPrimaryAddress = useCallback(() => {
    if (!user?.addresses) return null;
    
    return user.addresses.find(address => address.isDefault) || user.addresses[0] || null;
  }, [user]);

  // Helper function to check if user needs to verify email
  const needsEmailVerification = useCallback(() => {
    if (!user) return false;
    
    // Always require email verification for security
    return !isEmailVerified();
  }, [user, isEmailVerified]);

  // Helper function to check if user needs to complete profile
  const needsProfileCompletion = useCallback(() => {
    if (!user) return false;
    
    return !isProfileComplete();
  }, [user, isProfileComplete]);

  // Enhanced login with tenant-specific features
  const loginWithTenant = useCallback(async (credentials: { email: string; password: string; rememberMe?: boolean }) => {
    if (!tenant) {
      throw new Error('Tenant not loaded');
    }
    
    return login({ ...credentials, tenantId: tenant.id });
  }, [login, tenant]);

  // Enhanced register with tenant-specific features
  const registerWithTenant = useCallback(async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    acceptTerms: boolean;
    acceptMarketing?: boolean;
  }) => {
    if (!tenant) {
      throw new Error('Tenant not loaded');
    }
    
    return register(userData);
  }, [register, tenant]);

  return {
    // Core auth state
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Core auth actions
    login: loginWithTenant,
    register: registerWithTenant,
    logout,
    refreshToken,
    updateProfile,
    requestPasswordReset,
    confirmPasswordReset,
    verifyEmail,
    resendVerificationEmail,
    clearError,
    
    // User permissions
    permissions,
    hasPermission,
    
    // User helpers
    getUserDisplayName,
    getUserInitials,
    isProfileComplete,
    isEmailVerified,
    isPhoneVerified,
    getPrimaryAddress,
    
    // Status checks
    needsEmailVerification,
    needsProfileCompletion,
    
    // Tenant context
    tenant,
  };
};

export default useAuth;