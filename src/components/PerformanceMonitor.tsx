// 📊 Komponenta pro zobrazení performance statistik

import React, { useState } from 'react';
import { usePerformance } from '../hooks/usePerformance';

export const PerformanceMonitor: React.FC = () => {
  const { stats, performanceReport, clearCache, resetMetrics, exportData, isPerformanceGood } = usePerformance();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPerformanceIcon = (name: string) => {
    return isPerformanceGood(name) ? '✅' : '⚠️';
  };



  return (
    <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl">
      <div 
        className="flex justify-between items-center cursor-pointer hover:bg-white/10 rounded-t-3xl p-6 transition-all duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-xl">
            <span className="text-white text-lg">📊</span>
          </div>
          <h3 className="text-white font-semibold text-xl">Performance Monitor</h3>
        </div>
        <div className={`text-white/70 text-sm transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 border-t border-white/10 space-y-6">
          {/* Základní statistiky */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                  <span className="text-blue-300 text-lg">📞</span>
                </div>
                <h4 className="text-white/80 text-sm font-medium">Total Calls</h4>
              </div>
              <div className="text-white text-2xl font-bold">
                {Array.from(stats.values()).reduce((sum, stat) => sum + stat.totalCalls, 0)}
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-green-500/20 p-2 rounded-lg">
                  <span className="text-green-300 text-lg">⏱️</span>
                </div>
                <h4 className="text-white/80 text-sm font-medium">Avg Response</h4>
              </div>
              <div className="text-white text-2xl font-bold">
                {(() => {
                  const allStats = Array.from(stats.values());
                  const totalDuration = allStats.reduce((sum, stat) => sum + stat.totalDuration, 0);
                  const totalCalls = allStats.reduce((sum, stat) => sum + stat.totalCalls, 0);
                  return totalCalls > 0 ? `${(totalDuration / totalCalls).toFixed(2)}ms` : '0ms';
                })()}
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-purple-500/20 p-2 rounded-lg">
                  <span className="text-purple-300 text-lg">🗄️</span>
                </div>
                <h4 className="text-white/80 text-sm font-medium">Cache Size</h4>
              </div>
              <div className="text-white text-2xl font-bold">
                {Array.from(stats.values()).length}
              </div>
            </div>
          </div>

          {/* Detailní statistiky */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <h4 className="text-white font-medium mb-4 flex items-center space-x-2">
              <span className="text-lg">🔍</span>
              <span>API Endpoints</span>
            </h4>
            <div className="space-y-3">
              {Array.from(stats.entries()).map(([name, stat]) => (
                <div key={name} className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">
                        {getPerformanceIcon(name)}
                      </span>
                      <span className="text-white font-medium">{name}</span>
                    </div>
                    <span className="text-white/70 text-sm bg-white/10 px-3 py-1 rounded-full">
                      {stat.totalCalls} calls
                    </span>
                  </div>
                  
                  {showDetails && (
                    <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Average:</span>
                          <span className="text-white font-mono">{stat.averageDuration.toFixed(2)}ms</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Min:</span>
                          <span className="text-white font-mono">{stat.minDuration.toFixed(2)}ms</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Max:</span>
                          <span className="text-white font-mono">{stat.maxDuration.toFixed(2)}ms</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Last call:</span>
                          <span className="text-white font-mono text-xs">
                            {stat.lastCall ? new Date(stat.lastCall).toLocaleTimeString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Akce */}
          <div className="flex flex-wrap gap-3">
            <button 
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 shadow-lg"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Skrýt detaily' : 'Zobrazit detaily'}
            </button>
            
            <button 
              className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 shadow-lg flex items-center space-x-2"
              onClick={clearCache}
            >
              <span>🗄️</span>
              <span>Vyčistit cache</span>
            </button>
            
            <button 
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 shadow-lg flex items-center space-x-2"
              onClick={resetMetrics}
            >
              <span>🔄</span>
              <span>Reset metriky</span>
            </button>
            
            <button 
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 shadow-lg flex items-center space-x-2"
              onClick={handleExport}
            >
              <span>📥</span>
              <span>Export data</span>
            </button>
          </div>

          {/* Performance report */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
              <span className="text-lg">📋</span>
              <span>Performance Report</span>
            </h4>
            <div className="bg-black/20 rounded-xl p-4 border border-white/10">
              <pre className="text-white/80 text-xs font-mono overflow-auto max-h-32 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {performanceReport}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
