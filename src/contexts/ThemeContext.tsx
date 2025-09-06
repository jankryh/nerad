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
    description: 'Klasické tmavé téma s fialovými akcenty',
    colors: {
      primary: '#6366f1',
      primaryLight: '#818cf8',
      primaryDark: '#4f46e5',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      background: '#0f172a',
      backgroundSecondary: '#1e293b',
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      glass: 'rgba(255, 255, 255, 0.05)',
      glassHover: 'rgba(255, 255, 255, 0.1)',
      glassBorder: 'rgba(255, 255, 255, 0.1)',
    },
    gradients: {
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 20%, #16213e 40%, #0f3460 60%, #533483 80%, #1a1a2e 100%)',
      card: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
      button: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    },
  },
  light: {
    id: 'light',
    name: 'Světlé',
    description: 'Světlé téma s modrými akcenty',
    colors: {
      primary: '#1e40af',
      primaryLight: '#3b82f6',
      primaryDark: '#1e3a8a',
      secondary: '#7c3aed',
      accent: '#0891b2',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      background: '#ffffff',
      backgroundSecondary: '#f1f5f9',
      text: '#0f172a',
      textSecondary: 'rgba(15, 23, 42, 0.8)',
      glass: 'rgba(255, 255, 255, 0.95)',
      glassHover: 'rgba(255, 255, 255, 1)',
      glassBorder: 'rgba(0, 0, 0, 0.2)',
    },
    gradients: {
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 30%, #e2e8f0 70%, #cbd5e1 100%)',
      card: 'linear-gradient(135deg, rgba(30, 64, 175, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%)',
      button: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
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
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection and theme application
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      if (mobile) {
        // Force dark mode on mobile with direct styles
        const darkGradient = 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 20%, #16213e 40%, #0f3460 60%, #533483 80%, #1a1a2e 100%)';
        
        // Apply to all elements
        document.documentElement.style.setProperty('background-color', '#0f172a', 'important');
        document.documentElement.style.setProperty('background', darkGradient, 'important');
        document.documentElement.style.setProperty('color', '#ffffff', 'important');
        
        document.body.style.setProperty('background-color', '#0f172a', 'important');
        document.body.style.setProperty('background', darkGradient, 'important');
        document.body.style.setProperty('color', '#ffffff', 'important');
        
        const rootElement = document.getElementById('root');
        if (rootElement) {
          rootElement.style.setProperty('background-color', 'transparent', 'important');
          rootElement.style.setProperty('background', 'transparent', 'important');
        }
        
        // Add mobile class
        document.documentElement.classList.add('mobile-dark-mode');
      } else {
        // Remove mobile class and reset styles
        document.documentElement.classList.remove('mobile-dark-mode');
        document.documentElement.style.removeProperty('background-color');
        document.documentElement.style.removeProperty('background');
        document.documentElement.style.removeProperty('color');
        document.body.style.removeProperty('background-color');
        document.body.style.removeProperty('background');
        document.body.style.removeProperty('color');
        
        const rootElement = document.getElementById('root');
        if (rootElement) {
          rootElement.style.removeProperty('background-color');
          rootElement.style.removeProperty('background');
        }
      }
    };

    // Initial check
    checkMobile();
    
    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

    // Different handling for mobile vs desktop
    if (isMobile) {
      // On mobile, always force dark mode with direct styles
      const darkGradient = 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 20%, #16213e 40%, #0f3460 60%, #533483 80%, #1a1a2e 100%)';
      
      document.documentElement.style.setProperty('background-color', '#0f172a', 'important');
      document.documentElement.style.setProperty('background', darkGradient, 'important');
      document.documentElement.style.setProperty('color', '#ffffff', 'important');
      
      document.body.style.setProperty('background-color', '#0f172a', 'important');
      document.body.style.setProperty('background', darkGradient, 'important');
      document.body.style.setProperty('color', '#ffffff', 'important');
      
      const rootElement = document.getElementById('root');
      if (rootElement) {
        rootElement.style.setProperty('background-color', 'transparent', 'important');
        rootElement.style.setProperty('background', 'transparent', 'important');
      }
    } else {
      // On desktop, use normal theme application
      document.body.style.background = theme.gradients.background;
      document.body.style.backgroundColor = theme.colors.background;
      document.body.style.color = theme.colors.text;
    }
    
    // Odstranění třídy po dokončení animace
    setTimeout(() => {
      document.body.classList.remove('theme-transitioning');
    }, 300);
  };

  // Aplikování tématu při změně
  useEffect(() => {
    applyThemeToDocument(currentTheme);
  }, [currentTheme]);

  // Re-apply theme when mobile state changes
  useEffect(() => {
    applyThemeToDocument(currentTheme);
  }, [isMobile, currentTheme]);

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
