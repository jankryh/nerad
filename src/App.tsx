
import { Header } from './components/Header';
import { DepartureGrid } from './components/DepartureGrid';
import { useDepartures } from './hooks/useDepartures';
import './App.css';

function App() {
  const {
    trainFromRez,
    trainToRez,
    busFromRez,
    busToRez,
    isLoading,
    error,
    lastUpdate,
    refreshData,
  } = useDepartures();

  return (
    <div className="app">
      <Header />
      
      <div className="app-content">


        <DepartureGrid
          trainFromRez={trainFromRez}
          trainToRez={trainToRez}
          busFromRez={busFromRez}
          busToRez={busToRez}
          isLoading={isLoading}
          error={error}
        />
        
        {lastUpdate && !isLoading && !error && (
          <div className="refresh-info">
            <p>
              Data se automaticky obnovují každých 30 sekund. 
              Poslední aktualizace: {lastUpdate.toLocaleTimeString('cs-CZ', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              })}
            </p>
            <button 
              className="refresh-button"
              onClick={refreshData}
              disabled={isLoading}
            >
              {isLoading ? 'Načítání...' : 'Obnovit data'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
