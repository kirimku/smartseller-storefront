#!/bin/bash

# Test script for GetClaimsByWarrantyID endpoint
# Tests the endpoint with a real warranty that has existing claims

set -e

echo "🔍 Testing GetClaimsByWarrantyID endpoint..."
echo "================================================"

# Configuration
BASE_URL="http://localhost:8090"
STOREFRONT_SLUG="rexus"
LOGIN_EMAIL="aswin.test3@gmail.com"
LOGIN_PASSWORD="password123"

# Test data - warranty with existing claims
WARRANTY_ID="3c7132f4-f7f3-4854-b1c5-ddd3461030e6"
BARCODE_NUMBER="REX2565XAHAYCXNPH"

echo "📋 Test Configuration:"
echo "   Base URL: $BASE_URL"
echo "   Storefront: $STOREFRONT_SLUG"
echo "   Customer: $LOGIN_EMAIL"
echo "   Warranty ID: $WARRANTY_ID"
echo "   Barcode: $BARCODE_NUMBER"
echo ""

# Step 1: Get authentication token
echo "🔐 Step 1: Getting authentication token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/storefront/$STOREFRONT_SLUG/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$LOGIN_EMAIL\",
    \"password\": \"$LOGIN_PASSWORD\"
  }")

# Extract token from response
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get authentication token"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Authentication successful"
echo "   Token: ${TOKEN:0:20}..."
echo ""

# Step 2: Test GetClaimsByWarrantyID endpoint
echo "🧪 Step 2: Testing GetClaimsByWarrantyID endpoint..."
ENDPOINT_URL="$BASE_URL/api/v1/storefront/$STOREFRONT_SLUG/warranties/claims/$WARRANTY_ID"

echo "   Request URL: $ENDPOINT_URL"
echo "   Method: GET"
echo "   Headers: Authorization: Bearer [token]"
echo ""

CLAIMS_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X GET "$ENDPOINT_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

# Extract HTTP status and response body
HTTP_STATUS=$(echo "$CLAIMS_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$CLAIMS_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "📊 Response Details:"
echo "   HTTP Status: $HTTP_STATUS"
echo "   Response Body:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
echo ""

# Step 3: Validate response
echo "✅ Step 3: Validating response..."

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ HTTP Status: 200 OK"
    
    # Check if response contains claims data
    CLAIMS_COUNT=$(echo "$RESPONSE_BODY" | jq '.data.claims | length' 2>/dev/null || echo "0")
    
    if [ "$CLAIMS_COUNT" -gt "0" ]; then
        echo "✅ Claims found: $CLAIMS_COUNT claim(s)"
        
        # Extract first claim details
        FIRST_CLAIM=$(echo "$RESPONSE_BODY" | jq '.data.claims[0]' 2>/dev/null)
        CLAIM_NUMBER=$(echo "$FIRST_CLAIM" | jq -r '.claim_number' 2>/dev/null)
        CLAIM_STATUS=$(echo "$FIRST_CLAIM" | jq -r '.status' 2>/dev/null)
        ISSUE_CATEGORY=$(echo "$FIRST_CLAIM" | jq -r '.issue_category' 2>/dev/null)
        
        echo "✅ First claim details:"
        echo "   Claim Number: $CLAIM_NUMBER"
        echo "   Status: $CLAIM_STATUS"
        echo "   Issue Category: $ISSUE_CATEGORY"
    else
        echo "⚠️  No claims found for this warranty"
    fi
    
    # Validate response structure
    SUCCESS=$(echo "$RESPONSE_BODY" | jq -r '.success' 2>/dev/null)
    MESSAGE=$(echo "$RESPONSE_BODY" | jq -r '.message' 2>/dev/null)
    
    if [ "$SUCCESS" = "true" ]; then
        echo "✅ Response structure valid"
        echo "   Success: $SUCCESS"
        echo "   Message: $MESSAGE"
    else
        echo "❌ Invalid response structure"
    fi
    
else
    echo "❌ HTTP Status: $HTTP_STATUS (Expected: 200)"
    echo "❌ Request failed"
fi

echo ""
echo "🏁 Test completed!"
echo "================================================"

# Step 4: Additional test cases
echo ""
echo "🧪 Additional Test Cases:"
echo "========================"

# Test case 1: Invalid UUID format
echo ""
echo "Test 1: Invalid UUID format"
INVALID_UUID="invalid-uuid-123"
INVALID_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X GET \
  "$BASE_URL/api/v1/storefront/$STOREFRONT_SLUG/warranties/claims/$INVALID_UUID" \
  -H "Authorization: Bearer $TOKEN")

INVALID_STATUS=$(echo "$INVALID_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
echo "   Expected: 400, Got: $INVALID_STATUS"

if [ "$INVALID_STATUS" = "400" ]; then
    echo "   ✅ Invalid UUID handling: PASS"
else
    echo "   ❌ Invalid UUID handling: FAIL"
fi

# Test case 2: Non-existent warranty
echo ""
echo "Test 2: Non-existent warranty ID"
NONEXISTENT_UUID="00000000-0000-0000-0000-000000000000"
NONEXISTENT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X GET \
  "$BASE_URL/api/v1/storefront/$STOREFRONT_SLUG/warranties/claims/$NONEXISTENT_UUID" \
  -H "Authorization: Bearer $TOKEN")

NONEXISTENT_STATUS=$(echo "$NONEXISTENT_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
echo "   Expected: 500 (current implementation), Got: $NONEXISTENT_STATUS"

if [ "$NONEXISTENT_STATUS" = "500" ]; then
    echo "   ✅ Non-existent warranty handling: PASS"
else
    echo "   ❌ Non-existent warranty handling: FAIL"
fi

# Test case 3: No authentication
echo ""
echo "Test 3: No authentication token"
UNAUTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X GET \
  "$BASE_URL/api/v1/storefront/$STOREFRONT_SLUG/warranties/claims/$WARRANTY_ID")

UNAUTH_STATUS=$(echo "$UNAUTH_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
echo "   Expected: 401, Got: $UNAUTH_STATUS"

if [ "$UNAUTH_STATUS" = "401" ]; then
    echo "   ✅ Unauthorized access handling: PASS"
else
    echo "   ❌ Unauthorized access handling: FAIL"
fi

echo ""
echo "🎯 Summary:"
echo "   Main endpoint test: $([ "$HTTP_STATUS" = "200" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "   Invalid UUID test: $([ "$INVALID_STATUS" = "400" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "   Non-existent warranty test: $([ "$NONEXISTENT_STATUS" = "500" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "   Unauthorized access test: $([ "$UNAUTH_STATUS" = "401" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo ""
echo "🚀 GetClaimsByWarrantyID endpoint testing complete!"