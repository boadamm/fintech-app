// App theme constants
const COLORS = {
  // Primary colors
  primary: '#FFD700', // Yellow
  
  // Background colors
  background: {
    dark: '#000000',
    card: '#121212',
    input: '#1E1E1E',
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#999999',
  },
  
  // Status colors
  status: {
    success: '#4CD964', // Green
    error: '#FF3B30', // Red
    warning: '#FFCC00', // Yellow
    info: '#5AC8FA', // Blue
  },
  
  // Other UI colors
  border: '#333333',
  divider: '#333333',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

const FONTS = {
  // Font families (would use actual fonts in a real app)
  regular: 'System',
  medium: 'System',
  bold: 'System',
  
  // Font sizes
  size: {
    xxs: 10,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  // Line heights
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 38,
  },
};

const SPACING = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  circle: 9999,
};

const SHADOW = {
  light: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dark: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

export default {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  SHADOW,
}; 