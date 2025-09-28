import { useTenant } from '@/contexts/TenantContext';
import { TenantFeatures } from '@/types/tenant';

export const useTenantFeatures = () => {
  const { tenant } = useTenant();
  
  const features = tenant?.features || {
    loyaltyProgram: false,
    referralSystem: false,
    spinWheel: false,
    warrantyTracking: false,
    productReviews: false,
    wishlist: false,
    compareProducts: false,
    guestCheckout: false,
    socialLogin: false,
    multiCurrency: false,
    multiLanguage: false,
  };

  const isFeatureEnabled = (feature: keyof TenantFeatures): boolean => {
    return features[feature] || false;
  };

  const getEnabledFeatures = (): (keyof TenantFeatures)[] => {
    return Object.entries(features)
      .filter(([_, enabled]) => enabled)
      .map(([feature, _]) => feature as keyof TenantFeatures);
  };

  const getDisabledFeatures = (): (keyof TenantFeatures)[] => {
    return Object.entries(features)
      .filter(([_, enabled]) => !enabled)
      .map(([feature, _]) => feature as keyof TenantFeatures);
  };

  return {
    features,
    isFeatureEnabled,
    getEnabledFeatures,
    getDisabledFeatures,
    // Convenience methods for common features
    hasLoyaltyProgram: isFeatureEnabled('loyaltyProgram'),
    hasReferralSystem: isFeatureEnabled('referralSystem'),
    hasSpinWheel: isFeatureEnabled('spinWheel'),
    hasWarrantyTracking: isFeatureEnabled('warrantyTracking'),
    hasProductReviews: isFeatureEnabled('productReviews'),
    hasWishlist: isFeatureEnabled('wishlist'),
    hasCompareProducts: isFeatureEnabled('compareProducts'),
    hasGuestCheckout: isFeatureEnabled('guestCheckout'),
    hasSocialLogin: isFeatureEnabled('socialLogin'),
    hasMultiCurrency: isFeatureEnabled('multiCurrency'),
    hasMultiLanguage: isFeatureEnabled('multiLanguage'),
  };
};