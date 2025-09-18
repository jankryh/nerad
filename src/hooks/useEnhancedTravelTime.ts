import { useState, useCallback } from 'react';
import { Departure } from '../types';
import { 
  getEnhancedTravelTime, 
  formatEnhancedArrivalTime,
  clearTravelTimeCache,
  getTravelTimeCacheStats
} from '../utils/timeCalculations';
import { TRAVEL_TIME_CONFIG } from '../constants';

interface UseEnhancedTravelTimeReturn {
  getTravelTime: (departure: Departure) => Promise<number>;
  getFormattedArrivalTime: (departure: Departure) => Promise<string>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  clearCache: () => void;
  getCacheStats: () => { size: number; entries: Array<{ key: string; duration: number; age: number; line: string }> };
}

export const useEnhancedTravelTime = (): UseEnhancedTravelTimeReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearCache = useCallback(() => {
    clearTravelTimeCache();
  }, []);

  const getCacheStats = useCallback(() => {
    return getTravelTimeCacheStats();
  }, []);

  const getTravelTime = useCallback(async (departure: Departure): Promise<number> => {
    if (!TRAVEL_TIME_CONFIG.useRealTimeAPI) {
      // Use hardcoded times if real-time API is disabled
      return departure.mode === 'train' ? 18 : 28;
    }

    setIsLoading(true);
    setError(null);

    try {
      const travelTime = await getEnhancedTravelTime(departure);
      return travelTime;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to get travel time: ${errorMessage}`);
      console.error('Error getting enhanced travel time:', err);
      
      // Return fallback time
      return departure.mode === 'train' ? 18 : 28;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getFormattedArrivalTime = useCallback(async (departure: Departure): Promise<string> => {
    if (!TRAVEL_TIME_CONFIG.useRealTimeAPI) {
      // Use simple calculation if real-time API is disabled
      const departureTime = new Date(departure.scheduledTime);
      const travelMinutes = departure.mode === 'train' ? 18 : 28;
      const arrivalTime = new Date(departureTime.getTime() + travelMinutes * 60 * 1000);
      
      return arrivalTime.toLocaleTimeString('cs-CZ', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }

    setIsLoading(true);
    setError(null);

    try {
      const formattedTime = await formatEnhancedArrivalTime(departure);
      return formattedTime;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to get arrival time: ${errorMessage}`);
      console.error('Error getting enhanced arrival time:', err);
      
      // Return fallback time
      const departureTime = new Date(departure.scheduledTime);
      const travelMinutes = departure.mode === 'train' ? 18 : 28;
      const arrivalTime = new Date(departureTime.getTime() + travelMinutes * 60 * 1000);
      
      return arrivalTime.toLocaleTimeString('cs-CZ', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getTravelTime,
    getFormattedArrivalTime,
    isLoading,
    error,
    clearError,
    clearCache,
    getCacheStats
  };
};
