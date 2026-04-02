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
    name: 'Crypto Dark',
    description: 'Void black s gold/purple neon akcenty',
    colors: {
      primary: '#F59E0B',
      primaryLight: '#FBBF24',
      primaryDark: '#D97706',
      secondary: '#8B5CF6',
      accent: '#00D4FF',
      success: '#22C55E',
      warning: '#FBBF24',
      error: '#EF4444',
      background: '#0a0a0f',
      backgroundSecondary: '#12121a',
      text: '#F8FAFC',
      textSecondary: 'rgba(248, 250, 252, 0.6)',
      glass: 'rgba(255, 255, 255, 0.03)',
      glassHover: 'rgba(255, 255, 255, 0.06)',
      glassBorder: 'rgba(255, 255, 255, 0.08)',
    },
    gradients: {
      background: 'linear-gradient(135deg, #050510 0%, #0a0a0f 20%, #0d0d1a 40%, #0f0a1a 60%, #0a0a14 80%, #0a0a0f 100%)',
      card: 'linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, rgba(139, 92, 246, 0.04) 100%)',
      button: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    },
  },
  light: {
    id: 'light',
    name: 'Crypto Light',
    description: 'Warm stone s výraznými gold/purple akcenty',
    colors: {
      primary: '#B45309',
      primaryLight: '#D97706',
      primaryDark: '#92400E',
      secondary: '#6D28D9',
      accent: '#0E7490',
      success: '#047857',
      warning: '#B45309',
      error: '#B91C1C',
      background: '#F5F0EB',
      backgroundSecondary: '#EDE5DB',
      text: '#1C1917',
      textSecondary: 'rgba(28, 25, 23, 0.65)',
      glass: 'rgba(255, 255, 255, 0.75)',
      glassHover: 'rgba(255, 255, 255, 0.88)',
      glassBorder: 'rgba(28, 25, 23, 0.12)',
    },
    gradients: {
      background: 'linear-gradient(135deg, #F5F0EB 0%, #EDE5DB 30%, #F0ECF5 60%, #F5F0EB 100%)',
      card: 'linear-gradient(135deg, rgba(180, 83, 9, 0.06) 0%, rgba(109, 40, 217, 0.04) 100%)',
      button: 'linear-gradient(135deg, #B45309 0%, #92400E 100%)',
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
