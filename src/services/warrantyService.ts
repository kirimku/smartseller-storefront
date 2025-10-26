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
  CustomerWarrantyRegistrationRequest,
  CustomerWarrantyRegistrationResponse,
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
import { secureTokenStorage } from '@/services/secureTokenStorage';

// Add missing helper types/guards used within this service
type FetchResponseLike = {
  ok: boolean;
  status: number;
  statusText?: string;
  headers?: Headers;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
};

function hasProp(obj: unknown, prop: string): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null && prop in obj;
}

function isWarrantyProduct(val: unknown): val is WarrantyProduct {
  if (typeof val !== 'object' || val === null) return false;
  const o = val as Record<string, unknown>;
  const status = o['status'];
  return (
    typeof o['name'] === 'string' &&
    typeof o['serialNumber'] === 'string' &&
    (status === 'active' || status === 'expired' || status === 'claimed')
  );
}

type ValidationResultUnion =
  | WarrantyServiceResponse<ValidateBarcodeResponse>
  | WarrantyServiceResponse<WarrantyProduct>;

type WarrantiesReturnSuccess = GetCustomerWarrantiesResponse & {
  success: true;
  message?: string;
  readonly data?: GetCustomerWarrantiesResponse;
};

type WarrantiesReturnFailure = {
  success: false;
  error: string;
  message?: string;
  data?: undefined;
};

type WarrantiesReturn = WarrantiesReturnSuccess | WarrantiesReturnFailure;

export class WarrantyService {
  private apiClient: StorefrontApiClient;
  private baseUrl: string;
  private currentStorefrontSlug: string | null = null;

  constructor() {
    this.apiClient = new StorefrontApiClient();
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://smartseller-api.preproduction.kirimku.com';
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
    const providedHeaders = (options.headers as Record<string, string>) || {};
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...providedHeaders,
    };

