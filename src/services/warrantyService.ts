/**
 * Warranty Service - Handles warranty barcode validation, activation, and claim management
 * Implements warranty-customer-endpoints.yaml OpenAPI specification
 */

import { 
  StorefrontApiClient,
  ApiError
} from '@/lib/storefrontApiClient';
import {
  WarrantyBarcode,
  WarrantyClaim,
  WarrantyClaimAttachment,
  ValidateBarcodeRequest,
  ValidateBarcodeResponse,
  ActivateWarrantyRequest,
  ActivateWarrantyResponse,
  GetCustomerWarrantiesParams,
  GetCustomerWarrantiesResponse,
  GetWarrantyDetailsResponse,
  SubmitClaimRequest,
  SubmitClaimResponse,
  GetCustomerClaimsParams,
  GetCustomerClaimsResponse,
  GetClaimDetailsResponse,
  UpdateClaimRequest,
  UpdateClaimResponse,
  UploadAttachmentResponse,
  WarrantyServiceResponse,
  WarrantyProduct,
  WarrantyBarcodeToProductConverter
} from '@/types/warranty';

export class WarrantyService {
  private apiClient: StorefrontApiClient;
  private baseUrl: string;
  private currentStorefrontSlug: string | null = null;

  constructor() {
    this.apiClient = new StorefrontApiClient();
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090';
    this.initializeStorefront();
  }

  /**
   * Initialize storefront context
   */
  private initializeStorefront(): void {
    // In development, automatically set to 'rexus' storefront
    if (import.meta.env.DEV) {
      this.currentStorefrontSlug = 'rexus';
      console.info('Development mode: Using "rexus" as default storefront slug');
    }
    // In production, this will be set by the tenant context
  }

  /**
   * Get current storefront slug
   */
  private getStorefrontSlug(): string {
    if (!this.currentStorefrontSlug) {
      throw new ApiError({ 
        message: 'Storefront context not initialized', 
        status: 400, 
        details: 'STOREFRONT_NOT_SET' 
      });
    }
    return this.currentStorefrontSlug;
  }

  /**
   * Set storefront slug (for multi-tenant support)
   */
  setStorefrontSlug(slug: string): void {
    this.currentStorefrontSlug = slug;
  }

  /**
   * Build warranty endpoint URL
   */
  private buildWarrantyUrl(endpoint: string): string {
    const cleanSlug = this.getStorefrontSlug().replace(/^\/+|\/+$/g, '');
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    return `${this.baseUrl}/api/v1/storefront/${cleanSlug}/${cleanEndpoint}`;
  }

