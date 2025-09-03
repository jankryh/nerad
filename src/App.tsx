
import { Header } from './components/Header';
import { DepartureGrid } from './components/DepartureGrid';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { useDepartures } from './hooks/useDepartures';

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
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" role="application" aria-label="Jízdní řád Řež - Aplikace pro sledování odjezdů vlaků a autobusů">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-7xl">
        <Header />
        
        <div className="space-y-12 lg:space-y-16">
          <DepartureGrid
            trainFromRez={trainFromRez}
            trainToRez={trainToRez}
            busFromRez={busFromRez}
            busToRez={busToRez}
            isLoading={isLoading}
            error={error}
          />
          
          {lastUpdate && !isLoading && !error && (
            <section className="text-center animate-slide-in" aria-label="Informace o automatické aktualizaci dat">
              <div className="inline-block glass glass-hover rounded-4xl p-8 sm:p-10 lg:p-12 border border-white/10 shadow-card hover:shadow-hover transition-all duration-400 max-w-2xl">
                <div className="flex items-center justify-center mb-6 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
                    </div>
                    <p className="text-white/90 text-lg font-semibold">
                      Data se automaticky obnovují každých 30 sekund
                    </p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <p className="text-white/70 text-base">
                    Poslední aktualizace: <time className="font-mono font-medium text-white/80">
                      {lastUpdate.toLocaleTimeString('cs-CZ', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      })}
                    </time>
                  </p>
                  
                  <button 
                    className="bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 focus:from-primary-700 focus:to-purple-700 text-white font-semibold py-4 px-8 rounded-3xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl focus:shadow-xl transform hover:-translate-y-1 focus:-translate-y-1 focus-ring active:scale-95"
                    onClick={refreshData}
                    disabled={isLoading}
                    aria-label={isLoading ? 'Načítání dat...' : 'Obnovit data o odjezdech'}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-3">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Načítání...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Obnovit data</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </section>
          )}
          
          {/* Performance Monitor - pouze v development módu */}
          {import.meta.env.DEV && <PerformanceMonitor />}
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
  );
}

export default App;
