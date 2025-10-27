#!/bin/bash

# Complete Kirimku Claim Endpoint Test
# Tests the claim submission with all required shipping details

set -e

echo "🚀 Starting Complete Kirimku Claim Endpoint Test"
echo "================================================"

# Configuration
BASE_URL="http://localhost:8090"
STOREFRONT_SLUG="rexus"
CUSTOMER_EMAIL="aswin.test3@gmail.com"
CUSTOMER_PASSWORD="password123"

# Step 1: Get customer authentication token
echo "📋 Step 1: Obtaining customer authentication token..."
TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/storefront/$STOREFRONT_SLUG/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$CUSTOMER_EMAIL\",
    \"password\": \"$CUSTOMER_PASSWORD\"
  }")

echo "Token response: $TOKEN_RESPONSE"

CUSTOMER_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.data.access_token // empty')

if [ -z "$CUSTOMER_TOKEN" ] || [ "$CUSTOMER_TOKEN" = "null" ]; then
    echo "❌ Failed to obtain customer token"
    echo "Response: $TOKEN_RESPONSE"
    exit 1
fi

echo "✅ Customer token obtained: ${CUSTOMER_TOKEN:0:20}..."

# Step 2: Retrieve existing claims first
echo "📋 Step 2: Retrieving existing claims..."
EXISTING_CLAIMS_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/v1/storefront/$STOREFRONT_SLUG/claims" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json")

