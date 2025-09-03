// 📊 Komponenta pro zobrazení performance statistik

import React, { useState } from 'react';
import { usePerformance } from '../hooks/usePerformance';
import './PerformanceMonitor.css';

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

  const getPerformanceColor = (name: string) => {
    return isPerformanceGood(name) ? 'var(--success-color)' : 'var(--warning-color)';
  };

  return (
    <div className="performance-monitor">
      <div className="performance-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>📊 Performance Monitor</h3>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div className="performance-content">
          {/* Základní statistiky */}
          <div className="stats-overview">
            <div className="stat-card">
              <h4>📞 Total Calls</h4>
              <div className="stat-value">
                {Array.from(stats.values()).reduce((sum, stat) => sum + stat.totalCalls, 0)}
              </div>
            </div>
            
            <div className="stat-card">
              <h4>⏱️ Avg Response</h4>
              <div className="stat-value">
                {(() => {
                  const allStats = Array.from(stats.values());
                  const totalDuration = allStats.reduce((sum, stat) => sum + stat.totalDuration, 0);
                  const totalCalls = allStats.reduce((sum, stat) => sum + stat.totalCalls, 0);
                  return totalCalls > 0 ? `${(totalDuration / totalCalls).toFixed(2)}ms` : '0ms';
                })()}
              </div>
            </div>
            
            <div className="stat-card">
              <h4>🗄️ Cache Size</h4>
              <div className="stat-value">
                {Array.from(stats.values()).length}
              </div>
            </div>
          </div>

          {/* Detailní statistiky */}
          <div className="detailed-stats">
            <h4>🔍 API Endpoints</h4>
            {Array.from(stats.entries()).map(([name, stat]) => (
              <div key={name} className="endpoint-stat">
                <div className="endpoint-header">
                  <span className="performance-icon" style={{ color: getPerformanceColor(name) }}>
                    {getPerformanceIcon(name)}
                  </span>
                  <span className="endpoint-name">{name}</span>
                  <span className="endpoint-calls">{stat.totalCalls} calls</span>
                </div>
                
                {showDetails && (
                  <div className="endpoint-details">
                    <div className="detail-row">
                      <span>Average:</span>
                      <span className="detail-value">{stat.averageDuration.toFixed(2)}ms</span>
                    </div>
                    <div className="detail-row">
                      <span>Min:</span>
                      <span className="detail-value">{stat.minDuration.toFixed(2)}ms</span>
                    </div>
                    <div className="detail-row">
                      <span>Max:</span>
                      <span className="detail-value">{stat.maxDuration.toFixed(2)}ms</span>
                    </div>
                    <div className="detail-row">
                      <span>Last call:</span>
                      <span className="detail-value">
                        {stat.lastCall ? new Date(stat.lastCall).toLocaleTimeString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Akce */}
          <div className="performance-actions">
            <button 
              className="action-btn details-btn"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Skrýt detaily' : 'Zobrazit detaily'}
            </button>
            
            <button 
              className="action-btn clear-btn"
              onClick={clearCache}
            >
              🗄️ Vyčistit cache
            </button>
            
            <button 
              className="action-btn reset-btn"
              onClick={resetMetrics}
            >
              🔄 Reset metriky
            </button>
            
            <button 
              className="action-btn export-btn"
              onClick={handleExport}
            >
              📥 Export data
            </button>
          </div>

          {/* Performance report */}
          <div className="performance-report">
            <h4>📋 Performance Report</h4>
            <pre className="report-content">{performanceReport}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
