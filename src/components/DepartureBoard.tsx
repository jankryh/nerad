import React, { useState, useEffect } from 'react';
import { Departure, DepartureBoardTitle } from '../types';
import { TRAVEL_TIMES, TRAVEL_TIME_CONFIG } from '../constants';
import {
  formatTime,
  getEnhancedTravelTime,
  calculateActualDepartureTime,
} from '../utils/timeCalculations';
import { logger } from '../utils/logger';

interface DepartureBoardProps {
  title: DepartureBoardTitle;
  departures: Departure[];
  isLoading?: boolean;
  error?: string;
}

const LEAVE_BUFFER_MINUTES = 2;

type Urgency = 'missed' | 'leave-now' | 'soon' | 'relaxed';

const PROGRESS_MAX_MINUTES = 180;

export const DepartureBoard: React.FC<DepartureBoardProps> = ({
  title,
  departures,
  isLoading = false,
  error,
}) => {
  const [enhancedTravelTimes, setEnhancedTravelTimes] = useState<Map<string, number>>(new Map());
  const [isCalculatingTimes, setIsCalculatingTimes] = useState(false);

  useEffect(() => {
    if (!TRAVEL_TIME_CONFIG.enableRealTimeInUI || departures.length === 0) {
      setEnhancedTravelTimes(new Map());
      return;
    }

    let cancelled = false;

    const calculateEnhancedTimes = async () => {
      setIsCalculatingTimes(true);
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
        setIsCalculatingTimes(false);
      }
    };

    calculateEnhancedTimes().catch((calculationError) => {
      logger.warn('Failed to calculate enhanced times', calculationError);
      if (!cancelled) {
        setIsCalculatingTimes(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [departures]);

  const getTravelTime = (departure: Departure): number => {
    const hardcodedFallback = TRAVEL_TIMES[departure.mode];

    if (!TRAVEL_TIME_CONFIG.enableRealTimeInUI) {
      return hardcodedFallback;
    }

    if (departure.delay && departure.delay > 0) {
      const delayedKey = `${departure.tripId}-${departure.scheduledTime}-delayed`;
      const delayedTravelTime = enhancedTravelTimes.get(delayedKey);
      if (delayedTravelTime && delayedTravelTime > 0) {
        return delayedTravelTime;
      }
    }

    const key = `${departure.tripId}-${departure.scheduledTime}`;
    const enhancedTime = enhancedTravelTimes.get(key);
    if (enhancedTime && enhancedTime > 0) {
      return enhancedTime;
    }

    // Vždy vrať hardcoded fallback — nikdy 0
    return hardcodedFallback;
  };

  const calculateArrivalTimeWithDelay = (departure: Departure): string => {
    try {
      const actualDepartureTime = calculateActualDepartureTime(departure);
      const travelMinutes = getTravelTime(departure);

      const arrivalTime = new Date(actualDepartureTime.getTime() + travelMinutes * 60 * 1000);
      return arrivalTime.toLocaleTimeString('cs-CZ', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
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

  const getWalkMinutes = (departure: Departure): number => {
    return TRAVEL_TIMES[departure.mode];
  };

  const getMinutesUntilLeave = (departure: Departure): number | null => {
    const minutesUntilDeparture = getMinutesUntilDeparture(departure);
    if (minutesUntilDeparture === null) {
      return null;
    }

    return minutesUntilDeparture - getWalkMinutes(departure) - LEAVE_BUFFER_MINUTES;
  };

  const formatMinutesUntilDeparture = (minutes: number): string => {
    if (minutes <= 0) {
      return 'teď';
    }

    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} h`;
    }

    return `${hours} h ${remainingMinutes} min`;
  };

  const formatTravelDuration = (departure: Departure): string => {
    const travelMinutes = getTravelTime(departure);

    if (travelMinutes < 60) {
      return `${travelMinutes} min`;
    }

    const hours = Math.floor(travelMinutes / 60);
    const remainingMinutes = travelMinutes % 60;
    return remainingMinutes === 0 ? `${hours} h` : `${hours} h ${remainingMinutes} min`;
  };

  const getUrgency = (departure: Departure): Urgency => {
    const minutesUntilLeave = getMinutesUntilLeave(departure);

    if (minutesUntilLeave === null || minutesUntilLeave < 0) {
      return 'missed';
    }

    if (minutesUntilLeave <= 1) {
      return 'leave-now';
    }

    if (minutesUntilLeave <= 5) {
      return 'soon';
    }

    return 'relaxed';
  };

  const getUrgencyClasses = (urgency: Urgency, highlighted: boolean) => {
    if (highlighted) {
      return 'border-amber-400/40 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-yellow-500/10 shadow-lg shadow-amber-500/10';
    }

    switch (urgency) {
      case 'leave-now':
        return 'border-red-400/30 bg-gradient-to-br from-red-500/10 via-rose-500/5 to-transparent';
      case 'soon':
        return 'border-yellow-400/30 bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent';
      case 'missed':
        return 'border-white/10 bg-white/[0.03] opacity-75';
      default:
        return 'border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent';
    }
  };

  const getProgressPercent = (departure: Departure): number => {
    const minutesUntilDeparture = getMinutesUntilDeparture(departure);

    if (minutesUntilDeparture === null) {
      return 0;
    }

    if (minutesUntilDeparture <= 0) {
      return 100;
    }

    const normalized = ((PROGRESS_MAX_MINUTES - minutesUntilDeparture) / PROGRESS_MAX_MINUTES) * 100;
    return Math.max(0, Math.min(100, normalized));
  };

  const nearestDeparture = [...departures].sort((a, b) => {
    const aTime = calculateActualDepartureTime(a).getTime();
    const bTime = calculateActualDepartureTime(b).getTime();
    return aTime - bTime;
  })[0];
  const viableCount = departures.filter((departure) => {
    const leave = getMinutesUntilLeave(departure);
    return leave !== null && leave >= 0;
  }).length;

  const subtlePanelStyle = {
    borderColor: 'var(--glass-border)',
    background: 'color-mix(in srgb, var(--color-backgroundSecondary) 70%, transparent)',
  } as const;

  const mutedLabelStyle = {
    color: 'color-mix(in srgb, var(--color-text) 55%, transparent)',
  } as const;

  const valueTextStyle = {
    color: 'color-mix(in srgb, var(--color-text) 88%, transparent)',
  } as const;

  const dividerStyle = {
    backgroundColor: 'color-mix(in srgb, var(--color-text) 12%, transparent)',
  } as const;

  const cardHeaderStyle = {
    borderColor: 'var(--glass-border)',
    background: 'linear-gradient(to right, color-mix(in srgb, var(--color-text) 3%, transparent), transparent)',
  } as const;

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
            <span className="text-primary-400 text-xl" aria-hidden="true">⏳</span>
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
            <span className="text-red-400 text-xl leading-none flex-shrink-0 mt-0.5" aria-hidden="true">⚠️</span>
            <div className="space-y-2">
              <h4 className="text-red-300 font-semibold">Chyba při načítání</h4>
              <p className="text-red-200/90 text-sm leading-relaxed">{error}</p>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (!departures.length) {
    return (
      <article className="glass rounded-4xl border border-white/10 shadow-card" role="region" aria-label="Žádné odjezdy">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-white text-xl font-semibold flex items-center justify-center">
            {typeof title === 'object' && 'content' in title ? title.content : title}
          </h3>
        </div>
        <div className="p-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center text-2xl text-white/40" aria-hidden="true">
              ⏱️
            </div>
            <p className="text-white/60 text-lg font-medium">Žádné odjezdy</p>
            <p className="text-white/40 text-sm">Momentálně nejsou k dispozici žádné informace o odjezdech.</p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="glass glass-hover rounded-2xl sm:rounded-4xl border border-white/10 shadow-card hover:shadow-hover transition-all duration-400 group" role="region">
      <div className="p-3 sm:p-6 border-b border-white/10" style={cardHeaderStyle}>
        <div className="flex items-center relative">
          {typeof title === 'object' && 'icon' in title && <div className="flex-shrink-0">{title.icon}</div>}

          <div className="absolute inset-0 flex items-center justify-center px-12 sm:px-16">
            <h3 className="text-white text-sm sm:text-xl font-bold tracking-wide text-center">
              {typeof title === 'object' && 'content' in title ? title.content : title}
            </h3>
          </div>

          {!isLoading && !error && departures.length > 0 && TRAVEL_TIME_CONFIG.enableRealTimeInUI && isCalculatingTimes && (
            <div className="absolute right-0 flex items-center gap-2">
              <span className="text-primary-400 text-xs animate-pulse" title="Calculating real-time travel duration">
                ⏳
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 gap-2">
          <div className="rounded-2xl border px-3 py-2.5" style={subtlePanelStyle}>
            <div className="text-[11px] font-semibold uppercase tracking-wide" style={mutedLabelStyle}>Stihnutelné</div>
            <div className="mt-1 text-sm font-semibold" style={valueTextStyle}>{viableCount} z {departures.length} spojů</div>
          </div>
        </div>

        {departures.map((departure, index) => {
          const isRecommended = nearestDeparture?.tripId === departure.tripId
            && nearestDeparture?.scheduledTime === departure.scheduledTime;
          const minutesUntil = getMinutesUntilDeparture(departure);
          const hasDelay = Boolean(departure.delay && departure.delay > 0);
          const urgency = getUrgency(departure);
          const progressPercent = getProgressPercent(departure);

          return (
            <div
              key={`${departure.line}-${departure.scheduledTime}-${index}`}
              className={`
                relative glass rounded-xl sm:rounded-3xl p-3 sm:p-6 border transition-all duration-300 group/card overflow-hidden
                ${getUrgencyClasses(urgency, isRecommended)}
              `}
              role="article"
              aria-label={`Odjezd ${departure.line} v ${formatTime(departure.scheduledTime)}, ${hasDelay ? `zpoždění ${departure.delay} minut` : 'včas'}`}
              aria-describedby={`departure-${index}-details`}
            >
              <div id={`departure-${index}-details`} className="space-y-4" role="group" aria-label={`Detaily odjezdu ${departure.line}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isRecommended ? (
                        <span className="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-200">
                          Nejbližší spoj
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
                          style={{
                            borderColor: 'var(--glass-border)',
                            background: 'color-mix(in srgb, var(--color-backgroundSecondary) 55%, transparent)',
                            color: 'color-mix(in srgb, var(--color-text) 68%, transparent)',
                          }}
                        >
                          Další spoj
                        </span>
                      )}

                      {hasDelay && (
                        <span className="inline-flex items-center rounded-full border border-red-400/20 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-200">
                          +{departure.delay} min
                        </span>
                      )}
                    </div>

                    <div className="flex items-end gap-4">
                      <div>
                        <div
                          className={`block text-2xl sm:text-3xl lg:text-4xl font-bold font-mono tracking-tight ${hasDelay ? 'text-red-400' : 'text-white'}`}
                        >
                          {hasDelay
                            ? formatTime(calculateActualDepartureTime(departure).toISOString())
                            : formatTime(departure.scheduledTime)}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide" style={mutedLabelStyle}>
                          <span>Odjezd</span>
                          {hasDelay && <span className="text-red-400">(+{departure.delay}m)</span>}
                        </div>
                      </div>

                      <div className="h-12 w-px" style={dividerStyle}></div>

                      <div>
                        <div className={`block text-2xl sm:text-3xl lg:text-4xl font-bold font-mono tracking-tight ${hasDelay ? 'text-red-400' : 'text-primary-300'}`}>
                          {calculateArrivalTimeWithDelay(departure)}
                        </div>
                        <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide" style={mutedLabelStyle}>Příjezd</div>
                      </div>
                    </div>

                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:min-w-[220px]">
                    <div className="rounded-2xl border px-3 py-2.5" style={subtlePanelStyle}>
                      <div className="text-[11px] font-semibold uppercase tracking-wide" style={mutedLabelStyle}>Odjíždí za</div>
                      <div
                        className="mt-1 text-sm sm:text-base font-semibold"
                        style={urgency === 'missed'
                          ? { color: 'color-mix(in srgb, var(--color-text) 45%, transparent)' }
                          : valueTextStyle}
                      >
                        {minutesUntil !== null ? formatMinutesUntilDeparture(minutesUntil) : '--'}
                      </div>
                    </div>
                    <div className="rounded-2xl border px-3 py-2.5" style={subtlePanelStyle}>
                      <div className="text-[11px] font-semibold uppercase tracking-wide" style={mutedLabelStyle}>Cesta</div>
                      <div className="mt-1 text-sm sm:text-base font-semibold" style={valueTextStyle}>{formatTravelDuration(departure)}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide" style={mutedLabelStyle}>
                    <span>Do odjezdu</span>
                    <span>{Math.round(progressPercent)} %</span>
                  </div>
                  <div
                    className="h-2.5 overflow-hidden rounded-full border"
                    style={{
                      borderColor: 'var(--glass-border)',
                      background: 'color-mix(in srgb, var(--color-backgroundSecondary) 65%, transparent)',
                    }}
                    aria-hidden="true"
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        urgency === 'missed'
                          ? 'bg-slate-400/40'
                          : 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
};
