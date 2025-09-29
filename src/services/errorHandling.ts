import { toast } from '@/components/ui/use-toast';

// Error types and interfaces
export interface ErrorContext {
  component: string;
  action: string;
  userId?: string;
  email?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  additionalData?: Record<string, unknown>;
}

export interface SecurityEvent {
  type: 'failed_login' | 'rate_limit' | 'suspicious_activity' | 'account_lockout' | 'password_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: ErrorContext;
  details: Record<string, unknown>;
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

// API Error interface for better typing
interface ApiError {
  response?: {
    data?: {
      code?: string;
      message?: string;
      field?: string;
      details?: Record<string, unknown>;
    };
  };
  code?: string;
  message?: string;
  name?: string;
  status?: number;
  field?: string;
}

// Common error codes
export const ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  
  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  PASSWORD_BREACHED: 'PASSWORD_BREACHED',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS',
  
  // Network/Server errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Token errors
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  REFRESH_FAILED: 'REFRESH_FAILED',
} as const;

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid email or password. Please check your credentials and try again.',
  [ERROR_CODES.EMAIL_NOT_VERIFIED]: 'Please verify your email address before signing in.',
  [ERROR_CODES.ACCOUNT_SUSPENDED]: 'Your account has been suspended. Please contact support for assistance.',
  [ERROR_CODES.ACCOUNT_LOCKED]: 'Your account has been temporarily locked due to multiple failed login attempts.',
  [ERROR_CODES.EMAIL_ALREADY_EXISTS]: 'An account with this email already exists. Try signing in instead.',
  [ERROR_CODES.WEAK_PASSWORD]: 'Please choose a stronger password that meets our security requirements.',
  [ERROR_CODES.PASSWORD_BREACHED]: 'This password has been found in data breaches. Please choose a different password.',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait before trying again.',
  [ERROR_CODES.TOO_MANY_ATTEMPTS]: 'Too many failed attempts. Please try again later.',
  [ERROR_CODES.NETWORK_ERROR]: 'Network connection error. Please check your internet connection.',
  [ERROR_CODES.SERVER_ERROR]: 'Server error occurred. Please try again later.',
  [ERROR_CODES.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Your session has expired. Please sign in again.',
  [ERROR_CODES.INVALID_TOKEN]: 'Invalid session. Please sign in again.',
  [ERROR_CODES.REFRESH_FAILED]: 'Session refresh failed. Please sign in again.',
};

class ErrorHandlingService {
  private securityEvents: SecurityEvent[] = [];
  private errorLog: Array<{ error: Error; context: ErrorContext }> = [];

  /**
   * Parse and normalize errors from different sources
   */
  parseError(error: ApiError | Error | unknown, context: Partial<ErrorContext>): AuthError {
    const fullContext: ErrorContext = {
      component: context.component || 'unknown',
      action: context.action || 'unknown',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context,
    };

    const apiError = error as ApiError;

    // Handle API response errors
    if (apiError?.response?.data) {
      const responseData = apiError.response.data;
      return {
        code: responseData.code || ERROR_CODES.SERVER_ERROR,
        message: responseData.message || ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR],
        field: responseData.field,
        details: responseData.details,
      };
    }

    // Handle network errors
    if (apiError?.code === 'NETWORK_ERROR' || apiError?.message?.includes('Network Error')) {
      return {
        code: ERROR_CODES.NETWORK_ERROR,
        message: ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
      };
    }

    // Handle timeout errors
    if (apiError?.code === 'TIMEOUT' || apiError?.message?.includes('timeout')) {
      return {
        code: ERROR_CODES.TIMEOUT_ERROR,
        message: ERROR_MESSAGES[ERROR_CODES.TIMEOUT_ERROR],
      };
    }

    // Handle validation errors
    if (apiError?.name === 'ValidationError' || apiError?.code === 'VALIDATION_FAILED') {
      return {
        code: ERROR_CODES.VALIDATION_FAILED,
        message: apiError.message || 'Please check your input and try again.',
        field: apiError.field,
      };
    }

    // Handle authentication errors
    if (apiError?.status === 401 || apiError?.code === 'UNAUTHORIZED') {
      return {
        code: ERROR_CODES.INVALID_CREDENTIALS,
        message: ERROR_MESSAGES[ERROR_CODES.INVALID_CREDENTIALS],
      };
    }

    // Handle rate limiting
    if (apiError?.status === 429 || apiError?.code === 'RATE_LIMITED') {
      return {
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: ERROR_MESSAGES[ERROR_CODES.RATE_LIMIT_EXCEEDED],
      };
    }

