import React, { useState } from 'react';
import { Cart } from '@/services/cartService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tag, X, Check } from 'lucide-react';

interface CartSummaryProps {
  cart: Cart;
  onApplyCoupon: (couponCode: string) => Promise<void>;
  onRemoveCoupon: () => Promise<void>;
  isUpdating: boolean;
  formatPrice: (price: number) => string;
  className?: string;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  cart,
  onApplyCoupon,
  onRemoveCoupon,
  isUpdating,
  formatPrice,
  className = '',
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      setIsApplyingCoupon(true);
      await onApplyCoupon(couponCode.trim());
      setCouponCode('');
    } catch (error) {
      console.error('Failed to apply coupon:', error);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      setIsApplyingCoupon(true);
      await onRemoveCoupon();
    } catch (error) {
      console.error('Failed to remove coupon:', error);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyCoupon();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Coupon Section */}
      <div className="space-y-3">
        {cart.couponCode ? (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Coupon Applied
              </span>
              <Badge variant="secondary" className="text-xs">
                {cart.couponCode}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveCoupon}
              disabled={isUpdating || isApplyingCoupon}
              className="text-green-600 hover:text-green-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Coupon Code
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isUpdating || isApplyingCoupon}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={handleApplyCoupon}
                disabled={!couponCode.trim() || isUpdating || isApplyingCoupon}
                size="sm"
              >
                {isApplyingCoupon ? 'Applying...' : 'Apply'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Order Summary */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900">Order Summary</h3>
        
        <div className="space-y-2 text-sm">
          {/* Subtotal */}
          <div className="flex justify-between">
            <span className="text-gray-600">
              Subtotal ({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'})
            </span>
            <span className="text-gray-900">
              {formatPrice(cart.subtotal)}
            </span>
          </div>

          {/* Discount */}
          {cart.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-{formatPrice(cart.discount)}</span>
            </div>
          )}

          {/* Shipping */}
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping</span>
            <span className="text-gray-900">
              {cart.shipping === 0 ? 'Free' : formatPrice(cart.shipping)}
            </span>
          </div>

          {/* Tax */}
          {cart.tax > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span className="text-gray-900">
                {formatPrice(cart.tax)}
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-base font-medium text-gray-900">Total</span>
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(cart.total)}
          </span>
        </div>

        {/* Savings */}
        {cart.discount > 0 && (
          <div className="text-center">
            <span className="text-sm text-green-600 font-medium">
              You saved {formatPrice(cart.discount)}!
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartSummary;