'use client';

import { useEffect } from 'react';
import { useThemeStore, themes, darkModeAccents } from '@/lib/stores/themeStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const darkModeAccent = useThemeStore((state) => state.darkModeAccent);

  useEffect(() => {
    const theme = themes[currentTheme];
    const root = document.documentElement;

    // Apply all theme colors as CSS variables
    // Backgrounds
    root.style.setProperty('--background-primary', theme.colors.backgroundPrimary);
    root.style.setProperty('--background-secondary', theme.colors.backgroundSecondary);
    root.style.setProperty('--background-tertiary', theme.colors.backgroundTertiary);
    root.style.setProperty('--background-elevated', theme.colors.backgroundElevated);
    
    // Accents - use dark mode accent variants if dark mode is active
    if (currentTheme === 'dark') {
      const accentColors = darkModeAccents[darkModeAccent];
      root.style.setProperty('--accent-primary', accentColors.accentPrimary);
      root.style.setProperty('--accent-secondary', accentColors.accentSecondary);
      root.style.setProperty('--accent-hover', accentColors.accentHover);
      root.style.setProperty('--accent-focus', accentColors.accentFocus);
    } else {
      root.style.setProperty('--accent-primary', theme.colors.accentPrimary);
      root.style.setProperty('--accent-secondary', theme.colors.accentSecondary);
      root.style.setProperty('--accent-hover', theme.colors.accentHover);
      root.style.setProperty('--accent-focus', theme.colors.accentFocus);
    }
    
    // Borders
    root.style.setProperty('--border-subtle', theme.colors.borderSubtle);
    root.style.setProperty('--border-default', theme.colors.borderDefault);
    root.style.setProperty('--border-emphasis', theme.colors.borderEmphasis);
    
    // Text
    root.style.setProperty('--text-primary', theme.colors.textPrimary);
    root.style.setProperty('--text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--text-tertiary', theme.colors.textTertiary);
    
    // Apply gradient overlay if theme has one
    if (theme.gradient) {
      root.style.setProperty('--theme-gradient', theme.gradient);
    } else {
      root.style.setProperty('--theme-gradient', 'none');
    }
    
    // Set button text color on accent background
    // Light mode: blue background needs white text
    // Dark mode: bright accent colors need black text (except for very dark accents)
    if (currentTheme === 'light') {
      root.style.setProperty('--button-text-on-accent', '255 255 255'); // White for blue background
      root.style.setProperty('--colored-button-text', '255 255 255'); // White for colored buttons in light mode
    } else if (currentTheme === 'dark') {
      // For dark mode, check if accent is bright enough for black text
      const accentColors = darkModeAccents[darkModeAccent];
      const [r, g, b] = accentColors.accentPrimary.split(' ').map(Number);
      // Calculate luminance - if bright enough, use black text
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      root.style.setProperty('--button-text-on-accent', luminance > 0.5 ? '0 0 0' : '255 255 255');
      root.style.setProperty('--colored-button-text', '0 0 0'); // Black for colored buttons in dark mode
    } else {
      // For other themes, use white text as default
      root.style.setProperty('--button-text-on-accent', '255 255 255');
      root.style.setProperty('--colored-button-text', '255 255 255');
    }
  }, [currentTheme, darkModeAccent]);

  return <>{children}</>;
}

