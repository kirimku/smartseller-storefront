import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize PWA Cache Manager
import { pwaCacheManager } from './utils/pwa-cache-manager'
// Activate global fetch interceptor to coordinate token refresh and request retries
import { tokenRefreshInterceptor } from './services/tokenRefreshInterceptor'
import { csrfService } from './services/csrfService'
import { setupAxios } from './services/axiosSetup'

// ===== DEBUG: Environment Variables =====
console.log('🔍 ===== ENVIRONMENT VARIABLES DEBUG =====');
console.log('📍 Current URL:', window.location.href);
console.log('🌐 Current hostname:', window.location.hostname);
console.log('🔧 Node Environment:', import.meta.env.MODE);

// Print all VITE environment variables
console.log('🔧 All VITE Environment Variables:');
Object.keys(import.meta.env).forEach(key => {
  if (key.startsWith('VITE_')) {
    console.log(`   ${key}:`, import.meta.env[key]);
  }
});

// Print specific API-related variables
console.log('🌐 API Configuration:');
console.log('   VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('   VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('   VITE_TENANT_SLUG:', import.meta.env.VITE_TENANT_SLUG);
console.log('   DEV:', import.meta.env.DEV);

// Print all environment variables (including non-VITE ones if available)
console.log('🔧 All Available Environment Variables:');
console.log(import.meta.env);

console.log('🔍 ===== END ENVIRONMENT DEBUG =====');
// ===== END DEBUG =====

// Initialize PWA functionality
pwaCacheManager.initialize().then((initialized) => {
  if (initialized) {
    console.log('✅ PWA Cache Manager initialized successfully');
  } else {
    console.log('⚠️ PWA Cache Manager initialization failed or not supported');
  }
}).catch((error) => {
  console.error('❌ PWA Cache Manager initialization error:', error);
});

// Ensure interceptor is initialized early
try {
  const status = tokenRefreshInterceptor.getStatus();
  console.log('🛡️ TokenRefreshInterceptor active:', status);
} catch (e) {
  console.warn('⚠️ TokenRefreshInterceptor init warning:', e);
}

// Initialize global Axios configuration and CSRF header injection
try {
  setupAxios();
  console.log('✅ Axios setup initialized with credentials and CSRF injection');
} catch (e) {
  console.warn('⚠️ Axios setup initialization failed:', e);
}

// Bootstrap CSRF token as early as possible
csrfService.bootstrapIfNeeded(true).then((token) => {
  console.log('🛡️ CSRF token bootstrapped:', token ? `${token.substring(0, 8)}...` : '(none)');
}).catch((err) => {
  console.warn('⚠️ CSRF bootstrap failed:', err);
});

createRoot(document.getElementById("root")!).render(<App />);
