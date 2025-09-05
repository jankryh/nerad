import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeSelector: React.FC = () => {
  const { currentTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    const newTheme = currentTheme.id === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-transparent group"
      aria-label={`Přepnout na ${currentTheme.id === 'dark' ? 'světlé' : 'tmavé'} téma`}
      title={`Přepnout na ${currentTheme.id === 'dark' ? 'světlé' : 'tmavé'} téma`}
    >
      {currentTheme.id === 'dark' ? (
        <Sun className="w-4 h-4 text-yellow-400" aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4 text-blue-400" aria-hidden="true" />
      )}
      <span className="text-white/90 text-sm font-medium hidden sm:inline">
        {currentTheme.id === 'dark' ? 'Světlé' : 'Tmavé'}
      </span>
    </button>
  );
};
