import React from 'react';
import { DepartureBoard } from './DepartureBoard';
import { Departure } from '../types';
import { Train, Bus, ArrowRight, ArrowLeft, AlertTriangle, Loader } from 'lucide-react';

interface DepartureGridProps {
  trainFromRez: Departure[];
  trainToRez: Departure[];
  busFromRez: Departure[];
  busToRez: Departure[];
  isLoading: boolean;
  error: string | null;
}

export const DepartureGrid: React.FC<DepartureGridProps> = ({
  trainFromRez,
  trainToRez,
  busFromRez,
  busToRez,
  isLoading,
  error
}) => {
  if (isLoading) {
    return (
      <section className="w-full" aria-label="Načítání jízdních řádů" role="status">
        <div className="flex justify-center items-center min-h-[500px]">
          <div className="text-center glass rounded-4xl p-16 border border-white/10 shadow-card max-w-lg">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-white/10 border-t-primary-400 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader className="w-8 h-8 text-primary-400 animate-pulse" aria-hidden="true" />
                </div>
              </div>
            </div>
            <h3 className="text-white text-3xl font-bold mb-4 text-shadow-sm">Načítání jízdních řádů</h3>
            <p className="text-white/80 text-lg leading-relaxed">Získávám aktuální data o odjezdech vlaků a autobusů...</p>
            <div className="mt-6 flex justify-center space-x-4">
              <div className="flex items-center space-x-2 bg-blue-500/10 px-4 py-2 rounded-full">
                <Train className="w-4 h-4 text-blue-300" aria-hidden="true" />
                <span className="text-blue-200 text-sm font-medium">Vlaky S4</span>
              </div>
              <div className="flex items-center space-x-2 bg-emerald-500/10 px-4 py-2 rounded-full">
                <Bus className="w-4 h-4 text-emerald-300" aria-hidden="true" />
                <span className="text-emerald-200 text-sm font-medium">Autobusy 371</span>
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
                  Zkuste obnovit stránku nebo zkontrolovat připojení k internetu.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-white/60">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-400/60 rounded-full"></div>
                <span>Problém s načítáním dat</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-amber-400/60 rounded-full"></div>
                <span>Zkuste to prosím znovu</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <main id="main-content" className="w-full space-y-12" role="main" aria-label="Jízdní řády vlaků a autobusů">
      {/* Enhanced Direction headers */}
      {/* <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
        <div className="text-center xl:text-left space-y-4">
          <div className="flex items-center justify-center xl:justify-start space-x-4 mb-4">
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-4 rounded-2xl border border-blue-400/20">
              <ArrowRight className="w-8 h-8 text-blue-300" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2 text-shadow-sm">Z Řeže do Prahy</h2>
              <p className="text-white/80 text-lg font-medium">Odjezdy směr Praha Masarykovo a Kobylisy</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 justify-center xl:justify-start">
            <div className="bg-blue-500/10 backdrop-blur-sm text-blue-200 px-4 py-2 rounded-2xl text-sm font-semibold border border-blue-400/20 flex items-center gap-2">
              <Train className="w-4 h-4" aria-hidden="true" />
              <span>Praha Masarykovo</span>
            </div>
            <div className="bg-emerald-500/10 backdrop-blur-sm text-emerald-200 px-4 py-2 rounded-2xl text-sm font-semibold border border-emerald-400/20 flex items-center gap-2">
              <Bus className="w-4 h-4" aria-hidden="true" />
              <span>Praha Kobylisy</span>
            </div>
          </div>
        </div>
        
        <div className="text-center xl:text-right space-y-4">
          <div className="flex items-center justify-center xl:justify-end space-x-4 mb-4">
            <div className="order-2 xl:order-1">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2 text-shadow-sm">Z Prahy do Řeže</h2>
              <p className="text-white/80 text-lg font-medium">Příjezdy z Prahy Masarykova a Kobylisy</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-4 rounded-2xl border border-purple-400/20 order-1 xl:order-2">
              <ArrowLeft className="w-8 h-8 text-purple-300" aria-hidden="true" />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 justify-center xl:justify-end">
            <div className="bg-blue-500/10 backdrop-blur-sm text-blue-200 px-4 py-2 rounded-2xl text-sm font-semibold border border-blue-400/20 flex items-center gap-2">
              <Train className="w-4 h-4" aria-hidden="true" />
              <span>z Masarykova</span>
            </div>
            <div className="bg-emerald-500/10 backdrop-blur-sm text-emerald-200 px-4 py-2 rounded-2xl text-sm font-semibold border border-emerald-400/20 flex items-center gap-2">
              <Bus className="w-4 h-4" aria-hidden="true" />
              <span>z Kobylisy</span>
            </div>
          </div>
        </div>
      </div> */}

      {/* Enhanced Departure boards grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
        {/* From Řež column */}
        <section className="space-y-8" aria-label="Odjezdy z Řeže">
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
            departures={trainFromRez}
          />
          <DepartureBoard
            title={{
              icon: <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 p-3 rounded-2xl border border-emerald-400/20">
                <Bus className="w-6 h-6 text-emerald-300" aria-hidden="true" />
              </div>,
              content: <div className="text-center">
                <div className="text-lg font-bold">371</div>
                <div className="text-sm text-white/70 font-medium">Řež → Praha Kobylisy</div>
              </div>
            }}
            departures={busFromRez}
          />
        </section>

        {/* To Řež column */}
        <section className="space-y-8" aria-label="Příjezdy do Řeže">
          <DepartureBoard
            title={{
              icon: <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-3 rounded-2xl border border-blue-400/20">
                <Train className="w-6 h-6 text-blue-300" aria-hidden="true" />
              </div>,
              content: <div className="text-center">
                <div className="text-lg font-bold">S4</div>
                <div className="text-sm text-white/70 font-medium">Praha Masarykovo → Řež</div>
              </div>
            }}
            departures={trainToRez}
          />
          <DepartureBoard
            title={{
              icon: <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 p-3 rounded-2xl border border-emerald-400/20">
                <Bus className="w-6 h-6 text-emerald-300" aria-hidden="true" />
              </div>,
              content: <div className="text-center">
                <div className="text-lg font-bold">371</div>
                <div className="text-sm text-white/70 font-medium">Praha Kobylisy → Řež</div>
              </div>
            }}
            departures={busToRez}
          />
        </section>
      </div>
    </main>
  );
};
