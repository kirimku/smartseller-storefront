/**
 * Warranty Types - Based on OpenAPI warranty-customer-endpoints.yaml and warranty-schemas.yaml
 */

// Core Warranty Entities
export interface WarrantyBarcode {
  id: string;
  barcode_string: string;
  product_id: string;
  product_name?: string;
  product_model?: string;
  product_category?: string;
  status: 'available' | 'activated' | 'expired' | 'claimed';
  warranty_period_months: number;
  activation_date?: string;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
}

export interface WarrantyClaim {
  id: string;
  claim_number: string;
  barcode_id: string;
  customer_id: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  issue_description: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: string;
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  attachments?: WarrantyClaimAttachment[];
  warranty_barcode?: WarrantyBarcode;
}

export interface WarrantyClaimAttachment {
  id: string;
  claim_id: string;
  filename: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

// Request/Response Types for API endpoints

// Public endpoints
export interface ValidateBarcodeRequest {
  barcode: string;
}

export interface ValidateBarcodeResponse {
  valid: boolean;
  warranty_barcode?: WarrantyBarcode;
  message: string;
  // Alternate response shape from API: warranty + product + coverage
  warranty?: {
    id: string;
    barcode_value?: string;
    barcode?: string;
    status: 'available' | 'activated' | 'expired' | 'claimed' | string;
    is_active: boolean;
    activated_at?: string;
    expiry_date?: string;
    days_remaining?: number;
    warranty_period?: string;
    is_expired?: boolean;
    can_claim?: boolean;
  };
  product?: CustomerProductInfo;
  coverage?: CustomerWarrantyCoverage;
  validation_time?: string;
}

export interface ActivateWarrantyRequest {
  barcode: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  purchase_date: string;
}

export interface ActivateWarrantyResponse {
  success: boolean;
  warranty_barcode: WarrantyBarcode;
  message: string;
}

// Protected customer endpoints
export interface GetCustomerWarrantiesParams {
  page?: number;
  limit?: number;
  status?: 'available' | 'activated' | 'expired' | 'claimed';
  search?: string;
}

export interface GetCustomerWarrantiesResponse {
  warranties: WarrantyBarcode[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface GetWarrantyDetailsResponse {
  warranty: WarrantyBarcode;
  claims?: WarrantyClaim[];
}

export interface SubmitClaimRequest {
  barcode_id: string;
  issue_description: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  // Enhanced claim fields
  courier_type?: string;
  logistic_service?: string;
  payment_method?: string;
  address_details?: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country?: string;
  };
  address_location?: {
    province?: string;
    city?: string;
    district?: string;
    postal_code?: string;
    kelurahan?: string;
  };
}

export interface SubmitClaimResponse {
  success: boolean;
  claim: WarrantyClaim;
  message: string;
}

export interface GetCustomerClaimsParams {
  page?: number;
  limit?: number;
  status?: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  search?: string;
}

export interface GetCustomerClaimsResponse {
  claims: WarrantyClaim[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface GetClaimDetailsResponse {
  claim: WarrantyClaim;
}

export interface UpdateClaimRequest {
  issue_description?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface UpdateClaimResponse {
  success: boolean;
  claim: WarrantyClaim;
  message: string;
}

export interface UploadAttachmentResponse {
  success: boolean;
  attachment: WarrantyClaimAttachment;
  message: string;
}

// Warranty Registration Types (based on OpenAPI specification)
export interface CustomerAddressInfo {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface CustomerPreferences {
  email_notifications?: boolean;
  sms_notifications?: boolean;
  language?: string;
  timezone?: string;
}

export interface CustomerRegistrationInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: CustomerAddressInfo;
  date_of_birth?: string;
  preferences?: CustomerPreferences;
}

export interface ProofOfPurchaseInfo {
  document_type?: string;
  document_url?: string;
  uploaded_at?: string;
}

export interface CustomerWarrantyRegistrationRequest {
  barcode_value: string;
  product_sku: string;
  serial_number: string;
  purchase_date: string;
  purchase_price?: number;
  retailer_name: string;
  retailer_address?: string;
  invoice_number?: string;
  customer_info: CustomerRegistrationInfo;
  proof_of_purchase?: ProofOfPurchaseInfo;
}

export interface CustomerProductInfo {
  id: string;
  sku: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  description?: string;
  image_url?: string;
  price?: number;
}

export interface CustomerInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
}

export interface CustomerWarrantyCoverage {
  coverage_type: string;
  covered_components: string[];
  excluded_components: string[];
  repair_coverage: boolean;
  replacement_coverage: boolean;
  labor_coverage: boolean;
  parts_coverage: boolean;
  terms: string[];
  limitations?: string[];
}

export interface CustomerWarrantyRegistrationResponse {
  success: boolean;
  registration_id: string;
  warranty_id: string;
  barcode_value: string;
  status: string;
  activation_date: string;
  expiry_date: string;
  warranty_period: string;
  product: CustomerProductInfo;
  customer: CustomerInfo;
  coverage: CustomerWarrantyCoverage;
  next_steps: string[];
  registration_time: string;
}

// Error Response Types
export interface WarrantyErrorResponse {
  error: string;
  message: string;
  details?: {
    field?: string;
    code?: string;
    [key: string]: string | number | boolean | null;
  };
}

// UI-specific types (for compatibility with existing Warranty.tsx)
export interface WarrantyProduct {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  warrantyExpiry: string;
  status: "active" | "expired" | "claimed";
  category: string;
  image: string;
  barcodeId?: string;
}

// Conversion utilities type
export interface WarrantyBarcodeToProductConverter {
  (barcode: WarrantyBarcode): WarrantyProduct;
}

// Service response wrapper
export interface WarrantyServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Logistics services for claim submission
export interface LogisticService {
  value: string;
  label: string;
  description: string;
}

// Claim form data (for UI)
export interface ClaimFormData {
  issueDescription: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  invoiceFile: File | null;
  logisticService: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

// Pagination helper
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Search and filter params
export interface WarrantySearchParams extends PaginationParams {
  search?: string;
  status?: string;
}