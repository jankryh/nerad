import React from 'react';
import { DepartureBoard } from './DepartureBoard';
import { Departure } from '../types';
import { Train, Bus, AlertTriangle, Loader, RefreshCw } from 'lucide-react';

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
}) => {
  if (isLoading) {
    return (
      <section className="w-full" aria-label="Načítání spojů mezi Řeží a Prahou" role="status">
        <div className="flex justify-center items-center min-h-[500px]">
          <div className="text-center glass rounded-4xl p-16 border border-white/10 shadow-card max-w-2xl">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-white/10 border-t-primary-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader className="w-8 h-8 text-primary-500 animate-pulse" aria-hidden="true" />
                </div>
              </div>
            </div>
            <h3 className="text-white text-3xl font-bold mb-4 text-shadow-sm font-heading">Načítání spojů</h3>
            <p className="text-white/80 text-lg leading-relaxed">Získávám aktuální odjezdy pro oba směry vlakem i autobusem...</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <div className="flex items-center space-x-2 bg-primary-500/10 px-4 py-2 rounded-full">
                <Train className="w-4 h-4 text-primary-400" aria-hidden="true" />
                <span className="text-primary-300 text-sm font-medium">Řež ↔ Praha</span>
              </div>
              <div className="flex items-center space-x-2 bg-accent-500/10 px-4 py-2 rounded-full">
                <Bus className="w-4 h-4 text-accent-400" aria-hidden="true" />
                <span className="text-accent-300 text-sm font-medium">Husinec ↔ Kobylisy</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full" aria-label="Chyba při načítání dat" role="alert">
        <div className="flex justify-center items-center min-h-[500px]">
          <div className="text-center glass rounded-4xl p-16 border border-red-500/20 shadow-card max-w-2xl">
            <div className="mb-8">
              <div className="w-20 h-20 bg-red-500/15 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto border border-red-400/20">
                <AlertTriangle className="w-10 h-10 text-red-400" aria-hidden="true" />
              </div>
            </div>
            <h3 className="mb-6 text-red-300 text-3xl font-bold text-shadow-sm font-heading">Chyba při načítání dat</h3>
            <div className="space-y-4 mb-8">
              <p className="text-white/90 text-lg leading-relaxed">{error}</p>
              <div className="bg-red-500/10 backdrop-blur-sm border border-red-400/20 rounded-2xl p-6">
                <p className="text-red-200/80 text-base leading-relaxed">
                  Zkus ručně obnovit data tlačítkem nahoře nebo zkontrolovat API přístup k PID datům.
                </p>
                {retryCount > 0 && (
                  <p className="text-red-200/60 text-sm mt-2">
                    Pokus {retryCount} z 5
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              {manualRetry && (
                <button
                  onClick={manualRetry}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600/80 hover:bg-primary-500/80 text-void-DEFAULT font-semibold rounded-2xl border border-primary-400/30 transition-all duration-200 hover:scale-105"
                >
                  <RefreshCw className="w-5 h-5" aria-hidden="true" />
                  Zkusit znovu
                </button>
              )}

              {isRetrying && nextRetryIn !== null && nextRetryIn > 0 && (
                <p className="text-white/60 text-sm animate-pulse">
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
    <main id="main-content" className="w-full space-y-8" role="main" aria-label="Odjezdy mezi Řeží a Prahou">
      <section className="space-y-6 sm:space-y-8" aria-label="Spoje do Prahy a z Prahy">
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary-500/30 to-primary-500/5"></div>
            <h2 className="text-primary-400 text-sm sm:text-base font-semibold uppercase tracking-[0.2em] font-heading">Do Prahy</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-primary-500/5 via-primary-500/30 to-transparent"></div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-8 lg:gap-10" aria-label="Odjezdy do Prahy vlakem a autobusem">
            <DepartureBoard
              title={{
                icon: <div className="bg-gradient-to-br from-primary-500/20 to-primary-600/20 p-3 rounded-2xl border border-primary-400/20">
                  <Train className="w-6 h-6 text-primary-400" aria-hidden="true" />
                </div>,
                content: <div className="text-center">
                  <div className="text-lg font-bold font-heading">S4</div>
                  <div className="text-sm text-white/70 font-medium">Řež → Praha Masarykovo</div>
                </div>
              }}
              departures={trainToPrague}
            />

            <DepartureBoard
              title={{
                icon: <div className="bg-gradient-to-br from-accent-500/20 to-accent-600/20 p-3 rounded-2xl border border-accent-400/20">
                  <Bus className="w-6 h-6 text-accent-400" aria-hidden="true" />
                </div>,
                content: <div className="text-center">
                  <div className="text-lg font-bold font-heading">371</div>
                  <div className="text-sm text-white/70 font-medium">Husinec, Řež rozc. → Kobylisy</div>
                </div>
              }}
              departures={busToPrague}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent-500/30 to-accent-500/5"></div>
            <h2 className="text-accent-400 text-sm sm:text-base font-semibold uppercase tracking-[0.2em] font-heading">Z Prahy</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-accent-500/5 via-accent-500/30 to-transparent"></div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-8 lg:gap-10" aria-label="Odjezdy z Prahy vlakem a autobusem">
            <DepartureBoard
              title={{
                icon: <div className="bg-gradient-to-br from-neon-cyan/20 to-accent-600/20 p-3 rounded-2xl border border-neon-cyan/20">
                  <Train className="w-6 h-6 text-neon-cyan" aria-hidden="true" />
                </div>,
                content: <div className="text-center">
                  <div className="text-lg font-bold font-heading">S4</div>
                  <div className="text-sm text-white/70 font-medium">Praha Masarykovo → Řež</div>
                </div>
              }}
              departures={trainFromPrague}
            />

            <DepartureBoard
              title={{
                icon: <div className="bg-gradient-to-br from-accent-500/20 to-neon-cyan/20 p-3 rounded-2xl border border-accent-400/20">
                  <Bus className="w-6 h-6 text-accent-400" aria-hidden="true" />
                </div>,
                content: <div className="text-center">
                  <div className="text-lg font-bold font-heading">371</div>
                  <div className="text-sm text-white/70 font-medium">Kobylisy → Husinec, Řež rozc.</div>
                </div>
              }}
              departures={busFromPrague}
            />
          </div>
        </div>
      </section>
    </main>
  );
};
