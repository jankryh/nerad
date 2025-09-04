import { departuresService } from './services/DeparturesService';
import { measure } from '../utils/performance';
import { DepartureBoardResponse, ArrivalBoardResponse, TravelTimeCalculation } from '../types';

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

// Funkce pro získání příjezdů
export const getArrivals = async (
  stopPlaceId: string,
  lineId: string,
  limit: number = 3,
  direction?: string
): Promise<ArrivalBoardResponse> => {
  return measure.async('getArrivals', async () => {
    return departuresService.getArrivals({
      stopPlaceId,
      lineId,
      limit,
      direction
    });
  }, { stopPlaceId, lineId, direction });
};

// Funkce pro výpočet doby jízdy
export const calculateTravelTime = async (
  departureStopId: string,
  arrivalStopId: string,
  lineId: string,
  direction?: string
): Promise<TravelTimeCalculation[]> => {
  return measure.async('calculateTravelTime', async () => {
    return departuresService.calculateTravelTime({
      departureStopId,
      arrivalStopId,
      lineId,
      direction
    });
  }, { departureStopId, arrivalStopId, lineId, direction });
};
