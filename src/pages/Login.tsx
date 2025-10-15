import React from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import CustomerLogin from '@/components/auth/CustomerLogin';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Home, CheckCircle } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { tenant } = useTenant();
  
  const isVerified = searchParams.get('verified') === 'true';

  // Compute intended redirect target (decoded and validated)
  const redirectTarget = React.useMemo(() => {
    const raw = searchParams.get('redirect');
    if (!raw) return null;
    try {
      const decoded = decodeURIComponent(raw);
      return decoded.startsWith('/') ? decoded : null;
    } catch {
      return raw.startsWith('/') ? raw : null;
    }
  }, [searchParams]);

  // Redirect if already authenticated: honor intended redirect if present
  React.useEffect(() => {
    if (isAuthenticated) {
      const target = redirectTarget || '/profile';
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, redirectTarget, navigate]);

  const handleLoginSuccess = () => {
    // Honor redirect parameter after successful login
    const target = redirectTarget || '/profile';
    navigate(target, { replace: true });
  };

  const handleSwitchToRegister = () => {
    // Navigate to register page
    navigate('/register');
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password functionality
    console.log('Forgot password clicked');
  };

  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              
              <div className="h-6 w-px bg-border" />
              
              <Link to="/" className="flex items-center space-x-2 hover:opacity-80">
                <Home className="h-4 w-4" />
                <span className="font-medium">
                  {tenant?.branding.storeName || 'Store'}
                </span>
              </Link>
            </div>

            <Link to="/register">
              <Button variant="outline" size="sm">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            {/* Email Verification Success Message */}
            {isVerified && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Email verified successfully! You can now sign in to your account.
                </AlertDescription>
              </Alert>
            )}
            
            <CustomerLogin
              onSuccess={handleLoginSuccess}
              onSwitchToRegister={handleSwitchToRegister}
              onForgotPassword={handleForgotPassword}
              showSocialLogin={true}
            />

            {/* Additional Information */}
            <div className="mt-8 text-center">
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Welcome back!</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Access your order history</li>
                  <li>• Track your loyalty points</li>
                  <li>• Manage your preferences</li>
                  <li>• Get personalized recommendations</li>
                  <li>• Enjoy faster checkout</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="text-sm text-muted-foreground">
              © 2024 {tenant?.branding.storeName || 'Store'}. All rights reserved.
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-muted-foreground hover:text-foreground">
                Terms of Service
              </Link>
              <Link to="/support" className="text-muted-foreground hover:text-foreground">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;