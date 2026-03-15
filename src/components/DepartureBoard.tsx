import React, { useState, useEffect } from 'react';
import { Departure, DepartureBoardTitle } from '../types';
import {
  Clock,
  AlertCircle,
  Timer,
  Sparkles,
  Footprints,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Gauge,
  Siren,
} from 'lucide-react';
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

const DEBUG_ADD_DELAY = false;
const DEBUG_DELAY_MINUTES = 3;
const LEAVE_BUFFER_MINUTES = 2;
const PROGRESS_WINDOW_MINUTES = 30;

type Urgency = 'missed' | 'leave-now' | 'soon' | 'relaxed';

export const DepartureBoard: React.FC<DepartureBoardProps> = ({
  title,
  departures,
  isLoading = false,
  error,
}) => {
  const [enhancedTravelTimes, setEnhancedTravelTimes] = useState<Map<string, number>>(new Map());
  const [isCalculatingTimes, setIsCalculatingTimes] = useState(false);

  const getDebugDeparture = (departure: Departure, index: number): Departure => {
    return DEBUG_ADD_DELAY && index === 0
      ? { ...departure, delay: DEBUG_DELAY_MINUTES }
      : departure;
  };

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
        departures.map(async (departure, index) => {
          const key = `${departure.tripId}-${departure.scheduledTime}`;

          try {
            const travelTime = await getEnhancedTravelTime(departure, true);
            newTravelTimes.set(key, travelTime);

            if (DEBUG_ADD_DELAY && index === 0) {
              const delayedDeparture = { ...departure, delay: DEBUG_DELAY_MINUTES };
              const delayedKey = `${departure.tripId}-${departure.scheduledTime}-delayed`;
              const delayedTravelTime = await getEnhancedTravelTime(delayedDeparture, true);
              newTravelTimes.set(delayedKey, delayedTravelTime);
            }
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
    if (!TRAVEL_TIME_CONFIG.enableRealTimeInUI) {
      return departure.mode === 'bus' ? 0 : TRAVEL_TIMES[departure.mode];
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

    return departure.mode === 'bus' ? 0 : TRAVEL_TIMES[departure.mode];
  };

  const calculateArrivalTimeWithDelay = (departure: Departure): string => {
    try {
      const actualDepartureTime = calculateActualDepartureTime(departure);
      const travelMinutes = getTravelTime(departure);

      if (departure.mode === 'bus' && travelMinutes === 0) {
        return 'N/A';
      }

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

  const calculateScheduledArrivalTime = (departure: Departure): string => {
    try {
      const scheduledTime = new Date(departure.scheduledTime);
      const originalDeparture = { ...departure, delay: null };
      const travelMinutes = getTravelTime(originalDeparture);

      if (departure.mode === 'bus' && travelMinutes === 0) {
        return 'N/A';
      }

      const arrivalTime = new Date(scheduledTime.getTime() + travelMinutes * 60 * 1000);
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
    return departure.mode === 'bus' ? 0 : TRAVEL_TIMES[departure.mode];
  };

  const getMinutesUntilLeave = (departure: Departure): number | null => {
    const minutesUntilDeparture = getMinutesUntilDeparture(departure);
    if (minutesUntilDeparture === null) {
      return null;
    }

    return minutesUntilDeparture - getWalkMinutes(departure) - LEAVE_BUFFER_MINUTES;
  };

  const formatMinutesUntilDeparture = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes} min`;
  };

  const formatTravelDuration = (departure: Departure): string => {
    const travelMinutes = getTravelTime(departure);

    if (departure.mode === 'bus' && travelMinutes === 0) {
      return 'N/A';
    }

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

  const getUrgencyLabel = (departure: Departure): string => {
    const minutesUntilLeave = getMinutesUntilLeave(departure);
    const urgency = getUrgency(departure);

    if (minutesUntilLeave === null) {
      return 'Bez odhadu';
    }

    if (urgency === 'missed') {
      return 'Tohle už nejspíš nestihneš';
    }

    if (urgency === 'leave-now') {
      return 'Vyjdi teď';
    }

    if (urgency === 'soon') {
      return `Vyjdi za ${Math.max(1, minutesUntilLeave)} min`;
    }

    return `Máš čas, vyjdi za ${minutesUntilLeave} min`;
  };

  const getStatusReason = (departure: Departure): string => {
    const minutesUntilLeave = getMinutesUntilLeave(departure);
    const delay = departure.delay ?? 0;
    const walkMinutes = getWalkMinutes(departure);

    if (minutesUntilLeave === null) {
      return 'Čas odchodu teď neumím přesně spočítat';
    }

    if (delay > 0 && minutesUntilLeave >= 0) {
      return `Zpoždění +${delay} min ti tady vlastně pomáhá`;
    }

    if (departure.mode === 'bus') {
      return minutesUntilLeave <= 1
        ? 'Bus je blízko — tohle je na rychlé rozhodnutí'
        : 'Bus neřeší docházku, takže je to hlavně o správném načasování';
    }

    if (minutesUntilLeave <= 1) {
      return `Počítám s docházkou ${walkMinutes} min a rezervou ${LEAVE_BUFFER_MINUTES} min`;
    }

    if (minutesUntilLeave <= 5) {
      return `Ještě chvíli máš, ale už je dobré se chystat`;
    }

    return `Pohodový spoj s rozumnou rezervou`;
  };

  const getRecommendationReason = (departure: Departure): string => {
    const urgency = getUrgency(departure);
    const delay = departure.delay ?? 0;

    if (delay > 0 && urgency !== 'missed') {
      return 'Nejlepší kompromis teď vychází díky zpoždění';
    }

    if (urgency === 'relaxed') {
      return 'Rozumný odjezd bez zbytečného stresu';
    }

    if (urgency === 'soon') {
      return 'Je blízko, ale ještě v pohodě stihnutelný';
    }

    if (urgency === 'leave-now') {
      return 'Nejrychlejší použitelná varianta právě teď';
    }

    return 'Nejbližší další použitelný spoj';
  };

  const getProgressPercent = (departure: Departure): number => {
    const minutesUntilLeave = getMinutesUntilLeave(departure);

    if (minutesUntilLeave === null) {
      return 0;
    }

    const normalized = ((PROGRESS_WINDOW_MINUTES - minutesUntilLeave) / PROGRESS_WINDOW_MINUTES) * 100;
    return Math.max(0, Math.min(100, normalized));
  };

  const getRecommendationScore = (departure: Departure): number => {
    const minutesUntilLeave = getMinutesUntilLeave(departure);
    const minutesUntilDeparture = getMinutesUntilDeparture(departure);
    const delay = departure.delay ?? 0;

    if (minutesUntilLeave === null || minutesUntilDeparture === null) {
      return Number.POSITIVE_INFINITY;
    }

    if (minutesUntilLeave < 0) {
      return 10000 + Math.abs(minutesUntilLeave);
    }

    const arrivalDate = new Date(calculateActualDepartureTime(departure).getTime() + getTravelTime(departure) * 60 * 1000);
    const arrivalMinutes = arrivalDate.getHours() * 60 + arrivalDate.getMinutes();

    const urgencyPenalty = minutesUntilLeave <= 1 ? 40 : minutesUntilLeave <= 5 ? 12 : 0;
    const tooEarlyPenalty = minutesUntilLeave > 18 ? (minutesUntilLeave - 18) * 1.2 : 0;
    const idealWindowPenalty = Math.abs(minutesUntilLeave - 7) * 1.8;
    const delayBonus = delay > 0 ? Math.min(delay * 2, 10) : 0;

    return arrivalMinutes + urgencyPenalty + tooEarlyPenalty + idealWindowPenalty + minutesUntilDeparture * 0.15 - delayBonus;
  };

  const debugDepartures = departures.map(getDebugDeparture);
  const sortedDepartures = [...debugDepartures].sort((a, b) => getRecommendationScore(a) - getRecommendationScore(b));
  const recommendedDeparture = sortedDepartures[0];
  const viableCount = debugDepartures.filter((departure) => {
    const leave = getMinutesUntilLeave(departure);
    return leave !== null && leave >= 0;
  }).length;

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
    <article className="glass glass-hover rounded-2xl sm:rounded-4xl border border-white/10 shadow-card hover:shadow-hover transition-all duration-400 group" role="region">
      <div className="p-3 sm:p-6 border-b border-white/10 bg-gradient-to-r from-white/[0.02] to-transparent">
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
        {recommendedDeparture && (
          <div className="rounded-2xl sm:rounded-3xl border border-primary-400/25 bg-gradient-to-br from-primary-500/12 via-white/[0.04] to-transparent p-4 sm:p-5 shadow-lg shadow-primary-500/10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary-400/20 bg-primary-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-200">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  Doporučeno
                </div>

                <div>
                  <div className="text-white text-2xl sm:text-3xl font-bold font-mono tracking-tight">
                    {formatTime(recommendedDeparture.delay && recommendedDeparture.delay > 0
                      ? calculateActualDepartureTime(recommendedDeparture).toISOString()
                      : recommendedDeparture.scheduledTime)}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/70">
                    <span>Odjezd</span>
                    {recommendedDeparture.delay && recommendedDeparture.delay > 0 && (
                      <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-red-300 font-semibold">
                        +{recommendedDeparture.delay} min
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-white/40" aria-hidden="true" />
                    <span>Příjezd {calculateArrivalTimeWithDelay(recommendedDeparture)}</span>
                  </div>
                </div>

                <p className="text-sm text-white/75 max-w-xl">{getRecommendationReason(recommendedDeparture)}</p>
              </div>

              <div className="sm:text-right space-y-2">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/85">
                  <Footprints className="w-4 h-4 text-primary-300" aria-hidden="true" />
                  {getUrgencyLabel(recommendedDeparture)}
                </div>
                <div className="text-xs text-white/55">
                  cesta {formatTravelDuration(recommendedDeparture)} • docházka {getWalkMinutes(recommendedDeparture)} min • rezerva {LEAVE_BUFFER_MINUTES} min
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Stihnutelné</div>
                <div className="mt-1 text-sm font-semibold text-white/85">{viableCount} z {debugDepartures.length} spojů</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Odjíždí za</div>
                <div className="mt-1 text-sm font-semibold text-white/85">
                  {(() => {
                    const minutes = getMinutesUntilDeparture(recommendedDeparture);
                    return minutes !== null ? formatMinutesUntilDeparture(Math.max(0, minutes)) : '--';
                  })()}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Vyjít</div>
                <div className="mt-1 text-sm font-semibold text-primary-200">
                  {(() => {
                    const leave = getMinutesUntilLeave(recommendedDeparture);
                    if (leave === null) return '--';
                    if (leave < 0) return 'pozdě';
                    if (leave <= 1) return 'teď';
                    return `za ${leave} min`;
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {debugDepartures.map((departure, index) => {
          const isRecommended = recommendedDeparture?.tripId === departure.tripId
            && recommendedDeparture?.scheduledTime === departure.scheduledTime;
          const minutesUntil = getMinutesUntilDeparture(departure);
          const minutesUntilLeave = getMinutesUntilLeave(departure);
          const hasDelay = departure.delay && departure.delay > 0;
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
              <div className="absolute inset-x-0 top-0 h-1 bg-white/5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    urgency === 'leave-now'
                      ? 'bg-gradient-to-r from-red-500 to-rose-400'
                      : urgency === 'soon'
                        ? 'bg-gradient-to-r from-yellow-500 to-amber-300'
                        : urgency === 'missed'
                          ? 'bg-white/10'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-300'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              <div id={`departure-${index}-details`} className="space-y-4" role="group" aria-label={`Detaily odjezdu ${departure.line}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isRecommended ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-200">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          Doporučený spoj
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/65">
                          Alternativa
                        </span>
                      )}

                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                        urgency === 'leave-now'
                          ? 'border-red-400/20 bg-red-500/10 text-red-200'
                          : urgency === 'soon'
                            ? 'border-yellow-400/20 bg-yellow-500/10 text-yellow-100'
                            : urgency === 'missed'
                              ? 'border-white/10 bg-white/5 text-white/45'
                              : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100'
                      }`}>
                        {getUrgencyLabel(departure)}
                      </span>

                      {hasDelay && (
                        <span className="inline-flex items-center rounded-full border border-red-400/20 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-200">
                          <TrendingUp className="w-3 h-3 mr-1" aria-hidden="true" />
                          +{departure.delay} min
                        </span>
                      )}
                    </div>

                    <div className="flex items-end gap-4">
                      <div>
                        <div className="min-h-[16px]">
                          {hasDelay && (
                            <time className="block text-xs font-medium text-white/40 font-mono tracking-tight line-through">
                              {formatTime(departure.scheduledTime)}
                            </time>
                          )}
                        </div>
                        <time
                          className={`block text-2xl sm:text-3xl lg:text-4xl font-bold font-mono tracking-tight ${hasDelay ? 'text-red-400' : 'text-white'}`}
                          dateTime={hasDelay ? calculateActualDepartureTime(departure).toISOString() : departure.scheduledTime}
                        >
                          {hasDelay
                            ? formatTime(calculateActualDepartureTime(departure).toISOString())
                            : formatTime(departure.scheduledTime)}
                        </time>
                        <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-white/65">
                          <span>Odjezd</span>
                          {hasDelay && <span className="text-red-400">(+{departure.delay}m)</span>}
                        </div>
                      </div>

                      <div className="h-12 w-px bg-white/10"></div>

                      <div>
                        <div className="min-h-[16px]">
                          {hasDelay && (
                            <time className="block text-xs font-medium text-white/40 font-mono tracking-tight line-through">
                              {calculateScheduledArrivalTime(departure)}
                            </time>
                          )}
                        </div>
                        <time className={`block text-2xl sm:text-3xl lg:text-4xl font-bold font-mono tracking-tight ${hasDelay ? 'text-red-400' : 'text-primary-300'}`}>
                          {calculateArrivalTimeWithDelay(departure)}
                        </time>
                        <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/65">Příjezd</div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/75 flex items-start gap-2">
                      {urgency === 'leave-now' ? (
                        <Siren className="w-4 h-4 mt-0.5 text-red-300" aria-hidden="true" />
                      ) : (
                        <Gauge className="w-4 h-4 mt-0.5 text-primary-300" aria-hidden="true" />
                      )}
                      <span>{getStatusReason(departure)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:min-w-[220px]">
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Odjíždí za</div>
                      <div className={`mt-1 text-sm sm:text-base font-semibold ${urgency === 'missed' ? 'text-white/45' : 'text-white/85'}`}>
                        {minutesUntil !== null ? formatMinutesUntilDeparture(Math.max(0, minutesUntil)) : '--'}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Vyjít</div>
                      <div className={`mt-1 text-sm sm:text-base font-semibold ${
                        urgency === 'leave-now'
                          ? 'text-red-300'
                          : urgency === 'soon'
                            ? 'text-yellow-200'
                            : urgency === 'missed'
                              ? 'text-white/45'
                              : 'text-emerald-200'
                      }`}>
                        {minutesUntilLeave === null
                          ? '--'
                          : minutesUntilLeave < 0
                            ? 'pozdě'
                            : minutesUntilLeave <= 1
                              ? 'teď'
                              : `za ${minutesUntilLeave} min`}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Cesta</div>
                      <div className="mt-1 text-sm sm:text-base font-semibold text-white/85">{formatTravelDuration(departure)}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Docházka</div>
                      <div className="mt-1 text-sm sm:text-base font-semibold text-white/85">{getWalkMinutes(departure)} min</div>
                    </div>
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
