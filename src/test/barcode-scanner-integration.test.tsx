import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import Warranty from '@/pages/Warranty'
import { warrantyService } from '@/services/warrantyService'

// Mock the warranty service
vi.mock('@/services/warrantyService', () => ({
  warrantyService: {
    registerWarranty: vi.fn(),
    lookupWarranty: vi.fn(),
    getCustomerWarranties: vi.fn(),
    submitClaim: vi.fn(),
  }
}))

// Mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock BarcodeScanner component with more detailed behavior
vi.mock('@/components/common/BarcodeScanner', () => ({
  BarcodeScanner: ({ 
    isOpen, 
    onScan, 
    onClose 
  }: { 
    isOpen: boolean
    onScan: (code: string) => void
    onClose: () => void 
  }) => {
    if (!isOpen) return null
    
    return (
      <div data-testid="barcode-scanner" role="dialog">
        <div data-testid="scanner-camera">Camera View</div>
        <button 
          data-testid="scan-test-barcode" 
          onClick={() => onScan('TEST123456789')}
        >
          Scan Test Barcode
        </button>
        <button 
          data-testid="scan-invalid-barcode" 
          onClick={() => onScan('INVALID')}
        >
          Scan Invalid Barcode
        </button>
        <button 
          data-testid="close-scanner" 
          onClick={onClose}
        >
          Close Scanner
        </button>
      </div>
    )
  }
}))

const renderWarrantyPage = () => {
  return render(
    <BrowserRouter>
      <Warranty />
    </BrowserRouter>
  )
}

