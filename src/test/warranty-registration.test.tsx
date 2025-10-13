import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { render } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import Warranty from '@/pages/Warranty'
import { warrantyService } from '@/services/warrantyService'
import { CustomerWarrantyRegistrationRequest, CustomerWarrantyRegistrationResponse } from '@/types/warranty'

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

// Mock BarcodeScanner component
vi.mock('@/components/common/BarcodeScanner', () => ({
  BarcodeScanner: ({ onScan, onClose }: { onScan: (code: string) => void; onClose: () => void }) => (
    <div data-testid="barcode-scanner">
      <button onClick={() => onScan('TEST123456')}>Scan Test Code</button>
      <button onClick={onClose}>Close Scanner</button>
    </div>
  )
}))

const renderWarrantyPage = () => {
  return render(<Warranty />)
}

describe('Warranty Registration', () => {
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

  describe('Registration Form State Management', () => {
    it('should initialize registration form with empty values', async () => {
      renderWarrantyPage()
      
      // Navigate to registration step
      const registerButton = screen.getByText('Register New Product')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })
      
      // Check that form fields are empty
      expect(screen.getByPlaceholderText('Enter barcode')).toHaveValue('')
      expect(screen.getByPlaceholderText('Enter product SKU')).toHaveValue('')
      expect(screen.getByPlaceholderText('Enter serial number')).toHaveValue('')
    })

    it('should update barcode field when user types', async () => {
      const user = userEvent.setup()
      renderWarrantyPage()
      
      // Navigate to registration step
      const registerButton = screen.getByText('Register New Product')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })
      
      const barcodeInput = screen.getByPlaceholderText('Enter barcode')
      await user.type(barcodeInput, 'TEST123456')
      
      expect(barcodeInput).toHaveValue('TEST123456')
    })

    it('should update product SKU field when user types', async () => {
      const user = userEvent.setup()
      renderWarrantyPage()
      
      // Navigate to registration step
      const registerButton = screen.getByText('Register New Product')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })
      
      const skuInput = screen.getByPlaceholderText('Enter product SKU')
      await user.type(skuInput, 'REXUS-MX5')
      
      expect(skuInput).toHaveValue('REXUS-MX5')
    })

    it('should update customer information fields', async () => {
      const user = userEvent.setup()
      renderWarrantyPage()
      
      // Navigate to registration step
      const registerButton = screen.getByText('Register New Product')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })
      
      // Switch to customer info tab
      const customerTab = screen.getByText('Customer Info')
      fireEvent.click(customerTab)
      
      const firstNameInput = screen.getByPlaceholderText('Enter first name')
      const lastNameInput = screen.getByPlaceholderText('Enter last name')
      const emailInput = screen.getByPlaceholderText('Enter email')
      
      await user.type(firstNameInput, 'John')
      await user.type(lastNameInput, 'Doe')
      await user.type(emailInput, 'john.doe@example.com')
      
      expect(firstNameInput).toHaveValue('John')
      expect(lastNameInput).toHaveValue('Doe')
      expect(emailInput).toHaveValue('john.doe@example.com')
    })
  })

  describe('Form Validation', () => {
    it('should show error when submitting without barcode', async () => {
      renderWarrantyPage()
      
      // Navigate to registration step
      const registerButton = screen.getByText('Register New Product')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })
      
      // Try to submit without barcode
      const submitButton = screen.getByText('Register Product')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a barcode')).toBeInTheDocument()
      })
    })

    it('should validate required fields before submission', async () => {
      const user = userEvent.setup()
      renderWarrantyPage()
      
      // Navigate to registration step
      const registerButton = screen.getByText('Register New Product')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })
      
      // Fill only barcode
      const barcodeInput = screen.getByPlaceholderText('Enter barcode')
      await user.type(barcodeInput, 'TEST123456')
      
      // Try to submit
      const submitButton = screen.getByText('Register Product')
      fireEvent.click(submitButton)
      
      // Should not call API without required fields
      expect(warrantyService.registerWarranty).not.toHaveBeenCalled()
    })
  })

  describe('Barcode Scanner Integration', () => {
    it('should open barcode scanner when scan button is clicked', async () => {
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
    })

    it('should populate barcode field when scanner detects code', async () => {
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
      
      // Simulate scanning a code
      const scanTestButton = screen.getByText('Scan Test Code')
      fireEvent.click(scanTestButton)
      
      await waitFor(() => {
        const barcodeInput = screen.getByPlaceholderText('Enter barcode')
        expect(barcodeInput).toHaveValue('TEST123456')
      })
    })

    it('should close scanner when close button is clicked', async () => {
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
      
      // Close scanner
      const closeButton = screen.getByText('Close Scanner')
      fireEvent.click(closeButton)
      
      await waitFor(() => {
        expect(screen.queryByTestId('barcode-scanner')).not.toBeInTheDocument()
      })
    })
  })

  describe('Registration Submission', () => {
    it('should successfully submit registration with valid data', async () => {
      const user = userEvent.setup()
      const mockResponse: CustomerWarrantyRegistrationResponse = {
        success: true,
        registration_id: 'REG123456',
        warranty_id: 'WR123456',
        barcode_value: 'TEST123456',
        status: 'registered',
        activation_date: '2024-01-15T10:00:00Z',
        expiry_date: '2026-01-15T10:00:00Z',
        warranty_period: '24 months',
        product: {
          id: 'PROD123',
          sku: 'REXUS-MX5',
          name: 'Gaming Keyboard',
          brand: 'REXUS',
          model: 'MX5',
          category: 'Keyboard'
        },
        customer: {
          id: 'CUST123',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          phone_number: '+1234567890'
        },
        coverage: {
          coverage_type: 'standard',
          covered_components: ['keyboard', 'switches'],
          excluded_components: [],
          repair_coverage: true,
          replacement_coverage: true,
          labor_coverage: true,
          parts_coverage: true,
          terms: ['2 year warranty']
        },
        next_steps: ['Keep receipt', 'Register online'],
        registration_time: '2024-01-15T10:00:00Z'
      }
      
      vi.mocked(warrantyService.registerWarranty).mockResolvedValue({
        success: true,
        data: mockResponse
      })
      
      renderWarrantyPage()
      
      // Navigate to registration step
      const registerButton = screen.getByText('Register New Product')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })
      
      // Fill required fields
      const barcodeInput = screen.getByPlaceholderText('Enter barcode')
      await user.type(barcodeInput, 'TEST123456')
      
      // Submit form
      const submitButton = screen.getByText('Register Product')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(warrantyService.registerWarranty).toHaveBeenCalledWith(
          expect.objectContaining({
            barcode_value: 'TEST123456'
          })
        )
      })
      
      // Should navigate to success step
      await waitFor(() => {
        expect(screen.getByText('Registration Successful!')).toBeInTheDocument()
      })
    })

    it('should handle registration failure', async () => {
      const user = userEvent.setup()
      
      vi.mocked(warrantyService.registerWarranty).mockResolvedValue({
        success: false,
        error: 'Invalid barcode'
      })
      
      renderWarrantyPage()
      
      // Navigate to registration step
      const registerButton = screen.getByText('Register New Product')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })
      
      // Fill required fields
      const barcodeInput = screen.getByPlaceholderText('Enter barcode')
      await user.type(barcodeInput, 'INVALID123')
      
      // Submit form
      const submitButton = screen.getByText('Register Product')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Invalid barcode')).toBeInTheDocument()
      })
    })

    it('should handle network errors during registration', async () => {
      const user = userEvent.setup()
      
      vi.mocked(warrantyService.registerWarranty).mockRejectedValue(
        new Error('Network error')
      )
      
      renderWarrantyPage()
      
      // Navigate to registration step
      const registerButton = screen.getByText('Register New Product')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })
      
      // Fill required fields
      const barcodeInput = screen.getByPlaceholderText('Enter barcode')
      await user.type(barcodeInput, 'TEST123456')
      
      // Submit form
      const submitButton = screen.getByText('Register Product')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Failed to register warranty. Please try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should navigate back to lookup step when back button is clicked', async () => {
      renderWarrantyPage()
      
      // Navigate to registration step
      const registerButton = screen.getByText('Register New Product')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })
      
      // Click back button
      const backButton = screen.getByText('Back to Lookup')
      fireEvent.click(backButton)
      
      await waitFor(() => {
        expect(screen.getByText('Warranty Lookup')).toBeInTheDocument()
      })
    })

    it('should show register another product option on success', async () => {
      const user = userEvent.setup()
      const mockResponse: CustomerWarrantyRegistrationResponse = {
        success: true,
        registration_id: 'REG123456',
        warranty_id: 'WR123456',
        barcode_value: 'TEST123456',
        status: 'registered',
        activation_date: '2024-01-15T10:00:00Z',
        expiry_date: '2026-01-15T10:00:00Z',
        warranty_period: '24 months',
        product: {
          id: 'PROD123',
          sku: 'REXUS-MX5',
          name: 'Gaming Keyboard',
          brand: 'REXUS',
          model: 'MX5',
          category: 'Keyboard'
        },
        customer: {
          id: 'CUST123',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          phone_number: '+1234567890'
        },
        coverage: {
          coverage_type: 'standard',
          covered_components: ['keyboard', 'switches'],
          excluded_components: [],
          repair_coverage: true,
          replacement_coverage: true,
          labor_coverage: true,
          parts_coverage: true,
          terms: ['2 year warranty']
        },
        next_steps: ['Keep receipt', 'Register online'],
        registration_time: '2024-01-15T10:00:00Z'
      }
      
      vi.mocked(warrantyService.registerWarranty).mockResolvedValue({
        success: true,
        data: mockResponse
      })
      
      renderWarrantyPage()
      
      // Navigate to registration step and complete registration
      const registerButton = screen.getByText('Register New Product')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })
      
      const barcodeInput = screen.getByPlaceholderText('Enter barcode')
      await user.type(barcodeInput, 'TEST123456')
      
      const submitButton = screen.getByText('Register Product')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Registration Successful!')).toBeInTheDocument()
        expect(screen.getByText('Register Another Product')).toBeInTheDocument()
        expect(screen.getByText('Return to Home')).toBeInTheDocument()
      })
    })
  })
})