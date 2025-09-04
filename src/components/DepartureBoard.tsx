import React, { useState, useEffect } from 'react';
import { Departure, DepartureBoardTitle } from '../types';
import { Clock, AlertCircle, ArrowRight, Timer } from 'lucide-react';
import { TRAVEL_TIMES, TRAVEL_TIME_CONFIG } from '../constants';
import {
  getMinutesUntilNextDeparture,
  formatTime,
  getEnhancedTravelTime
} from '../utils/timeCalculations';

interface DepartureBoardProps {
  title: DepartureBoardTitle;
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
  const DEBUG_DELAY_MINUTES = 1;

  // State for enhanced travel times
  const [enhancedTravelTimes, setEnhancedTravelTimes] = useState<Map<string, number>>(new Map());
  const [isCalculatingTimes, setIsCalculatingTimes] = useState(false);

  // Helper function to get debug departure with delay applied
  const getDebugDeparture = (departure: Departure, index: number): Departure => {
    return DEBUG_ADD_DELAY && index === 0 
      ? { ...departure, delay: DEBUG_DELAY_MINUTES }
      : departure;
  };

  // Enhanced travel time calculation
  const calculateEnhancedTimes = async (departures: Departure[]) => {
    if (!TRAVEL_TIME_CONFIG.enableRealTimeInUI || !departures.length) {
      return;
    }

    setIsCalculatingTimes(true);
    const newTravelTimes = new Map<string, number>();

    try {
      // Calculate enhanced times for each departure
      const promises = departures.map(async (departure, index) => {
        const key = `${departure.tripId}-${departure.scheduledTime}`;
        
        try {
          // Get enhanced travel time for original departure
          const travelTime = await getEnhancedTravelTime(departure, true);
          newTravelTimes.set(key, travelTime);
          
          // If this is the first departure and debug delay is enabled, also calculate for delayed departure
          if (DEBUG_ADD_DELAY && index === 0) {
            const delayedDeparture = { ...departure, delay: DEBUG_DELAY_MINUTES };
            const delayedKey = `${departure.tripId}-${departure.scheduledTime}-delayed`;
            try {
              const delayedTravelTime = await getEnhancedTravelTime(delayedDeparture, true);
              newTravelTimes.set(delayedKey, delayedTravelTime);
              console.log(`🔄 Calculated delayed travel time: ${delayedTravelTime} minutes for ${departure.line}`);
            } catch (error) {
              console.warn(`Failed to calculate delayed travel time for ${delayedKey}:`, error);
              newTravelTimes.set(delayedKey, TRAVEL_TIMES[departure.mode]);
            }
          }
        } catch (error) {
          console.warn(`Failed to calculate enhanced times for ${key}:`, error);
          // Fallback to hardcoded values
          newTravelTimes.set(key, TRAVEL_TIMES[departure.mode]);
        }
      });

      await Promise.allSettled(promises);
      
      setEnhancedTravelTimes(newTravelTimes);
    } catch (error) {
      console.error('Error calculating enhanced times:', error);
    } finally {
      setIsCalculatingTimes(false);
    }
  };

  // Calculate enhanced times when departures change
  useEffect(() => {
    if (departures && departures.length > 0) {
      calculateEnhancedTimes(departures);
    }
  }, [departures]);

  // Helper function to get travel time (enhanced or hardcoded)
  const getTravelTime = (departure: Departure): number => {
    if (TRAVEL_TIME_CONFIG.enableRealTimeInUI) {
      // Check if this is a delayed departure and we have delayed travel time
      if (departure.delay && departure.delay > 0) {
        const delayedKey = `${departure.tripId}-${departure.scheduledTime}-delayed`;
        const delayedTravelTime = enhancedTravelTimes.get(delayedKey);
        if (delayedTravelTime) {
          console.log(`🚀 Using delayed travel time: ${delayedTravelTime} minutes for ${departure.line}`);
          return delayedTravelTime;
        }
      }
      
      // Fallback to regular enhanced travel time
      const key = `${departure.tripId}-${departure.scheduledTime}`;
      return enhancedTravelTimes.get(key) || TRAVEL_TIMES[departure.mode];
    }
    return TRAVEL_TIMES[departure.mode];
  };

