/**
 * PWA Cache Manager
 * 
 * Manages PWA cache updates, service worker lifecycle, and user notifications.
 * Replaces the old cache-buster utility with VitePWA-compatible functionality.
 */

// Types
interface UpdateNotificationOptions {
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  autoHide?: boolean;
  hideDelay?: number;
}

type EventCallback = (data?: unknown) => void;

interface CacheManagerConfig {
  enableUpdateNotifications: boolean;
  enableAutoUpdate: boolean;
  updateCheckInterval: number;
  notificationTimeout: number;
  enableLogging: boolean;
}

interface ServiceWorkerStatus {
  supported: boolean;
  registered: boolean;
  status: string;
  scope?: string;
  updateAvailable: boolean;
  lastUpdateCheck?: Date;
}

// Default configuration
const DEFAULT_CONFIG: CacheManagerConfig = {
  enableUpdateNotifications: true,
  enableAutoUpdate: false,
  updateCheckInterval: 5 * 60 * 1000, // 5 minutes
  notificationTimeout: 10000, // 10 seconds
  enableLogging: true
};

class PWACacheManager {
  private static instance: PWACacheManager;
  private config: CacheManagerConfig;
  private registration: ServiceWorkerRegistration | null = null;
  private updateCheckTimer: number | null = null;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private lastUpdateCheck: Date | null = null;
  private isInitialized = false;

  private constructor(config: Partial<CacheManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupEventListeners();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<CacheManagerConfig>): PWACacheManager {
    if (!PWACacheManager.instance) {
      PWACacheManager.instance = new PWACacheManager(config);
    }
    return PWACacheManager.instance;
  }

  /**
   * Initialize the cache manager
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      this.log('PWA Cache Manager already initialized');
      return true;
    }

    try {
      this.log('Initializing PWA Cache Manager...');

      // Check if service workers are supported
      if (!this.isServiceWorkerSupported()) {
        this.log('Service Workers not supported');
        return false;
      }

      // Get existing registration
      this.registration = await navigator.serviceWorker.getRegistration();
      
      if (this.registration) {
        this.log('Existing service worker registration found');
        this.setupServiceWorkerListeners();
      } else {
        this.log('No existing service worker registration found');
      }

      // Start update checks if enabled
      if (this.config.updateCheckInterval > 0) {
        this.startUpdateChecks();
      }

      this.isInitialized = true;
      this.emit('initialized', { status: this.getStatus() });
      
      this.log('PWA Cache Manager initialized successfully');
      return true;

    } catch (error) {
      this.log('Failed to initialize PWA Cache Manager:', error);
      return false;
    }
  }

  /**
   * Check for updates manually
   */
  public async checkForUpdates(): Promise<boolean> {
    if (!this.registration) {
      this.log('No service worker registration available');
      return false;
    }

    try {
      this.log('Checking for updates...');
      this.lastUpdateCheck = new Date();
      
      await this.registration.update();
      this.emit('update-check-completed', { timestamp: this.lastUpdateCheck });
      
      return true;
    } catch (error) {
      this.log('Update check failed:', error);
      this.emit('update-check-failed', { error });
      return false;
    }
  }

  /**
   * Force update to new service worker
   */
  public async forceUpdate(): Promise<boolean> {
    if (!this.registration || !this.registration.waiting) {
      this.log('No waiting service worker available for update');
      return false;
    }

    try {
      this.log('Forcing service worker update...');
      
      // Tell the waiting service worker to skip waiting
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      this.emit('force-update-initiated');
      return true;
      
    } catch (error) {
      this.log('Force update failed:', error);
      this.emit('force-update-failed', { error });
      return false;
    }
  }

