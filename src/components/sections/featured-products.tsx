import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import gamingMouse from "@/assets/gaming-mouse.jpg";
import gamingKeyboard from "@/assets/gaming-keyboard.jpg";
import gamingHeadset from "@/assets/gaming-headset.jpg";
import { ShoppingCart, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";

const products = [
  {
    id: 1,
    name: "ProGamer X1 Mouse",
    image: gamingMouse,
    originalPrice: "$89.99",
    pointsPrice: "4,500",
    discount: "15% OFF",
    rating: 4.8,
  },
  {
    id: 2,
    name: "MechWarrior Keyboard",
    image: gamingKeyboard,
    originalPrice: "$149.99",
    pointsPrice: "7,200",
    discount: "20% OFF",
    rating: 4.9,
  },
  {
    id: 3,
    name: "SoundStorm Headset",
    image: gamingHeadset,
    originalPrice: "$199.99",
    pointsPrice: "9,800",
    discount: "25% OFF",
    rating: 4.7,
  },
  {
    id: 4,
    name: "Gaming Mousepad",
    image: gamingMouse,
    originalPrice: "$29.99",
    pointsPrice: "1,500",
    discount: "30% OFF",
    rating: 4.6,
  },
  {
    id: 5,
    name: "RGB Gaming Chair",
    image: gamingKeyboard,
    originalPrice: "$399.99",
    pointsPrice: "19,800",
    discount: "10% OFF",
    rating: 4.5,
  },
];

export const FeaturedProducts = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  return (
    <div className="px-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Featured Products</h2>
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
          <Button variant="ghost" size="sm" className="text-primary ml-2">
            View All
          </Button>
        </div>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <Card 
            key={product.id} 
            className="shadow-card flex-shrink-0 w-48 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/product/${product.id}`)}
          >
            <div className="p-4">
              <div className="space-y-3">
                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 right-2 text-xs bg-primary/10 text-primary border-primary/20"
                  >
                    {product.discount}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm leading-tight">{product.name}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-primary fill-current" />
                    <span className="text-xs text-muted-foreground">{product.rating}</span>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground line-through">{product.originalPrice}</p>
                    <p className="text-sm font-bold text-primary">{product.pointsPrice} pts</p>
                  </div>
                  
                  <Button size="sm" className="w-full">
                    <ShoppingCart className="w-3 h-3 mr-2" />
                    Redeem
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