'use client';

import { useEffect } from 'react';
import { useThemeStore, themes, darkModeAccents } from '@/lib/stores/themeStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const darkModeAccent = useThemeStore((state) => state.darkModeAccent);

  useEffect(() => {
    const theme = themes[currentTheme];
    const root = document.documentElement;

    // Apply all theme colors as CSS variables (including blue theme)
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
    
    // Apply gradient overlay consistent with theme (Maxton-style)
    let gradientValue = 'none';
    if (currentTheme === 'dark') {
      const accent = darkModeAccents[darkModeAccent];
      const [r, g, b] = accent.accentPrimary.split(' ').map(Number);
      gradientValue = `radial-gradient(ellipse 80% 50% at 20% 0%, rgba(${r}, ${g}, ${b}, 0.08), transparent 55%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(${r}, ${g}, ${b}, 0.05), transparent 50%)`;
    } else if (theme.gradient) {
      gradientValue = theme.gradient;
    }
    root.style.setProperty('--theme-gradient', gradientValue);
    
    // Set button text color on accent background
    if (currentTheme === 'light') {
      root.style.setProperty('--button-text-on-accent', '255 255 255');
      root.style.setProperty('--colored-button-text', '255 255 255');
    } else if (currentTheme === 'dark') {
      const accentColors = darkModeAccents[darkModeAccent];
      const [r, g, b] = accentColors.accentPrimary.split(' ').map(Number);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      root.style.setProperty('--button-text-on-accent', luminance > 0.5 ? '0 0 0' : '255 255 255');
      root.style.setProperty('--colored-button-text', '0 0 0');
    } else if (currentTheme === 'blue') {
      // Navy theme: bright green accent needs black text
      root.style.setProperty('--button-text-on-accent', '0 0 0');
      root.style.setProperty('--colored-button-text', '0 0 0');
    } else {
      root.style.setProperty('--button-text-on-accent', '255 255 255');
      root.style.setProperty('--colored-button-text', '255 255 255');
    }
  }, [currentTheme, darkModeAccent]);

  return <>{children}</>;
}

