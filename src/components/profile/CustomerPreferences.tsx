import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Bell, 
  Shield, 
  Globe, 
  Mail, 
  Smartphone, 
  Eye, 
  ShoppingCart,
  Heart,
  Star,
  Truck,
  CreditCard,
  Save,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface CustomerPreferences {
  notifications: {
    email: {
      orderUpdates: boolean;
      promotions: boolean;
      newsletter: boolean;
      productRecommendations: boolean;
      priceDrops: boolean;
      backInStock: boolean;
      reviews: boolean;
    };
    sms: {
      orderUpdates: boolean;
      deliveryNotifications: boolean;
      promotions: boolean;
    };
    push: {
      orderUpdates: boolean;
      promotions: boolean;
      recommendations: boolean;
    };
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    dataCollection: boolean;
    personalizedAds: boolean;
    thirdPartySharing: boolean;
    activityTracking: boolean;
  };
  shopping: {
    currency: string;
    language: string;
    defaultShippingSpeed: 'standard' | 'express' | 'overnight';
    autoSaveToWishlist: boolean;
    showPriceComparisons: boolean;
    enableRecommendations: boolean;
    rememberPaymentMethods: boolean;
  };
  communication: {
    preferredContactMethod: 'email' | 'sms' | 'phone';
    communicationFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
    marketingConsent: boolean;
  };
}