    if (!isFormData) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    } else {
      delete headers['Content-Type'];
    }

    const accessToken = secureTokenStorage.getAccessToken() || this.apiClient.getAccessToken();
    if (accessToken && !headers.Authorization) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const resp = response as FetchResponseLike;
    const contentType = resp.headers?.get('content-type') || '';

    if (!resp.ok) {
      let errPayload: unknown = null;
      const canJson = typeof resp.json === 'function';
      const canText = typeof resp.text === 'function';
      if (canJson) {
        try {
          errPayload = await resp.json();
        } catch {
          // ignore JSON parse errors
        }
      }
      if (errPayload !== null) {
        throw new ApiError({
          message: JSON.stringify(errPayload),
          status: resp.status,
          details: errPayload,
        });
      }
      const errorText = canText ? await resp.text() : '';
      throw new ApiError({
        message: errorText || `HTTP ${resp.status}: ${resp.statusText || ''}`,
        status: resp.status,
        details: errorText || null,
      });
    }

    const canJson = typeof resp.json === 'function';
    const canText = typeof resp.text === 'function';
    if (contentType.includes('application/json') && canJson) {
      return (await resp.json()) as T;
    }
    if (canJson) {
      // If JSON parsing fails, propagate the error instead of silently falling back
      return (await resp.json()) as T;
    }
    return (canText ? ((await resp.text()) as unknown as T) : ('' as unknown as T));
  }

  /**
   * Convert WarrantyBarcode to WarrantyProduct for UI compatibility
   */
  private convertBarcodeToProduct: WarrantyBarcodeToProductConverter = (barcode: WarrantyBarcode): WarrantyProduct => {
    const product = (barcode as unknown as { product?: { name?: string; model?: string; category?: string; image_url?: string } }).product;
    const name = product?.name ?? barcode.product_name ?? 'Unknown Product';
    const model = product?.model ?? barcode.product_model ?? 'Unknown Model';
    const category = product?.category ?? barcode.product_category ?? 'Unknown';
    const image = product?.image_url ?? '/placeholder.svg';
    const serialNumber = barcode.barcode_string ?? (barcode as unknown as { barcode_value?: string }).barcode_value ?? (barcode as unknown as { barcode?: string }).barcode ?? '';
    const purchaseDate = barcode.activation_date ?? (barcode as unknown as { activated_at?: string }).activated_at ?? barcode.created_at;
    const warrantyExpiry = barcode.expiry_date ?? '';
    const rawStatus = barcode.status;
    const status: 'active' | 'expired' | 'claimed' =
      rawStatus === 'expired' ? 'expired' :
      rawStatus === 'claimed' ? 'claimed' :
      'active';

    return {
      id: barcode.id,
      name,
      model,
      serialNumber,
      purchaseDate,
      warrantyExpiry,
      status,
      category,
      image,
      barcodeId: barcode.id
    };
  };

  // PUBLIC ENDPOINTS (No authentication required)

  /**
   * Validate warranty barcode
   */
  async validateBarcode(barcode: string): Promise<WarrantyServiceResponse<ValidateBarcodeResponse> | WarrantyServiceResponse<WarrantyProduct>> {
    try {
      const request: ValidateBarcodeRequest = { barcode };
      
      const response = await this.makeRequest<ValidateBarcodeResponse | WarrantyServiceResponse<WarrantyProduct>>(
        this.buildWarrantyUrl('warranty/validate-barcode'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      if (response && typeof response === 'object' && hasProp(response, 'success')) {
        return response as WarrantyServiceResponse<WarrantyProduct>;
      }

      const v = response as ValidateBarcodeResponse;
      return {
        success: true,
        data: v,
        message: v.message
      };
    } catch (error) {
      console.error('❌ Barcode validation failed:', error);
      if (error instanceof ApiError) {
        if (error.details && typeof error.details === 'object') {
          return error.details as WarrantyServiceResponse<WarrantyProduct>;
        }
        try {
          const parsed = JSON.parse(error.message);
          return parsed as WarrantyServiceResponse<WarrantyProduct>;
        } catch {
          return { success: false, error: error.message } as WarrantyServiceResponse<WarrantyProduct>;
        }
      }
      throw error;
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

  /**
   * Register warranty to customer account (Authentication required)
   */
  async registerWarranty(
    data: CustomerWarrantyRegistrationRequest | FormData
  ): Promise<
    (CustomerWarrantyRegistrationResponse & { readonly data?: CustomerWarrantyRegistrationResponse; readonly message?: string; readonly success?: true }) |
    { success: false; error: string; message?: string; [key: string]: unknown }
  > {
    try {
      // Use storefront customer register endpoint (also accepts file upload via multipart)
      const url = this.buildWarrantyUrl('warranties/register');

      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;

      const options: RequestInit = {
        method: 'POST',
      };

      if (isFormData) {
        options.body = data as FormData;
        // Content-Type will be set automatically by the browser for FormData
      } else {
        options.headers = {
          'Content-Type': 'application/json',
        };
        options.body = JSON.stringify(data as CustomerWarrantyRegistrationRequest);
      }

      const response = await this.makeRequest<CustomerWarrantyRegistrationResponse>(url, options);

      // Augment raw success with non-enumerable wrapper fields for UI compatibility
      const result = { ...response };
      Object.defineProperty(result, 'data', { get: () => response, enumerable: false });
      Object.defineProperty(result, 'message', { value: 'Warranty registered successfully', enumerable: false });
      Object.defineProperty(result, 'success', { value: true, enumerable: false });

      return result as CustomerWarrantyRegistrationResponse & { readonly data?: CustomerWarrantyRegistrationResponse; readonly message?: string; readonly success?: true };
    } catch (error) {
      console.error('❌ Warranty registration failed:', error);
      // Return server-provided JSON error object when available; otherwise rethrow network errors
      if (error instanceof ApiError) {
        // If ApiError.details carries parsed JSON, return it directly
        if (error.details && typeof error.details === 'object') {
          return error.details as { success: false; error: string; message?: string; [key: string]: unknown };
        }
        // Try to parse JSON string contained in message
        try {
          const parsed = JSON.parse(error.message);
          return parsed as { success: false; error: string; message?: string; [key: string]: unknown };
        } catch {
          // Fallback minimal shape
          return { success: false, error: (error as Error).message, message: 'Failed to register warranty' };
        }
      }
      throw error;
    }
  }



  // PROTECTED CUSTOMER ENDPOINTS (Authentication required)

  /**
   * Get customer's warranties with pagination and filtering
   */
  async getCustomerWarranties(params: GetCustomerWarrantiesParams = {}): Promise<WarrantiesReturn> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.set('page', params.page.toString());
      if (params.limit) queryParams.set('limit', params.limit.toString());
      if (params.status) queryParams.set('status', params.status);
      if (params.search) queryParams.set('search', params.search);

      const url = this.buildWarrantyUrl(
        `warranties?${queryParams.toString()}`
      );

      const response = await this.makeRequest<GetCustomerWarrantiesResponse>(url, {
        method: 'GET',
      });

      const result: WarrantiesReturnSuccess = { ...response, success: true };
      Object.defineProperty(result, 'message', { value: 'Warranties retrieved successfully', enumerable: false });
      Object.defineProperty(result, 'data', { get: () => response, enumerable: false });

      return result;
    } catch (error) {
      console.error('❌ Failed to get customer warranties:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to get warranties',
        message: 'Failed to retrieve warranties'
      } as WarrantiesReturnFailure;
    }
  }

  /**
   * Get customer's warranties as WarrantyProduct array (for UI compatibility)
   */
  async getCustomerWarrantiesAsProducts(params: GetCustomerWarrantiesParams = {}): Promise<WarrantyServiceResponse<WarrantyProduct[]>> {
    try {
      const result = await this.getCustomerWarranties(params);
      
      if (!result.success) {
        return {
          success: false,
          error: (result as WarrantiesReturnFailure).error,
          message: result.message
        };
      }

      if (!result.data) {
        return {
          success: false,
          error: 'Failed to get warranties',
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
      const url = this.buildWarrantyUrl('claims/submit');
      const response = await this.makeRequest<SubmitClaimResponse>(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
  async preUploadClaimAttachment(file: File): Promise<WarrantyServiceResponse<import('@/types/warranty').PreUploadAttachmentResponse>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const url = this.buildWarrantyUrl('claims/attachments/upload');

      const response = await this.makeRequest<import('@/types/warranty').PreUploadAttachmentResponse>(url, {
        method: 'POST',
        body: formData,
      });

      return {
        success: true,
        data: response,
        message: response.message
      };
    } catch (error) {
      console.error('❌ Failed to pre-upload claim attachment:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to upload attachment',
        message: 'Failed to upload attachment'
      };
    }
  }

  /**
   * Upload proof of purchase document for warranty registration
   */
  async uploadProofOfPurchase(file: File, documentType: 'receipt' | 'invoice' | 'purchase_order' | 'warranty_card' = 'receipt'): Promise<WarrantyServiceResponse<{ document_url: string; document_type: string }>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);

      const url = this.buildWarrantyUrl('warranties/upload-proof');

      const response = await this.makeRequest<{ 
        success: boolean; 
        message: string; 
        data: { document_url: string; document_type: string; file_name: string; file_size: number } 
      }>(url, {
        method: 'POST',
        body: formData,
      });

      return {
        success: true,
        data: {
          document_url: response.data.document_url,
          document_type: response.data.document_type
        },
        message: response.message || 'Proof of purchase uploaded successfully'
      };
    } catch (error) {
      console.error('❌ Failed to upload proof of purchase:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to upload proof of purchase',
        message: 'Failed to upload proof of purchase'
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
      const validationResult = (await this.validateBarcode(barcode)) as ValidationResultUnion;
      const data = validationResult?.data;

      if (!validationResult || !validationResult.success) {
        return validationResult as WarrantyServiceResponse<WarrantyProduct | null>;
      }

      if (isWarrantyProduct(data)) {
        return validationResult as WarrantyServiceResponse<WarrantyProduct>;
      }

      const obj = (data || {}) as Record<string, unknown>;
      const valid = obj['valid'] as boolean | undefined;

      if (valid === false) {
        if (hasProp(obj, 'product') && hasProp(obj, 'warranty')) {
          const product: WarrantyProduct = {
            id: String((obj['warranty'] as Record<string, unknown>)['id'] || ''),
            name: String((obj['product'] as Record<string, unknown>)['name'] || 'Unknown Product'),
            model: String((obj['product'] as Record<string, unknown>)['model'] || 'Unknown Model'),
            serialNumber: String((obj['warranty'] as Record<string, unknown>)['barcode_value'] || (obj['warranty'] as Record<string, unknown>)['barcode'] || barcode),
            purchaseDate: String((obj['warranty'] as Record<string, unknown>)['activated_at'] || ''),
            warrantyExpiry: String((obj['warranty'] as Record<string, unknown>)['expiry_date'] || ''),
            status: ((obj['warranty'] as Record<string, unknown>)['status'] === 'activated') ? 'active' :
                    ((obj['warranty'] as Record<string, unknown>)['status'] === 'expired') ? 'expired' :
                    ((obj['warranty'] as Record<string, unknown>)['status'] === 'claimed') ? 'claimed' : 'active',
            category: String((obj['product'] as Record<string, unknown>)['category'] || 'Unknown'),
            image: String((obj['product'] as Record<string, unknown>)['image_url'] || '/placeholder.svg'),
            barcodeId: String((obj['warranty'] as Record<string, unknown>)['id'] || '')
          };
          return {
            success: true,
            data: product,
            message: String(obj['message'] || 'Warranty found (inactive)')
          };
        }

        return {
          success: false,
          error: 'Invalid barcode',
          message: String(obj['message'] || 'Barcode not found')
        };
      }

      const hasWb = hasProp(obj, 'warranty_barcode');
      if (hasWb) {
        const product = this.convertBarcodeToProduct((obj['warranty_barcode'] as WarrantyBarcode));
        return {
          success: true,
          data: product,
          message: 'Warranty found successfully'
        };
      }

      const hasProductWarranty = hasProp(obj, 'product') && hasProp(obj, 'warranty');
      if (hasProductWarranty) {
        const product: WarrantyProduct = {
          id: String((obj['warranty'] as Record<string, unknown>)['id'] || ''),
          name: String((obj['product'] as Record<string, unknown>)['name'] || 'Unknown Product'),
          model: String((obj['product'] as Record<string, unknown>)['model'] || 'Unknown Model'),
          serialNumber: String((obj['warranty'] as Record<string, unknown>)['barcode_value'] || (obj['warranty'] as Record<string, unknown>)['barcode'] || barcode),
          purchaseDate: String((obj['warranty'] as Record<string, unknown>)['activated_at'] || ''),
          warrantyExpiry: String((obj['warranty'] as Record<string, unknown>)['expiry_date'] || ''),
          status: ((obj['warranty'] as Record<string, unknown>)['status'] === 'activated') ? 'active' :
                  ((obj['warranty'] as Record<string, unknown>)['status'] === 'expired') ? 'expired' :
                  ((obj['warranty'] as Record<string, unknown>)['status'] === 'claimed') ? 'claimed' : 'active',
          category: String((obj['product'] as Record<string, unknown>)['category'] || 'Unknown'),
          image: String((obj['product'] as Record<string, unknown>)['image_url'] || '/placeholder.svg'),
          barcodeId: String((obj['warranty'] as Record<string, unknown>)['id'] || '')
        };
        return {
          success: true,
          data: product,
          message: String(obj['message'] || 'Warranty found successfully')
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