import { useState, useEffect, useCallback, useRef } from 'react';
import { Departure, ApiError } from '../types';
import { getAllDepartures } from '../api/pidApi';
import { logger } from '../utils/logger';

interface DeparturesState {
  trainToPrague: Departure[];
  trainFromPrague: Departure[];
  busToPrague: Departure[];
  busFromPrague: Departure[];
}

interface UseDeparturesReturn extends DeparturesState {
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refreshData: () => void;
  retryCount: number;
  isRetrying: boolean;
  nextRetryIn: number | null;
  manualRetry: () => void;
}

const emptyState: DeparturesState = {
  trainToPrague: [],
  trainFromPrague: [],
  busToPrague: [],
  busFromPrague: [],
};

const MAX_AUTO_RETRIES = 5;
const BACKOFF_BASE_MS = 5000;
const BACKOFF_MAX_MS = 30000;

const getBackoffDelay = (retryCount: number): number => {
  const delay = BACKOFF_BASE_MS * Math.pow(2, retryCount);
  return Math.min(delay, BACKOFF_MAX_MS);
};

export const useDepartures = (): UseDeparturesReturn => {
  const [departures, setDepartures] = useState<DeparturesState>(emptyState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [nextRetryIn, setNextRetryIn] = useState<number | null>(null);

  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setNextRetryIn(null);
    setIsRetrying(false);
  }, []);

  const scheduleRetry = useCallback((currentRetryCount: number, fetchFn: () => Promise<void>) => {
    if (currentRetryCount >= MAX_AUTO_RETRIES) {
      setIsRetrying(false);
      setNextRetryIn(null);
      return;
    }

    const delayMs = getBackoffDelay(currentRetryCount);
    const delaySec = Math.ceil(delayMs / 1000);

    setIsRetrying(true);
    setNextRetryIn(delaySec);

    // Countdown timer
    countdownRef.current = setInterval(() => {
      setNextRetryIn((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    retryTimerRef.current = setTimeout(() => {
      fetchFn();
    }, delayMs);
  }, []);

  const fetchData = useCallback(async (isRetryAttempt = false) => {
    try {
      setIsLoading(true);
      if (!isRetryAttempt) {
        setError(null);
      }

      const data = await getAllDepartures();

      setDepartures({
        trainToPrague: data.rezToMasarykovo.departures,
        trainFromPrague: data.masarykovoToRez.departures,
        busToPrague: data.husinecsToKobylisy.departures,
        busFromPrague: data.kobylisyToHusinec.departures,
      });
      setLastUpdate(new Date());
      setError(null);
      setRetryCount(0);
      clearTimers();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Nepodařilo se načíst data');
      logger.error('Chyba při načítání dat', err);

      if (isRetryAttempt) {
        setRetryCount((prev) => {
          const newCount = prev + 1;
          scheduleRetry(newCount, () => fetchData(true));
          return newCount;
        });
      } else {
        setRetryCount(0);
        scheduleRetry(0, () => fetchData(true));
      }
    } finally {
      setIsLoading(false);
    }
  }, [clearTimers, scheduleRetry]);

  const manualRetry = useCallback(() => {
    clearTimers();
    setRetryCount(0);
    setError(null);
    fetchData(false);
  }, [clearTimers, fetchData]);

  useEffect(() => {
    fetchData(false);
    return () => {
      clearTimers();
    };
  }, [fetchData, clearTimers]);

  return {
    ...departures,
    isLoading,
    error,
    lastUpdate,
    refreshData: fetchData,
    retryCount,
    isRetrying,
    nextRetryIn,
    manualRetry,
  };
};
