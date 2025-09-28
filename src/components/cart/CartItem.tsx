import React from 'react';
import { CartItem as CartItemType } from '@/services/cartService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  isUpdating: boolean;
  formatPrice: (price: number) => string;
  className?: string;
  maxQuantity?: number; // Optional prop for stock limit
}

const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  isUpdating,
  formatPrice,
  className = '',
  maxQuantity = 99, // Default max quantity
}) => {
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 0) return;
    if (newQuantity > maxQuantity) return;
    onUpdateQuantity(newQuantity);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    handleQuantityChange(value);
  };

  const isOutOfStock = item.quantity > maxQuantity;
  const hasDiscount = item.product.comparePrice && item.product.comparePrice > item.price;
  const productImage = item.product.images?.[0]?.url || '/placeholder-product.jpg';

  return (
    <div className={cn(
      'flex gap-4 p-4 bg-white border border-gray-200 rounded-lg',
      isUpdating && 'opacity-50 pointer-events-none',
      isOutOfStock && 'border-red-200 bg-red-50',
      className
    )}>
      {/* Product Image */}
      <div className="flex-shrink-0">
        <img
          src={productImage}
          alt={item.product.name}
          className="w-16 h-16 object-cover rounded-md border border-gray-200"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-product.jpg';
          }}
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {item.product.name}
            </h3>
            {item.variantTitle && (
              <p className="text-xs text-gray-500 mt-1">
                {item.variantTitle}
              </p>
            )}
            {item.sku && (
              <p className="text-xs text-gray-400 mt-1">
                SKU: {item.sku}
              </p>
            )}
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={isUpdating}
            className="ml-2 text-gray-400 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-gray-900">
            {formatPrice(item.price)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-xs text-gray-500 line-through">
                {formatPrice(item.product.comparePrice!)}
              </span>
              <Badge variant="destructive" className="text-xs">
                {Math.round(((item.product.comparePrice! - item.price) / item.product.comparePrice!) * 100)}% OFF
              </Badge>
            </>
          )}
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={isUpdating || item.quantity <= 1}
              className="h-8 w-8 p-0"
            >
              <Minus className="w-3 h-3" />
            </Button>

            <Input
              type="number"
              value={item.quantity}
              onChange={handleInputChange}
              disabled={isUpdating}
              min="1"
              max={maxQuantity}
              className="h-8 w-16 text-center text-sm"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={isUpdating || item.quantity >= maxQuantity}
              className="h-8 w-8 p-0"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {/* Subtotal */}
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {formatPrice(item.total)}
            </p>
            {item.quantity > 1 && (
              <p className="text-xs text-gray-500">
                {item.quantity} × {formatPrice(item.price)}
              </p>
            )}
          </div>
        </div>

        {/* Stock Warning */}
        {isOutOfStock && (
          <div className="flex items-center gap-1 mt-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">
              Only {maxQuantity} available in stock
            </span>
          </div>
        )}

        {/* Low Stock Warning */}
        {!isOutOfStock && maxQuantity <= 5 && maxQuantity > 0 && (
          <div className="flex items-center gap-1 mt-2 text-amber-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">
              Only {maxQuantity} left in stock
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartItem;