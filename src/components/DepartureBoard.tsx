import React from 'react';
import { Departure } from '../types';
import { Clock, AlertCircle, CheckCircle2, ArrowRight, Zap, Timer } from 'lucide-react';

interface DepartureBoardProps {
  title: string | React.ReactElement;
  departures: Departure[];
  isLoading?: boolean;
  error?: string;
}

export const DepartureBoard: React.FC<DepartureBoardProps> = ({
  title,
  departures,
  isLoading = false,
  error
}) => {
  const formatTime = (isoTime: string): string => {
    try {
      const date = new Date(isoTime);
      return date.toLocaleTimeString('cs-CZ', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return '--:--';
    }
  };

  const calculateArrivalTime = (departure: Departure): string => {
    try {
      const departureTime = new Date(departure.scheduledTime);
      let arrivalTime: Date;
      
      if (departure.mode === 'train') {
        // Vlak S4: Řež ↔ Praha Masarykovo (cca 18 minut)
        arrivalTime = new Date(departureTime.getTime() + 18 * 60 * 1000); // +18 minut
      } else {
        // Autobus 371: Řež ↔ Praha Kobylisy (cca 28 minut)
        arrivalTime = new Date(departureTime.getTime() + 28 * 60 * 1000); // +28 minut
      }
      
      return arrivalTime.toLocaleTimeString('cs-CZ', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return '--:--';
    }
  };





  if (isLoading) {
    return (
      <article className="glass glass-hover rounded-4xl border border-white/10 shadow-card transition-all duration-400" role="region" aria-label="Načítání odjezdů">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-white text-xl font-semibold flex items-center justify-center">
            {title}
          </h3>
        </div>
        <div className="p-12 text-center">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="w-8 h-8 border-3 border-white/20 border-t-primary-400 rounded-full animate-spin"></div>
            <Timer className="w-6 h-6 text-primary-400 animate-pulse" aria-hidden="true" />
          </div>
          <span className="text-white/80 text-lg font-medium">Načítání odjezdů...</span>
        </div>
      </article>
    );
  }

  if (error) {
    return (
      <article className="glass rounded-4xl border border-red-500/20 shadow-card" role="alert" aria-label="Chyba při načítání odjezdů">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-white text-xl font-semibold flex items-center justify-center">
            {title}
          </h3>
        </div>
        <div className="p-6">
          <div className="bg-red-500/15 backdrop-blur-sm border border-red-400/30 rounded-3xl p-6 flex items-start space-x-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-2">
              <h4 className="text-red-300 font-semibold">Chyba při načítání</h4>
              <p className="text-red-200/90 text-sm leading-relaxed">{error}</p>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (!departures || departures.length === 0) {
    return (
      <article className="glass rounded-4xl border border-white/10 shadow-card" role="region" aria-label="Žádné odjezdy">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-white text-xl font-semibold flex items-center justify-center">
            {title}
          </h3>
        </div>
        <div className="p-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-white/40" aria-hidden="true" />
            </div>
            <p className="text-white/60 text-lg font-medium">Žádné odjezdy</p>
            <p className="text-white/40 text-sm">Momentálně nejsou k dispozici žádné informace o odjezdech.</p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="glass glass-hover rounded-4xl border border-white/10 shadow-card hover:shadow-hover transition-all duration-400 group" role="region" aria-labelledby="departure-board-title">
      {/* Header */}
      <div className="p-6 border-b border-white/10 bg-gradient-to-r from-white/[0.02] to-transparent">
        <h3 id="departure-board-title" className="text-white text-xl font-bold flex items-center justify-center tracking-wide">
          {title}
        </h3>
      </div>
      
      {/* Departure cards */}
      <div className="p-6 space-y-4">
        {departures.map((departure, index) => (
                      <div
            key={`${departure.line}-${departure.scheduledTime}-${index}`}
            className={`
              relative glass rounded-3xl p-6 border transition-all duration-300 group/card
              ${index === 0 
                ? 'border-amber-400/40 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-yellow-500/10 shadow-lg shadow-amber-500/10' 
                : 'border-white/15 hover:border-white/25'
              }
            `}
            role="article"
            aria-label={`Odjezd v ${formatTime(departure.scheduledTime)}, ${departure.delay && departure.delay > 0 ? `zpoždění ${departure.delay} minut` : 'včas'}`}
          >
            {/* Next departure indicator */}
            {index === 0 && (
              <div className="absolute -top-3 left-6 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                <Zap className="w-3 h-3" aria-hidden="true" />
                <span>NÁSLEDUJÍCÍ</span>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
              {/* Departure time */}
              <div className="flex items-center space-x-4 justify-center sm:justify-start">
                <div className="bg-gradient-to-br from-primary-500/20 to-primary-600/20 p-4 rounded-2xl border border-primary-400/20 group-hover/card:shadow-glow transition-all duration-300">
                  <Clock className="w-6 h-6 text-primary-300" aria-hidden="true" />
                </div>
                <div className="text-center sm:text-left">
                  {departure.delay !== null && departure.delay > 0 ? (
                    <>
                      <time className="block text-lg font-medium text-white/40 font-mono tracking-tight line-through mb-1">
                        {formatTime(departure.scheduledTime)}
                      </time>
                      <time 
                        className="block text-3xl font-bold text-red-400 font-mono tracking-tight mb-1"
                        dateTime={departure.scheduledTime}
                      >
                        {formatTime(new Date(new Date(departure.scheduledTime).getTime() + departure.delay * 60 * 1000).toISOString())}
                      </time>
                    </>
                  ) : (
                    <time 
                      className="block text-3xl font-bold text-white font-mono tracking-tight mb-1"
                      dateTime={departure.scheduledTime}
                    >
                      {formatTime(departure.scheduledTime)}
                    </time>
                  )}
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <div className="text-white/70 text-sm font-semibold uppercase tracking-wide">Odjezd</div>
                    {departure.delay !== null && departure.delay > 0 && (
                      <span className="text-red-400 text-sm font-semibold">
                        (+{departure.delay}m)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Arrow and travel info */}
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-0.5 bg-gradient-to-r from-primary-400/60 to-transparent"></div>
                  <ArrowRight className="w-5 h-5 text-primary-400 animate-pulse" aria-hidden="true" />
                  <div className="w-16 h-0.5 bg-gradient-to-l from-primary-400/60 to-transparent"></div>
                </div>
                <div className="text-center">
                  <div className="text-white/60 text-xs font-medium uppercase tracking-wider">
                    {departure.mode === 'train' ? '~18 min' : '~28 min'}
                  </div>
                </div>
              </div>
              
              {/* Arrival time */}
              <div className="flex items-center space-x-4 justify-center sm:justify-end">
                <div className="text-center sm:text-right order-2 sm:order-1">
                  {departure.delay !== null && departure.delay > 0 ? (
                    <>
                      <time className="block text-lg font-medium text-white/40 font-mono tracking-tight line-through mb-1">
                        {calculateArrivalTime(departure)}
                      </time>
                      <time className="block text-3xl font-bold text-red-400 font-mono tracking-tight mb-1">
                        {(() => {
                          const scheduledDeparture = new Date(departure.scheduledTime);
                          const delayedDeparture = new Date(scheduledDeparture.getTime() + departure.delay * 60 * 1000);
                          const travelMinutes = departure.mode === 'train' ? 18 : 28;
                          const delayedArrival = new Date(delayedDeparture.getTime() + travelMinutes * 60 * 1000);
                          return delayedArrival.toLocaleTimeString('cs-CZ', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          });
                        })()}
                      </time>
                    </>
                  ) : (
                    <time className="block text-3xl font-bold text-white/90 font-mono tracking-tight mb-1">
                      {calculateArrivalTime(departure)}
                    </time>
                  )}
                  <div className="text-white/70 text-sm font-semibold uppercase tracking-wide">Příjezd</div>
                </div>
                <div className="bg-gradient-to-br from-white/10 to-white/5 p-4 rounded-2xl border border-white/10 order-1 sm:order-2">
                  <Clock className="w-6 h-6 text-white/80" aria-hidden="true" />
                </div>
              </div>
            </div>
            



          </div>
        ))}
      </div>
    </article>
  );
};
