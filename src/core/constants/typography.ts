// Typography constants
import { StyleSheet } from 'react-native';

export const typography = StyleSheet.create({
  // Headings
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  },

  // Body text
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },

  // Labels
  labelLarge: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  labelSmall: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
  },

  // Button text
  buttonLarge: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  button: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
  },
  buttonSmall: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
});

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
