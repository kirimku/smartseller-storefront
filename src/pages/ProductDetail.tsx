import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Star, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Truck, 
  Shield, 
  RotateCcw, 
  Gift,
  Plus,
  Minus,
  Check,
  ChevronRight,
  Users,
  Trophy,
  Zap,
  Volume2,
  Gamepad2,
  Headphones,
  Monitor
} from 'lucide-react';
import gamingMouse from '@/assets/gaming-mouse.jpg';
import gamingKeyboard from '@/assets/gaming-keyboard.jpg';
import gamingHeadset from '@/assets/gaming-headset.jpg';
import { Header } from '@/components/common/Header';

interface Product {
  id: number;
  name: string;
  brand: string;
  model: string;
  images: string[];
  originalPrice: number;
  discountPrice: number;
  pointsPrice: number;
  discount: number;
  rating: number;
  totalReviews: number;
  description: string;
  category: string;
  availability: 'in_stock' | 'limited' | 'out_of_stock';
  stockCount: number;
  features: string[];
  specifications: { [key: string]: string };
  warranty: string;
  shipping: {
    free: boolean;
    estimatedDays: string;
  };
  colors: { name: string; hex: string; available: boolean }[];
}

interface Review {
  id: number;
  userName: string;
  userAvatar?: string;
  rating: number;
  date: string;
  verified: boolean;
  title: string;
  content: string;
  helpful: number;
  images?: string[];
}

