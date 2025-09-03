import { departuresService } from './services/DeparturesService';
import { measure } from '../utils/performance';
import { DepartureBoardResponse } from '../types';

// Funkce pro získání odjezdů z V2 PID Departure Boards API
export const getDepartures = async (
  stopPlaceId: string,
  lineId: string,
  limit: number = 3,
  direction?: string
): Promise<DepartureBoardResponse> => {
  return measure.async('getDepartures', async () => {
    return departuresService.getDepartures({
      stopPlaceId,
      lineId,
      limit,
      direction
    });
  }, { stopPlaceId, lineId, direction });
};

// Funkce pro získání všech potřebných odjezdů
export const getAllDepartures = async () => {
  return measure.async('getAllDepartures', async () => {
    return departuresService.getAllDepartures();
  });
};
