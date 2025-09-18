import { Departure, TravelTimeCalculation } from '../types';
import { TRAVEL_TIMES, DEPARTURE_INTERVALS, STOPS, TRAVEL_TIME_CONFIG } from '../constants';
import { calculateTravelTime } from '../api/pidApi';

// Cache for travel time calculations
interface TravelTimeCacheEntry {
  duration: number;
  timestamp: Date;
  line: string;
  mode: 'train' | 'bus';
}

const travelTimeCache = new Map<string, TravelTimeCacheEntry>();

/**
 * Get cache key for travel time calculation
 */
const getTravelTimeCacheKey = (departureStopId: string, arrivalStopId: string, line: string): string => {
  return `travel_time:${departureStopId}:${arrivalStopId}:${line}`;
};

/**
 * Get cached travel time if available and not expired
 */
const getCachedTravelTime = (cacheKey: string): number | null => {
  const cached = travelTimeCache.get(cacheKey);
  if (cached) {
    const age = Date.now() - cached.timestamp.getTime();
    if (age < TRAVEL_TIME_CONFIG.cacheDuration) {
      console.log(`📦 Using cached travel time: ${cached.duration} minutes for ${cached.line}`);
      return cached.duration;
    } else {
      // Remove expired cache entry
      travelTimeCache.delete(cacheKey);
    }
  }
  return null;
};

/**
 * Cache travel time calculation
 */
const cacheTravelTime = (cacheKey: string, duration: number, line: string, mode: 'train' | 'bus'): void => {
  travelTimeCache.set(cacheKey, {
    duration,
    timestamp: new Date(),
    line,
    mode
  });
  
  // Clean up old cache entries periodically
  if (travelTimeCache.size > 50) {
    const now = Date.now();
    for (const [key, entry] of travelTimeCache.entries()) {
      if (now - entry.timestamp.getTime() > TRAVEL_TIME_CONFIG.cacheDuration) {
        travelTimeCache.delete(key);
      }
    }
  }
};

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
 * Enhanced travel time calculation with real API data, caching, and intelligent fallback
 */
