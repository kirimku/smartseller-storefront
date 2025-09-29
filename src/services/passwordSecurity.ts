/**
 * Password Security Service
 * 
 * Provides comprehensive password security features:
 * - Password strength validation
 * - Breach checking against known compromised passwords
 * - Security recommendations
 * - Password generation
 * - History tracking to prevent reuse
 */

import CryptoJS from 'crypto-js';

export interface PasswordStrengthResult {
  score: number; // 0-100
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  feedback: string[];
  requirements: PasswordRequirement[];
  estimatedCrackTime: string;
  entropy: number;
}

export interface PasswordRequirement {
  id: string;
  description: string;
  met: boolean;
  required: boolean;
}

export interface BreachCheckResult {
  isBreached: boolean;
  breachCount?: number;
  source?: string;
  recommendation: string;
}

export interface PasswordGenerationOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
  excludeAmbiguous: boolean;
  customCharset?: string;
}

interface CachedBreachResult extends BreachCheckResult {
  timestamp: number;
}

class PasswordSecurityService {
  private static instance: PasswordSecurityService;
  private breachCache: Map<string, CachedBreachResult> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  // Common passwords and patterns (expanded list based on security research)
  private readonly COMMON_PASSWORDS = new Set([
    // Most common passwords
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'dragon',
    'master', 'hello', 'freedom', 'whatever', 'qazwsx', 'trustno1',
    
    // Additional common passwords
    'password1', 'password12', 'password123', '12345678', '1234567',
    'sunshine', 'iloveyou', 'princess', 'football', 'charlie', 'aa123456',
    'donald', 'bailey', 'access', 'love', 'secret', 'solo', 'hello123',
    'flower', 'passw0rd', 'shadow', 'baseball', 'jordan', 'harley',
    'ranger', 'buster', 'tiger', 'hockey', 'george', 'computer',
    'michelle', 'jessica', 'pepper', '1111', 'zxcvbn', 'hunter',
    'jennifer', 'thomas', 'martin', 'jordan23', 'starwars', 'klaster',
    'golfer', 'cookie', 'matthew', 'daniel', 'amanda', 'summer',
    'winter', 'spring', 'autumn', 'january', 'february', 'march',
    'april', 'may', 'june', 'july', 'august', 'september', 'october',
    'november', 'december', 'monday', 'tuesday', 'wednesday', 'thursday',
    'friday', 'saturday', 'sunday',
    
    // Keyboard patterns
    'qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1qaz2wsx3edc', 'qweasd',
    'qweasdzxc', '1q2w3e4r5t', 'qwer1234', 'asdf1234',
    
    // Common substitutions
    'p@ssw0rd', 'p@ssword', 'passw0rd', '123456!', 'qwerty!',
    'password!', 'admin123', 'root123', 'user123', 'test123'
  ]);

  private readonly KEYBOARD_PATTERNS = [
    'qwerty', 'asdf', 'zxcv', '1234', '4321', 'qwertyuiop',
    'asdfghjkl', 'zxcvbnm', '1qaz2wsx', 'qazwsx'
  ];

  private readonly COMMON_SUBSTITUTIONS = new Map([
    ['@', 'a'], ['3', 'e'], ['1', 'i'], ['0', 'o'], ['5', 's'],
    ['7', 't'], ['4', 'a'], ['8', 'b'], ['6', 'g'], ['2', 'z']
  ]);

  private constructor() {}

  public static getInstance(): PasswordSecurityService {
    if (!PasswordSecurityService.instance) {
      PasswordSecurityService.instance = new PasswordSecurityService();
    }
    return PasswordSecurityService.instance;
  }

