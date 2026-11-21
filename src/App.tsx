import { useState } from 'react';
import { Header } from './components/Header';
import { DepartureGrid } from './components/DepartureGrid';
import { useDepartures } from './hooks/useDepartures';
import { PragueStation } from './constants';
import { ThemeProvider } from './contexts/ThemeContext';
import { PRAGUE_TIME_ZONE } from './utils/pragueDateTime';
import { parseStationParam, parseTimeParam, serializeUrlState } from './utils/urlState';

const getStoredPragueStation = (): PragueStation => {
  return parseStationParam(localStorage.getItem('pragueStation')) ?? 'masarykovo';
};

const replaceUrlState = (station: PragueStation, time?: Date | null) => {
  const url = new URL(window.location.href);
  url.search = serializeUrlState(url.searchParams, station, time).toString();
  window.history.replaceState(window.history.state, '', url);
};

function App() {
  const [selectedDateTime, setSelectedDateTime] = useState(() => (
    parseTimeParam(new URLSearchParams(window.location.search).get('t'))
  ));
  const [pragueStation, setPragueStation] = useState(() => (
    parseStationParam(new URLSearchParams(window.location.search).get('s')) ?? getStoredPragueStation()
  ));

  const handlePragueStationChange = (station: PragueStation) => {
    setPragueStation(station);
    localStorage.setItem('pragueStation', station);
    replaceUrlState(station, selectedDateTime ? undefined : null);
  };

  const handleDateTimeChange = (date: Date | null) => {
    setSelectedDateTime(date);
    replaceUrlState(pragueStation, date);
  };

  const {
    trainToPrague,
    trainFromPrague,
    busToPrague,
    busFromPrague,
    failedBoards,
    isLoading,
    error,
    lastUpdate,
    refreshData,
    retryCount,
    isRetrying,
    nextRetryIn,
    manualRetry,
    bubnyHasTrains,
  } = useDepartures(selectedDateTime, pragueStation);

  return (
    <ThemeProvider>
      <div className="min-h-screen w-full">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-lg z-50 transition-all duration-200"
      >
        Přeskočit na hlavní obsah
      </a>
      <div className="relative z-10 container mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-12 max-w-7xl">
        <Header onRefresh={refreshData} isRefreshing={isLoading} selectedDateTime={selectedDateTime} onDateTimeChange={handleDateTimeChange} />
        <main id="main-content" className="space-y-6 sm:space-y-8">
          <DepartureGrid
            trainToPrague={trainToPrague}
            trainFromPrague={trainFromPrague}
            busToPrague={busToPrague}
            busFromPrague={busFromPrague}
            failedBoards={failedBoards}
            isLoading={isLoading}
            error={error}
            retryCount={retryCount}
            isRetrying={isRetrying}
            nextRetryIn={nextRetryIn}
            manualRetry={manualRetry}
            targetDateTime={selectedDateTime}
            pragueStation={pragueStation}
            onPragueStationChange={handlePragueStationChange}
            bubnyHasTrains={bubnyHasTrains}
          />
          
          {lastUpdate && !error && (
            <p className="text-center text-zinc-500 text-xs">
              {selectedDateTime ? 'Jízdní řád pro ' : 'Aktualizováno '}
              <time className="font-mono text-zinc-400">
                {selectedDateTime
                  ? selectedDateTime.toLocaleString('cs-CZ', {
                      timeZone: PRAGUE_TIME_ZONE,
                      weekday: 'short', day: 'numeric', month: 'short',
                      hour: '2-digit', minute: '2-digit', hour12: false,
                    })
                  : lastUpdate.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
                }
              </time>
            </p>
          )}
        </main>
      </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
