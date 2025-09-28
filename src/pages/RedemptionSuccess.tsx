import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Star, 
  Gift, 
  Truck, 
  MapPin, 
  Package,
  Clock,
  Phone,
  Mail,
  Home,
  Download,
  Share2
} from 'lucide-react';
import { Header } from '@/components/common/Header';

interface OrderDetails {
  orderId: string;
  productName: string;
  pointsUsed: number;
  shippingAddress: string;
  shippingMethod: string;
  estimatedDelivery: string;
}

const RedemptionSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get order details from navigation state
  const orderDetails: OrderDetails = location.state?.orderDetails || {
    orderId: 'RXS-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    productName: 'Rexus Gaming Product',
    pointsUsed: 9800,
    shippingAddress: 'Default Address',
    shippingMethod: 'Standard Shipping',
    estimatedDelivery: '3-5 business days'
  };

  const handleDownloadReceipt = () => {
    // Generate and download receipt logic
    console.log('Downloading receipt for order:', orderDetails.orderId);
  };

  const handleShareSuccess = () => {
    // Social media sharing logic
    console.log('Sharing success on social media');
  };

  const handleTrackOrder = () => {
    navigate('/tracking-status', { state: { orderId: orderDetails.orderId } });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">Redemption Successful!</h1>
          <p className="text-muted-foreground">
            Your points have been redeemed successfully. Get ready for an awesome gaming experience!
          </p>
        </div>

        {/* Order Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-600" />
              Order Summary
            </CardTitle>
            <CardDescription>Order #{orderDetails.orderId}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{orderDetails.productName}</h3>
                <p className="text-sm text-muted-foreground">Quantity: 1</p>
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {orderDetails.pointsUsed.toLocaleString()} Points
              </Badge>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium text-sm">Shipping Address</p>
                  <p className="text-sm text-muted-foreground">{orderDetails.shippingAddress}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Truck className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium text-sm">Shipping Method</p>
                  <p className="text-sm text-muted-foreground">{orderDetails.shippingMethod}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium text-sm">Estimated Delivery</p>
                  <p className="text-sm text-muted-foreground">{orderDetails.estimatedDelivery}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Points Balance Update */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Points Update
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Points Used</p>
                <p className="text-xl font-bold text-red-600">-{orderDetails.pointsUsed.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Remaining Points</p>
                <p className="text-xl font-bold text-green-600">{(12850 - orderDetails.pointsUsed).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bonus Points Earned */}
        <Card className="mb-6 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Gift className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-800 mb-1">Bonus Points Earned!</h3>
              <p className="text-sm text-purple-600 mb-2">
                You've earned 200 bonus points for this redemption
              </p>
              <Badge className="bg-purple-600 text-white">+200 Points</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleTrackOrder}
            className="w-full"
            size="lg"
          >
            <Package className="w-4 h-4 mr-2" />
            Track Your Order
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={handleDownloadReceipt}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Receipt
            </Button>
            <Button 
              variant="outline" 
              onClick={handleShareSuccess}
              className="flex-1"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Success
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Customer Support */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
            <CardDescription>
              Our customer support team is here to assist you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Call Support
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Us
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Social Media Sharing */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Share your awesome new gear with the gaming community!
          </p>
          <div className="flex justify-center gap-2">
            <Button size="sm" variant="outline">Facebook</Button>
            <Button size="sm" variant="outline">Twitter</Button>
            <Button size="sm" variant="outline">Instagram</Button>
            <Button size="sm" variant="outline">Discord</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedemptionSuccess;