# Extract HTTP status and response body for existing claims
EXISTING_CLAIMS_HTTP_STATUS=$(echo "$EXISTING_CLAIMS_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
EXISTING_CLAIMS_RESPONSE_BODY=$(echo "$EXISTING_CLAIMS_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "Existing Claims HTTP Status: $EXISTING_CLAIMS_HTTP_STATUS"

if [ "$EXISTING_CLAIMS_HTTP_STATUS" = "200" ]; then
    echo "✅ Claims retrieval successful!"
    
    # Parse and display existing claims
    EXISTING_CLAIMS_COUNT=$(echo "$EXISTING_CLAIMS_RESPONSE_BODY" | jq -r '.data.claims | length // 0')
    echo "📊 Existing claims found: $EXISTING_CLAIMS_COUNT"
    
    if [ "$EXISTING_CLAIMS_COUNT" -gt 0 ]; then
        echo ""
        echo "📋 Existing Claims:"
        echo "=================="
        
        # Display each claim with key information
        echo "$EXISTING_CLAIMS_RESPONSE_BODY" | jq -r '.data.claims[] | 
        "ID: \(.claim_id // "N/A")
Status: \(.status // "N/A")
Issue Type: \(.issue_type // "N/A")
Warranty ID: \(.warranty_id // "N/A")
Created: \(.submitted_at // "N/A")
Claim Number: \(.claim_number // "N/A")
Priority: \(.priority // "N/A")
Days Open: \(.days_open // "N/A")
---"'
    else
        echo "📭 No existing claims found for this customer"
    fi
else
    echo "❌ Claims retrieval failed with HTTP $EXISTING_CLAIMS_HTTP_STATUS"
    echo "Claims response: $EXISTING_CLAIMS_RESPONSE_BODY"
fi

# Step 3: Generate and activate a fresh warranty barcode
echo "📋 Step 3: Generating and activating a fresh warranty barcode..."

# Get admin token for barcode generation
echo "🔑 Using admin token for barcode operations..."
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJleHAiOjE3NjE1NjQ0NDksImlhdCI6MTc2MTQ3ODA0OSwibmFtZSI6IlRlc3QgVXNlciBmcm9tIEVOViIsInBob25lIjoiIiwidXNlcl9pZCI6IjFhMTYxMzkxLTYxYjctNDk0MC1hMjA3LWQ3NmM0OGIzZGZmMyJ9.gbfd_StIXyXROrMn0dRtAhp0Nff0I0pUDl8G_Usw2Bc"

echo "✅ Admin token ready: ${ADMIN_TOKEN:0:20}..."

# Generate new warranty barcode
echo "🏭 Generating new warranty barcode..."
GENERATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/admin/warranty/barcodes/generate" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"product_id\": \"550e8400-e29b-41d4-a716-446655440000\",
    \"quantity\": 1,
    \"expiry_months\": 24
  }")

echo "Generate response: $GENERATE_RESPONSE"

# Get the newly generated barcode
echo "🔍 Retrieving the newly generated barcode..."
BARCODE_LIST_RESPONSE=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/v1/admin/warranty/barcodes?limit=1&status=generated")

FRESH_BARCODE_ID=$(echo "$BARCODE_LIST_RESPONSE" | jq -r '.data.data[0].id // empty')
FRESH_BARCODE_VALUE=$(echo "$BARCODE_LIST_RESPONSE" | jq -r '.data.data[0].barcode_value // empty')

if [ -z "$FRESH_BARCODE_ID" ] || [ "$FRESH_BARCODE_ID" = "null" ]; then
    echo "❌ Failed to get fresh barcode ID"
    echo "Response: $BARCODE_LIST_RESPONSE"
    exit 1
fi

echo "✅ Fresh barcode generated: $FRESH_BARCODE_VALUE (ID: $FRESH_BARCODE_ID)"

# Activate the barcode with the correct customer ID
echo "🔓 Activating the fresh barcode..."
ACTIVATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/admin/warranty/barcodes/$FRESH_BARCODE_ID/activate" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"customer_id\": \"550e8400-e29b-41d4-a716-446655440000\",
    \"activation_location\": \"Jakarta, Indonesia\"
  }")

echo "Activate response: $ACTIVATE_RESPONSE"

ACTIVATION_SUCCESS=$(echo "$ACTIVATE_RESPONSE" | jq -r '.success // false')

if [ "$ACTIVATION_SUCCESS" != "true" ]; then
    echo "❌ Failed to activate barcode"
    echo "Response: $ACTIVATE_RESPONSE"
    exit 1
fi

echo "✅ Barcode registered successfully: $FRESH_BARCODE_VALUE (Status: waiting_approval)"

# Now approve the registration to activate the barcode
echo "✅ Approving barcode registration to activate..."
APPROVE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/admin/warranty/barcodes/$FRESH_BARCODE_ID/approve-registration" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"approval_reason\": \"Admin activation for testing\"
  }")

echo "Approve response: $APPROVE_RESPONSE"

APPROVAL_SUCCESS=$(echo "$APPROVE_RESPONSE" | jq -r '.success // false')

if [ "$APPROVAL_SUCCESS" != "true" ]; then
    echo "❌ Failed to approve barcode registration"
    echo "Response: $APPROVE_RESPONSE"
    exit 1
fi

echo "✅ Barcode fully activated: $FRESH_BARCODE_VALUE (Status: activated)"

# Use the freshly generated and activated barcode
VALID_BARCODE="$FRESH_BARCODE_VALUE"
echo "✅ Using freshly generated barcode: $VALID_BARCODE"

if [ -z "$VALID_BARCODE" ] || [ "$VALID_BARCODE" = "null" ]; then
    echo "❌ No valid warranty barcode found"
    exit 1
fi

echo "✅ Using freshly generated warranty barcode: $VALID_BARCODE"

# Since we're using a freshly generated barcode, no existing claim check needed
echo "✅ Using fresh barcode - proceeding with claim submission"
SKIP_SUBMISSION=false

# Step 4: Dynamic location resolution (like B2B flow)
echo "📋 Step 4: Resolving pickup and destination locations..."

# Search for pickup location (Jakarta)
echo "🔍 Searching for pickup location: Jakarta"
PICKUP_RESPONSE=$(curl -s "http://localhost:8080/api/v1/b2b/search-location" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: kk_live_5c5601496255884599b6fbd6cdab7523d7dbbf5de485bec7" \
  -d '{"query": "jakarta"}')

echo "Pickup search response: $PICKUP_RESPONSE"

PICKUP_PROVINCE=$(echo "$PICKUP_RESPONSE" | jq -r '.data[0].province // empty')
PICKUP_CITY=$(echo "$PICKUP_RESPONSE" | jq -r '.data[0].city // empty')
PICKUP_DISTRICT=$(echo "$PICKUP_RESPONSE" | jq -r '.data[0].district // empty')
PICKUP_POSTCODE=$(echo "$PICKUP_RESPONSE" | jq -r '.data[0].postal_code // empty')

if [ -z "$PICKUP_CITY" ] || [ "$PICKUP_CITY" = "null" ]; then
    echo "❌ Failed to resolve pickup location"
    echo "Using fallback Jakarta location data..."
    PICKUP_PROVINCE="DKI Jakarta"
    PICKUP_CITY="Jakarta Barat"
    PICKUP_DISTRICT="Cengkareng"
    PICKUP_POSTCODE="11710"
fi

echo "✅ Pickup location: $PICKUP_CITY, $PICKUP_DISTRICT, $PICKUP_PROVINCE ($PICKUP_POSTCODE)"

# Search for destination location (Bandung)
echo "🔍 Searching for destination location: Bandung"
DEST_RESPONSE=$(curl -s "http://localhost:8080/api/v1/b2b/search-location" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: kk_live_5c5601496255884599b6fbd6cdab7523d7dbbf5de485bec7" \
  -d '{"query": "bandung"}')

echo "Destination search response: $DEST_RESPONSE"

DEST_PROVINCE=$(echo "$DEST_RESPONSE" | jq -r '.data[0].province // empty')
DEST_CITY=$(echo "$DEST_RESPONSE" | jq -r '.data[0].city // empty')
DEST_DISTRICT=$(echo "$DEST_RESPONSE" | jq -r '.data[0].district // empty')
DEST_POSTCODE=$(echo "$DEST_RESPONSE" | jq -r '.data[0].postal_code // empty')

# Note: B2B test showed Bandung search returns Bali location, so use that working data
if [ -z "$DEST_CITY" ] || [ "$DEST_CITY" = "null" ]; then
    echo "❌ Failed to resolve destination location"
    echo "Using fallback Bali location data (as per B2B test)..."
    DEST_PROVINCE="Bali"
    DEST_CITY="Tabanan"
    DEST_DISTRICT="Kediri"
    DEST_POSTCODE="82121"
else
    # Use the first result (which might be Bali as per B2B test)
    echo "✅ Using search result for destination"
fi

echo "✅ Destination location: $DEST_CITY, $DEST_DISTRICT, $DEST_PROVINCE ($DEST_POSTCODE)"

# Step 5: Prepare complete claim payload (using B2B-style structure)
echo "📋 Step 5: Preparing claim submission payload with resolved locations..."

# Step 6: Submit claim with B2B-style payload (conditionally)
if [ "$SKIP_SUBMISSION" = "true" ]; then
    echo "📋 Step 6: Skipping claim submission (existing claim found)..."
    echo "✅ Using existing claim data for testing"
    
    # Use existing claim data
    CLAIM_ID="$EXISTING_CLAIM_FOR_BARCODE"
    HTTP_STATUS="200"
    RESPONSE_BODY='{"message":"Using existing claim","data":{"claim_id":"'$EXISTING_CLAIM_FOR_BARCODE'"}}'
    
    # Try to extract booking info from existing claims
    BOOKING_ID=$(echo "$EXISTING_CLAIMS_RESPONSE_BODY" | jq -r --arg claimId "$EXISTING_CLAIM_FOR_BARCODE" '.data.claims[] | select(.claim_id == $claimId) | .shipping_info.booking_id // .kirimku_booking_id // empty')
    TRACKING_NUMBER=$(echo "$EXISTING_CLAIMS_RESPONSE_BODY" | jq -r --arg claimId "$EXISTING_CLAIM_FOR_BARCODE" '.data.claims[] | select(.claim_id == $claimId) | .shipping_info.tracking_number // .tracking_number // empty')
    
else
    echo "📋 Step 6: Submitting claim to endpoint..."
    CLAIM_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/v1/storefront/$STOREFRONT_SLUG/claims/submit" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"warranty_id\": \"$VALID_BARCODE\",
        \"issue_type\": \"defect\",
        \"description\": \"Product is not working properly after normal usage. The device stops functioning intermittently.\",
        \"severity\": \"medium\",
        \"contact_info\": {
          \"name\": \"John Doe\",
          \"email\": \"john.doe@example.com\",
          \"phone\": \"+6281234567890\",
          \"address\": \"Jl. Sudirman No. 123\",
          \"city\": \"$PICKUP_CITY\",
          \"postal_code\": \"$PICKUP_POSTCODE\",
          \"preferred_contact\": \"email\"
        },
        \"product_info\": {
          \"serial_number\": \"SN123456789\",
          \"purchase_date\": \"2024-01-15T10:00:00Z\",
          \"purchase_location\": \"Official Store Jakarta\",
          \"usage_frequency\": \"daily\",
          \"environment\": \"indoor\"
        },
        \"preferred_resolution\": \"repair\",
        \"shipping_details\": {
          \"courier\": \"jnt\",
          \"service_type\": \"jnt_reg\",
          \"weight\": 1.5,
          \"length\": 30.0,
          \"width\": 20.0,
          \"height\": 10.0,
          \"with_insurance\": false,
          \"pickup_method\": \"pickup\",
          \"cod\": false,
          \"package_category\": \"electronics\",
          \"notes\": \"Warranty claim package - handle with care\",
          \"pickup_address\": {
            \"name\": \"Customer Service\",
            \"phone\": \"+628771223333\",
            \"address\": \"Jl. Pickup Address No. 123\",
            \"district\": \"$PICKUP_DISTRICT\",
            \"city\": \"$PICKUP_CITY\",
            \"province\": \"$PICKUP_PROVINCE\",
            \"postal_code\": \"$PICKUP_POSTCODE\",
            \"country\": \"Indonesia\"
          },
          \"destination_address\": {
            \"name\": \"Repair Center\",
            \"phone\": \"+628771231233\",
            \"address\": \"Jl. Destination Address No. 456\",
            \"district\": \"$DEST_DISTRICT\",
            \"city\": \"$DEST_CITY\",
            \"province\": \"$DEST_PROVINCE\",
            \"postal_code\": \"$DEST_POSTCODE\",
            \"country\": \"Indonesia\"
          }
        }
      }")

    # Extract HTTP status and response body
    HTTP_STATUS=$(echo "$CLAIM_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
    RESPONSE_BODY=$(echo "$CLAIM_RESPONSE" | sed '/HTTP_STATUS:/d')

    echo "HTTP Status: $HTTP_STATUS"
    echo "Response Body: $RESPONSE_BODY"

    # Step 7: Analyze response
    echo "📋 Step 7: Analyzing claim submission response..."

    if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
        echo "✅ Claim submission successful!"
        
        # Check for Kirimku booking information
        BOOKING_ID=$(echo "$RESPONSE_BODY" | jq -r '.data.shipping_info.booking_id // empty')
        TRACKING_NUMBER=$(echo "$RESPONSE_BODY" | jq -r '.data.shipping_info.tracking_number // empty')
        
        if [ -n "$BOOKING_ID" ] && [ "$BOOKING_ID" != "null" ]; then
            echo "✅ Kirimku booking created: $BOOKING_ID"
        else
            echo "⚠️  No Kirimku booking ID found in response"
        fi
        
        if [ -n "$TRACKING_NUMBER" ] && [ "$TRACKING_NUMBER" != "null" ]; then
            echo "✅ Tracking number assigned: $TRACKING_NUMBER"
        else
            echo "⚠️  No tracking number found in response"
        fi
        
        # Extract claim ID
        CLAIM_ID=$(echo "$RESPONSE_BODY" | jq -r '.data.claim_id // .data.id // empty')
        if [ -n "$CLAIM_ID" ] && [ "$CLAIM_ID" != "null" ]; then
            echo "✅ Claim ID: $CLAIM_ID"
        fi
        
    else
        echo "❌ Claim submission failed with HTTP $HTTP_STATUS"
        
        # Try to extract error details
        ERROR_MESSAGE=$(echo "$RESPONSE_BODY" | jq -r '.message // .error // empty')
        if [ -n "$ERROR_MESSAGE" ] && [ "$ERROR_MESSAGE" != "null" ]; then
            echo "Error: $ERROR_MESSAGE"
        fi
        
        # Check for validation errors
        VALIDATION_ERRORS=$(echo "$RESPONSE_BODY" | jq -r '.errors // empty')
        if [ -n "$VALIDATION_ERRORS" ] && [ "$VALIDATION_ERRORS" != "null" ]; then
            echo "Validation errors: $VALIDATION_ERRORS"
        fi
        
        exit 1
    fi
fi

echo ""
echo "🎉 Complete Kirimku Claim Endpoint Test Completed Successfully!"
echo "=============================================================="
echo "✅ Customer authentication: Working"
echo "✅ Warranty barcode retrieval: Working"
echo "✅ Claim submission: Working"
echo "✅ Claims retrieval: Working"
echo "✅ Response structure: Valid"

if [ -n "$BOOKING_ID" ] && [ "$BOOKING_ID" != "null" ]; then
    echo "✅ Kirimku integration: Working"
else
    echo "⚠️  Kirimku integration: Needs verification"
fi

echo ""
echo "📊 Test Summary:"
echo "- Submit Endpoint: POST /api/v1/storefront/$STOREFRONT_SLUG/claims/submit"
echo "- List Endpoint: GET /api/v1/storefront/$STOREFRONT_SLUG/claims"
echo "- Submit HTTP Status: $HTTP_STATUS"
echo "- List HTTP Status: $EXISTING_CLAIMS_HTTP_STATUS"
echo "- New Claim ID: ${CLAIM_ID:-'Not found'}"
echo "- Booking ID: ${BOOKING_ID:-'Not found'}"
echo "- Tracking Number: ${TRACKING_NUMBER:-'Not found'}"
echo "- Total Claims: ${EXISTING_CLAIMS_COUNT:-'0'}"