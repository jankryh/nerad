import { DepartureBoardResponse } from '../types';

// Mock data pro demonstraci aplikace
const generateMockDepartures = (line: string, mode: 'train' | 'bus', direction: string): DepartureBoardResponse => {
  const now = new Date();
  const departures = [];
  
  // Generovat 3 odjezdy s časovými rozestupy
  for (let i = 0; i < 3; i++) {
    const departureTime = new Date(now.getTime() + (i * 20 + 5) * 60000); // +5, +25, +45 minut
    
    departures.push({
      id: `mock_${line}_${i}_${Date.now()}`,
      line,
      mode,
      direction,
      scheduledTime: departureTime.toISOString(),
      delay: i === 0 ? Math.floor(Math.random() * 5) : 0, // První odjezd může mít zpoždění
      routeId: line,
      tripId: `trip_${line}_${i}`,
      platform: null
    });
  }
  
  return { departures };
};

export const mockApi = {
  async getAllDepartures(): Promise<{
    trainFromRez: DepartureBoardResponse;
    trainToRez: DepartureBoardResponse;
    busFromRez: DepartureBoardResponse;
    busToRez: DepartureBoardResponse;
  }> {
    // Simulovat API latenci
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      trainFromRez: generateMockDepartures('S4', 'train', 'Praha Masarykovo nádraží'),
      trainToRez: generateMockDepartures('S4', 'train', 'Řež'),
      busFromRez: generateMockDepartures('371', 'bus', 'Praha Kobylisy'),
      busToRez: generateMockDepartures('371', 'bus', 'Husinec,Rozc. B')
    };
  }
};
