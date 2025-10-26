/**
 * Shipping Service - Handles shipping-related operations including locations, destinations, and couriers
 */

import { apiClient, handleApiError, type ApiResponse } from '@/lib/api';
import { useTenant } from '@/contexts/TenantContext';
import { tenantResolver } from '@/services/tenantResolver';

// Location Types
export interface ShippingLocation {
  id: string;
  name: string;
  type: 'province' | 'city' | 'district' | 'area';
  province?: string;
  city?: string;
  district?: string;
  postal_code?: string;
}

export interface LocationSearchResponse {
  locations: ShippingLocation[];
  total: number;
}

// Destination Types
export interface ShippingDestination {
  id: string;
  name: string;
  address: string;
  area_id: string;
  area_name: string;
  city: string;
  province: string;
  postal_code: string;
  phone?: string;
  is_default: boolean;
}

export interface DestinationsResponse {
  destinations: ShippingDestination[];
  default_destination?: ShippingDestination;
}

// Courier Types
export interface CourierService {
  id: string;
  name: string;
  description?: string;
  cost: number;
  estimated_days: string;
  insurance_fee?: number;
  cod_fee?: number;
}

export interface Courier {
  id: string;
  name: string;
  logo?: string;
  services: CourierService[];
}

// Simplified courier request interface - only city/district format
export interface CourierRequest {
  from_city: string;
  from_district: string;
  to_city?: string;
  to_district?: string;
  weight: number; // in grams
  length?: number; // in cm
  width?: number; // in cm
  height?: number; // in cm
  value?: number; // in rupiah
  cod?: boolean;
  insurance?: boolean;
}

export interface CourierResponse {
  couriers: Courier[] | null;
  total: number;
}

export class ShippingService {
  /**
   * Get storefront slug for API headers
   */
  private getStorefrontSlug(): string {
    try {
      return tenantResolver.resolveTenant().slug || 'rexus';
    } catch (error) {
      console.warn('Failed to resolve tenant, using default storefront slug');
      return 'rexus'; // Default fallback for development
    }
  }