  // Helper function to calculate arrival time with enhanced travel time and delay
  const calculateArrivalTimeWithDelay = (departure: Departure): string => {
    try {
      // Get the actual departure time (with delay)
      const scheduledTime = new Date(departure.scheduledTime);
      const actualDepartureTime = departure.delay && departure.delay > 0
        ? new Date(scheduledTime.getTime() + departure.delay * 60 * 1000)
        : scheduledTime;
      
      // Get travel time (enhanced or hardcoded)
      const travelMinutes = getTravelTime(departure);
      
      // Calculate arrival time
      const arrivalTime = new Date(actualDepartureTime.getTime() + travelMinutes * 60 * 1000);
      
      return arrivalTime.toLocaleTimeString('cs-CZ', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return '--:--';
    }
  };

  // Helper function to calculate scheduled arrival time with enhanced travel time (no delay)
  const calculateScheduledArrivalTime = (departure: Departure): string => {
    try {
      // Use scheduled time (no delay)
      const scheduledTime = new Date(departure.scheduledTime);
      
      // Get travel time (enhanced or hardcoded) - use original departure for scheduled time
      const originalDeparture = { ...departure, delay: null };
      const travelMinutes = getTravelTime(originalDeparture);
      
      // Calculate scheduled arrival time
      const arrivalTime = new Date(scheduledTime.getTime() + travelMinutes * 60 * 1000);
      
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
            <div className="flex-shrink-0 flex items-center gap-2">
              <span className="text-white/50 text-xs sm:text-sm font-normal">
                {(() => {
                  const minutesUntil = getMinutesUntilNextDeparture(departures);
                  return minutesUntil !== null ? `dalsi za: ${minutesUntil}min` : '';
                })()}
              </span>
              {TRAVEL_TIME_CONFIG.enableRealTimeInUI && isCalculatingTimes && (
                <span className="text-primary-400 text-xs animate-pulse" title="Calculating real-time travel duration">
                  ⏳
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Departure cards */}
      <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
        {departures.map((departure, index) => {
          // Apply debug delay to first departure only
          const debugDeparture = getDebugDeparture(departure, index);
          
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
            aria-label={`Odjezd ${debugDeparture.line} v ${formatTime(debugDeparture.scheduledTime)}, ${debugDeparture.delay && debugDeparture.delay > 0 ? `zpoždění ${debugDeparture.delay} minut` : 'včas'}`}
            aria-describedby={`departure-${index}-details`}
          >

            
            <div 
              id={`departure-${index}-details`}
              className="flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:gap-6 sm:items-center"
              role="group"
              aria-label={`Detaily odjezdu ${debugDeparture.line}`}
            >
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
                            dateTime={new Date(new Date(debugDeparture.scheduledTime).getTime() + debugDeparture.delay * 60 * 1000).toISOString()}
                            aria-label={`Skutečný čas odjezdu: ${formatTime(new Date(new Date(debugDeparture.scheduledTime).getTime() + debugDeparture.delay * 60 * 1000).toISOString())}`}
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
                            aria-label={`Naplánovaný čas odjezdu: ${formatTime(debugDeparture.scheduledTime)}`}
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
                            {calculateScheduledArrivalTime(departure)}
                          </time>
                          <time 
                            className="block text-2xl font-bold text-red-400 font-mono tracking-tight"
                            aria-label={`Skutečný čas příjezdu: ${calculateArrivalTimeWithDelay(debugDeparture)}`}
                          >
                            {calculateArrivalTimeWithDelay(debugDeparture)}
                          </time>
                        </>
                      ) : (
                        <>
                          <div className="h-[20px]"></div>
                          <time 
                            className="block text-2xl font-bold text-white/90 font-mono tracking-tight"
                            aria-label={`Naplánovaný čas příjezdu: ${calculateArrivalTimeWithDelay(debugDeparture)}`}
                          >
                            {calculateArrivalTimeWithDelay(debugDeparture)}
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
                          dateTime={new Date(new Date(debugDeparture.scheduledTime).getTime() + debugDeparture.delay * 60 * 1000).toISOString()}
                          aria-label={`Skutečný čas odjezdu: ${formatTime(new Date(new Date(debugDeparture.scheduledTime).getTime() + debugDeparture.delay * 60 * 1000).toISOString())}`}
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
                          aria-label={`Naplánovaný čas odjezdu: ${formatTime(debugDeparture.scheduledTime)}`}
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
                    ~{getTravelTime(debugDeparture)} min
                    {TRAVEL_TIME_CONFIG.enableRealTimeInUI && isCalculatingTimes && (
                      <span className="ml-1 text-primary-400">⏳</span>
                    )}
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
                          {calculateScheduledArrivalTime(departure)}
                        </time>
                        <time 
                          className="block text-3xl font-bold text-red-400 font-mono tracking-tight"
                          aria-label={`Skutečný čas příjezdu: ${calculateArrivalTimeWithDelay(debugDeparture)}`}
                        >
                          {calculateArrivalTimeWithDelay(debugDeparture)}
                        </time>
                      </>
                    ) : (
                      <>
                        <div className="h-[28px]"></div>
                        <time 
                          className="block text-3xl font-bold text-white/90 font-mono tracking-tight"
                          aria-label={`Naplánovaný čas příjezdu: ${calculateArrivalTimeWithDelay(debugDeparture)}`}
                        >
                          {calculateArrivalTimeWithDelay(debugDeparture)}
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
                  ~{getTravelTime(debugDeparture)} min cesta
                  {TRAVEL_TIME_CONFIG.enableRealTimeInUI && isCalculatingTimes && (
                    <span className="ml-1 text-primary-400">⏳</span>
                  )}
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
