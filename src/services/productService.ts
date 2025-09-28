/**
 * Product Service - Handles product catalog and inventory management
 */

import { apiClient, ApiResponse, handleApiError } from '@/lib/api';

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  sku: string;
  price: number;
  comparePrice?: number;
  currency: string;
  images: ProductImage[];
  category: ProductCategory;
  tags: string[];
  variants: ProductVariant[];
  inventory: ProductInventory;
  seo: ProductSEO;
  status: 'active' | 'draft' | 'archived';
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  position: number;
  isMain: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  comparePrice?: number;
  inventory: number;
  options: Record<string, string>; // e.g., { color: 'red', size: 'M' }
  image?: string;
}

export interface ProductInventory {
  quantity: number;
  trackQuantity: boolean;
  allowBackorder: boolean;
  lowStockThreshold?: number;
}

export interface ProductSEO {
  title?: string;
  description?: string;
  keywords?: string[];
}

// Filter and Search Types
export interface ProductFilters {
  category?: string;
  tags?: string[];
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  featured?: boolean;
  search?: string;
}

export interface ProductSortOptions {
  field: 'name' | 'price' | 'createdAt' | 'updatedAt' | 'popularity';
  direction: 'asc' | 'desc';
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  filters?: ProductFilters;
  sort?: ProductSortOptions;
}

export interface ProductListResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    categories: ProductCategory[];
    priceRange: { min: number; max: number };
    availableTags: string[];
  };
}

export class ProductService {
  /**
   * Get paginated list of products
   */
  async getProducts(params: ProductListParams = {}): Promise<ProductListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.set('page', params.page.toString());
      if (params.limit) queryParams.set('limit', params.limit.toString());
      
      // Add filters
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(v => queryParams.append(key, v.toString()));
            } else {
              queryParams.set(key, value.toString());
            }
          }
        });
      }
      
      // Add sorting
      if (params.sort) {
        queryParams.set('sortField', params.sort.field);
        queryParams.set('sortDirection', params.sort.direction);
      }
      
      const response = await apiClient.get<ProductListResponse>(
        `/api/products?${queryParams.toString()}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error('Failed to fetch products');
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get single product by ID
   */
  async getProduct(productId: string): Promise<Product> {
    try {
      const response = await apiClient.get<Product>(`/api/products/${productId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error('Product not found');
    } catch (error) {
      console.error('Failed to fetch product:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get product by slug
   */
  async getProductBySlug(slug: string): Promise<Product> {
    try {
      const response = await apiClient.get<Product>(`/api/products/slug/${slug}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error('Product not found');
    } catch (error) {
      console.error('Failed to fetch product by slug:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Search products
   */
  async searchProducts(query: string, filters?: ProductFilters): Promise<ProductListResponse> {
    try {
      const params: ProductListParams = {
        filters: {
          search: query,
          ...filters,
        },
      };
      
      return this.getProducts(params);
    } catch (error) {
      console.error('Failed to search products:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    try {
      const response = await this.getProducts({
        limit,
        filters: { featured: true },
        sort: { field: 'updatedAt', direction: 'desc' },
      });
      
      return response.products;
    } catch (error) {
      console.error('Failed to fetch featured products:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get related products
   */
  async getRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
    try {
      const response = await apiClient.get<Product[]>(
        `/api/products/${productId}/related?limit=${limit}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch related products:', error);
      return [];
    }
  }

  /**
   * Get product categories
   */
  async getCategories(): Promise<ProductCategory[]> {
    try {
      const response = await apiClient.get<ProductCategory[]>('/api/categories');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Check product availability
   */
  async checkAvailability(productId: string, variantId?: string): Promise<{
    available: boolean;
    quantity: number;
    estimatedDelivery?: string;
  }> {
    try {
      const endpoint = variantId 
        ? `/api/products/${productId}/variants/${variantId}/availability`
        : `/api/products/${productId}/availability`;
        
      const response = await apiClient.get<{
        available: boolean;
        quantity: number;
        estimatedDelivery?: string;
      }>(endpoint);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return { available: false, quantity: 0 };
    } catch (error) {
      console.error('Failed to check availability:', error);
      return { available: false, quantity: 0 };
    }
  }
}

// Create singleton instance
export const productService = new ProductService();