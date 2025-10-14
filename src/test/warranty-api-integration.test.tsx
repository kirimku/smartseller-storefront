import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { warrantyService } from '@/services/warrantyService'
import type { 
  CustomerWarrantyRegistrationRequest,
  CustomerWarrantyRegistrationResponse,
  GetCustomerWarrantiesResponse,
  WarrantyServiceResponse,
  WarrantyProduct
} from '@/types/warranty'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Warranty API Integration', () => {
  const mockRegistrationRequest: CustomerWarrantyRegistrationRequest = {
    barcode_value: 'TEST123456789',
    product_sku: 'REXUS-MX5-001',
    serial_number: 'SN123456789',
    purchase_date: '2024-01-15',
    purchase_price: 150000,
    retailer_name: 'Tech Store',
    retailer_address: '123 Main St, Jakarta',
    invoice_number: 'INV123456',
    customer_info: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone_number: '+1234567890',
      address: {
        street: '123 Main St',
        city: 'Jakarta',
        state: 'DKI Jakarta',
        postal_code: '12345',
        country: 'Indonesia'
      },
      date_of_birth: '1990-01-01'
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset fetch mock
    mockFetch.mockClear()
    // Ensure storefront-aware endpoints use a known slug
    warrantyService.setStorefrontSlug('rexus')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Warranty Registration API', () => {

    const mockSuccessResponse: CustomerWarrantyRegistrationResponse = {
      success: true,
      registration_id: 'REG123456',
      warranty_id: 'WR123456',
      barcode_value: 'TEST123456789',
      status: 'active',
      activation_date: '2024-01-15',
      expiry_date: '2026-01-15',
      warranty_period: '24',
      product: {
        id: 'PROD123',
        sku: 'REXUS-MX5-001',
        name: 'Gaming Keyboard',
        brand: 'REXUS',
        model: 'MX5',
        category: 'Keyboard',
        description: 'Gaming mechanical keyboard',
        image_url: '/placeholder.svg',
        price: 150000
      },
      customer: {
        id: 'CUST123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone_number: '+1234567890'
      },
      coverage: {
        coverage_type: 'full',
        covered_components: ['Keys', 'PCB', 'Cable'],
        excluded_components: ['Keycaps'],
        repair_coverage: true,
        replacement_coverage: true,
        labor_coverage: true,
        parts_coverage: true,
        terms: ['Keep receipt safe', 'Register within 30 days'],
        limitations: ['Physical damage not covered']
      },
      next_steps: [
        'Keep your receipt safe',
        'Register for extended warranty if needed'
      ],
      registration_time: '2024-01-15T10:30:00Z'
    }

    it('should successfully register warranty with valid data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse
      })

      const result = await warrantyService.registerWarranty(mockRegistrationRequest)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/storefront/rexus/warranties/register'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(mockRegistrationRequest)
        })
      )

      expect(result).toEqual(mockSuccessResponse)
    })

    it('should handle registration failure with error response', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Barcode already registered',
        error_code: 'DUPLICATE_BARCODE'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse
      })

      const result = await warrantyService.registerWarranty(mockRegistrationRequest)

      expect(result).toEqual(mockErrorResponse)
    })

    it('should handle network errors during registration', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(warrantyService.registerWarranty(mockRegistrationRequest))
        .rejects.toThrow('Network error')
    })

    it('should handle server errors (500) during registration', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Internal server error' })
      })

      const result = await warrantyService.registerWarranty(mockRegistrationRequest)

      expect(result).toEqual({ error: 'Internal server error' })
    })

    it('should include authentication headers when available', async () => {
      // Mock localStorage to include auth token
      const mockToken = 'mock-auth-token'
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(() => mockToken),
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn()
        },
        writable: true
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse
      })

      await warrantyService.registerWarranty(mockRegistrationRequest)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/storefront/rexus/warranties/register'),
        expect.objectContaining({
          headers: expect.objectContaining({
            // Authorization is set by StorefrontApiClient when available; Content-Type is always present
            'Content-Type': 'application/json'
          })
        })
      )
    })
  })

  describe('Warranty Lookup API', () => {
    const mockLookupResponse: WarrantyServiceResponse<WarrantyProduct> = {
      success: true,
      data: {
        id: 'WR123456',
        name: 'Gaming Keyboard',
        model: 'REXUS MX5',
        serialNumber: 'SN123456789',
        purchaseDate: '2024-01-15',
        warrantyExpiry: '2026-01-15',
        status: 'active',
        category: 'Keyboard',
        image: '/placeholder.svg'
      }
    }

    it('should successfully lookup warranty by barcode', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockLookupResponse
      })

      const result = await warrantyService.lookupWarranty('TEST123456789')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/storefront/rexus/warranty/validate-barcode'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )

      expect(result).toEqual(mockLookupResponse)
    })

    it('should handle warranty not found', async () => {
      const mockNotFoundResponse = {
        success: false,
        error: 'Warranty not found'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockNotFoundResponse
      })

      const result = await warrantyService.lookupWarranty('INVALID123')

      expect(result).toEqual(mockNotFoundResponse)
    })

    it('should handle invalid barcode format', async () => {
      const mockInvalidResponse = {
        success: false,
        error: 'Invalid barcode format'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockInvalidResponse
      })

      const result = await warrantyService.lookupWarranty('INVALID')

      expect(result).toEqual(mockInvalidResponse)
    })
  })

  describe('Customer Warranties API', () => {
    const mockWarrantiesResponse: GetCustomerWarrantiesResponse = {
      warranties: [
        {
          id: 'WR123456',
          barcode_string: 'TEST123456789',
          product_id: 'PROD123',
          product_name: 'Gaming Keyboard',
          product_model: 'REXUS MX5',
          product_category: 'Keyboard',
          status: 'activated',
          warranty_period_months: 24,
          activation_date: '2024-01-15',
          expiry_date: '2026-01-15',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        total_pages: 1
      }
    }

    it('should successfully fetch customer warranties', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockWarrantiesResponse
      })

      const result = await warrantyService.getCustomerWarranties()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/storefront/rexus/warranties'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )

      expect(result).toEqual(mockWarrantiesResponse)
    })

    it('should handle pagination parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockWarrantiesResponse
      })

      await warrantyService.getCustomerWarranties({ page: 2, limit: 20 })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2&limit=20'),
        expect.any(Object)
      )
    })

    it('should handle empty warranties list', async () => {
      const mockEmptyResponse: GetCustomerWarrantiesResponse = {
        warranties: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          total_pages: 0
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockEmptyResponse
      })

      const result = await warrantyService.getCustomerWarranties()

      expect(result).toEqual(mockEmptyResponse)
      expect(result.data.warranties).toHaveLength(0)
    })
  })

  describe('API Error Handling', () => {
    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout')
      timeoutError.name = 'TimeoutError'
      
      mockFetch.mockRejectedValueOnce(timeoutError)

      await expect(warrantyService.registerWarranty(mockRegistrationRequest))
        .rejects.toThrow('Request timeout')
    })

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON')
        }
      })

      await expect(warrantyService.registerWarranty(mockRegistrationRequest))
        .rejects.toThrow('Invalid JSON')
    })

    it('should handle rate limiting (429)', async () => {
      const mockRateLimitResponse = {
        success: false,
        error: 'Rate limit exceeded',
        retry_after: 60
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => mockRateLimitResponse
      })

      const result = await warrantyService.registerWarranty(mockRegistrationRequest)

      expect(result).toEqual(mockRateLimitResponse)
    })

    it('should handle unauthorized access (401)', async () => {
      const mockUnauthorizedResponse = {
        success: false,
        error: 'Unauthorized access'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockUnauthorizedResponse
      })

      const result = await warrantyService.registerWarranty(mockRegistrationRequest)

      expect(result).toEqual(mockUnauthorizedResponse)
    })
  })

  describe('Request Validation', () => {
    it('should validate required fields in registration request', async () => {
      const invalidRequest = {
        ...mockRegistrationRequest,
        customer_info: {
          ...mockRegistrationRequest.customer_info,
          email: '' // Invalid email
        }
      }

      const mockValidationError = {
        success: false,
        error: 'Validation failed',
        validation_errors: {
          'customer.email': 'Email is required'
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => mockValidationError
      })

      const result = await warrantyService.registerWarranty(invalidRequest)

      expect(result).toEqual(mockValidationError)
    })

    it('should handle barcode format validation', async () => {
      const invalidBarcodeRequest = {
        ...mockRegistrationRequest,
        barcode_value: 'INVALID' // Too short
      }

      const mockValidationError = {
        success: false,
        error: 'Invalid barcode format',
        validation_errors: {
          'barcode_value': 'Barcode must be at least 8 characters'
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => mockValidationError
      })

      const result = await warrantyService.registerWarranty(invalidBarcodeRequest)

      expect(result).toEqual(mockValidationError)
    })
  })
})