import React from 'react';
import { DepartureBoard } from './DepartureBoard';
import { Departure } from '../types';
import './DepartureGrid.css';

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
      <div className="departure-grid">
        <div className="loading-container">
          <div className="loading-spinner">Načítání jízdních řádů...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="departure-grid">
        <div className="error-container">
          <div className="error-message">
            <h3>Chyba při načítání dat</h3>
            <p>{error}</p>
            <p>Zkuste obnovit stránku nebo zkontrolovat připojení k internetu.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="departure-grid">
      <div className="grid-row">
        <div className="grid-column">
          <DepartureBoard
            title="🚆 Vlak S4 - Z Řeže do Prahy"
            departures={trainFromRez}
          />
          <DepartureBoard
            title="🚌 Autobus 371 - Z Řeže do Prahy"
            departures={busFromRez}
          />
        </div>
        <div className="grid-column">
          <DepartureBoard
            title="🚆 Vlak S4 - Z Prahy do Řeže"
            departures={trainToRez}
          />
          <DepartureBoard
            title="🚌 Autobus 371 - Z Prahy do Řeže"
            departures={busToRez}
          />
        </div>
      </div>
    </div>
  );
};
