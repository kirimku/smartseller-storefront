import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useOAuth } from '../../hooks/useOAuth';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';

export const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const { socialLogin } = useAuth();
  const { handleCallback } = useOAuth();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        if (!provider) {
          throw new Error('OAuth provider not specified');
        }

        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Check for OAuth errors
        if (errorParam) {
          throw new Error(errorDescription || `OAuth error: ${errorParam}`);
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state parameter');
        }

        // Handle OAuth callback
        const loginResponse = await handleCallback(provider, code, state);

        // Use the socialLogin method from AuthContext
        await socialLogin({
          accessToken: loginResponse.accessToken,
          refreshToken: loginResponse.refreshToken,
          customer: loginResponse.customer,
          expiresIn: loginResponse.expiresIn,
          provider: provider
        });

        setStatus('success');
        
        // Redirect to dashboard or intended page after a short delay
        setTimeout(() => {
          const redirectTo = sessionStorage.getItem('oauth_redirect_after_login') || '/';
          sessionStorage.removeItem('oauth_redirect_after_login');
          navigate(redirectTo, { replace: true });
        }, 2000);

      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setStatus('error');
      }
    };

    processCallback();
  }, [provider, searchParams, handleCallback, socialLogin, navigate]);

  const handleRetry = () => {
    navigate('/login', { replace: true });
  };

  const getProviderName = (providerId: string | undefined) => {
    switch (providerId) {
      case 'google':
        return 'Google';
      case 'facebook':
        return 'Facebook';
      case 'apple':
        return 'Apple';
      default:
        return 'Social';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {status === 'loading' && 'Completing Sign In'}
            {status === 'success' && 'Sign In Successful'}
            {status === 'error' && 'Sign In Failed'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {status === 'loading' && `Processing your ${getProviderName(provider)} authentication...`}
            {status === 'success' && 'You have been successfully signed in. Redirecting...'}
            {status === 'error' && 'There was a problem with your authentication.'}
          </p>
        </div>

        <div className="flex flex-col items-center space-y-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
              <div className="text-sm text-gray-500">
                Please wait while we complete your sign in...
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-sm text-gray-500">
                Redirecting you to your dashboard...
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-4 rounded-md text-center max-w-sm">
                  {error}
                </div>
              )}
              <Button
                onClick={handleRetry}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>

        {status === 'loading' && (
          <div className="text-center">
            <div className="text-xs text-gray-400">
              This may take a few moments. Please don't close this window.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;