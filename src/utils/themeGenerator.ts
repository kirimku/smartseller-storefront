/**
 * Theme Generator - Converts theme configuration to CSS
 */

import { ThemeConfig } from '@/types/theme';

/**
 * Generate CSS from theme configuration
 */
export function generateThemeCSS(theme: ThemeConfig): string {
  const css = [
    generateRootVariables(theme),
    generateComponentStyles(theme),
    generateUtilityClasses(theme),
    generateAnimations(theme),
    theme.customCSS || '',
  ].filter(Boolean).join('\n\n');

  return css;
}

/**
 * Generate CSS custom properties for the root element
 */
function generateRootVariables(theme: ThemeConfig): string {
  const variables: string[] = [];

  // Color variables
  Object.entries(theme.colors).forEach(([colorName, colorShades]) => {
    Object.entries(colorShades).forEach(([shade, value]) => {
      variables.push(`  --color-${colorName}-${shade}: ${value};`);
    });
  });

  // Typography variables
  Object.entries(theme.typography.fontSize).forEach(([size, value]) => {
    variables.push(`  --font-size-${size}: ${value};`);
  });

  Object.entries(theme.typography.fontWeight).forEach(([weight, value]) => {
    variables.push(`  --font-weight-${weight}: ${value};`);
  });

  Object.entries(theme.typography.lineHeight).forEach(([height, value]) => {
    variables.push(`  --line-height-${height}: ${value};`);
  });

  Object.entries(theme.typography.letterSpacing).forEach(([spacing, value]) => {
    variables.push(`  --letter-spacing-${spacing}: ${value};`);
  });

  // Font family variables
  Object.entries(theme.typography.fontFamily).forEach(([family, fonts]) => {
    variables.push(`  --font-family-${family}: ${fonts.join(', ')};`);
  });

  // Spacing variables
  Object.entries(theme.spacing.spacing).forEach(([size, value]) => {
    variables.push(`  --spacing-${size}: ${value};`);
  });

  // Border radius variables
  Object.entries(theme.spacing.borderRadius).forEach(([size, value]) => {
    variables.push(`  --border-radius-${size}: ${value};`);
  });

  // Box shadow variables
  Object.entries(theme.spacing.boxShadow).forEach(([size, value]) => {
    variables.push(`  --shadow-${size}: ${value};`);
  });

  // Layout variables
  Object.entries(theme.layout.container.maxWidth).forEach(([size, value]) => {
    variables.push(`  --container-max-width-${size}: ${value};`);
  });

  Object.entries(theme.layout.breakpoints).forEach(([size, value]) => {
    variables.push(`  --breakpoint-${size}: ${value};`);
  });

  // Animation variables
  Object.entries(theme.animations.transition.duration).forEach(([speed, value]) => {
    variables.push(`  --transition-duration-${speed}: ${value};`);
  });

  Object.entries(theme.animations.transition.timing).forEach(([timing, value]) => {
    variables.push(`  --transition-timing-${timing}: ${value};`);
  });

  // Custom variables
  if (theme.customVariables) {
    Object.entries(theme.customVariables).forEach(([name, value]) => {
      variables.push(`  --${name}: ${value};`);
    });
  }

  return `:root {\n${variables.join('\n')}\n}`;
}

/**
 * Generate component-specific styles
 */
