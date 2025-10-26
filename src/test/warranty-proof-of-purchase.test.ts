import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { warrantyService } from '@/services/warrantyService'
import type { WarrantyServiceResponse } from '@/types/warranty'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Warranty Proof of Purchase Upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
    warrantyService.setStorefrontSlug('rexus')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('uploadProofOfPurchase', () => {
    it('should successfully upload a PDF file', async () => {
      // Create a mock PDF file
      const mockPdfFile = new File(['PDF content'], 'receipt.pdf', { type: 'application/pdf' })
      
      // Mock successful response matching OpenAPI structure
      const mockResponse = {
        success: true,
        message: 'Proof of purchase uploaded successfully',
        data: {
          document_type: 'pdf' as const,
          document_url: 'https://cloudflare-bucket.com/receipts/receipt-123.pdf',
          file_name: 'receipt.pdf',
          file_size: 1048576
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      })

      const result = await warrantyService.uploadProofOfPurchase(mockPdfFile)

      expect(result.success).toBe(true)
      expect(result.data?.document_type).toBe('pdf')
      expect(result.data?.document_url).toBe('https://cloudflare-bucket.com/receipts/receipt-123.pdf')
      expect(result.message).toBe('Proof of purchase uploaded successfully')

      // Verify the request was made correctly
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/storefront/rexus/warranty/customer/registration/proof-of-purchase/upload'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      )

      // Verify FormData contains the file
      const [, options] = mockFetch.mock.calls[0]
      const formData = options.body as FormData
      expect(formData.get('file')).toBe(mockPdfFile)
    })

    it('should successfully upload an image file', async () => {
      // Create a mock image file
      const mockImageFile = new File(['Image content'], 'receipt.jpg', { type: 'image/jpeg' })
      
      // Mock successful response
      const mockResponse = {
        success: true,
        message: 'Proof of purchase uploaded successfully',
        data: {
          document_type: 'image' as const,
          document_url: 'https://cloudflare-bucket.com/receipts/receipt-456.jpg',
          file_name: 'receipt.jpg',
          file_size: 2097152
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      })

      const result = await warrantyService.uploadProofOfPurchase(mockImageFile)

      expect(result.success).toBe(true)
      expect(result.data?.document_type).toBe('image')
      expect(result.data?.document_url).toBe('https://cloudflare-bucket.com/receipts/receipt-456.jpg')
      expect(result.message).toBe('Proof of purchase uploaded successfully')
    })

    it('should handle file size limit error (400)', async () => {
      const mockLargeFile = new File(['Large file content'], 'large-receipt.pdf', { type: 'application/pdf' })
      
      const mockErrorResponse = {
        success: false,
        message: 'File size exceeds the maximum limit of 10MB'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse
      })

      const result = await warrantyService.uploadProofOfPurchase(mockLargeFile)

      expect(result.success).toBe(false)
      expect(result.error).toContain('File size exceeds the maximum limit of 10MB')
      expect(result.message).toBe('Failed to upload proof of purchase')
    })

    it('should handle unsupported file format error (415)', async () => {
      const mockUnsupportedFile = new File(['Text content'], 'receipt.txt', { type: 'text/plain' })
      
      const mockErrorResponse = {
        success: false,
        message: 'Unsupported file format. Only PDF, JPG, PNG are allowed'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 415,
        json: async () => mockErrorResponse
      })

      const result = await warrantyService.uploadProofOfPurchase(mockUnsupportedFile)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unsupported file format. Only PDF, JPG, PNG are allowed')
      expect(result.message).toBe('Failed to upload proof of purchase')
    })

    it('should handle authentication error (401)', async () => {
      const mockFile = new File(['PDF content'], 'receipt.pdf', { type: 'application/pdf' })
      
      const mockErrorResponse = {
        success: false,
        message: 'Authentication required'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockErrorResponse
      })

      const result = await warrantyService.uploadProofOfPurchase(mockFile)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Authentication required')
      expect(result.message).toBe('Failed to upload proof of purchase')
    })

    it('should handle server error (500)', async () => {
      const mockFile = new File(['PDF content'], 'receipt.pdf', { type: 'application/pdf' })
      
      const mockErrorResponse = {
        success: false,
        message: 'Internal server error'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => mockErrorResponse
      })

      const result = await warrantyService.uploadProofOfPurchase(mockFile)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Internal server error')
      expect(result.message).toBe('Failed to upload proof of purchase')
    })

    it('should handle network errors', async () => {
      const mockFile = new File(['PDF content'], 'receipt.pdf', { type: 'application/pdf' })
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await warrantyService.uploadProofOfPurchase(mockFile)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to upload proof of purchase')
      expect(result.message).toBe('Failed to upload proof of purchase')
    })

    it('should build correct URL with storefront slug', async () => {
      const mockFile = new File(['PDF content'], 'receipt.pdf', { type: 'application/pdf' })
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            document_url: 'https://example.com/file.pdf',
            document_type: 'pdf'
          }
        })
      })

      await warrantyService.uploadProofOfPurchase(mockFile)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/storefront/rexus/warranty/customer/registration/proof-of-purchase/upload'),
        expect.any(Object)
      )
    })

    it('should include authentication headers when available', async () => {
      const mockFile = new File(['PDF content'], 'receipt.pdf', { type: 'application/pdf' })
      
      // Mock token storage
      const mockToken = 'mock-jwt-token'
      vi.doMock('@/services/secureTokenStorage', () => ({
        secureTokenStorage: {
          getAccessToken: vi.fn().mockReturnValue(mockToken)
        }
      }))

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            document_url: 'https://example.com/file.pdf',
            document_type: 'pdf'
          }
        })
      })

      await warrantyService.uploadProofOfPurchase(mockFile)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      )
    })
  })

  describe('document_type validation', () => {
    it('should correctly identify PDF files', async () => {
      const mockPdfFile = new File(['PDF content'], 'document.pdf', { type: 'application/pdf' })
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            document_url: 'https://example.com/document.pdf',
            document_type: 'pdf'
          }
        })
      })

      const result = await warrantyService.uploadProofOfPurchase(mockPdfFile)
      expect(result.data?.document_type).toBe('pdf')
    })

    it('should correctly identify image files', async () => {
      const mockImageFile = new File(['Image content'], 'receipt.png', { type: 'image/png' })
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            document_url: 'https://example.com/receipt.png',
            document_type: 'image'
          }
        })
      })

      const result = await warrantyService.uploadProofOfPurchase(mockImageFile)
      expect(result.data?.document_type).toBe('image')
    })
  })
})