/**
 * Design System Tokens
 * Centralized design tokens for consistent styling across the application
 */

// #1 - Unified Color Palette
export const colors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',  // Main primary
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  // #7 - Status Colors (Accessibility-friendly)
  status: {
    success: {
      light: '#d1fae5',
      main: '#10b981',
      dark: '#065f46',
    },
    warning: {
      light: '#fef3c7',
      main: '#f59e0b',
      dark: '#92400e',
    },
    error: {
      light: '#fee2e2',
      main: '#ef4444',
      dark: '#991b1b',
    },
    info: {
      light: '#dbeafe',
      main: '#3b82f6',
      dark: '#1e40af',
    },
  },
  // #27 - Colorblind-safe Chart Palette
  charts: {
    1: '#0ea5e9',  // Sky blue
    2: '#f59e0b',  // Amber
    3: '#10b981',  // Emerald
    4: '#8b5cf6',  // Violet
    5: '#ef4444',  // Red
    6: '#ec4899',  // Pink
    7: '#14b8a6',  // Teal
    8: '#f97316',  // Orange
  },
};

// #2 - Gradient System
export const gradients = {
  primary: 'from-primary-600 to-primary-700',
  slate: 'from-slate-900 via-slate-800 to-slate-900',
  subtle: 'from-slate-50 to-white',
  warm: 'from-amber-50 to-white',
};

// #3 - Shadow System
export const shadows = {
  subtle: 'shadow-sm',              // 0 1px 2px rgba(0,0,0,0.05)
  soft: 'shadow',                   // 0 1px 3px rgba(0,0,0,0.1)
  medium: 'shadow-md',              // 0 4px 6px rgba(0,0,0,0.1)
  strong: 'shadow-xl',              // 0 20px 25px rgba(0,0,0,0.1)
  card: 'shadow-sm hover:shadow-md',
};

// #4 - Border Radius
export const radius = {
  sm: 'rounded-lg',    // 8px
  md: 'rounded-xl',    // 12px
  lg: 'rounded-2xl',   // 16px
  full: 'rounded-full',
};

// #5 - Icon Sizes
export const iconSizes = {
  sm: 'w-4 h-4',       // 16px
  md: 'w-5 h-5',       // 20px
  lg: 'w-6 h-6',       // 24px
};

// #9 - Spacing Scale (T-shirt sizing)
export const spacing = {
  xs: 'gap-1',    // 4px
  sm: 'gap-2',    // 8px
  md: 'gap-4',    // 16px
  lg: 'gap-6',    // 24px
  xl: 'gap-8',    // 32px
  '2xl': 'gap-12', // 48px
};

export const spacingValues = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

// #11 - Container Max Widths
export const containers = {
  narrow: 'max-w-3xl',   // Article/reading width
  content: 'max-w-5xl',  // Standard content
  wide: 'max-w-7xl',     // Dashboard/tables
};

// #13 - Card Padding
export const cardPadding = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

// #19-21 - Typography System
export const typography = {
  // Font sizes
  sizes: {
    xs: 'text-xs',      // 12px
    sm: 'text-sm',      // 14px
    base: 'text-base',  // 16px
    lg: 'text-lg',      // 18px
    xl: 'text-xl',      // 20px
    '2xl': 'text-2xl',  // 24px
    '3xl': 'text-3xl',  // 30px
    '4xl': 'text-4xl',  // 36px
  },
  // Font weights
  weights: {
    normal: 'font-normal',    // 400
    medium: 'font-medium',    // 500
    semibold: 'font-semibold', // 600
    bold: 'font-bold',        // 700
  },
  // Line heights
  leading: {
    tight: 'leading-tight',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
  },
  // Number formatting
  numbers: {
    tabular: 'tabular-nums',
    oldstyle: 'old-style-nums',
  },
};

// #23-24 - Button System
export const buttons = {
  // Base styles
  base: 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',

  // Variants
  variants: {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-500',
    secondary: 'bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-50 focus:ring-slate-500',
    tertiary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400',
    ghost: 'text-slate-700 hover:bg-slate-100 focus:ring-slate-400',
  },

  // Sizes
  sizes: {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-base rounded-xl',
    lg: 'px-6 py-3 text-lg rounded-xl',
  },
};

// #6 - Hover States
export const hovers = {
  card: 'hover:shadow-md hover:scale-[1.01] transition-all duration-200',
  button: 'hover:scale-[1.02] transition-transform duration-150',
  icon: 'hover:scale-110 transition-transform duration-150',
};

// #15 - Animation Durations
export const animations = {
  fast: 'duration-150',
  normal: 'duration-200',
  slow: 'duration-300',
  verySlow: 'duration-500',
};

// #18 - Chart Animation Settings
export const chartAnimations = {
  area: {
    duration: 500,
    easing: 'ease-in-out',
  },
  bar: {
    duration: 400,
    easing: 'ease-out',
  },
  line: {
    duration: 600,
    easing: 'linear',
  },
};

// #25 - Focus Ring System
export const focus = {
  ring: 'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  ringInset: 'focus:ring-2 focus:ring-inset focus:ring-primary-500',
};

// #26 - Disabled States
export const disabled = {
  opacity: 'disabled:opacity-50 disabled:cursor-not-allowed',
  pointer: 'disabled:pointer-events-none',
};

// #10 - Grid Patterns
export const grids = {
  // Standard responsive grid
  responsive: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  // Two column layout
  twoColumn: 'grid grid-cols-1 lg:grid-cols-2',
  // Three column layout
  threeColumn: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  // Stats grid
  stats: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

// Helper function to combine classes
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// Export as default object for convenience
const designSystem = {
  colors,
  gradients,
  shadows,
  radius,
  iconSizes,
  spacing,
  spacingValues,
  containers,
  cardPadding,
  typography,
  buttons,
  hovers,
  animations,
  chartAnimations,
  focus,
  disabled,
  grids,
  cn,
};

export default designSystem;
