import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { warrantyService } from '@/services/warrantyService'
import type { GetCustomerWarrantiesResponse } from '@/types/warranty'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch as unknown as typeof fetch

describe('Customer Warranties Service', () => {
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

  beforeEach(() => {
    vi.clearAllMocks()
    // Ensure we have a storefront slug for URL construction
    warrantyService.setStorefrontSlug('rexus')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses the correct OpenAPI endpoint for customer warranties', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockWarrantiesResponse,
    })

    const result = await warrantyService.getCustomerWarranties()

    // Verify correct path per OpenAPI: /api/v1/storefront/{slug}/warranties
    const calledUrl: string = mockFetch.mock.calls[0][0]
    expect(calledUrl).toContain('/api/v1/storefront/rexus/warranties')

    // Verify method and headers
    const calledOptions: RequestInit = mockFetch.mock.calls[0][1]
    expect(calledOptions?.method).toBe('GET')
    expect((calledOptions?.headers as Record<string, string>)['Content-Type']).toBe('application/json')

    // Verify response wrapper shape
    expect(result.success).toBe(true)
    expect(result.data).toEqual(mockWarrantiesResponse)
  })

  it('appends pagination and filter query parameters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockWarrantiesResponse,
    })

    await warrantyService.getCustomerWarranties({ page: 2, limit: 20, status: 'activated', search: 'keyboard' })

    const calledUrl: string = mockFetch.mock.calls[0][0]
    expect(calledUrl).toContain('/api/v1/storefront/rexus/warranties?')
    expect(calledUrl).toContain('page=2')
    expect(calledUrl).toContain('limit=20')
    expect(calledUrl).toContain('status=activated')
    expect(calledUrl).toContain('search=keyboard')
  })

  it('maps warranties to WarrantyProduct via getCustomerWarrantiesAsProducts', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockWarrantiesResponse,
    })

    const result = await warrantyService.getCustomerWarrantiesAsProducts()

    expect(result.success).toBe(true)
    expect(Array.isArray(result.data)).toBe(true)
    expect(result.data?.[0]).toMatchObject({
      name: 'Gaming Keyboard',
      model: 'REXUS MX5',
      serialNumber: 'TEST123456789',
      status: 'active',
      category: 'Keyboard',
    })
  })
})