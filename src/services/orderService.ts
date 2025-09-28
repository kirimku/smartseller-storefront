/**
 * Order Service - Handles order management and order history
 */

import { apiClient, ApiResponse, handleApiError } from '@/lib/api';
import { Product } from './productService';
import { CustomerAddress } from './customerService';

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  customer: OrderCustomer;
  shippingAddress: CustomerAddress;
  billingAddress: CustomerAddress;
  paymentMethod: PaymentMethod;
  shippingMethod: ShippingMethod;
  tracking?: TrackingInfo;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
}

export interface OrderItem {
  id: string;
  product: Product;
  variantId?: string;
  variantTitle?: string;
  quantity: number;
  price: number;
  total: number;
  sku?: string;
}

export interface OrderCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'cash_on_delivery';
  provider: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: number;
  carrier: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  trackingUrl?: string;
  status: TrackingStatus;
  events: TrackingEvent[];
}

export interface TrackingEvent {
  status: TrackingStatus;
  description: string;
  location?: string;
  timestamp: string;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type TrackingStatus = 
  | 'label_created'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'exception'
  | 'returned';

// Order Creation Types
export interface CreateOrderRequest {
  items: CreateOrderItem[];
  shippingAddress: Omit<CustomerAddress, 'id'>;
  billingAddress: Omit<CustomerAddress, 'id'>;
  shippingMethodId: string;
  paymentMethodId: string;
  notes?: string;
  couponCode?: string;
}

export interface CreateOrderItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

// Order List Types
export interface OrderListParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface OrderListResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Order Summary Types
export interface OrderSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
}

export class OrderService {
  /**
   * Create a new order
   */
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    try {
      const response = await apiClient.post<Order>('/api/orders', orderData, {
        requiresAuth: true,
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to create order');
    } catch (error) {
      console.error('Failed to create order:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get customer orders
   */
  async getOrders(params: OrderListParams = {}): Promise<OrderListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.search) queryParams.append('search', params.search);

      const endpoint = `/api/orders?${queryParams.toString()}`;
      const response = await apiClient.get<OrderListResponse>(endpoint, {
        requiresAuth: true,
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error('Failed to fetch orders');
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<Order> {
    try {
      const response = await apiClient.get<Order>(`/api/orders/${orderId}`, {
        requiresAuth: true,
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error('Order not found');
    } catch (error) {
      console.error('Failed to fetch order:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string): Promise<Order> {
    try {
      const response = await apiClient.get<Order>(`/api/orders/number/${orderNumber}`, {
        requiresAuth: true,
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error('Order not found');
    } catch (error) {
      console.error('Failed to fetch order:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    try {
      const response = await apiClient.post<Order>(
        `/api/orders/${orderId}/cancel`,
        { reason },
        { requiresAuth: true }
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to cancel order');
    } catch (error) {
      console.error('Failed to cancel order:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Request order refund
   */
  async requestRefund(orderId: string, items: string[], reason: string): Promise<void> {
    try {
      const response = await apiClient.post(
        `/api/orders/${orderId}/refund`,
        { items, reason },
        { requiresAuth: true }
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to request refund');
      }
    } catch (error) {
      console.error('Failed to request refund:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Track order
   */
  async trackOrder(orderId: string): Promise<TrackingInfo> {
    try {
      const response = await apiClient.get<TrackingInfo>(`/api/orders/${orderId}/tracking`, {
        requiresAuth: true,
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error('Tracking information not available');
    } catch (error) {
      console.error('Failed to fetch tracking info:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get available shipping methods
   */
  async getShippingMethods(address: Partial<CustomerAddress>): Promise<ShippingMethod[]> {
    try {
      const response = await apiClient.post<ShippingMethod[]>('/api/shipping/methods', address);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch shipping methods:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Calculate order summary
   */
  async calculateOrderSummary(
    items: CreateOrderItem[],
    shippingMethodId?: string,
    couponCode?: string,
    shippingAddress?: Partial<CustomerAddress>
  ): Promise<OrderSummary> {
    try {
      const response = await apiClient.post<OrderSummary>('/api/orders/calculate', {
        items,
        shippingMethodId,
        couponCode,
        shippingAddress,
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error('Failed to calculate order summary');
    } catch (error) {
      console.error('Failed to calculate order summary:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Validate coupon code
   */
  async validateCoupon(couponCode: string, items: CreateOrderItem[]): Promise<{
    valid: boolean;
    discount: number;
    discountType: 'percentage' | 'fixed';
    message?: string;
  }> {
    try {
      const response = await apiClient.post<{
        valid: boolean;
        discount: number;
        discountType: 'percentage' | 'fixed';
        message?: string;
      }>('/api/coupons/validate', {
        code: couponCode,
        items,
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return {
        valid: false,
        discount: 0,
        discountType: 'fixed',
        message: 'Invalid coupon code',
      };
    } catch (error) {
      console.error('Failed to validate coupon:', error);
      return {
        valid: false,
        discount: 0,
        discountType: 'fixed',
        message: 'Failed to validate coupon',
      };
    }
  }

  /**
   * Reorder items from previous order
   */
  async reorder(orderId: string): Promise<{
    availableItems: CreateOrderItem[];
    unavailableItems: OrderItem[];
  }> {
    try {
      const response = await apiClient.post<{
        availableItems: CreateOrderItem[];
        unavailableItems: OrderItem[];
      }>(`/api/orders/${orderId}/reorder`, {}, {
        requiresAuth: true,
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error('Failed to prepare reorder');
    } catch (error) {
      console.error('Failed to prepare reorder:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStats(): Promise<{
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    statusBreakdown: Record<OrderStatus, number>;
  }> {
    try {
      const response = await apiClient.get<{
        totalOrders: number;
        totalSpent: number;
        averageOrderValue: number;
        statusBreakdown: Record<OrderStatus, number>;
      }>('/api/orders/stats', {
        requiresAuth: true,
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error('Failed to fetch order statistics');
    } catch (error) {
      console.error('Failed to fetch order statistics:', error);
      throw handleApiError(error);
    }
  }
}

// Create singleton instance
export const orderService = new OrderService();