const CustomerPreferences: React.FC = () => {
  const { user, updateProfile, isLoading } = useAuth();
  const { tenant } = useTenant();
  
  const [preferences, setPreferences] = useState<CustomerPreferences | null>(null);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Default preferences
  const defaultPreferences: CustomerPreferences = {
    notifications: {
      email: {
        orderUpdates: true,
        promotions: false,
        newsletter: false,
        productRecommendations: false,
        priceDrops: false,
        backInStock: false,
        reviews: false,
      },
      sms: {
        orderUpdates: true,
        deliveryNotifications: true,
        promotions: false,
      },
      push: {
        orderUpdates: true,
        promotions: false,
        recommendations: false,
      },
    },
    privacy: {
      profileVisibility: 'private',
      dataCollection: true,
      personalizedAds: false,
      thirdPartySharing: false,
      activityTracking: true,
    },
    shopping: {
      currency: tenant?.settings.currency || 'USD',
      language: tenant?.settings.language || 'en',
      defaultShippingSpeed: 'standard',
      autoSaveToWishlist: false,
      showPriceComparisons: true,
      enableRecommendations: true,
      rememberPaymentMethods: true,
    },
    communication: {
      preferredContactMethod: 'email',
      communicationFrequency: 'weekly',
      marketingConsent: false,
    },
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setIsLoadingPreferences(true);
    setError(null);

    try {
      // In a real app, this would be an API call
      // const response = await customerService.getPreferences();
      // setPreferences(response.data);
      
      // Using default preferences for now
      setTimeout(() => {
        setPreferences(defaultPreferences);
        setIsLoadingPreferences(false);
      }, 500);
    } catch (error) {
      setError('Failed to load preferences');
      setIsLoadingPreferences(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // In a real app, this would be an API call
      // await customerService.updatePreferences(preferences);
      
      // Mock implementation
      setTimeout(() => {
        setSuccessMessage('Preferences saved successfully!');
        setIsSaving(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }, 1000);
    } catch (error) {
      setError('Failed to save preferences');
      setIsSaving(false);
    }
  };

  const updatePreference = (section: keyof CustomerPreferences, key: string, value: boolean | string) => {
    if (!preferences) return;

    setPreferences(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [key]: value,
      },
    }));
  };

  const updateNestedPreference = (
    section: keyof CustomerPreferences,
    subsection: string,
    key: string,
    value: boolean | string
  ) => {
    if (!preferences) return;

    setPreferences(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [subsection]: {
          ...(prev![section] as Record<string, Record<string, unknown>>)[subsection],
          [key]: value,
        },
      },
    }));
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isLoadingPreferences) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load preferences</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Settings className="h-6 w-6" />
            <span>Preferences</span>
          </h2>
          <p className="text-muted-foreground">
            Customize your shopping experience and communication preferences
          </p>
        </div>
        
        <Button onClick={savePreferences} disabled={isSaving}>
          {isSaving ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Preferences</span>
          </CardTitle>
          <CardDescription>
            Choose how and when you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Mail className="h-4 w-4" />
              <h4 className="font-medium">Email Notifications</h4>
            </div>
            <div className="space-y-3 ml-6">
              {Object.entries(preferences.notifications.email).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={`email-${key}`} className="text-sm">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Label>
                  <Switch
                    id={`email-${key}`}
                    checked={value}
                    onCheckedChange={(checked) => 
                      updateNestedPreference('notifications', 'email', key, checked)
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* SMS Notifications */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Smartphone className="h-4 w-4" />
              <h4 className="font-medium">SMS Notifications</h4>
            </div>
            <div className="space-y-3 ml-6">
              {Object.entries(preferences.notifications.sms).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={`sms-${key}`} className="text-sm">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Label>
                  <Switch
                    id={`sms-${key}`}
                    checked={value}
                    onCheckedChange={(checked) => 
                      updateNestedPreference('notifications', 'sms', key, checked)
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Push Notifications */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Bell className="h-4 w-4" />
              <h4 className="font-medium">Push Notifications</h4>
            </div>
            <div className="space-y-3 ml-6">
              {Object.entries(preferences.notifications.push).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={`push-${key}`} className="text-sm">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Label>
                  <Switch
                    id={`push-${key}`}
                    checked={value}
                    onCheckedChange={(checked) => 
                      updateNestedPreference('notifications', 'push', key, checked)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Privacy Settings</span>
          </CardTitle>
          <CardDescription>
            Control your privacy and data sharing preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="profile-visibility">Profile Visibility</Label>
              <p className="text-sm text-muted-foreground">
                Who can see your profile information
              </p>
            </div>
            <Select
              value={preferences.privacy.profileVisibility}
              onValueChange={(value) => 
                updatePreference('privacy', 'profileVisibility', value)
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="friends">Friends Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {Object.entries(preferences.privacy)
            .filter(([key]) => key !== 'profileVisibility')
            .map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <Label htmlFor={`privacy-${key}`}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {key === 'dataCollection' && 'Allow collection of usage data for service improvement'}
                    {key === 'personalizedAds' && 'Show personalized advertisements based on your activity'}
                    {key === 'thirdPartySharing' && 'Share data with trusted third-party partners'}
                    {key === 'activityTracking' && 'Track your activity to improve recommendations'}
                  </p>
                </div>
                <Switch
                  id={`privacy-${key}`}
                  checked={value as boolean}
                  onCheckedChange={(checked) => 
                    updatePreference('privacy', key, checked)
                  }
                />
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Shopping Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Shopping Preferences</span>
          </CardTitle>
          <CardDescription>
            Customize your shopping experience and default settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="currency">Preferred Currency</Label>
              <Select
                value={preferences.shopping.currency}
                onValueChange={(value) => 
                  updatePreference('shopping', 'currency', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CAD">CAD (C$)</SelectItem>
                  <SelectItem value="AUD">AUD (A$)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="language">Language</Label>
              <Select
                value={preferences.shopping.language}
                onValueChange={(value) => 
                  updatePreference('shopping', 'language', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="it">Italiano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="shipping-speed">Default Shipping Speed</Label>
              <Select
                value={preferences.shopping.defaultShippingSpeed}
                onValueChange={(value) => 
                  updatePreference('shopping', 'defaultShippingSpeed', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (5-7 days)</SelectItem>
                  <SelectItem value="express">Express (2-3 days)</SelectItem>
                  <SelectItem value="overnight">Overnight (1 day)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {Object.entries(preferences.shopping)
            .filter(([key]) => !['currency', 'language', 'defaultShippingSpeed'].includes(key))
            .map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <Label htmlFor={`shopping-${key}`}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {key === 'autoSaveToWishlist' && 'Automatically save viewed items to your wishlist'}
                    {key === 'showPriceComparisons' && 'Show price comparisons with other retailers'}
                    {key === 'enableRecommendations' && 'Show personalized product recommendations'}
                    {key === 'rememberPaymentMethods' && 'Remember payment methods for faster checkout'}
                  </p>
                </div>
                <Switch
                  id={`shopping-${key}`}
                  checked={value as boolean}
                  onCheckedChange={(checked) => 
                    updatePreference('shopping', key, checked)
                  }
                />
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Communication Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Communication Preferences</span>
          </CardTitle>
          <CardDescription>
            Set your preferred communication methods and frequency
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="contact-method">Preferred Contact Method</Label>
              <Select
                value={preferences.communication.preferredContactMethod}
                onValueChange={(value) => 
                  updatePreference('communication', 'preferredContactMethod', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="communication-frequency">Communication Frequency</Label>
              <Select
                value={preferences.communication.communicationFrequency}
                onValueChange={(value) => 
                  updatePreference('communication', 'communicationFrequency', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="marketing-consent">Marketing Communications</Label>
              <p className="text-sm text-muted-foreground">
                Receive promotional emails and special offers
              </p>
            </div>
            <Switch
              id="marketing-consent"
              checked={preferences.communication.marketingConsent}
              onCheckedChange={(checked) => 
                updatePreference('communication', 'marketingConsent', checked)
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerPreferences;