import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import CustomerRegistration from '@/components/auth/CustomerRegistration';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { tenant } = useTenant();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile');
    }
  }, [isAuthenticated, navigate]);

  const handleRegistrationSuccess = () => {
    // Redirect to profile page after successful registration
    navigate('/profile');
  };

  const handleSwitchToLogin = () => {
    // Navigate to login page (we'll need to create this route too)
    navigate('/login');
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

            <Link to="/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="w-full max-w-md">
            {/* Welcome Message */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome to {tenant?.branding.storeName || 'Our Store'}
              </h1>
              <p className="text-muted-foreground mt-2">
                Create your account to start shopping and enjoy exclusive benefits
              </p>
            </div>

            {/* Registration Form */}
            <CustomerRegistration
              onSuccess={handleRegistrationSuccess}
              onSwitchToLogin={handleSwitchToLogin}
              showSocialLogin={true}
            />

            {/* Additional Information */}
            <div className="mt-8 text-center">
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Why create an account?</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Track your orders and delivery status</li>
                  <li>• Save your favorite products</li>
                  <li>• Earn and redeem loyalty points</li>
                  <li>• Get exclusive offers and early access</li>
                  <li>• Faster checkout with saved addresses</li>
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
              <Link to="/terms" className="text-muted-foreground hover:text-foreground">
                Terms of Service
              </Link>
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground">
                Privacy Policy
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

export default Register;