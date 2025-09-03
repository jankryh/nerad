// 📊 React hook pro performance monitoring

import { useState, useEffect, useCallback, useRef } from 'react';
import { performanceMonitor, PerformanceStats } from '../utils/performance';

export interface UsePerformanceReturn {
  stats: Map<string, PerformanceStats>;
  performanceReport: string;
  clearCache: () => void;
  resetMetrics: () => void;
  exportData: () => void;
  isPerformanceGood: (name: string, threshold?: number) => boolean;
}

export const usePerformance = (): UsePerformanceReturn => {
  const [stats, setStats] = useState<Map<string, PerformanceStats>>(new Map());
  const [performanceReport, setPerformanceReport] = useState<string>('');
  const intervalRef = useRef<number | null>(null);

  // Aktualizace statistik
  const updateStats = useCallback(() => {
    const newStats = performanceMonitor.getAllStats();
    setStats(newStats);
    setPerformanceReport(performanceMonitor.getPerformanceReport());
  }, []);

  // Spuštění monitoringu
  useEffect(() => {
    updateStats();
    
    // Aktualizace každých 5 sekund
    intervalRef.current = window.setInterval(updateStats, 5000);
    
    // Cleanup při unmount
    return () => {
          if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    };
  }, [updateStats]);

  // Vyčistí cache
  const clearCache = useCallback(() => {
    // Cache se čistí automaticky v BaseAPIService
    updateStats();
  }, [updateStats]);

  // Resetuje metriky
  const resetMetrics = useCallback(() => {
    performanceMonitor.reset();
    updateStats();
  }, [updateStats]);

  // Exportuje data
  const exportData = useCallback(() => {
    return performanceMonitor.exportData();
  }, []);

  // Kontroluje, zda je performance dobrá
  const isPerformanceGood = useCallback((name: string, threshold: number = 1000) => {
    return performanceMonitor.isPerformanceGood(name, threshold);
  }, []);

  return {
    stats,
    performanceReport,
    clearCache,
    resetMetrics,
    exportData,
    isPerformanceGood
  };
};

export default usePerformance;
