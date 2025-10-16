import { apiClient, handleApiError, type ApiResponse } from '@/lib/api';

export type KirimkuLocationType = 'province' | 'city' | 'district' | 'area';

export interface KirimkuLocation {
  id: string;
  name: string;
  type: KirimkuLocationType;
  province?: string;
  postal_code?: string;
}

export interface LocationsSearchResponse {
  locations: KirimkuLocation[];
  total: number;
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

      const endpoint = `/api/v1/kirimku/locations/search?${searchParams.toString()}`;
      // Flip to protected: do not mark as public so Authorization can be injected
      const response: ApiResponse<{ data: LocationsSearchResponse } | LocationsSearchResponse> = await apiClient.get(endpoint);

      // Some APIs wrap data inside { data: ... }, others return the object directly
      const raw = response.data;
      if (raw) {
        if (typeof raw === 'object' && 'locations' in (raw as Record<string, unknown>)) {
          const direct = raw as LocationsSearchResponse;
          if (Array.isArray(direct.locations)) {
            return direct;
          }
        }
        if (typeof raw === 'object' && 'data' in (raw as Record<string, unknown>)) {
          const envelope = raw as { data?: unknown };
          const maybe = envelope.data;
          if (maybe && typeof maybe === 'object' && 'locations' in (maybe as Record<string, unknown>)) {
            const extracted = maybe as LocationsSearchResponse;
            if (Array.isArray(extracted.locations)) {
              return extracted;
            }
          }
        }
      }

      return { locations: [], total: 0 };
    } catch (error) {
      console.error('Failed to search kirimku locations:', error);
      throw handleApiError(error);
    }
  }
}

export const kirimkuService = new KirimkuService();