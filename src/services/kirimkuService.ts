import { apiClient, handleApiError, type ApiResponse } from '@/lib/api';
import { secureTokenStorage } from '@/services/secureTokenStorage';
import { jwtTokenManager } from '@/services/jwtTokenManager';

export type KirimkuLocationType = 'province' | 'city' | 'district' | 'area';

export interface KirimkuLocation {
  id: string;
  name: string;
  type: KirimkuLocationType;
  province?: string;
  city?: string;
  district?: string;
  postal_code?: string;
}

export interface LocationsSearchResponse {
  locations: KirimkuLocation[];
  total: number;
}

// Define shape for API items to avoid any
interface RawLocationItem {
  province?: string;
  state?: string;
  city?: string;
  district?: string;
  kecamatan?: string;
  postal_code?: string;
  postalCode?: string;
  kelurahan?: string[];
  [key: string]: unknown;
}

// Narrow type for nested shape with locations
interface EnvelopeWithLocations {
  data?: { locations?: RawLocationItem[]; total?: number };
}

// Add nested envelope to handle shape: { data: { success, message, data: [] } }
interface NestedEnvelope {
  data?: { success?: boolean; message?: string; data?: RawLocationItem[]; locations?: RawLocationItem[]; total?: number };
}

class KirimkuService {
  async searchLocations(params: {
    query: string;
    type?: KirimkuLocationType;
    limit?: number;
  }): Promise<LocationsSearchResponse> {
    const { query, type, limit = 10 } = params;

    try {
      // Ensure authenticated token for customer shipping endpoints
      let token = secureTokenStorage.getAccessToken();

      if (!token) {
        await jwtTokenManager.refreshToken();
        token = secureTokenStorage.getAccessToken();
      } else if (secureTokenStorage.isTokenExpiringSoon()) {
        await jwtTokenManager.validateAndRefreshIfNeeded();
        token = secureTokenStorage.getAccessToken();
      }

      // Attach latest token (can be null; server will reject if unauthenticated)
      await apiClient.setAuthToken(token);

      const searchParams = new URLSearchParams();
      searchParams.set('query', query);
      if (type) searchParams.set('type', type);
      if (limit) searchParams.set('limit', String(limit));

      const endpoint = `/api/v1/customer/shipping/locations/search?${searchParams.toString()}`;
      const response: ApiResponse<unknown> = await apiClient.get(endpoint, { requiresAuth: true });

      // Normalize varying server response shapes into KirimkuLocation[]
      let items: RawLocationItem[] = [];
      let declaredTotal: number | undefined;

      const raw = response.data as { data?: RawLocationItem[] } | RawLocationItem[] | LocationsSearchResponse | EnvelopeWithLocations | NestedEnvelope | undefined;
      if (raw) {
        // Preferred contract: { success: true, data: { locations: [], total } }
        const env = raw as EnvelopeWithLocations;
        if (env.data && Array.isArray(env.data.locations)) {
          items = env.data.locations;
          if (typeof env.data.total === 'number') {
            declaredTotal = env.data.total;
          }
        } else if (Array.isArray(raw)) {
          // Case: Raw array
          items = raw as RawLocationItem[];
        } else if ('data' in (raw as { data?: RawLocationItem[] }) && Array.isArray((raw as { data?: RawLocationItem[] }).data)) {
          // Case: { data: RawLocationItem[] }
          items = (raw as { data?: RawLocationItem[] }).data || [];
        } else if ('locations' in (raw as LocationsSearchResponse) && Array.isArray((raw as LocationsSearchResponse).locations)) {
          // Case: { locations: KirimkuLocation[] }
          items = (raw as LocationsSearchResponse).locations as unknown as RawLocationItem[];
          declaredTotal = (raw as LocationsSearchResponse).total;
        } else {
          // Case: { data: { success, message, data: RawLocationItem[] } }
          const nested = raw as NestedEnvelope;
          const nestedArray = nested.data?.data;
          if (Array.isArray(nestedArray)) {
            items = nestedArray;
          }
          if (typeof nested.data?.total === 'number') {
            declaredTotal = nested.data?.total;
          }
        }
      }

      const normalizeId = (...parts: (string | undefined)[]) =>
        parts
          .filter((p): p is string => !!p)
          .join('|')
          .toLowerCase()
          .replace(/\s+/g, '-');

      const normalized: KirimkuLocation[] = [];
      for (const item of items) {
        const province = item.province || item.state || '';
        const city = item.city || '';
        const district = item.district || item.kecamatan || '';
        const postal = item.postal_code || item.postalCode || '';

        if (type === 'area' && Array.isArray(item.kelurahan) && item.kelurahan.length > 0) {
          for (const kel of item.kelurahan) {
            normalized.push({
              id: normalizeId(province, city, district, postal, kel),
              name: kel,
              type: 'area',
              province,
              city,
              district,
              postal_code: postal,
            });
          }
        } else {
          normalized.push({
            id: normalizeId(province, city, district, postal),
            name: district || city || province,
            type: 'district',
            province,
            city,
            district,
            postal_code: postal,
          });
        }
      }

      const total = typeof declaredTotal === 'number' ? declaredTotal : normalized.length;
      return { locations: normalized, total };
    } catch (error) {
      console.error('Failed to search kirimku locations:', error);
      throw handleApiError(error);
    }
  }
}

export const kirimkuService = new KirimkuService();