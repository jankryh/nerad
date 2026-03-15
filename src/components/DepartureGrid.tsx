import React from 'react';
import { DepartureBoard } from './DepartureBoard';
import { Departure } from '../types';
import { Train, Bus, ArrowRightLeft, AlertTriangle, Loader } from 'lucide-react';

interface DepartureGridProps {
  trainToPrague: Departure[];
  trainFromPrague: Departure[];
  busToPrague: Departure[];
  busFromPrague: Departure[];
  isLoading: boolean;
  error: string | null;
}

export const DepartureGrid: React.FC<DepartureGridProps> = ({
  trainToPrague,
  trainFromPrague,
  busToPrague,
  busFromPrague,
  isLoading,
  error
}) => {
  if (isLoading) {
    return (
      <section className="w-full" aria-label="Načítání spojů mezi Řeží a Prahou" role="status">
        <div className="flex justify-center items-center min-h-[500px]">
          <div className="text-center glass rounded-4xl p-16 border border-white/10 shadow-card max-w-2xl">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-white/10 border-t-primary-400 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader className="w-8 h-8 text-primary-400 animate-pulse" aria-hidden="true" />
                </div>
              </div>
            </div>
            <h3 className="text-white text-3xl font-bold mb-4 text-shadow-sm">Načítání spojů</h3>
            <p className="text-white/80 text-lg leading-relaxed">Získávám aktuální odjezdy pro oba směry vlakem i autobusem...</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <div className="flex items-center space-x-2 bg-blue-500/10 px-4 py-2 rounded-full">
                <Train className="w-4 h-4 text-blue-300" aria-hidden="true" />
                <span className="text-blue-200 text-sm font-medium">Řež ↔ Praha</span>
              </div>
              <div className="flex items-center space-x-2 bg-emerald-500/10 px-4 py-2 rounded-full">
                <Bus className="w-4 h-4 text-emerald-300" aria-hidden="true" />
                <span className="text-emerald-200 text-sm font-medium">Husinec ↔ Kobylisy</span>
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
            <h3 className="mb-6 text-red-300 text-3xl font-bold text-shadow-sm">Chyba při načítání dat</h3>
            <div className="space-y-4 mb-8">
              <p className="text-white/90 text-lg leading-relaxed">{error}</p>
              <div className="bg-red-500/10 backdrop-blur-sm border border-red-400/20 rounded-2xl p-6">
                <p className="text-red-200/80 text-base leading-relaxed">
                  Zkus ručně obnovit data tlačítkem nahoře nebo zkontrolovat API přístup k PID datům.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <main id="main-content" className="w-full space-y-8" role="main" aria-label="Odjezdy mezi Řeží a Prahou">
      <section className="glass rounded-3xl sm:rounded-4xl border border-white/10 shadow-card p-4 sm:p-6 lg:p-8" aria-label="Přehled všech směrů">
        <div className="flex items-center justify-center gap-3 sm:gap-4 text-center">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-2 sm:p-3">
            <ArrowRightLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary-300" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-white text-xl sm:text-2xl font-bold">Oba směry přehledně</h2>
            <p className="text-white/70 text-sm sm:text-base">Vlak i bus tam i zpátky na jedné obrazovce</p>
          </div>
        </div>
      </section>

      <section className="space-y-6 sm:space-y-8" aria-label="Spoje do Prahy a z Prahy">
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-white/5"></div>
            <h2 className="text-white/90 text-sm sm:text-base font-semibold uppercase tracking-[0.2em]">Do Prahy</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-white/5 via-white/20 to-transparent"></div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-8 lg:gap-10" aria-label="Odjezdy do Prahy vlakem a autobusem">
            <DepartureBoard
              title={{
                icon: <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-3 rounded-2xl border border-blue-400/20">
                  <Train className="w-6 h-6 text-blue-300" aria-hidden="true" />
                </div>,
                content: <div className="text-center">
                  <div className="text-lg font-bold">S4</div>
                  <div className="text-sm text-white/70 font-medium">Řež → Praha Masarykovo</div>
                </div>
              }}
              departures={trainToPrague}
            />

            <DepartureBoard
              title={{
                icon: <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 p-3 rounded-2xl border border-emerald-400/20">
                  <Bus className="w-6 h-6 text-emerald-300" aria-hidden="true" />
                </div>,
                content: <div className="text-center">
                  <div className="text-lg font-bold">371</div>
                  <div className="text-sm text-white/70 font-medium">Husinec, Řež rozc. → Kobylisy</div>
                </div>
              }}
              departures={busToPrague}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-white/5"></div>
            <h2 className="text-white/90 text-sm sm:text-base font-semibold uppercase tracking-[0.2em]">Z Prahy</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-white/5 via-white/20 to-transparent"></div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-8 lg:gap-10" aria-label="Odjezdy z Prahy vlakem a autobusem">
            <DepartureBoard
              title={{
                icon: <div className="bg-gradient-to-br from-cyan-500/20 to-sky-600/20 p-3 rounded-2xl border border-cyan-400/20">
                  <Train className="w-6 h-6 text-cyan-300" aria-hidden="true" />
                </div>,
                content: <div className="text-center">
                  <div className="text-lg font-bold">S4</div>
                  <div className="text-sm text-white/70 font-medium">Praha Masarykovo → Řež</div>
                </div>
              }}
              departures={trainFromPrague}
            />

            <DepartureBoard
              title={{
                icon: <div className="bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20 p-3 rounded-2xl border border-fuchsia-400/20">
                  <Bus className="w-6 h-6 text-fuchsia-300" aria-hidden="true" />
                </div>,
                content: <div className="text-center">
                  <div className="text-lg font-bold">371</div>
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
