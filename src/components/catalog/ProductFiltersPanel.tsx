import React, { useState, useEffect } from 'react';
import { ProductFilters, ProductCategory } from '@/types/product';
import { ProductService } from '@/services/productService';
import ProductFiltersComponent from './ProductFilters';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ProductFiltersPanelProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  categoryId?: string;
  className?: string;
}

const ProductFiltersPanel: React.FC<ProductFiltersPanelProps> = ({
  filters,
  onFiltersChange,
  categoryId,
  className = '',
}) => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const productService = new ProductService();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load categories - you might want to implement this in ProductService
      // For now, we'll create a mock implementation
      const mockCategories: ProductCategory[] = [
        {
          id: '1',
          name: 'Electronics',
          slug: 'electronics',
          level: 0,
          productCount: 150,
        },
        {
          id: '2',
          name: 'Clothing',
          slug: 'clothing',
          level: 0,
          productCount: 200,
        },
        {
          id: '3',
          name: 'Home & Garden',
          slug: 'home-garden',
          level: 0,
          productCount: 75,
        },
        {
          id: '4',
          name: 'Sports',
          slug: 'sports',
          level: 0,
          productCount: 120,
        },
        {
          id: '5',
          name: 'Books',
          slug: 'books',
          level: 0,
          productCount: 300,
        },
      ];
      
      setCategories(mockCategories);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  return (
    <ProductFiltersComponent
      filters={filters}
      categories={categories}
      onFiltersChange={onFiltersChange}
      isLoading={false}
      className={className}
    />
  );
};

export default ProductFiltersPanel;