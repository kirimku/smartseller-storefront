import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeConfig, ThemeContextType, ThemeCustomization } from '@/types/theme';
import { TenantConfig } from '@/types/tenant';
import { useTenant } from './TenantContext';
import { defaultTheme } from '@/themes/default';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tenant } = useTenant();

  // Load theme when tenant changes
  useEffect(() => {
    const loadTheme = async () => {
      if (!tenant) {
        setTheme(defaultTheme);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Use default theme with tenant branding colors
        const brandedTheme = applyTenantBranding(defaultTheme, tenant);
        setTheme(brandedTheme);
      } catch (err) {
        console.error('Failed to load tenant theme:', err);
        setError('Failed to load theme');
        setTheme(defaultTheme);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, [tenant]);

  // Apply theme to DOM
  useEffect(() => {
    if (theme) {
      injectThemeCSS(theme);
    }
  }, [theme]);

  /**
   * Generate a simple color palette from a base color
   */
  const generateColorPalette = (baseColor: string) => {
    // Simple implementation - in a real app, you'd use a color manipulation library
    return {
      50: lighten(baseColor, 0.9),
      100: lighten(baseColor, 0.8),
      200: lighten(baseColor, 0.6),
      300: lighten(baseColor, 0.4),
      400: lighten(baseColor, 0.2),
      500: baseColor,
      600: darken(baseColor, 0.1),
      700: darken(baseColor, 0.2),
      800: darken(baseColor, 0.3),
      900: darken(baseColor, 0.4),
      950: darken(baseColor, 0.5),
    };
  };

  /**
   * Apply tenant branding to default theme
   */
  const applyTenantBranding = (baseTheme: ThemeConfig, tenant: TenantConfig): ThemeConfig => {
    if (!tenant?.branding) {
      return baseTheme;
    }

    const { colors } = tenant.branding;

    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: generateColorPalette(colors.primary),
        secondary: generateColorPalette(colors.secondary),
        accent: generateColorPalette(colors.accent),
      },
    };
  };

  /**
   * Inject theme CSS into the DOM
   */
  const injectThemeCSS = (themeConfig: ThemeConfig) => {
    const styleId = 'dynamic-theme-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    // Generate CSS variables
    const cssVariables = generateCSSVariables(themeConfig);
    styleElement.textContent = cssVariables;
  };

  /**
   * Generate CSS variables from theme config
   */
  const generateCSSVariables = (themeConfig: ThemeConfig): string => {
    const { colors, typography, spacing } = themeConfig;
    
    let css = ':root {\n';
    
    // Color variables
    Object.entries(colors).forEach(([colorName, colorPalette]) => {
      Object.entries(colorPalette).forEach(([shade, value]) => {
        css += `  --color-${colorName}-${shade}: ${value};\n`;
      });
    });
    
    // Typography variables
    css += `  --font-family-sans: ${typography.fontFamily.sans.join(', ')};\n`;
    css += `  --font-family-serif: ${typography.fontFamily.serif.join(', ')};\n`;
    css += `  --font-family-mono: ${typography.fontFamily.mono.join(', ')};\n`;
    
    // Spacing variables
    Object.entries(spacing).forEach(([key, value]) => {
      css += `  --spacing-${key}: ${value};\n`;
    });
    
    css += '}\n';
    return css;
  };

  /**
   * Simple color manipulation functions
   */
  const lighten = (color: string, amount: number): string => {
    // Simple implementation - in production, use a proper color library
    return color;
  };

  const darken = (color: string, amount: number): string => {
    // Simple implementation - in production, use a proper color library
    return color;
  };

  /**
   * Apply theme by ID
   */
  const applyTheme = async (themeId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      // For now, just use default theme
      setTheme(defaultTheme);
    } catch (err) {
      console.error('Failed to apply theme:', err);
      setError('Failed to apply theme');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generate CSS from current theme
   */
  const generateCSS = (): string => {
    return generateCSSVariables(theme);
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    applyTheme,
    generateCSS,
    isLoading,
    error,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};