    // Default error handling
    const errorMessage = apiError?.message || (error instanceof Error ? error.message : String(error));
    return {
      code: ERROR_CODES.SERVER_ERROR,
      message: errorMessage || ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR],
    };
  }

  /**
   * Handle authentication errors with appropriate user feedback
   */
  handleAuthError(error: ApiError | Error | unknown, context: Partial<ErrorContext>): AuthError {
    const parsedError = this.parseError(error, context);
    
    // Log the error
    this.logError(error, context);

    // Show user-friendly toast notification
    this.showErrorToast(parsedError);

    // Log security events for certain error types
    this.logSecurityEvent(parsedError, context);

    return parsedError;
  }

  /**
   * Log security events for monitoring and analysis
   */
  private logSecurityEvent(error: AuthError, context: Partial<ErrorContext>) {
    const securityEventTypes: Record<string, SecurityEvent['type']> = {
      [ERROR_CODES.INVALID_CREDENTIALS]: 'failed_login',
      [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'rate_limit',
      [ERROR_CODES.TOO_MANY_ATTEMPTS]: 'rate_limit',
      [ERROR_CODES.ACCOUNT_LOCKED]: 'account_lockout',
      [ERROR_CODES.PASSWORD_BREACHED]: 'password_breach',
    };

    const eventType = securityEventTypes[error.code];
    if (!eventType) return;

    const severity: SecurityEvent['severity'] = 
      error.code === ERROR_CODES.PASSWORD_BREACHED ? 'high' :
      error.code === ERROR_CODES.ACCOUNT_LOCKED ? 'high' :
      error.code === ERROR_CODES.RATE_LIMIT_EXCEEDED ? 'medium' : 'low';

    const securityEvent: SecurityEvent = {
      type: eventType,
      severity,
      context: {
        component: context.component || 'unknown',
        action: context.action || 'unknown',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...context,
      },
      details: {
        errorCode: error.code,
        errorMessage: error.message,
        ...error.details,
      },
    };

    this.securityEvents.push(securityEvent);

    // In production, send to security monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToSecurityService(securityEvent);
    } else {
      console.warn('Security Event:', securityEvent);
    }
  }

  /**
   * Log general errors for debugging
   */
  private logError(error: unknown, context: Partial<ErrorContext>) {
    const errorEntry = {
      error: error instanceof Error ? error : new Error(String(error)),
      context: {
        component: context.component || 'unknown',
        action: context.action || 'unknown',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...context,
      },
    };

    this.errorLog.push(errorEntry);

    // Keep only last 100 errors in memory
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }

    // In production, send to error tracking service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorTracking(errorEntry);
    } else {
      console.error('Error logged:', errorEntry);
    }
  }

  /**
   * Show user-friendly error toast
   */
  private showErrorToast(error: AuthError) {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive',
    });
  }

  /**
   * Send security events to monitoring service
   */
  private async sendToSecurityService(event: SecurityEvent) {
    try {
      // In a real implementation, this would send to your security monitoring service
      await fetch('/api/security/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to send security event:', error);
    }
  }

  /**
   * Send errors to error tracking service
   */
  private async sendToErrorTracking(errorEntry: { error: Error; context: ErrorContext }) {
    try {
      // In a real implementation, this would send to Sentry or similar service
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorEntry),
      });
    } catch (error) {
      console.error('Failed to send error to tracking service:', error);
    }
  }

  /**
   * Get recent security events (for admin dashboard)
   */
  getSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents];
  }

  /**
   * Get recent errors (for debugging)
   */
  getErrorLog(): Array<{ error: Error; context: ErrorContext }> {
    return [...this.errorLog];
  }

  /**
   * Clear logs (useful for testing)
   */
  clearLogs() {
    this.securityEvents = [];
    this.errorLog = [];
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandlingService();

// Utility functions for common error scenarios
export const handleLoginError = (error: unknown, email?: string) => {
  return errorHandler.handleAuthError(error, {
    component: 'CustomerLogin',
    action: 'login',
    email,
  });
};

export const handleRegistrationError = (error: unknown, email?: string) => {
  return errorHandler.handleAuthError(error, {
    component: 'CustomerRegistration',
    action: 'register',
    email,
  });
};

export const handlePasswordResetError = (error: unknown, email?: string) => {
  return errorHandler.handleAuthError(error, {
    component: 'PasswordReset',
    action: 'reset_password',
    email,
  });
};

export const handleEmailVerificationError = (error: unknown, email?: string) => {
  return errorHandler.handleAuthError(error, {
    component: 'EmailVerification',
    action: 'verify_email',
    email,
  });
};

export default errorHandler;