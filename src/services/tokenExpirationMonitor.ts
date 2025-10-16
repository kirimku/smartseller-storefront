/**
 * Token Expiration Monitor Service
 * 
 * Monitors token expiration and provides alerts:
 * - Real-time expiration tracking
 * - Configurable alert thresholds
 * - Visual and audio notifications
 * - Automatic refresh suggestions
 * - Session timeout warnings
 */

import { jwtTokenManager } from './jwtTokenManager';
import { secureTokenStorage } from './secureTokenStorage';

interface ExpirationAlert {
  id: string;
  type: 'warning' | 'critical' | 'expired';
  message: string;
  timeToExpiry: number;
  timestamp: number;
  actions: AlertAction[];
}

interface AlertAction {
  label: string;
  action: () => void;
  type: 'primary' | 'secondary' | 'danger';
}

interface MonitorConfig {
  warningThreshold: number; // Minutes before expiry to show warning
  criticalThreshold: number; // Minutes before expiry to show critical alert
  checkInterval: number; // Check interval in milliseconds
  enableAudioAlerts: boolean;
  enableVisualAlerts: boolean;
  enableBrowserNotifications: boolean;
  autoRefreshEnabled: boolean;
  autoRefreshThreshold: number; // Minutes before expiry to auto-refresh
}

type AlertCallback = (alert: ExpirationAlert) => void;
type ExpirationCallback = () => void;

class TokenExpirationMonitor {
  private static instance: TokenExpirationMonitor;
  private config: MonitorConfig;
  private monitorTimer: NodeJS.Timeout | null = null;
  private alertCallbacks: Set<AlertCallback> = new Set();
  private expirationCallbacks: Set<ExpirationCallback> = new Set();
  private currentAlerts: Map<string, ExpirationAlert> = new Map();
  private isMonitoring = false;
  private lastExpirationCheck = 0;

  private constructor(config: Partial<MonitorConfig> = {}) {
    this.config = {
      warningThreshold: 15, // 15 minutes
      criticalThreshold: 4, // 4 minutes
      checkInterval: 60000, // 60 seconds
      enableAudioAlerts: true,
      enableVisualAlerts: true,
      enableBrowserNotifications: true,
      autoRefreshEnabled: true,
      autoRefreshThreshold: 6, // 6 minutes (reduce frequency)
      ...config
    };

    this.initializeBrowserNotifications();
  }

  public static getInstance(config?: Partial<MonitorConfig>): TokenExpirationMonitor {
    if (!TokenExpirationMonitor.instance) {
      TokenExpirationMonitor.instance = new TokenExpirationMonitor(config);
    }
    return TokenExpirationMonitor.instance;
  }

