import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
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
        <button 
          data-testid="scan-test-barcode" 
          onClick={() => onScan('TEST123456789')}
        >
          Scan Test Barcode
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

describe('Warranty UI Components', () => {
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

  describe('Navigation and Step Management', () => {
    it('should render initial lookup step with correct UI elements', () => {
      renderWarrantyPage()
      
      // Check main heading
      expect(screen.getByText('Warranty Lookup')).toBeInTheDocument()
      
      // Check input field
      expect(screen.getByPlaceholderText('Enter warranty code or barcode')).toBeInTheDocument()
      
      // Check action buttons
      expect(screen.getByText('Look Up')).toBeInTheDocument()
      expect(screen.getByText('Scan QR Code')).toBeInTheDocument()
      expect(screen.getByText('Register New Product')).toBeInTheDocument()
    })

    it('should navigate to registration step when register button is clicked', async () => {
      renderWarrantyPage()
      
      const registerButton = screen.getByText('Register New Product')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
        expect(screen.getByText('Product Information')).toBeInTheDocument()
      })
    })

    it('should show back button in registration step', async () => {
      renderWarrantyPage()
      
      // Navigate to registration
      const registerButton = screen.getByText('Register New Product')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('← Back to Lookup')).toBeInTheDocument()
      })
    })

    it('should navigate back to lookup when back button is clicked', async () => {
      renderWarrantyPage()
      
      // Navigate to registration
      const registerButton = screen.getByText('Register New Product')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })
      
      // Click back button
      const backButton = screen.getByText('← Back to Lookup')
      fireEvent.click(backButton)
      
      await waitFor(() => {
        expect(screen.getByText('Warranty Lookup')).toBeInTheDocument()
      })
    })

    it('should show step indicator in registration flow', async () => {
      renderWarrantyPage()
      
      // Navigate to registration
      const registerButton = screen.getByText('Register New Product')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        // Check for step indicators or progress elements
        expect(screen.getByText('Product Information')).toBeInTheDocument()
        expect(screen.getByText('Customer Information')).toBeInTheDocument()
        expect(screen.getByText('Purchase Information')).toBeInTheDocument()
      })
    })
  })

  describe('Registration Form UI Components', () => {
    beforeEach(async () => {
      renderWarrantyPage()
      
      // Navigate to registration step
      const registerButton = screen.getByText('Register New Product')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })
    })

    it('should render product information section with all required fields', () => {
      // Product section
      expect(screen.getByText('Product Information')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter barcode')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter product name')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter model')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter serial number')).toBeInTheDocument()
      expect(screen.getByText('Scan Barcode')).toBeInTheDocument()
    })

    it('should render customer information section with all required fields', () => {
      // Customer section
      expect(screen.getByText('Customer Information')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter first name')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter last name')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter phone number')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter street address')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter city')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter state/province')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter postal code')).toBeInTheDocument()
    })

    it('should render purchase information section with all required fields', () => {
      // Purchase section
      expect(screen.getByText('Purchase Information')).toBeInTheDocument()
      expect(screen.getByLabelText('Purchase Date')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter store name')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter receipt number')).toBeInTheDocument()
      expect(screen.getByText('Upload Receipt')).toBeInTheDocument()
    })

    it('should render submit button', () => {
      expect(screen.getByText('Register Warranty')).toBeInTheDocument()
    })

    it('should show loading state when submitting', async () => {
      const user = userEvent.setup()
      
      // Fill required fields
      await user.type(screen.getByPlaceholderText('Enter barcode'), 'TEST123456789')
      await user.type(screen.getByPlaceholderText('Enter product name'), 'Gaming Keyboard')
      await user.type(screen.getByPlaceholderText('Enter first name'), 'John')
      await user.type(screen.getByPlaceholderText('Enter last name'), 'Doe')
      await user.type(screen.getByPlaceholderText('Enter email'), 'john@example.com')
      
      // Mock slow registration response
      vi.mocked(warrantyService.registerWarranty).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: {
            success: true,
            registration_id: 'REG123',
            warranty_id: 'WR123',
            barcode_value: 'TEST123456789',
            status: 'active',
            activation_date: '2024-01-15',
            expiry_date: '2026-01-15',
            warranty_period: '24',
            product: {
              id: 'PROD123',
              sku: 'TEST-SKU',
              name: 'Gaming Keyboard',
              brand: 'REXUS',
              model: 'MX5',
              category: 'Keyboard'
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
        }), 1000))
      )
      
      // Submit form
      const submitButton = screen.getByText('Register Warranty')
      await user.click(submitButton)
      
      // Should show loading state
      expect(screen.getByText('Registering...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Form Field Interactions', () => {
    beforeEach(async () => {
      renderWarrantyPage()
      
      // Navigate to registration step
      const registerButton = screen.getByText('Register New Product')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })
    })

    it('should update barcode field when user types', async () => {
      const user = userEvent.setup()
      const barcodeInput = screen.getByPlaceholderText('Enter barcode')
      
      await user.type(barcodeInput, 'TEST123456789')
      
      expect(barcodeInput).toHaveValue('TEST123456789')
    })

    it('should update customer fields when user types', async () => {
      const user = userEvent.setup()
      
      const firstNameInput = screen.getByPlaceholderText('Enter first name')
      const lastNameInput = screen.getByPlaceholderText('Enter last name')
      const emailInput = screen.getByPlaceholderText('Enter email')
      
      await user.type(firstNameInput, 'John')
      await user.type(lastNameInput, 'Doe')
      await user.type(emailInput, 'john@example.com')
      
      expect(firstNameInput).toHaveValue('John')
      expect(lastNameInput).toHaveValue('Doe')
      expect(emailInput).toHaveValue('john@example.com')
    })

    it('should update nested address fields', async () => {
      const user = userEvent.setup()
      
      const streetInput = screen.getByPlaceholderText('Enter street address')
      const cityInput = screen.getByPlaceholderText('Enter city')
      const stateInput = screen.getByPlaceholderText('Enter state/province')
      const postalInput = screen.getByPlaceholderText('Enter postal code')
      
      await user.type(streetInput, '123 Main St')
      await user.type(cityInput, 'Jakarta')
      await user.type(stateInput, 'DKI Jakarta')
      await user.type(postalInput, '12345')
      
      expect(streetInput).toHaveValue('123 Main St')
      expect(cityInput).toHaveValue('Jakarta')
      expect(stateInput).toHaveValue('DKI Jakarta')
      expect(postalInput).toHaveValue('12345')
    })

    it('should handle date input for purchase date', async () => {
      const user = userEvent.setup()
      const dateInput = screen.getByLabelText('Purchase Date')
      
      await user.type(dateInput, '2024-01-15')
      
      expect(dateInput).toHaveValue('2024-01-15')
    })

    it('should clear form when reset is triggered', async () => {
      const user = userEvent.setup()
      
      // Fill some fields
      await user.type(screen.getByPlaceholderText('Enter barcode'), 'TEST123')
      await user.type(screen.getByPlaceholderText('Enter first name'), 'John')
      
      // Navigate away and back to trigger reset
      const backButton = screen.getByText('← Back to Lookup')
      await user.click(backButton)
      
      await waitFor(() => {
        expect(screen.getByText('Warranty Lookup')).toBeInTheDocument()
      })
      
      const registerButton = screen.getByText('Register New Product')
      await user.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter barcode')).toHaveValue('')
        expect(screen.getByPlaceholderText('Enter first name')).toHaveValue('')
      })
    })
  })

  describe('Form Validation UI', () => {
    beforeEach(async () => {
      renderWarrantyPage()
      
      // Navigate to registration step
      const registerButton = screen.getByText('Register New Product')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })
    })

    it('should show validation error for empty barcode', async () => {
      const user = userEvent.setup()
      
      // Try to submit without barcode
      const submitButton = screen.getByText('Register Warranty')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Barcode is required')).toBeInTheDocument()
      })
    })

    it('should show validation error for invalid email format', async () => {
      const user = userEvent.setup()
      
      // Enter invalid email
      const emailInput = screen.getByPlaceholderText('Enter email')
      await user.type(emailInput, 'invalid-email')
      
      // Try to submit
      const submitButton = screen.getByText('Register Warranty')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      })
    })

    it('should show validation error for short barcode', async () => {
      const user = userEvent.setup()
      
      // Enter short barcode
      const barcodeInput = screen.getByPlaceholderText('Enter barcode')
      await user.type(barcodeInput, '123')
      
      // Try to submit
      const submitButton = screen.getByText('Register Warranty')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Barcode must be at least 8 characters')).toBeInTheDocument()
      })
    })

    it('should clear validation errors when fields are corrected', async () => {
      const user = userEvent.setup()
      
      // Trigger validation error
      const submitButton = screen.getByText('Register Warranty')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Barcode is required')).toBeInTheDocument()
      })
      
      // Fix the error
      const barcodeInput = screen.getByPlaceholderText('Enter barcode')
      await user.type(barcodeInput, 'TEST123456789')
      
      await waitFor(() => {
        expect(screen.queryByText('Barcode is required')).not.toBeInTheDocument()
      })
    })
  })

  describe('Success and Error States', () => {
    beforeEach(async () => {
      renderWarrantyPage()
      
      // Navigate to registration step
      const registerButton = screen.getByText('Register New Product')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })
    })

    it('should show success message after successful registration', async () => {
      const user = userEvent.setup()
      
      // Mock successful registration
      vi.mocked(warrantyService.registerWarranty).mockResolvedValue({
        success: true,
        data: {
          success: true,
          registration_id: 'REG123',
          warranty_id: 'WR123',
          barcode_value: 'TEST123456789',
          status: 'active',
          activation_date: '2024-01-15',
          expiry_date: '2026-01-15',
          warranty_period: '24',
          product: {
            id: 'PROD123',
            sku: 'TEST-SKU',
            name: 'Gaming Keyboard',
            brand: 'REXUS',
            model: 'MX5',
            category: 'Keyboard'
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
      
      // Fill required fields
      await user.type(screen.getByPlaceholderText('Enter barcode'), 'TEST123456789')
      await user.type(screen.getByPlaceholderText('Enter product name'), 'Gaming Keyboard')
      await user.type(screen.getByPlaceholderText('Enter first name'), 'John')
      await user.type(screen.getByPlaceholderText('Enter last name'), 'Doe')
      await user.type(screen.getByPlaceholderText('Enter email'), 'john@example.com')
      
      // Submit form
      const submitButton = screen.getByText('Register Warranty')
      await user.click(submitButton)
      
      // Should show success message
      await waitFor(() => {
        expect(screen.getByText('Warranty registered successfully!')).toBeInTheDocument()
      })
    })

    it('should show error message when registration fails', async () => {
      const user = userEvent.setup()
      
      // Mock failed registration
      vi.mocked(warrantyService.registerWarranty).mockResolvedValue({
        success: false,
        error: 'Barcode already registered'
      })
      
      // Fill required fields
      await user.type(screen.getByPlaceholderText('Enter barcode'), 'TEST123456789')
      await user.type(screen.getByPlaceholderText('Enter product name'), 'Gaming Keyboard')
      await user.type(screen.getByPlaceholderText('Enter first name'), 'John')
      await user.type(screen.getByPlaceholderText('Enter last name'), 'Doe')
      await user.type(screen.getByPlaceholderText('Enter email'), 'john@example.com')
      
      // Submit form
      const submitButton = screen.getByText('Register Warranty')
      await user.click(submitButton)
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Barcode already registered')).toBeInTheDocument()
      })
    })

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock network error
      vi.mocked(warrantyService.registerWarranty).mockRejectedValue(
        new Error('Network error')
      )
      
      // Fill required fields
      await user.type(screen.getByPlaceholderText('Enter barcode'), 'TEST123456789')
      await user.type(screen.getByPlaceholderText('Enter product name'), 'Gaming Keyboard')
      await user.type(screen.getByPlaceholderText('Enter first name'), 'John')
      await user.type(screen.getByPlaceholderText('Enter last name'), 'Doe')
      await user.type(screen.getByPlaceholderText('Enter email'), 'john@example.com')
      
      // Submit form
      const submitButton = screen.getByText('Register Warranty')
      await user.click(submitButton)
      
      // Should show generic error message
      await waitFor(() => {
        expect(screen.getByText('Failed to register warranty. Please try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    beforeEach(async () => {
      renderWarrantyPage()
      
      // Navigate to registration step
      const registerButton = screen.getByText('Register New Product')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Register New Product')).toBeInTheDocument()
      })
    })

    it('should have proper form labels and accessibility attributes', () => {
      // Check for proper labeling
      expect(screen.getByLabelText('Purchase Date')).toBeInTheDocument()
      
      // Check for required field indicators
      const barcodeInput = screen.getByPlaceholderText('Enter barcode')
      expect(barcodeInput).toHaveAttribute('required')
      
      // Check for proper form structure
      expect(screen.getByRole('form')).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      
      // Tab through form fields
      await user.tab()
      expect(screen.getByPlaceholderText('Enter barcode')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByText('Scan Barcode')).toHaveFocus()
    })

    it('should announce validation errors to screen readers', async () => {
      const user = userEvent.setup()
      
      // Trigger validation error
      const submitButton = screen.getByText('Register Warranty')
      await user.click(submitButton)
      
      await waitFor(() => {
        const errorMessage = screen.getByText('Barcode is required')
        expect(errorMessage).toHaveAttribute('role', 'alert')
      })
    })
  })
})