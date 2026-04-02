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
    <nav className="flex justify-center mb-4" aria-label="Filtr směru">
      <div className="inline-flex gap-1 p-1 rounded-lg bg-zinc-900/50 border border-white/5">
        {FILTER_OPTIONS.map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`
              flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium
              transition-colors duration-150 cursor-pointer
              ${filter === value
                ? 'bg-primary-500 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
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