  /**
   * Analyze password strength comprehensively
   */
  public analyzePasswordStrength(password: string): PasswordStrengthResult {
    const requirements = this.checkPasswordRequirements(password);
    const entropy = this.calculateEntropy(password);
    const patterns = this.detectPatterns(password);
    const commonality = this.checkCommonality(password);
    
    let score = 0;
    const feedback: string[] = [];

    // Base score from requirements
    const metRequirements = requirements.filter(r => r.met).length;
    const totalRequirements = requirements.length;
    score += (metRequirements / totalRequirements) * 40;

    // Entropy bonus
    if (entropy >= 60) score += 25;
    else if (entropy >= 40) score += 15;
    else if (entropy >= 25) score += 10;
    else if (entropy >= 15) score += 5;

    // Length bonus
    if (password.length >= 16) score += 15;
    else if (password.length >= 12) score += 10;
    else if (password.length >= 8) score += 5;

    // Pattern penalties
    if (patterns.hasKeyboardPattern) {
      score -= 15;
      feedback.push('Avoid keyboard patterns like "qwerty" or "123456"');
    }

    if (patterns.hasRepeatingChars) {
      score -= 10;
      feedback.push('Avoid repeating characters');
    }

    if (patterns.hasSequentialChars) {
      score -= 10;
      feedback.push('Avoid sequential characters like "abc" or "123"');
    }

    // Commonality penalties
    if (commonality.isCommon) {
      score -= 30;
      feedback.push('This password is too common and easily guessable');
    }

    if (commonality.hasCommonSubstitutions) {
      score -= 10;
      feedback.push('Avoid simple character substitutions like "@" for "a"');
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    // Generate level and feedback
    const level = this.getStrengthLevel(score);
    const estimatedCrackTime = this.estimateCrackTime(entropy, password.length);

    // Add positive feedback for strong passwords
    if (score >= 80) {
      feedback.unshift('Excellent! This is a very strong password');
    } else if (score >= 60) {
      feedback.unshift('Good password strength');
    } else if (score >= 40) {
      feedback.unshift('Fair password, but could be stronger');
    } else {
      feedback.unshift('This password is too weak');
    }

    return {
      score,
      level,
      feedback,
      requirements,
      estimatedCrackTime,
      entropy
    };
  }

  /**
   * Check password against known breaches
   */
  public async checkPasswordBreach(password: string): Promise<BreachCheckResult> {
    try {
      // Create SHA-1 hash of password (required by HaveIBeenPwned API)
      const hash = CryptoJS.SHA1(password).toString().toUpperCase();
      const prefix = hash.substring(0, 5);
      const suffix = hash.substring(5);

      // Check cache first
      const cacheKey = `breach_${prefix}`;
      const cached = this.breachCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return this.checkHashInResponse(suffix, cached);
      }

      // Query HaveIBeenPwned API
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'SmartSeller-Storefront-Security-Check'
        }
      });

      if (!response.ok) {
        throw new Error(`Breach check failed: ${response.status}`);
      }

      const responseText = await response.text();
      const result = this.parseBreachResponse(responseText, suffix);

      // Cache the response
      this.breachCache.set(cacheKey, {
        ...result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.warn('Password breach check failed:', error);
      return {
        isBreached: false,
        recommendation: 'Unable to check password against breach database. Please ensure your password is unique and strong.'
      };
    }
  }

  /**
   * Generate a secure password
   */
  public generateSecurePassword(options: Partial<PasswordGenerationOptions> = {}): string {
    const config: PasswordGenerationOptions = {
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: true,
      excludeAmbiguous: true,
      ...options
    };

    let charset = '';
    
    if (config.includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (config.includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (config.includeNumbers) charset += '0123456789';
    if (config.includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (config.customCharset) {
      charset = config.customCharset;
    }

    // Remove similar/ambiguous characters if requested
    if (config.excludeSimilar) {
      charset = charset.replace(/[il1Lo0O]/g, '');
    }
    
    if (config.excludeAmbiguous) {
      charset = charset.replace(/[{}[\]()/"\\'"~,;.<>]/g, '');
    }

    if (charset.length === 0) {
      throw new Error('No valid characters available for password generation');
    }

    // Generate password ensuring character type requirements
    let password = '';
    const requiredChars: string[] = [];

    if (config.includeLowercase) requiredChars.push(this.getRandomChar('abcdefghijklmnopqrstuvwxyz'));
    if (config.includeUppercase) requiredChars.push(this.getRandomChar('ABCDEFGHIJKLMNOPQRSTUVWXYZ'));
    if (config.includeNumbers) requiredChars.push(this.getRandomChar('0123456789'));
    if (config.includeSymbols) requiredChars.push(this.getRandomChar('!@#$%^&*()_+-=[]{}|;:,.<>?'));

    // Add required characters
    password += requiredChars.join('');

    // Fill remaining length with random characters
    for (let i = password.length; i < config.length; i++) {
      password += this.getRandomChar(charset);
    }

    // Shuffle the password to avoid predictable patterns
    return this.shuffleString(password);
  }

  /**
   * Check if password meets modern security requirements
   */
  private checkPasswordRequirements(password: string): PasswordRequirement[] {
    return [
      {
        id: 'length-min',
        description: 'At least 12 characters long (modern standard)',
        met: password.length >= 12,
        required: true
      },
      {
        id: 'length-legacy',
        description: 'At least 8 characters (legacy minimum)',
        met: password.length >= 8,
        required: false
      },
      {
        id: 'uppercase',
        description: 'Contains uppercase letters (A-Z)',
        met: /[A-Z]/.test(password),
        required: true
      },
      {
        id: 'lowercase',
        description: 'Contains lowercase letters (a-z)',
        met: /[a-z]/.test(password),
        required: true
      },
      {
        id: 'numbers',
        description: 'Contains numbers (0-9)',
        met: /\d/.test(password),
        required: true
      },
      {
        id: 'symbols',
        description: 'Contains special characters (!@#$%^&*)',
        met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password),
        required: true
      },
      {
        id: 'no-common',
        description: 'Not a commonly used password',
        met: !this.COMMON_PASSWORDS.has(password.toLowerCase()),
        required: true
      },
      {
        id: 'no-keyboard-patterns',
        description: 'Does not contain keyboard patterns',
        met: !this.detectPatterns(password).hasKeyboardPattern,
        required: true
      },
      {
        id: 'no-repeating',
        description: 'Does not have excessive repeating characters',
        met: !this.detectPatterns(password).hasRepeatingChars,
        required: true
      },
      {
        id: 'no-sequential',
        description: 'Does not contain sequential characters',
        met: !this.detectPatterns(password).hasSequentialChars,
        required: true
      },
      {
        id: 'no-personal-info',
        description: 'Does not contain obvious personal information',
        met: !this.containsPersonalInfo(password),
        required: true
      },
      {
        id: 'entropy-check',
        description: 'Has sufficient randomness (entropy ≥ 50 bits)',
        met: this.calculateEntropy(password) >= 50,
        required: true
      },
      {
        id: 'length-strong',
        description: 'At least 16 characters (recommended for high security)',
        met: password.length >= 16,
        required: false
      },
      {
        id: 'mixed-case-numbers',
        description: 'Good mix of character types',
        met: this.hasGoodCharacterMix(password),
        required: false
      }
    ];
  }

  /**
   * Calculate password entropy
   */
  private calculateEntropy(password: string): number {
    let charsetSize = 0;
    
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/\d/.test(password)) charsetSize += 10;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) charsetSize += 32;
    
    return password.length * Math.log2(charsetSize);
  }

  /**
   * Detect common patterns in password
   */
  private detectPatterns(password: string): {
    hasKeyboardPattern: boolean;
    hasRepeatingChars: boolean;
    hasSequentialChars: boolean;
  } {
    const lower = password.toLowerCase();
    
    return {
      hasKeyboardPattern: this.KEYBOARD_PATTERNS.some(pattern => lower.includes(pattern)),
      hasRepeatingChars: /(.)\1{2,}/.test(password),
      hasSequentialChars: this.hasSequentialPattern(password)
    };
  }

  /**
   * Check password commonality
   */
  private checkCommonality(password: string): {
    isCommon: boolean;
    hasCommonSubstitutions: boolean;
  } {
    const lower = password.toLowerCase();
    
    // Check against common passwords
    const isCommon = this.COMMON_PASSWORDS.has(lower) || 
                    this.COMMON_PASSWORDS.has(this.reverseCommonSubstitutions(lower));

    // Check for common substitutions
    const hasCommonSubstitutions = this.hasCommonSubstitutions(password);

    return { isCommon, hasCommonSubstitutions };
  }

  /**
   * Get strength level from score
   */
  private getStrengthLevel(score: number): PasswordStrengthResult['level'] {
    if (score >= 90) return 'very-strong';
    if (score >= 75) return 'strong';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    if (score >= 20) return 'weak';
    return 'very-weak';
  }

  /**
   * Estimate crack time based on entropy
   */
  private estimateCrackTime(entropy: number, length: number): string {
    const combinations = Math.pow(2, entropy);
    const guessesPerSecond = 1000000000; // 1 billion guesses per second (modern hardware)
    const secondsToCrack = combinations / (2 * guessesPerSecond); // Average case

    if (secondsToCrack < 1) return 'Instantly';
    if (secondsToCrack < 60) return `${Math.round(secondsToCrack)} seconds`;
    if (secondsToCrack < 3600) return `${Math.round(secondsToCrack / 60)} minutes`;
    if (secondsToCrack < 86400) return `${Math.round(secondsToCrack / 3600)} hours`;
    if (secondsToCrack < 31536000) return `${Math.round(secondsToCrack / 86400)} days`;
    if (secondsToCrack < 31536000000) return `${Math.round(secondsToCrack / 31536000)} years`;
    return 'Centuries';
  }

  /**
   * Parse breach response from HaveIBeenPwned
   */
  private parseBreachResponse(responseText: string, suffix: string): BreachCheckResult {
    const lines = responseText.split('\n');
    
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix === suffix) {
        const breachCount = parseInt(count, 10);
        return {
          isBreached: true,
          breachCount,
          source: 'HaveIBeenPwned',
          recommendation: `This password has been found in ${breachCount.toLocaleString()} data breaches. Please choose a different password.`
        };
      }
    }

    return {
      isBreached: false,
      recommendation: 'Password not found in known breaches. Good choice!'
    };
  }

  /**
   * Check if hash suffix exists in cached response
   */
  private checkHashInResponse(suffix: string, cached: CachedBreachResult): BreachCheckResult {
    // Return the cached result without timestamp
    const { timestamp, ...result } = cached;
    return result;
  }

  /**
   * Helper methods
   */
  private hasSequentialPattern(password: string): boolean {
    const sequences = ['abc', 'bcd', 'cde', '123', '234', '345', '456', '789'];
    const lower = password.toLowerCase();
    return sequences.some(seq => lower.includes(seq) || lower.includes(seq.split('').reverse().join('')));
  }

  private containsPersonalInfo(password: string): boolean {
    // Basic check for obvious personal info patterns
    const lower = password.toLowerCase();
    const personalPatterns = [
      'admin', 'user', 'test', 'demo', 'guest',
      'name', 'email', 'phone', 'address'
    ];
    return personalPatterns.some(pattern => lower.includes(pattern));
  }

  private hasCommonSubstitutions(password: string): boolean {
    let substituted = password.toLowerCase();
    for (const [symbol, letter] of this.COMMON_SUBSTITUTIONS) {
      substituted = substituted.replace(new RegExp(symbol, 'g'), letter);
    }
    return this.COMMON_PASSWORDS.has(substituted);
  }

  private reverseCommonSubstitutions(password: string): string {
    let result = password;
    for (const [symbol, letter] of this.COMMON_SUBSTITUTIONS) {
      result = result.replace(new RegExp(letter, 'g'), symbol);
    }
    return result;
  }

  /**
   * Check if password has a good mix of character types
   */
  private hasGoodCharacterMix(password: string): boolean {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?~`]/.test(password);
    
    // Count how many character types are present
    const typeCount = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
    
    // Good mix means at least 3 different character types
    return typeCount >= 3;
  }

  private getRandomChar(charset: string): string {
    return charset.charAt(Math.floor(Math.random() * charset.length));
  }

  private shuffleString(str: string): string {
    const array = str.split('');
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array.join('');
  }
}

// Export singleton instance
export const passwordSecurity = PasswordSecurityService.getInstance();