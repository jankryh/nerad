import React from 'react';
import './Header.css';

export const Header: React.FC = () => {
  const currentTime = new Date().toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1>🚆 Jízdní řád z a do Řeže</h1>
          <p>Aktuální odjezdy vlaků S4 a autobusů 371</p>
        </div>
        <div className="header-right">
          <div className="current-time">
            <span className="time-label">Aktuální čas:</span>
            <span className="time-value">{currentTime}</span>
          </div>
          <div className="last-update">
            Poslední aktualizace: {new Date().toLocaleTimeString('cs-CZ', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
