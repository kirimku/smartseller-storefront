#!/bin/bash

# Test Customer Courier API Script (Verified Working Version)
# This script tests the SmartSeller customer courier endpoint with verified working parameters

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing SmartSeller Customer Courier API (Verified Parameters)...${NC}"

# Generate fresh auth tokens
echo -e "${YELLOW}Generating authentication tokens...${NC}"
go run generate_auth_tokens.go > /tmp/tokens.txt 2>&1

# Extract customer token from the output
CUSTOMER_TOKEN=$(grep -A 1 "For Customer API calls:" /tmp/tokens.txt | tail -1 | sed 's/.*Bearer //' | sed 's/" .*//')

if [ -z "$CUSTOMER_TOKEN" ]; then
    if [ -n "$CUSTOMER_TOKEN_OVERRIDE" ]; then
        echo -e "${YELLOW}Using CUSTOMER_TOKEN_OVERRIDE env var${NC}"
        CUSTOMER_TOKEN="$CUSTOMER_TOKEN_OVERRIDE"
    else
        echo -e "${YELLOW}Using dummy token for testing (will likely fail auth but shows payload format)${NC}"
        CUSTOMER_TOKEN="dummy.invalid.jwt"
    fi
fi

echo -e "${GREEN}Customer token generated successfully${NC}"

# API endpoint
API_URL="http://localhost:8090/api/v1/customer/shipping/couriers"

echo -e "${YELLOW}Testing customer courier endpoint with verified parameters:${NC}"
echo "  From: Jakarta Timur, Ciracas"
echo "  To: Bandung, Bandung Kulon"
echo "  Weight: 1000g"
echo ""

# Make the API call (POST with JSON body)
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from_city": "Jakarta Timur",
    "from_district": "Ciracas", 
    "to_city": "Bandung",
    "to_district": "Bandung Kulon",
    "weight": 1000
  }' \
  "$API_URL")

# Extract HTTP status and response body
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

echo -e "${YELLOW}Response Status: $HTTP_STATUS${NC}"
echo -e "${YELLOW}Response Body:${NC}"
echo "$RESPONSE_BODY" | jq . 2>/dev/null || echo "$RESPONSE_BODY"

# Check if successful
if [ "$HTTP_STATUS" = "200" ]; then
    # Check if couriers are present in response
    COURIER_COUNT=$(echo "$RESPONSE_BODY" | jq '.data.couriers | length' 2>/dev/null || echo "0")
    if [ "$COURIER_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓ Success! Found $COURIER_COUNT courier(s)${NC}"
        echo -e "${GREEN}Available couriers:${NC}"
        echo "$RESPONSE_BODY" | jq -r '.data.couriers[].name' 2>/dev/null || echo "Could not parse courier names"
    else
        echo -e "${YELLOW}⚠ API returned 200 but no couriers found${NC}"
    fi
else
    echo -e "${RED}✗ API call failed with status $HTTP_STATUS${NC}"
fi

# Cleanup
rm -f /tmp/tokens.txt

echo ""
echo -e "${YELLOW}Test completed.${NC}"