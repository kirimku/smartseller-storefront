/**
 * Token Monitoring Hook
 * 
 * Automatically manages token expiration monitoring:
 * - Starts monitoring when user is authenticated
 * - Stops monitoring when user logs out
 * - Provides monitoring status and controls
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { tokenExpirationMonitor } from '@/services/tokenExpirationMonitor';

interface TokenMonitoringState {
  isMonitoring: boolean;
  alertCount: number;
  lastCheck: number;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  checkNow: () => Promise<void>;
}

export const useTokenMonitoring = (): TokenMonitoringState => {
  const { isAuthenticated } = useAuth();
  const [monitoringState, setMonitoringState] = useState({
    isMonitoring: false,
    alertCount: 0,
    lastCheck: 0
  });

  // Update monitoring state
  const updateState = () => {
    const status = tokenExpirationMonitor.getStatus();
    setMonitoringState({
      isMonitoring: status.isMonitoring,
      alertCount: status.alertCount,
      lastCheck: status.lastCheck
    });
  };

  // Start monitoring
  const startMonitoring = () => {
    tokenExpirationMonitor.startMonitoring();
    updateState();
  };

  // Stop monitoring
  const stopMonitoring = () => {
    tokenExpirationMonitor.stopMonitoring();
    updateState();
  };

  // Check now
  const checkNow = async () => {
    await tokenExpirationMonitor.checkNow();
    updateState();
  };

  // Auto-start/stop monitoring based on authentication
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔍 User authenticated, starting token monitoring...');
      startMonitoring();
    } else {
      console.log('🔍 User not authenticated, stopping token monitoring...');
      stopMonitoring();
    }

    // Update state periodically
    const interval = setInterval(updateState, 5000); // Update every 5 seconds

    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, []);

  return {
    ...monitoringState,
    startMonitoring,
    stopMonitoring,
    checkNow
  };
};