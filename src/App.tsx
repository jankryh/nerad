
import { useState } from 'react';
import { Header } from './components/Header';
import { DepartureGrid } from './components/DepartureGrid';
import { DirectionFilter } from './components/DirectionFilter';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { useDepartures } from './hooks/useDepartures';
import { UI_CONFIG } from './constants';
import { ThemeProvider } from './contexts/ThemeContext';
import type { DirectionFilter as DirectionFilterType } from './components/DepartureGrid';

function App() {
  const {
    trainToPrague,
    trainFromPrague,
    busToPrague,
    busFromPrague,
    isLoading,
    error,
    lastUpdate,
    refreshData,
    retryCount,
    isRetrying,
    nextRetryIn,
    manualRetry,
  } = useDepartures();

  const [directionFilter, setDirectionFilter] = useState<DirectionFilterType>('all');

  return (
    <ThemeProvider>
      <div className="min-h-screen w-full" role="application" aria-label="Jízdní řád Řež - Aplikace pro sledování odjezdů vlaků a autobusů">
      {/* Background decorative mesh blobs — cyan/teal/blue */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-0 left-1/4 w-72 h-72 rounded-full blur-3xl animate-float"
          style={{ backgroundColor: 'rgba(245, 158, 11, 0.06)' }}
        ></div>
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '1s', backgroundColor: 'rgba(139, 92, 246, 0.05)' }}
        ></div>
        <div
          className="absolute top-1/2 left-0 w-64 h-64 rounded-full blur-3xl animate-pulse-slow"
          style={{ backgroundColor: 'rgba(0, 212, 255, 0.04)' }}
        ></div>
        <div
          className="absolute top-1/4 right-0 w-80 h-80 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '2s', backgroundColor: 'rgba(245, 158, 11, 0.03)' }}
        ></div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 container mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-12 max-w-7xl">
        <Header onRefresh={refreshData} isRefreshing={isLoading} />
        <DirectionFilter filter={directionFilter} onChange={setDirectionFilter} />

        <div className="space-y-6 sm:space-y-12 lg:space-y-16">
          <DepartureGrid
            trainToPrague={trainToPrague}
            trainFromPrague={trainFromPrague}
            busToPrague={busToPrague}
            busFromPrague={busFromPrague}
            isLoading={isLoading}
            error={error}
            retryCount={retryCount}
            isRetrying={isRetrying}
            nextRetryIn={nextRetryIn}
            manualRetry={manualRetry}
            filter={directionFilter}
          />
          
          {lastUpdate && !isLoading && !error && (
            <section className="text-center animate-slide-in" aria-label="Informace o poslední aktualizaci dat">
              <div className="inline-block glass glass-hover rounded-2xl sm:rounded-4xl p-4 sm:p-8 lg:p-12 border border-white/10 shadow-card hover:shadow-hover transition-all duration-400 max-w-2xl">
                <div className="flex items-center justify-center mb-4 sm:mb-6 flex-wrap gap-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 w-2 h-2 sm:w-3 sm:h-3 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
                    </div>
                    <p className="text-white/90 text-sm sm:text-lg font-semibold">
                      Data se obnovují ručně tlačítkem Obnovit nahoře
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4 sm:space-y-6">
                  <p className="text-white/70 text-sm sm:text-base">
                    Poslední aktualizace: <time className="font-mono font-medium text-white/80">
                      {lastUpdate.toLocaleTimeString('cs-CZ', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      })}
                    </time>
                  </p>
                </div>
              </div>
            </section>
          )}
          
          {/* Performance Monitor - configurable visibility */}
          {((import.meta.env.DEV && UI_CONFIG.showPerformanceMonitor) || 
            (import.meta.env.PROD && UI_CONFIG.showPerformanceInProduction && UI_CONFIG.showPerformanceMonitor)) && 
            <PerformanceMonitor />}
        </div>
      </div>
      
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-lg z-50 transition-all duration-200"
      >
        Přeskočit na hlavní obsah
      </a>
      </div>
    </ThemeProvider>
  );
}

export default App;
