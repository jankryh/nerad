import React, { useState, useEffect } from 'react';
import { Departure } from '../types';
import { TRAVEL_TIMES, TRAVEL_TIME_CONFIG } from '../constants';
import {
  formatTime,
  getEnhancedTravelTime,
  calculateActualDepartureTime,
} from '../utils/timeCalculations';
import { logger } from '../utils/logger';
import { Train, Bus } from 'lucide-react';

interface DepartureBoardProps {
  departures: Departure[];
  isLoading?: boolean;
  error?: string;
}

const LEAVE_BUFFER_MINUTES = 2;

type Urgency = 'missed' | 'leave-now' | 'soon' | 'relaxed';

export const DepartureBoard: React.FC<DepartureBoardProps> = ({
  departures,
  isLoading = false,
  error,
}) => {
  const [enhancedTravelTimes, setEnhancedTravelTimes] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (!TRAVEL_TIME_CONFIG.enableRealTimeInUI || departures.length === 0) {
      setEnhancedTravelTimes(new Map());
      return;
    }

    let cancelled = false;

    const calculateEnhancedTimes = async () => {
      const newTravelTimes = new Map<string, number>();

      await Promise.allSettled(
        departures.map(async (departure) => {
          const key = `${departure.tripId}-${departure.scheduledTime}`;
          try {
            const travelTime = await getEnhancedTravelTime(departure, true);
            newTravelTimes.set(key, travelTime);
          } catch (calculationError) {
            logger.warn('Failed to calculate travel time for departure', calculationError);
            newTravelTimes.set(key, TRAVEL_TIMES[departure.mode]);
          }
        }),
      );

      if (!cancelled) {
        setEnhancedTravelTimes(newTravelTimes);
      }
    };

    calculateEnhancedTimes().catch((calculationError) => {
      logger.warn('Failed to calculate enhanced times', calculationError);
    });

    return () => { cancelled = true; };
  }, [departures]);

  const getTravelTime = (departure: Departure): number => {
    const hardcodedFallback = TRAVEL_TIMES[departure.mode];
    if (!TRAVEL_TIME_CONFIG.enableRealTimeInUI) return hardcodedFallback;

    if (departure.delay && departure.delay > 0) {
      const delayedKey = `${departure.tripId}-${departure.scheduledTime}-delayed`;
      const delayedTravelTime = enhancedTravelTimes.get(delayedKey);
      if (delayedTravelTime && delayedTravelTime > 0) return delayedTravelTime;
    }

    const key = `${departure.tripId}-${departure.scheduledTime}`;
    const enhancedTime = enhancedTravelTimes.get(key);
    if (enhancedTime && enhancedTime > 0) return enhancedTime;

    return hardcodedFallback;
  };

  const getArrivalTime = (departure: Departure): string => {
    try {
      const actualDepartureTime = calculateActualDepartureTime(departure);
      const travelMinutes = getTravelTime(departure);
      const arrivalTime = new Date(actualDepartureTime.getTime() + travelMinutes * 60 * 1000);
      return arrivalTime.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '--:--';
    }
  };

  const getMinutesUntilDeparture = (departure: Departure): number | null => {
    try {
      const now = new Date();
      const actualDepartureTime = calculateActualDepartureTime(departure);
      return Math.round((actualDepartureTime.getTime() - now.getTime()) / (1000 * 60));
    } catch {
      return null;
    }
  };

  const getMinutesUntilLeave = (departure: Departure): number | null => {
    const minutesUntilDeparture = getMinutesUntilDeparture(departure);
    if (minutesUntilDeparture === null) return null;
    return minutesUntilDeparture - TRAVEL_TIMES[departure.mode] - LEAVE_BUFFER_MINUTES;
  };

  const formatCountdown = (minutes: number): string => {
    if (minutes <= 0) return 'teď';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem === 0 ? `${hours}h` : `${hours}h ${rem}m`;
  };

  const getUrgency = (departure: Departure): Urgency => {
    const minutesUntilLeave = getMinutesUntilLeave(departure);
    if (minutesUntilLeave === null || minutesUntilLeave < 0) return 'missed';
    if (minutesUntilLeave <= 1) return 'leave-now';
    if (minutesUntilLeave <= 5) return 'soon';
    return 'relaxed';
  };

  // Sort chronologically by actual departure time
  const sorted = [...departures].sort((a, b) => {
    return calculateActualDepartureTime(a).getTime() - calculateActualDepartureTime(b).getTime();
  });

  const nearestDeparture = sorted.find((d) => {
    const leave = getMinutesUntilLeave(d);
    return leave !== null && leave >= 0;
  });

  const viableCount = sorted.filter((d) => {
    const leave = getMinutesUntilLeave(d);
    return leave !== null && leave >= 0;
  }).length;

  const urgencyAccent = (urgency: Urgency, isNearest: boolean) => {
    if (isNearest) return 'border-l-primary-500 bg-primary-500/[0.06]';
    switch (urgency) {
      case 'leave-now': return 'border-l-red-500 bg-red-500/[0.04]';
      case 'soon': return 'border-l-amber-400 bg-amber-400/[0.04]';
      case 'missed': return 'border-l-white/20 opacity-50';
      default: return 'border-l-white/10';
    }
  };

  const LineIcon: React.FC<{ mode: 'train' | 'bus' }> = ({ mode }) => (
    mode === 'train'
      ? <Train className="w-3 h-3" aria-hidden="true" />
      : <Bus className="w-3 h-3" aria-hidden="true" />
  );

  const lineBadgeColor = (mode: 'train' | 'bus') =>
    mode === 'train'
      ? 'bg-primary-500/15 text-primary-400 border-primary-500/20'
      : 'bg-accent-500/15 text-accent-400 border-accent-500/20';

  if (isLoading) {
    return (
      <div className="glass rounded-xl border border-white/10 p-6 text-center" role="status">
        <div className="flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-white/20 border-t-primary-500 rounded-full animate-spin"></div>
          <span className="text-white/70 text-sm">Načítání spojů...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-xl border border-red-500/20 p-4" role="alert">
        <p className="text-red-400 text-sm font-medium">Chyba: {error}</p>
      </div>
    );
  }

  if (!departures.length) {
    return (
      <div className="glass rounded-xl border border-white/10 p-4 text-center">
        <p className="text-white/50 text-sm">Žádné odjezdy</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl border border-white/10 overflow-hidden" role="table" aria-label="Tabule odjezdů">
      {/* Table header */}
      <div
        className="flex items-center gap-2 px-3 py-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider border-b border-white/10"
        style={{ color: 'color-mix(in srgb, var(--color-text) 50%, transparent)' }}
        role="row"
      >
        <div className="w-1"></div>
        <div className="w-14 sm:w-16">Odjezd</div>
        <div className="w-12 sm:w-14 text-center">Linka</div>
        <div className="w-14 sm:w-16">Příjezd</div>
        <div className="hidden sm:block w-14">Cesta</div>
        <div className="flex-1 text-right">Za</div>
      </div>

      {/* Departure rows */}
      {sorted.map((departure, index) => {
        const isNearest = nearestDeparture?.tripId === departure.tripId
          && nearestDeparture?.scheduledTime === departure.scheduledTime;
        const minutesUntil = getMinutesUntilDeparture(departure);
        const hasDelay = Boolean(departure.delay && departure.delay > 0);
        const urgency = getUrgency(departure);
        const travelMin = getTravelTime(departure);

        return (
          <div
            key={`${departure.line}-${departure.scheduledTime}-${index}`}
            className={`
              flex items-center gap-2 px-3 py-2.5 sm:py-3 border-l-[3px] transition-colors duration-200
              ${urgencyAccent(urgency, isNearest)}
              ${index < sorted.length - 1 ? 'border-b border-white/[0.05]' : ''}
            `}
            role="row"
            aria-label={`${departure.line} v ${formatTime(departure.scheduledTime)}${hasDelay ? `, zpoždění ${departure.delay} min` : ''}`}
          >
            {/* Departure time */}
            <div className="w-14 sm:w-16 flex-shrink-0">
              <span
                className={`font-mono font-bold text-sm sm:text-base ${hasDelay ? 'text-red-400' : 'text-white'}`}
                style={!hasDelay && isNearest ? { textShadow: '0 0 12px rgba(245, 158, 11, 0.4)' } : undefined}
              >
                {hasDelay
                  ? formatTime(calculateActualDepartureTime(departure).toISOString())
                  : formatTime(departure.scheduledTime)}
              </span>
              {hasDelay && (
                <span className="text-red-400 text-[10px] font-bold ml-0.5">+{departure.delay}</span>
              )}
            </div>

            {/* Line badge */}
            <div className="w-12 sm:w-14 flex-shrink-0 flex justify-center">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] sm:text-xs font-bold border ${lineBadgeColor(departure.mode)}`}>
                <LineIcon mode={departure.mode} />
                {departure.line}
              </span>
            </div>

            {/* Arrival time */}
            <div className="w-14 sm:w-16 flex-shrink-0">
              <span className="font-mono text-sm sm:text-base text-neon-cyan/80">
                {getArrivalTime(departure)}
              </span>
            </div>

            {/* Travel duration — hidden on mobile */}
            <div className="hidden sm:block w-14 flex-shrink-0">
              <span className="text-xs text-white/40">{travelMin}min</span>
            </div>

            {/* Countdown */}
            <div className="flex-1 text-right">
              <span
                className={`font-mono font-semibold text-sm sm:text-base ${
                  urgency === 'leave-now' ? 'text-red-400 animate-pulse' :
                  urgency === 'soon' ? 'text-amber-400' :
                  urgency === 'missed' ? 'text-white/30' :
                  isNearest ? 'text-primary-400' : 'text-white/70'
                }`}
              >
                {minutesUntil !== null ? formatCountdown(minutesUntil) : '--'}
              </span>
            </div>
          </div>
        );
      })}

      {/* Footer — viable count */}
      <div
        className="flex items-center justify-between px-3 py-2 border-t border-white/10 text-[10px] sm:text-[11px] uppercase tracking-wider"
        style={{ color: 'color-mix(in srgb, var(--color-text) 45%, transparent)' }}
      >
        <span>{viableCount}/{sorted.length} stihnutelných</span>
        {nearestDeparture && (
          <span className="text-primary-500">
            ● nejbližší: {nearestDeparture.line} v {formatTime(
              calculateActualDepartureTime(nearestDeparture).toISOString()
            )}
          </span>
        )}
      </div>
    </div>
  );
};
