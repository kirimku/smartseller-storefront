import React from 'react';
import { Loader2 } from 'lucide-react';

interface TenantLoaderProps {
  message?: string;
}

export const TenantLoader: React.FC<TenantLoaderProps> = ({ 
  message = "Loading storefront..." 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            {message}
          </h2>
          <p className="text-sm text-muted-foreground">
            Please wait while we prepare your shopping experience
          </p>
        </div>
      </div>
    </div>
  );
};

interface TenantErrorProps {
  error: string;
  subdomain?: string | null;
  onRetry?: () => void;
}

export const TenantError: React.FC<TenantErrorProps> = ({ 
  error, 
  subdomain, 
  onRetry 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Storefront Not Found
          </h1>
          <p className="text-muted-foreground">
            {subdomain 
              ? `The storefront "${subdomain}" could not be found or is not available.`
              : "No valid storefront was detected."
            }
          </p>
        </div>
        
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive font-medium">
            Error: {error}
          </p>
        </div>
        
        <div className="space-y-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          )}
          
          <div className="text-sm text-muted-foreground">
            <p>If you believe this is an error, please contact support.</p>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-2 p-2 bg-muted rounded text-xs">
                <strong>Development Mode:</strong> Try adding ?tenant=rexus or ?tenant=techstore to the URL
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};