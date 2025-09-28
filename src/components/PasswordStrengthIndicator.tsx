/**
 * Password Strength Indicator Component
 * 
 * Provides comprehensive visual feedback for password strength,
 * requirements checklist, breach warnings, and security recommendations
 */

import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  RotateCcw,
  Copy,
  Check
} from 'lucide-react';
import usePasswordSecurity, { UsePasswordSecurityOptions } from '../hooks/usePasswordSecurity';
import { PasswordGenerationOptions } from '../services/passwordSecurity';

export interface PasswordStrengthIndicatorProps {
  password: string;
  onPasswordChange?: (password: string) => void;
  showInput?: boolean;
  showRequirements?: boolean;
  showBreachCheck?: boolean;
  showGenerator?: boolean;
  showCopyButton?: boolean;
  className?: string;
  inputClassName?: string;
  securityOptions?: UsePasswordSecurityOptions;
  generationOptions?: Partial<PasswordGenerationOptions>;
  placeholder?: string;
  label?: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  onPasswordChange,
  showInput = true,
  showRequirements = true,
  showBreachCheck = true,
  showGenerator = true,
  showCopyButton = true,
  className = '',
  inputClassName = '',
  securityOptions = {},
  generationOptions = {},
  placeholder = 'Enter your password',
  label = 'Password'
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    strength,
    breach,
    isAnalyzing,
    isCheckingBreach,
    isValid,
    isStrong,
    isSecure,
    analyzePassword,
    checkBreach,
    generatePassword,
    strengthColor,
    strengthLabel,
    progressPercentage,
    error
  } = usePasswordSecurity(password, securityOptions);

  // Handle password input change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    analyzePassword(newPassword);
    onPasswordChange?.(newPassword);
  };

  // Handle password generation
  const handleGeneratePassword = () => {
    const newPassword = generatePassword(generationOptions);
    onPasswordChange?.(newPassword);
  };

  // Handle manual breach check
  const handleBreachCheck = () => {
    if (password) {
      checkBreach(password);
    }
  };

  // Handle copy to clipboard
  const handleCopyPassword = async () => {
    if (password) {
      try {
        await navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy password:', err);
      }
    }
  };

  // Get strength bar segments
  const getStrengthSegments = () => {
    const segments = 5;
    const filledSegments = Math.ceil((progressPercentage / 100) * segments);
    
    return Array.from({ length: segments }, (_, index) => (
      <div
        key={index}
        className={`h-2 rounded-sm transition-all duration-300 ${
          index < filledSegments 
            ? 'opacity-100' 
            : 'opacity-20 bg-gray-300'
        }`}
        style={{
          backgroundColor: index < filledSegments ? strengthColor : undefined
        }}
      />
    ));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Password Input */}
      {showInput && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={handlePasswordChange}
              placeholder={placeholder}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-20 ${inputClassName}`}
            />
            <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
              {/* Show/Hide Password */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>

              {/* Copy Password */}
              {showCopyButton && password && (
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  title={copied ? 'Copied!' : 'Copy password'}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Password Generator */}
      {showGenerator && (
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleGeneratePassword}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Generate Secure Password
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Strength Indicator */}
      {password && (
        <div className="space-y-3">
          {/* Strength Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Password Strength
              </span>
              <span 
                className="text-sm font-medium"
                style={{ color: strengthColor }}
              >
                {isAnalyzing ? 'Analyzing...' : strengthLabel}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {getStrengthSegments()}
            </div>
            <div className="text-xs text-gray-500">
              Score: {strength?.score || 0}/100
              {strength?.estimatedCrackTime && (
                <span className="ml-2">
                  • Crack time: {strength.estimatedCrackTime}
                </span>
              )}
            </div>
          </div>

          {/* Security Status */}
          <div className="flex items-center space-x-4">
            {/* Strength Status */}
            <div className="flex items-center space-x-1">
              {isStrong ? (
                <ShieldCheck className="h-4 w-4 text-green-500" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-orange-500" />
              )}
              <span className={`text-xs ${isStrong ? 'text-green-600' : 'text-orange-600'}`}>
                {isStrong ? 'Strong' : 'Needs improvement'}
              </span>
            </div>

            {/* Breach Status */}
            {showBreachCheck && (
              <div className="flex items-center space-x-1">
                {isCheckingBreach ? (
                  <RotateCcw className="h-4 w-4 text-gray-400 animate-spin" />
                ) : breach ? (
                  breach.isBreached ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )
                ) : (
                  <button
                    type="button"
                    onClick={handleBreachCheck}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Check breaches
                  </button>
                )}
                {breach && (
                  <span className={`text-xs ${breach.isBreached ? 'text-red-600' : 'text-green-600'}`}>
                    {breach.isBreached ? 'Compromised' : 'Secure'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Breach Warning */}
          {breach?.isBreached && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-800">
                    Password Compromised
                  </h4>
                  <p className="text-sm text-red-700 mt-1">
                    {breach.recommendation}
                  </p>
                  {breach.breachCount && (
                    <p className="text-xs text-red-600 mt-1">
                      Found in {breach.breachCount.toLocaleString()} data breaches
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Requirements Checklist */}
          {showRequirements && strength?.requirements && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Requirements</h4>
              <div className="space-y-1">
                {strength.requirements.map((requirement) => (
                  <div key={requirement.id} className="flex items-center space-x-2">
                    {requirement.met ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className={`text-xs ${
                      requirement.met ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {requirement.description}
                      {requirement.required && !requirement.met && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback */}
          {strength?.feedback && strength.feedback.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Recommendations</h4>
              <ul className="space-y-1">
                {strength.feedback.map((feedback, index) => (
                  <li key={index} className="text-xs text-gray-600 flex items-start space-x-1">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{feedback}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;