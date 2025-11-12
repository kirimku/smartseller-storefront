import axios, { AxiosHeaders } from 'axios';
import { csrfService } from '@/services/csrfService';

// Initialize global Axios defaults and CSRF header injection
export function setupAxios(): void {
  try {
    // Ensure cookies are always sent for session/CSRF/refresh flows
    axios.defaults.withCredentials = true;

    // Request interceptor to add CSRF header for unsafe methods
    axios.interceptors.request.use(async (config) => {
      try {
        // Always include credentials on individual requests too
        if (config.withCredentials === undefined) {
          config.withCredentials = true;
        }

        const method = (config.method || 'get').toLowerCase();
        const unsafe = method === 'post' || method === 'put' || method === 'patch' || method === 'delete';
        if (unsafe) {
          // Bootstrap CSRF token if needed and ensure headers are AxiosHeaders
          await csrfService.bootstrapIfNeeded();
          const token = csrfService.getToken();
          if (token) {
            let headers: AxiosHeaders;
            if (config.headers instanceof AxiosHeaders) {
              headers = config.headers as AxiosHeaders;
            } else {
              headers = new AxiosHeaders();
              if (config.headers && typeof config.headers === 'object') {
                for (const [k, v] of Object.entries(config.headers as Record<string, unknown>)) {
                  if (v !== undefined && v !== null) headers.set(k, String(v));
                }
              }
              config.headers = headers;
            }
            headers.set('X-CSRF-Token', token);
          }
        }
      } catch (e) {
        // Non-blocking; if CSRF header fails to inject, server will reject unsafe request
        console.warn('Axios CSRF interceptor warning:', e);
      }
      return config;
    });
  } catch (err) {
    console.warn('Axios setup failed:', err);
  }
}