import React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThemeIcons } from './themeIcons';

export type ThemeId = 'purple' | 'cinematic' | 'teal' | 'crimson' | 'sage' | 'light' | 'dark';

export type DarkModeAccent = 'green' | 'blue' | 'purple' | 'red' | 'yellow' | 'orange' | 'cyan';

export interface Theme {
  id: ThemeId;
  name: string;
  icon: React.ReactNode;
  colors: {
    // Backgrounds
    backgroundPrimary: string;
    backgroundSecondary: string;
    backgroundTertiary: string;
    backgroundElevated: string;
    // Accents
    accentPrimary: string;
    accentSecondary: string;
    accentHover: string;
    accentFocus: string;
    // Borders
    borderSubtle: string;
    borderDefault: string;
    borderEmphasis: string;
    // Text
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
  };
  gradient?: string; // Optional gradient overlay
}

// Dark mode accent color variants - maintaining similar saturation/lightness
// Base green: RGB(181, 255, 0) - bright yellow-green
export const darkModeAccents: Record<DarkModeAccent, {
  accentPrimary: string;
  accentSecondary: string;
  accentHover: string;
  accentFocus: string;
}> = {
  green: {
    accentPrimary: '181 255 0',    // Original bright green
    accentSecondary: '218 255 128', // Lighter variant
    accentHover: '200 240 0',      // Slightly dimmer
    accentFocus: '160 220 0',      // Dimmer for focus
  },
  blue: {
    accentPrimary: '0 181 255',    // Bright cyan-blue
    accentSecondary: '128 218 255', // Lighter variant
    accentHover: '0 200 240',      // Slightly dimmer
    accentFocus: '0 160 220',      // Dimmer for focus
  },
  purple: {
    accentPrimary: '181 0 255',     // Bright magenta-purple
    accentSecondary: '218 128 255', // Lighter variant
    accentHover: '200 0 240',      // Slightly dimmer
    accentFocus: '160 0 220',      // Dimmer for focus
  },
  red: {
    accentPrimary: '255 0 181',    // Bright magenta-red
    accentSecondary: '255 128 218', // Lighter variant
    accentHover: '240 0 200',      // Slightly dimmer
    accentFocus: '220 0 160',      // Dimmer for focus
  },
  yellow: {
    accentPrimary: '255 181 0',    // Bright yellow
    accentSecondary: '255 218 128', // Lighter variant
    accentHover: '240 200 0',      // Slightly dimmer
    accentFocus: '220 160 0',      // Dimmer for focus
  },
  orange: {
    accentPrimary: '255 128 0',    // Bright orange
    accentSecondary: '255 192 128', // Lighter variant
    accentHover: '240 140 0',      // Slightly dimmer
    accentFocus: '220 110 0',      // Dimmer for focus
  },
  cyan: {
    accentPrimary: '0 255 181',    // Bright cyan
    accentSecondary: '128 255 218', // Lighter variant
    accentHover: '0 240 200',      // Slightly dimmer
    accentFocus: '0 220 160',      // Dimmer for focus
  },
};

