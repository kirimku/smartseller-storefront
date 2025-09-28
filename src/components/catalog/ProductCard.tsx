import React, { useState } from 'react';
import { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  viewMode,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getDiscountPercentage = () => {
    if (!product.comparePrice || product.comparePrice <= product.price) {
      return null;
    }
    return Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100);
  };

  const primaryImage = product.images?.[0];
  const secondaryImage = product.images?.[1];
  const discountPercentage = getDiscountPercentage();
  const isOnSale = discountPercentage !== null;
  const isOutOfStock = product.trackQuantity && (product.quantity || 0) <= 0;

  if (viewMode === 'list') {
    return (
      <div className={`product-card-list bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${className}`}>
        <div className="flex gap-4">
          {/* Image */}
          <div className="flex-shrink-0 w-24 h-24 relative">
            {primaryImage && !imageError ? (
              <img
                src={primaryImage.url}
                alt={primaryImage.alt || product.name}
                className="w-full h-full object-cover rounded-lg"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            
            {/* Badges */}
            <div className="absolute top-1 left-1 flex flex-col gap-1">
              {isOnSale && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">
                  -{discountPercentage}%
                </span>
              )}
              {product.featured && (
                <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                  Featured
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {product.shortDescription || product.description}
                </p>
                
                {/* Categories */}
                {product.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {product.categories.slice(0, 2).map((category) => (
                      <span
                        key={category.id}
                        className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Price and Actions */}
              <div className="flex flex-col items-end ml-4">
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </div>
                  {isOnSale && (
                    <div className="text-sm text-gray-500 line-through">
                      {formatPrice(product.comparePrice!)}
                    </div>
                  )}
                </div>

                <button
                  disabled={isOutOfStock}
                  className={`mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isOutOfStock
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      className={`product-card-grid bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden">
        {primaryImage && !imageError ? (
          <img
            src={isHovered && secondaryImage ? secondaryImage.url : primaryImage.url}
            alt={primaryImage.alt || product.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isOnSale && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
              -{discountPercentage}%
            </span>
          )}
          {product.featured && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
              Featured
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded">
              Out of Stock
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className={`absolute top-2 right-2 flex flex-col gap-1 transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Categories */}
        {product.categories.length > 0 && (
          <div className="text-xs text-gray-500 mb-1">
            {product.categories[0].name}
          </div>
        )}

        {/* Title */}
        <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-lg font-bold text-gray-900">
              {formatPrice(product.price)}
            </div>
            {isOnSale && (
              <div className="text-sm text-gray-500 line-through">
                {formatPrice(product.comparePrice!)}
              </div>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          disabled={isOutOfStock}
          className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            isOutOfStock
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;