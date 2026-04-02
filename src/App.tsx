import { lazy, Suspense } from 'react';
import { Header} from './components/Header';
import { DepartureGrid } from './components/DepartureGrid';

const PerformanceMonitor = lazy(() => import('./components/PerformanceMonitor'));
import { useDepartures } from './hooks/useDepartures';
import { UI_CONFIG } from './constants';
import { ThemeProvider } from './contexts/ThemeContext';

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

  return (
    <ThemeProvider>
      <div className="min-h-screen w-full" role="application" aria-label="Jízdní řád Řež - Aplikace pro sledování odjezdů vlaků a autobusů">
      {/* Clean background — no decorative blobs */}
      
      {/* Main content */}
      <div className="relative z-10 container mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-12 max-w-7xl">
        <Header onRefresh={refreshData} isRefreshing={isLoading} />
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

          />
          
          {lastUpdate && !isLoading && !error && (
            <p className="text-center text-zinc-500 text-xs" aria-label="Poslední aktualizace">
              Aktualizováno{' '}
              <time className="font-mono text-zinc-400">
                {lastUpdate.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </time>
            </p>
          )}
          
          {/* Performance Monitor - configurable visibility */}
          {((import.meta.env.DEV && UI_CONFIG.showPerformanceMonitor) || 
            (import.meta.env.PROD && UI_CONFIG.showPerformanceInProduction && UI_CONFIG.showPerformanceMonitor)) && 
            <Suspense fallback={null}><PerformanceMonitor /></Suspense>}
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
