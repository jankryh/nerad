import React from 'react';
import { DepartureBoard } from './DepartureBoard';
import { Departure } from '../types';
import { AlertTriangle, Loader, RefreshCw, ArrowRight, ArrowLeft } from 'lucide-react';

interface DepartureGridProps {
  trainToPrague: Departure[];
  trainFromPrague: Departure[];
  busToPrague: Departure[];
  busFromPrague: Departure[];
  isLoading: boolean;
  error: string | null;
  retryCount?: number;
  isRetrying?: boolean;
  nextRetryIn?: number | null;
  manualRetry?: () => void;
  targetDateTime?: Date | null;
}

export const DepartureGrid: React.FC<DepartureGridProps> = ({
  trainToPrague,
  trainFromPrague,
  busToPrague,
  busFromPrague,
  isLoading,
  error,
  retryCount = 0,
  isRetrying = false,
  nextRetryIn = null,
  manualRetry,
  targetDateTime = null,
}) => {
  // Merge train + bus departures for each direction
  const toPragueDepartures = [...trainToPrague, ...busToPrague];
  const fromPragueDepartures = [...trainFromPrague, ...busFromPrague];

  if (isLoading) {
    return (
      <section className="w-full" aria-label="Načítání spojů" role="status">
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="text-center glass rounded-xl p-8 border border-white/10 max-w-md">
            <div className="mb-4 flex justify-center">
              <div className="relative">
                <div className="w-12 h-12 border-3 border-white/10 border-t-primary-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader className="w-5 h-5 text-primary-500 animate-pulse" aria-hidden="true" />
                </div>
              </div>
            </div>
            <h3 className="text-white text-lg font-bold font-heading">Načítání spojů</h3>
            <p className="text-white/60 text-sm mt-2">Získávám odjezdy z PID...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full" aria-label="Chyba" role="alert">
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="text-center glass rounded-xl p-8 border border-red-500/20 max-w-md">
            <div className="mb-4">
              <div className="w-12 h-12 bg-red-500/15 rounded-full flex items-center justify-center mx-auto border border-red-400/20">
                <AlertTriangle className="w-6 h-6 text-red-400" aria-hidden="true" />
              </div>
            </div>
            <h3 className="text-red-300 text-lg font-bold font-heading mb-3">Chyba při načítání dat</h3>
            <p className="text-white/70 text-sm mb-2">{error}</p>
            {retryCount > 0 && (
              <p className="text-white/40 text-xs mb-4">Pokus {retryCount}/5</p>
            )}
            <div className="flex flex-col items-center gap-3">
              {manualRetry && (
                <button
                  onClick={manualRetry}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600/80 hover:bg-primary-500/80 text-void-DEFAULT font-semibold rounded-lg border border-primary-400/30 transition-all duration-200 text-sm"
                >
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  Zkusit znovu
                </button>
              )}
              {isRetrying && nextRetryIn !== null && nextRetryIn > 0 && (
                <p className="text-white/40 text-xs animate-pulse">
                  Další pokus za {nextRetryIn}s...
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <main id="main-content" className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6" role="main" aria-label="Tabule odjezdů Řež ↔ Praha">
      <section className="space-y-2" aria-label="Odjezdy do Prahy">
          <h2 className="flex items-center gap-2 px-1 text-sm sm:text-base font-semibold text-zinc-300">
            <ArrowRight className="w-4 h-4 text-primary-400" aria-hidden="true" />
            <span>Do Prahy</span>
          </h2>
          <DepartureBoard departures={toPragueDepartures} targetDateTime={targetDateTime} />
        </section>

      <section className="space-y-2" aria-label="Odjezdy z Prahy">
          <h2 className="flex items-center gap-2 px-1 text-sm sm:text-base font-semibold text-zinc-300">
            <ArrowLeft className="w-4 h-4 text-primary-400" aria-hidden="true" />
            <span>Z Prahy</span>
          </h2>
          <DepartureBoard departures={fromPragueDepartures} targetDateTime={targetDateTime} />
        </section>
    </main>
  );
};
