import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import EmailVerification from './EmailVerification';
import { useTenant } from '@/contexts/TenantContext';

const EmailVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { tenant } = useTenant();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const mode = searchParams.get('mode') as 'verify' | 'resend' || 'resend';

  const handleSuccess = () => {
    // Redirect to login or dashboard after successful verification
    navigate('/login?verified=true');
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {mode === 'verify' 
              ? 'Verify your email address to complete registration'
              : 'Resend verification email to your inbox'
            }
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <EmailVerification
              mode={mode}
              email={email || ''}
              token={token || ''}
              onSuccess={handleSuccess}
              onBackToLogin={handleBackToLogin}
              showBackButton={true}
            />
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={handleBackToLogin}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;