function generateComponentStyles(theme: ThemeConfig): string {
  const styles: string[] = [];

  // Button styles
  styles.push(`
/* Button Components */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-duration-normal) var(--transition-timing-ease);
  cursor: pointer;
  border: 1px solid transparent;
  text-decoration: none;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-primary {
  background-color: ${theme.components.button.primary.background};
  color: ${theme.components.button.primary.color};
  border-color: ${theme.components.button.primary.border};
}

.btn-primary:hover:not(:disabled) {
  background-color: ${theme.components.button.primary.hover.background};
  color: ${theme.components.button.primary.hover.color};
  border-color: ${theme.components.button.primary.hover.border};
}

.btn-primary:focus {
  background-color: ${theme.components.button.primary.focus.background};
  color: ${theme.components.button.primary.focus.color};
  border-color: ${theme.components.button.primary.focus.border};
  box-shadow: 0 0 0 3px ${theme.components.button.primary.focus.ring}33;
}

.btn-secondary {
  background-color: ${theme.components.button.secondary.background};
  color: ${theme.components.button.secondary.color};
  border-color: ${theme.components.button.secondary.border};
}

.btn-secondary:hover:not(:disabled) {
  background-color: ${theme.components.button.secondary.hover.background};
  color: ${theme.components.button.secondary.hover.color};
  border-color: ${theme.components.button.secondary.hover.border};
}

.btn-outline {
  background-color: ${theme.components.button.outline.background};
  color: ${theme.components.button.outline.color};
  border-color: ${theme.components.button.outline.border};
}

.btn-outline:hover:not(:disabled) {
  background-color: ${theme.components.button.outline.hover.background};
  color: ${theme.components.button.outline.hover.color};
  border-color: ${theme.components.button.outline.hover.border};
}
`);

  // Input styles
  styles.push(`
/* Input Components */
.input {
  display: block;
  width: 100%;
  border-radius: var(--border-radius-md);
  border: 1px solid ${theme.components.input.border};
  background-color: ${theme.components.input.background};
  color: ${theme.components.input.color};
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-base);
  transition: all var(--transition-duration-normal) var(--transition-timing-ease);
}

.input::placeholder {
  color: ${theme.components.input.placeholder};
}

.input:focus {
  outline: none;
  border-color: ${theme.components.input.focus.border};
  box-shadow: 0 0 0 3px ${theme.components.input.focus.ring}33;
}

.input:disabled {
  background-color: ${theme.components.input.disabled.background};
  color: ${theme.components.input.disabled.color};
  border-color: ${theme.components.input.disabled.border};
  cursor: not-allowed;
}

.input.error {
  border-color: ${theme.components.input.error.border};
}

.input.error:focus {
  border-color: ${theme.components.input.error.border};
  box-shadow: 0 0 0 3px ${theme.components.input.error.ring}33;
}
`);

  // Card styles
  styles.push(`
/* Card Components */
.card {
  background-color: ${theme.components.card.background};
  border: 1px solid ${theme.components.card.border};
  border-radius: var(--border-radius-lg);
  box-shadow: ${theme.components.card.shadow};
  transition: all var(--transition-duration-normal) var(--transition-timing-ease);
}

.card:hover {
  box-shadow: ${theme.components.card.hover.shadow};
  transform: ${theme.components.card.hover.transform};
}
`);

  // Header styles
  styles.push(`
/* Header Components */
.header {
  background-color: ${theme.components.header.background};
  color: ${theme.components.header.color};
  border-bottom: 1px solid ${theme.components.header.border};
  box-shadow: ${theme.components.header.shadow};
}
`);

  // Footer styles
  styles.push(`
/* Footer Components */
.footer {
  background-color: ${theme.components.footer.background};
  color: ${theme.components.footer.color};
  border-top: 1px solid ${theme.components.footer.border};
}
`);

  // Navigation styles
  styles.push(`
/* Navigation Components */
.nav-link {
  background-color: ${theme.components.navigation.background};
  color: ${theme.components.navigation.color};
  transition: all var(--transition-duration-normal) var(--transition-timing-ease);
  text-decoration: none;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius-md);
}

.nav-link:hover {
  background-color: ${theme.components.navigation.hover.background};
  color: ${theme.components.navigation.hover.color};
}

.nav-link.active {
  background-color: ${theme.components.navigation.active.background};
  color: ${theme.components.navigation.active.color};
}
`);

  return styles.join('\n');
}

/**
 * Generate utility classes
 */