describe('Barcode Scanner Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful warranty history fetch
    vi.mocked(warrantyService.getCustomerWarranties).mockResolvedValue({
      success: true,
      data: {
        warranties: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          total_pages: 0
        }
      }
    })
  })

  describe('Scanner Mode Management', () => {
    it('should set scanner mode to lookup when opened from lookup step', async () => {
      renderWarrantyPage()
      
      // Should start on lookup step
      expect(screen.getByText('Warranty Lookup')).toBeInTheDocument()
      
      // Click QR scan button
      const qrScanButton = screen.getByText('Scan QR Code')
      fireEvent.click(qrScanButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('barcode-scanner')).toBeInTheDocument()
      })
      
      // Scanner should be open and ready for lookup
      expect(screen.getByTestId('scanner-camera')).toBeInTheDocument()
    })

    it('should set scanner mode to register when opened from registration step', async () => {
      renderWarrantyPage()
      
      // Navigate to registration step
      const registerButton = screen.getByText('Register New Product')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })
      
      // Click scan barcode button
      const scanButton = screen.getByText('Scan Barcode')
      fireEvent.click(scanButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('barcode-scanner')).toBeInTheDocument()
      })
      
      // Scanner should be open and ready for registration
      expect(screen.getByTestId('scanner-camera')).toBeInTheDocument()
    })
  })

  describe('Lookup Mode Scanner Behavior', () => {
    it('should perform warranty lookup when barcode is scanned in lookup mode', async () => {
      const mockWarrantyProduct = {
        id: 'WR123456',
        name: 'Gaming Keyboard',
        model: 'REXUS MX5',
        serialNumber: 'TEST123456789',
        purchaseDate: '2024-01-15',
        warrantyExpiry: '2026-01-15',
        status: 'active' as const,
        category: 'Keyboard',
        image: '/placeholder.svg'
      }
      
      vi.mocked(warrantyService.lookupWarranty).mockResolvedValue({
        success: true,
        data: mockWarrantyProduct
      })
      
      renderWarrantyPage()
      
      // Open scanner from lookup step
      const qrScanButton = screen.getByText('Scan QR Code')
      fireEvent.click(qrScanButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('barcode-scanner')).toBeInTheDocument()
      })
      
      // Scan a barcode
      const scanButton = screen.getByTestId('scan-test-barcode')
      fireEvent.click(scanButton)
      
      // Should call lookup service
      await waitFor(() => {
        expect(warrantyService.lookupWarranty).toHaveBeenCalledWith('TEST123456789')
      })
      
      // Should navigate to details step
      await waitFor(() => {
        expect(screen.getByText('Gaming Keyboard')).toBeInTheDocument()
      })
    })

    it('should handle lookup failure when scanning invalid barcode', async () => {
      vi.mocked(warrantyService.lookupWarranty).mockResolvedValue({
        success: false,
        error: 'Warranty not found'
      })
      
      renderWarrantyPage()
      
      // Open scanner from lookup step
      const qrScanButton = screen.getByText('Scan QR Code')
      fireEvent.click(qrScanButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('barcode-scanner')).toBeInTheDocument()
      })
      
      // Scan an invalid barcode
      const scanInvalidButton = screen.getByTestId('scan-invalid-barcode')
      fireEvent.click(scanInvalidButton)
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Scanned warranty not found. Please try again.')).toBeInTheDocument()
      })
    })

    it('should handle network errors during lookup scan', async () => {
      vi.mocked(warrantyService.lookupWarranty).mockRejectedValue(
        new Error('Network error')
      )
      
      renderWarrantyPage()
      
      // Open scanner from lookup step
      const qrScanButton = screen.getByText('Scan QR Code')
      fireEvent.click(qrScanButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('barcode-scanner')).toBeInTheDocument()
      })
      
      // Scan a barcode
      const scanButton = screen.getByTestId('scan-test-barcode')
      fireEvent.click(scanButton)
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Failed to lookup scanned warranty. Please try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Registration Mode Scanner Behavior', () => {
    it('should populate barcode field when scanning in registration mode', async () => {
      renderWarrantyPage()
      
      // Navigate to registration step
      const registerButton = screen.getByText('Register New Product')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })
      
      // Open scanner
      const scanButton = screen.getByText('Scan Barcode')
      fireEvent.click(scanButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('barcode-scanner')).toBeInTheDocument()
      })
      
      // Scan a barcode
      const scanTestButton = screen.getByTestId('scan-test-barcode')
      fireEvent.click(scanTestButton)
      
      // Should populate the barcode field
      await waitFor(() => {
        const barcodeInput = screen.getByPlaceholderText('Enter barcode')
        expect(barcodeInput).toHaveValue('TEST123456789')
      })
      
      // Scanner should be closed
      expect(screen.queryByTestId('barcode-scanner')).not.toBeInTheDocument()
    })

    it('should not perform lookup when scanning in registration mode', async () => {
      renderWarrantyPage()
      
      // Navigate to registration step
      const registerButton = screen.getByText('Register New Product')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })
      
      // Open scanner
      const scanButton = screen.getByText('Scan Barcode')
      fireEvent.click(scanButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('barcode-scanner')).toBeInTheDocument()
      })
      
      // Scan a barcode
      const scanTestButton = screen.getByTestId('scan-test-barcode')
      fireEvent.click(scanTestButton)
      
      // Should NOT call lookup service
      expect(warrantyService.lookupWarranty).not.toHaveBeenCalled()
      
      // Should only populate the field
      await waitFor(() => {
        const barcodeInput = screen.getByPlaceholderText('Enter barcode')
        expect(barcodeInput).toHaveValue('TEST123456789')
      })
    })
  })

  describe('Scanner UI Behavior', () => {
    it('should close scanner when close button is clicked', async () => {
      renderWarrantyPage()
      
      // Open scanner from lookup step
      const qrScanButton = screen.getByText('Scan QR Code')
      fireEvent.click(qrScanButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('barcode-scanner')).toBeInTheDocument()
      })
      
      // Close scanner
      const closeButton = screen.getByTestId('close-scanner')
      fireEvent.click(closeButton)
      
      await waitFor(() => {
        expect(screen.queryByTestId('barcode-scanner')).not.toBeInTheDocument()
      })
    })

    it('should show scanner overlay when opened', async () => {
      renderWarrantyPage()
      
      // Scanner should not be visible initially
      expect(screen.queryByTestId('barcode-scanner')).not.toBeInTheDocument()
      
      // Open scanner
      const qrScanButton = screen.getByText('Scan QR Code')
      fireEvent.click(qrScanButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('barcode-scanner')).toBeInTheDocument()
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('should disable scan buttons while scanning is in progress', async () => {
      renderWarrantyPage()
      
      // Open scanner from lookup step
      const qrScanButton = screen.getByText('Scan QR Code')
      fireEvent.click(qrScanButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('barcode-scanner')).toBeInTheDocument()
      })
      
      // The QR scan button should be disabled while scanner is open
      expect(qrScanButton).toBeDisabled()
    })
  })

  describe('Scanner State Management', () => {
    it('should maintain scanner mode across multiple scans', async () => {
      renderWarrantyPage()
      
      // Navigate to registration step
      const registerButton = screen.getByText('Register New Product')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })
      
      // Open scanner multiple times
      const scanButton = screen.getByText('Scan Barcode')
      
      // First scan
      fireEvent.click(scanButton)
      await waitFor(() => {
        expect(screen.getByTestId('barcode-scanner')).toBeInTheDocument()
      })
      
      const scanTestButton = screen.getByTestId('scan-test-barcode')
      fireEvent.click(scanTestButton)
      
      await waitFor(() => {
        expect(screen.queryByTestId('barcode-scanner')).not.toBeInTheDocument()
      })
      
      // Second scan - should still be in registration mode
      fireEvent.click(scanButton)
      await waitFor(() => {
        expect(screen.getByTestId('barcode-scanner')).toBeInTheDocument()
      })
      
      const scanTestButton2 = screen.getByTestId('scan-test-barcode')
      fireEvent.click(scanTestButton2)
      
      // Should still populate barcode field, not perform lookup
      expect(warrantyService.lookupWarranty).not.toHaveBeenCalled()
      
      await waitFor(() => {
        const barcodeInput = screen.getByPlaceholderText('Enter barcode')
        expect(barcodeInput).toHaveValue('TEST123456789')
      })
    })
  })
})