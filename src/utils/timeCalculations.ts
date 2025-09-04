import { Departure } from '../types';
import { TRAVEL_TIMES, DEPARTURE_INTERVALS, STOPS, TRAVEL_TIME_CONFIG } from '../constants';
import { calculateTravelTime } from '../api/pidApi';

/**
 * Calculates the actual departure time including delay
 */
export const calculateActualDepartureTime = (departure: Departure): Date => {
  const scheduledTime = new Date(departure.scheduledTime);
  
  if (departure.delay && departure.delay > 0) {
    return new Date(scheduledTime.getTime() + departure.delay * 60 * 1000);
  }
  
  return scheduledTime;
};

/**
 * Calculates the arrival time based on departure time and travel duration
 */
export const calculateArrivalTime = (departure: Departure): Date => {
  const actualDepartureTime = calculateActualDepartureTime(departure);
  const travelMinutes = TRAVEL_TIMES[departure.mode];
  
  return new Date(actualDepartureTime.getTime() + travelMinutes * 60 * 1000);
};

/**
 * Calculates minutes until the next departure
 */
export const getMinutesUntilNextDeparture = (departures: Departure[]): number | null => {
  if (!departures || departures.length === 0) return null;
  
  const now = new Date();
  
  // Find the next departure that hasn't happened yet
  for (const departure of departures) {
    const actualDepartureTime = calculateActualDepartureTime(departure);
    const minutesUntil = Math.round((actualDepartureTime.getTime() - now.getTime()) / (1000 * 60));
    
    if (minutesUntil > 0) {
      return minutesUntil;
    }
  }
  
  // If no upcoming departures in the list, calculate next one based on interval
  const lastDeparture = departures[departures.length - 1];
  const lastTime = new Date(lastDeparture.scheduledTime);
  const intervalMinutes = DEPARTURE_INTERVALS[lastDeparture.mode];
  const nextTime = new Date(lastTime.getTime() + intervalMinutes * 60 * 1000);
  const minutesUntil = Math.round((nextTime.getTime() - now.getTime()) / (1000 * 60));
  
  return Math.max(0, minutesUntil);
};

/**
 * Formats time to Czech locale format
 */
export const formatTime = (isoTime: string): string => {
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

/**
 * Formats arrival time for display
 */
export const formatArrivalTime = (departure: Departure): string => {
  try {
    const arrivalTime = calculateArrivalTime(departure);
    return arrivalTime.toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch {
    return '--:--';
  }
};

/**
 * Enhanced travel time calculation with real API data and fallback
 */
export const getEnhancedTravelTime = async (
  departure: Departure,
  useRealTime: boolean = TRAVEL_TIME_CONFIG.useRealTimeAPI
): Promise<number> => {
  if (!useRealTime || !TRAVEL_TIME_CONFIG.useRealTimeAPI) {
    return TRAVEL_TIMES[departure.mode];
  }

  try {
    // Determine stop IDs based on direction and line
    const { departureStopId, arrivalStopId } = getStopIdsForTrip(departure);
    
    if (!departureStopId || !arrivalStopId) {
      console.warn('⚠️ Cannot determine stop IDs for trip, using fallback');
      return TRAVEL_TIMES[departure.mode];
    }

    // Get real-time travel duration from API
    const travelTimes = await calculateTravelTime(
      departureStopId,
      arrivalStopId,
      departure.line,
      departure.direction
    );

    if (travelTimes.length > 0) {
      // Use the most recent calculation
      const latestTravelTime = travelTimes[0];
      console.log(`✅ Using real-time travel duration: ${latestTravelTime.duration} minutes for ${departure.line}`);
      return latestTravelTime.duration;
    }

    console.warn('⚠️ No real-time travel data available, using fallback');
    return TRAVEL_TIME_CONFIG.fallbackToHardcoded ? TRAVEL_TIMES[departure.mode] : 0;

  } catch (error) {
    console.warn('⚠️ Error getting real-time travel duration, using fallback:', error);
    return TRAVEL_TIME_CONFIG.fallbackToHardcoded ? TRAVEL_TIMES[departure.mode] : 0;
  }
};

/**
 * Determines stop IDs for a given trip
 */
const getStopIdsForTrip = (departure: Departure): { departureStopId: string | null; arrivalStopId: string | null } => {
  // Map based on line and direction
  if (departure.line === 'S4') {
    if (departure.direction.includes('Masarykovo') || departure.direction.includes('Praha')) {
      return {
        departureStopId: STOPS.REZ,
        arrivalStopId: STOPS.MASARYKOVO
      };
    } else {
      return {
        departureStopId: STOPS.MASARYKOVO,
        arrivalStopId: STOPS.REZ
      };
    }
  } else if (departure.line === '371') {
    if (departure.direction.includes('Kobylisy') || departure.direction.includes('Praha')) {
      return {
        departureStopId: STOPS.HUSINEC_REZ,
        arrivalStopId: STOPS.KOBYLISY
      };
    } else {
      return {
        departureStopId: STOPS.KOBYLISY,
        arrivalStopId: STOPS.HUSINEC_REZ
      };
    }
  }

  return { departureStopId: null, arrivalStopId: null };
};

/**
 * Enhanced arrival time calculation with real API data
 */
export const calculateEnhancedArrivalTime = async (
  departure: Departure,
  useRealTime: boolean = true
): Promise<Date> => {
  const actualDepartureTime = calculateActualDepartureTime(departure);
  const travelMinutes = await getEnhancedTravelTime(departure, useRealTime);
  
  return new Date(actualDepartureTime.getTime() + travelMinutes * 60 * 1000);
};

/**
 * Enhanced arrival time formatting with real API data
 */
export const formatEnhancedArrivalTime = async (
  departure: Departure,
  useRealTime: boolean = true
): Promise<string> => {
  try {
    const arrivalTime = await calculateEnhancedArrivalTime(departure, useRealTime);
    return arrivalTime.toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch {
    return '--:--';
  }
};