export const getEnhancedTravelTime = async (
  departure: Departure,
  useRealTime: boolean = TRAVEL_TIME_CONFIG.useRealTimeAPI
): Promise<number> => {
  // For buses, never use hardcoded values - only real-time API data
  if (departure.mode === 'bus') {
    console.log(`🚌 Bus ${departure.line}: Using only real-time API data (no hardcoded fallback)`);
    
    try {
      // Determine stop IDs based on direction and line
      const { departureStopId, arrivalStopId } = getStopIdsForTrip(departure);
      
      if (!departureStopId || !arrivalStopId) {
        console.warn(`⚠️ Bus ${departure.line}: Cannot determine stop IDs for trip, no travel time available`);
        return 0; // Return 0 to indicate no data available
      }

      // Check cache first
      const cacheKey = getTravelTimeCacheKey(departureStopId, arrivalStopId, departure.line);
      const cachedDuration = getCachedTravelTime(cacheKey);
      if (cachedDuration !== null) {
        return cachedDuration;
      }

      // Get real-time travel duration from API
      const apiDirection = getApiDirection(departure);
      const travelTimes = await calculateTravelTime(
        departureStopId,
        arrivalStopId,
        departure.line,
        apiDirection
      );

      if (travelTimes.length > 0) {
        // Prioritize average calculations over individual trip calculations
        const averageCalculation = travelTimes.find(t => t.tripId.startsWith('average_'));
        const individualCalculations = travelTimes.filter(t => !t.tripId.startsWith('average_'));
        
        let selectedTravelTime: TravelTimeCalculation;
        
        if (averageCalculation) {
          selectedTravelTime = averageCalculation;
          console.log(`🚌 Bus ${departure.line}: Using average travel duration: ${selectedTravelTime.duration} minutes (based on ${selectedTravelTime.sampleCount} samples)`);
        } else if (individualCalculations.length > 0) {
          selectedTravelTime = individualCalculations[0];
          console.log(`🚌 Bus ${departure.line}: Using individual travel duration: ${selectedTravelTime.duration} minutes`);
        } else {
          selectedTravelTime = travelTimes[0];
          console.log(`🚌 Bus ${departure.line}: Using first available travel duration: ${selectedTravelTime.duration} minutes`);
        }
        
        // For buses, accept any reasonable duration (5-60 minutes)
        if (selectedTravelTime.duration >= 5 && selectedTravelTime.duration <= 60) {
          console.log(`✅ Bus ${departure.line}: Validated real-time travel duration: ${selectedTravelTime.duration} minutes`);
          
          // Cache the validated result
          cacheTravelTime(cacheKey, selectedTravelTime.duration, departure.line, departure.mode);
          
          return selectedTravelTime.duration;
        } else {
          console.warn(`⚠️ Bus ${departure.line}: Calculated duration ${selectedTravelTime.duration} minutes seems unreasonable, no travel time available`);
          return 0;
        }
      }

      console.warn(`⚠️ Bus ${departure.line}: No real-time travel data available, no travel time available`);
      return 0; // Return 0 to indicate no data available

    } catch (error) {
      console.warn(`⚠️ Bus ${departure.line}: Error getting real-time travel duration, no travel time available:`, error);
      return 0; // Return 0 to indicate no data available
    }
  }

  // For trains, use the original logic with fallback
  if (!useRealTime || !TRAVEL_TIME_CONFIG.useRealTimeAPI) {
    console.log(`🚂 Train ${departure.line}: Using hardcoded travel time: ${TRAVEL_TIMES[departure.mode]} minutes`);
    return TRAVEL_TIMES[departure.mode];
  }

  try {
    // Determine stop IDs based on direction and line
    const { departureStopId, arrivalStopId } = getStopIdsForTrip(departure);
    
    if (!departureStopId || !arrivalStopId) {
      console.warn(`⚠️ Train ${departure.line}: Cannot determine stop IDs for trip, using fallback`);
      return TRAVEL_TIMES[departure.mode];
    }

    // Check cache first
    const cacheKey = getTravelTimeCacheKey(departureStopId, arrivalStopId, departure.line);
    const cachedDuration = getCachedTravelTime(cacheKey);
    if (cachedDuration !== null) {
      return cachedDuration;
    }

    // Get real-time travel duration from API
    const apiDirection = getApiDirection(departure);
    const travelTimes = await calculateTravelTime(
      departureStopId,
      arrivalStopId,
      departure.line,
      apiDirection
    );

    if (travelTimes.length > 0) {
      // Prioritize average calculations over individual trip calculations
      const averageCalculation = travelTimes.find(t => t.tripId.startsWith('average_'));
      const individualCalculations = travelTimes.filter(t => !t.tripId.startsWith('average_'));
      
      let selectedTravelTime: TravelTimeCalculation;
      
      if (averageCalculation) {
        selectedTravelTime = averageCalculation;
        console.log(`🚂 Train ${departure.line}: Using average travel duration: ${selectedTravelTime.duration} minutes (based on ${selectedTravelTime.sampleCount} samples)`);
      } else if (individualCalculations.length > 0) {
        selectedTravelTime = individualCalculations[0];
        console.log(`🚂 Train ${departure.line}: Using individual travel duration: ${selectedTravelTime.duration} minutes`);
      } else {
        selectedTravelTime = travelTimes[0];
        console.log(`🚂 Train ${departure.line}: Using first available travel duration: ${selectedTravelTime.duration} minutes`);
      }
      
      // Validate the calculated duration is reasonable
      const hardcodedTime = TRAVEL_TIMES[departure.mode];
      const minReasonable = Math.max(5, hardcodedTime * 0.5); // At least 5 minutes, or 50% of hardcoded
      const maxReasonable = hardcodedTime * 2; // Maximum 200% of hardcoded
      
      if (selectedTravelTime.duration >= minReasonable && selectedTravelTime.duration <= maxReasonable) {
        console.log(`✅ Train ${departure.line}: Validated real-time travel duration: ${selectedTravelTime.duration} minutes`);
        
        // Cache the validated result
        cacheTravelTime(cacheKey, selectedTravelTime.duration, departure.line, departure.mode);
        
        return selectedTravelTime.duration;
      } else {
        console.warn(`⚠️ Train ${departure.line}: Calculated duration ${selectedTravelTime.duration} minutes seems unreasonable, using fallback`);
        return TRAVEL_TIMES[departure.mode];
      }
    }

    console.warn(`⚠️ Train ${departure.line}: No real-time travel data available, using fallback`);
    return TRAVEL_TIME_CONFIG.fallbackToHardcoded ? TRAVEL_TIMES[departure.mode] : 0;

  } catch (error) {
    console.warn(`⚠️ Train ${departure.line}: Error getting real-time travel duration, using fallback:`, error);
    return TRAVEL_TIME_CONFIG.fallbackToHardcoded ? TRAVEL_TIMES[departure.mode] : 0;
  }
};

