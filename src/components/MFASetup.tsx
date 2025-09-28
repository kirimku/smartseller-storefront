import React, { useState, useEffect } from 'react';
import { useMFA } from '@/hooks/useMFA';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Shield, 
  ShieldCheck, 
  Smartphone, 
  MessageSquare, 
  QrCode, 
  Copy, 
  Check, 
  AlertTriangle, 
  RefreshCw,
  Eye,
  EyeOff,
  Download,
  Key
} from 'lucide-react';

interface MFASetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

type SetupStep = 'choose' | 'totp-setup' | 'totp-verify' | 'sms-setup' | 'sms-verify' | 'backup-codes' | 'complete';

export const MFASetup: React.FC<MFASetupProps> = ({ onComplete, onCancel }) => {
  const { customer } = useAuth();
  const {
    totpConfig,
    smsConfig,
    backupCodes,
    setupTOTP,
    setupSMS,
    verifyTOTP,
    verifySMS,
    sendSMSCode,
    isLoading,
    error,
    clearError,
    verificationResult,
    clearVerificationResult
  } = useMFA();

  const [currentStep, setCurrentStep] = useState<SetupStep>('choose');
  const [selectedMethod, setSelectedMethod] = useState<'totp' | 'sms' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [qrCodeCopied, setQrCodeCopied] = useState(false);
  const [backupCodesCopied, setBackupCodesCopied] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  useEffect(() => {
    if (verificationResult?.isValid) {
      if (selectedMethod === 'totp') {
        setCurrentStep('backup-codes');
      } else if (selectedMethod === 'sms') {
        setCurrentStep('complete');
      }
      clearVerificationResult();
    }
  }, [verificationResult, selectedMethod, clearVerificationResult]);

  const handleMethodSelect = (method: 'totp' | 'sms') => {
    setSelectedMethod(method);
    clearError();
    
    if (method === 'totp') {
      setCurrentStep('totp-setup');
      handleTOTPSetup();
    } else {
      setCurrentStep('sms-setup');
    }
  };

  const handleTOTPSetup = async () => {
    if (!customer?.id) return;
    
    try {
      await setupTOTP(customer.id, 'SmartSeller');
      setCurrentStep('totp-verify');
    } catch (error) {
      console.error('TOTP setup failed:', error);
    }
  };

  const handleSMSSetup = async () => {
    if (!customer?.id || !phoneNumber.trim()) return;
    
    try {
      await setupSMS(customer.id, phoneNumber);
      setCurrentStep('sms-verify');
    } catch (error) {
      console.error('SMS setup failed:', error);
    }
  };

  const handleTOTPVerification = async () => {
    if (!customer?.id || !verificationCode.trim()) return;
    
    try {
      await verifyTOTP(customer.id, verificationCode);
    } catch (error) {
      console.error('TOTP verification failed:', error);
    }
  };

  const handleSMSVerification = async () => {
    if (!customer?.id || !verificationCode.trim()) return;
    
    try {
      await verifySMS(customer.id, verificationCode);
    } catch (error) {
      console.error('SMS verification failed:', error);
    }
  };

  const handleResendSMS = async () => {
    if (!customer?.id) return;
    
    try {
      await sendSMSCode(customer.id);
      setVerificationCode('');
    } catch (error) {
      console.error('Failed to resend SMS:', error);
    }
  };

  const copyToClipboard = async (text: string, type: 'qr' | 'backup') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'qr') {
        setQrCodeCopied(true);
        setTimeout(() => setQrCodeCopied(false), 2000);
      } else {
        setBackupCodesCopied(true);
        setTimeout(() => setBackupCodesCopied(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const downloadBackupCodes = () => {
    const content = `SmartSeller MFA Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\nUser: ${customer?.email}\n\nBackup Codes:\n${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}\n\nImportant:\n- Keep these codes safe and secure\n- Each code can only be used once\n- Use these codes if you lose access to your authenticator app\n- Generate new codes if you suspect they have been compromised`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartseller-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleComplete = () => {
    setCurrentStep('complete');
    if (onComplete) {
      onComplete();
    }
  };

  const renderChooseMethod = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enable Two-Factor Authentication</h2>
        <p className="text-gray-600">Choose your preferred authentication method to secure your account</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => handleMethodSelect('totp')}
          className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
        >
          <div className="flex items-center gap-4 mb-3">
            <Smartphone className="w-8 h-8 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Authenticator App</h3>
          </div>
          <p className="text-gray-600 text-sm mb-3">
            Use an authenticator app like Google Authenticator, Authy, or 1Password to generate time-based codes.
          </p>
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Most secure option</span>
          </div>
        </button>

        <button
          onClick={() => handleMethodSelect('sms')}
          className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
        >
          <div className="flex items-center gap-4 mb-3">
            <MessageSquare className="w-8 h-8 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900">SMS Text Message</h3>
          </div>
          <p className="text-gray-600 text-sm mb-3">
            Receive verification codes via SMS text messages to your mobile phone.
          </p>
          <div className="flex items-center gap-2 text-blue-600 text-sm">
            <Smartphone className="w-4 h-4" />
            <span>Easy to use</span>
          </div>
        </button>
      </div>
    </div>
  );

  const renderTOTPSetup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <QrCode className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Set up Authenticator App</h2>
        <p className="text-gray-600">Scan the QR code with your authenticator app</p>
      </div>

      {totpConfig && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center">
            <div className="bg-gray-100 p-4 rounded-lg mb-4 inline-block">
              {/* QR Code would be generated here - for demo, showing placeholder */}
              <div className="w-48 h-48 bg-gray-200 flex items-center justify-center rounded-lg">
                <QrCode className="w-16 h-16 text-gray-400" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Scan this QR code with your authenticator app, or manually enter the setup key below:
            </p>
            <div className="bg-gray-50 p-3 rounded-lg border">
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono text-gray-800 break-all">{totpConfig.secret}</code>
                <button
                  onClick={() => copyToClipboard(totpConfig.secret, 'qr')}
                  className="ml-2 p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Copy setup key"
                >
                  {qrCodeCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setCurrentStep('totp-verify')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              I've Added the Account
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderTOTPVerify = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Key className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Authenticator App</h2>
        <p className="text-gray-600">Enter the 6-digit code from your authenticator app</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="totp-code" className="block text-sm font-medium text-gray-700 mb-2">
            Verification Code
          </label>
          <input
            id="totp-code"
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl font-mono tracking-widest"
            maxLength={6}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setCurrentStep('totp-setup')}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleTOTPVerification}
            disabled={verificationCode.length !== 6 || isLoading}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSMSSetup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <MessageSquare className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Set up SMS Authentication</h2>
        <p className="text-gray-600">Enter your phone number to receive verification codes</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            id="phone-number"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Include country code (e.g., +1 for US, +44 for UK)
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setCurrentStep('choose')}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSMSSetup}
            disabled={!phoneNumber.trim() || isLoading}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Sending...' : 'Send Code'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSMSVerify = () => (
    <div className="space-y-6">
      <div className="text-center">
        <MessageSquare className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Phone Number</h2>
        <p className="text-gray-600">
          Enter the 6-digit code sent to {smsConfig?.phoneNumber}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="sms-code" className="block text-sm font-medium text-gray-700 mb-2">
            Verification Code
          </label>
          <input
            id="sms-code"
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl font-mono tracking-widest"
            maxLength={6}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={handleResendSMS}
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
          >
            Didn't receive the code? Resend
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setCurrentStep('sms-setup')}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSMSVerification}
            disabled={verificationCode.length !== 6 || isLoading}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderBackupCodes = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Key className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Save Your Backup Codes</h2>
        <p className="text-gray-600">
          Store these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Important:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Each code can only be used once</li>
              <li>Keep these codes secure and private</li>
              <li>Don't share them with anyone</li>
              <li>Generate new codes if compromised</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Backup Codes</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBackupCodes(!showBackupCodes)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              {showBackupCodes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showBackupCodes ? 'Hide' : 'Show'}
            </button>
            <button
              onClick={() => copyToClipboard(backupCodes.join('\n'), 'backup')}
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              {backupCodesCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              Copy
            </button>
            <button
              onClick={downloadBackupCodes}
              className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:text-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          {showBackupCodes ? (
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div key={index} className="font-mono text-sm text-gray-800 bg-white p-2 rounded border">
                  {index + 1}. {code}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Eye className="w-8 h-8 mx-auto mb-2" />
              <p>Click "Show" to view your backup codes</p>
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={handleComplete}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            I've Saved My Backup Codes
          </button>
        </div>
      </div>
    </div>
  );

  const renderComplete = () => (
    <div className="space-y-6 text-center">
      <div>
        <ShieldCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication Enabled!</h2>
        <p className="text-gray-600">
          Your account is now protected with two-factor authentication using {selectedMethod === 'totp' ? 'authenticator app' : 'SMS'}.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-green-500" />
          <div className="text-left">
            <p className="font-medium text-green-800">Your account is now more secure</p>
            <p className="text-sm text-green-600">
              You'll be asked for a verification code when signing in from new devices.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        )}
        {onComplete && (
          <button
            onClick={onComplete}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'choose':
        return renderChooseMethod();
      case 'totp-setup':
        return renderTOTPSetup();
      case 'totp-verify':
        return renderTOTPVerify();
      case 'sms-setup':
        return renderSMSSetup();
      case 'sms-verify':
        return renderSMSVerify();
      case 'backup-codes':
        return renderBackupCodes();
      case 'complete':
        return renderComplete();
      default:
        return renderChooseMethod();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default MFASetup;