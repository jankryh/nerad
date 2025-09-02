import { useState, useEffect, useCallback } from 'react';
import { Departure, ApiError } from '../types';
import { getAllDepartures } from '../api/pidApi'; // Použít skutečné PID API
import { REFRESH_INTERVAL } from '../constants';

interface UseDeparturesReturn {
  trainFromRez: Departure[];
  trainToRez: Departure[];
  busFromRez: Departure[];
  busToRez: Departure[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refreshData: () => void;
}

export const useDepartures = (): UseDeparturesReturn => {
  const [trainFromRez, setTrainFromRez] = useState<Departure[]>([]);
  const [trainToRez, setTrainToRez] = useState<Departure[]>([]);
  const [busFromRez, setBusFromRez] = useState<Departure[]>([]);
  const [busToRez, setBusToRez] = useState<Departure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Použít skutečné PID API
      const data = await getAllDepartures();
      
      setTrainFromRez(data.rezToMasarykovo.departures || []);
      setTrainToRez(data.masarykovoToRez.departures || []);
      setBusFromRez(data.husinecsToKobylisy.departures || []);
      setBusToRez(data.kobylisyToHusinec.departures || []);
      
      setLastUpdate(new Date());
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Nepodařilo se načíst data');
      console.error('Chyba při načítání dat:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // První načtení dat
    fetchData();

    // Nastavení intervalu pro automatické obnovování
    const interval = setInterval(fetchData, REFRESH_INTERVAL);

    // Cleanup při unmount
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    trainFromRez,
    trainToRez,
    busFromRez,
    busToRez,
    isLoading,
    error,
    lastUpdate,
    refreshData,
  };
};
