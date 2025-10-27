# Kirimku Claim Endpoint Documentation

## Overview

This document provides comprehensive documentation for the Kirimku-integrated warranty claim submission endpoint, including payload structures, response formats, and integration details.

## Endpoint Details

### Submit Warranty Claim
- **URL**: `POST /api/v1/storefront/{slug}/warranty/claims`
- **Authentication**: Bearer Token (Customer)
- **Content-Type**: `application/json`

## Request Payload Structure

### Complete Payload Example

```json
{
  "warranty_id": "REX25ABCD1234EFGH",
  "issue_type": "defective",
  "description": "Product stopped working after 2 months of use. Screen goes black randomly.",
  "severity": "medium",
  "contact_info": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+6281234567890",
    "address": "Jl. Sudirman No. 123",
    "city": "Jakarta Barat",
    "postal_code": "11710",
    "preferred_contact": "email"
  },
  "shipping_details": {
    "origin_area_id": 1,
    "destination_area_id": 2,
    "weight": 1.5,
    "courier_code": "jnt",
    "service_code": "reg"
  }
}
```

### Field Descriptions

#### Core Claim Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `warranty_id` | string | ✅ | Valid warranty barcode number | `"REX25ABCD1234EFGH"` |
| `issue_type` | string | ✅ | Type of warranty issue | `"defective"`, `"damaged"`, `"malfunction"` |
| `description` | string | ✅ | Detailed description of the issue | `"Product stopped working after 2 months"` |
| `severity` | string | ✅ | Issue severity level | `"low"`, `"medium"`, `"high"`, `"critical"` |

#### Contact Information

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `contact_info.name` | string | ✅ | Customer full name | `"John Doe"` |
| `contact_info.email` | string | ✅ | Customer email address | `"john.doe@example.com"` |
| `contact_info.phone` | string | ✅ | Customer phone number | `"+6281234567890"` |
| `contact_info.address` | string | ✅ | Customer address | `"Jl. Sudirman No. 123"` |
| `contact_info.city` | string | ✅ | Customer city | `"Jakarta Barat"` |
| `contact_info.postal_code` | string | ✅ | Customer postal code | `"11710"` |
| `contact_info.preferred_contact` | string | ✅ | Preferred contact method | `"email"`, `"phone"`, `"sms"` |

#### Shipping Details (Kirimku Integration)

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `shipping_details.origin_area_id` | integer | ✅ | Pickup location area ID | `1` |
| `shipping_details.destination_area_id` | integer | ✅ | Destination area ID | `2` |
| `shipping_details.weight` | float | ✅ | Package weight in kg | `1.5` |
| `shipping_details.courier_code` | string | ✅ | Courier service code | `"jnt"`, `"jne"`, `"pos"` |
| `shipping_details.service_code` | string | ✅ | Service type code | `"reg"`, `"yes"`, `"oke"` |

## Response Structure

### Success Response (HTTP 201)

```json
{
  "data": {
    "claim_id": "144539a8-1e0b-44ec-ae41-6adc811de75f",
    "claim_number": "WAR-2025-000024",
    "warranty_id": "REX253MND4X2DUM62",
    "status": "pending",
    "issue_type": "defective",
    "description": "Product stopped working after 2 months of use. Screen goes black randomly.",
    "severity": "medium",
    "created_at": "2025-10-26T19:03:41.891951+07:00",
    "updated_at": "2025-10-26T19:03:41.891951+07:00",
    "estimated_resolution": "0001-01-01T00:00:00Z",
    "priority": "normal",
    "next_steps": [
      "Your warranty claim has been submitted successfully",
      "Complete payment using the provided payment link",
      "You will receive email updates on claim progress",
      "Our team will validate your claim within 24-48 hours"
    ],
    "contact_info": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+6281234567890",
      "address": "Jl. Sudirman No. 123",
      "city": "Jakarta Barat",
      "postal_code": "11710",
      "preferred_contact": "email"
    },
    "tracking_info": {
      "tracking_number": "",
      "status_url": "",
      "support_email": "support@smartseller.com",
      "support_phone": "+62-800-1234-5678"
    },
    "shipping_info": {
      "booking_id": "ord_Cn6640lFLr7725",
      "transaction_code": "",
      "tracking_number": "INV-TX417-EWALLET-20251026190341-dHu6",
      "status": "",
      "courier": "",
      "service_type": "",
      "estimated_delivery": "0001-01-01T00:00:00Z",
      "shipping_cost": "0",
      "invoice_id": "",
      "invoice_code": "",
      "external_invoice_id": "",
      "invoice_amount": "0",
      "payment_status": ""
    }
  },
  "message": "Warranty claim submitted successfully",
  "success": true
}
```

### Response Field Descriptions

#### Core Response Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `claim_id` | string | Unique claim identifier (UUID) | `"144539a8-1e0b-44ec-ae41-6adc811de75f"` |
| `claim_number` | string | Human-readable claim number | `"WAR-2025-000024"` |
| `warranty_id` | string | Associated warranty barcode | `"REX253MND4X2DUM62"` |
| `status` | string | Current claim status | `"pending"`, `"approved"`, `"rejected"` |
| `priority` | string | Claim priority level | `"normal"`, `"high"`, `"urgent"` |
| `created_at` | string | Claim creation timestamp | `"2025-10-26T19:03:41.891951+07:00"` |
| `updated_at` | string | Last update timestamp | `"2025-10-26T19:03:41.891951+07:00"` |

