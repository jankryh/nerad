import React, { useState, useEffect } from 'react';
import { Train, Clock, MapPin, Activity } from 'lucide-react';

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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('cs-CZ', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <header className="relative mb-12" role="banner">
      {/* Main header card */}
      <div className="glass glass-hover rounded-4xl p-6 sm:p-8 lg:p-10 shadow-card hover:shadow-hover transition-all duration-400 group">
        <div className="flex justify-between items-start gap-6 sm:gap-8 flex-col xl:flex-row text-center xl:text-left">
          
          {/* Left section - Title and description */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-center xl:justify-start flex-col sm:flex-row gap-4">
              <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-4 rounded-3xl shadow-glow group-hover:shadow-glow-lg transition-all duration-400">
                <Train className="w-10 h-10 text-white" aria-hidden="true" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight text-shadow-md tracking-tight">
                  Jízdní řád Řež
                </h1>
                <div className="flex items-center justify-center sm:justify-start text-white/70 text-base mt-2">
                  <MapPin className="w-5 h-5 mr-2 flex-shrink-0" aria-hidden="true" />
                  <span className="font-medium">Praha - Řež</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-white/90 text-xl font-semibold leading-relaxed">
                Aktuální odjezdy vlaků S4 a autobusů 371
              </p>
              
              <div className="flex flex-wrap gap-3 justify-center xl:justify-start">
                <div className="bg-blue-500/15 backdrop-blur-sm text-blue-200 px-4 py-2 rounded-2xl text-sm font-semibold border border-blue-400/20 flex items-center gap-2 hover:bg-blue-500/25 transition-colors duration-200">
                  <Train className="w-4 h-4" aria-hidden="true" />
                  <span>Vlaky S4</span>
                </div>
                <div className="bg-emerald-500/15 backdrop-blur-sm text-emerald-200 px-4 py-2 rounded-2xl text-sm font-semibold border border-emerald-400/20 flex items-center gap-2 hover:bg-emerald-500/25 transition-colors duration-200">
                  <svg className="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17l4 4 4-4m-4-5v9m-8-9a9 9 0 1118 0 9 9 0 01-18 0z" />
                  </svg>
                  <span>Autobusy 371</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right section - Time and date */}
          <div className="flex flex-col items-center xl:items-end gap-6 min-w-0">
            <div className="glass rounded-3xl p-6 sm:p-8 border border-white/10 text-center xl:text-right shadow-glass">
              <div className="flex items-center justify-center xl:justify-end mb-3">
                <Clock className="w-5 h-5 text-primary-400 mr-2 flex-shrink-0" aria-hidden="true" />
                <span className="text-white/80 text-sm font-semibold tracking-wide uppercase">Aktuální čas</span>
              </div>
              
              <time 
                className="block text-5xl sm:text-6xl font-bold text-white mb-3 font-mono tracking-tight text-shadow-sm"
                dateTime={currentTime.toISOString()}
                aria-label={`Aktuální čas: ${formatTime(currentTime)}`}
              >
                {formatTime(currentTime)}
              </time>
              
              <div className="text-white/60 text-base font-medium capitalize">
                {formatDate(currentTime)}
              </div>
            </div>

            {/* Enhanced status indicator */}
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/10">
              <div className="relative">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                <div className="absolute inset-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span className="text-white/80 text-sm font-semibold">Systém online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced decorative elements */}
      <div className="absolute -top-6 -left-6 w-32 h-32 bg-gradient-to-br from-primary-500/15 to-purple-500/15 rounded-full blur-3xl pointer-events-none animate-float"></div>
      <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-float" style={{animationDelay: '2s'}}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl pointer-events-none animate-pulse-slow"></div>
    </header>
  );
};
