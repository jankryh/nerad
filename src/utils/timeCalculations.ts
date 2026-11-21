import { Departure, TravelTimeCalculation } from '../types';
import { TRAVEL_TIMES, STOPS, TRAVEL_TIME_CONFIG, PragueStation } from '../constants';
import { calculateTravelTime } from '../api/pidApi';
import { logger } from './logger';

interface TravelTimeCacheEntry {
  duration: number;
  timestamp: Date;
  line: string;
  mode: 'train' | 'bus';
}

const travelTimeCache = new Map<string, TravelTimeCacheEntry>();

// Test helper to clear cache between tests
export const __clearCacheForTesting = () => {
  travelTimeCache.clear();
};

const getTravelTimeCacheKey = (departureStopId: string, arrivalStopId: string, line: string, tripId: string): string => {
  return `travel_time:${departureStopId}:${arrivalStopId}:${line}:${tripId}`;
};

const getCachedTravelTime = (cacheKey: string): number | null => {
  const cached = travelTimeCache.get(cacheKey);
  if (!cached) {
    return null;
  }

  const age = Date.now() - cached.timestamp.getTime();
  if (age < TRAVEL_TIME_CONFIG.cacheDuration) {
    logger.debug('Using cached travel time', cached.line, cached.duration);
    return cached.duration;
  }

  travelTimeCache.delete(cacheKey);
  return null;
};

const cacheTravelTime = (cacheKey: string, duration: number, line: string, mode: 'train' | 'bus'): void => {
  travelTimeCache.set(cacheKey, {
    duration,
    timestamp: new Date(),
    line,
    mode,
  });

  if (travelTimeCache.size <= TRAVEL_TIME_CONFIG.maxCacheSize) {
    return;
  }

  const now = Date.now();
  for (const [key, entry] of travelTimeCache.entries()) {
    if (now - entry.timestamp.getTime() > TRAVEL_TIME_CONFIG.cacheDuration) {
      travelTimeCache.delete(key);
    }
  }
};

export const calculateActualDepartureTime = (departure: Departure): Date => {
  const scheduledTime = new Date(departure.scheduledTime);

  if (departure.delay && departure.delay > 0) {
    return new Date(scheduledTime.getTime() + departure.delay * 60 * 1000);
  }

  return scheduledTime;
};

export const formatTime = (isoTime: string): string => {
  try {
    const date = new Date(isoTime);
    return date.toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '--:--';
  }
};

const getStopIdsForTrip = (departure: Departure, pragueStation: PragueStation = 'masarykovo'): { departureStopId: string | null; arrivalStopId: string | null } => {
  const pragueStopId = pragueStation === 'bubny' ? STOPS.BUBNY : STOPS.MASARYKOVO;
  switch (departure.boardDirection) {
    case 'to-masarykovo': return { departureStopId: STOPS.REZ, arrivalStopId: pragueStopId };
    case 'to-rez': return { departureStopId: pragueStopId, arrivalStopId: STOPS.REZ };
    case 'to-kobylisy': return { departureStopId: STOPS.HUSINEC_REZ, arrivalStopId: STOPS.KOBYLISY };
    case 'to-husinec': return { departureStopId: STOPS.KOBYLISY, arrivalStopId: STOPS.HUSINEC_REZ };
    default:
      logger.warn('Unknown boardDirection', departure.boardDirection, 'for line', departure.line);
      return { departureStopId: null, arrivalStopId: null };
  }
};

const selectBestTravelTime = (
  travelTimes: TravelTimeCalculation[],
  tripId: string,
  minDuration: number,
  maxDuration: number,
): TravelTimeCalculation | null => {
  if (!travelTimes.length) {
    return null;
  }

  const inRange = (item: TravelTimeCalculation) =>
    item.duration >= minDuration && item.duration <= maxDuration;

  // Přednost má příjezd konkrétního spoje v rozsahu, jinak průměr v rozsahu
  return travelTimes.find((item) => item.tripId === tripId && inRange(item))
    ?? travelTimes.find((item) => item.tripId.startsWith('average_') && inRange(item))
    ?? travelTimes.find((item) => inRange(item))
    ?? null;
};

export const getEnhancedTravelTime = async (
  departure: Departure,
  useRealTime: boolean = TRAVEL_TIME_CONFIG.useRealTimeAPI,
  pragueStation: PragueStation = 'masarykovo',
): Promise<number> => {
  const hardcodedFallback = TRAVEL_TIMES[departure.mode];

  if (!useRealTime || !TRAVEL_TIME_CONFIG.useRealTimeAPI) {
    return hardcodedFallback;
  }

  const { departureStopId, arrivalStopId } = getStopIdsForTrip(departure, pragueStation);
  if (!departureStopId || !arrivalStopId) {
    // Vždy vrať hardcoded fallback — nikdy 0/N/A
    return hardcodedFallback;
  }

  const cacheKey = getTravelTimeCacheKey(departureStopId, arrivalStopId, departure.line, departure.tripId);
  const cachedDuration = getCachedTravelTime(cacheKey);
  if (cachedDuration !== null) {
    return cachedDuration;
  }

  try {
    const travelTimes = await calculateTravelTime(
      departureStopId,
      arrivalStopId,
      departure.line,
      departure.boardDirection,
    );

    const minDuration = departure.mode === 'bus' ? 5 : Math.max(5, hardcodedFallback * 0.5);
    const maxDuration = departure.mode === 'bus' ? 60 : hardcodedFallback * 2;

    const selectedTravelTime = selectBestTravelTime(travelTimes, departure.tripId, minDuration, maxDuration);
    if (!selectedTravelTime) {
      // Fallback na hardcoded čas pro vlak i bus
      return hardcodedFallback;
    }

    if (!selectedTravelTime.fallbackUsed && selectedTravelTime.tripId === departure.tripId) {
      cacheTravelTime(cacheKey, selectedTravelTime.duration, departure.line, departure.mode);
    }
    return selectedTravelTime.duration;
  } catch (error) {
    logger.warn('Failed to get enhanced travel time', error);
    // Vždy vrať hardcoded fallback — nikdy 0
    return hardcodedFallback;
  }
};

export const formatCountdown = (minutes: number, isScheduledMode: boolean = false): string => {
  if (isScheduledMode) {
    const sign = minutes > 0 ? '+' : '';
    return `${sign}${minutes} min`;
  }
  if (minutes <= 0) return 'teď';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0 ? `${hours} h` : `${hours} h ${rem} min`;
};
