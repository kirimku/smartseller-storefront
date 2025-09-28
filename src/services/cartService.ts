/**
 * Cart Service - Handles shopping cart management with persistence
 */

import { apiClient, ApiResponse, handleApiError } from '@/lib/api';
import { Product } from './productService';

// Cart Types
export interface CartItem {
  id: string;
  product: Product;
  variantId?: string;
  variantTitle?: string;
  quantity: number;
  price: number;
  total: number;
  sku?: string;
  addedAt: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface AddToCartRequest {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface ApplyCouponRequest {
  couponCode: string;
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
}

export class CartService {
  private cartId: string | null = null;

  constructor() {
    this.initializeCart();
  }

  /**
   * Initialize cart from local storage
   */
  private initializeCart(): void {
    this.cartId = localStorage.getItem('cart_id');
  }

  /**
   * Get current cart
   */
  async getCart(): Promise<Cart> {
    try {
      let endpoint = '/api/cart';
      
      // If we have a cart ID, use it
      if (this.cartId) {
        endpoint = `/api/cart/${this.cartId}`;
      }

      const response = await apiClient.get<Cart>(endpoint);
      
      if (response.success && response.data) {
        this.cartId = response.data.id;
        this.storeCartId(response.data.id);
        return response.data;
      }
      
      // Create new cart if none exists
      return this.createCart();
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      // Return empty cart on error
      return this.createEmptyCart();
    }
  }

  /**
   * Create new cart
   */
  async createCart(): Promise<Cart> {
    try {
      const response = await apiClient.post<Cart>('/api/cart', {});
      
      if (response.success && response.data) {
        this.cartId = response.data.id;
        this.storeCartId(response.data.id);
        return response.data;
      }
      
      throw new Error('Failed to create cart');
    } catch (error) {
      console.error('Failed to create cart:', error);
      return this.createEmptyCart();
    }
  }

  /**
   * Add item to cart
   */
  async addToCart(item: AddToCartRequest): Promise<Cart> {
    try {
      // Ensure we have a cart
      if (!this.cartId) {
        await this.getCart();
      }

      const response = await apiClient.post<Cart>(`/api/cart/${this.cartId}/items`, item);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to add item to cart');
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(itemId: string, update: UpdateCartItemRequest): Promise<Cart> {
    try {
      if (!this.cartId) {
        throw new Error('No cart available');
      }

      const response = await apiClient.put<Cart>(
        `/api/cart/${this.cartId}/items/${itemId}`,
        update
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to update cart item');
    } catch (error) {
      console.error('Failed to update cart item:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(itemId: string): Promise<Cart> {
    try {
      if (!this.cartId) {
        throw new Error('No cart available');
      }

      const response = await apiClient.delete<Cart>(`/api/cart/${this.cartId}/items/${itemId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to remove item from cart');
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Clear cart
   */
  async clearCart(): Promise<Cart> {
    try {
      if (!this.cartId) {
        return this.createEmptyCart();
      }

      const response = await apiClient.delete<Cart>(`/api/cart/${this.cartId}/items`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error('Failed to clear cart');
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Apply coupon to cart
   */
  async applyCoupon(coupon: ApplyCouponRequest): Promise<Cart> {
    try {
      if (!this.cartId) {
        throw new Error('No cart available');
      }

      const response = await apiClient.post<Cart>(`/api/cart/${this.cartId}/coupon`, coupon);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to apply coupon');
    } catch (error) {
      console.error('Failed to apply coupon:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Remove coupon from cart
   */
  async removeCoupon(): Promise<Cart> {
    try {
      if (!this.cartId) {
        throw new Error('No cart available');
      }

      const response = await apiClient.delete<Cart>(`/api/cart/${this.cartId}/coupon`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error('Failed to remove coupon');
    } catch (error) {
      console.error('Failed to remove coupon:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get cart summary
   */
  async getCartSummary(): Promise<CartSummary> {
    try {
      const cart = await this.getCart();
      
      return {
        itemCount: cart.itemCount,
        subtotal: cart.subtotal,
        tax: cart.tax,
        shipping: cart.shipping,
        discount: cart.discount,
        total: cart.total,
        currency: cart.currency,
      };
    } catch (error) {
      console.error('Failed to get cart summary:', error);
      return {
        itemCount: 0,
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0,
        currency: 'USD',
      };
    }
  }

  /**
   * Merge guest cart with user cart after login
   */
  async mergeCart(guestCartId: string): Promise<Cart> {
    try {
      const response = await apiClient.post<Cart>('/api/cart/merge', {
        guestCartId,
      }, {
        requiresAuth: true,
      });
      
      if (response.success && response.data) {
        this.cartId = response.data.id;
        this.storeCartId(response.data.id);
        return response.data;
      }
      
      throw new Error('Failed to merge cart');
    } catch (error) {
      console.error('Failed to merge cart:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Validate cart items (check availability, prices)
   */
  async validateCart(): Promise<{
    valid: boolean;
    issues: Array<{
      itemId: string;
      type: 'unavailable' | 'price_changed' | 'quantity_limited';
      message: string;
      currentPrice?: number;
      maxQuantity?: number;
    }>;
  }> {
    try {
      if (!this.cartId) {
        return { valid: true, issues: [] };
      }

      const response = await apiClient.post<{
        valid: boolean;
        issues: Array<{
          itemId: string;
          type: 'unavailable' | 'price_changed' | 'quantity_limited';
          message: string;
          currentPrice?: number;
          maxQuantity?: number;
        }>;
      }>(`/api/cart/${this.cartId}/validate`, {});
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return { valid: true, issues: [] };
    } catch (error) {
      console.error('Failed to validate cart:', error);
      return { valid: false, issues: [] };
    }
  }

  /**
   * Get recommended products based on cart items
   */
  async getRecommendations(): Promise<Product[]> {
    try {
      if (!this.cartId) {
        return [];
      }

      const response = await apiClient.get<Product[]>(`/api/cart/${this.cartId}/recommendations`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return [];
    }
  }

  /**
   * Calculate shipping for cart
   */
  async calculateShipping(address: {
    country: string;
    state: string;
    city: string;
    postalCode: string;
  }): Promise<Array<{
    id: string;
    name: string;
    price: number;
    estimatedDays: number;
  }>> {
    try {
      if (!this.cartId) {
        return [];
      }

      const response = await apiClient.post<Array<{
        id: string;
        name: string;
        price: number;
        estimatedDays: number;
      }>>(`/api/cart/${this.cartId}/shipping`, address);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to calculate shipping:', error);
      return [];
    }
  }

  // Local storage helpers
  private storeCartId(cartId: string): void {
    localStorage.setItem('cart_id', cartId);
  }

  private createEmptyCart(): Cart {
    return {
      id: '',
      items: [],
      itemCount: 0,
      subtotal: 0,
      tax: 0,
      shipping: 0,
      discount: 0,
      total: 0,
      currency: 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get current cart ID
   */
  getCartId(): string | null {
    return this.cartId;
  }

  /**
   * Clear stored cart data
   */
  clearStoredCart(): void {
    this.cartId = null;
    localStorage.removeItem('cart_id');
  }
}

// Create singleton instance
export const cartService = new CartService();