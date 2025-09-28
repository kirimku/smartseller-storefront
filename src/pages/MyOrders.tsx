import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  Star,
  Eye,
  MoreHorizontal,
  CheckCircle,
  Circle,
  AlertCircle,
  XCircle,
  ArrowLeft,
  Phone,
  Mail,
  Download,
  Share2,
  Search,
  Filter,
  Calendar,
  Navigation,
  Zap,
  Shield,
  Gift,
  RefreshCw,
  ExternalLink,
  Copy,
  MessageSquare
} from 'lucide-react';
import { Header } from '@/components/common/Header';
import gamingMouse from '@/assets/gaming-mouse.jpg';
import gamingKeyboard from '@/assets/gaming-keyboard.jpg';
import gamingHeadset from '@/assets/gaming-headset.jpg';

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  total: number;
  pointsUsed: number;
  shippingAddress: Address;
  shippingMethod: string;
  trackingNumber?: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  notes?: string;
}

interface OrderItem {
  id: string;
  name: string;
  image: string;
  quantity: number;
  pointsPrice: number;
  originalPrice: number;
  color?: string;
}

interface Address {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface TrackingEvent {
  date: string;
  time: string;
  status: string;
  location: string;
  description: string;
  isCompleted: boolean;
}

const MyOrders: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTrackingDetails, setShowTrackingDetails] = useState(false);

  // Mock orders data
  const orders: Order[] = [
    {
      id: '1',
      orderNumber: 'RXS-240810-001',
      date: '2024-08-10',
      status: 'shipped',
      items: [
        {
          id: '1',
          name: 'Rexus Gaming Mouse MX-5 Pro',
          image: gamingMouse,
          quantity: 1,
          pointsPrice: 8500,
          originalPrice: 299000,
          color: 'Midnight Black'
        }
      ],
      total: 8500,
      pointsUsed: 8500,
      shippingAddress: {
        fullName: 'John Doe',
        phone: '+62 812-3456-7890',
        address: 'Jl. Sudirman No. 123, Apartment Tower A, Unit 15B',
        city: 'Jakarta',
        state: 'DKI Jakarta',
        postalCode: '10220',
        country: 'Indonesia'
      },
      shippingMethod: 'Express Shipping',
      trackingNumber: 'RXS240810001TRK',
      estimatedDelivery: '2024-08-12',
      notes: 'Handle with care - Gaming equipment'
    },
    {
      id: '2',
      orderNumber: 'RXS-240808-002',
      date: '2024-08-08',
      status: 'delivered',
      items: [
        {
          id: '2',
          name: 'Rexus Gaming Keyboard KX-200 RGB',
          image: gamingKeyboard,
          quantity: 1,
          pointsPrice: 12000,
          originalPrice: 459000,
          color: 'RGB Backlit'
        }
      ],
      total: 12000,
      pointsUsed: 12000,
      shippingAddress: {
        fullName: 'John Doe',
        phone: '+62 812-3456-7890',
        address: 'Jl. Sudirman No. 123, Apartment Tower A, Unit 15B',
        city: 'Jakarta',
        state: 'DKI Jakarta',
        postalCode: '10220',
        country: 'Indonesia'
      },
      shippingMethod: 'Standard Shipping',
      trackingNumber: 'RXS240808002TRK',
      estimatedDelivery: '2024-08-10',
      actualDelivery: '2024-08-10'
    },
    {
      id: '3',
      orderNumber: 'RXS-240805-003',
      date: '2024-08-05',
      status: 'processing',
      items: [
        {
          id: '3',
          name: 'Rexus Gaming Headset HX-7 Pro',
          image: gamingHeadset,
          quantity: 1,
          pointsPrice: 9800,
          originalPrice: 359000,
          color: 'Black/Red'
        }
      ],
      total: 9800,
      pointsUsed: 9800,
      shippingAddress: {
        fullName: 'John Doe',
        phone: '+62 812-3456-7890',
        address: 'Jl. Gatot Subroto No. 456, Office Building, Floor 12',
        city: 'Jakarta',
        state: 'DKI Jakarta',
        postalCode: '12930',
        country: 'Indonesia'
      },
      shippingMethod: 'Express Shipping',
      estimatedDelivery: '2024-08-08'
    }
  ];

  // Mock tracking data
  const trackingEvents: TrackingEvent[] = [
    {
      date: '2024-08-10',
      time: '09:30',
      status: 'Order Confirmed',
      location: 'Jakarta Warehouse',
      description: 'Your order has been confirmed and is being prepared for shipment',
      isCompleted: true
    },
    {
      date: '2024-08-10',
      time: '14:20',
      status: 'Packed',
      location: 'Jakarta Warehouse',
      description: 'Your items have been carefully packed and quality checked',
      isCompleted: true
    },
    {
      date: '2024-08-10',
      time: '18:45',
      status: 'Shipped',
      location: 'Jakarta Distribution Center',
      description: 'Package has been picked up by courier and is on its way',
      isCompleted: true
    },
    {
      date: '2024-08-11',
      time: '08:15',
      status: 'In Transit',
      location: 'Bandung Sorting Facility',
      description: 'Package is in transit to destination city',
      isCompleted: true
    },
    {
      date: '2024-08-12',
      time: '10:00',
      status: 'Out for Delivery',
      location: 'Jakarta Local Depot',
      description: 'Package is out for delivery and will arrive today',
      isCompleted: false
    },
    {
      date: '2024-08-12',
      time: '--:--',
      status: 'Delivered',
      location: 'Your Address',
      description: 'Package has been delivered successfully',
      isCompleted: false
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <RefreshCw className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const getDeliveryProgress = (status: string) => {
    switch (status) {
      case 'pending': return 10;
      case 'processing': return 25;
      case 'shipped': return 60;
      case 'delivered': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'all' || order.status === activeTab;
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleTrackOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowTrackingDetails(true);
  };

  const handleCopyTrackingNumber = (trackingNumber: string) => {
    navigator.clipboard.writeText(trackingNumber);
    // Show toast notification in real app
    console.log('Tracking number copied:', trackingNumber);
  };

  const handleReorder = (order: Order) => {
    // Navigate to product page for reordering
    const firstItem = order.items[0];
    navigate(`/product/${firstItem.id}`);
  };

  const handleRateProduct = (orderId: string, itemId: string) => {
    // Navigate to rating page
    console.log('Rate product:', { orderId, itemId });
  };

  const handleContactSupport = () => {
    // Open support chat or navigate to support page
    console.log('Contact support');
  };

  if (showTrackingDetails && selectedOrder) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowTrackingDetails(false)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Order Tracking</h1>
              <p className="text-muted-foreground">Track your order #{selectedOrder.orderNumber}</p>
            </div>
          </div>

          {/* Order Summary */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Order #{selectedOrder.orderNumber}</CardTitle>
                  <CardDescription>
                    Placed on {new Date(selectedOrder.date).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {getStatusIcon(selectedOrder.status)}
                  <span className="ml-1 capitalize">{selectedOrder.status}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Items Ordered</h4>
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <h5 className="font-medium text-sm">{item.name}</h5>
                        <p className="text-xs text-muted-foreground">Color: {item.color}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{item.pointsPrice.toLocaleString()} pts</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Shipping Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="font-medium text-sm">{selectedOrder.shippingAddress.fullName}</p>
                        <p className="text-sm text-muted-foreground">{selectedOrder.shippingAddress.phone}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedOrder.shippingAddress.address}<br />
                          {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Truck className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{selectedOrder.shippingMethod}</p>
                        <p className="text-sm text-muted-foreground">
                          Est. delivery: {new Date(selectedOrder.estimatedDelivery).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {selectedOrder.trackingNumber && (
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">Tracking Number</p>
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {selectedOrder.trackingNumber}
                            </code>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleCopyTrackingNumber(selectedOrder.trackingNumber!)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>Delivery Progress</span>
                  <span>{getDeliveryProgress(selectedOrder.status)}%</span>
                </div>
                <Progress value={getDeliveryProgress(selectedOrder.status)} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Tracking Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Tracking Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trackingEvents.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        event.isCompleted 
                          ? 'bg-green-500 border-green-500' 
                          : 'bg-white border-gray-300'
                      }`} />
                      {index < trackingEvents.length - 1 && (
                        <div className={`w-0.5 h-12 ${
                          event.isCompleted ? 'bg-green-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                    
                    <div className="flex-1 pb-8">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{event.status}</h4>
                        <Badge variant="outline" className="text-xs">
                          {event.date} {event.time}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{event.location}</p>
                      <p className="text-sm">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" onClick={handleContactSupport}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Receipt
            </Button>
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              Track on Courier
            </Button>
            <Button variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share Tracking
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedOrder && !showTrackingDetails) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedOrder(null)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Order Details</h1>
              <p className="text-muted-foreground">View complete order information</p>
            </div>
          </div>

          {/* Order Details */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Order #{selectedOrder.orderNumber}</CardTitle>
                  <CardDescription>
                    Placed on {new Date(selectedOrder.date).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {getStatusIcon(selectedOrder.status)}
                  <span className="ml-1 capitalize">{selectedOrder.status}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Items */}
              <div>
                <h4 className="font-medium mb-3">Items ({selectedOrder.items.length})</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <h5 className="font-medium">{item.name}</h5>
                        <p className="text-sm text-muted-foreground">Color: {item.color}</p>
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                        <p className="text-xs text-muted-foreground">
                          Original Price: Rp {item.originalPrice.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{item.pointsPrice.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Points</p>
                        {selectedOrder.status === 'delivered' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="mt-2"
                            onClick={() => handleRateProduct(selectedOrder.id, item.id)}
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Rate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Order Summary */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Payment Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{selectedOrder.total.toLocaleString()} pts</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>FREE</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>{selectedOrder.total.toLocaleString()} pts</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Shipping Information</h4>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{selectedOrder.shippingAddress.fullName}</p>
                    <p>{selectedOrder.shippingAddress.phone}</p>
                    <p className="text-muted-foreground">
                      {selectedOrder.shippingAddress.address}<br />
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}<br />
                      {selectedOrder.shippingAddress.postalCode}, {selectedOrder.shippingAddress.country}
                    </p>
                    <p className="text-muted-foreground pt-2">
                      <strong>Method:</strong> {selectedOrder.shippingMethod}
                    </p>
                    <p className="text-muted-foreground">
                      <strong>Est. Delivery:</strong> {new Date(selectedOrder.estimatedDelivery).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Order Notes</h4>
                    <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
              <Button 
                variant="outline"
                onClick={() => handleTrackOrder(selectedOrder)}
              >
                <Package className="w-4 h-4 mr-2" />
                Track Order
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => handleReorder(selectedOrder)}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reorder
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Receipt
            </Button>
            <Button variant="outline" onClick={handleContactSupport}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Support
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground">Track and manage your redemption orders</p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search orders by number or product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="shipped">Shipped</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No orders found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery 
                        ? 'Try adjusting your search query'
                        : 'You haven\'t placed any orders yet'
                      }
                    </p>
                    <Button onClick={() => navigate('/')}>
                      Start Shopping
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredOrders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">Order #{order.orderNumber}</h3>
                        <p className="text-sm text-muted-foreground">
                          Placed on {new Date(order.date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status}</span>
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      {/* Items Preview */}
                      <div className="md:col-span-2">
                        <div className="flex gap-3">
                          {order.items.slice(0, 3).map((item, index) => (
                            <div key={item.id} className="flex items-center gap-3">
                              <img 
                                src={item.image} 
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-md"
                              />
                              <div>
                                <h4 className="font-medium text-sm">{item.name}</h4>
                                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                <p className="text-xs font-medium">{item.pointsPrice.toLocaleString()} pts</p>
                              </div>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="flex items-center text-muted-foreground">
                              <MoreHorizontal className="w-4 h-4" />
                              <span className="text-sm ml-1">+{order.items.length - 3} more</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order Info */}
                      <div className="text-right">
                        <p className="font-bold text-lg">{order.total.toLocaleString()} pts</p>
                        <p className="text-sm text-muted-foreground">Total Points Used</p>
                        {order.trackingNumber && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Tracking: {order.trackingNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar for non-delivered orders */}
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Order Progress</span>
                          <span>Est. delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}</span>
                        </div>
                        <Progress value={getDeliveryProgress(order.status)} className="h-2" />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleOrderClick(order)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      
                      {order.status !== 'cancelled' && order.status !== 'delivered' && order.trackingNumber && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleTrackOrder(order)}
                        >
                          <Package className="w-4 h-4 mr-2" />
                          Track Order
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleReorder(order)}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reorder
                      </Button>

                      {order.status === 'delivered' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRateProduct(order.id, order.items[0].id)}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Rate Products
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                <Phone className="w-6 h-6" />
                <span>Call Support</span>
                <span className="text-xs text-muted-foreground">+62 21-1234-5678</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                <Mail className="w-6 h-6" />
                <span>Email Us</span>
                <span className="text-xs text-muted-foreground">support@rexus.com</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                <MessageSquare className="w-6 h-6" />
                <span>Live Chat</span>
                <span className="text-xs text-muted-foreground">24/7 Available</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyOrders;
