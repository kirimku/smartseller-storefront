import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Star, 
  Gift, 
  Truck, 
  MapPin, 
  CreditCard,
  Shield,
  CheckCircle,
  Clock,
  Package,
  Phone,
  Mail,
  User,
  Home,
  Building,
  Zap,
  AlertTriangle,
  Copy,
  Check,
  Plus,
  Minus
} from 'lucide-react';
import gamingHeadset from '@/assets/gaming-headset.jpg';
import { Header } from '@/components/common/Header';

interface RedemptionItem {
  id: number;
  name: string;
  image: string;
  pointsPrice: number;
  originalPrice: number;
  quantity: number;
  color?: string;
  inStock: boolean;
}

interface UserPoints {
  total: number;
  available: number;
  pending: number;
  expiring: number;
  expiryDate: string;
}

interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const RedeemPage: React.FC = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeStep, setActiveStep] = useState(1);
  const [selectedShipping, setSelectedShipping] = useState('standard');
  const [selectedAddress, setSelectedAddress] = useState(0);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [usePoints, setUsePoints] = useState(true);
  const [partialPayment, setPartialPayment] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [newAddress, setNewAddress] = useState<ShippingAddress>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Indonesia',
    isDefault: false
  });

  // Get product data from navigation state
  const productData = location.state?.product;
  const productQuantity = location.state?.quantity || 1;
  const selectedColor = location.state?.selectedColor;
  const totalPointsFromProduct = location.state?.totalPoints;

  // Mock data
  const userPoints: UserPoints = {
    total: 15420,
    available: 12850,
    pending: 1200,
    expiring: 1370,
    expiryDate: '2024-12-31'
  };

  // Use actual product data if available, otherwise fallback to mock
  const redemptionItem: RedemptionItem = productData ? {
    id: productData.id,
    name: productData.name,
    image: productData.images[0],
    pointsPrice: productData.pointsPrice,
    originalPrice: productData.discountPrice || productData.originalPrice,
    quantity: productQuantity,
    color: selectedColor,
    inStock: productData.availability === 'in_stock' || productData.availability === 'limited'
  } : {
    id: 1,
    name: "Rexus Gaming Headset MX-7",
    image: gamingHeadset,
    pointsPrice: 9800,
    originalPrice: 199.99,
    quantity: 1,
    color: "Midnight Black",
    inStock: true
  };

  const savedAddresses: ShippingAddress[] = [
    {
      fullName: "John Doe",
      phone: "+62 812-3456-7890",
      email: "john@email.com",
      address: "Jl. Sudirman No. 123, Apartment Tower A, Unit 15B",
      city: "Jakarta",
      state: "DKI Jakarta",
      postalCode: "10220",
      country: "Indonesia",
      isDefault: true
    },
    {
      fullName: "John Doe",
      phone: "+62 812-3456-7890",
      email: "john@email.com",
      address: "Jl. Gatot Subroto No. 456, Office Building, Floor 12",
      city: "Jakarta",
      state: "DKI Jakarta",
      postalCode: "12930",
      country: "Indonesia",
      isDefault: false
    }
  ];

  const shippingOptions = [
    {
      id: 'standard',
      name: 'Standard Shipping',
      description: '5-7 business days',
      price: 0,
      points: 0,
      icon: <Package className="w-5 h-5" />
    },
    {
      id: 'express',
      name: 'Express Shipping',
      description: '2-3 business days',
      price: 15000,
      points: 750,
      icon: <Zap className="w-5 h-5" />
    },
    {
      id: 'overnight',
      name: 'Overnight Delivery',
      description: 'Next business day',
      price: 25000,
      points: 1250,
      icon: <Clock className="w-5 h-5" />
    }
  ];

  const calculateTotal = () => {
    const itemTotal = redemptionItem.pointsPrice * redemptionItem.quantity;
    const shippingCost = shippingOptions.find(option => option.id === selectedShipping)?.points || 0;
    const promoDiscount = isPromoApplied ? 500 : 0;
    return itemTotal + shippingCost - promoDiscount;
  };

  const calculateRemainingPoints = () => {
    return userPoints.available - calculateTotal();
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(1, redemptionItem.quantity + change);
    redemptionItem.quantity = newQuantity;
  };

  const handleApplyPromo = () => {
    if (promoCode.toLowerCase() === 'save500') {
      setIsPromoApplied(true);
    } else {
      alert('Invalid promo code');
    }
  };

  const handleAddAddress = () => {
    // Add new address logic
    console.log('Adding new address:', newAddress);
    setIsAddingAddress(false);
    setNewAddress({
      fullName: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Indonesia',
      isDefault: false
    });
  };

  const handlePlaceOrder = () => {
    if (!acceptTerms) {
      alert('Please accept the terms and conditions');
      return;
    }
    
    const selectedShippingOption = shippingOptions.find(option => option.id === selectedShipping);
    const selectedAddressData = savedAddresses[selectedAddress];
    
    const orderDetails = {
      orderId: 'RXS-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      productName: redemptionItem.name,
      pointsUsed: calculateTotal(),
      shippingAddress: `${selectedAddressData.address}, ${selectedAddressData.city}, ${selectedAddressData.state}`,
      shippingMethod: selectedShippingOption?.name || 'Standard Shipping',
      estimatedDelivery: selectedShippingOption?.description || '3-5 business days'
    };
    
    const orderData = {
      orderDetails,
      item: redemptionItem,
      shipping: selectedShippingOption,
      address: selectedAddressData,
      pointsUsed: calculateTotal(),
      total: calculateTotal(),
      promoCode: isPromoApplied ? promoCode : null
    };
    
    console.log('Placing order:', orderData);
    // Navigate to success page with order details
    navigate('/redemption-success', { state: { orderDetails, ...orderData } });
  };

  const getStepStatus = (step: number) => {
    if (step < activeStep) return 'completed';
    if (step === activeStep) return 'active';
    return 'pending';
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
              ${getStepStatus(step) === 'completed' ? 'bg-green-500 text-white' :
                getStepStatus(step) === 'active' ? 'bg-primary text-white' :
                'bg-gray-200 text-gray-600'}
            `}>
              {getStepStatus(step) === 'completed' ? <Check className="w-4 h-4" /> : step}
            </div>
            {step < 3 && (
              <div className={`w-12 h-0.5 mx-2 ${
                getStepStatus(step + 1) === 'completed' || getStepStatus(step) === 'completed' 
                  ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="p-0 h-auto font-normal hover:bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <h1 className="text-2xl font-bold">Redeem with Points</h1>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Review Items */}
            {activeStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    Review Your Redemption
                  </CardTitle>
                  <CardDescription>
                    Confirm the items you want to redeem with your points
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 p-4 border rounded-lg">
                    <img
                      src={redemptionItem.image}
                      alt={redemptionItem.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{redemptionItem.name}</h3>
                      <p className="text-sm text-muted-foreground">Color: {redemptionItem.color}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-green-600">
                          {redemptionItem.pointsPrice.toLocaleString()} points
                        </Badge>
                        <span className="text-sm text-muted-foreground line-through">
                          ${redemptionItem.originalPrice}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={redemptionItem.quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center">{redemptionItem.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => setActiveStep(2)}
                    disabled={!redemptionItem.inStock}
                  >
                    Continue to Shipping
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Shipping Information */}
            {activeStep === 2 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Shipping Address
                    </CardTitle>
                    <CardDescription>
                      Select or add a shipping address for your order
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {savedAddresses.map((address, index) => (
                      <div
                        key={index}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedAddress === index 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedAddress(index)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{address.fullName}</span>
                              {address.isDefault && (
                                <Badge variant="secondary" className="text-xs">Default</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">{address.phone}</p>
                            <p className="text-sm">{address.address}</p>
                            <p className="text-sm">{address.city}, {address.state} {address.postalCode}</p>
                            <p className="text-sm">{address.country}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedAddress === index 
                              ? 'border-primary bg-primary' 
                              : 'border-gray-300'
                          }`} />
                        </div>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsAddingAddress(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Address
                    </Button>

                    {isAddingAddress && (
                      <Card className="p-4 border-dashed">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="fullName">Full Name</Label>
                              <Input
                                id="fullName"
                                value={newAddress.fullName}
                                onChange={(e) => setNewAddress({...newAddress, fullName: e.target.value})}
                                placeholder="Enter full name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="phone">Phone Number</Label>
                              <Input
                                id="phone"
                                value={newAddress.phone}
                                onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                                placeholder="+62 812-3456-7890"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="address">Address</Label>
                            <Textarea
                              id="address"
                              value={newAddress.address}
                              onChange={(e) => setNewAddress({...newAddress, address: e.target.value})}
                              placeholder="Street address, building, unit number"
                              rows={2}
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="city">City</Label>
                              <Input
                                id="city"
                                value={newAddress.city}
                                onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                                placeholder="City"
                              />
                            </div>
                            <div>
                              <Label htmlFor="state">State/Province</Label>
                              <Input
                                id="state"
                                value={newAddress.state}
                                onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                                placeholder="State"
                              />
                            </div>
                            <div>
                              <Label htmlFor="postalCode">Postal Code</Label>
                              <Input
                                id="postalCode"
                                value={newAddress.postalCode}
                                onChange={(e) => setNewAddress({...newAddress, postalCode: e.target.value})}
                                placeholder="12345"
                              />
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="defaultAddress"
                              checked={newAddress.isDefault}
                              onCheckedChange={(checked) => setNewAddress({...newAddress, isDefault: checked})}
                            />
                            <Label htmlFor="defaultAddress">Set as default address</Label>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleAddAddress}>Save Address</Button>
                            <Button variant="outline" onClick={() => setIsAddingAddress(false)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      Shipping Method
                    </CardTitle>
                    <CardDescription>
                      Choose your preferred shipping speed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {shippingOptions.map((option) => (
                      <div
                        key={option.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedShipping === option.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedShipping(option.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              selectedShipping === option.id 
                                ? 'border-primary bg-primary' 
                                : 'border-gray-300'
                            }`} />
                            {option.icon}
                            <div>
                              <p className="font-medium">{option.name}</p>
                              <p className="text-sm text-muted-foreground">{option.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {option.points > 0 ? (
                              <p className="font-semibold text-primary">
                                +{option.points.toLocaleString()} pts
                              </p>
                            ) : (
                              <p className="font-semibold text-green-600">FREE</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setActiveStep(1)}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={() => setActiveStep(3)}>
                    Continue to Payment
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Payment & Confirmation */}
            {activeStep === 3 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="w-5 h-5" />
                      Points Payment
                    </CardTitle>
                    <CardDescription>
                      Use your loyalty points to complete this redemption
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold">Your Points Balance</span>
                        <span className="text-2xl font-bold text-primary">
                          {userPoints.available.toLocaleString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Points</p>
                          <p className="font-medium">{userPoints.total.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pending</p>
                          <p className="font-medium">{userPoints.pending.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Expiring Soon</p>
                          <p className="font-medium text-orange-600">{userPoints.expiring.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <Alert className={calculateRemainingPoints() < 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {calculateRemainingPoints() < 0 ? (
                          <span className="text-red-700">
                            Insufficient points! You need {Math.abs(calculateRemainingPoints()).toLocaleString()} more points.
                          </span>
                        ) : (
                          <span className="text-green-700">
                            After this redemption, you'll have {calculateRemainingPoints().toLocaleString()} points remaining.
                          </span>
                        )}
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Enter promo code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          variant="outline" 
                          onClick={handleApplyPromo}
                          disabled={isPromoApplied}
                        >
                          {isPromoApplied ? 'Applied' : 'Apply'}
                        </Button>
                      </div>
                      {isPromoApplied && (
                        <p className="text-sm text-green-600">✓ Promo code applied! Save 500 points</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Terms & Conditions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>• Points used for redemption are non-refundable</p>
                      <p>• Items are subject to availability and may be substituted with equivalent products</p>
                      <p>• Shipping times are estimates and may vary</p>
                      <p>• Standard warranty terms apply to all redeemed products</p>
                      <p>• Promotional points cannot be combined with other offers</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="acceptTerms"
                        checked={acceptTerms}
                        onCheckedChange={setAcceptTerms}
                      />
                      <Label htmlFor="acceptTerms" className="text-sm">
                        I agree to the terms and conditions and privacy policy
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setActiveStep(2)}>
                    Back
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handlePlaceOrder}
                    disabled={calculateRemainingPoints() < 0 || !acceptTerms}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Redemption
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Item Total</span>
                    <span>{(redemptionItem.pointsPrice * redemptionItem.quantity).toLocaleString()} pts</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>
                      {shippingOptions.find(option => option.id === selectedShipping)?.points === 0 
                        ? 'FREE' 
                        : `+${shippingOptions.find(option => option.id === selectedShipping)?.points?.toLocaleString()} pts`
                      }
                    </span>
                  </div>

                  {isPromoApplied && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Promo Discount</span>
                      <span>-500 pts</span>
                    </div>
                  )}

                  <Separator />
                  
                  <div className="flex justify-between font-semibold">
                    <span>Total Points</span>
                    <span className="text-primary">{calculateTotal().toLocaleString()} pts</span>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Equivalent to ${((calculateTotal() / 50)).toFixed(2)} USD value
                  </div>
                </div>

                {activeStep === 3 && (
                  <div className="pt-4 border-t">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Current Balance:</span>
                        <span>{userPoints.available.toLocaleString()} pts</span>
                      </div>
                      <div className="flex justify-between">
                        <span>After Redemption:</span>
                        <span className={calculateRemainingPoints() < 0 ? 'text-red-600' : 'text-green-600'}>
                          {calculateRemainingPoints().toLocaleString()} pts
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>Secure points transaction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    <span>Free standard shipping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>2-year warranty included</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedeemPage;
