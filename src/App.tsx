import { useState } from 'react';
import { Header } from './components/Header';
import { DepartureGrid } from './components/DepartureGrid';
import { useDepartures } from './hooks/useDepartures';
import { PragueStation } from './constants';
import { ThemeProvider } from './contexts/ThemeContext';

const getStoredPragueStation = (): PragueStation => {
  const stored = localStorage.getItem('pragueStation');
  return stored === 'bubny' ? 'bubny' : 'masarykovo';
};

function App() {
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [pragueStation, setPragueStation] = useState<PragueStation>(getStoredPragueStation);

  const handlePragueStationChange = (station: PragueStation) => {
    setPragueStation(station);
    localStorage.setItem('pragueStation', station);
  };

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
  } = useDepartures(selectedDateTime, pragueStation);

  return (
    <ThemeProvider>
      <div className="min-h-screen w-full" role="application" aria-label="Jízdní řád Řež - Aplikace pro sledování odjezdů vlaků a autobusů">
      <div className="relative z-10 container mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-12 max-w-7xl">
        <Header onRefresh={refreshData} isRefreshing={isLoading} selectedDateTime={selectedDateTime} onDateTimeChange={setSelectedDateTime} />
        <div className="space-y-6 sm:space-y-8">
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
            targetDateTime={selectedDateTime}
            pragueStation={pragueStation}
            onPragueStationChange={handlePragueStationChange}
          />
          
          {lastUpdate && !error && (
            <p className="text-center text-zinc-500 text-xs" aria-label="Poslední aktualizace">
              {selectedDateTime ? 'Jízdní řád pro ' : 'Aktualizováno '}
              <time className="font-mono text-zinc-400">
                {selectedDateTime
                  ? selectedDateTime.toLocaleString('cs-CZ', {
                      weekday: 'short', day: 'numeric', month: 'short',
                      hour: '2-digit', minute: '2-digit', hour12: false,
                    })
                  : lastUpdate.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
                }
              </time>
            </p>
          )}
        </div>
      </div>
      
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
