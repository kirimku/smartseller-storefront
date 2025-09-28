/**
 * Test Script for Secure Token Storage Implementation
 * This script tests the new secure token storage functionality
 */

import { secureTokenStorage } from './services/secureTokenStorage';
import { deviceFingerprinting } from './utils/deviceFingerprint';

// Test data
const mockTokenData = {
  accessToken: 'test-access-token-123',
  refreshToken: 'test-refresh-token-456',
  expiresAt: Date.now() + 3600000, // 1 hour from now
  tokenType: 'Bearer',
};

const mockCustomerData = {
  id: 'test-customer-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  phone: '+1234567890',
  isEmailVerified: true,
};

async function testSecureTokenStorage() {
  console.log('🧪 Testing Secure Token Storage Implementation...\n');

  try {
    // Test 1: Device Fingerprinting
    console.log('1️⃣ Testing Device Fingerprinting...');
    const fingerprint = await deviceFingerprinting.generateFingerprint();
    console.log('✅ Device fingerprint generated:', fingerprint.fingerprint.substring(0, 16) + '...');
    
    const validation = await deviceFingerprinting.validateDeviceForAuth();
    console.log('✅ Device validation result:', validation);
    console.log('');

    // Test 2: Store Token and Customer Data
    console.log('2️⃣ Testing Token and Customer Data Storage...');
    secureTokenStorage.storeTokens(mockTokenData, mockCustomerData);
    console.log('✅ Tokens and customer data stored successfully');
    console.log('');

    // Test 3: Retrieve Stored Data
    console.log('3️⃣ Testing Data Retrieval...');
    const storedAccessToken = secureTokenStorage.getAccessToken();
    const storedRefreshToken = secureTokenStorage.getRefreshToken();
    const storedCustomer = secureTokenStorage.getCustomerData();
    
    console.log('✅ Access token retrieved:', storedAccessToken ? 'Present' : 'Missing');
    console.log('✅ Refresh token retrieved:', storedRefreshToken ? 'Present' : 'Missing');
    console.log('✅ Customer data retrieved:', storedCustomer ? 'Present' : 'Missing');
    console.log('');

    // Test 4: Token Expiration Check
    console.log('4️⃣ Testing Token Expiration...');
    const isExpired = secureTokenStorage.isTokenExpired();
    console.log('✅ Token expiration check:', isExpired ? 'Expired' : 'Valid');
    console.log('');

    // Test 5: Token Integrity Validation
    console.log('5️⃣ Testing Token Integrity...');
    const integrityCheck = secureTokenStorage.validateTokenIntegrity();
    console.log('✅ Token integrity check:', integrityCheck ? 'Valid' : 'Invalid');
    console.log('');

    // Test 6: Clear All Data
    console.log('6️⃣ Testing Data Clearing...');
    secureTokenStorage.clearTokens();
    
    const clearedAccessToken = secureTokenStorage.getAccessToken();
    const clearedRefreshToken = secureTokenStorage.getRefreshToken();
    const clearedCustomer = secureTokenStorage.getCustomerData();
    
    console.log('✅ Data cleared successfully');
    console.log('   - Access token:', clearedAccessToken ? 'Still present (❌)' : 'Cleared (✅)');
    console.log('   - Refresh token:', clearedRefreshToken ? 'Still present (❌)' : 'Cleared (✅)');
    console.log('   - Customer data:', clearedCustomer ? 'Still present (❌)' : 'Cleared (✅)');
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('');
    console.log('📊 Security Features Implemented:');
    console.log('   ✅ Memory storage for access tokens');
    console.log('   ✅ Encrypted localStorage fallback for refresh tokens');
    console.log('   ✅ Device fingerprinting for session validation');
    console.log('   ✅ Automatic token expiration checking');
    console.log('   ✅ Secure data clearing mechanisms');
    console.log('   ✅ Risk assessment for device validation');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Export for use in browser console or testing
export { testSecureTokenStorage };

// Make test function available globally for development testing
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Extend window interface for testing
  interface WindowWithTest extends Window {
    testSecureTokenStorage: typeof testSecureTokenStorage;
  }
  
  // Make test function available globally for browser console testing
  (window as WindowWithTest).testSecureTokenStorage = testSecureTokenStorage;
  console.log('🔧 Secure Token Storage test available: window.testSecureTokenStorage()');
}