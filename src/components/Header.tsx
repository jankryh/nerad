import React, { useState, useEffect } from 'react';
import { Train, Clock } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';

export const Header: React.FC = () => {
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
      <div className="glass rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-card">
        <div className="flex justify-between items-center gap-2 sm:gap-4">
          
          {/* Left section - Title */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-1.5 sm:p-2 rounded-lg sm:rounded-xl flex-shrink-0">
              <Train className="w-4 h-4 sm:w-6 sm:h-6 text-white" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-white leading-tight truncate">
                Jízdní řád Řež
              </h1>
              <p className="text-white/70 text-xs sm:text-sm truncate">
                Vlaky S4 a autobusy 371
              </p>
            </div>
          </div>

          {/* Right section - Time and Theme Selector */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Selector */}
            <ThemeSelector />
            
            {/* Time */}
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
    </header>
  );
};