export const themes: Record<ThemeId, Theme> = {
  dark: {
    id: 'dark',
    name: 'Dark Mode',
    icon: ThemeIcons.dark,
    colors: {
      backgroundPrimary: '0 0 0',
      backgroundSecondary: '0 0 0',
      backgroundTertiary: '0 0 0',
      backgroundElevated: '5 5 5',
      accentPrimary: '181 255 0',
      accentSecondary: '218 255 128',
      accentHover: '200 240 0',
      accentFocus: '160 220 0',
      borderSubtle: '10 10 10',
      borderDefault: '20 20 20',
      borderEmphasis: '30 30 30',
      textPrimary: '255 255 255',
      textSecondary: '200 200 200',
      textTertiary: '150 150 150',
    },
  },
  light: {
    id: 'light',
    name: 'Light Mode',
    icon: ThemeIcons.light,
    gradient: 'radial-gradient(circle at 20% 20%, rgba(0, 102, 255, 0.06), transparent 60%), radial-gradient(circle at 80% 80%, rgba(0, 102, 255, 0.04), transparent 60%)',
    colors: {
      backgroundPrimary: '255 255 255',
      backgroundSecondary: '249 250 251',
      backgroundTertiary: '243 244 246',
      backgroundElevated: '255 255 255',
      accentPrimary: '0 102 255', // #0066ff
      accentSecondary: '51 133 255', // Lighter blue variant
      accentHover: '0 85 230', // Darker on hover
      accentFocus: '0 68 204', // Even darker on focus
      borderSubtle: '229 231 235',
      borderDefault: '209 213 219',
      borderEmphasis: '156 163 175',
      textPrimary: '15 23 42',
      textSecondary: '51 65 85',
      textTertiary: '71 85 105',
    },
  },
  purple: {
    id: 'purple',
    name: 'Purple Nebula',
    icon: ThemeIcons.purple,
    gradient: 'radial-gradient(circle at 20% 50%, rgba(124, 58, 237, 0.15), transparent 50%), radial-gradient(circle at 80% 80%, rgba(167, 139, 250, 0.1), transparent 50%)',
    colors: {
      backgroundPrimary: '11 13 20',
      backgroundSecondary: '19 21 31',
      backgroundTertiary: '26 29 46',
      backgroundElevated: '30 34 50',
      accentPrimary: '124 58 237',
      accentSecondary: '167 139 250',
      accentHover: '139 92 246',
      accentFocus: '109 40 217',
      borderSubtle: '30 41 59',
      borderDefault: '51 65 85',
      borderEmphasis: '71 85 105',
      textPrimary: '248 250 252',
      textSecondary: '148 163 184',
      textTertiary: '100 116 139',
    },
  },
  cinematic: {
    id: 'cinematic',
    name: 'Cinematic Orange',
    icon: ThemeIcons.cinematic,
    gradient: 'radial-gradient(circle at 30% 20%, rgba(255, 107, 53, 0.12), transparent 60%), radial-gradient(circle at 70% 80%, rgba(232, 93, 4, 0.08), transparent 60%)',
    colors: {
      backgroundPrimary: '10 10 11',
      backgroundSecondary: '20 18 16',
      backgroundTertiary: '28 25 23',
      backgroundElevated: '38 32 28',
      accentPrimary: '255 107 53',
      accentSecondary: '247 147 30',
      accentHover: '232 93 4',
      accentFocus: '194 65 12',
      borderSubtle: '38 32 28',
      borderDefault: '68 54 42',
      borderEmphasis: '87 72 58',
      textPrimary: '252 249 246',
      textSecondary: '161 147 137',
      textTertiary: '120 106 96',
    },
  },
  teal: {
    id: 'teal',
    name: 'Teal Modern',
    icon: ThemeIcons.teal,
    gradient: 'radial-gradient(circle at 10% 20%, rgba(6, 182, 212, 0.12), transparent 60%), radial-gradient(circle at 90% 90%, rgba(20, 184, 166, 0.08), transparent 60%)',
    colors: {
      backgroundPrimary: '8 15 25',
      backgroundSecondary: '15 23 38',
      backgroundTertiary: '21 31 50',
      backgroundElevated: '28 39 59',
      accentPrimary: '6 182 212',
      accentSecondary: '20 184 166',
      accentHover: '34 211 238',
      accentFocus: '8 145 178',
      borderSubtle: '28 39 59',
      borderDefault: '45 65 90',
      borderEmphasis: '71 91 120',
      textPrimary: '241 245 249',
      textSecondary: '148 169 191',
      textTertiary: '100 126 154',
    },
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson Cinema',
    icon: ThemeIcons.crimson,
    gradient: 'radial-gradient(circle at 25% 30%, rgba(220, 38, 38, 0.12), transparent 60%), radial-gradient(circle at 75% 70%, rgba(251, 113, 133, 0.08), transparent 60%)',
    colors: {
      backgroundPrimary: '11 11 14',
      backgroundSecondary: '20 17 20',
      backgroundTertiary: '30 24 28',
      backgroundElevated: '38 30 34',
      accentPrimary: '220 38 38',
      accentSecondary: '251 113 133',
      accentHover: '190 18 60',
      accentFocus: '153 27 27',
      borderSubtle: '38 30 34',
      borderDefault: '60 45 50',
      borderEmphasis: '82 60 68',
      textPrimary: '252 245 248',
      textSecondary: '163 145 151',
      textTertiary: '122 105 111',
    },
  },
  sage: {
    id: 'sage',
    name: 'Sage Green',
    icon: ThemeIcons.sage,
    gradient: 'radial-gradient(circle at 15% 25%, rgba(16, 185, 129, 0.12), transparent 60%), radial-gradient(circle at 85% 75%, rgba(110, 231, 183, 0.08), transparent 60%)',
    colors: {
      backgroundPrimary: '13 27 26',
      backgroundSecondary: '19 35 34',
      backgroundTertiary: '26 43 42',
      backgroundElevated: '32 51 49',
      accentPrimary: '16 185 129',
      accentSecondary: '110 231 183',
      accentHover: '5 150 105',
      accentFocus: '4 120 87',
      borderSubtle: '32 51 49',
      borderDefault: '52 71 68',
      borderEmphasis: '74 94 89',
      textPrimary: '245 250 249',
      textSecondary: '152 170 167',
      textTertiary: '112 130 127',
    },
  },
};

interface ThemeStore {
  currentTheme: ThemeId;
  darkModeAccent: DarkModeAccent;
  setTheme: (theme: ThemeId) => void;
  setDarkModeAccent: (accent: DarkModeAccent) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      currentTheme: 'dark',
      darkModeAccent: 'green',
      setTheme: (theme) => set({ currentTheme: theme }),
      setDarkModeAccent: (accent) => set({ darkModeAccent: accent }),
    }),
    {
      name: 'doublecheck-theme',
    }
  )
);
