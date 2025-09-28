/**
 * Tenant Service - Handles tenant configuration and management
 */

import { apiClient, ApiResponse, handleApiError } from '@/lib/api';
import { TenantConfig, TenantApiResponse } from '@/types/tenant';

export interface TenantUpdateRequest {
  branding?: Partial<TenantConfig['branding']>;
  settings?: Partial<TenantConfig['settings']>;
  features?: Partial<TenantConfig['features']>;
}

export interface TenantValidationResponse {
  isValid: boolean;
  tenant?: TenantConfig;
  error?: string;
}

export class TenantService {
  /**
   * Get tenant configuration by subdomain
   */
  async getTenantBySubdomain(subdomain: string): Promise<TenantConfig | null> {
    try {
      const response = await apiClient.get<TenantApiResponse>(`/api/tenants/${subdomain}`);
      
      if (response.success && response.data?.success && response.data.data) {
        return response.data.data;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to fetch tenant configuration:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Validate tenant subdomain
   */
  async validateTenant(subdomain: string): Promise<TenantValidationResponse> {
    try {
      const response = await apiClient.get<TenantValidationResponse>(`/api/tenants/${subdomain}/validate`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return {
        isValid: false,
        error: 'Failed to validate tenant',
      };
    } catch (error) {
      console.error('Failed to validate tenant:', error);
      return {
        isValid: false,
        error: handleApiError(error).message,
      };
    }
  }

  /**
   * Update tenant configuration (admin only)
   */
  async updateTenant(tenantId: string, updates: TenantUpdateRequest): Promise<TenantConfig> {
    try {
      const response = await apiClient.put<TenantApiResponse>(
        `/api/tenants/${tenantId}`,
        updates,
        { requiresAuth: true }
      );
      
      if (response.success && response.data?.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data?.error || 'Failed to update tenant');
    } catch (error) {
      console.error('Failed to update tenant:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get tenant analytics and metrics (admin only)
   */
  async getTenantAnalytics(tenantId: string, period: '7d' | '30d' | '90d' = '30d') {
    try {
      const response = await apiClient.get(
        `/api/tenants/${tenantId}/analytics?period=${period}`,
        { requiresAuth: true }
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error('Failed to fetch tenant analytics');
    } catch (error) {
      console.error('Failed to fetch tenant analytics:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get tenant feature usage statistics
   */
  async getFeatureUsage(tenantId: string) {
    try {
      const response = await apiClient.get(
        `/api/tenants/${tenantId}/features/usage`,
        { requiresAuth: true }
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error('Failed to fetch feature usage');
    } catch (error) {
      console.error('Failed to fetch feature usage:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Update tenant feature flags
   */
  async updateFeatures(tenantId: string, features: Partial<TenantConfig['features']>) {
    try {
      const response = await apiClient.patch<TenantApiResponse>(
        `/api/tenants/${tenantId}/features`,
        { features },
        { requiresAuth: true }
      );
      
      if (response.success && response.data?.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data?.error || 'Failed to update features');
    } catch (error) {
      console.error('Failed to update features:', error);
      throw handleApiError(error);
    }
  }
}

// Create singleton instance
export const tenantService = new TenantService();