const ProductDetail: React.FC = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock product data - in real app, fetch by productId
  const product: Product = {
    id: 1,
    name: "Rexus Gaming Headset MX-7",
    brand: "Rexus",
    model: "MX-7 Pro",
    images: [gamingHeadset, gamingMouse, gamingKeyboard],
    originalPrice: 299.99,
    discountPrice: 199.99,
    pointsPrice: 9800,
    discount: 33,
    rating: 4.8,
    totalReviews: 1247,
    description: "Experience immersive gaming audio with the Rexus MX-7 Pro gaming headset. Featuring 7.1 surround sound, RGB lighting, and premium comfort padding for extended gaming sessions.",
    category: "Gaming Headsets",
    availability: 'in_stock',
    stockCount: 45,
    features: [
      "7.1 Virtual Surround Sound",
      "RGB Lighting with 16.8M Colors",
      "Noise-Cancelling Microphone",
      "Premium Memory Foam Padding",
      "50mm Neodymium Drivers",
      "Cross-Platform Compatible"
    ],
    specifications: {
      "Driver Size": "50mm Neodymium",
      "Frequency Response": "20Hz - 20KHz",
      "Impedance": "32 Ohm",
      "Sensitivity": "108dB ± 3dB",
      "Microphone": "Omnidirectional, Noise-Cancelling",
      "Connection": "USB 2.0 / 3.5mm",
      "Cable Length": "2.5m Braided Cable",
      "Weight": "320g",
      "Compatibility": "PC, PS4, PS5, Xbox, Nintendo Switch, Mobile"
    },
    warranty: "2 Years International Warranty",
    shipping: {
      free: true,
      estimatedDays: "2-3 business days"
    },
    colors: [
      { name: "Midnight Black", hex: "#1a1a1a", available: true },
      { name: "Racing Red", hex: "#dc2626", available: true },
      { name: "Arctic White", hex: "#ffffff", available: false }
    ]
  };

  const reviews: Review[] = [
    {
      id: 1,
      userName: "ProGamer_2024",
      rating: 5,
      date: "2024-08-05",
      verified: true,
      title: "Amazing sound quality!",
      content: "The 7.1 surround sound is incredible. I can pinpoint enemy footsteps in FPS games perfectly. The RGB lighting is also a nice touch. Highly recommended!",
      helpful: 23
    },
    {
      id: 2,
      userName: "StreamerLife",
      rating: 4,
      date: "2024-08-02",
      verified: true,
      title: "Great for streaming",
      content: "The noise-cancelling microphone works really well. My viewers say my voice is crystal clear. Comfortable for long streaming sessions.",
      helpful: 18
    },
    {
      id: 3,
      userName: "CasualGamer",
      rating: 5,
      date: "2024-07-28",
      verified: true,
      title: "Best purchase this year",
      content: "Worth every penny. The build quality is excellent and the comfort is unmatched. The RGB effects sync well with my setup.",
      helpful: 31
    }
  ];

  const relatedProducts = [
    {
      id: 2,
      name: "Rexus Gaming Keyboard K-9",
      image: gamingKeyboard,
      price: 149.99,
      pointsPrice: 7200,
      rating: 4.7
    },
    {
      id: 3,
      name: "Rexus Gaming Mouse M-15",
      image: gamingMouse,
      price: 89.99,
      pointsPrice: 4500,
      rating: 4.6
    }
  ];

  const getAvailabilityStatus = (availability: string) => {
    const statuses = {
      in_stock: { text: 'In Stock', color: 'bg-green-100 text-green-800' },
      limited: { text: 'Limited Stock', color: 'bg-yellow-100 text-yellow-800' },
      out_of_stock: { text: 'Out of Stock', color: 'bg-red-100 text-red-800' }
    };
    return statuses[availability as keyof typeof statuses];
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : i < rating 
            ? 'text-yellow-400 fill-current opacity-50' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const handleAddToCart = () => {
    // Add to cart logic
    console.log('Added to cart:', { productId: product.id, quantity, color: selectedColor });
  };

  const handleBuyNow = () => {
    // Direct purchase logic
    console.log('Buy now:', { productId: product.id, quantity, color: selectedColor });
  };

  const handleRedeemPoints = () => {
    // Navigate to redemption page with product info
    navigate(`/redeem/${productId}`, { 
      state: { 
        product,
        quantity,
        selectedColor,
        totalPoints: product.pointsPrice * quantity
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="p-0 h-auto font-normal hover:bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <ChevronRight className="w-4 h-4" />
          <span>Gaming</span>
          <ChevronRight className="w-4 h-4" />
          <span>{product.category}</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Images */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="aspect-square relative bg-muted">
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <Badge 
                  className="absolute top-4 right-4 bg-red-500 text-white"
                >
                  -{product.discount}%
                </Badge>
              </div>
            </Card>
            
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index ? 'border-primary' : 'border-border'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="outline" className="mb-2">{product.brand}</Badge>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-muted-foreground mb-4">{product.description}</p>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {renderStars(product.rating)}
                </div>
                <span className="font-semibold">{product.rating}</span>
                <span className="text-muted-foreground">({product.totalReviews} reviews)</span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <Badge className={getAvailabilityStatus(product.availability).color}>
                  {getAvailabilityStatus(product.availability).text}
                </Badge>
                {product.availability === 'in_stock' && (
                  <span className="text-sm text-muted-foreground">
                    {product.stockCount} units available
                  </span>
                )}
              </div>
            </div>

            {/* Pricing */}
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-primary">
                    ${product.discountPrice}
                  </span>
                  <span className="text-lg text-muted-foreground line-through">
                    ${product.originalPrice}
                  </span>
                  <Badge variant="destructive">Save ${(product.originalPrice - product.discountPrice).toFixed(2)}</Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-primary" />
                  <span className="text-sm">Or redeem with <strong>{product.pointsPrice.toLocaleString()} points</strong></span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Truck className="w-4 h-4" />
                  <span>Free shipping • Arrives in {product.shipping.estimatedDays}</span>
                </div>
              </div>
            </Card>

            {/* Color Selection */}
            <div>
              <h3 className="font-semibold mb-3">Color: {product.colors[selectedColor].name}</h3>
              <div className="flex gap-2">
                {product.colors.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedColor(index)}
                    disabled={!color.available}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      selectedColor === index 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-border'
                    } ${!color.available ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'}`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {!color.available && (
                      <div className="w-full h-full rounded-full bg-black/20 flex items-center justify-center">
                        <div className="w-6 h-0.5 bg-red-500 rotate-45"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <h3 className="font-semibold mb-3">Quantity</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="px-4 py-2 min-w-12 text-center">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={quantity >= product.stockCount}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">
                  Max: {product.stockCount} units
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button 
                  className="flex-1" 
                  size="lg"
                  onClick={handleBuyNow}
                  disabled={product.availability === 'out_of_stock'}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Buy Now
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={isFavorite ? 'text-red-500 border-red-500' : ''}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>
                <Button variant="outline" size="lg">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>

              <Button 
                variant="outline" 
                className="w-full" 
                size="lg"
                onClick={handleAddToCart}
                disabled={product.availability === 'out_of_stock'}
              >
                Add to Cart
              </Button>

              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" 
                size="lg"
                onClick={handleRedeemPoints}
              >
                <Gift className="w-4 h-4 mr-2" />
                Redeem with {product.pointsPrice.toLocaleString()} Points
              </Button>
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <p className="text-xs font-medium">Warranty</p>
                <p className="text-xs text-muted-foreground">2 Years</p>
              </div>
              <div className="text-center">
                <RotateCcw className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="text-xs font-medium">Returns</p>
                <p className="text-xs text-muted-foreground">30 Days</p>
              </div>
              <div className="text-center">
                <Truck className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                <p className="text-xs font-medium">Shipping</p>
                <p className="text-xs text-muted-foreground">Free</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Card className="mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({product.totalReviews})</TabsTrigger>
              <TabsTrigger value="qa">Q&A</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Key Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Perfect for Gaming</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <Gamepad2 className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <h4 className="font-medium mb-1">Competitive Gaming</h4>
                      <p className="text-sm text-muted-foreground">Precise audio positioning for competitive advantage</p>
                    </div>
                    <div className="text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <h4 className="font-medium mb-1">Team Communication</h4>
                      <p className="text-sm text-muted-foreground">Crystal clear microphone for team coordination</p>
                    </div>
                    <div className="text-center">
                      <Monitor className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <h4 className="font-medium mb-1">Streaming & Content</h4>
                      <p className="text-sm text-muted-foreground">Professional audio quality for content creation</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="specifications" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Technical Specifications</h3>
                  <div className="space-y-3">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-border/50">
                        <span className="font-medium text-sm">{key}</span>
                        <span className="text-sm text-muted-foreground text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">What's in the Box</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Rexus MX-7 Gaming Headset</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">USB Audio Adapter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">3.5mm Audio Cable</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">User Manual & Warranty Card</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">RGB Software Download</span>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Warranty & Support</h4>
                    <p className="text-sm text-muted-foreground mb-2">{product.warranty}</p>
                    <p className="text-sm text-muted-foreground">24/7 Customer Support Available</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Customer Reviews</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center">
                        {renderStars(product.rating)}
                      </div>
                      <span className="font-semibold">{product.rating}</span>
                      <span className="text-muted-foreground">based on {product.totalReviews} reviews</span>
                    </div>
                  </div>
                  <Button>Write a Review</Button>
                </div>

                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id} className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>{review.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{review.userName}</span>
                            {review.verified && (
                              <Badge variant="outline" className="text-xs">
                                <Check className="w-3 h-3 mr-1" />
                                Verified Purchase
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center">
                              {renderStars(review.rating)}
                            </div>
                            <span className="text-sm text-muted-foreground">{review.date}</span>
                          </div>
                          <h4 className="font-medium mb-1">{review.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{review.content}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <button className="text-muted-foreground hover:text-primary">
                              👍 Helpful ({review.helpful})
                            </button>
                            <button className="text-muted-foreground hover:text-primary">
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="qa" className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Questions & Answers</h3>
                  <Button>Ask a Question</Button>
                </div>
                
                <div className="space-y-4">
                  <Card className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium">Q: Is this compatible with PlayStation 5?</h4>
                        <p className="text-sm text-muted-foreground">Asked by GameFan123 on Aug 1, 2024</p>
                      </div>
                      <div className="pl-4 border-l-2 border-primary/20">
                        <p className="text-sm"><strong>A:</strong> Yes, the Rexus MX-7 is fully compatible with PlayStation 5 via both USB and 3.5mm connections. All features including 7.1 surround sound work perfectly.</p>
                        <p className="text-xs text-muted-foreground mt-1">Answered by Rexus Team on Aug 1, 2024</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium">Q: How long is the cable?</h4>
                        <p className="text-sm text-muted-foreground">Asked by TechUser on Jul 28, 2024</p>
                      </div>
                      <div className="pl-4 border-l-2 border-primary/20">
                        <p className="text-sm"><strong>A:</strong> The braided cable is 2.5 meters long, providing plenty of reach for most gaming setups.</p>
                        <p className="text-xs text-muted-foreground mt-1">Answered by Rexus Team on Jul 28, 2024</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Related Products */}
        <div>
          <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Card key={relatedProduct.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <div className="p-4">
                  <div className="aspect-square bg-muted rounded-lg mb-4 overflow-hidden">
                    <img
                      src={relatedProduct.image}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-semibold mb-2">{relatedProduct.name}</h3>
                  <div className="flex items-center gap-1 mb-2">
                    {renderStars(relatedProduct.rating)}
                    <span className="text-sm text-muted-foreground ml-1">({relatedProduct.rating})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">${relatedProduct.price}</span>
                    <span className="text-sm text-muted-foreground">{relatedProduct.pointsPrice} pts</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