  /**
   * Clear all caches
   */
  public async clearCaches(): Promise<boolean> {
    try {
      this.log('Clearing all caches...');
      
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        this.log(`Cleared ${cacheNames.length} caches`);
      }

      // Clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();

      this.emit('caches-cleared');
      return true;
      
    } catch (error) {
      this.log('Failed to clear caches:', error);
      this.emit('cache-clear-failed', { error });
      return false;
    }
  }

  /**
   * Show update notification
   */
  public showUpdateNotification(options: UpdateNotificationOptions = {}): void {
    if (!this.config.enableUpdateNotifications) {
      return;
    }

    const notification = {
      title: options.title || 'App Update Available',
      message: options.message || 'A new version of the app is available. Click to update.',
      actionText: options.actionText || 'Update Now',
      onAction: options.onAction || (() => this.forceUpdate()),
      onDismiss: options.onDismiss || (() => {}),
      autoHide: options.autoHide !== false,
      hideDelay: options.hideDelay || this.config.notificationTimeout
    };

    this.emit('show-update-notification', notification);
  }

  /**
   * Get current status
   */
  public getStatus(): ServiceWorkerStatus {
    if (!this.isServiceWorkerSupported()) {
      return {
        supported: false,
        registered: false,
        status: 'not-supported',
        updateAvailable: false
      };
    }

    if (!this.registration) {
      return {
        supported: true,
        registered: false,
        status: 'not-registered',
        updateAvailable: false,
        lastUpdateCheck: this.lastUpdateCheck || undefined
      };
    }

    let status = 'unknown';
    if (this.registration.active) {
      status = 'active';
    } else if (this.registration.installing) {
      status = 'installing';
    } else if (this.registration.waiting) {
      status = 'waiting';
    }

    return {
      supported: true,
      registered: true,
      status,
      scope: this.registration.scope,
      updateAvailable: !!this.registration.waiting,
      lastUpdateCheck: this.lastUpdateCheck || undefined
    };
  }

  /**
   * Add event listener
   */
  public on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  public off(event: string, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<CacheManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart update checks if interval changed
    if (newConfig.updateCheckInterval !== undefined) {
      this.stopUpdateChecks();
      if (this.config.updateCheckInterval > 0) {
        this.startUpdateChecks();
      }
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopUpdateChecks();
    this.eventListeners.clear();
    this.registration = null;
    this.isInitialized = false;
    this.log('PWA Cache Manager destroyed');
  }

  // Private methods

  private isServiceWorkerSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  private setupEventListeners(): void {
    // Listen for service worker registration from external script
    window.addEventListener('sw-update-available', (event: Event) => {
      this.log('Service worker update available');
      const customEvent = event as CustomEvent;
      this.registration = customEvent.detail.registration;
      this.emit('update-available', customEvent.detail);
      
      if (this.config.enableUpdateNotifications) {
        this.showUpdateNotification();
      }
    });

    window.addEventListener('sw-controller-changed', () => {
      this.log('Service worker controller changed');
      this.emit('controller-changed');
      
      // Reload the page to use the new service worker
      if (this.config.enableAutoUpdate) {
        window.location.reload();
      }
    });

    window.addEventListener('sw-cache-updated', (event: Event) => {
      this.log('Service worker cache updated');
      const customEvent = event as CustomEvent;
      this.emit('cache-updated', customEvent.detail);
    });

    window.addEventListener('sw-offline-ready', () => {
      this.log('App ready for offline use');
      this.emit('offline-ready');
    });
  }

  private setupServiceWorkerListeners(): void {
    if (!this.registration) return;

    // Listen for updates
    this.registration.addEventListener('updatefound', () => {
      this.log('Service worker update found');
      
      const newWorker = this.registration!.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.log('New service worker installed');
            this.emit('update-available', { registration: this.registration, newWorker });
            
            if (this.config.enableUpdateNotifications) {
              this.showUpdateNotification();
            }
          }
        });
      }
    });
  }

  private startUpdateChecks(): void {
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer);
    }

    this.updateCheckTimer = window.setInterval(() => {
      this.checkForUpdates();
    }, this.config.updateCheckInterval);

    this.log(`Started update checks every ${this.config.updateCheckInterval}ms`);
  }

  private stopUpdateChecks(): void {
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer);
      this.updateCheckTimer = null;
      this.log('Stopped update checks');
    }
  }

  private emit(event: string, data?: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          this.log(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  private log(message: string, ...args: unknown[]): void {
    if (this.config.enableLogging) {
      console.log(`[PWA Cache Manager] ${message}`, ...args);
    }
  }
}

// Export singleton instance
export const pwaCacheManager = PWACacheManager.getInstance();

// Export types
export type {
  UpdateNotificationOptions,
  CacheManagerConfig,
  ServiceWorkerStatus
};

// Export class for custom instances
export { PWACacheManager };