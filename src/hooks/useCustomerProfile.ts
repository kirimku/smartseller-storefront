import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useTenant } from '@/contexts/TenantContext';

interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  loyaltyPoints: number;
  memberSince: string;
  lastOrderDate?: string;
  favoriteCategory?: string;
  completedReviews: number;
  wishlistItems: number;
}

interface ProfileCompletionStatus {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
  suggestions: string[];
}

interface CustomerAddress {
  id: string;
  type: 'shipping' | 'billing';
  isDefault: boolean;
  firstName: string;
  lastName: string;
  company?: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank';
  isDefault: boolean;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  email?: string; // for PayPal
  bankName?: string; // for bank transfers
}

interface CustomerPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  marketing: {
    promotions: boolean;
    newsletter: boolean;
    recommendations: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    dataSharing: boolean;
    analytics: boolean;
  };
  shopping: {
    currency: string;
    language: string;
    autoSaveWishlist: boolean;
    rememberPayment: boolean;
  };
}

export const useCustomerProfile = () => {
  const { user, updateProfile, isLoading: authLoading } = useAuth();
  const { tenant } = useTenant();
  
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [preferences, setPreferences] = useState<CustomerPreferences | null>(null);
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletionStatus | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load customer profile data
  const loadProfileData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // In a real app, these would be separate API calls
      // const [statsRes, addressesRes, paymentsRes, prefsRes] = await Promise.all([
      //   customerService.getStats(),
      //   customerService.getAddresses(),
      //   customerService.getPaymentMethods(),
      //   customerService.getPreferences(),
      // ]);

      // Mock data for demonstration
      const mockStats: CustomerStats = {
        totalOrders: 12,
        totalSpent: 2847.99,
        averageOrderValue: 237.33,
        loyaltyPoints: 2450,
        memberSince: user.createdAt,
        lastOrderDate: '2024-01-15T10:30:00Z',
        favoriteCategory: 'Electronics',
        completedReviews: 8,
        wishlistItems: 15,
      };

      const mockAddresses: CustomerAddress[] = [
        {
          id: '1',
          type: 'shipping',
          isDefault: true,
          firstName: user.firstName,
          lastName: user.lastName,
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
          phone: user.phone,
        },
        {
          id: '2',
          type: 'billing',
          isDefault: true,
          firstName: user.firstName,
          lastName: user.lastName,
          street: '456 Business Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10002',
          country: 'US',
        },
      ];

      const mockPaymentMethods: PaymentMethod[] = [
        {
          id: '1',
          type: 'card',
          isDefault: true,
          last4: '4242',
          brand: 'Visa',
          expiryMonth: 12,
          expiryYear: 2025,
        },
        {
          id: '2',
          type: 'paypal',
          isDefault: false,
          email: user.email,
        },
      ];

      const mockPreferences: CustomerPreferences = {
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
        marketing: {
          promotions: false,
          newsletter: true,
          recommendations: true,
        },
        privacy: {
          profileVisibility: 'private',
          dataSharing: false,
          analytics: true,
        },
        shopping: {
          currency: tenant?.settings.currency || 'USD',
          language: tenant?.settings.language || 'en',
          autoSaveWishlist: true,
          rememberPayment: true,
        },
      };

      setStats(mockStats);
      setAddresses(mockAddresses);
      setPaymentMethods(mockPaymentMethods);
      setPreferences(mockPreferences);
      
    } catch (error) {
      setError('Failed to load profile data');
      console.error('Profile data loading error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, tenant]);

  // Calculate profile completion
  const calculateProfileCompletion = useCallback((): ProfileCompletionStatus => {
    if (!user) {
      return {
        isComplete: false,
        completionPercentage: 0,
        missingFields: [],
        suggestions: [],
      };
    }

    const requiredFields = [
      { field: 'firstName', label: 'First Name', value: user.firstName },
      { field: 'lastName', label: 'Last Name', value: user.lastName },
      { field: 'email', label: 'Email', value: user.email },
      { field: 'phone', label: 'Phone Number', value: user.phone },
      { field: 'dateOfBirth', label: 'Date of Birth', value: user.dateOfBirth },
    ];

    const optionalFields = [
      { field: 'avatar', label: 'Profile Picture', value: user.avatar },
      { field: 'gender', label: 'Gender', value: user.gender },
    ];

    const hasDefaultAddress = addresses.some(addr => addr.isDefault && addr.type === 'shipping');
    const hasPaymentMethod = paymentMethods.length > 0;

    const completedRequired = requiredFields.filter(field => field.value).length;
    const completedOptional = optionalFields.filter(field => field.value).length;
    const hasAddressAndPayment = (hasDefaultAddress ? 1 : 0) + (hasPaymentMethod ? 1 : 0);

    const totalFields = requiredFields.length + optionalFields.length + 2; // +2 for address and payment
    const completedFields = completedRequired + completedOptional + hasAddressAndPayment;
    
    const completionPercentage = Math.round((completedFields / totalFields) * 100);
    const isComplete = completionPercentage >= 80; // Consider 80% as complete

    const missingFields: string[] = [];
    const suggestions: string[] = [];

    // Check missing required fields
    requiredFields.forEach(field => {
      if (!field.value) {
        missingFields.push(field.field);
        suggestions.push(`Add your ${field.label.toLowerCase()}`);
      }
    });

    // Check missing optional fields
    optionalFields.forEach(field => {
      if (!field.value) {
        suggestions.push(`Add your ${field.label.toLowerCase()}`);
      }
    });

    // Check address and payment
    if (!hasDefaultAddress) {
      missingFields.push('defaultAddress');
      suggestions.push('Add a default shipping address');
    }

    if (!hasPaymentMethod) {
      suggestions.push('Add a payment method for faster checkout');
    }

    return {
      isComplete,
      completionPercentage,
      missingFields,
      suggestions,
    };
  }, [user, addresses, paymentMethods]);

  // Update profile completion when dependencies change
  useEffect(() => {
    const completion = calculateProfileCompletion();
    setProfileCompletion(completion);
  }, [calculateProfileCompletion]);

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user, loadProfileData]);

  // Address management
  const addAddress = useCallback(async (address: Omit<CustomerAddress, 'id'>) => {
    try {
      // In a real app: await customerService.addAddress(address);
      const newAddress: CustomerAddress = {
        ...address,
        id: Date.now().toString(),
      };
      
      setAddresses(prev => [...prev, newAddress]);
      return newAddress;
    } catch (error) {
      setError('Failed to add address');
      throw error;
    }
  }, []);

  const updateAddress = useCallback(async (id: string, updates: Partial<CustomerAddress>) => {
    try {
      // In a real app: await customerService.updateAddress(id, updates);
      setAddresses(prev => 
        prev.map(addr => addr.id === id ? { ...addr, ...updates } : addr)
      );
    } catch (error) {
      setError('Failed to update address');
      throw error;
    }
  }, []);

  const deleteAddress = useCallback(async (id: string) => {
    try {
      // In a real app: await customerService.deleteAddress(id);
      setAddresses(prev => prev.filter(addr => addr.id !== id));
    } catch (error) {
      setError('Failed to delete address');
      throw error;
    }
  }, []);

  const setDefaultAddress = useCallback(async (id: string, type: 'shipping' | 'billing') => {
    try {
      // In a real app: await customerService.setDefaultAddress(id, type);
      setAddresses(prev => 
        prev.map(addr => ({
          ...addr,
          isDefault: addr.id === id && addr.type === type ? true : 
                    addr.type === type ? false : addr.isDefault
        }))
      );
    } catch (error) {
      setError('Failed to set default address');
      throw error;
    }
  }, []);

  // Payment method management
  const addPaymentMethod = useCallback(async (paymentMethod: Omit<PaymentMethod, 'id'>) => {
    try {
      // In a real app: await customerService.addPaymentMethod(paymentMethod);
      const newPaymentMethod: PaymentMethod = {
        ...paymentMethod,
        id: Date.now().toString(),
      };
      
      setPaymentMethods(prev => [...prev, newPaymentMethod]);
      return newPaymentMethod;
    } catch (error) {
      setError('Failed to add payment method');
      throw error;
    }
  }, []);

  const deletePaymentMethod = useCallback(async (id: string) => {
    try {
      // In a real app: await customerService.deletePaymentMethod(id);
      setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
    } catch (error) {
      setError('Failed to delete payment method');
      throw error;
    }
  }, []);

  const setDefaultPaymentMethod = useCallback(async (id: string) => {
    try {
      // In a real app: await customerService.setDefaultPaymentMethod(id);
      setPaymentMethods(prev => 
        prev.map(pm => ({ ...pm, isDefault: pm.id === id }))
      );
    } catch (error) {
      setError('Failed to set default payment method');
      throw error;
    }
  }, []);

  // Preferences management
  const updatePreferences = useCallback(async (newPreferences: Partial<CustomerPreferences>) => {
    try {
      // In a real app: await customerService.updatePreferences(newPreferences);
      setPreferences(prev => prev ? { ...prev, ...newPreferences } : null);
    } catch (error) {
      setError('Failed to update preferences');
      throw error;
    }
  }, []);

  // Utility functions
  const getDefaultAddress = useCallback((type: 'shipping' | 'billing') => {
    return addresses.find(addr => addr.type === type && addr.isDefault);
  }, [addresses]);

  const getDefaultPaymentMethod = useCallback(() => {
    return paymentMethods.find(pm => pm.isDefault);
  }, [paymentMethods]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshData = useCallback(() => {
    loadProfileData();
  }, [loadProfileData]);

  return {
    // Data
    user,
    stats,
    addresses,
    paymentMethods,
    preferences,
    profileCompletion,
    
    // State
    isLoading: authLoading || isLoading,
    error,
    
    // Profile actions
    updateProfile,
    refreshData,
    
    // Address actions
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getDefaultAddress,
    
    // Payment actions
    addPaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    getDefaultPaymentMethod,
    
    // Preferences actions
    updatePreferences,
    
    // Utilities
    clearError,
    calculateProfileCompletion,
  };
};