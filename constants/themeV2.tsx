/**
 * 统一主题管理系统
 * 支持两套主题：黑白主题(Grok风格) 和 白蓝主题(Telegram风格)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ======================
// 存储实例 (延迟初始化)
// ======================
let storage: any = null;
const STORAGE_KEY = 'app-theme-mode';

const getStorage = () => {
  if (!storage) {
    try {
      const { MMKV } = require('react-native-mmkv');
      storage = new MMKV({ id: 'theme-storage' });
    } catch (e) {
      console.warn('MMKV not available:', e);
    }
  }
  return storage;
};

// ======================
// 主题类型定义
// ======================

export type ThemeMode = 'bw' | 'blue';

export interface ThemeColors {
  primary: string;
  primaryText: string;
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  accent: string;
  accentSecondary: string;
  button: string;
  buttonText: string;
  buttonDisabled: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  border: string;
  divider: string;
  shadow: string;
  userBubble: string;
  aiBubble: string;
  inputBackground: string;
  inputBorder: string;
  inputPlaceholder: string;
  navbarBackground: string;
  navbarBorder: string;
}

export interface ThemeTypography {
  h1: number;
  h1Weight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  h2: number;
  h2Weight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  h3: number;
  h3Weight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  body: number;
  bodyWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  bodySmall: number;
  bodySmallWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  caption: number;
  captionWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  captionSecondary: number;
  button: number;
  buttonWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  chatMessage: number;
  chatTime: number;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeBorderRadius {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface ThemeShadow {
  sm: { shadowColor: string; shadowOffset: { width: number; height: number }; shadowOpacity: number; shadowRadius: number; elevation: number };
  md: { shadowColor: string; shadowOffset: { width: number; height: number }; shadowOpacity: number; shadowRadius: number; elevation: number };
  lg: { shadowColor: string; shadowOffset: { width: number; height: number }; shadowOpacity: number; shadowRadius: number; elevation: number };
}

export interface ThemeAnimation {
  duration: { fast: number; normal: number; slow: number };
  easing: { easeIn: number[]; easeOut: number[]; easeInOut: number[]; linear: number[] };
}

export interface Theme {
  mode: ThemeMode;
  name: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  shadow: ThemeShadow;
  animation: ThemeAnimation;
}

// ======================
// 主题配置
// ======================

const spacing: ThemeSpacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

const borderRadius: ThemeBorderRadius = {
  sm: 4, md: 8, lg: 12, xl: 16, full: 9999,
};

const animation: ThemeAnimation = {
  duration: { fast: 150, normal: 300, slow: 500 },
  easing: { easeIn: [0.4, 0, 1, 1], easeOut: [0, 0, 0.2, 1], easeInOut: [0.4, 0, 0.2, 1], linear: [0, 0, 1, 1] },
};

// ----------------------
// 黑白主题 (Grok风格)
// ----------------------
const BWTheme: Theme = {
  mode: 'bw',
  name: '黑白主题 (Grok)',
  colors: {
    primary: '#FFFFFF',
    primaryText: '#000000',
    background: '#000000',
    backgroundSecondary: '#121212',
    backgroundTertiary: '#1A1A1A',
    card: '#1A1A1A',
    cardBorder: '#333333',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textTertiary: '#666666',
    textInverse: '#000000',
    accent: '#FFFFFF',
    accentSecondary: '#808080',
    button: '#FFFFFF',
    buttonText: '#000000',
    buttonDisabled: '#333333',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
    border: '#333333',
    divider: '#2A2A2A',
    shadow: 'rgba(0, 0, 0, 0.5)',
    userBubble: '#FFFFFF',
    aiBubble: '#1A1A1A',
    inputBackground: '#1A1A1A',
    inputBorder: '#333333',
    inputPlaceholder: '#666666',
    navbarBackground: '#000000',
    navbarBorder: '#1A1A1A',
  },
  typography: {
    h1: 32, h1Weight: '700',
    h2: 24, h2Weight: '600',
    h3: 20, h3Weight: '600',
    body: 16, bodyWeight: '400',
    bodySmall: 14, bodySmallWeight: '400',
    caption: 12, captionWeight: '400',
    captionSecondary: 11,
    button: 16, buttonWeight: '600',
    chatMessage: 16, chatTime: 11,
  },
  spacing,
  borderRadius,
  shadow: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8 },
  },
  animation,
};

// ----------------------
// 白蓝主题 (Telegram风格)
// ----------------------
const BlueTheme: Theme = {
  mode: 'blue',
  name: '白蓝主题 (Telegram)',
  colors: {
    primary: '#1E40AF',
    primaryText: '#FFFFFF',
    background: '#FFFFFF',
    backgroundSecondary: '#F8FAFC',
    backgroundTertiary: '#F1F5F9',
    card: '#FFFFFF',
    cardBorder: '#E2E8F0',
    text: '#1E293B',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    textInverse: '#FFFFFF',
    accent: '#3B82F6',
    accentSecondary: '#60A5FA',
    button: '#1E40AF',
    buttonText: '#FFFFFF',
    buttonDisabled: '#CBD5E1',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    border: '#E2E8F0',
    divider: '#F1F5F9',
    shadow: 'rgba(0, 0, 0, 0.1)',
    userBubble: '#DCF8C6',
    aiBubble: '#FFFFFF',
    inputBackground: '#FFFFFF',
    inputBorder: '#E2E8F0',
    inputPlaceholder: '#94A3B8',
    navbarBackground: '#FFFFFF',
    navbarBorder: '#E2E8F0',
  },
  typography: {
    h1: 32, h1Weight: '700',
    h2: 24, h2Weight: '600',
    h3: 20, h3Weight: '600',
    body: 16, bodyWeight: '400',
    bodySmall: 14, bodySmallWeight: '400',
    caption: 12, captionWeight: '400',
    captionSecondary: 11,
    button: 16, buttonWeight: '600',
    chatMessage: 16, chatTime: 11,
  },
  spacing,
  borderRadius,
  shadow: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  },
  animation,
};

// ======================
// 主题上下文
// ======================

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const defaultThemeMode: ThemeMode = 'blue';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(defaultThemeMode);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const s = getStorage();
      if (s) {
        const savedTheme = s.getString(STORAGE_KEY);
        if (savedTheme === 'bw' || savedTheme === 'blue') {
          setThemeModeState(savedTheme);
        }
      }
    } catch (e) {
      console.warn('Failed to load theme:', e);
    }
    setIsLoaded(true);
  }, []);

  const theme = themeMode === 'bw' ? BWTheme : BlueTheme;
  const isDark = themeMode === 'bw';

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      const s = getStorage();
      if (s) {
        s.set(STORAGE_KEY, mode);
      }
    } catch (e) {
      console.warn('Failed to save theme:', e);
    }
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useThemeMode(): ThemeMode {
  const { themeMode } = useTheme();
  return themeMode;
}

export function useThemeColors() {
  const { theme } = useTheme();
  return theme.colors;
}

// ======================
// 导出
// ======================

export { BWTheme, BlueTheme };

export const Themes: Record<ThemeMode, Theme> = {
  bw: BWTheme,
  blue: BlueTheme,
};
