import { useContext, useCallback, useMemo } from 'react';
import AuthContext from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import type { RegisterRequest } from '@/services/customerService';

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
    const u = user as unknown as Record<string, unknown>;
    const first =
      typeof u['firstName'] === 'string'
        ? (u['firstName'] as string)
        : typeof u['first_name'] === 'string'
        ? (u['first_name'] as string)
        : '';
    const last =
      typeof u['lastName'] === 'string'
        ? (u['lastName'] as string)
        : typeof u['last_name'] === 'string'
        ? (u['last_name'] as string)
        : '';
    if (first && last) return `${first} ${last}`;
    if (first) return first;
    return (u['email'] as string) || '';
  }, [user]);

  // Helper function to check if user profile is complete
  const isProfileComplete = useCallback(() => {
    if (!user) return false;
    const u = user as unknown as Record<string, unknown>;
    const first =
      typeof u['firstName'] === 'string' && (u['firstName'] as string).trim() !== ''
        ? (u['firstName'] as string)
        : typeof u['first_name'] === 'string' && (u['first_name'] as string).trim() !== ''
        ? (u['first_name'] as string)
        : '';
    const last =
      typeof u['lastName'] === 'string' && (u['lastName'] as string).trim() !== ''
        ? (u['lastName'] as string)
        : typeof u['last_name'] === 'string' && (u['last_name'] as string).trim() !== ''
        ? (u['last_name'] as string)
        : '';
    const email = typeof u['email'] === 'string' && (u['email'] as string).trim() !== '' ? (u['email'] as string) : '';
    return Boolean(first && last && email);
  }, [user]);

  // Helper function to get user initials for avatar
  const getUserInitials = useCallback(() => {
    if (!user) return '';
    const u = user as unknown as Record<string, unknown>;
    const first =
      typeof u['firstName'] === 'string'
        ? (u['firstName'] as string)
        : typeof u['first_name'] === 'string'
        ? (u['first_name'] as string)
        : '';
    const last =
      typeof u['lastName'] === 'string'
        ? (u['lastName'] as string)
        : typeof u['last_name'] === 'string'
        ? (u['last_name'] as string)
        : '';
    if (first && last) return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    if (first) return first.charAt(0).toUpperCase();
    const email = (u['email'] as string) || '';
    return email ? email.charAt(0).toUpperCase() : '';
  }, [user]);

  // Helper function to check if email is verified
  const isEmailVerified = useCallback(() => {
    const u = user as unknown as Record<string, unknown> | null;
    return Boolean((u && u['emailVerified']) ?? (u && u['email_verified']) ?? false);
  }, [user]);

  // Helper function to check if phone is verified
  const isPhoneVerified = useCallback(() => {
    const u = user as unknown as Record<string, unknown> | null;
    return Boolean((u && u['phoneVerified']) ?? (u && u['phone_verified']) ?? false);
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
    // customerService reads slug from TenantContext via AuthContext; no tenantId in payload
    return login({ ...credentials });
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
    // Transform camelCase to expected snake_case RegisterRequest
    const payload: RegisterRequest = {
      email: userData.email,
      password: userData.password,
      phone: userData.phone,
      first_name: userData.firstName,
      last_name: userData.lastName,
      acceptTerms: userData.acceptTerms,
      marketingOptIn: userData.acceptMarketing,
    };
    return register(payload);
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