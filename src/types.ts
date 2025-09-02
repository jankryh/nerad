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

export interface Route {
  id: string;
  name: string;
  mode: 'train' | 'bus';
  fromStop: string;
  toStop: string;
  fromStopId: string;
  toStopId: string;
  direction: 'from' | 'to';
}

export interface ApiError {
  message: string;
  status?: number;
}