  /**
   * Make HTTP request with error handling
   */
  private async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    // Add authorization header if we have a token
    const accessToken = this.apiClient.getAccessToken();
    if (accessToken && !headers.Authorization) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError({
        message: errorText || `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        details: errorText,
      });
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text() as T;
  }

  /**
   * Convert WarrantyBarcode to WarrantyProduct for UI compatibility
   */
  private convertBarcodeToProduct: WarrantyBarcodeToProductConverter = (barcode: WarrantyBarcode): WarrantyProduct => {
    return {
      id: barcode.id,
      name: barcode.product_name || 'Unknown Product',
      model: barcode.product_model || 'Unknown Model',
      serialNumber: barcode.barcode_string,
      purchaseDate: barcode.activation_date || barcode.created_at,
      warrantyExpiry: barcode.expiry_date || '',
      status: barcode.status === 'activated' ? 'active' : 
              barcode.status === 'expired' ? 'expired' : 
              barcode.status === 'claimed' ? 'claimed' : 'active',
      category: barcode.product_category || 'Unknown',
      image: '/placeholder.svg', // Default placeholder
      barcodeId: barcode.id
    };
  };

  // PUBLIC ENDPOINTS (No authentication required)

  /**
   * Validate warranty barcode
   */
  async validateBarcode(barcode: string): Promise<WarrantyServiceResponse<ValidateBarcodeResponse>> {
    try {
      const request: ValidateBarcodeRequest = { barcode };
      
      const response = await this.makeRequest<ValidateBarcodeResponse>(
        this.buildWarrantyUrl('warranty/validate-barcode'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      return {
        success: true,
        data: response,
        message: response.message
      };
    } catch (error) {
      console.error('❌ Barcode validation failed:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Barcode validation failed',
        message: 'Failed to validate barcode'
      };
    }
  }

  /**
   * Activate warranty with barcode
   */
  async activateWarranty(data: ActivateWarrantyRequest): Promise<WarrantyServiceResponse<ActivateWarrantyResponse>> {
    try {
      const response = await this.makeRequest<ActivateWarrantyResponse>(
        this.buildWarrantyUrl('warranty/activate'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      return {
        success: true,
        data: response,
        message: response.message
      };
    } catch (error) {
      console.error('❌ Warranty activation failed:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Warranty activation failed',
        message: 'Failed to activate warranty'
      };
    }
  }

  // PROTECTED CUSTOMER ENDPOINTS (Authentication required)

  /**
   * Get customer's warranties with pagination and filtering
   */
  async getCustomerWarranties(params: GetCustomerWarrantiesParams = {}): Promise<WarrantyServiceResponse<GetCustomerWarrantiesResponse>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.set('page', params.page.toString());
      if (params.limit) queryParams.set('limit', params.limit.toString());
      if (params.status) queryParams.set('status', params.status);
      if (params.search) queryParams.set('search', params.search);

      const url = this.buildWarrantyUrl(
        `warranty/customer/warranties?${queryParams.toString()}`
      );

      const response = await this.makeRequest<GetCustomerWarrantiesResponse>(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiClient.getAccessToken()}`,
        },
      });

      return {
        success: true,
        data: response,
        message: 'Warranties retrieved successfully'
      };
    } catch (error) {
      console.error('❌ Failed to get customer warranties:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to get warranties',
        message: 'Failed to retrieve warranties'
      };
    }
  }

  /**
   * Get customer's warranties as WarrantyProduct array (for UI compatibility)
   */
  async getCustomerWarrantiesAsProducts(params: GetCustomerWarrantiesParams = {}): Promise<WarrantyServiceResponse<WarrantyProduct[]>> {
    try {
      const result = await this.getCustomerWarranties(params);
      
      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error,
          message: result.message
        };
      }

      const products = result.data.warranties.map(this.convertBarcodeToProduct);

      return {
        success: true,
        data: products,
        message: 'Warranties retrieved successfully'
      };
    } catch (error) {
      console.error('❌ Failed to get customer warranties as products:', error);
      return {
        success: false,
        error: 'Failed to get warranties',
        message: 'Failed to retrieve warranties'
      };
    }
  }

  /**
   * Get specific warranty details by ID
   */
  async getWarrantyDetails(warrantyId: string): Promise<WarrantyServiceResponse<GetWarrantyDetailsResponse>> {
    try {
      const url = this.buildWarrantyUrl(
        `warranty/customer/warranties/${warrantyId}`
      );

      const response = await this.makeRequest<GetWarrantyDetailsResponse>(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiClient.getAccessToken()}`,
        },
      });

      return {
        success: true,
        data: response,
        message: 'Warranty details retrieved successfully'
      };
    } catch (error) {
      console.error('❌ Failed to get warranty details:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to get warranty details',
        message: 'Failed to retrieve warranty details'
      };
    }
  }

  /**
   * Submit new warranty claim
   */
  async submitClaim(data: SubmitClaimRequest): Promise<WarrantyServiceResponse<SubmitClaimResponse>> {
    try {
      const url = this.buildWarrantyUrl(
        'warranty/customer/claims'
      );

      const response = await this.makeRequest<SubmitClaimResponse>(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiClient.getAccessToken()}`,
        },
        body: JSON.stringify(data),
      });

      return {
        success: true,
        data: response,
        message: response.message
      };
    } catch (error) {
      console.error('❌ Failed to submit warranty claim:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to submit claim',
        message: 'Failed to submit warranty claim'
      };
    }
  }

  /**
   * Get customer's warranty claims with pagination and filtering
   */
  async getCustomerClaims(params: GetCustomerClaimsParams = {}): Promise<WarrantyServiceResponse<GetCustomerClaimsResponse>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.set('page', params.page.toString());
      if (params.limit) queryParams.set('limit', params.limit.toString());
      if (params.status) queryParams.set('status', params.status);
      if (params.search) queryParams.set('search', params.search);

      const url = this.buildWarrantyUrl(
        `warranty/customer/claims?${queryParams.toString()}`
      );

      const response = await this.makeRequest<GetCustomerClaimsResponse>(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiClient.getAccessToken()}`,
        },
      });

      return {
        success: true,
        data: response,
        message: 'Claims retrieved successfully'
      };
    } catch (error) {
      console.error('❌ Failed to get customer claims:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to get claims',
        message: 'Failed to retrieve claims'
      };
    }
  }

  /**
   * Get specific claim details by ID
   */
  async getClaimDetails(claimId: string): Promise<WarrantyServiceResponse<GetClaimDetailsResponse>> {
    try {
      const url = this.buildWarrantyUrl(
        `warranty/customer/claims/${claimId}`
      );

      const response = await this.makeRequest<GetClaimDetailsResponse>(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiClient.getAccessToken()}`,
        },
      });

      return {
        success: true,
        data: response,
        message: 'Claim details retrieved successfully'
      };
    } catch (error) {
      console.error('❌ Failed to get claim details:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to get claim details',
        message: 'Failed to retrieve claim details'
      };
    }
  }

  /**
   * Update warranty claim
   */
  async updateClaim(claimId: string, data: UpdateClaimRequest): Promise<WarrantyServiceResponse<UpdateClaimResponse>> {
    try {
      const url = this.buildWarrantyUrl(
        `warranty/customer/claims/${claimId}`
      );

      const response = await this.makeRequest<UpdateClaimResponse>(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiClient.getAccessToken()}`,
        },
        body: JSON.stringify(data),
      });

      return {
        success: true,
        data: response,
        message: response.message
      };
    } catch (error) {
      console.error('❌ Failed to update warranty claim:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to update claim',
        message: 'Failed to update warranty claim'
      };
    }
  }

  /**
   * Cancel warranty claim
   */
  async cancelClaim(claimId: string): Promise<WarrantyServiceResponse<{ message: string }>> {
    try {
      const url = this.buildWarrantyUrl(
        `warranty/customer/claims/${claimId}`
      );

      await this.makeRequest(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiClient.getAccessToken()}`,
        },
      });

      return {
        success: true,
        data: { message: 'Claim cancelled successfully' },
        message: 'Claim cancelled successfully'
      };
    } catch (error) {
      console.error('❌ Failed to cancel warranty claim:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to cancel claim',
        message: 'Failed to cancel warranty claim'
      };
    }
  }

  /**
   * Upload attachment to warranty claim
   */
  async uploadClaimAttachment(claimId: string, file: File): Promise<WarrantyServiceResponse<UploadAttachmentResponse>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const url = this.buildWarrantyUrl(
        `warranty/customer/claims/${claimId}/attachments`
      );

      const response = await this.makeRequest<UploadAttachmentResponse>(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiClient.getAccessToken()}`,
        },
        body: formData,
      });

      return {
        success: true,
        data: response,
        message: response.message
      };
    } catch (error) {
      console.error('❌ Failed to upload claim attachment:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to upload attachment',
        message: 'Failed to upload attachment'
      };
    }
  }

  /**
   * Delete attachment from warranty claim
   */
  async deleteClaimAttachment(claimId: string, attachmentId: string): Promise<WarrantyServiceResponse<{ message: string }>> {
    try {
      const url = this.buildWarrantyUrl(
        `warranty/customer/claims/${claimId}/attachments/${attachmentId}`
      );

      await this.makeRequest(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiClient.getAccessToken()}`,
        },
      });

      return {
        success: true,
        data: { message: 'Attachment deleted successfully' },
        message: 'Attachment deleted successfully'
      };
    } catch (error) {
      console.error('❌ Failed to delete claim attachment:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to delete attachment',
        message: 'Failed to delete attachment'
      };
    }
  }

  /**
   * Lookup warranty by barcode (combines validation and details if valid)
   */
  async lookupWarranty(barcode: string): Promise<WarrantyServiceResponse<WarrantyProduct | null>> {
    try {
      // First validate the barcode
      const validationResult = await this.validateBarcode(barcode);
      
      if (!validationResult.success || !validationResult.data?.valid) {
        return {
          success: false,
          error: 'Invalid barcode',
          message: validationResult.data?.message || 'Barcode not found'
        };
      }

      // If valid and we have warranty data, convert to product format
      if (validationResult.data.warranty_barcode) {
        const product = this.convertBarcodeToProduct(validationResult.data.warranty_barcode);
        return {
          success: true,
          data: product,
          message: 'Warranty found successfully'
        };
      }

      return {
        success: false,
        error: 'Warranty data not available',
        message: 'Warranty information not found'
      };
    } catch (error) {
      console.error('❌ Failed to lookup warranty:', error);
      return {
        success: false,
        error: 'Failed to lookup warranty',
        message: 'Failed to lookup warranty'
      };
    }
  }
}

// Export singleton instance
export const warrantyService = new WarrantyService();