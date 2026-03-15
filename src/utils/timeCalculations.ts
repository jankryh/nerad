import { Departure, TravelTimeCalculation } from '../types';
import { TRAVEL_TIMES, DEPARTURE_INTERVALS, STOPS, TRAVEL_TIME_CONFIG } from '../constants';
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

export const calculateArrivalTime = (departure: Departure): Date => {
  const actualDepartureTime = calculateActualDepartureTime(departure);
  const travelMinutes = TRAVEL_TIMES[departure.mode];

  return new Date(actualDepartureTime.getTime() + travelMinutes * 60 * 1000);
};

export const getMinutesUntilNextDeparture = (departures: Departure[]): number | null => {
  if (!departures.length) return null;

  const now = new Date();

  for (const departure of departures) {
    const actualDepartureTime = calculateActualDepartureTime(departure);
    const minutesUntil = Math.round((actualDepartureTime.getTime() - now.getTime()) / (1000 * 60));

    if (minutesUntil > 0) {
      return minutesUntil;
    }
  }

  const lastDeparture = departures[departures.length - 1];
  const lastTime = new Date(lastDeparture.scheduledTime);
  const intervalMinutes = DEPARTURE_INTERVALS[lastDeparture.mode];
  const nextTime = new Date(lastTime.getTime() + intervalMinutes * 60 * 1000);
  const minutesUntil = Math.round((nextTime.getTime() - now.getTime()) / (1000 * 60));

  return Math.max(0, minutesUntil);
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

export const formatArrivalTime = (departure: Departure): string => {
  try {
    const arrivalTime = calculateArrivalTime(departure);
    return arrivalTime.toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '--:--';
  }
};

const getApiDirection = (departure: Departure): string | undefined => {
  if (departure.line === 'S4') {
    return departure.direction.includes('Masarykovo') || departure.direction.includes('Praha')
      ? 'to-masarykovo'
      : 'to-rez';
  }

  if (departure.line === '371') {
    if (departure.direction.includes('Kobylisy')) {
      return 'to-kobylisy';
    }

    if (departure.direction.includes('Husinec') || departure.direction.includes('Řež')) {
      return 'to-husinec';
    }

    return 'to-kobylisy';
  }

  return undefined;
};

const getStopIdsForTrip = (departure: Departure): { departureStopId: string | null; arrivalStopId: string | null } => {
  if (departure.line === 'S4') {
    return departure.direction.includes('Masarykovo') || departure.direction.includes('Praha')
      ? { departureStopId: STOPS.REZ, arrivalStopId: STOPS.MASARYKOVO }
      : { departureStopId: STOPS.MASARYKOVO, arrivalStopId: STOPS.REZ };
  }

  if (departure.line === '371') {
    return departure.direction.includes('Kobylisy')
      ? { departureStopId: STOPS.HUSINEC_REZ, arrivalStopId: STOPS.KOBYLISY }
      : { departureStopId: STOPS.KOBYLISY, arrivalStopId: STOPS.HUSINEC_REZ };
  }

  return { departureStopId: null, arrivalStopId: null };
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
): Promise<number> => {
  const trainFallback = TRAVEL_TIMES[departure.mode];

  if (departure.mode === 'train' && (!useRealTime || !TRAVEL_TIME_CONFIG.useRealTimeAPI)) {
    return trainFallback;
  }

  const { departureStopId, arrivalStopId } = getStopIdsForTrip(departure);
  if (!departureStopId || !arrivalStopId) {
    return departure.mode === 'train' ? trainFallback : 0;
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
      getApiDirection(departure),
    );

    const selectedTravelTime = selectBestTravelTime(travelTimes);
    if (!selectedTravelTime) {
      return departure.mode === 'train' && TRAVEL_TIME_CONFIG.fallbackToHardcoded ? trainFallback : 0;
    }

    if (departure.mode === 'bus') {
      if (selectedTravelTime.duration >= 5 && selectedTravelTime.duration <= 60) {
        cacheTravelTime(cacheKey, selectedTravelTime.duration, departure.line, departure.mode);
        return selectedTravelTime.duration;
      }

      return 0;
    }

    const minReasonable = Math.max(5, trainFallback * 0.5);
    const maxReasonable = trainFallback * 2;

    if (selectedTravelTime.duration >= minReasonable && selectedTravelTime.duration <= maxReasonable) {
      cacheTravelTime(cacheKey, selectedTravelTime.duration, departure.line, departure.mode);
      return selectedTravelTime.duration;
    }

    return TRAVEL_TIME_CONFIG.fallbackToHardcoded ? trainFallback : 0;
  } catch (error) {
    logger.warn('Failed to get enhanced travel time', error);
    return departure.mode === 'train' && TRAVEL_TIME_CONFIG.fallbackToHardcoded ? trainFallback : 0;
  }
};

export const calculateEnhancedArrivalTime = async (
  departure: Departure,
  useRealTime: boolean = true,
): Promise<Date> => {
  const actualDepartureTime = calculateActualDepartureTime(departure);
  const travelMinutes = await getEnhancedTravelTime(departure, useRealTime);

  return new Date(actualDepartureTime.getTime() + travelMinutes * 60 * 1000);
};

export const formatEnhancedArrivalTime = async (
  departure: Departure,
  useRealTime: boolean = true,
): Promise<string> => {
  try {
    const arrivalTime = await calculateEnhancedArrivalTime(departure, useRealTime);
    return arrivalTime.toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '--:--';
  }
};

export const clearTravelTimeCache = (): void => {
  travelTimeCache.clear();
};

export const getTravelTimeCacheStats = (): { size: number; entries: Array<{ key: string; duration: number; age: number; line: string }> } => {
  const now = Date.now();
  const entries = Array.from(travelTimeCache.entries()).map(([key, entry]) => ({
    key,
    duration: entry.duration,
    age: now - entry.timestamp.getTime(),
    line: entry.line,
  }));

  return {
    size: travelTimeCache.size,
    entries,
  };
};
