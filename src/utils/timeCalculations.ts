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

const getTravelTimeCacheKey = (departureStopId: string, arrivalStopId: string, line: string): string => {
  return `travel_time:${departureStopId}:${arrivalStopId}:${line}`;
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
    default: return { departureStopId: null, arrivalStopId: null };
  }
};

const selectBestTravelTime = (travelTimes: TravelTimeCalculation[]): TravelTimeCalculation | null => {
  if (!travelTimes.length) {
    return null;
  }

  return travelTimes.find((item) => item.tripId.startsWith('average_'))
    ?? travelTimes.find((item) => !item.tripId.startsWith('average_'))
    ?? travelTimes[0];
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

  const cacheKey = getTravelTimeCacheKey(departureStopId, arrivalStopId, departure.line);
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

    const selectedTravelTime = selectBestTravelTime(travelTimes);
    if (!selectedTravelTime) {
      // Fallback na hardcoded čas pro vlak i bus
      return hardcodedFallback;
    }

    if (departure.mode === 'bus') {
      if (selectedTravelTime.duration >= 5 && selectedTravelTime.duration <= 60) {
        cacheTravelTime(cacheKey, selectedTravelTime.duration, departure.line, departure.mode);
        return selectedTravelTime.duration;
      }

      // Bus: vždy hardcoded fallback místo 0
      return hardcodedFallback;
    }

    const minReasonable = Math.max(5, hardcodedFallback * 0.5);
    const maxReasonable = hardcodedFallback * 2;

    if (selectedTravelTime.duration >= minReasonable && selectedTravelTime.duration <= maxReasonable) {
      cacheTravelTime(cacheKey, selectedTravelTime.duration, departure.line, departure.mode);
      return selectedTravelTime.duration;
    }

    return hardcodedFallback;
  } catch (error) {
    logger.warn('Failed to get enhanced travel time', error);
    // Vždy vrať hardcoded fallback — nikdy 0
    return hardcodedFallback;
  }
};
