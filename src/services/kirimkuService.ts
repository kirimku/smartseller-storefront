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
      const response: ApiResponse<{ data: LocationsSearchResponse } | LocationsSearchResponse> = await apiClient.get(endpoint, {
        // Location search should be accessible without auth
        requiresAuth: false,
      });

      // Some APIs wrap data inside { data: ... }, others return the object directly
      const payload = (response.data as any) || {};
      const extracted: LocationsSearchResponse = payload.data || payload;

      if (extracted && Array.isArray(extracted.locations)) {
        return extracted as LocationsSearchResponse;
      }

      return { locations: [], total: 0 };
    } catch (error) {
      console.error('Failed to search kirimku locations:', error);
      throw handleApiError(error);
    }
  }
}

export const kirimkuService = new KirimkuService();