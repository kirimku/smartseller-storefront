/**
 * Token Expiration Alert Component
 * 
 * Displays token expiration alerts and notifications:
 * - Real-time alert display
 * - Action buttons for user interaction
 * - Different alert types (warning, critical, expired)
 * - Auto-dismiss functionality
 * - Responsive design
 */

import React, { useState, useEffect } from 'react';
import { tokenExpirationMonitor, type ExpirationAlert } from '../services/tokenExpirationMonitor';
import { useTokenMonitoring } from '../hooks/useTokenMonitoring';

interface TokenExpirationAlertProps {
  className?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
  autoHide?: boolean;
  autoHideDelay?: number;
}

const TokenExpirationAlert: React.FC<TokenExpirationAlertProps> = ({
  className = '',
  position = 'top-right',
  autoHide = false,
  autoHideDelay = 5000
}) => {
  const [alerts, setAlerts] = useState<ExpirationAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  
  // Use token monitoring hook to automatically manage monitoring
  const { isMonitoring } = useTokenMonitoring();

  useEffect(() => {
    // Subscribe to alerts
    const unsubscribe = tokenExpirationMonitor.onAlert((alert) => {
      setAlerts(prev => {
        // Remove existing alert with same ID and add new one
        const filtered = prev.filter(a => a.id !== alert.id);
        return [...filtered, alert];
      });

      // Auto-hide non-critical alerts
      if (autoHide && alert.type !== 'critical' && alert.type !== 'expired') {
        setTimeout(() => {
          handleDismiss(alert.id);
        }, autoHideDelay);
      }
    });

    // Load existing alerts
    setAlerts(tokenExpirationMonitor.getCurrentAlerts());

    return unsubscribe;
  }, [autoHide, autoHideDelay]);

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set(prev).add(alertId));
    tokenExpirationMonitor.dismissAlert(alertId);
    
    // Remove from local state after animation
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      setDismissedAlerts(prev => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
    }, 300);
  };

  const handleAction = (action: () => void, alertId: string) => {
    action();
    handleDismiss(alertId);
  };

  const getAlertStyles = (type: ExpirationAlert['type']) => {
    const baseStyles = 'border-l-4 p-4 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out';
    
    switch (type) {
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-400 text-yellow-800`;
      case 'critical':
        return `${baseStyles} bg-red-50 border-red-500 text-red-800 animate-pulse`;
      case 'expired':
        return `${baseStyles} bg-red-100 border-red-600 text-red-900`;
      default:
        return `${baseStyles} bg-blue-50 border-blue-400 text-blue-800`;
    }
  };

  const getIconForType = (type: ExpirationAlert['type']) => {
    switch (type) {
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'critical':
      case 'expired':
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getPositionStyles = () => {
    const baseStyles = 'fixed z-50 max-w-md w-full';
    
    switch (position) {
      case 'top-right':
        return `${baseStyles} top-4 right-4`;
      case 'top-left':
        return `${baseStyles} top-4 left-4`;
      case 'bottom-right':
        return `${baseStyles} bottom-4 right-4`;
      case 'bottom-left':
        return `${baseStyles} bottom-4 left-4`;
      case 'top-center':
        return `${baseStyles} top-4 left-1/2 transform -translate-x-1/2`;
      default:
        return `${baseStyles} top-4 right-4`;
    }
  };

  const getButtonStyles = (type: 'primary' | 'secondary' | 'danger') => {
    const baseStyles = 'px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    switch (type) {
      case 'primary':
        return `${baseStyles} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
      case 'secondary':
        return `${baseStyles} bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500`;
      case 'danger':
        return `${baseStyles} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
      default:
        return `${baseStyles} bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500`;
    }
  };

  const formatTimeRemaining = (timeToExpiry: number) => {
    if (timeToExpiry <= 0) return 'Expired';
    
    const minutes = Math.floor(timeToExpiry / (1000 * 60));
    const seconds = Math.floor((timeToExpiry % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  // Filter out dismissed alerts
  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className={`${getPositionStyles()} ${className}`}>
      <div className="space-y-3">
        {visibleAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`${getAlertStyles(alert.type)} ${
              dismissedAlerts.has(alert.id) ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getIconForType(alert.type)}
              </div>
              
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">
                    {alert.type === 'warning' && 'Session Warning'}
                    {alert.type === 'critical' && 'Critical Alert'}
                    {alert.type === 'expired' && 'Session Expired'}
                  </h3>
                  
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <p className="mt-1 text-sm">
                  {alert.message}
                </p>
                
                {alert.timeToExpiry > 0 && (
                  <p className="mt-1 text-xs opacity-75">
                    Time remaining: {formatTimeRemaining(alert.timeToExpiry)}
                  </p>
                )}
                
                {alert.actions.length > 0 && (
                  <div className="mt-3 flex space-x-2">
                    {alert.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleAction(action.action, alert.id)}
                        className={getButtonStyles(action.type)}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TokenExpirationAlert;