import React from 'react';
import { Departure } from '../types';
import './DepartureBoard.css';

interface DepartureBoardProps {
  title: string;
  departures: Departure[];
  isLoading?: boolean;
  error?: string;
}

export const DepartureBoard: React.FC<DepartureBoardProps> = ({
  title,
  departures,
  isLoading = false,
  error
}) => {
  const formatTime = (isoTime: string): string => {
    try {
      const date = new Date(isoTime);
      return date.toLocaleTimeString('cs-CZ', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return '--:--';
    }
  };

  const calculateArrivalTime = (departure: Departure): string => {
    try {
      const departureTime = new Date(departure.scheduledTime);
      let arrivalTime: Date;
      
      if (departure.mode === 'train') {
        // Vlak S4: Řež ↔ Praha Masarykovo (cca 18 minut)
        arrivalTime = new Date(departureTime.getTime() + 18 * 60 * 1000); // +18 minut
      } else {
        // Autobus 371: Řež ↔ Praha Kobylisy (cca 28 minut)
        arrivalTime = new Date(departureTime.getTime() + 28 * 60 * 1000); // +28 minut
      }
      
      return arrivalTime.toLocaleTimeString('cs-CZ', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return '--:--';
    }
  };





  if (isLoading) {
    return (
      <div className="departure-board loading">
        <h3>{title}</h3>
        <div className="loading-spinner">Načítání...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="departure-board error">
        <h3>{title}</h3>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!departures || departures.length === 0) {
    return (
      <div className="departure-board empty">
        <h3>{title}</h3>
        <div className="empty-message">Žádné odjezdy</div>
      </div>
    );
  }

  return (
    <div className="departure-board">
      <h3>{title}</h3>
      <table className="departures-table">
        <thead>
          <tr>
            <th>Odjezd</th>
            <th>Příjezd</th>
            <th>Zpoždění</th>
          </tr>
        </thead>
        <tbody>
          {departures.map((departure, index) => (
            <tr
              key={`${departure.line}-${departure.scheduledTime}-${index}`}
              className={index === 0 ? 'next-departure' : ''}
            >
              <td className="time-cell departure-time">
                {formatTime(departure.scheduledTime)}
              </td>
              <td className="time-cell arrival-time">
                {calculateArrivalTime(departure)}
              </td>
              <td className="delay-cell">
                {departure.delay !== null && departure.delay > 0 ? (
                  <span className="delay">+{departure.delay} min</span>
                ) : (
                  <span className="on-time">včas</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