/**
 * Determines the correct API direction parameter based on departure data
 */
const getApiDirection = (departure: Departure): string | undefined => {
  console.log(`🔍 getApiDirection for line ${departure.line}, direction: "${departure.direction}"`);
  
  if (departure.line === 'S4') {
    if (departure.direction.includes('Masarykovo') || departure.direction.includes('Praha')) {
      console.log(`📍 S4 direction mapped to: to-masarykovo`);
      return 'to-masarykovo';
    } else {
      console.log(`📍 S4 direction mapped to: to-rez`);
      return 'to-rez';
    }
  } else if (departure.line === '371') {
    // For bus 371, we need to determine direction based on the headsign
    // Headsigns like "Husinec,Řež,Záv." are going TO Husinec (not FROM Husinec)
    // Headsigns like "Praha,Kobylisy" are going TO Kobylisy (not FROM Kobylisy)
    
    if (departure.direction.includes('Kobylisy')) {
      console.log(`📍 Bus 371 direction mapped to: to-kobylisy (headsign contains Kobylisy)`);
      return 'to-kobylisy';
    } else if (departure.direction.includes('Husinec') || departure.direction.includes('Řež')) {
      console.log(`📍 Bus 371 direction mapped to: to-husinec (headsign contains Husinec/Řež)`);
      return 'to-husinec';
    } else {
      console.log(`📍 Bus 371 direction mapped to: to-kobylisy (default fallback)`);
      return 'to-kobylisy';
    }
  }
  console.warn(`⚠️ No direction mapping found for line ${departure.line}, direction: "${departure.direction}"`);
  return undefined;
};

/**
 * Determines stop IDs for a given trip
 */
const getStopIdsForTrip = (departure: Departure): { departureStopId: string | null; arrivalStopId: string | null } => {
  console.log(`🚏 getStopIdsForTrip for line ${departure.line}, direction: "${departure.direction}"`);
  
  // Map based on line and direction
  if (departure.line === 'S4') {
    if (departure.direction.includes('Masarykovo') || departure.direction.includes('Praha')) {
      const result = {
        departureStopId: STOPS.REZ,
        arrivalStopId: STOPS.MASARYKOVO
      };
      console.log(`🚏 S4 stops mapped: ${result.departureStopId} → ${result.arrivalStopId}`);
      return result;
    } else {
      const result = {
        departureStopId: STOPS.MASARYKOVO,
        arrivalStopId: STOPS.REZ
      };
      console.log(`🚏 S4 stops mapped: ${result.departureStopId} → ${result.arrivalStopId}`);
      return result;
    }
  } else if (departure.line === '371') {
    if (departure.direction.includes('Kobylisy')) {
      const result = {
        departureStopId: STOPS.HUSINEC_REZ,
        arrivalStopId: STOPS.KOBYLISY
      };
      console.log(`🚏 Bus 371 stops mapped: ${result.departureStopId} → ${result.arrivalStopId}`);
      return result;
    } else if (departure.direction.includes('Husinec') || departure.direction.includes('Řež')) {
      const result = {
        departureStopId: STOPS.KOBYLISY,
        arrivalStopId: STOPS.HUSINEC_REZ
      };
      console.log(`🚏 Bus 371 stops mapped: ${result.departureStopId} → ${result.arrivalStopId}`);
      return result;
    } else {
      // Default fallback
      const result = {
        departureStopId: STOPS.HUSINEC_REZ,
        arrivalStopId: STOPS.KOBYLISY
      };
      console.log(`🚏 Bus 371 stops mapped (default): ${result.departureStopId} → ${result.arrivalStopId}`);
      return result;
    }
  }

  console.warn(`⚠️ No stop mapping found for line ${departure.line}, direction: "${departure.direction}"`);
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

/**
 * Clear travel time cache
 */
export const clearTravelTimeCache = (): void => {
  travelTimeCache.clear();
  console.log('🧹 Travel time cache cleared');
};

/**
 * Get travel time cache statistics
 */
export const getTravelTimeCacheStats = (): { size: number; entries: Array<{ key: string; duration: number; age: number; line: string }> } => {
  const now = Date.now();
  const entries = Array.from(travelTimeCache.entries()).map(([key, entry]) => ({
    key,
    duration: entry.duration,
    age: now - entry.timestamp.getTime(),
    line: entry.line
  }));
  
  return {
    size: travelTimeCache.size,
    entries
  };
};
