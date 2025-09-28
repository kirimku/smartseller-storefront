/**
 * Password Generator Component
 * 
 * Provides a comprehensive password generation interface with:
 * - Customizable generation options
 * - Real-time strength preview
 * - Multiple password suggestions
 * - Copy to clipboard functionality
 */

import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  Copy, 
  Check, 
  Settings,
  Shuffle,
  Lock
} from 'lucide-react';
import { passwordSecurity, PasswordGenerationOptions } from '../services/passwordSecurity';
import usePasswordSecurity from '../hooks/usePasswordSecurity';

export interface PasswordGeneratorProps {
  onPasswordSelect?: (password: string) => void;
  className?: string;
  showMultipleSuggestions?: boolean;
  defaultOptions?: Partial<PasswordGenerationOptions>;
}

export const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({
  onPasswordSelect,
  className = '',
  showMultipleSuggestions = true,
  defaultOptions = {}
}) => {
  const [options, setOptions] = useState<PasswordGenerationOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: true,
    excludeAmbiguous: false,
    ...defaultOptions
  });

  const [generatedPasswords, setGeneratedPasswords] = useState<string[]>([]);
  const [selectedPassword, setSelectedPassword] = useState<string>('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  const { strength, analyzePassword } = usePasswordSecurity(selectedPassword, {
    enableBreachCheck: false,
    autoCheckBreach: false
  });

  // Generate multiple password suggestions
  const generatePasswords = () => {
    const count = showMultipleSuggestions ? 5 : 1;
    const passwords: string[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const password = passwordSecurity.generateSecurePassword(options);
        passwords.push(password);
      } catch (error) {
        console.error('Failed to generate password:', error);
      }
    }
    
    setGeneratedPasswords(passwords);
    if (passwords.length > 0) {
      setSelectedPassword(passwords[0]);
      analyzePassword(passwords[0]);
    }
  };

  // Handle password selection
  const handlePasswordSelect = (password: string, index: number) => {
    setSelectedPassword(password);
    analyzePassword(password);
    onPasswordSelect?.(password);
  };

  // Handle copy to clipboard
  const handleCopyPassword = async (password: string, index: number) => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy password:', error);
    }
  };

  // Handle option changes
  const handleOptionChange = (key: keyof PasswordGenerationOptions, value: boolean | number) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Generate passwords on mount and when options change
  useEffect(() => {
    generatePasswords();
  }, [options]);

  // Get strength color for password display
  const getPasswordStrengthColor = (password: string) => {
    const tempStrength = passwordSecurity.analyzePasswordStrength(password);
    switch (tempStrength.level) {
      case 'very-weak': return 'text-red-500';
      case 'weak': return 'text-orange-500';
      case 'fair': return 'text-yellow-500';
      case 'good': return 'text-green-500';
      case 'strong': return 'text-green-600';
      case 'very-strong': return 'text-green-700';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Lock className="h-5 w-5 mr-2" />
          Password Generator
        </h3>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Settings className="h-3 w-3 mr-1" />
            Options
          </button>
          <button
            type="button"
            onClick={generatePasswords}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Shuffle className="h-3 w-3 mr-1" />
            Regenerate
          </button>
        </div>
      </div>

      {/* Generation Options */}
      {showOptions && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Generation Options</h4>
          
          {/* Length Slider */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">
              Length: {options.length} characters
            </label>
            <input
              type="range"
              min="8"
              max="64"
              value={options.length}
              onChange={(e) => handleOptionChange('length', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Character Type Options */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.includeUppercase}
                onChange={(e) => handleOptionChange('includeUppercase', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-600">Uppercase (A-Z)</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.includeLowercase}
                onChange={(e) => handleOptionChange('includeLowercase', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-600">Lowercase (a-z)</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.includeNumbers}
                onChange={(e) => handleOptionChange('includeNumbers', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-600">Numbers (0-9)</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.includeSymbols}
                onChange={(e) => handleOptionChange('includeSymbols', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-600">Symbols (!@#$)</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.excludeSimilar}
                onChange={(e) => handleOptionChange('excludeSimilar', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-600">Exclude similar</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.excludeAmbiguous}
                onChange={(e) => handleOptionChange('excludeAmbiguous', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-600">Exclude ambiguous</span>
            </label>
          </div>

          <div className="text-xs text-gray-500">
            <p>• Similar characters: i, l, 1, L, o, 0, O</p>
            <p>• Ambiguous characters: {`{, }, [, ], (, ), /, \\, ', ", ~, ,, ;, ., <, >`}</p>
          </div>
        </div>
      )}

      {/* Generated Passwords */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">
          {showMultipleSuggestions ? 'Password Suggestions' : 'Generated Password'}
        </h4>
        
        <div className="space-y-2">
          {generatedPasswords.map((password, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedPassword === password
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handlePasswordSelect(password, index)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <code className={`text-sm font-mono truncate ${getPasswordStrengthColor(password)}`}>
                    {password}
                  </code>
                  <span className="text-xs text-gray-500">
                    ({passwordSecurity.analyzePasswordStrength(password).score}/100)
                  </span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyPassword(password, index);
                }}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                title="Copy password"
              >
                {copiedIndex === index ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Password Strength */}
      {selectedPassword && strength && (
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Strength Analysis</h5>
          
          {/* Strength Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Strength</span>
              <span className={`text-xs font-medium ${getPasswordStrengthColor(selectedPassword)}`}>
                {strength.level.replace('-', ' ').toUpperCase()}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${strength.score}%`,
                  backgroundColor: getPasswordStrengthColor(selectedPassword).includes('red') ? '#ef4444' :
                                 getPasswordStrengthColor(selectedPassword).includes('orange') ? '#f97316' :
                                 getPasswordStrengthColor(selectedPassword).includes('yellow') ? '#eab308' :
                                 getPasswordStrengthColor(selectedPassword).includes('green') ? '#22c55e' : '#e5e7eb'
                }}
              />
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Score: {strength.score}/100</span>
              <span>Entropy: {Math.round(strength.entropy)} bits</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={generatePasswords}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Generate New
        </button>
        
        {selectedPassword && (
          <button
            type="button"
            onClick={() => handleCopyPassword(selectedPassword, -1)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {copiedIndex === -1 ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Use This Password
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default PasswordGenerator;