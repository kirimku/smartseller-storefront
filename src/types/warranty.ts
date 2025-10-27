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
  barcode: string;
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

export interface PreUploadAttachmentResponse {
  success: boolean;
  attachment: {
    id: string;
    filename: string;
    file_url: string;
    file_type: string;
    file_size: number;
    uploaded_at?: string;
  };
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
  proof_of_purchase?: {
    document_type: 'pdf' | 'image';
    document_url?: string;
    uploaded_at?: string;
  };
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

// Logistics services for claim submission (legacy - kept for compatibility)
export interface LogisticService {
  value: string;
  label: string;
  description: string;
}

// Enhanced shipping service types
export interface ShippingCourierOption {
  value: string; // Format: "courierId-serviceId"
  label: string; // Format: "Courier Name - Service Name"
  description: string; // Format: "X days - Rp Y"
  cost: number;
  estimatedDays: string;
  courierId: string;
  serviceId: string;
}

export interface ShippingLocationOption {
  id?: string;
  area_id: string;
  name: string;
  type?: 'province' | 'city' | 'district' | 'area';
  province?: string;
  city?: string;
  district?: string;
  postal_code?: string;
  full_address?: string;
}

// Claim form data (for UI)
export interface ClaimFormData {
  issueDescription: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  logisticService: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  invoiceFile?: File;
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


// V2 claim submit types (aligned with OpenAPI SubmitClaimV2Request/Response)
export interface CustomerClaimShippingInfo {
  booking_id: string;
  invoice_code: string;
  shipping_cost: number;
  courier: string;
  service_type: string;
  estimated_delivery: string; // ISO date-time
  tracking_number: string;
  status: string;
  payment_status: string;
  payment_url: string;
  // Extended payment fields from storefront/Kirimku response
  invoice_amount?: number;
  payment_method?: string;
  payment_channel?: string;
  qr_string?: string;
  qr_code?: string; // data URL (e.g., data:image/png;base64,...)
  payment_gateway?: string;
}

export interface SubmitClaimV2Request {
  barcode: string;
  issue_description: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  courier_type: 'pickup' | 'dropoff';
  logistic_service: string; // Format: "courierId-serviceId"
  payment_method: string; // e.g., "QRIS"
  address_details: {
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

export interface CustomerClaimDTO {
  id: string;
  claim_number: string;
  warranty_id: string;
  barcode: string;
  product_name?: string;
  status: 'pending' | 'validated' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  issue_category?: string;
  issue_description: string;
  estimated_completion?: string | null;
  created_at: string;
  updated_at: string;
  last_status_update?: string;
  can_be_cancelled?: boolean;
  can_be_updated?: boolean;
}

export interface SubmitClaimV2Response {
  success: boolean;
  message: string;
  claim: CustomerClaimDTO;
  shipping_info?: CustomerClaimShippingInfo;
}

// Kirimku claim request/response (per KIRIMKU_CLAIM_ENDPOINT_DOCUMENTATION.md)
export interface KirimkuContactInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  preferred_contact: 'email' | 'phone' | 'sms';
}

export interface KirimkuShippingDetailsRequest {
  origin_area_id: string; // area id (string per Kirimku schemas)
  destination_area_id: string; // area id (string per Kirimku schemas)
  weight: number; // kg
  courier_code: string; // e.g., 'jnt', 'jne'
  service_code: string; // e.g., 'reg', 'yes'
}

export interface KirimkuSubmitClaimRequest {
  warranty_id: string; // barcode
  issue_type: string; // e.g., 'defective'
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  contact_info: KirimkuContactInfo;
  shipping_details: KirimkuShippingDetailsRequest;
}

export interface KirimkuTrackingInfo {
  tracking_number: string;
  status_url: string;
  support_email: string;
  support_phone: string;
}

export interface KirimkuShippingInfoResponse {
  booking_id: string;
  transaction_code: string;
  tracking_number: string;
  status: string;
  courier: string;
  service_type: string;
  estimated_delivery: string; // ISO date-time
  shipping_cost: string; // amount as string
  invoice_id: string;
  invoice_code: string;
  external_invoice_id: string;
  invoice_amount: string;
  payment_status: string;
}

export interface KirimkuClaimData {
  claim_id: string;
  claim_number: string;
  warranty_id: string;
  status: string;
  issue_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
  estimated_resolution: string;
  priority: 'normal' | 'high' | 'urgent' | string;
  next_steps: string[];
  contact_info: KirimkuContactInfo;
  tracking_info: KirimkuTrackingInfo;
  shipping_info: KirimkuShippingInfoResponse;
}

export interface KirimkuSubmitClaimResponse {
  data: KirimkuClaimData;
  message: string;
  success: boolean;
}

// Storefront B2B-style claim payload (matches /claims/submit test script)
export interface StorefrontAddress {
  name: string;
  phone: string;
  address: string;
  district: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
}

export interface StorefrontShippingDetails {
  courier: string; // e.g., 'jnt'
  service_type: string; // e.g., 'jnt_reg'
  weight: number; // kg
  length?: number; // cm
  width?: number; // cm
  height?: number; // cm
  with_insurance?: boolean;
  pickup_method: 'pickup' | 'dropoff';
  cod?: boolean;
  package_category?: string;
  notes?: string;
  pickup_address: StorefrontAddress;
  destination_address: StorefrontAddress;
}

export interface StorefrontContactInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  preferred_contact: 'email' | 'phone' | 'sms';
}

export interface StorefrontSubmitClaimRequest {
  warranty_id: string; // barcode
  issue_type: string; // e.g., 'defect'
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  contact_info: StorefrontContactInfo;
  product_info?: {
    serial_number?: string;
    purchase_date?: string; // ISO date-time
    purchase_location?: string;
    usage_frequency?: string;
    environment?: string;
  };
  preferred_resolution?: 'repair' | 'replace' | 'refund' | string;
  shipping_details: StorefrontShippingDetails;
}

export interface StorefrontShippingInfoResponse {
  booking_id?: string;
  invoice_code?: string;
  shipping_cost?: number | string;
  courier?: string;
  service_type?: string;
  estimated_delivery?: string; // ISO date-time
  tracking_number?: string;
  status?: string;
  payment_status?: string;
  // Extended payment/QR fields from storefront (KIRIMKU)
  invoice_amount?: number | string;
  payment_method?: string;
  payment_channel?: string;
  qr_string?: string;
  qr_code?: string; // data URL
  payment_gateway?: string;
}

export interface StorefrontClaimData {
  claim_id: string;
  claim_number?: string;
  warranty_id: string;
  status: string;
  description?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical' | string;
  created_at?: string;
  updated_at?: string;
  shipping_info?: StorefrontShippingInfoResponse;
}

export interface StorefrontSubmitClaimResponse {
  success: boolean;
  message: string;
  data: StorefrontClaimData;
}

export interface WarrantyClaimByWarrantyItem {
  claim_id: string;
  claim_number: string;
  status: 'pending' | 'validated' | 'in_progress' | 'completed' | 'rejected' | 'cancelled' | string;
  issue_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | string;
  submitted_at: string;
  updated_at: string;
  warranty_id: string;
  priority?: string;
  days_open?: number;
  last_activity?: string;
}

export interface WarrantyClaimsSummary {
  total_claims: number;
  open_claims: number;
  resolved_claims: number;
  pending_claims: number;
}

export interface GetClaimsByWarrantyIdResponse {
  claims: WarrantyClaimByWarrantyItem[];
  total_count: number;
  summary: WarrantyClaimsSummary;
}