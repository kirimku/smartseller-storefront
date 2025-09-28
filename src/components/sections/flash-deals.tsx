import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import gamingMouse from "@/assets/gaming-mouse.jpg";
import gamingKeyboard from "@/assets/gaming-keyboard.jpg";
import gamingHeadset from "@/assets/gaming-headset.jpg";
import flashBanner from "@/assets/flash-gaming-sale-banner-design-shopping-cover-with-flash-icon-gamepad_185386-2024.jpg";
import { ShoppingCart, Star, ChevronLeft, ChevronRight, Clock, Zap } from "lucide-react";
import { useRef, useState, useEffect } from "react";

const flashDeals = [
  {
    id: 1,
    name: "Lightning Mouse Pro",
    image: gamingMouse,
    originalPrice: "$129.99",
    flashPrice: "$79.99",
    pointsPrice: "3,900",
    discount: "40% OFF",
    rating: 4.9,
    stock: 12,
    sold: 88,
  },
  {
    id: 2,
    name: "Thunder Keyboard RGB",
    image: gamingKeyboard,
    originalPrice: "$199.99",
    flashPrice: "$119.99",
    pointsPrice: "5,900",
    discount: "40% OFF",
    rating: 4.8,
    stock: 8,
    sold: 92,
  },
  {
    id: 3,
    name: "Storm Headset Elite",
    image: gamingHeadset,
    originalPrice: "$249.99",
    flashPrice: "$149.99",
    pointsPrice: "7,400",
    discount: "40% OFF",
    rating: 4.7,
    stock: 15,
    sold: 85,
  },
  {
    id: 4,
    name: "Quick Mousepad XL",
    image: gamingMouse,
    originalPrice: "$49.99",
    flashPrice: "$29.99",
    pointsPrice: "1,400",
    discount: "40% OFF",
    rating: 4.6,
    stock: 25,
    sold: 75,
  },
  {
    id: 5,
    name: "Speed Gaming Chair",
    image: gamingKeyboard,
    originalPrice: "$599.99",
    flashPrice: "$359.99",
    pointsPrice: "17,900",
    discount: "40% OFF",
    rating: 4.5,
    stock: 5,
    sold: 95,
  },
];

export const FlashDeals = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Calculate time left until end of day (flash deals end at midnight)
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      const diff = endOfDay.getTime() - now.getTime();
      
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const formatTime = (time: number) => {
    return time.toString().padStart(2, '0');
  };

  return (
    <div className="px-6 mt-6">
      {/* Header with Banner Background */}
      <div 
        className="relative rounded-xl overflow-hidden p-6 mb-4 min-h-[160px] flex items-center"
        style={{
          backgroundImage: `url(${flashBanner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-purple-900/80 to-blue-800/90"></div>
        
        {/* Content */}
        <div className="relative z-10 w-full">
          <div className="flex items-center justify-between">
            {/* Left side - Title and subtitle */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-cyan-400/20 rounded-lg backdrop-blur-sm">
                  <Zap className="h-6 w-6 text-cyan-300" />
                </div>
                <div>
                  <p className="text-cyan-200 text-sm font-medium tracking-wide">LIMITED TIME ONLY</p>
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    FLASH SALE
                  </h2>
                </div>
              </div>
              <p className="text-cyan-100 text-sm font-medium mb-4">UP TO 70% OFF</p>
              
              {/* Countdown Timer */}
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-cyan-200" />
                <span className="text-sm font-medium text-cyan-200">Ends in:</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="bg-white/15 backdrop-blur-md rounded-lg px-3 py-2 min-w-[50px] text-center border border-white/20">
                  <div className="text-xl font-bold text-white">{formatTime(timeLeft.hours)}</div>
                  <div className="text-xs text-cyan-200">Hours</div>
                </div>
                <span className="text-white text-xl font-bold">:</span>
                <div className="bg-white/15 backdrop-blur-md rounded-lg px-3 py-2 min-w-[50px] text-center border border-white/20">
                  <div className="text-xl font-bold text-white">{formatTime(timeLeft.minutes)}</div>
                  <div className="text-xs text-cyan-200">Mins</div>
                </div>
                <span className="text-white text-xl font-bold">:</span>
                <div className="bg-white/15 backdrop-blur-md rounded-lg px-3 py-2 min-w-[50px] text-center border border-white/20">
                  <div className="text-xl font-bold text-white">{formatTime(timeLeft.seconds)}</div>
                  <div className="text-xs text-cyan-200">Secs</div>
                </div>
              </div>
            </div>

            {/* Right side - Call to action */}
            <div className="hidden md:flex flex-col items-end">
              <Button 
                size="lg" 
                className="bg-cyan-400 hover:bg-cyan-300 text-blue-900 font-bold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                SHOP NOW
              </Button>
            </div>
          </div>

          {/* Mobile CTA */}
          <div className="md:hidden mt-4">
            <Button 
              size="sm" 
              className="bg-cyan-400 hover:bg-cyan-300 text-blue-900 font-bold px-6 py-2 rounded-full w-full"
            >
              SHOP NOW
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Limited time offers</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={scrollLeft}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={scrollRight}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Products Carousel */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {flashDeals.map((product) => (
          <Card key={product.id} className="shadow-card flex-shrink-0 w-48 border-blue-200 hover:border-blue-300 transition-colors">
            <div className="p-4">
              <div className="space-y-3">
                {/* Product Image with Flash Badge */}
                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 right-2 text-xs bg-blue-600 text-white border-blue-700"
                  >
                    {product.discount}
                  </Badge>
                  <div className="absolute top-2 left-2">
                    <Zap className="h-4 w-4 text-cyan-400 fill-cyan-400" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm leading-tight">{product.name}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-primary fill-current" />
                    <span className="text-xs text-muted-foreground">{product.rating}</span>
                  </div>
                  
                  {/* Pricing */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground line-through">{product.originalPrice}</p>
                      <p className="text-xs font-semibold text-blue-600">{product.flashPrice}</p>
                    </div>
                    <p className="text-sm font-bold text-primary">{product.pointsPrice} pts</p>
                  </div>

                  {/* Stock Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Sold: {product.sold}%</span>
                      <span className="text-muted-foreground">{product.stock} left</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-cyan-400 h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: `${product.sold}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <ShoppingCart className="w-3 h-3 mr-2" />
                    Flash Buy
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
