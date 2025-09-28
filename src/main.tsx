import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize PWA Cache Manager
import { pwaCacheManager } from './utils/pwa-cache-manager'

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

createRoot(document.getElementById("root")!).render(<App />);
