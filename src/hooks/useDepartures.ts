import { useState, useEffect, useCallback, useRef } from 'react';
import { Departure, ApiError } from '../types';
import { getAllDepartures } from '../api/pidApi';
import { PragueStation, REFRESH_INTERVAL } from '../constants';
import { logger } from '../utils/logger';

interface DeparturesState {
  trainToPrague: Departure[];
  trainFromPrague: Departure[];
  busToPrague: Departure[];
  busFromPrague: Departure[];
  // Boards that failed while others loaded (shown inline, not as the global error)
  failedBoards: string[];
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
  failedBoards: [],
};

const MAX_AUTO_RETRIES = 5;
const BACKOFF_BASE_MS = 5000;
const BACKOFF_MAX_MS = 30000;

const getBackoffDelay = (retryCount: number): number => {
  const delay = BACKOFF_BASE_MS * Math.pow(2, retryCount);
  return Math.min(delay, BACKOFF_MAX_MS);
};

export const useDepartures = (targetDateTime?: Date | null, pragueStation: PragueStation = 'masarykovo'): UseDeparturesReturn => {
  const [departures, setDepartures] = useState<DeparturesState>(emptyState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [nextRetryIn, setNextRetryIn] = useState<number | null>(null);

  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryCountRef = useRef(0);
  const requestIdRef = useRef(0);

  const stopTimers = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const clearTimers = useCallback(() => {
    stopTimers();
    setNextRetryIn(null);
    setIsRetrying(false);
  }, [stopTimers]);

  const scheduleRetry = useCallback((currentRetryCount: number, fetchFn: () => Promise<void>) => {
    stopTimers();

    if (currentRetryCount >= MAX_AUTO_RETRIES) {
      setIsRetrying(false);
      setNextRetryIn(null);
      return;
    }

    const delayMs = getBackoffDelay(currentRetryCount);
    const delaySec = Math.ceil(delayMs / 1000);

    setIsRetrying(true);
    setNextRetryIn(delaySec);

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
  }, [stopTimers]);

  const fetchData = useCallback(async (isRetryAttempt = false, useCache = true, isPoll = false) => {
    // Ignore responses from requests superseded by a newer one (station/date switch, poll)
    const requestId = ++requestIdRef.current;
    try {
      setIsLoading(true);
      if (!isRetryAttempt && !isPoll) {
        setError(null);
      }

      const data = await getAllDepartures(targetDateTime, pragueStation, useCache);
      if (requestId !== requestIdRef.current) return;

      const boards = {
        trainToPrague: data.rezToMasarykovo,
        trainFromPrague: data.masarykovoToRez,
        busToPrague: data.husinecsToKobylisy,
        busFromPrague: data.kobylisyToHusinec,
      };
      setDepartures({
        trainToPrague: boards.trainToPrague.departures,
        trainFromPrague: boards.trainFromPrague.departures,
        busToPrague: boards.busToPrague.departures,
        busFromPrague: boards.busFromPrague.departures,
        failedBoards: Object.keys(boards).filter((key) => boards[key as keyof typeof boards].error),
      });
      setLastUpdate(new Date());
      setError(null);
      retryCountRef.current = 0;
      setRetryCount(0);
      clearTimers();
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      const apiError = err as ApiError;
      // 401/403 carry their own config hint; other 4xx in scheduled mode mean no data for that date
      const status = apiError.status ?? 0;
      const noDataForDate = targetDateTime && status >= 400 && status < 500 && status !== 401 && status !== 403;
      const message = status === 429
        ? 'Příliš mnoho požadavků, zkusím to znovu za chvíli.'
        : noDataForDate
          ? 'Pro toto datum nejsou dostupná data. Zkuste bližší termín.'
          : (apiError.message || 'Nepodařilo se načíst data');
      setError(message);
      logger.error('Chyba při načítání dat', err);

      // A poll failing after earlier failures continues the count, so the cap holds: once reached,
      // no short retries are scheduled and the 30 s poll acts as a slow probe. Only manual retry/refresh
      // or a parameter change start again from 0.
      const continues = isRetryAttempt || (isPoll && retryCountRef.current > 0);
      const attempt = continues ? Math.min(retryCountRef.current + 1, MAX_AUTO_RETRIES) : 0;
      retryCountRef.current = attempt;
      setRetryCount(attempt);
      scheduleRetry(attempt, () => fetchData(true));
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [clearTimers, scheduleRetry, targetDateTime, pragueStation]);

  // Manual retry/refresh cancels a pending retry (it would overwrite this result) and restarts the count
  const manualFetch = useCallback((useCache: boolean) => {
    clearTimers();
    retryCountRef.current = 0;
    setRetryCount(0);
    setError(null);
    fetchData(false, useCache);
  }, [clearTimers, fetchData]);
  const manualRetry = useCallback(() => manualFetch(true), [manualFetch]);

  useEffect(() => {
    // New selection (date/station): don't show the previous selection's departures meanwhile
    setDepartures(emptyState);
    fetchData(false);
    return () => {
      clearTimers();
    };
  }, [fetchData, clearTimers]);

  // Live mode: poll (and refetch on tab return) so departures and countdowns stay current.
  // Skipped while a backoff retry is pending, otherwise the poll would reset the backoff.
  useEffect(() => {
    if (targetDateTime) return;
    // Poll bypasses the cache: its TTL equals the poll interval, so a cache hit would show stale data as "updated".
    const refresh = (useCache: boolean) => {
      if (document.hidden || retryTimerRef.current) return;
      fetchData(false, useCache, true);
    };
    const poll = () => refresh(false);
    const onVisible = () => refresh(true);
    const interval = setInterval(poll, REFRESH_INTERVAL);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchData, targetDateTime]);

  return {
    ...departures,
    isLoading,
    error,
    lastUpdate,
    refreshData: () => manualFetch(false),
    retryCount,
    isRetrying,
    nextRetryIn,
    manualRetry,
  };
};
