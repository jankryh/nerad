import React, { useState, useEffect, useMemo } from 'react';
import { Departure } from '../types';
import { TRAVEL_TIMES, TRAVEL_TIME_CONFIG, PragueStation } from '../constants';
import {
  formatTime,
  getEnhancedTravelTime,
  calculateActualDepartureTime,
} from '../utils/timeCalculations';
import { logger } from '../utils/logger';
import { Train, Bus } from 'lucide-react';

interface DepartureBoardProps {
  departures: Departure[];
  targetDateTime?: Date | null;
  pragueStation?: PragueStation;
}

export const DepartureBoard: React.FC<DepartureBoardProps> = ({
  departures,
  targetDateTime = null,
  pragueStation = 'masarykovo',
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
            const travelTime = await getEnhancedTravelTime(departure, true, pragueStation);
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
  }, [departures, pragueStation]);

  const getTravelTime = (departure: Departure): number => {
    const hardcodedFallback = TRAVEL_TIMES[departure.mode];
    if (!TRAVEL_TIME_CONFIG.enableRealTimeInUI) return hardcodedFallback;

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
      const referenceTime = targetDateTime ?? new Date();
      const actualDepartureTime = calculateActualDepartureTime(departure);
      return Math.round((actualDepartureTime.getTime() - referenceTime.getTime()) / (1000 * 60));
    } catch {
      return null;
    }
  };

  const formatCountdown = (minutes: number): string => {
    if (targetDateTime) {
      const sign = minutes > 0 ? '+' : '';
      return `${sign}${minutes} min`;
    }
    if (minutes <= 0) return 'teď';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem === 0 ? `${hours}h` : `${hours}h ${rem}m`;
  };

  const sorted = useMemo(() =>
    [...departures].sort((a, b) =>
      calculateActualDepartureTime(a).getTime() - calculateActualDepartureTime(b).getTime()
    ), [departures]);

  const lineBadgeColor = (mode: 'train' | 'bus') =>
    mode === 'train'
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/15'
      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15';

  if (!departures.length) {
    return (
      <div className="glass rounded-xl border border-white/10 p-4 text-center">
        <p className="text-white/50 text-sm">
          {targetDateTime ? 'Žádné odjezdy v tomto čase' : 'Žádné odjezdy'}
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl border border-white/10 overflow-hidden" role="table" aria-label="Tabule odjezdů">
      <div
        className="flex items-center gap-2 px-3 py-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider border-b border-white/10"
        style={{ color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}
        role="row"
      >
        <div className="w-14 sm:w-16" role="columnheader">Odjezd</div>
        <div className="w-12 sm:w-14 text-center" role="columnheader">Linka</div>
        <div className="w-14 sm:w-16" role="columnheader">Příjezd</div>
        <div className="hidden sm:block w-14" role="columnheader">Cesta</div>
        <div className="flex-1 text-right" role="columnheader">Za</div>
      </div>

      {sorted.map((departure, index) => {
        const minutesUntil = getMinutesUntilDeparture(departure);
        const hasDelay = Boolean(departure.delay && departure.delay > 0);
        const travelMin = getTravelTime(departure);

        return (
          <div
            key={`${departure.line}-${departure.scheduledTime}-${index}`}
            className={`
              flex items-center gap-2 px-3 py-2.5 sm:py-3 transition-colors duration-150
              hover:bg-white/[0.03]
              ${index === 0 ? 'bg-white/[0.02]' : ''}
              ${index < sorted.length - 1 ? 'border-b border-white/[0.08]' : ''}
            `}
            role="row"
          >
            <div className="w-14 sm:w-16 flex-shrink-0" role="cell">
              <span
                className={`font-mono font-bold text-sm sm:text-base lg:text-lg ${hasDelay ? 'text-red-400' : 'text-white'}`}
              >
                {hasDelay
                  ? formatTime(calculateActualDepartureTime(departure).toISOString())
                  : formatTime(departure.scheduledTime)}
              </span>
              {hasDelay && (
                <span className="text-red-400 text-xs font-bold ml-1">+{departure.delay}</span>
              )}
            </div>

            <div className="w-12 sm:w-14 flex-shrink-0 flex justify-center" role="cell">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] sm:text-xs font-bold border ${lineBadgeColor(departure.mode)}`}>
                {departure.mode === 'train'
                  ? <Train className="w-3 h-3" aria-hidden="true" />
                  : <Bus className="w-3 h-3" aria-hidden="true" />}
                {departure.line}
              </span>
            </div>

            <div className="w-14 sm:w-16 flex-shrink-0" role="cell">
              <span className="font-mono text-sm sm:text-base text-zinc-300">
                {getArrivalTime(departure)}
              </span>
            </div>

            <div className="hidden sm:block w-14 flex-shrink-0" role="cell">
              <span className="text-xs text-zinc-500">{travelMin}min</span>
            </div>

            <div className="flex-1 text-right" role="cell">
              <span className={`font-mono font-bold text-sm sm:text-base lg:text-lg ${index === 0 ? 'text-primary-400' : 'text-white'}`}>
                {minutesUntil !== null ? formatCountdown(minutesUntil) : '--'}
              </span>
            </div>
          </div>
        );
      })}

    </div>
  );
};
