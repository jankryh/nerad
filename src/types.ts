export interface Departure {
  id: string;
  line: string;
  mode: 'train' | 'bus';
  direction: string;
  scheduledTime: string;
  predictedTime?: string;

  delay: number | null;
  platform?: string | null;
  routeId: string;
  tripId: string;
}

export interface DepartureBoardResponse {
  departures: Departure[];
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface Arrival {
  id: string;
  line: string;
  mode: 'train' | 'bus';
  direction: string;
  scheduledTime: string;
  predictedTime?: string;
  delay: number | null;
  platform?: string | null;
  routeId: string;
  tripId: string;
}

export interface ArrivalBoardResponse {
  arrivals: Arrival[];
  message?: string;
}

export interface TravelTimeCalculation {
  tripId: string;
  line: string;
  mode: 'train' | 'bus';
  duration: number;
  isRealTime: boolean;
  fallbackUsed: boolean;
  calculatedAt: Date;
  departureTime?: Date;
  arrivalTime?: Date;
  delay?: number;
  sampleCount?: number;
  minDuration?: number;
  maxDuration?: number;
}