#### Kirimku Shipping Information

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `shipping_info.booking_id` | string | Kirimku booking identifier | `"ord_Cn6640lFLr7725"` |
| `shipping_info.tracking_number` | string | Kirimku tracking number | `"INV-TX417-EWALLET-20251026190341-dHu6"` |
| `shipping_info.transaction_code` | string | Transaction reference code | `""` (populated later) |
| `shipping_info.status` | string | Shipping status | `""` (updated by Kirimku) |
| `shipping_info.courier` | string | Courier service name | `""` (populated later) |
| `shipping_info.service_type` | string | Service type description | `""` (populated later) |
| `shipping_info.estimated_delivery` | string | Estimated delivery date | `"0001-01-01T00:00:00Z"` |
| `shipping_info.shipping_cost` | string | Shipping cost amount | `"0"` |
| `shipping_info.invoice_id` | string | Invoice identifier | `""` (populated later) |
| `shipping_info.payment_status` | string | Payment status | `""` (updated by Kirimku) |

#### Customer Support Information

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `tracking_info.support_email` | string | Support email address | `"support@smartseller.com"` |
| `tracking_info.support_phone` | string | Support phone number | `"+62-800-1234-5678"` |
| `next_steps` | array | List of next action items | See example above |

## Error Responses

### Validation Errors (HTTP 400)

```json
{
  "error": "validation_error",
  "message": "Invalid request format",
  "success": false,
  "validation_errors": [
    "warranty_id is required",
    "issue_type must be one of: defective, damaged, malfunction",
    "contact_info.email must be a valid email address"
  ]
}
```

### Authentication Errors (HTTP 401)

```json
{
  "error": "unauthorized",
  "message": "Authentication required",
  "success": false
}
```

### Business Logic Errors (HTTP 422)

```json
{
  "error": "business_logic_error",
  "message": "Warranty barcode not found or not activated",
  "success": false,
  "error_detail": "The provided warranty barcode is not valid or has not been activated"
}
```

### Server Errors (HTTP 500)

```json
{
  "error": "internal_error",
  "message": "Failed to create Kirimku booking",
  "success": false,
  "error_detail": "Kirimku service temporarily unavailable"
}
```

## Integration Flow

### 1. Warranty Validation
- System validates the provided `warranty_id`
- Checks if warranty is activated and belongs to the customer
- Verifies no existing active claims for the warranty

### 2. Claim Creation
- Creates warranty claim record in database
- Generates unique claim number using format: `WAR-YYYY-NNNNNN`
- Sets initial status to "pending"

### 3. Kirimku Booking
- Creates shipping booking using provided `shipping_details`
- Generates Kirimku booking ID and tracking number
- Stores booking information in claim record

### 4. Response Generation
- Combines claim data with Kirimku booking information
- Returns comprehensive response with all relevant details

## Testing

### Test Script Usage

The test script `test_claim_complete.sh` demonstrates the complete flow:

```bash
# Run the complete test
./test_claim_complete.sh
```

### Test Features

1. **Fresh Barcode Generation**: Creates and activates a new warranty barcode for each test
2. **Dynamic Location Resolution**: Resolves pickup and destination locations
3. **Complete Integration**: Tests both claim submission and Kirimku booking
4. **Response Validation**: Verifies all response fields and structure

### Sample Test Output

```
✅ Claim submission successful!
✅ Kirimku booking created: ord_Cn6640lFLr7725
✅ Tracking number assigned: INV-TX417-EWALLET-20251026190341-dHu6
✅ Claim ID: 144539a8-1e0b-44ec-ae41-6adc811de75f
```

## Implementation Notes

### Database Schema

The implementation includes the following key database changes:

1. **warranty_claims table**: Added `kirimku_booking_id` and `kirimku_booking_data` columns
2. **Claim number generation**: Uses `MAX()` function to prevent race conditions
3. **Foreign key constraints**: Ensures data integrity across related tables

### Service Integration

1. **KirimkuService**: Handles all Kirimku API interactions
2. **Dependency Injection**: Properly injected into `WarrantyClaimUseCase`
3. **Error Handling**: Comprehensive error handling for Kirimku failures

### Security Considerations

1. **Authentication**: Customer must be authenticated to submit claims
2. **Authorization**: Claims are scoped to customer's storefront
3. **Input Validation**: All input fields are validated and sanitized
4. **Rate Limiting**: Consider implementing rate limiting for claim submissions

## Monitoring and Logging

### Key Metrics to Monitor

1. **Claim Submission Rate**: Number of claims submitted per hour/day
2. **Kirimku Success Rate**: Percentage of successful Kirimku bookings
3. **Response Times**: API response time percentiles
4. **Error Rates**: Frequency of different error types

### Logging Events

1. **Claim Creation**: Log claim ID, warranty ID, and customer ID
2. **Kirimku Booking**: Log booking ID and tracking number
3. **Errors**: Log detailed error information for debugging
4. **Performance**: Log response times and external API calls

---

**Last Updated**: October 26, 2025  
**Version**: 1.0  
**Status**: Production Ready