function generateUtilityClasses(theme: ThemeConfig): string {
  const utilities: string[] = [];

  // Color utilities
  Object.entries(theme.colors).forEach(([colorName, colorShades]) => {
    Object.entries(colorShades).forEach(([shade, value]) => {
      utilities.push(`.text-${colorName}-${shade} { color: ${value}; }`);
      utilities.push(`.bg-${colorName}-${shade} { background-color: ${value}; }`);
      utilities.push(`.border-${colorName}-${shade} { border-color: ${value}; }`);
    });
  });

  // Typography utilities
  Object.entries(theme.typography.fontSize).forEach(([size, value]) => {
    utilities.push(`.text-${size} { font-size: ${value}; }`);
  });

  Object.entries(theme.typography.fontWeight).forEach(([weight, value]) => {
    utilities.push(`.font-${weight} { font-weight: ${value}; }`);
  });

  // Spacing utilities
  Object.entries(theme.spacing.spacing).forEach(([size, value]) => {
    utilities.push(`.p-${size} { padding: ${value}; }`);
    utilities.push(`.px-${size} { padding-left: ${value}; padding-right: ${value}; }`);
    utilities.push(`.py-${size} { padding-top: ${value}; padding-bottom: ${value}; }`);
    utilities.push(`.pt-${size} { padding-top: ${value}; }`);
    utilities.push(`.pr-${size} { padding-right: ${value}; }`);
    utilities.push(`.pb-${size} { padding-bottom: ${value}; }`);
    utilities.push(`.pl-${size} { padding-left: ${value}; }`);
    
    utilities.push(`.m-${size} { margin: ${value}; }`);
    utilities.push(`.mx-${size} { margin-left: ${value}; margin-right: ${value}; }`);
    utilities.push(`.my-${size} { margin-top: ${value}; margin-bottom: ${value}; }`);
    utilities.push(`.mt-${size} { margin-top: ${value}; }`);
    utilities.push(`.mr-${size} { margin-right: ${value}; }`);
    utilities.push(`.mb-${size} { margin-bottom: ${value}; }`);
    utilities.push(`.ml-${size} { margin-left: ${value}; }`);
  });

  // Border radius utilities
  Object.entries(theme.spacing.borderRadius).forEach(([size, value]) => {
    utilities.push(`.rounded-${size} { border-radius: ${value}; }`);
  });

  // Shadow utilities
  Object.entries(theme.spacing.boxShadow).forEach(([size, value]) => {
    utilities.push(`.shadow-${size} { box-shadow: ${value}; }`);
  });

  return `/* Utility Classes */\n${utilities.join('\n')}`;
}

/**
 * Generate animation keyframes
 */
function generateAnimations(theme: ThemeConfig): string {
  const animations: string[] = [];

  Object.entries(theme.animations.keyframes).forEach(([name, keyframe]) => {
    const keyframeRules = Object.entries(keyframe)
      .map(([percentage, styles]) => {
        const styleRules = Object.entries(styles)
          .map(([property, value]) => `${property}: ${value};`)
          .join(' ');
        return `  ${percentage} { ${styleRules} }`;
      })
      .join('\n');

    animations.push(`@keyframes ${name} {\n${keyframeRules}\n}`);
  });

  // Animation utility classes
  Object.keys(theme.animations.keyframes).forEach((name) => {
    animations.push(`.animate-${name} { animation: ${name} var(--transition-duration-normal) var(--transition-timing-ease); }`);
  });

  return `/* Animations */\n${animations.join('\n\n')}`;
}

/**
 * Generate responsive CSS
 */
export function generateResponsiveCSS(theme: ThemeConfig): string {
  const breakpoints = theme.layout.breakpoints;
  const responsive: string[] = [];

  Object.entries(breakpoints).forEach(([size, value]) => {
    responsive.push(`
@media (min-width: ${value}) {
  .container-${size} {
    max-width: var(--container-max-width-${size});
    margin-left: auto;
    margin-right: auto;
    padding-left: var(--spacing-4);
    padding-right: var(--spacing-4);
  }
}
`);
  });

  return responsive.join('\n');
}

/**
 * Validate theme configuration
 */
export function validateTheme(theme: ThemeConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required fields
  if (!theme.id) errors.push('Theme ID is required');
  if (!theme.name) errors.push('Theme name is required');
  if (!theme.version) errors.push('Theme version is required');

  // Check color palette completeness
  const requiredColors = ['primary', 'secondary', 'neutral', 'success', 'warning', 'error'];
  const requiredShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

  requiredColors.forEach((color) => {
    const colorKey = color as keyof typeof theme.colors;
    if (!theme.colors[colorKey]) {
      errors.push(`Missing color palette: ${color}`);
    } else {
      const colorPalette = theme.colors[colorKey] as Record<string, string>;
      requiredShades.forEach((shade) => {
        if (!colorPalette[shade]) {
          errors.push(`Missing color shade: ${color}-${shade}`);
        }
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}