  /**
   * Search for shipping locations (provinces, cities, districts, areas)
   */
  async searchLocations(
    query: string,
    type?: 'province' | 'city' | 'district' | 'area',
    limit: number = 10
  ): Promise<LocationSearchResponse> {
    try {
      const params = new URLSearchParams({
        query: query,
        limit: limit.toString(),
      });
      
      if (type) {
        params.append('type', type);
      }

      const response = await apiClient.get<LocationSearchResponse>(
        `/api/v1/customer/shipping/locations/search?${params.toString()}`,
        { 
          requiresAuth: true,
          headers: {
            'X-Storefront-Slug': this.getStorefrontSlug()
          }
        }
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to search locations');
    } catch (error) {
      console.error('Failed to search locations:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get customer shipping destinations (warranty addresses)
   * Returns default fallback for unauthenticated users
   */
  async getDestinations(): Promise<DestinationsResponse> {
    try {
      const [{ secureTokenStorage }, { jwtTokenManager }] = await Promise.all([
        import('./secureTokenStorage'),
        import('./jwtTokenManager'),
      ]);

      // Ensure we have a usable access token
      let token = secureTokenStorage.getAccessToken();

      if (!token) {
        // Attempt a direct refresh when no access token is in memory
        await jwtTokenManager.refreshToken();
        token = secureTokenStorage.getAccessToken();
      } else if (secureTokenStorage.isTokenExpiringSoon()) {
        // Validate and refresh if token is close to expiry
        await jwtTokenManager.validateAndRefreshIfNeeded();
        token = secureTokenStorage.getAccessToken();
      }

      // Update API client with the latest token (can be null if unauthenticated)
      await apiClient.setAuthToken(token);

      // If still no token, return default fallback rather than erroring out
      if (!token) {
        console.warn('Unauthenticated: using default warranty destination fallback');
        return this.getDefaultWarrantyDestination();
      }

      // The API returns a single WarrantyAddress object under `data`
      const response = await apiClient.get<WarrantyAddressPayload | WarrantyDestinationsPayload>(
        '/api/v1/customer/shipping/destinations',
        { 
          requiresAuth: true,
          headers: {
            'X-Storefront-Slug': this.getStorefrontSlug()
          }
        }
      );

      // Normalize into our DestinationsResponse shape
      if (response.success && response.data) {
        const data = response.data as WarrantyAddressPayload | WarrantyDestinationsPayload;
        let raw: WarrantyAddressPayload | undefined;
        if ((data as WarrantyDestinationsPayload).destinations || (data as WarrantyDestinationsPayload).default_destination) {
          const legacy = data as WarrantyDestinationsPayload;
          raw = legacy.default_destination ?? legacy.destinations?.[0];
        } else {
          raw = data as WarrantyAddressPayload;
        }

        if (!raw) {
          throw new Error('No destination found');
        }

        const normalized = this.normalizeWarrantyAddress(raw);
        return {
          destinations: [normalized],
          default_destination: normalized,
        };
      }

      throw new Error('Failed to get destinations');
    } catch (error) {
      // On auth errors, gracefully fall back to default destination
      const message = (error as Error)?.message || '';
      if (/Authentication required|unauthorized|401/i.test(message)) {
        console.warn('Auth error while fetching destinations; using fallback');
        return this.getDefaultWarrantyDestination();
      }

      console.error('Failed to get destinations:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Normalize API WarrantyAddress (or similar) payload into ShippingDestination
   */
  private normalizeWarrantyAddress(data: WarrantyAddressPayload): ShippingDestination {
    return {
      id: data?.id ?? 'warranty-service-center',
      name: data?.name ?? 'Warranty Service Center',
      address: data?.address ?? data?.full_address ?? '',
      area_id: data?.area_id ?? data?.area?.id ?? data?.location_id ?? 'jakarta-selatan',
      area_name: data?.area_name ?? data?.area?.name ?? data?.city ?? '',
      city: data?.city ?? data?.city_name ?? '',
      province: data?.province ?? data?.province_name ?? '',
      postal_code: data?.postal_code ?? data?.zip ?? '',
      phone: data?.phone ?? data?.contact_phone ?? undefined,
      is_default: (data?.is_default ?? true) as boolean,
    };
  }

  /**
   * Get default warranty service center destination (fallback for unauthenticated users)
   */
  private getDefaultWarrantyDestination(): DestinationsResponse {
    return {
      destinations: [
        {
          id: 'warranty-service-center',
          name: 'Warranty Service Center',
          address: 'Jl. Raya Warranty No. 123, Jakarta Selatan',
          area_id: 'jakarta-selatan',
          area_name: 'Jakarta Selatan',
          city: 'Jakarta Selatan',
          province: 'DKI Jakarta',
          postal_code: '12345',
          phone: '+62-21-1234567',
          is_default: true
        }
      ],
      default_destination: {
        id: 'warranty-service-center',
        name: 'Warranty Service Center',
        address: 'Jl. Raya Warranty No. 123, Jakarta Selatan',
        area_id: 'jakarta-selatan',
        area_name: 'Jakarta Selatan',
        city: 'Jakarta Selatan',
        province: 'DKI Jakarta',
        postal_code: '12345',
        phone: '+62-21-1234567',
        is_default: true
      }
    };
  }

  /**
   * Get available couriers and rates for shipping
   */
  async getCouriers(request: CourierRequest): Promise<CourierResponse> {
    try {
      const payload = {
        from_city: request.from_city,
        from_district: request.from_district,
        ...(request.to_city ? { to_city: request.to_city } : {}),
        ...(request.to_district ? { to_district: request.to_district } : {}),
        weight: request.weight,
        ...(request.length ? { length: request.length } : {}),
        ...(request.width ? { width: request.width } : {}),
        ...(request.height ? { height: request.height } : {}),
        ...(request.value ? { value: request.value } : {}),
        ...(request.cod !== undefined ? { cod: request.cod } : {}),
        ...(request.insurance !== undefined ? { insurance: request.insurance } : {}),
      };

      const response = await apiClient.post<unknown>(
        '/api/v1/customer/shipping/couriers',
        payload,
        { 
          requiresAuth: true,
          headers: {
            'X-Storefront-Slug': this.getStorefrontSlug()
          }
        }
      );

      if (response.success && response.data !== undefined) {
        const couriers = normalizeCouriersPayload(response.data as unknown);
        return { couriers, total: couriers ? couriers.length : 0 };
      }

      throw new Error('Failed to get couriers');
    } catch (error) {
      console.error('Failed to get couriers:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get available couriers for storefront (uses storefront's default warranty address as destination)
   */
  async getStorefrontCouriers(
    storefrontSlug: string,
    request: CourierRequest
  ): Promise<CourierResponse> {
    try {
      const payload = {
        from_city: request.from_city,
        from_district: request.from_district,
        ...(request.to_city ? { to_city: request.to_city } : {}),
        ...(request.to_district ? { to_district: request.to_district } : {}),
        weight: request.weight,
        ...(request.length ? { length: request.length } : {}),
        ...(request.width ? { width: request.width } : {}),
        ...(request.height ? { height: request.height } : {}),
        ...(request.value ? { value: request.value } : {}),
        ...(request.cod !== undefined ? { cod: request.cod } : {}),
        ...(request.insurance !== undefined ? { insurance: request.insurance } : {}),
      };

      const response = await apiClient.post<unknown>(
        `/api/v1/storefront/${storefrontSlug}/shipping/couriers`,
        payload,
        { 
          requiresAuth: true,
          headers: {
            'X-Storefront-Slug': this.getStorefrontSlug()
          }
        }
      );

      if (response.success && response.data !== undefined) {
        const couriers = normalizeCouriersPayload(response.data as unknown);
        return { couriers, total: couriers ? couriers.length : 0 };
      }

      throw new Error('Failed to get storefront couriers');
    } catch (error) {
      console.error('Failed to get storefront couriers:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Helper method to get default destination area ID
   */
  async getDefaultDestinationAreaId(): Promise<string | null> {
    try {
      const destinations = await this.getDestinations();
      return destinations.default_destination?.area_id || null;
    } catch (error) {
      console.error('Failed to get default destination:', error);
      return null;
    }
  }

  /**
   * Helper method to format courier services for dropdown
   */
  formatCouriersForDropdown(couriers: Courier[] | null): Array<{
    value: string;
    label: string;
    description: string;
    cost: number;
    estimatedDays: string;
    courierId: string;
    serviceId: string;
  }> {
    const options: Array<{
      value: string;
      label: string;
      description: string;
      cost: number;
      estimatedDays: string;
      courierId: string;
      serviceId: string;
    }> = [];

    if (!couriers || couriers.length === 0) {
      return options;
    }

    couriers.forEach(courier => {
      courier.services.forEach(service => {
        options.push({
          value: `${courier.id}-${service.id}`,
          label: `${courier.name} - ${service.name}`,
          description: `${service.estimated_days} days - Rp ${service.cost.toLocaleString('id-ID')}`,
          cost: service.cost,
          estimatedDays: service.estimated_days,
          courierId: courier.id,
          serviceId: service.id,
        });
      });
    });

    return options.sort((a, b) => a.cost - b.cost); // Sort by cost
  }
}

// Export singleton instance
export const shippingService = new ShippingService();

// Define a minimal payload type for WarrantyAddress based on OpenAPI docs
interface WarrantyAddressPayload {
  id?: string;
  name?: string;
  address?: string;
  full_address?: string;
  area_id?: string;
  area?: { id?: string; name?: string };
  location_id?: string;
  area_name?: string;
  city?: string;
  city_name?: string;
  province?: string;
  province_name?: string;
  postal_code?: string;
  zip?: string;
  phone?: string;
  contact_phone?: string;
  is_default?: boolean;
}

// Support legacy destinations payload shape returned by some stubs/tests
interface WarrantyDestinationsPayload {
  destinations?: WarrantyAddressPayload[];
  default_destination?: WarrantyAddressPayload;
}


function sanitizeEstimatedDays(value: unknown): string | undefined {
  if (value == null) return undefined;
  const str = String(value).toLowerCase().trim();
  const normalized = str.replace(/hari|day|days/gi, '');
  const rangeMatch = normalized.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    return `${rangeMatch[1]}-${rangeMatch[2]}`;
  }
  const singleMatch = normalized.match(/(\d+)/);
  if (singleMatch) {
    return singleMatch[1];
  }
  const cleaned = normalized.replace(/[^\d-]/g, '');
  return cleaned || undefined;
}

// Define raw courier shapes to avoid any
type RawService = {
  service_id?: string;
  id?: string;
  service_name?: string;
  name?: string;
  price?: number | string;
  cost?: number | string;
  estimated_delivery?: string;
  estimated_days?: string;
  etd?: string;
  estimated_delivery_days?: string;
  insurance_fee?: number | string;
  cod_fee?: number | string;
};

type RawCourier = {
  courier_id?: string;
  id?: string;
  courier_name?: string;
  name?: string;
  logo?: string;
  services?: RawService[];
};

function normalizeCouriersPayload(raw: unknown): Courier[] | null {
  let couriersArray: unknown | null = undefined;
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;

    if (Object.prototype.hasOwnProperty.call(obj, 'couriers')) {
      const c = (obj as Record<string, unknown>)['couriers'];
      if (c === null) {
        return null;
      }
      if (Array.isArray(c)) {
        couriersArray = c;
      }
    } else if (obj.data && typeof obj.data === 'object') {
      const dataObj = obj.data as Record<string, unknown>;
      if (Object.prototype.hasOwnProperty.call(dataObj, 'couriers')) {
        const c = dataObj['couriers'];
        if (c === null) {
          return null;
        }
        if (Array.isArray(c)) {
          couriersArray = c;
        }
      } else if (Array.isArray(obj.data)) {
        couriersArray = obj.data as unknown[];
      }
    }
  }
  if (!couriersArray && Array.isArray(raw)) {
    couriersArray = raw as unknown[];
  }
  if (couriersArray === null) {
    return null;
  }
  const list: RawCourier[] = Array.isArray(couriersArray) ? (couriersArray as RawCourier[]) : [];
  return list.map((item): Courier => {
    const courierId = item.courier_id ?? item.id ?? '';
    const courierName = item.courier_name ?? item.name ?? '';
    const logo = item.logo ?? undefined;
    const servicesRaw: RawService[] = Array.isArray(item.services) ? item.services : [];
    const services: CourierService[] = servicesRaw.map((svc) => {
      const serviceId = svc.service_id ?? svc.id ?? '';
      const serviceName = svc.service_name ?? svc.name ?? '';
      const price = Number(svc.price ?? svc.cost ?? 0);
      const estimatedRaw = svc.estimated_delivery ?? svc.estimated_days ?? svc.etd ?? svc.estimated_delivery_days;
      const estimatedDays = sanitizeEstimatedDays(estimatedRaw) ?? '';
      const description = estimatedDays ? `${estimatedDays} days` : (typeof estimatedRaw === 'string' ? estimatedRaw : '');
      const insurance_fee = svc.insurance_fee !== undefined ? Number(svc.insurance_fee) : undefined;
      const cod_fee = svc.cod_fee !== undefined ? Number(svc.cod_fee) : undefined;
      return {
        id: serviceId,
        name: serviceName,
        description,
        cost: price,
        estimated_days: estimatedDays,
        insurance_fee,
        cod_fee,
      };
    });
    return {
      id: courierId,
      name: courierName,
      logo,
      services,
    };
  });
}