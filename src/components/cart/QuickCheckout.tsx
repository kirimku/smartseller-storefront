import React, { useState, useEffect } from 'react';
import { Cart } from '@/services/cartService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Truck, MapPin, User, Mail, Phone, Lock } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface QuickCheckoutProps {
  cart: Cart;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CheckoutForm {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  paymentMethod: 'card' | 'paypal' | 'cod';
  shippingMethod: string;
  saveInfo: boolean;
  newsletter: boolean;
}

const QuickCheckout: React.FC<QuickCheckoutProps> = ({
  cart,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'info' | 'payment' | 'review'>('info');
  const [isProcessing, setIsProcessing] = useState(false);
  const [form, setForm] = useState<CheckoutForm>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    paymentMethod: 'card',
    shippingMethod: 'standard',
    saveInfo: false,
    newsletter: false,
  });

  const [shippingOptions] = useState([
    { id: 'standard', name: 'Standard Shipping', price: 0, days: '5-7 business days' },
    { id: 'express', name: 'Express Shipping', price: 15, days: '2-3 business days' },
    { id: 'overnight', name: 'Overnight Shipping', price: 25, days: '1 business day' },
  ]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cart.currency || 'USD',
    }).format(price);
  };

  const handleInputChange = (field: keyof CheckoutForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = () => {
    switch (step) {
      case 'info':
        return form.email && form.firstName && form.lastName && form.address && form.city && form.postalCode;
      case 'payment':
        return form.paymentMethod;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!validateStep()) return;
    
    if (step === 'info') setStep('payment');
    else if (step === 'payment') setStep('review');
  };

  const handleBack = () => {
    if (step === 'payment') setStep('info');
    else if (step === 'review') setStep('payment');
  };

  const handleSubmit = async () => {
    try {
      setIsProcessing(true);
      
      // Simulate checkout process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would integrate with your payment processor
      console.log('Processing checkout:', { cart, form });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Checkout failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedShipping = shippingOptions.find(option => option.id === form.shippingMethod);
  const totalWithShipping = cart.total + (selectedShipping?.price || 0);

  const renderStepContent = () => {
    switch (step) {
      case 'info':
        return (
          <div className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <User className="w-5 h-5" />
                Contact Information
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </h3>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={form.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={form.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <select
                    id="country"
                    value={form.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Shipping Method
              </h3>

              <RadioGroup
                value={form.shippingMethod}
                onValueChange={(value) => handleInputChange('shippingMethod', value)}
              >
                {shippingOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <div className="flex-1">
                      <Label htmlFor={option.id} className="flex justify-between items-center cursor-pointer">
                        <div>
                          <div className="font-medium">{option.name}</div>
                          <div className="text-sm text-gray-500">{option.days}</div>
                        </div>
                        <div className="font-medium">
                          {option.price === 0 ? 'Free' : formatPrice(option.price)}
                        </div>
                      </Label>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Method
              </h3>

              <RadioGroup
                value={form.paymentMethod}
                onValueChange={(value) => handleInputChange('paymentMethod', value)}
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="w-4 h-4" />
                    Credit/Debit Card
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="paypal" id="paypal" />
                  <Label htmlFor="paypal" className="cursor-pointer">PayPal</Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="cursor-pointer">Cash on Delivery</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Order Review</h3>
            
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Subtotal ({cart.itemCount} items)</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>
              
              {cart.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(cart.discount)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span>Shipping ({selectedShipping?.name})</span>
                <span>{selectedShipping?.price === 0 ? 'Free' : formatPrice(selectedShipping?.price || 0)}</span>
              </div>
              
              {cart.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{formatPrice(cart.tax)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatPrice(totalWithShipping)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="saveInfo"
                  checked={form.saveInfo}
                  onCheckedChange={(checked) => handleInputChange('saveInfo', checked as boolean)}
                />
                <Label htmlFor="saveInfo" className="text-sm">
                  Save my information for faster checkout
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="newsletter"
                  checked={form.newsletter}
                  onCheckedChange={(checked) => handleInputChange('newsletter', checked as boolean)}
                />
                <Label htmlFor="newsletter" className="text-sm">
                  Subscribe to newsletter for updates and offers
                </Label>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">Secure Checkout</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Your payment information is encrypted and secure
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Quick Checkout</span>
            <div className="flex gap-1">
              {['info', 'payment', 'review'].map((stepName, index) => (
                <div
                  key={stepName}
                  className={`w-2 h-2 rounded-full ${
                    step === stepName ? 'bg-blue-600' : 
                    ['info', 'payment', 'review'].indexOf(step) > index ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {renderStepContent()}

          <div className="flex justify-between pt-4 border-t">
            {step !== 'info' && (
              <Button variant="outline" onClick={handleBack} disabled={isProcessing}>
                Back
              </Button>
            )}
            
            <div className="ml-auto">
              {step === 'review' ? (
                <Button 
                  onClick={handleSubmit} 
                  disabled={isProcessing}
                  className="min-w-[120px]"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      Processing...
                    </div>
                  ) : (
                    `Pay ${formatPrice(totalWithShipping)}`
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={handleNext} 
                  disabled={!validateStep()}
                >
                  Continue
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickCheckout;