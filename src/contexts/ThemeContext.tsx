import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Definice barevných témat
export interface ColorTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    backgroundSecondary: string;
    text: string;
    textSecondary: string;
    glass: string;
    glassHover: string;
    glassBorder: string;
  };
  gradients: {
    background: string;
    card: string;
    button: string;
  };
}

// Předdefinovaná barevná témata - jen tmavé a světlé
export const THEMES: Record<string, ColorTheme> = {
  dark: {
    id: 'dark',
    name: 'Tmavé',
    description: 'Deep ocean téma s cyan/teal akcenty',
    colors: {
      primary: '#06b6d4',
      primaryLight: '#22d3ee',
      primaryDark: '#0891b2',
      secondary: '#0ea5e9',
      accent: '#10b981',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      background: '#0a1628',
      backgroundSecondary: '#0f1f3a',
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      glass: 'rgba(255, 255, 255, 0.03)',
      glassHover: 'rgba(255, 255, 255, 0.07)',
      glassBorder: 'rgba(255, 255, 255, 0.08)',
    },
    gradients: {
      background: 'linear-gradient(135deg, #050d1a 0%, #0a1628 20%, #0c1e3d 40%, #0e2a4f 60%, #0a2342 80%, #0a1628 100%)',
      card: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(20, 184, 166, 0.04) 100%)',
      button: 'linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%)',
    },
  },
  light: {
    id: 'light',
    name: 'Světlé',
    description: 'Ice white téma s teal akcenty',
    colors: {
      primary: '#0d9488',
      primaryLight: '#14b8a6',
      primaryDark: '#0f766e',
      secondary: '#0891b2',
      accent: '#10b981',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      background: '#f0f9ff',
      backgroundSecondary: '#e0f2fe',
      text: '#0f172a',
      textSecondary: 'rgba(15, 23, 42, 0.8)',
      glass: 'rgba(255, 255, 255, 0.85)',
      glassHover: 'rgba(255, 255, 255, 0.95)',
      glassBorder: 'rgba(0, 0, 0, 0.1)',
    },
    gradients: {
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 30%, #ccfbf1 60%, #cffafe 100%)',
      card: 'linear-gradient(135deg, rgba(13, 148, 136, 0.1) 0%, rgba(14, 165, 233, 0.06) 100%)',
      button: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)',
    },
  },
};

// Typ pro kontext
interface ThemeContextType {
  currentTheme: ColorTheme;
  setTheme: (themeId: string) => void;
  availableThemes: ColorTheme[];
}

// Vytvoření kontextu
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Hook pro použití kontextu
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Provider komponenta
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ColorTheme>(THEMES.dark);

  // Načtení uloženého tématu při inicializaci
  useEffect(() => {
    const savedTheme = localStorage.getItem('color-theme');
    if (savedTheme && THEMES[savedTheme]) {
      setCurrentTheme(THEMES[savedTheme]);
    } else {
      // Default to dark theme if no saved theme
      setCurrentTheme(THEMES.dark);
    }
  }, []);

  // Funkce pro změnu tématu
  const setTheme = (themeId: string) => {
    if (THEMES[themeId]) {
      setCurrentTheme(THEMES[themeId]);
      localStorage.setItem('color-theme', themeId);
      
      // Aplikování CSS proměnných
      applyThemeToDocument(THEMES[themeId]);
    }
  };

  // Aplikování tématu na dokument
  const applyThemeToDocument = (theme: ColorTheme) => {
    const root = document.documentElement;
    
    // Přidání třídy pro animaci změny tématu
    document.body.classList.add('theme-transitioning');
    
    // Nastavení data-theme atributu pro CSS selektory
    root.setAttribute('data-theme', theme.id);
    
    // Aplikování barev
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Aplikování gradientů
    Object.entries(theme.gradients).forEach(([key, value]) => {
      root.style.setProperty(`--gradient-${key}`, value);
    });

    // Apply theme styles
    document.body.style.background = theme.gradients.background;
    document.body.style.backgroundColor = theme.colors.background;
    document.body.style.color = theme.colors.text;
    
    // Odstranění třídy po dokončení animace
    setTimeout(() => {
      document.body.classList.remove('theme-transitioning');
    }, 300);
  };

  // Aplikování tématu při změně
  useEffect(() => {
    applyThemeToDocument(currentTheme);
  }, [currentTheme]);

  const value: ThemeContextType = {
    currentTheme,
    setTheme,
    availableThemes: Object.values(THEMES),
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
