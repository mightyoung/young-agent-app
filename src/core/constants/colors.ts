// Color palette for the app
export const colors = {
  // Primary colors
  primary: '#1890FF',
  primaryLight: '#40A9FF',
  primaryDark: '#096DD9',

  // Success/Warning/Error
  success: '#52C41A',
  warning: '#FAAD14',
  error: '#F5222D',
  info: '#1890FF',

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  background: '#F5F5F5',
  backgroundDark: '#1A1A1A',

  // Text colors
  textPrimary: '#262626',
  textSecondary: '#8C8C8C',
  textDisabled: '#BFBFBF',
  textInverse: '#FFFFFF',

  // Border colors
  border: '#D9D9D9',
  borderLight: '#E8E8E8',

  // Status colors
  statusNormal: '#52C41A',
  statusWarning: '#FAAD14',
  statusError: '#F5222D',
  statusOffline: '#8C8C8C',

  // Card colors
  cardBackground: '#FFFFFF',
  cardBackgroundDark: '#262626',

  // Tab bar
  tabActive: '#1890FF',
  tabInactive: '#8C8C8C',
};

// Dark mode colors
export const darkColors = {
  ...colors,
  background: '#1A1A1A',
  backgroundDark: '#0A0A0A',
  textPrimary: '#FFFFFF',
  textSecondary: '#8C8C8C',
  border: '#424242',
  borderLight: '#303030',
  cardBackground: '#262626',
  cardBackgroundDark: '#1A1A1A',
};

export type ColorScheme = typeof colors;
