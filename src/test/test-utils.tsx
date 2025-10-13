import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'

// Mock all the context providers
vi.mock('@/contexts/TenantContext', () => ({
  TenantProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-tenant-provider">{children}</div>,
  useTenant: () => ({
    tenant: {
      id: 'test-tenant',
      name: 'Test Store',
      subdomain: 'test',
      primaryColor: '#8B5CF6',
      secondaryColor: '#A78BFA',
      accentColor: '#C4B5FD',
      fontFamily: 'Inter',
      features: {
        loyaltyProgram: true,
        referralSystem: true,
        spinWheel: true,
        warrantyTracking: true,
        productReviews: true,
        wishlist: true,
        compareProducts: true,
        guestCheckout: true,
        socialLogin: true,
        multiCurrency: false,
        multiLanguage: false,
      },
      branding: {
        storeName: 'Test Store',
        tagline: 'Test Store Tagline',
        description: 'Test store description',
        logo: {
          light: '/test-logo.png',
          favicon: '/favicon.ico',
        },
        colors: {
          primary: '#8B5CF6',
          secondary: '#A78BFA',
          accent: '#C4B5FD',
          background: '#FFFFFF',
          foreground: '#1F2937',
          muted: '#F3F4F6',
          border: '#E5E7EB',
        },
        typography: {
          fontFamily: 'Inter',
          headingFont: 'Inter',
          bodyFont: 'Inter',
        },
      },
      settings: {
        currency: 'USD',
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        numberFormat: 'en-US',
        taxIncluded: false,
        shippingEnabled: true,
        inventoryTracking: true,
        orderNotifications: true,
        emailNotifications: true,
        smsNotifications: false,
      },
    },
    isLoading: false,
    error: null,
    subdomain: 'test',
    isValidTenant: true,
    slug: 'test',
    tenantResolution: {
      tenantId: 'test-tenant',
      slug: 'test',
      subdomain: 'test',
      domain: 'test.localhost',
      isValid: true,
      source: 'subdomain' as const,
    },
    slugDetection: {
      detectedSlug: 'test',
      source: 'subdomain' as const,
      confidence: 1.0,
      alternatives: [],
    },
    tenantType: 'subdomain' as const,
    apiBaseUrl: 'http://localhost:8090',
    refreshTenant: async () => {},
    validateSlug: async () => true,
    getTenantApiUrl: () => 'http://localhost:8090',
  }),
}))

vi.mock('@/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-theme-provider">{children}</div>,
  useTheme: () => ({
    theme: {
      colors: {
        primary: '#8B5CF6',
        secondary: '#A78BFA',
        accent: '#C4B5FD',
        background: '#FFFFFF',
        foreground: '#1F2937',
        muted: '#F3F4F6',
        border: '#E5E7EB',
      },
      typography: {
        fontFamily: 'Inter',
        headingFont: 'Inter',
        bodyFont: 'Inter',
      },
    },
    isLoading: false,
    error: null,
    updateTheme: vi.fn(),
    resetTheme: vi.fn(),
  }),
}))

vi.mock('@/contexts/CartContext', () => ({
  CartProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-cart-provider">{children}</div>,
  useCart: () => ({
    cart: null,
    isLoading: false,
    error: null,
    isUpdating: false,
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    loadCart: vi.fn(),
    getCartTotal: () => 0,
    getCartItemCount: () => 0,
  }),
}))

vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-auth-provider">{children}</div>,
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    refreshToken: vi.fn(),
    updateProfile: vi.fn(),
    resetPassword: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
  }),
}))

// Simple wrapper with just BrowserRouter since contexts are mocked
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }