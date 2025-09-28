import React, { useState, useEffect, useMemo } from 'react';
import { Product, ProductFilters, ProductSortOptions, ProductListParams } from '@/types/product';
import { ProductService } from '@/services/productService';
import { useTenant } from '@/contexts/TenantContext';
import ProductGrid from './ProductGrid';
import ProductFiltersPanel from './ProductFiltersPanel';
import ProductSearch from './ProductSearch';
import ProductSort from './ProductSort';
import ProductPagination from '@/components/catalog/ProductPagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

interface ProductCatalogProps {
  categoryId?: string;
  searchQuery?: string;
  className?: string;
}

const ProductCatalog: React.FC<ProductCatalogProps> = ({
  categoryId,
  searchQuery: initialSearchQuery = '',
  className = '',
}) => {
  const { tenant } = useTenant();
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [filters, setFilters] = useState<ProductFilters>({});
  const [sortOption, setSortOption] = useState<ProductSortOptions>('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const productService = useMemo(() => new ProductService(), []);

  // Load products when filters change
  useEffect(() => {
    loadProducts();
  }, [categoryId, searchQuery, filters, sortOption, currentPage, tenant]);

  const loadProducts = async () => {
    if (!tenant) return;

    try {
      setIsLoading(true);
      setError(null);

      const params: ProductListParams = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        sort: sortOption,
        categoryId: categoryId || undefined,
      };

      const response = await productService.getProducts(params);
      setProducts(response.products);
      setTotalProducts(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page
  };

  const handleFilterChange = (newFilters: ProductFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page
  };

  const handleSortChange = (newSort: ProductSortOptions) => {
    setSortOption(newSort);
    setCurrentPage(1); // Reset to first page
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of catalog
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery.length > 0;

  if (error) {
    return (
      <div className={`product-catalog ${className}`}>
        <ErrorMessage 
          message={error} 
          onRetry={loadProducts}
          className="my-8"
        />
      </div>
    );
  }

  return (
    <div className={`product-catalog ${className}`}>
      {/* Header */}
      <div className="catalog-header mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <ProductSearch
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search products..."
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-label="Grid view"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-label="List view"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 8a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 12a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                </svg>
              </button>
            </div>

            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" />
              </svg>
              Filters
              {hasActiveFilters && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                  {Object.keys(filters).length + (searchQuery ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Sort */}
            <ProductSort
              value={sortOption}
              onChange={handleSortChange}
            />
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <div>
            {isLoading ? (
              'Loading products...'
            ) : (
              `Showing ${products.length} of ${totalProducts} products`
            )}
          </div>
          
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="catalog-content">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-64 flex-shrink-0">
              <ProductFiltersPanel
                filters={filters}
                onChange={handleFilterChange}
                onClose={() => setShowFilters(false)}
              />
            </div>
          )}

          {/* Products */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : products.length > 0 ? (
              <>
                <ProductGrid
                  products={products}
                  viewMode={viewMode}
                  className="mb-8"
                />
                
                {totalPages > 1 && (
                  <ProductPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalProducts}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={(newItemsPerPage) => {
              setItemsPerPage(newItemsPerPage);
              setCurrentPage(1);
            }}
            className="mt-8"
          />
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 mb-4">
                  {hasActiveFilters
                    ? 'Try adjusting your filters or search terms.'
                    : 'No products are available at the moment.'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCatalog;