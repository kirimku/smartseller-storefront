import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  AlertCircle, 
  Mail, 
  Clock, 
  RefreshCw,
  ArrowLeft,
  Shield
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { handleEmailVerificationError } from '@/services/errorHandling';

interface EmailVerificationProps {
  mode?: 'verify' | 'resend';
  email?: string;
  token?: string;
  onSuccess?: () => void;
  onBackToLogin?: () => void;
  showBackButton?: boolean;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({
  mode = 'resend',
  email: initialEmail = '',
  token: initialToken = '',
  onSuccess,
  onBackToLogin,
  showBackButton = true,
}) => {
  const { verifyEmail, resendEmailVerification, isLoading, error, clearError, customer } = useAuth();
  const { tenant } = useTenant();
  
  const [currentMode, setCurrentMode] = useState(mode);
  const [email, setEmail] = useState(initialEmail || customer?.email || '');
  const [token, setToken] = useState(initialToken);
  const [isVerified, setIsVerified] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Handle URL token verification on mount
  useEffect(() => {
    if (initialToken && currentMode === 'verify') {
      handleVerifyEmail(initialToken);
    }
  }, [initialToken, currentMode]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const validateEmail = (emailValue: string): boolean => {
    if (!emailValue) {
      setValidationError('Email is required');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(emailValue)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    
    setValidationError('');
    return true;
  };

  const handleVerifyEmail = async (verificationToken: string) => {
    try {
      clearError();
      await verifyEmail(verificationToken);
      setIsVerified(true);
      onSuccess?.();
    } catch (error) {
      // Use centralized error handling
      handleEmailVerificationError(error, email);
    }
  };

  const handleResendVerification = async () => {
    if (!validateEmail(email)) {
      setValidationError('Please enter a valid email address');
      return;
    }

    try {
      clearError();
      setValidationError('');
      await resendEmailVerification();
      setIsEmailSent(true);
      setResendCooldown(60); // 60 seconds cooldown
    } catch (err) {
      // Use centralized error handling
      handleEmailVerificationError(err, email);
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token.trim()) {
      setValidationError('Verification code is required');
      return;
    }

    await handleVerifyEmail(token);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (validationError) {
      setValidationError('');
    }
  };

  // Success state
  if (isVerified) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">
            Email Verified!
          </CardTitle>
          <CardDescription>
            Your email address has been successfully verified.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              You can now access all features of your account.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center">
          <Button onClick={onSuccess || onBackToLogin} className="w-full">
            Continue
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Email sent confirmation state
  if (isEmailSent && currentMode === 'resend') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Check your email
          </CardTitle>
          <CardDescription>
            We've sent a verification link to {email}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Next steps:</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Check your email inbox</li>
                  <li>• Look for an email from {tenant?.branding.storeName || 'us'}</li>
                  <li>• Click the verification link in the email</li>
                  <li>• If you don't see it, check your spam folder</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email?
            </p>
            <Button
              variant="outline"
              onClick={() => setIsEmailSent(false)}
              disabled={resendCooldown > 0}
              className="w-full"
            >
              {resendCooldown > 0 ? (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Resend in {resendCooldown}s
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Send again
                </>
              )}
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => setCurrentMode('verify')}
              className="w-full"
            >
              I have a verification code
            </Button>
          </div>
        </CardContent>

        {showBackButton && onBackToLogin && (
          <CardFooter className="flex justify-center">
            <button
              onClick={onBackToLogin}
              className="flex items-center text-sm text-primary hover:underline"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to sign in
            </button>
          </CardFooter>
        )}
      </Card>
    );
  }

  // Main verification form
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">
          {currentMode === 'verify' ? 'Verify your email' : 'Email verification required'}
        </CardTitle>
        <CardDescription>
          {currentMode === 'verify' 
            ? 'Enter the verification code sent to your email'
            : 'We need to verify your email address to secure your account'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {currentMode === 'verify' ? (
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Verification Code</Label>
              <Input
                id="token"
                type="text"
                placeholder="Enter verification code"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className={validationError ? 'border-destructive' : ''}
                disabled={isLoading}
              />
              {validationError && (
                <p className="text-sm text-destructive">{validationError}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCurrentMode('resend')}
                disabled={isLoading}
              >
                Need a new code?
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={`pl-10 ${validationError ? 'border-destructive' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {validationError && (
                <p className="text-sm text-destructive">{validationError}</p>
              )}
            </div>

            <Button
              onClick={handleResendVerification}
              className="w-full"
              disabled={isLoading || resendCooldown > 0}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Resend in {resendCooldown}s
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send verification email
                </>
              )}
            </Button>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => setCurrentMode('verify')}
                disabled={isLoading}
              >
                I have a verification code
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {showBackButton && onBackToLogin && (
        <CardFooter className="flex justify-center">
          <button
            onClick={onBackToLogin}
            className="flex items-center text-sm text-primary hover:underline"
            disabled={isLoading}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to sign in
          </button>
        </CardFooter>
      )}
    </Card>
  );
};

export default EmailVerification;