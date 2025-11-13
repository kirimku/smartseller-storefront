/**
 * CSRF Service
 * - Bootstraps CSRF token from `/api/v1/csrf-token`
 * - Stores token in-memory and sessionStorage for durability
 * - Provides helper to inject `X-CSRF-Token` header on unsafe methods
 */

type CsrfBootstrapResult = {
  token: string | null;
  setCookieHeader?: string | null;
};

class CsrfService {
  private token: string | null = null;
  private lastFetchMs = 0;
  private readonly minRefreshIntervalMs = 5 * 60 * 1000; // 5 minutes

  private getApiBaseUrl(): string {
    return (
      import.meta.env.VITE_API_BASE_URL ||
      'https://api-seller.kirimku.app'
    );
  }

  getToken(): string | null {
    if (this.token) return this.token;
    try {
      const fromSession = sessionStorage.getItem('csrf_token');
      if (fromSession) this.token = fromSession;
    } catch (_) {
      // ignore storage errors
    }
    return this.token;
  }

  async fetchToken(): Promise<CsrfBootstrapResult> {
    const url = `${this.getApiBaseUrl()}/api/v1/csrf-token`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });

      const setCookieHeader = res.headers.get('set-cookie');

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.warn('CSRF fetch failed', { status: res.status, text });
        return { token: null, setCookieHeader };
      }

      const json = (await res.json().catch(() => null)) as
        | { data?: { csrf_token?: string } }
        | null;
      const token = json?.data?.csrf_token || null;
      if (token) {
        this.token = token;
        this.lastFetchMs = Date.now();
        try {
          sessionStorage.setItem('csrf_token', token);
        } catch (_) {
          // ignore storage errors
        }
      }
      return { token, setCookieHeader };
    } catch (err) {
      console.warn('CSRF fetch error', err);
      return { token: null, setCookieHeader: null };
    }
  }

  async bootstrapIfNeeded(force = false): Promise<string | null> {
    const now = Date.now();
    const hasToken = !!this.getToken();
    const shouldRefresh = force || !hasToken || now - this.lastFetchMs > this.minRefreshIntervalMs;
    if (!shouldRefresh) return this.token;
    const { token } = await this.fetchToken();
    return token;
  }

  injectCsrfHeader(
    headers: Record<string, string>,
    method: string | undefined
  ): Record<string, string> {
    const m = (method || 'GET').toUpperCase();
    const unsafe = m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE';
    if (!unsafe) return headers;
    const token = this.getToken();
    if (token) {
      return { ...headers, 'X-CSRF-Token': token };
    }
    return headers;
  }
}

export const csrfService = new CsrfService();