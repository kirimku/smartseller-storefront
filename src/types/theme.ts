/**
 * Theme Types - Defines the structure for dynamic white-label theming
 */

// Color palette configuration
export interface ColorPalette {
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  secondary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  accent: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  neutral: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  success: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  warning: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  error: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
}

// Typography configuration
export interface Typography {
  fontFamily: {
    sans: string[];
    serif: string[];
    mono: string[];
    display: string[];
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    '7xl': string;
    '8xl': string;
    '9xl': string;
  };
  fontWeight: {
    thin: number;
    extralight: number;
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
    black: number;
  };
  lineHeight: {
    none: number;
    tight: number;
    snug: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
  letterSpacing: {
    tighter: string;
    tight: string;
    normal: string;
    wide: string;
    wider: string;
    widest: string;
  };
}

// Spacing and sizing configuration
export interface Spacing {
  spacing: {
    0: string;
    px: string;
    0.5: string;
    1: string;
    1.5: string;
    2: string;
    2.5: string;
    3: string;
    3.5: string;
    4: string;
    5: string;
    6: string;
    7: string;
    8: string;
    9: string;
    10: string;
    11: string;
    12: string;
    14: string;
    16: string;
    20: string;
    24: string;
    28: string;
    32: string;
    36: string;
    40: string;
    44: string;
    48: string;
    52: string;
    56: string;
    60: string;
    64: string;
    72: string;
    80: string;
    96: string;
  };
  borderRadius: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    full: string;
  };
  boxShadow: {
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    inner: string;
    none: string;
  };
}

// Component-specific styling
export interface ComponentStyles {
  button: {
    primary: {
      background: string;
      color: string;
      border: string;
      hover: {
        background: string;
        color: string;
        border: string;
      };
      focus: {
        background: string;
        color: string;
        border: string;
        ring: string;
      };
      disabled: {
        background: string;
        color: string;
        border: string;
      };
    };
    secondary: {
      background: string;
      color: string;
      border: string;
      hover: {
        background: string;
        color: string;
        border: string;
      };
      focus: {
        background: string;
        color: string;
        border: string;
        ring: string;
      };
      disabled: {
        background: string;
        color: string;
        border: string;
      };
    };
    outline: {
      background: string;
      color: string;
      border: string;
      hover: {
        background: string;
        color: string;
        border: string;
      };
      focus: {
        background: string;
        color: string;
        border: string;
        ring: string;
      };
      disabled: {
        background: string;
        color: string;
        border: string;
      };
    };
  };
  input: {
    background: string;
    color: string;
    border: string;
    placeholder: string;
    focus: {
      border: string;
      ring: string;
    };
    error: {
      border: string;
      ring: string;
    };
    disabled: {
      background: string;
      color: string;
      border: string;
    };
  };
  card: {
    background: string;
    border: string;
    shadow: string;
    hover: {
      shadow: string;
      transform: string;
    };
  };
  header: {
    background: string;
    color: string;
    border: string;
    shadow: string;
  };
  footer: {
    background: string;
    color: string;
    border: string;
  };
  navigation: {
    background: string;
    color: string;
    hover: {
      background: string;
      color: string;
    };
    active: {
      background: string;
      color: string;
    };
  };
}

// Layout configuration
export interface Layout {
  container: {
    maxWidth: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
    };
    padding: {
      x: string;
      y: string;
    };
  };
  grid: {
    columns: {
      1: string;
      2: string;
      3: string;
      4: string;
      5: string;
      6: string;
      12: string;
    };
    gap: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
  };
  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
}

// Animation configuration
export interface Animations {
  transition: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    timing: {
      ease: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
  keyframes: {
    fadeIn: Record<string, Record<string, string>>;
    fadeOut: Record<string, Record<string, string>>;
    slideIn: Record<string, Record<string, string>>;
    slideOut: Record<string, Record<string, string>>;
    bounce: Record<string, Record<string, string>>;
    pulse: Record<string, Record<string, string>>;
  };
}

// Complete theme configuration
export interface ThemeConfig {
  id: string;
  name: string;
  description?: string;
  version: string;
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  components: ComponentStyles;
  layout: Layout;
  animations: Animations;
  customCSS?: string;
  customVariables?: Record<string, string>;
}

// Theme context type
export interface ThemeContextType {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  applyTheme: (themeId: string) => Promise<void>;
  generateCSS: () => string;
  isLoading: boolean;
  error: string | null;
}

// Theme preset types
export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  preview: string;
  category: 'modern' | 'classic' | 'minimal' | 'bold' | 'elegant' | 'playful';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  config: ThemeConfig;
}

// Theme customization options
export interface ThemeCustomization {
  colors?: Partial<ColorPalette>;
  typography?: Partial<Typography>;
  spacing?: Partial<Spacing>;
  components?: Partial<ComponentStyles>;
  layout?: Partial<Layout>;
  animations?: Partial<Animations>;
  customCSS?: string;
  customVariables?: Record<string, string>;
}

// Theme validation result
export interface ThemeValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    path: string;
    message: string;
  }>;
}

// Theme export/import types
export interface ThemeExport {
  theme: ThemeConfig;
  metadata: {
    exportedAt: string;
    exportedBy: string;
    version: string;
  };
}

export interface ThemeImport {
  file: File;
  overwrite: boolean;
  validateOnly: boolean;
}