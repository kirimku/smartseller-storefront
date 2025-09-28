export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  sku: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  trackQuantity: boolean;
  quantity?: number;
  allowBackorder: boolean;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  images: ProductImage[];
  categories: ProductCategory[];
  variants?: ProductVariant[];
  inventory: ProductInventory;
  seo: ProductSEO;
  status: 'active' | 'draft' | 'archived';
  featured: boolean;
  tags: string[];
  attributes: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  position: number;
  width?: number;
  height?: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  level: number;
  productCount: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  comparePrice?: number;
  inventory: ProductInventory;
  attributes: Record<string, string>;
  image?: ProductImage;
}

export interface ProductInventory {
  available: number;
  committed: number;
  onHand: number;
  locations: Array<{
    locationId: string;
    available: number;
    onHand: number;
  }>;
}

export interface ProductSEO {
  title?: string;
  description?: string;
  keywords?: string[];
  slug: string;
}

export interface ProductFilters {
  categories?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  inStock?: boolean;
  onSale?: boolean;
  featured?: boolean;
  tags?: string[];
  attributes?: Record<string, string[]>;
  rating?: number;
  brand?: string[];
}

export type ProductSortOptions = 
  | 'relevance'
  | 'name-asc'
  | 'name-desc'
  | 'price-asc'
  | 'price-desc'
  | 'created-asc'
  | 'created-desc'
  | 'featured'
  | 'rating'
  | 'popularity';

export interface ProductListParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  filters?: ProductFilters;
  sort?: ProductSortOptions;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}