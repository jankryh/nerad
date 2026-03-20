import React, { useState, useEffect } from 'react';
import { Train, Clock, RefreshCw } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, isRefreshing }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <header className="mb-4 sm:mb-6" role="banner">
      <div className="liquid-glass rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-card">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex justify-between items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="bg-gradient-to-br from-cyan-500 to-teal-500 p-1.5 sm:p-2 rounded-lg sm:rounded-xl flex-shrink-0 shadow-glow-cyan">
                <Train className="w-4 h-4 sm:w-6 sm:h-6 text-white" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="inline-flex items-center rounded-full border border-teal-400/20 bg-teal-500/10 px-2 py-0.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">
                    Live PID
                  </span>
                </div>
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-white leading-tight truncate">
                  Řež ↔ Praha
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 focus:from-cyan-700 focus:to-teal-700 text-white font-semibold px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-glow-cyan focus:shadow-glow-cyan focus-ring active:scale-95"
                aria-label={isRefreshing ? 'Načítání dat...' : 'Ručně obnovit data o odjezdech'}
                title={isRefreshing ? 'Načítání dat...' : 'Obnovit data'}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
                <span className="hidden sm:inline">{isRefreshing ? 'Načítání...' : 'Obnovit'}</span>
              </button>

              <ThemeSelector />
              
              <div className="flex items-center gap-2 sm:gap-3 bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl px-2 sm:px-4 py-1.5 sm:py-2 flex-shrink-0">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-primary-400" aria-hidden="true" />
                <time 
                  className="text-sm sm:text-xl font-bold text-white font-mono"
                  dateTime={currentTime.toISOString()}
                  aria-label={`Aktuální čas: ${formatTime(currentTime)}`}
                >
                  {formatTime(currentTime)}
                </time>
              </div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
