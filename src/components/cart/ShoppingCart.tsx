import React, { useState, useEffect } from 'react';
import { Cart, CartItem, cartService } from '@/services/cartService';
import { useTenant } from '@/contexts/TenantContext';
import CartItemComponent from './CartItem';
import CartSummary from './CartSummary';
import QuickCheckout from './QuickCheckout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, X } from 'lucide-react';

interface ShoppingCartProps {
  isOpen?: boolean;
  onClose?: () => void;
  trigger?: React.ReactNode;
  showQuickCheckout?: boolean;
  className?: string;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({
  isOpen,
  onClose,
  trigger,
  showQuickCheckout = true,
  className = '',
}) => {
  const { tenant } = useTenant();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    loadCart();
  }, [tenant]);

  const loadCart = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const cartData = await cartService.getCart();
      setCart(cartData);
    } catch (err) {
      console.error('Failed to load cart:', err);
      setError('Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    if (!cart) return;

    try {
      setIsUpdating(true);
      if (quantity === 0) {
        await cartService.removeFromCart(itemId);
      } else {
        await cartService.updateCartItem(itemId, { quantity });
      }
      await loadCart();
    } catch (err) {
      console.error('Failed to update cart item:', err);
      setError('Failed to update cart item');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      setIsUpdating(true);
      await cartService.removeFromCart(itemId);
      await loadCart();
    } catch (err) {
      console.error('Failed to remove cart item:', err);
      setError('Failed to remove cart item');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearCart = async () => {
    try {
      setIsUpdating(true);
      await cartService.clearCart();
      await loadCart();
    } catch (err) {
      console.error('Failed to clear cart:', err);
      setError('Failed to clear cart');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApplyCoupon = async (couponCode: string) => {
    try {
      setIsUpdating(true);
      await cartService.applyCoupon({ couponCode });
      await loadCart();
    } catch (err) {
      console.error('Failed to apply coupon:', err);
      setError('Failed to apply coupon');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      setIsUpdating(true);
      await cartService.removeCoupon();
      await loadCart();
    } catch (err) {
      console.error('Failed to remove coupon:', err);
      setError('Failed to remove coupon');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cart?.currency || 'USD',
    }).format(price);
  };

  const CartContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      );
    }

    if (error) {
      return (
        <ErrorMessage
          message={error}
          onRetry={loadCart}
          className="m-4"
        />
      );
    }

    if (!cart || cart.items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-500 mb-4">Add some products to get started</p>
          {onClose && (
            <Button onClick={onClose} variant="outline">
              Continue Shopping
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {cart.items.map((item) => (
              <CartItemComponent
                key={item.id}
                item={item}
                onUpdateQuantity={(quantity) => handleUpdateQuantity(item.id, quantity)}
                onRemove={() => handleRemoveItem(item.id)}
                isUpdating={isUpdating}
                formatPrice={formatPrice}
              />
            ))}
          </div>
        </div>

        {/* Cart Summary */}
        <div className="border-t border-gray-200 p-4">
          <CartSummary
            cart={cart}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={handleRemoveCoupon}
            isUpdating={isUpdating}
            formatPrice={formatPrice}
          />

          {/* Action Buttons */}
          <div className="mt-4 space-y-2">
            {showQuickCheckout && (
              <Button
                onClick={() => setShowCheckout(true)}
                className="w-full"
                disabled={isUpdating}
              >
                Quick Checkout
              </Button>
            )}
            
            <Button
              variant="outline"
              className="w-full"
              disabled={isUpdating}
              onClick={() => {
                // Navigate to full checkout page
                window.location.href = '/checkout';
              }}
            >
              Go to Checkout
            </Button>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCart}
                disabled={isUpdating}
                className="flex-1"
              >
                Clear Cart
              </Button>
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="flex-1"
                >
                  Continue Shopping
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Checkout Modal */}
        {showQuickCheckout && showCheckout && (
          <QuickCheckout
            cart={cart}
            isOpen={showCheckout}
            onClose={() => setShowCheckout(false)}
            onSuccess={() => {
              setShowCheckout(false);
              loadCart();
            }}
          />
        )}
      </div>
    );
  };

  // If used as a standalone component (not in a sheet)
  if (!trigger) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Shopping Cart</h2>
            {cart && cart.itemCount > 0 && (
              <Badge variant="secondary">
                {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}
              </Badge>
            )}
          </div>
        </div>
        <CartContent />
      </div>
    );
  }

  // Used with a trigger (sheet/modal)
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon" className="relative">
            <ShoppingBag className="w-4 h-4" />
            {cart && cart.itemCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {cart.itemCount}
              </Badge>
            )}
          </Button>
        )}
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Shopping Cart</span>
            {cart && cart.itemCount > 0 && (
              <Badge variant="secondary">
                {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-4 h-full">
          <CartContent />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ShoppingCart;