import React, { useState, useEffect } from 'react';
import { Train, Clock } from 'lucide-react';

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
    <header className="mb-6" role="banner">
      <div className="glass rounded-2xl p-4 sm:p-6 shadow-card">
        <div className="flex justify-between items-center gap-4 flex-col sm:flex-row text-center sm:text-left">
          
          {/* Left section - Title */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-2 rounded-xl">
              <Train className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                Jízdní řád Řež
              </h1>
              <p className="text-white/70 text-sm">
                Vlaky S4 a autobusy 371
              </p>
            </div>
          </div>

          {/* Right section - Time */}
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2">
            <Clock className="w-4 h-4 text-primary-400" aria-hidden="true" />
            <time 
              className="text-xl font-bold text-white font-mono"
              dateTime={currentTime.toISOString()}
              aria-label={`Aktuální čas: ${formatTime(currentTime)}`}
            >
              {formatTime(currentTime)}
            </time>
          </div>
        </div>
      </div>
    </header>
  );
};
