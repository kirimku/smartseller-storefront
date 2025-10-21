import { apiClient, handleApiError, type ApiResponse } from '@/lib/api';
import { secureTokenStorage } from '@/services/secureTokenStorage';

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
  data?: { locations?: RawLocationItem[] };
}

// Add nested envelope to handle shape: { data: { success, message, data: [] } }
interface NestedEnvelope {
  data?: { success?: boolean; message?: string; data?: RawLocationItem[]; locations?: RawLocationItem[] };
}

class KirimkuService {
  async searchLocations(params: {
    query: string;
    type?: KirimkuLocationType;
    limit?: number;
  }): Promise<LocationsSearchResponse> {
    const { query, type, limit = 10 } = params;

    try {
      const searchParams = new URLSearchParams();
      searchParams.set('query', query);
      if (type) searchParams.set('type', type);
      if (limit) searchParams.set('limit', String(limit));

      const endpoint = `/api/v1/customer/shipping/locations/search?${searchParams.toString()}`;
      // Flip to protected: do not mark as public so Authorization can be injected
      const token = secureTokenStorage.getAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response: ApiResponse<{ data: LocationsSearchResponse } | LocationsSearchResponse | { data?: RawLocationItem[] } | RawLocationItem[] | EnvelopeWithLocations | NestedEnvelope> = await apiClient.get(endpoint, headers ? { headers } : undefined);

      // Normalize varying server response shapes into KirimkuLocation[]
      const raw = response.data as { data?: RawLocationItem[] } | RawLocationItem[] | LocationsSearchResponse | EnvelopeWithLocations | NestedEnvelope | undefined;
      let items: RawLocationItem[] = [];
      if (raw) {
        if (Array.isArray(raw)) {
          items = raw as RawLocationItem[];
        } else if ('data' in raw && Array.isArray((raw as { data?: RawLocationItem[] }).data)) {
          // Case: { data: RawLocationItem[] }
          items = (raw as { data?: RawLocationItem[] }).data || [];
        } else if ('locations' in (raw as LocationsSearchResponse) && Array.isArray((raw as LocationsSearchResponse).locations)) {
          // Case: { locations: KirimkuLocation[] }
          items = (raw as LocationsSearchResponse).locations as unknown as RawLocationItem[];
        } else {
          // Case: { data: { locations?: RawLocationItem[] } }
          const env = raw as EnvelopeWithLocations;
          if (env.data && Array.isArray(env.data.locations)) {
            items = env.data.locations;
          } else {
            // Case: { data: { success, message, data: RawLocationItem[] } }
            const nested = raw as NestedEnvelope;
            const nestedArray = nested.data?.data;
            if (Array.isArray(nestedArray)) {
              items = nestedArray;
            }
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

      if (normalized.length > 0) {
        return { locations: normalized, total: normalized.length };
      }

      return { locations: [], total: 0 };
    } catch (error) {
      console.error('Failed to search kirimku locations:', error);
      throw handleApiError(error);
    }
  }
}

export const kirimkuService = new KirimkuService();