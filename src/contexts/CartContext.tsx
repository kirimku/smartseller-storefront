import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Cart, CartItem, cartService, AddToCartRequest } from '@/services/cartService';
import { useTenant } from './TenantContext';

// Cart Context Types
interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  isUpdating: boolean;
}

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CART'; payload: Cart }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_UPDATING'; payload: boolean }
  | { type: 'CLEAR_CART' };

interface CartContextType extends CartState {
  // Cart actions
  addToCart: (item: AddToCartRequest) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (couponCode: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  refreshCart: () => Promise<void>;
  
  // Utility functions
  getItemCount: () => number;
  getCartTotal: () => number;
  isItemInCart: (productId: string, variantId?: string) => boolean;
  getCartItem: (productId: string, variantId?: string) => CartItem | undefined;
}

// Initial state
const initialState: CartState = {
  cart: null,
  isLoading: true,
  error: null,
  isUpdating: false,
};

// Reducer
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_CART':
      return { ...state, cart: action.payload, isLoading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_UPDATING':
      return { ...state, isUpdating: action.payload };
    case 'CLEAR_CART':
      return { ...state, cart: null };
    default:
      return state;
  }
};

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component
interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { tenant } = useTenant();

  // Load cart on mount and tenant change
  useEffect(() => {
    if (tenant) {
      loadCart();
    }
  }, [tenant]);

  // Auto-save cart to localStorage when cart changes
  useEffect(() => {
    if (state.cart) {
      try {
        localStorage.setItem('cart_backup', JSON.stringify(state.cart));
      } catch (error) {
        console.warn('Failed to save cart to localStorage:', error);
      }
    }
  }, [state.cart]);

  const loadCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const cart = await cartService.getCart();
      dispatch({ type: 'SET_CART', payload: cart });
    } catch (error) {
      console.error('Failed to load cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load cart' });
      
      // Try to restore from localStorage as fallback
      try {
        const backupCart = localStorage.getItem('cart_backup');
        if (backupCart) {
          const parsedCart = JSON.parse(backupCart);
          dispatch({ type: 'SET_CART', payload: parsedCart });
        }
      } catch (backupError) {
        console.warn('Failed to restore cart from backup:', backupError);
      }
    }
  };

  const addToCart = async (item: AddToCartRequest) => {
    try {
      dispatch({ type: 'SET_UPDATING', payload: true });
      const updatedCart = await cartService.addToCart(item);
      dispatch({ type: 'SET_CART', payload: updatedCart });
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add item to cart' });
      throw error;
    } finally {
      dispatch({ type: 'SET_UPDATING', payload: false });
    }
  };

  const updateCartItem = async (itemId: string, quantity: number) => {
    try {
      dispatch({ type: 'SET_UPDATING', payload: true });
      
      if (quantity === 0) {
        await removeFromCart(itemId);
        return;
      }
      
      const updatedCart = await cartService.updateCartItem(itemId, { quantity });
      dispatch({ type: 'SET_CART', payload: updatedCart });
    } catch (error) {
      console.error('Failed to update cart item:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update cart item' });
      throw error;
    } finally {
      dispatch({ type: 'SET_UPDATING', payload: false });
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      dispatch({ type: 'SET_UPDATING', payload: true });
      const updatedCart = await cartService.removeFromCart(itemId);
      dispatch({ type: 'SET_CART', payload: updatedCart });
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove item from cart' });
      throw error;
    } finally {
      dispatch({ type: 'SET_UPDATING', payload: false });
    }
  };

  const clearCart = async () => {
    try {
      dispatch({ type: 'SET_UPDATING', payload: true });
      const updatedCart = await cartService.clearCart();
      dispatch({ type: 'SET_CART', payload: updatedCart });
      
      // Clear localStorage backup
      localStorage.removeItem('cart_backup');
    } catch (error) {
      console.error('Failed to clear cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear cart' });
      throw error;
    } finally {
      dispatch({ type: 'SET_UPDATING', payload: false });
    }
  };

  const applyCoupon = async (couponCode: string) => {
    try {
      dispatch({ type: 'SET_UPDATING', payload: true });
      const updatedCart = await cartService.applyCoupon({ couponCode });
      dispatch({ type: 'SET_CART', payload: updatedCart });
    } catch (error) {
      console.error('Failed to apply coupon:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to apply coupon' });
      throw error;
    } finally {
      dispatch({ type: 'SET_UPDATING', payload: false });
    }
  };

  const removeCoupon = async () => {
    try {
      dispatch({ type: 'SET_UPDATING', payload: true });
      const updatedCart = await cartService.removeCoupon();
      dispatch({ type: 'SET_CART', payload: updatedCart });
    } catch (error) {
      console.error('Failed to remove coupon:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove coupon' });
      throw error;
    } finally {
      dispatch({ type: 'SET_UPDATING', payload: false });
    }
  };

  const refreshCart = async () => {
    await loadCart();
  };

  // Utility functions
  const getItemCount = (): number => {
    return state.cart?.itemCount || 0;
  };

  const getCartTotal = (): number => {
    return state.cart?.total || 0;
  };

  const isItemInCart = (productId: string, variantId?: string): boolean => {
    if (!state.cart) return false;
    
    return state.cart.items.some(item => 
      item.product.id === productId && 
      (!variantId || item.variantId === variantId)
    );
  };

  const getCartItem = (productId: string, variantId?: string): CartItem | undefined => {
    if (!state.cart) return undefined;
    
    return state.cart.items.find(item => 
      item.product.id === productId && 
      (!variantId || item.variantId === variantId)
    );
  };

  const contextValue: CartContextType = {
    ...state,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    refreshCart,
    getItemCount,
    getCartTotal,
    isItemInCart,
    getCartItem,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Hook to use cart context
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;