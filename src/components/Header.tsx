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
    <header className="mb-3 sm:mb-4" role="banner">
      <div className="glass rounded-xl p-3 sm:p-4 border border-white/10">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex justify-between items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="bg-primary-500/10 border border-primary-500/20 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                <Train className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-semibold text-white leading-tight truncate">
                    Řež ↔ Praha
                  </h1>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                    live
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-ring active:scale-95"
                aria-label={isRefreshing ? 'Načítání dat...' : 'Ručně obnovit data o odjezdech'}
                title={isRefreshing ? 'Načítání dat...' : 'Obnovit data'}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
                <span className="hidden sm:inline">{isRefreshing ? 'Načítání...' : 'Obnovit'}</span>
              </button>

              <ThemeSelector />

              <div className="flex items-center gap-2 sm:gap-3 bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl px-2 sm:px-4 py-1.5 sm:py-2 flex-shrink-0">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-400" aria-hidden="true" />
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