  /**
   * Initialize browser notifications
   */
  private async initializeBrowserNotifications(): Promise<void> {
    if (this.config.enableBrowserNotifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
  }

  /**
   * Start monitoring token expiration
   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('🔍 Token expiration monitoring already active');
      return;
    }

    console.log('🔍 Starting token expiration monitoring...');
    this.isMonitoring = true;
    this.scheduleNextCheck();

    // Listen for JWT token manager events
    jwtTokenManager.addEventListener('token_refreshed', () => {
      this.clearExpiredAlerts();
      this.checkTokenExpiration();
    });

    jwtTokenManager.addEventListener('token_expired', () => {
      this.handleTokenExpired();
    });
  }

  /**
   * Stop monitoring token expiration
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    console.log('🔍 Stopping token expiration monitoring...');
    this.isMonitoring = false;

    if (this.monitorTimer) {
      clearTimeout(this.monitorTimer);
      this.monitorTimer = null;
    }

    this.clearAllAlerts();
  }

  /**
   * Schedule next expiration check
   */
  private scheduleNextCheck(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.monitorTimer = setTimeout(() => {
      this.checkTokenExpiration();
      this.scheduleNextCheck();
    }, this.config.checkInterval);
  }

  /**
   * Check current token expiration status
   */
  private async checkTokenExpiration(): Promise<void> {
    try {
      const expirationInfo = await jwtTokenManager.getTokenExpirationInfo();
      
      if (!expirationInfo.isValid) {
        this.handleTokenExpired();
        return;
      }

      if (expirationInfo.timeToExpiry !== undefined) {
        const minutesToExpiry = Math.floor(expirationInfo.timeToExpiry / (1000 * 60));
        
        // Auto-refresh if enabled and threshold reached
        if (this.config.autoRefreshEnabled && 
            minutesToExpiry <= this.config.autoRefreshThreshold &&
            minutesToExpiry > this.config.criticalThreshold) {
          this.handleAutoRefresh();
          return;
        }

        // Generate alerts based on thresholds
        this.generateExpirationAlerts(minutesToExpiry, expirationInfo.timeToExpiry);
      }

      this.lastExpirationCheck = Date.now();
    } catch (error) {
      console.error('❌ Error checking token expiration:', error);
    }
  }

  /**
   * Generate expiration alerts based on time remaining
   */
  private generateExpirationAlerts(minutesToExpiry: number, timeToExpiry: number): void {
    // Clear existing alerts if token is not expiring soon
    if (minutesToExpiry > this.config.warningThreshold) {
      this.clearAllAlerts();
      return;
    }

    // Critical alert
    if (minutesToExpiry <= this.config.criticalThreshold) {
      this.createAlert({
        id: 'critical-expiry',
        type: 'critical',
        message: `Your session will expire in ${minutesToExpiry} minute${minutesToExpiry !== 1 ? 's' : ''}!`,
        timeToExpiry,
        timestamp: Date.now(),
        actions: [
          {
            label: 'Refresh Now',
            action: () => this.handleManualRefresh(),
            type: 'primary'
          },
          {
            label: 'Extend Session',
            action: () => this.handleExtendSession(),
            type: 'secondary'
          }
        ]
      });
    }
    // Warning alert
    else if (minutesToExpiry <= this.config.warningThreshold) {
      this.createAlert({
        id: 'warning-expiry',
        type: 'warning',
        message: `Your session will expire in ${minutesToExpiry} minutes`,
        timeToExpiry,
        timestamp: Date.now(),
        actions: [
          {
            label: 'Refresh Token',
            action: () => this.handleManualRefresh(),
            type: 'primary'
          },
          {
            label: 'Dismiss',
            action: () => this.dismissAlert('warning-expiry'),
            type: 'secondary'
          }
        ]
      });
    }
  }

  /**
   * Create and emit an alert
   */
  private createAlert(alert: ExpirationAlert): void {
    // Don't create duplicate alerts
    if (this.currentAlerts.has(alert.id)) {
      return;
    }

    this.currentAlerts.set(alert.id, alert);

    // Emit to callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('❌ Error in alert callback:', error);
      }
    });

    // Show browser notification
    this.showBrowserNotification(alert);

    // Play audio alert
    this.playAudioAlert(alert.type);

    console.log(`⚠️ Token expiration alert: ${alert.message}`);
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(alert: ExpirationAlert): void {
    if (!this.config.enableBrowserNotifications || 
        !('Notification' in window) || 
        Notification.permission !== 'granted') {
      return;
    }

    const notification = new Notification('Session Expiration Warning', {
      body: alert.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: alert.id,
      requireInteraction: alert.type === 'critical'
    });

    // Auto-close after 10 seconds for non-critical alerts
    if (alert.type !== 'critical') {
      setTimeout(() => notification.close(), 10000);
    }

    notification.onclick = () => {
      window.focus();
      notification.close();
      if (alert.actions.length > 0) {
        alert.actions[0].action();
      }
    };
  }

  /**
   * Play audio alert
   */
  private playAudioAlert(type: ExpirationAlert['type']): void {
    if (!this.config.enableAudioAlerts) {
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different tones for different alert types
      const frequency = type === 'critical' ? 800 : 600;
      const duration = type === 'critical' ? 200 : 100;

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('⚠️ Could not play audio alert:', error);
    }
  }

  /**
   * Handle automatic token refresh
   */
  private async handleAutoRefresh(): Promise<void> {
    try {
      console.log('🔄 Auto-refreshing token due to expiration threshold...');
      const refreshed = await jwtTokenManager.refreshToken();
      
      if (refreshed) {
        this.createAlert({
          id: 'auto-refresh-success',
          type: 'warning',
          message: 'Your session has been automatically refreshed',
          timeToExpiry: 0,
          timestamp: Date.now(),
          actions: [
            {
              label: 'OK',
              action: () => this.dismissAlert('auto-refresh-success'),
              type: 'primary'
            }
          ]
        });
      } else {
        this.handleTokenExpired();
      }
    } catch (error) {
      console.error('❌ Auto-refresh failed:', error);
      this.handleTokenExpired();
    }
  }

  /**
   * Handle manual token refresh
   */
  private async handleManualRefresh(): Promise<void> {
    try {
      const refreshed = await jwtTokenManager.forceRefresh();
      
      if (refreshed) {
        this.clearAllAlerts();
        this.createAlert({
          id: 'manual-refresh-success',
          type: 'warning',
          message: 'Session refreshed successfully',
          timeToExpiry: 0,
          timestamp: Date.now(),
          actions: [
            {
              label: 'OK',
              action: () => this.dismissAlert('manual-refresh-success'),
              type: 'primary'
            }
          ]
        });
      } else {
        this.handleTokenExpired();
      }
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
      this.handleTokenExpired();
    }
  }

  /**
   * Handle session extension
   */
  private handleExtendSession(): void {
    // This could trigger a user activity check or require re-authentication
    console.log('🔄 Extending session...');
    this.handleManualRefresh();
  }

  /**
   * Handle token expiration
   */
  private handleTokenExpired(): void {
    this.clearAllAlerts();
    
    this.createAlert({
      id: 'token-expired',
      type: 'expired',
      message: 'Your session has expired. Please log in again.',
      timeToExpiry: 0,
      timestamp: Date.now(),
      actions: [
        {
          label: 'Login',
          action: () => this.redirectToLogin(),
          type: 'primary'
        }
      ]
    });

    // Notify expiration callbacks
    this.expirationCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('❌ Error in expiration callback:', error);
      }
    });
  }

  /**
   * Redirect to login page
   */
  private redirectToLogin(): void {
    window.location.href = '/login';
  }

  /**
   * Dismiss a specific alert
   */
  public dismissAlert(alertId: string): void {
    this.currentAlerts.delete(alertId);
  }

  /**
   * Clear all alerts
   */
  private clearAllAlerts(): void {
    this.currentAlerts.clear();
  }

  /**
   * Clear expired alerts
   */
  private clearExpiredAlerts(): void {
    const now = Date.now();
    for (const [id, alert] of this.currentAlerts.entries()) {
      if (now - alert.timestamp > 60000) { // Clear alerts older than 1 minute
        this.currentAlerts.delete(id);
      }
    }
  }

  /**
   * Add alert callback
   */
  public onAlert(callback: AlertCallback): () => void {
    this.alertCallbacks.add(callback);
    return () => this.alertCallbacks.delete(callback);
  }

  /**
   * Add expiration callback
   */
  public onExpiration(callback: ExpirationCallback): () => void {
    this.expirationCallbacks.add(callback);
    return () => this.expirationCallbacks.delete(callback);
  }

  /**
   * Get current alerts
   */
  public getCurrentAlerts(): ExpirationAlert[] {
    return Array.from(this.currentAlerts.values());
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<MonitorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get monitoring status
   */
  public getStatus(): {
    isMonitoring: boolean;
    alertCount: number;
    lastCheck: number;
    config: MonitorConfig;
  } {
    return {
      isMonitoring: this.isMonitoring,
      alertCount: this.currentAlerts.size,
      lastCheck: this.lastExpirationCheck,
      config: this.config
    };
  }

  /**
   * Force immediate expiration check
   */
  public async checkNow(): Promise<void> {
    await this.checkTokenExpiration();
  }
}

// Export singleton instance
export const tokenExpirationMonitor = TokenExpirationMonitor.getInstance();

// Export types
export type {
  ExpirationAlert,
  AlertAction,
  MonitorConfig,
  AlertCallback,
  ExpirationCallback
};