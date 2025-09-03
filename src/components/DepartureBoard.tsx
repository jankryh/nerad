import React from 'react';
import { Departure } from '../types';
import { Clock, AlertCircle, ArrowRight, Timer } from 'lucide-react';

interface DepartureBoardProps {
  title: string | React.ReactElement | { icon: React.ReactElement; content: React.ReactElement };
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
  // Debug variable - set to true to add fake delay to first departure
  const DEBUG_ADD_DELAY = false;
  const DEBUG_DELAY_MINUTES = 7;

  // Calculate minutes until the next departure (accounting for delays)
  const getMinutesUntilNextDeparture = (departures: Departure[]): number | null => {
    if (!departures || departures.length === 0) return null;
    
    const now = new Date();
    
    // Find the next departure that hasn't happened yet
    for (const departure of departures) {
      // Apply debug delay to first departure only
      const debugDeparture = DEBUG_ADD_DELAY && departures.indexOf(departure) === 0 
        ? { ...departure, delay: DEBUG_DELAY_MINUTES }
        : departure;
      
      const scheduledTime = new Date(debugDeparture.scheduledTime);
      // Add delay if present
      const actualDepartureTime = debugDeparture.delay && debugDeparture.delay > 0 
        ? new Date(scheduledTime.getTime() + debugDeparture.delay * 60 * 1000)
        : scheduledTime;
      
      const minutesUntil = Math.round((actualDepartureTime.getTime() - now.getTime()) / (1000 * 60));
      
      if (minutesUntil > 0) {
        return minutesUntil;
      }
    }
    
    // If no upcoming departures in the list, calculate next one based on interval
    const lastDeparture = departures[departures.length - 1];
    const lastTime = new Date(lastDeparture.scheduledTime);
    const intervalMinutes = lastDeparture.mode === 'train' ? 30 : 60;
    const nextTime = new Date(lastTime.getTime() + intervalMinutes * 60 * 1000);
    const minutesUntil = Math.round((nextTime.getTime() - now.getTime()) / (1000 * 60));
    
    return Math.max(0, minutesUntil);
  };
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
            {typeof title === 'object' && 'content' in title ? title.content : title}
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
            {typeof title === 'object' && 'content' in title ? title.content : title}
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
            {typeof title === 'object' && 'content' in title ? title.content : title}
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
    <article className="glass glass-hover rounded-2xl sm:rounded-4xl border border-white/10 shadow-card hover:shadow-hover transition-all duration-400 group" role="region" aria-labelledby="departure-board-title">
      {/* Header */}
      <div className="p-3 sm:p-6 border-b border-white/10 bg-gradient-to-r from-white/[0.02] to-transparent">
        <div className="flex items-center justify-between gap-2">
          {/* Icon and title */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {typeof title === 'object' && 'icon' in title && (
              <div className="flex-shrink-0">
                {title.icon}
              </div>
            )}
            <div className="min-w-0">
              <h3 id="departure-board-title" className="text-white text-sm sm:text-xl font-bold tracking-wide truncate">
                {typeof title === 'object' && 'content' in title ? title.content : title}
              </h3>
            </div>
          </div>
          
          {/* Next departure info */}
          {!isLoading && !error && departures && departures.length > 0 && (
            <div className="flex-shrink-0">
              <span className="text-white/50 text-xs sm:text-sm font-normal">
                {(() => {
                  const minutesUntil = getMinutesUntilNextDeparture(departures);
                  return minutesUntil !== null ? `dalsi za: ${minutesUntil}min` : '';
                })()}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Departure cards */}
      <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
        {departures.map((departure, index) => {
          // Apply debug delay to first departure only
          const debugDeparture = DEBUG_ADD_DELAY && index === 0 
            ? { ...departure, delay: DEBUG_DELAY_MINUTES }
            : departure;
          
          return (
                      <div
            key={`${departure.line}-${departure.scheduledTime}-${index}`}
            className={`
              relative glass rounded-xl sm:rounded-3xl p-3 sm:p-6 border transition-all duration-300 group/card overflow-hidden
              ${index === 0 
                ? 'border-amber-400/40 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-yellow-500/10 shadow-lg shadow-amber-500/10' 
                : 'border-white/15 hover:border-white/25'
              }
            `}
            role="article"
            aria-label={`Odjezd v ${formatTime(debugDeparture.scheduledTime)}, ${debugDeparture.delay && debugDeparture.delay > 0 ? `zpoždění ${debugDeparture.delay} minut` : 'včas'}`}
          >

            
            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:gap-6 sm:items-center">
              {/* Mobile: Both times on same line */}
              <div className="sm:hidden">
                <div className="flex justify-between items-center">
                  {/* Departure time */}
                  <div className="text-left">
                    <div className="space-y-1">
                      {debugDeparture.delay !== null && debugDeparture.delay > 0 ? (
                        <>
                          <time className="block text-sm font-medium text-white/40 font-mono tracking-tight line-through">
                            {formatTime(debugDeparture.scheduledTime)}
                          </time>
                          <time 
                            className="block text-2xl font-bold text-red-400 font-mono tracking-tight"
                            dateTime={debugDeparture.scheduledTime}
                          >
                            {formatTime(new Date(new Date(debugDeparture.scheduledTime).getTime() + debugDeparture.delay * 60 * 1000).toISOString())}
                          </time>
                        </>
                      ) : (
                        <>
                          <div className="h-[20px]"></div>
                          <time 
                            className="block text-2xl font-bold text-white font-mono tracking-tight"
                            dateTime={debugDeparture.scheduledTime}
                          >
                            {formatTime(debugDeparture.scheduledTime)}
                          </time>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 justify-start mt-1">
                      <div className="text-white/70 text-xs font-semibold uppercase tracking-wide">Odjezd</div>
                      {debugDeparture.delay !== null && debugDeparture.delay > 0 && (
                        <span className="text-red-400 text-xs font-semibold">
                          (+{debugDeparture.delay}m)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrival time */}
                  <div className="text-right">
                    <div className="space-y-1">
                      {debugDeparture.delay !== null && debugDeparture.delay > 0 ? (
                        <>
                          <time className="block text-sm font-medium text-white/40 font-mono tracking-tight line-through">
                            {calculateArrivalTime(debugDeparture)}
                          </time>
                          <time className="block text-2xl font-bold text-red-400 font-mono tracking-tight">
                            {(() => {
                              const scheduledDeparture = new Date(debugDeparture.scheduledTime);
                              const delayedDeparture = new Date(scheduledDeparture.getTime() + debugDeparture.delay * 60 * 1000);
                              const travelMinutes = debugDeparture.mode === 'train' ? 18 : 28;
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
                        <>
                          <div className="h-[20px]"></div>
                          <time className="block text-2xl font-bold text-white/90 font-mono tracking-tight">
                            {calculateArrivalTime(debugDeparture)}
                          </time>
                        </>
                      )}
                    </div>
                    <div className="text-white/70 text-xs font-semibold uppercase tracking-wide mt-1">Příjezd</div>
                  </div>
                </div>
              </div>

              {/* Desktop: Departure time only */}
              <div className="hidden sm:flex items-center justify-center space-x-4">
                <div className="text-center flex-1 min-h-[80px] flex flex-col justify-center">
                  <div className="space-y-1">
                    {debugDeparture.delay !== null && debugDeparture.delay > 0 ? (
                      <>
                        <time className="block text-lg font-medium text-white/40 font-mono tracking-tight line-through">
                          {formatTime(debugDeparture.scheduledTime)}
                        </time>
                        <time 
                          className="block text-3xl font-bold text-red-400 font-mono tracking-tight"
                          dateTime={debugDeparture.scheduledTime}
                        >
                          {formatTime(new Date(new Date(debugDeparture.scheduledTime).getTime() + debugDeparture.delay * 60 * 1000).toISOString())}
                        </time>
                      </>
                    ) : (
                      <>
                        <div className="h-[28px]"></div>
                        <time 
                          className="block text-3xl font-bold text-white font-mono tracking-tight"
                          dateTime={debugDeparture.scheduledTime}
                        >
                          {formatTime(debugDeparture.scheduledTime)}
                        </time>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 justify-center mt-2">
                    <div className="text-white/70 text-sm font-semibold uppercase tracking-wide">Odjezd</div>
                    {debugDeparture.delay !== null && debugDeparture.delay > 0 && (
                      <span className="text-red-400 text-sm font-semibold">
                        (+{debugDeparture.delay}m)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Desktop: Arrow and travel info */}
              <div className="hidden sm:flex relative items-center justify-center min-h-[80px]">
                {/* Arrow centered with main times */}
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-0.5 bg-gradient-to-r from-primary-400/60 to-transparent"></div>
                  <ArrowRight className="w-5 h-5 text-primary-400 animate-pulse" aria-hidden="true" />
                  <div className="w-16 h-0.5 bg-gradient-to-l from-primary-400/60 to-transparent"></div>
                </div>
                {/* Travel time positioned below */}
                <div className="absolute bottom-2 text-center">
                  <div className="text-white/60 text-xs font-medium uppercase tracking-wider">
                    {debugDeparture.mode === 'train' ? '~18 min' : '~28 min'}
                  </div>
                </div>
              </div>
              
              {/* Desktop: Arrival time */}
              <div className="hidden sm:flex items-center space-x-4 justify-center sm:justify-end">
                <div className="text-center sm:text-right order-2 sm:order-1 min-h-[80px] flex flex-col justify-center">
                  <div className="space-y-1">
                    {debugDeparture.delay !== null && debugDeparture.delay > 0 ? (
                      <>
                        <time className="block text-lg font-medium text-white/40 font-mono tracking-tight line-through">
                          {calculateArrivalTime(debugDeparture)}
                        </time>
                        <time className="block text-3xl font-bold text-red-400 font-mono tracking-tight">
                          {(() => {
                            const scheduledDeparture = new Date(debugDeparture.scheduledTime);
                            const delayedDeparture = new Date(scheduledDeparture.getTime() + debugDeparture.delay * 60 * 1000);
                            const travelMinutes = debugDeparture.mode === 'train' ? 18 : 28;
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
                      <>
                        <div className="h-[28px]"></div>
                        <time className="block text-3xl font-bold text-white/90 font-mono tracking-tight">
                          {calculateArrivalTime(debugDeparture)}
                        </time>
                      </>
                    )}
                  </div>
                  <div className="text-white/70 text-sm font-semibold uppercase tracking-wide mt-2">Příjezd</div>
                </div>
              </div>
              
              {/* Mobile: Travel time info */}
              <div className="sm:hidden flex items-center justify-center gap-2 mt-2 pt-2 border-t border-white/10">
                <ArrowRight className="w-4 h-4 text-primary-400" aria-hidden="true" />
                <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
                  {debugDeparture.mode === 'train' ? '~18 min cesta' : '~28 min cesta'}
                </span>
              </div>
            </div>
            



          </div>
          );
        })}
      </div>
      

    </article>
  );
};
