/**
 * Tenant Service - Handles tenant configuration and management
 * Enhanced with slug-based resolution and backend compatibility
 */

import { apiClient, ApiResponse, handleApiError } from '@/lib/api';
import { TenantConfig, TenantApiResponse } from '@/types/tenant';
import { tenantResolver, TenantResolutionInfo, TenantType } from './tenantResolver';
import { slugDetectionService, SlugDetectionResult } from './slugDetectionService';

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

export interface TenantResolutionRequest {
  slug?: string;
  subdomain?: string;
  path?: string;
  headers?: Record<string, string>;
}

export interface TenantResolutionResponse {
  tenant: TenantConfig | null;
  resolution: TenantResolutionInfo;
  slugDetection: SlugDetectionResult;
  apiUrl: string;
  tenantType: TenantType;
}

export class TenantService {
  /**
   * Resolve tenant using multiple detection methods (slug, subdomain, path)
   */
  async resolveTenant(request: TenantResolutionRequest): Promise<TenantResolutionResponse> {
    try {
      // Determine the primary identifier
      const identifier = request.slug || request.subdomain || request.path;
      
      if (!identifier) {
        throw new Error('No tenant identifier provided');
      }

      // Perform tenant resolution
      const resolution = tenantResolver.resolveTenant();
      
      // Perform slug detection
      const slugDetection = await slugDetectionService.detectSlug(identifier);

      // Get tenant configuration
      let tenant: TenantConfig | null = null;
      if (resolution.slug) {
        tenant = await tenantResolver.getTenantBySlug(resolution.slug);
      }

      // Get API URL
      const apiUrl = tenantResolver.getTenantApiUrl(resolution.slug || identifier);

      // Get tenant type
      const tenantType = resolution.slug ? await tenantResolver.getTenantType(resolution.slug) : TenantType.SHARED;

      return {
        tenant,
        resolution,
        slugDetection,
        apiUrl,
        tenantType,
      };
    } catch (error) {
      console.error('Failed to resolve tenant:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get tenant configuration by slug (enhanced method)
   */
  async getTenantBySlug(slug: string): Promise<TenantConfig | null> {
    try {
      console.log('🔍 [TenantService] getTenantBySlug called with slug:', slug);
      
      // Use tenant resolver to get the appropriate API URL
      const apiUrl = tenantResolver.getTenantApiUrl(slug);
      console.log('🔍 [TenantService] Got API URL from resolver:', apiUrl);
      
      const fullUrl = `${apiUrl}/api/tenants/${slug}`;
      console.log('🔍 [TenantService] Making API call to:', fullUrl);
      
      const response = await apiClient.get<TenantApiResponse>(fullUrl);
      console.log('🔍 [TenantService] API response:', response);
      
      if (response.success && response.data?.success && response.data.data) {
        console.log('🔍 [TenantService] Successfully got tenant data:', response.data.data);
        return response.data.data;
      }
      
      console.log('🔍 [TenantService] No tenant data found in response');
      return null;
    } catch (error) {
      console.error('🔍 [TenantService] Failed to fetch tenant configuration by slug:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Validate tenant slug with enhanced detection
   */
  async validateTenantSlug(slug: string): Promise<TenantValidationResponse> {
    try {
      const isValid = await tenantResolver.validateTenantSlug(slug);
      
      if (!isValid) {
        return {
          isValid: false,
          error: 'Invalid tenant slug',
        };
      }

      const tenant = await tenantResolver.getTenantBySlug(slug);
      
      return {
        isValid: !!tenant,
        tenant: tenant || undefined,
        error: tenant ? undefined : 'Tenant not found',
      };
    } catch (error) {
      console.error('Failed to validate tenant slug:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  /**
   * Get tenant configuration by subdomain (legacy method for backward compatibility)
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