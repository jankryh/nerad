import { useState, useEffect, useCallback } from 'react';
import { Departure, ApiError } from '../types';
import { getAllDepartures } from '../api/pidApi';
import { REFRESH_INTERVAL } from '../constants';
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
}

const emptyState: DeparturesState = {
  trainToPrague: [],
  trainFromPrague: [],
  busToPrague: [],
  busFromPrague: [],
};

export const useDepartures = (): UseDeparturesReturn => {
  const [departures, setDepartures] = useState<DeparturesState>(emptyState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getAllDepartures();

      setDepartures({
        trainToPrague: data.rezToMasarykovo.departures,
        trainFromPrague: data.masarykovoToRez.departures,
        busToPrague: data.husinecsToKobylisy.departures,
        busFromPrague: data.kobylisyToHusinec.departures,
      });
      setLastUpdate(new Date());
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Nepodařilo se načíst data');
      logger.error('Chyba při načítání dat', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = window.setInterval(fetchData, REFRESH_INTERVAL);
    return () => window.clearInterval(interval);
  }, [fetchData]);

  return {
    ...departures,
    isLoading,
    error,
    lastUpdate,
    refreshData: fetchData,
  };
};
