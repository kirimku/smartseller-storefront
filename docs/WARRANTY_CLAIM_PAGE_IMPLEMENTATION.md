# Warranty Claim Page Implementation Guide

This guide reflects your backend directive for claims:
- Use endpoint `POST /api/v1/storefront/{storefrontSlug}/claims/submit`.
- Upload invoice/attachment BEFORE submitting the claim.
- Backend accepts a RAW barcode string (no pre-validation or ID resolution required).
- Attachments must be JPG/PNG/PDF up to 5MB.
- No priority option; no additional security (captcha/rate-limit) for now.

## Overview
- Page path: `/warranty/claim`
- Auth required: unauthenticated users are redirected to login with `redirect` back to the claim page.
- Flow: pre-upload invoice → submit claim → show success → navigate.
- Dependencies: `useAuth`, `useTenant`, `AddressPicker`, fetch or `warrantyService` helpers.

## Endpoints
- Submit claim: `POST /api/v1/storefront/{slug}/claims/submit`
- Pre-upload invoice: [confirm exact path below]
  - Suggested: `POST /api/v1/storefront/{slug}/claims/attachments/upload` (multipart/form-data)
  - Returns an `attachment_id` used in the submit payload

Note: URLs are built via `buildWarrantyUrl(endpoint)` to prefix `/api/v1/storefront/{slug}/`.

## Request Sequencing
1) Pre-upload attachment (invoice)
- Form field name: `file`
- Accepts: `image/jpeg`, `image/png`, `application/pdf`
- Max size: 5MB; reject otherwise
- Response (expected):
```
{
  success: true,
  attachment: { id: string, filename: string, file_url: string, file_type: string, file_size: number },
  message: string
}
```
- Capture `attachment.id` for use in claim submission.

2) Submit claim
- Endpoint: `POST /api/v1/storefront/{slug}/claims/submit`
- Content-Type: `application/json`
- Payload (reflecting your constraints):
```
{
  barcode: string,                  // raw barcode string (no ID resolution)
  issue_description: string,        // required
  customer_name: string,            // required
  customer_email: string,           // required
  customer_phone?: string,          // optional
  customer_address?: string,        // optional, composed full address
  courier_type?: string,            // e.g., 'pickup' | 'dropoff'
  logistic_service?: string,        // e.g., 'jne' | 'jnt' | 'sicepat' | 'anteraja' | 'pos'
  payment_method?: string,          // e.g., 'bank_transfer' | 'e_wallet' | 'credit_card' | 'cash'
  address_details?: {
    street: string,
    city: string,
    state: string,
    postal_code: string,
    country?: string
  },
  address_location?: {
    province?: string,
    city?: string,
    district?: string,
    postal_code?: string,
    kelurahan?: string
  },
  invoice_attachment_id?: string    // ID from pre-upload step
}
```
- Response (expected):
```
{
  success: boolean,
  claim: {
    id: string,
    claim_number: string,
    status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed' | 'cancelled',
    issue_description: string,
    customer_name: string,
    customer_email: string,
    ...
  },
  message: string
}
```

## UI Implementation Blueprint
- Auth guard: use `useAuth()` and `useTenant()`; redirect with `redirect=/warranty/claim[?barcode=...]`.
- Barcode: read `barcode` from query string; display read-only. Do NOT call `validateBarcode`; submit raw.
- Customer prefill: read `first_name/firstName`, `last_name/lastName`, `email`, `phone_number/phone` from `user`.
- Address capture:
  - `AddressPicker` (type `area`) for location (`province`, `city`, `district`, `kelurahan`, `postalCode`).
  - `addressLine1` for street; compose `customer_address` string.
- Service preferences: keep `courier_type`, `logistic_service`, `payment_method` fields.
- Priority: remove priority from UI and payload.
- Attachment upload:
  - Use a file input that accepts `.jpg,.jpeg,.png,.pdf`.
  - Enforce client-side 5MB limit.
  - Call the pre-upload endpoint; store `attachment_id`.
- Submit:
  - Build payload using raw `barcode` and `invoice_attachment_id`.
  - POST to `/claims/submit`.
- States & UX:
  - Disable submit until: barcode + issue + name + email + addressLine1 + addressLocation + courier + logistic + payment + file uploaded.
  - Use loading states and `role="alert"` for errors.
- Success:
  - Show success card and buttons to return to warranty page or home.

## Error Handling
- File validation: reject missing file, wrong type, >5MB.
- HTTP errors:
  - `400`: show validation error (invalid barcode or payload).
  - `401`: token expired/invalid → prompt re-login.
  - `404`: resource not found.
  - `500`: show generic retry message.

## Sample Service Adjustments (TypeScript pseudo-code)
```ts
// Submit claim using raw barcode
async function submitClaim(data: SubmitClaimRequest): Promise<WarrantyServiceResponse<SubmitClaimResponse>> {
  const url = buildWarrantyUrl('claims/submit');
  const res = await makeRequest<SubmitClaimResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return { success: true, data: res, message: res.message };
}

// Pre-upload invoice (returns attachment_id)
async function preUploadInvoice(file: File): Promise<{ success: boolean; attachment_id?: string; message?: string; }>{
  const form = new FormData();
  form.append('file', file);
  const url = buildWarrantyUrl('claims/attachments/upload'); // confirm path
  const res = await makeRequest<{ success: boolean; attachment: { id: string }, message?: string }>(url, {
    method: 'POST',
    body: form,
  });
  return { success: res.success, attachment_id: res.attachment.id, message: res.message };
}
```

## Testing Notes
- Mock fetch to verify requests hit `/api/v1/storefront/{slug}/claims/submit` with `Authorization` header.
- Ensure pre-upload is called first, and `invoice_attachment_id` is included in the submit payload.
- Validate file type/size client-side; simulate server-side 415/413 if applicable.
- Cover success and error states.

## Open Points to Confirm
1. Pre-upload endpoint: please confirm exact route and response fields (is it `claims/attachments/upload` and does it return `{ attachment: { id } }`?).
2. Submit payload field name: should the attachment be `invoice_attachment_id` or another key (e.g., `attachment_id`, `document_id`)?
3. Are `courier_type`, `logistic_service`, and `payment_method` required or optional at submit?
4. Any server-side limits beyond 5MB and file types (e.g., max resolutions, page count for PDF)?

Once confirmed, I can update the service methods and page code to match exactly.