export const theme = {
  colors: {
    primary: '#2563eb', // Example blue
    primaryDark: '#1d4ed8',
    secondary: '#10b981', // Example green
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    textLight: '#64748b',
    error: '#ef4444',
    success: '#22c55e',
    border: '#e2e8f0',
  },
  typography: {
    fontFamily: {
      regular: 'System', // Adjust once fonts are loaded
      medium: 'System',
      bold: 'System',
    },
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
  },
};
