import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize PWA Cache Manager
import { pwaCacheManager } from './utils/pwa-cache-manager'
// Activate global fetch interceptor to coordinate token refresh and request retries
import { tokenRefreshInterceptor } from './services/tokenRefreshInterceptor'

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

createRoot(document.getElementById("root")!).render(<App />);
