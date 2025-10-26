/**
 * Shipping Service Integration Test
 * Tests the shipping service methods and integration with WarrantyClaim component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shippingService } from '@/services/shippingService';
import { apiClient } from '@/lib/api';
import { secureTokenStorage } from '@/services/secureTokenStorage';
import { jwtTokenManager } from '@/services/jwtTokenManager';

// Mock the API client
vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    setAuthToken: vi.fn(),
  },
  handleApiError: (e: unknown) => ({ code: 'error', message: (e as Error)?.message || 'error' }),
}));

// Mock the tenant context (used by getStorefrontCouriers indirectly via API client tenant routing)
vi.mock('@/contexts/TenantContext', () => ({
  useTenant: () => ({
    slug: 'test-storefront',
    tenant: { id: 'test-tenant' }
  })
}));

describe('Shipping Service Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should have all required methods', () => {
    expect(shippingService.searchLocations).toBeDefined();
    expect(shippingService.getDestinations).toBeDefined();
    expect(shippingService.getStorefrontCouriers).toBeDefined();
    expect(shippingService.formatCouriersForDropdown).toBeDefined();
  });

  it('should format couriers for dropdown correctly', () => {
    const mockCouriers = [
      {
        id: 'jne',
        name: 'JNE',
        services: [
          {
            id: 'reg',
            name: 'Regular',
            description: '2-3 days',
            cost: 15000,
            estimated_days: '2-3'
          }
        ]
      }
    ];

    const formatted = shippingService.formatCouriersForDropdown(mockCouriers);
    
    expect(formatted).toHaveLength(1);
    expect(formatted[0]).toEqual({
      value: 'jne-reg',
      label: 'JNE - Regular',
      description: '2-3 days - Rp 15.000',
      cost: 15000,
      estimatedDays: '2-3',
      courierId: 'jne',
      serviceId: 'reg'
    });
  });

  it('should handle empty courier list', () => {
    const formatted = shippingService.formatCouriersForDropdown([]);
    expect(formatted).toEqual([]);
  });

  it('should handle couriers with multiple services', () => {
    const mockCouriers = [
      {
        id: 'jne',
        name: 'JNE',
        services: [
          {
            id: 'reg',
            name: 'Regular',
            description: '2-3 days',
            cost: 15000,
            estimated_days: '2-3'
          },
          {
            id: 'yes',
            name: 'YES',
            description: '1 day',
            cost: 25000,
            estimated_days: '1'
          }
        ]
      }
    ];

    const formatted = shippingService.formatCouriersForDropdown(mockCouriers);
    
    expect(formatted).toHaveLength(2);
    expect(formatted[0].value).toBe('jne-reg');
    expect(formatted[1].value).toBe('jne-yes');
  });

  it('getDestinations returns default fallback when unauthenticated', async () => {
    // Spy on token storage and manager to avoid network calls
    vi.spyOn(secureTokenStorage, 'getAccessToken').mockReturnValue(null);
    vi.spyOn(secureTokenStorage, 'isTokenExpiringSoon').mockReturnValue(false);
    vi.spyOn(jwtTokenManager, 'refreshToken').mockResolvedValue(false);

    const result = await shippingService.getDestinations();
    expect(apiClient.setAuthToken).toHaveBeenCalledWith(null);
    expect(result.default_destination).toBeDefined();
    expect(result.default_destination?.is_default).toBe(true);
    expect(result.destinations.length).toBeGreaterThan(0);
  });

  it('getDestinations calls API when authenticated and returns data', async () => {
    // Simulate authenticated state
    vi.spyOn(secureTokenStorage, 'getAccessToken').mockReturnValue('access-token');
    vi.spyOn(secureTokenStorage, 'isTokenExpiringSoon').mockReturnValue(false);

    // Mock API response
    (apiClient.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: {
        destinations: [
          {
            id: 'svc',
            name: 'Service Center',
            address: 'Jl. Warranty 1',
            area_id: 'jakarta-selatan',
            area_name: 'Jakarta Selatan',
            city: 'Jakarta',
            province: 'DKI Jakarta',
            postal_code: '12345',
            is_default: true
          }
        ],
        default_destination: {
          id: 'svc',
          name: 'Service Center',
          address: 'Jl. Warranty 1',
          area_id: 'jakarta-selatan',
          area_name: 'Jakarta Selatan',
          city: 'Jakarta',
          province: 'DKI Jakarta',
          postal_code: '12345',
          is_default: true
        }
      }
    });

    const result = await shippingService.getDestinations();
    expect(apiClient.setAuthToken).toHaveBeenCalledWith('access-token');
    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/v1/customer/shipping/destinations',
      { requiresAuth: true }
    );
    expect(result.default_destination?.id).toBe('svc');
  });

  it('getDestinations falls back on auth error from API', async () => {
    vi.spyOn(secureTokenStorage, 'getAccessToken').mockReturnValue('access-token');
    vi.spyOn(secureTokenStorage, 'isTokenExpiringSoon').mockReturnValue(false);

    (apiClient.get as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Authentication required'));

    const result = await shippingService.getDestinations();
    expect(result.default_destination?.is_default).toBe(true);
    expect(apiClient.get).toHaveBeenCalled();
  });
});