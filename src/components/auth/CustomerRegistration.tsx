import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useOAuth } from '@/hooks/useOAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { passwordSecurity, type PasswordStrengthResult } from '@/services/passwordSecurity';
import { handleRegistrationError } from '@/services/errorHandling';
// Address fields moved to WarrantyRegister; remove AddressPicker from account registration

interface CustomerRegistrationProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  showSocialLogin?: boolean;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  marketingOptIn: boolean;
}

const CustomerRegistration: React.FC<CustomerRegistrationProps> = ({
  onSuccess,
  onSwitchToLogin,
  showSocialLogin = true,
}) => {
  const { register, isLoading, error, clearError } = useAuth();
  const { tenant } = useTenant();
  const { initiateLogin, isLoading: oauthLoading, error: oauthError, clearError: clearOAuthError } = useOAuth();
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    marketingOptIn: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthResult | null>(null);
  const [isCheckingBreach, setIsCheckingBreach] = useState(false);
  const [breachCheckResult, setBreachCheckResult] = useState<{ isBreached: boolean; recommendation: string } | null>(null);

  // Enhanced password validation with security checks
  const validatePasswordSecurity = async (password: string) => {
    if (!password) {
      setPasswordStrength(null);
      setBreachCheckResult(null);
      return;
    }

    // Analyze password strength
    const strength = passwordSecurity.analyzePasswordStrength(password);
    setPasswordStrength(strength);

    // Check for breaches (debounced)
    if (password.length >= 8) {
      setIsCheckingBreach(true);
      try {
        const breachResult = await passwordSecurity.checkPasswordBreach(password);
        setBreachCheckResult(breachResult);
      } catch (error) {
        console.warn('Breach check failed:', error);
        setBreachCheckResult(null);
      } finally {
        setIsCheckingBreach(false);
      }
    } else {
      setBreachCheckResult(null);
    }
  };

  // Debounce password validation to avoid excessive API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.password) {
        validatePasswordSecurity(formData.password);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.password]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.phone) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+62\d{8,13}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid Indonesian phone number (e.g., +628985276363)';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (passwordStrength && passwordStrength.score < 70) {
      errors.password = 'Password does not meet security requirements';
    } else if (breachCheckResult?.isBreached) {
      errors.password = 'This password has been found in data breaches. Please choose a different password.';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.acceptTerms) {
      errors.acceptTerms = 'You must accept the terms and conditions';
    }

    // Address validation removed from account registration; handled in WarrantyRegister

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    clearError();

    try {
      await register({
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        acceptTerms: formData.acceptTerms,
        marketingOptIn: formData.marketingOptIn,
      });
      
      onSuccess?.();
    } catch (error) {
      // Use centralized error handling
      handleRegistrationError(error, formData.email);
    }
  };

  // Format Indonesian phone numbers with +62 prefix
  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // If empty, return empty
    if (!digitsOnly) return '';
    
    // Handle different input formats
    if (digitsOnly.startsWith('62')) {
      // Already has country code (62), just add +
      return `+${digitsOnly}`;
    } else if (digitsOnly.startsWith('0')) {
      // Remove leading 0 and add +62
      return `+62${digitsOnly.substring(1)}`;
    } else if (digitsOnly.startsWith('8')) {
      // Starts with 8 (common Indonesian mobile format), add +62
      return `+62${digitsOnly}`;
    } else {
      // For other formats, assume it needs +62 prefix
      return `+62${digitsOnly}`;
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    let processedValue = value;
    
    // Format phone number if it's the phone field
    if (field === 'phone' && typeof value === 'string') {
      processedValue = formatPhoneNumber(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Password validation is handled by useEffect with debouncing
  };

  const handleSocialLogin = async (provider: string) => {
    try {
      clearError();
      clearOAuthError();
      await initiateLogin(provider);
      // The OAuth flow will redirect to the callback page
      // and then back to the success handler
    } catch (error) {
      // Use centralized error handling for social login
      handleRegistrationError(error, formData.email);
    }
  };

  const getPasswordStrengthColor = (level: PasswordStrengthResult['level']) => {
    switch (level) {
      case 'very-weak':
      case 'weak':
        return 'bg-red-500';
      case 'fair':
        return 'bg-orange-500';
      case 'good':
        return 'bg-yellow-500';
      case 'strong':
        return 'bg-green-500';
      case 'very-strong':
        return 'bg-emerald-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getPasswordStrengthText = (level: PasswordStrengthResult['level']) => {
    switch (level) {
      case 'very-weak':
        return 'Very Weak';
      case 'weak':
        return 'Weak';
      case 'fair':
        return 'Fair';
      case 'good':
        return 'Good';
      case 'strong':
        return 'Strong';
      case 'very-strong':
        return 'Very Strong';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Create account
        </CardTitle>
        <CardDescription className="text-center">
          Join {tenant?.branding.storeName || 'our store'} today
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {(error || oauthError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || oauthError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  type="text"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`pl-10 ${validationErrors.firstName ? 'border-destructive' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {validationErrors.firstName && (
                <p className="text-sm text-destructive">{validationErrors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`pl-10 ${validationErrors.lastName ? 'border-destructive' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {validationErrors.lastName && (
                <p className="text-sm text-destructive">{validationErrors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`pl-10 ${validationErrors.email ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
            </div>
            {validationErrors.email && (
              <p className="text-sm text-destructive">{validationErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="08985276363"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`pl-10 ${validationErrors.phone ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
            </div>
            {validationErrors.phone && (
              <p className="text-sm text-destructive">{validationErrors.phone}</p>
            )}
        </div>

          {/* Address inputs removed; these belong to WarrantyRegister now */}

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`pl-10 pr-10 ${validationErrors.password ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {formData.password && (
              <div className="space-y-3">
                {/* Password Strength Indicator */}
                {passwordStrength && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getPasswordStrengthColor(passwordStrength.level)}`}
                          style={{ width: `${passwordStrength.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {getPasswordStrengthText(passwordStrength.level)}
                      </span>
                    </div>
                    
                    {/* Estimated crack time */}
                    <p className="text-xs text-muted-foreground">
                      Estimated crack time: {passwordStrength.estimatedCrackTime}
                    </p>
                    
                    {/* Security feedback */}
                    {passwordStrength.feedback.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-1">Suggestions:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {passwordStrength.feedback.map((feedback, index) => (
                            <li key={index} className="text-xs">{feedback}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Requirements checklist */}
                    <div className="space-y-1">
                      {passwordStrength.requirements.map((req) => (
                        <div key={req.id} className="flex items-center space-x-2 text-xs">
                          {req.met ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className={req.met ? 'text-green-600' : 'text-muted-foreground'}>
                            {req.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Breach check indicator */}
                {isCheckingBreach && (
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <LoadingSpinner size="sm" />
                    <span>Checking password security...</span>
                  </div>
                )}
                
                {breachCheckResult && (
                  <div className={`flex items-center space-x-2 text-xs ${
                    breachCheckResult.isBreached ? 'text-red-600' : 'text-green-600'
                  }`}>
                    <Shield className="h-3 w-3" />
                    <span>{breachCheckResult.recommendation}</span>
                  </div>
                )}
              </div>
            )}
            
            {validationErrors.password && (
              <p className="text-sm text-destructive">{validationErrors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`pl-10 pr-10 ${validationErrors.confirmPassword ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <CheckCircle className="absolute right-10 top-3 h-4 w-4 text-green-500" />
              )}
            </div>
            {validationErrors.confirmPassword && (
              <p className="text-sm text-destructive">{validationErrors.confirmPassword}</p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="acceptTerms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => handleInputChange('acceptTerms', checked as boolean)}
                disabled={isLoading}
                className={validationErrors.acceptTerms ? 'border-destructive' : ''}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="acceptTerms" className="text-sm">
                  I agree to the{' '}
                  <a href="/terms" className="text-primary hover:underline" target="_blank">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-primary hover:underline" target="_blank">
                    Privacy Policy
                  </a>
                </Label>
                {validationErrors.acceptTerms && (
                  <p className="text-sm text-destructive">{validationErrors.acceptTerms}</p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="marketingOptIn"
                checked={formData.marketingOptIn}
                onCheckedChange={(checked) => handleInputChange('marketingOptIn', checked as boolean)}
                disabled={isLoading}
              />
              <Label htmlFor="marketingOptIn" className="text-sm">
                I want to receive promotional emails and updates about new products
              </Label>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </form>

        {showSocialLogin && tenant?.features.socialLogin && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading || oauthLoading}
                className="w-full"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('facebook')}
                disabled={isLoading || oauthLoading}
                className="w-full"
              >
                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
            </div>
          </>
        )}
      </CardContent>

      {onSwitchToLogin && (
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-primary hover:underline font-medium"
              disabled={isLoading}
            >
              Sign in
            </button>
          </p>
        </CardFooter>
      )}
    </Card>
  );
};

export default CustomerRegistration;