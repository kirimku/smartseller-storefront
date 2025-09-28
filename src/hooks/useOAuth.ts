import { useState, useCallback, useEffect } from 'react';
import { oauthService, OAuthProvider, SocialLoginResponse } from '../services/oauthService';

export interface UseOAuthReturn {
  // State
  isLoading: boolean;
  error: string | null;
  configuredProviders: OAuthProvider[];
  
  // Actions
  initiateLogin: (providerId: string) => Promise<void>;
  handleCallback: (providerId: string, code: string, state: string) => Promise<SocialLoginResponse>;
  clearError: () => void;
  
  // Utilities
  isProviderConfigured: (providerId: string) => boolean;
}

export const useOAuth = (): UseOAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configuredProviders, setConfiguredProviders] = useState<OAuthProvider[]>([]);

  // Load configured providers on mount
  useEffect(() => {
    try {
      const providers = oauthService.getConfiguredProviders();
      setConfiguredProviders(providers);
    } catch (err) {
      console.error('Failed to load OAuth providers:', err);
      setError('Failed to load social login providers');
    }
  }, []);

  /**
   * Initiate OAuth login flow
   */
  const initiateLogin = useCallback(async (providerId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!oauthService.isProviderConfigured(providerId)) {
        throw new Error(`${providerId} is not configured`);
      }

      // This will redirect the user to the OAuth provider
      oauthService.initiateOAuthFlow(providerId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate social login';
      setError(errorMessage);
      console.error('OAuth initiation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle OAuth callback after user returns from provider
   */
  const handleCallback = useCallback(async (
    providerId: string,
    code: string,
    state: string
  ): Promise<SocialLoginResponse> => {
    try {
      setIsLoading(true);
      setError(null);

      const loginResponse = await oauthService.handleOAuthCallback(providerId, code, state);
      return loginResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Social login failed';
      setError(errorMessage);
      console.error('OAuth callback error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Check if a provider is configured
   */
  const isProviderConfigured = useCallback((providerId: string): boolean => {
    return oauthService.isProviderConfigured(providerId);
  }, []);

  return {
    // State
    isLoading,
    error,
    configuredProviders,
    
    // Actions
    initiateLogin,
    handleCallback,
    clearError,
    
    // Utilities
    isProviderConfigured,
  };
};

export default useOAuth;