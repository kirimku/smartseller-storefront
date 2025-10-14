/**
 * VitePWA-Compatible Service Worker Registration
 * 
 * This file provides dynamic service worker registration that works
 * with VitePWA's auto-generation in both development and production.
 */

// Configuration
var SW_CONFIG = {
  // Service worker file name (VitePWA generates this)
  swFileName: 'sw.js',
  
  // Update check interval (5 minutes)
  updateCheckInterval: 5 * 60 * 1000,
  
  // Enable registration in development
  enableInDev: true,
  
  // Scope for service worker
  scope: '/'
};

// Global state
let registration = null;
let updateCheckTimer = null;

/**
 * Check if we're in development mode
 */
function isDevelopment() {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('192.168.') ||
         window.location.hostname.includes('10.') ||
         window.location.hostname.endsWith('.local');
}

/**
 * Check if service workers are supported
 */
function isServiceWorkerSupported() {
  return 'serviceWorker' in navigator;
}

/**
 * Register service worker
 */
async function registerServiceWorker() {
  if (!isServiceWorkerSupported()) {
    console.warn('🔧 Service Worker not supported in this browser');
    return null;
  }

  // Skip registration in development unless explicitly enabled
  if (isDevelopment() && !SW_CONFIG.enableInDev) {
    console.log('🔧 Service Worker registration skipped in development');
    return null;
  }

  try {
    console.log('🔧 Registering Service Worker...');
    
    // Use dev service worker when running locally (VitePWA dev mode)
    const swUrl = isDevelopment() ? '/dev-sw.js?dev-sw' : `/${SW_CONFIG.swFileName}`;
    
    registration = await navigator.serviceWorker.register(swUrl, {
      scope: SW_CONFIG.scope,
      updateViaCache: 'none' // Always check for updates
    });

    console.log('✅ Service Worker registered successfully:', registration.scope);

    // Set up event listeners
    setupServiceWorkerListeners(registration);
    
    // Start periodic update checks
    startUpdateChecks();
    
    return registration;
    
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Set up service worker event listeners
 */
function setupServiceWorkerListeners(registration) {
  // Listen for updates
  registration.addEventListener('updatefound', () => {
    console.log('🔄 Service Worker update found');
    
    const newWorker = registration.installing;
    if (newWorker) {
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('🆕 New Service Worker installed, update available');
          
          // Dispatch custom event for update notification
          window.dispatchEvent(new CustomEvent('sw-update-available', {
            detail: { registration, newWorker }
          }));
        }
      });
    }
  });

  // Listen for controller changes
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('🔄 Service Worker controller changed');
    
    // Dispatch custom event for controller change
    window.dispatchEvent(new CustomEvent('sw-controller-changed'));
  });

  // Listen for messages from service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('📨 Message from Service Worker:', event.data);
    
    // Handle different message types
    if (event.data && event.data.type) {
      switch (event.data.type) {
        case 'CACHE_UPDATED':
          window.dispatchEvent(new CustomEvent('sw-cache-updated', {
            detail: event.data
          }));
          break;
        case 'OFFLINE_READY':
          window.dispatchEvent(new CustomEvent('sw-offline-ready'));
          break;
        default:
          console.log('Unknown message type:', event.data.type);
      }
    }
  });
}

/**
 * Start periodic update checks
 */
function startUpdateChecks() {
  if (updateCheckTimer) {
    clearInterval(updateCheckTimer);
  }

  updateCheckTimer = setInterval(async () => {
    if (registration) {
      try {
        console.log('🔍 Checking for Service Worker updates...');
        await registration.update();
      } catch (error) {
        console.warn('⚠️ Update check failed:', error);
      }
    }
  }, SW_CONFIG.updateCheckInterval);
}

/**
 * Stop update checks
 */
function stopUpdateChecks() {
  if (updateCheckTimer) {
    clearInterval(updateCheckTimer);
    updateCheckTimer = null;
  }
}

/**
 * Unregister service worker
 */
async function unregisterServiceWorker() {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const result = await registration.unregister();
      console.log('🗑️ Service Worker unregistered:', result);
      stopUpdateChecks();
      return result;
    }
    return false;
  } catch (error) {
    console.error('❌ Service Worker unregistration failed:', error);
    return false;
  }
}

/**
 * Force service worker update
 */
async function forceUpdate() {
  if (registration && registration.waiting) {
    console.log('🔄 Forcing Service Worker update...');
    
    // Tell the waiting service worker to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    return true;
  }
  
  return false;
}

/**
 * Get service worker status
 */
function getServiceWorkerStatus() {
  if (!isServiceWorkerSupported()) {
    return { supported: false, registered: false, status: 'not-supported' };
  }

  if (!registration) {
    return { supported: true, registered: false, status: 'not-registered' };
  }

  let status = 'unknown';
  if (registration.active) {
    status = 'active';
  } else if (registration.installing) {
    status = 'installing';
  } else if (registration.waiting) {
    status = 'waiting';
  }

  return {
    supported: true,
    registered: true,
    status,
    scope: registration.scope,
    updateAvailable: !!registration.waiting
  };
}

// Auto-register when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', registerServiceWorker);
} else {
  registerServiceWorker();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  stopUpdateChecks();
});

// Export functions for external use
window.swRegistration = {
  register: registerServiceWorker,
  unregister: unregisterServiceWorker,
  forceUpdate,
  getStatus: getServiceWorkerStatus,
  startUpdateChecks,
  stopUpdateChecks
};

console.log('🔧 Service Worker registration script loaded');