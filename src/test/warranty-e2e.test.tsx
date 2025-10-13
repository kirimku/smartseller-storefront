import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor, within } from '@testing-library/react'
import { render } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import Warranty from '@/pages/Warranty'
import { warrantyService } from '@/services/warrantyService'

// Mock the warranty service
vi.mock('@/services/warrantyService', () => ({
  warrantyService: {
    registerWarranty: vi.fn(),
    lookupWarranty: vi.fn(),
    getCustomerWarranties: vi.fn(),
    submitClaim: vi.fn(),
    validateBarcode: vi.fn(),
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
        <h3>Barcode Scanner</h3>
        <button 
          data-testid="scan-test-barcode" 
          onClick={() => onScan('TEST123456789')}
        >
          Scan Test Barcode
        </button>
        <button 
          data-testid="scan-invalid-barcode" 
          onClick={() => onScan('INVALID123')}
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
  return render(<Warranty />)
}

describe('Warranty Registration E2E Tests', () => {
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

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Registration Flow', () => {
    it('should complete full warranty registration flow with manual entry', async () => {
      const user = userEvent.setup()
      
      // Mock successful registration
      vi.mocked(warrantyService.registerWarranty).mockResolvedValue({
        success: true,
        data: {
          success: true,
          registration_id: 'REG123456',
          warranty_id: 'WR789012',
          barcode_value: 'TEST123456789',
          status: 'active',
          activation_date: '2024-01-15',
          expiry_date: '2026-01-15',
          warranty_period: '24',
          product: {
            id: 'PROD123',
            sku: 'RX-MX5-BLK',
            name: 'REXUS Gaming Keyboard MX5',
            brand: 'REXUS',
            model: 'MX5',
            category: 'Gaming Keyboard',
            description: 'Mechanical Gaming Keyboard',
            price: 299000
          },
          customer: {
            id: 'CUST123',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            phone_number: '+6281234567890'
          },
          coverage: {
            coverage_type: 'full',
            covered_components: ['switches', 'pcb', 'cable'],
            excluded_components: ['keycaps'],
            repair_coverage: true,
            replacement_coverage: true,
            labor_coverage: true,
            parts_coverage: true,
            terms: ['Valid for 24 months from purchase date']
          },
          next_steps: [
            'Keep your warranty certificate safe',
            'Register for warranty notifications',
            'Contact support for any issues'
          ],
          registration_time: '2024-01-15T10:30:00Z'
        }
      })

      renderWarrantyPage()

      // Step 1: Start from lookup page
      expect(screen.getByText('Warranty Lookup')).toBeInTheDocument()
      
      // Step 2: Navigate to registration
      const registerButton = screen.getByText('Register New Product')
      await user.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })

      // Step 3: Fill product information
      await user.type(screen.getByPlaceholderText('Enter barcode'), 'TEST123456789')
      await user.type(screen.getByPlaceholderText('Enter product name'), 'REXUS Gaming Keyboard MX5')
      await user.type(screen.getByPlaceholderText('Enter model'), 'MX5')
      await user.type(screen.getByPlaceholderText('Enter serial number'), 'SN123456789')

      // Step 4: Fill customer information
      await user.type(screen.getByPlaceholderText('Enter first name'), 'John')
      await user.type(screen.getByPlaceholderText('Enter last name'), 'Doe')
      await user.type(screen.getByPlaceholderText('Enter email'), 'john.doe@example.com')
      await user.type(screen.getByPlaceholderText('Enter phone number'), '+6281234567890')
      
      // Fill address
      await user.type(screen.getByPlaceholderText('Enter street address'), 'Jl. Sudirman No. 123')
      await user.type(screen.getByPlaceholderText('Enter city'), 'Jakarta')
      await user.type(screen.getByPlaceholderText('Enter state/province'), 'DKI Jakarta')
      await user.type(screen.getByPlaceholderText('Enter postal code'), '12190')

      // Step 5: Fill purchase information
      await user.type(screen.getByLabelText('Purchase Date'), '2024-01-15')
      await user.type(screen.getByPlaceholderText('Enter store name'), 'Tech Store Jakarta')
      await user.type(screen.getByPlaceholderText('Enter receipt number'), 'RCP20240115001')

      // Step 6: Submit registration
      const submitButton = screen.getByText('Register Warranty')
      await user.click(submitButton)

      // Step 7: Verify loading state
      await waitFor(() => {
        expect(screen.getByText('Registering...')).toBeInTheDocument()
      })

      // Step 8: Verify success message and registration details
      await waitFor(() => {
        expect(screen.getByText('Warranty registered successfully!')).toBeInTheDocument()
        expect(screen.getByText('Registration ID: REG123456')).toBeInTheDocument()
        expect(screen.getByText('Warranty ID: WR789012')).toBeInTheDocument()
      })

      // Step 9: Verify service was called with correct data
      expect(warrantyService.registerWarranty).toHaveBeenCalledWith({
        barcode_value: 'TEST123456789',
        product_sku: 'MX5',
        serial_number: 'SN123456789',
        purchase_date: '2024-01-15',
        retailer_name: 'Tech Store Jakarta',
        invoice_number: 'RCP20240115001',
        customer_info: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          phone_number: '+6281234567890',
          address: {
            street: 'Jl. Sudirman No. 123',
            city: 'Jakarta',
            state: 'DKI Jakarta',
            postal_code: '12190',
            country: 'Indonesia'
          }
        }
      })
    })

    it('should complete registration flow using barcode scanner', async () => {
      const user = userEvent.setup()
      
      // Mock successful barcode validation
      vi.mocked(warrantyService.validateBarcode).mockResolvedValue({
        success: true,
        data: {
          valid: true,
          warranty_barcode: {
            id: 'BC123',
            barcode_string: 'TEST123456789',
            product_id: 'PROD123',
            product_name: 'REXUS Gaming Keyboard MX5',
            product_model: 'MX5',
            product_category: 'Gaming Keyboard',
            status: 'available',
            warranty_period_months: 24,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          message: 'Valid barcode'
        }
      })

      // Mock successful registration
      vi.mocked(warrantyService.registerWarranty).mockResolvedValue({
        success: true,
        data: {
          success: true,
          registration_id: 'REG123456',
          warranty_id: 'WR789012',
          barcode_value: 'TEST123456789',
          status: 'active',
          activation_date: '2024-01-15',
          expiry_date: '2026-01-15',
          warranty_period: '24',
          product: {
            id: 'PROD123',
            sku: 'RX-MX5-BLK',
            name: 'REXUS Gaming Keyboard MX5',
            brand: 'REXUS',
            model: 'MX5',
            category: 'Gaming Keyboard'
          },
          customer: {
            id: 'CUST123',
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane.smith@example.com',
            phone_number: '+6281234567891'
          },
          coverage: {
            coverage_type: 'full',
            covered_components: [],
            excluded_components: [],
            repair_coverage: true,
            replacement_coverage: true,
            labor_coverage: true,
            parts_coverage: true,
            terms: []
          },
          next_steps: [],
          registration_time: '2024-01-15T10:30:00Z'
        }
      })

      renderWarrantyPage()

      // Navigate to registration
      const registerButton = screen.getByText('Register New Product')
      await user.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })

      // Open barcode scanner
      const scanBarcodeButton = screen.getByText('Scan Barcode')
      await user.click(scanBarcodeButton)

      // Verify scanner is open
      await waitFor(() => {
        expect(screen.getByTestId('barcode-scanner')).toBeInTheDocument()
      })

      // Scan a barcode
      const scanTestBarcodeButton = screen.getByTestId('scan-test-barcode')
      await user.click(scanTestBarcodeButton)

      // Verify barcode is filled and scanner is closed
      await waitFor(() => {
        expect(screen.queryByTestId('barcode-scanner')).not.toBeInTheDocument()
        expect(screen.getByPlaceholderText('Enter barcode')).toHaveValue('TEST123456789')
      })

      // Verify product fields are auto-filled from barcode validation
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter product name')).toHaveValue('REXUS Gaming Keyboard MX5')
        expect(screen.getByPlaceholderText('Enter model')).toHaveValue('MX5')
      })

      // Fill remaining required fields
      await user.type(screen.getByPlaceholderText('Enter serial number'), 'SN987654321')
      await user.type(screen.getByPlaceholderText('Enter first name'), 'Jane')
      await user.type(screen.getByPlaceholderText('Enter last name'), 'Smith')
      await user.type(screen.getByPlaceholderText('Enter email'), 'jane.smith@example.com')
      await user.type(screen.getByPlaceholderText('Enter phone number'), '+6281234567891')
      await user.type(screen.getByPlaceholderText('Enter street address'), 'Jl. Thamrin No. 456')
      await user.type(screen.getByPlaceholderText('Enter city'), 'Jakarta')
      await user.type(screen.getByPlaceholderText('Enter state/province'), 'DKI Jakarta')
      await user.type(screen.getByPlaceholderText('Enter postal code'), '10230')
      await user.type(screen.getByLabelText('Purchase Date'), '2024-01-15')
      await user.type(screen.getByPlaceholderText('Enter store name'), 'Electronics Mall')
      await user.type(screen.getByPlaceholderText('Enter receipt number'), 'RCP20240115002')

      // Submit registration
      const submitButton = screen.getByText('Register Warranty')
      await user.click(submitButton)

      // Verify success
      await waitFor(() => {
        expect(screen.getByText('Warranty registered successfully!')).toBeInTheDocument()
      })

      // Verify barcode validation was called
      expect(warrantyService.validateBarcode).toHaveBeenCalledWith('TEST123456789')
    })
  })

  describe('Error Handling Flows', () => {
    it('should handle registration failure gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock failed registration
      vi.mocked(warrantyService.registerWarranty).mockResolvedValue({
        success: false,
        error: 'Barcode already registered to another customer'
      })

      renderWarrantyPage()

      // Navigate to registration and fill form
      const registerButton = screen.getByText('Register New Product')
      await user.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })

      // Fill minimum required fields
      await user.type(screen.getByPlaceholderText('Enter barcode'), 'DUPLICATE123456789')
      await user.type(screen.getByPlaceholderText('Enter product name'), 'Gaming Keyboard')
      await user.type(screen.getByPlaceholderText('Enter first name'), 'John')
      await user.type(screen.getByPlaceholderText('Enter last name'), 'Doe')
      await user.type(screen.getByPlaceholderText('Enter email'), 'john@example.com')

      // Submit registration
      const submitButton = screen.getByText('Register Warranty')
      await user.click(submitButton)

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText('Barcode already registered to another customer')).toBeInTheDocument()
      })

      // Verify form is still accessible for retry
      expect(screen.getByPlaceholderText('Enter barcode')).toBeInTheDocument()
      expect(submitButton).not.toBeDisabled()
    })

    it('should handle network errors during registration', async () => {
      const user = userEvent.setup()
      
      // Mock network error
      vi.mocked(warrantyService.registerWarranty).mockRejectedValue(
        new Error('Network connection failed')
      )

      renderWarrantyPage()

      // Navigate to registration and fill form
      const registerButton = screen.getByText('Register New Product')
      await user.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })

      // Fill minimum required fields
      await user.type(screen.getByPlaceholderText('Enter barcode'), 'TEST123456789')
      await user.type(screen.getByPlaceholderText('Enter product name'), 'Gaming Keyboard')
      await user.type(screen.getByPlaceholderText('Enter first name'), 'John')
      await user.type(screen.getByPlaceholderText('Enter last name'), 'Doe')
      await user.type(screen.getByPlaceholderText('Enter email'), 'john@example.com')

      // Submit registration
      const submitButton = screen.getByText('Register Warranty')
      await user.click(submitButton)

      // Verify generic error message is displayed
      await waitFor(() => {
        expect(screen.getByText('Failed to register warranty. Please try again.')).toBeInTheDocument()
      })
    })

    it('should handle invalid barcode scan', async () => {
      const user = userEvent.setup()
      
      // Mock invalid barcode validation
      vi.mocked(warrantyService.validateBarcode).mockResolvedValue({
        success: true,
        data: {
          valid: false,
          message: 'Invalid barcode format'
        }
      })

      renderWarrantyPage()

      // Navigate to registration
      const registerButton = screen.getByText('Register New Product')
      await user.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })

      // Open barcode scanner
      const scanBarcodeButton = screen.getByText('Scan Barcode')
      await user.click(scanBarcodeButton)

      // Scan invalid barcode
      const scanInvalidBarcodeButton = screen.getByTestId('scan-invalid-barcode')
      await user.click(scanInvalidBarcodeButton)

      // Verify error message is shown
      await waitFor(() => {
        expect(screen.getByText('Invalid barcode format')).toBeInTheDocument()
      })

      // Verify barcode field is filled but with error state
      expect(screen.getByPlaceholderText('Enter barcode')).toHaveValue('INVALID123')
    })
  })

  describe('Form Validation Flows', () => {
    it('should prevent submission with missing required fields', async () => {
      const user = userEvent.setup()
      
      renderWarrantyPage()

      // Navigate to registration
      const registerButton = screen.getByText('Register New Product')
      await user.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })

      // Try to submit without filling any fields
      const submitButton = screen.getByText('Register Warranty')
      await user.click(submitButton)

      // Verify validation errors are shown
      await waitFor(() => {
        expect(screen.getByText('Barcode is required')).toBeInTheDocument()
        expect(screen.getByText('Product name is required')).toBeInTheDocument()
        expect(screen.getByText('First name is required')).toBeInTheDocument()
        expect(screen.getByText('Last name is required')).toBeInTheDocument()
        expect(screen.getByText('Email is required')).toBeInTheDocument()
      })

      // Verify service was not called
      expect(warrantyService.registerWarranty).not.toHaveBeenCalled()
    })

    it('should validate email format', async () => {
      const user = userEvent.setup()
      
      renderWarrantyPage()

      // Navigate to registration
      const registerButton = screen.getByText('Register New Product')
      await user.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })

      // Fill fields with invalid email
      await user.type(screen.getByPlaceholderText('Enter barcode'), 'TEST123456789')
      await user.type(screen.getByPlaceholderText('Enter product name'), 'Gaming Keyboard')
      await user.type(screen.getByPlaceholderText('Enter first name'), 'John')
      await user.type(screen.getByPlaceholderText('Enter last name'), 'Doe')
      await user.type(screen.getByPlaceholderText('Enter email'), 'invalid-email-format')

      // Try to submit
      const submitButton = screen.getByText('Register Warranty')
      await user.click(submitButton)

      // Verify email validation error
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      })

      // Verify service was not called
      expect(warrantyService.registerWarranty).not.toHaveBeenCalled()
    })

    it('should validate barcode length', async () => {
      const user = userEvent.setup()
      
      renderWarrantyPage()

      // Navigate to registration
      const registerButton = screen.getByText('Register New Product')
      await user.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })

      // Fill fields with short barcode
      await user.type(screen.getByPlaceholderText('Enter barcode'), '123')
      await user.type(screen.getByPlaceholderText('Enter product name'), 'Gaming Keyboard')
      await user.type(screen.getByPlaceholderText('Enter first name'), 'John')
      await user.type(screen.getByPlaceholderText('Enter last name'), 'Doe')
      await user.type(screen.getByPlaceholderText('Enter email'), 'john@example.com')

      // Try to submit
      const submitButton = screen.getByText('Register Warranty')
      await user.click(submitButton)

      // Verify barcode validation error
      await waitFor(() => {
        expect(screen.getByText('Barcode must be at least 8 characters')).toBeInTheDocument()
      })

      // Verify service was not called
      expect(warrantyService.registerWarranty).not.toHaveBeenCalled()
    })
  })

  describe('Navigation Flows', () => {
    it('should allow navigation back to lookup from registration', async () => {
      const user = userEvent.setup()
      
      renderWarrantyPage()

      // Navigate to registration
      const registerButton = screen.getByText('Register New Product')
      await user.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })

      // Fill some fields
      await user.type(screen.getByPlaceholderText('Enter barcode'), 'TEST123456789')
      await user.type(screen.getByPlaceholderText('Enter first name'), 'John')

      // Navigate back
      const backButton = screen.getByText('← Back to Lookup')
      await user.click(backButton)

      // Verify we're back to lookup
      await waitFor(() => {
        expect(screen.getByText('Warranty Lookup')).toBeInTheDocument()
      })

      // Navigate to registration again and verify form is reset
      const registerAgainButton = screen.getByText('Register New Product')
      await user.click(registerAgainButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter barcode')).toHaveValue('')
        expect(screen.getByPlaceholderText('Enter first name')).toHaveValue('')
      })
    })

    it('should navigate to warranty details after successful registration', async () => {
      const user = userEvent.setup()
      
      // Mock successful registration
      vi.mocked(warrantyService.registerWarranty).mockResolvedValue({
        success: true,
        data: {
          success: true,
          registration_id: 'REG123456',
          warranty_id: 'WR789012',
          barcode_value: 'TEST123456789',
          status: 'active',
          activation_date: '2024-01-15',
          expiry_date: '2026-01-15',
          warranty_period: '24',
          product: {
            id: 'PROD123',
            sku: 'RX-MX5-BLK',
            name: 'REXUS Gaming Keyboard MX5',
            brand: 'REXUS',
            model: 'MX5',
            category: 'Gaming Keyboard'
          },
          customer: {
            id: 'CUST123',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            phone_number: '+6281234567890'
          },
          coverage: {
            coverage_type: 'full',
            covered_components: [],
            excluded_components: [],
            repair_coverage: true,
            replacement_coverage: true,
            labor_coverage: true,
            parts_coverage: true,
            terms: []
          },
          next_steps: [],
          registration_time: '2024-01-15T10:30:00Z'
        }
      })

      renderWarrantyPage()

      // Complete registration flow
      const registerButton = screen.getByText('Register New Product')
      await user.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })

      // Fill required fields
      await user.type(screen.getByPlaceholderText('Enter barcode'), 'TEST123456789')
      await user.type(screen.getByPlaceholderText('Enter product name'), 'REXUS Gaming Keyboard MX5')
      await user.type(screen.getByPlaceholderText('Enter first name'), 'John')
      await user.type(screen.getByPlaceholderText('Enter last name'), 'Doe')
      await user.type(screen.getByPlaceholderText('Enter email'), 'john@example.com')

      // Submit registration
      const submitButton = screen.getByText('Register Warranty')
      await user.click(submitButton)

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText('Warranty registered successfully!')).toBeInTheDocument()
      })

      // Check for navigation option to warranty details
      const viewDetailsButton = screen.getByText('View Warranty Details')
      expect(viewDetailsButton).toBeInTheDocument()

      // Click to navigate to warranty details
      await user.click(viewDetailsButton)

      // Verify navigation was called
      expect(mockNavigate).toHaveBeenCalledWith('/warranty/WR789012')
    })
  })
})