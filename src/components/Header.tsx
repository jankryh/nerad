import React, { useState, useEffect } from 'react';
import { Train, Clock, RefreshCw, Sparkles, Zap } from 'lucide-react';
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

  const getContextBadge = () => {
    const hour = currentTime.getHours();

    if (hour >= 5 && hour < 10) {
      return {
        icon: <Zap className="w-3.5 h-3.5" aria-hidden="true" />,
        text: 'Ranní režim',
        className: 'border-amber-400/20 bg-amber-500/10 text-amber-100',
      };
    }

    if (hour >= 10 && hour < 16) {
      return {
        icon: <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />,
        text: 'Přes den',
        className: 'border-sky-400/20 bg-sky-500/10 text-sky-100',
      };
    }

    if (hour >= 16 && hour < 21) {
      return {
        icon: <Zap className="w-3.5 h-3.5" aria-hidden="true" />,
        text: 'Odpolední špička',
        className: 'border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-100',
      };
    }

    return {
      icon: <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />,
      text: 'Večerní klid',
      className: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100',
    };
  };

  const contextBadge = getContextBadge();

  return (
    <header className="mb-4 sm:mb-6" role="banner">
      <div className="glass rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-card">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex justify-between items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-1.5 sm:p-2 rounded-lg sm:rounded-xl flex-shrink-0">
                <Train className="w-4 h-4 sm:w-6 sm:h-6 text-white" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                    Live PID
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] sm:text-xs font-semibold ${contextBadge.className}`}>
                    {contextBadge.icon}
                    {contextBadge.text}
                  </span>
                </div>
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-white leading-tight truncate">
                  Řež ↔ Praha
                </h1>
                <p className="text-white/70 text-xs sm:text-sm truncate">
                  Chytřejší odjezdová tabule: kdy vyjít, co stíháš a co dává největší smysl
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 focus:from-primary-700 focus:to-purple-700 text-white font-semibold px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl focus:shadow-xl focus-ring active:scale-95"
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

          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs sm:text-sm text-white/75">
              <Sparkles className="w-4 h-4 text-primary-300" aria-hidden="true" />
              Doporučený spoj nahoře, alternativy pod ním
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs sm:text-sm text-white/75">
              <Zap className="w-4 h-4 text-amber-300" aria-hidden="true" />
              Urgence + odhad, kdy má smysl vyrazit
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
