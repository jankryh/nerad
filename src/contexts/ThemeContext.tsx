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

// Předdefinovaná barevná témata — crypto design
export const THEMES: Record<string, ColorTheme> = {
  dark: {
    id: 'dark',
    name: 'Tmavé',
    description: 'Clean dark s blue akcenty',
    colors: {
      primary: '#3b82f6',
      primaryLight: '#60a5fa',
      primaryDark: '#2563eb',
      secondary: '#6366f1',
      accent: '#06b6d4',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      background: '#09090b',
      backgroundSecondary: '#18181b',
      text: '#fafafa',
      textSecondary: '#a1a1aa',
      glass: 'rgba(255, 255, 255, 0.03)',
      glassHover: 'rgba(255, 255, 255, 0.06)',
      glassBorder: 'rgba(255, 255, 255, 0.08)',
    },
    gradients: {
      background: '#09090b',
      card: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(99, 102, 241, 0.02) 100%)',
      button: '#3b82f6',
    },
  },
  light: {
    id: 'light',
    name: 'Světlé',
    description: 'Clean light s blue akcenty',
    colors: {
      primary: '#2563eb',
      primaryLight: '#3b82f6',
      primaryDark: '#1d4ed8',
      secondary: '#4f46e5',
      accent: '#0891b2',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      background: '#fafafa',
      backgroundSecondary: '#f4f4f5',
      text: '#09090b',
      textSecondary: '#71717a',
      glass: 'rgba(255, 255, 255, 0.8)',
      glassHover: 'rgba(255, 255, 255, 0.9)',
      glassBorder: 'rgba(0, 0, 0, 0.08)',
    },
    gradients: {
      background: '#fafafa',
      card: 'linear-gradient(135deg, rgba(37, 99, 235, 0.03) 0%, rgba(79, 70, 229, 0.02) 100%)',
      button: '#2563eb',
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

    // Apply theme styles — only color, background handled by CSS data-theme
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
