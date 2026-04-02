import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { DirectionFilter as DirectionFilterType } from './DepartureGrid';

interface DirectionFilterProps {
  filter: DirectionFilterType;
  onChange: (filter: DirectionFilterType) => void;
}

const FILTER_OPTIONS: { value: DirectionFilterType; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'Vše', icon: null },
  { value: 'to-prague', label: 'Do Prahy', icon: <ArrowUp className="w-3.5 h-3.5" /> },
  { value: 'from-prague', label: 'Z Prahy', icon: <ArrowDown className="w-3.5 h-3.5" /> },
];

export const DirectionFilter: React.FC<DirectionFilterProps> = ({ filter, onChange }) => {
  return (
    <nav className="flex justify-center" aria-label="Filtr směru">
      <div className="inline-flex gap-1 p-1 rounded-xl glass border border-white/10">
        {FILTER_OPTIONS.map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`
              flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold
              transition-all duration-200 font-heading uppercase tracking-wider cursor-pointer
              ${filter === value
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-void-DEFAULT shadow-glow-gold'
                : 'text-white/60 hover:text-white/90 hover:bg-white/5'
              }
            `}
            aria-pressed={filter === value}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
};
