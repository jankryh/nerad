import axios from 'axios';
import {
  API_BASE_URL,
  API_KEY,
  API_REQUEST_TIMEOUT,
  BOARD_CACHE_TTL,
  BOARD_CONFIG,
  STOPS,
  TRAVEL_TIMES,
} from '../constants';
import {
  Arrival,
  ArrivalBoardResponse,
  ApiError,
  Departure,
  DepartureBoardResponse,
  TravelTimeCalculation,
} from '../types';
import { logger } from '../utils/logger';

type BoardMode = 'departures' | 'arrivals';
type Direction = 'to-masarykovo' | 'to-rez' | 'to-kobylisy' | 'to-husinec';

interface BoardQuery {
  stopPlaceId: string;
  lineId: string;
  limit?: number;
  direction?: string;
  mode?: BoardMode;
  useCache?: boolean;
}

interface BoardApiItem {
  route?: { short_name?: string; type?: number };
  trip?: { id?: string; headsign?: string };
  stop?: { platform_code?: string | null };
  delay?: { minutes?: number | null };
  departure_timestamp?: { scheduled?: string; predicted?: string };
  arrival_timestamp?: { scheduled?: string; predicted?: string };
}

interface BoardApiResponse {
  departures?: BoardApiItem[];
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_REQUEST_TIMEOUT,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

const usesProxy = API_BASE_URL.startsWith('/');
if (API_KEY && !usesProxy) {
  api.defaults.headers.common['X-Access-Token'] = API_KEY;
}

const boardCache = new Map<string, { expiresAt: number; data: BoardApiResponse }>();

// ROUTES derived from BOARD_CONFIG for backward compatibility
const ROUTES = {
  rezToMasarykovo: { stopPlaceId: BOARD_CONFIG.trainToPrague.stopId, lineId: BOARD_CONFIG.trainToPrague.lineIds[0], direction: BOARD_CONFIG.trainToPrague.direction as Direction },
  masarykovoToRez: { stopPlaceId: BOARD_CONFIG.trainFromPrague.stopId, lineId: BOARD_CONFIG.trainFromPrague.lineIds[0], direction: BOARD_CONFIG.trainFromPrague.direction as Direction },
  husinecsToKobylisy: { stopPlaceId: BOARD_CONFIG.busToPrague.stopId, lineId: BOARD_CONFIG.busToPrague.lineIds[0], direction: BOARD_CONFIG.busToPrague.direction as Direction },
  kobylisyToHusinec: { stopPlaceId: BOARD_CONFIG.busFromPrague.stopId, lineId: BOARD_CONFIG.busFromPrague.lineIds[0], direction: BOARD_CONFIG.busFromPrague.direction as Direction },
} as const;

const VALID_STOP_IDS: Set<string> = new Set(Object.values(STOPS));
const VALID_LINE_IDS: Set<string> = new Set(["S4", "371"]);
const VALID_DIRECTIONS: Set<string> = new Set(["to-masarykovo", "to-rez", "to-kobylisy", "to-husinec"]);

const validateBoardQuery = (stopPlaceId: string, lineId: string, limit?: number, direction?: string): void => {
  if (!VALID_STOP_IDS.has(stopPlaceId)) {
    throw new Error(`Invalid stopPlaceId: ${stopPlaceId}`);
  }
  if (!VALID_LINE_IDS.has(lineId)) {
    throw new Error(`Invalid lineId: ${lineId}`);
  }
  if (limit !== undefined && (limit < 1 || limit > 50 || !Number.isInteger(limit))) {
    throw new Error(`Invalid limit: ${limit}`);
  }
  if (direction !== undefined && !VALID_DIRECTIONS.has(direction)) {
    throw new Error(`Invalid direction: ${direction}`);
  }
};

const getCacheKey = ({ stopPlaceId, lineId, direction, mode = 'departures' }: Required<Pick<BoardQuery, 'stopPlaceId' | 'lineId'>> & Pick<BoardQuery, 'direction' | 'mode'>) =>
  `${mode}:${stopPlaceId}:${lineId}:${direction ?? 'all'}`;

const isTrain = (item: BoardApiItem) => item.route?.type === 2;

const normalizeDeparture = (item: BoardApiItem): Departure => ({
  id: item.trip?.id ?? `dep-${item.route?.short_name ?? 'unknown'}-${item.departure_timestamp?.scheduled ?? Date.now()}`,
  scheduledTime: item.departure_timestamp?.scheduled ?? item.departure_timestamp?.predicted ?? new Date().toISOString(),
  predictedTime: item.departure_timestamp?.predicted,
  delay: item.delay?.minutes ?? 0,
  line: item.route?.short_name ?? 'N/A',
  direction: item.trip?.headsign ?? 'N/A',
  mode: isTrain(item) ? 'train' : 'bus',
  platform: item.stop?.platform_code ?? null,
  routeId: item.route?.short_name ?? 'N/A',
  tripId: item.trip?.id ?? 'N/A',
});

const normalizeArrival = (item: BoardApiItem): Arrival => ({
  id: item.trip?.id ?? `arr-${item.route?.short_name ?? 'unknown'}-${item.arrival_timestamp?.scheduled ?? Date.now()}`,
  scheduledTime: item.arrival_timestamp?.scheduled ?? item.arrival_timestamp?.predicted ?? new Date().toISOString(),
  predictedTime: item.arrival_timestamp?.predicted,
  delay: item.delay?.minutes ?? 0,
  line: item.route?.short_name ?? 'N/A',
  direction: item.trip?.headsign ?? 'N/A',
  mode: isTrain(item) ? 'train' : 'bus',
  platform: item.stop?.platform_code ?? null,
  routeId: item.route?.short_name ?? 'N/A',
  tripId: item.trip?.id ?? 'N/A',
});

/**
 * Fallback headsign matching — používá se pokud API nefiltruje dostatečně přes routeId/lineId.
 * Konfigurace headsign patterns je v BOARD_CONFIG (constants.ts).
 * Pokud API začne podporovat server-side direction filtering, tuto funkci lze odstranit.
 */
const matchesDirection = (item: BoardApiItem, direction?: string) => {
  if (!direction) return true;

  const boardConfig = Object.values(BOARD_CONFIG).find((cfg) => cfg.direction === direction);
  if (!boardConfig) return true;

  const headsign = item.trip?.headsign ?? '';
  const { include, exclude } = boardConfig.headsignPatterns;

  const matchesInclude = include.length === 0 || include.some((pattern) => headsign.includes(pattern));
  const matchesExclude = exclude.length > 0 && exclude.some((pattern) => headsign.includes(pattern));

  return matchesInclude && !matchesExclude;
};

const fetchBoard = async ({
  stopPlaceId,
  lineId,
  limit = 3,
  direction,
  mode = 'departures',
  useCache = true,
}: BoardQuery): Promise<BoardApiItem[]> => {
  validateBoardQuery(stopPlaceId, lineId, limit, direction);
  const cacheKey = getCacheKey({ stopPlaceId, lineId, direction, mode });
  const now = Date.now();

  if (useCache) {
    const cached = boardCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.data.departures ?? [];
    }
  }

  const response = await api.get<BoardApiResponse>('/departureboards', {
    params: {
      'ids[]': stopPlaceId,
      limit: 50,
      minutesAfter: 240,
      mode,
      order: 'real',
    },
  });

  // Filtruj přes lineIds z BOARD_CONFIG pokud existuje konfigurace pro daný direction
  const boardConfig = direction
    ? Object.values(BOARD_CONFIG).find((cfg) => cfg.direction === direction)
    : undefined;
  const allowedLineIds = boardConfig ? boardConfig.lineIds : [lineId];

  const filtered = (response.data.departures ?? [])
    .filter((item) => allowedLineIds.includes(item.route?.short_name ?? ''))
    .filter((item) => matchesDirection(item, direction))
    .slice(0, limit);

  if (useCache) {
    boardCache.set(cacheKey, {
      expiresAt: now + BOARD_CACHE_TTL,
      data: { departures: filtered },
    });
  }

  return filtered;
};

const toApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 401 || status === 403) {
      return {
        status,
        message: usesProxy
          ? 'PID API odmítlo požadavek. Zkontroluj PID_API_KEY na serveru nebo ve Vite proxy.'
          : 'PID API odmítlo klíč. Zkontroluj VITE_PID_API_KEY.',
      };
    }

    return {
      status,
      message: 'Nepodařilo se načíst data z PID API.',
    };
  }

  return {
    message: 'Nepodařilo se načíst data z PID API.',
  };
};

export const getDepartures = async (
  stopPlaceId: string,
  lineId: string,
  limit = 3,
  direction?: string,
): Promise<DepartureBoardResponse> => {
  try {
    const items = await fetchBoard({ stopPlaceId, lineId, limit, direction, mode: 'departures' });
    return { departures: items.map(normalizeDeparture) };
  } catch (error) {
    logger.error('Failed to load departures', error);
    throw toApiError(error);
  }
};

export const getArrivals = async (
  stopPlaceId: string,
  lineId: string,
  limit = 3,
  direction?: string,
): Promise<ArrivalBoardResponse> => {
  try {
    const items = await fetchBoard({ stopPlaceId, lineId, limit, direction, mode: 'arrivals' });
    return { arrivals: items.map(normalizeArrival) };
  } catch (error) {
    logger.error('Failed to load arrivals', error);
    throw toApiError(error);
  }
};

export const getAllDepartures = async () => {
  try {
    const [rezToMasarykovo, masarykovoToRez, husinecsToKobylisy, kobylisyToHusinec] = await Promise.all([
      getDepartures(ROUTES.rezToMasarykovo.stopPlaceId, ROUTES.rezToMasarykovo.lineId, 3, ROUTES.rezToMasarykovo.direction),
      getDepartures(ROUTES.masarykovoToRez.stopPlaceId, ROUTES.masarykovoToRez.lineId, 3, ROUTES.masarykovoToRez.direction),
      getDepartures(ROUTES.husinecsToKobylisy.stopPlaceId, ROUTES.husinecsToKobylisy.lineId, 3, ROUTES.husinecsToKobylisy.direction),
      getDepartures(ROUTES.kobylisyToHusinec.stopPlaceId, ROUTES.kobylisyToHusinec.lineId, 3, ROUTES.kobylisyToHusinec.direction),
    ]);

    return {
      rezToMasarykovo,
      masarykovoToRez,
      husinecsToKobylisy,
      kobylisyToHusinec,
    };
  } catch (error) {
    logger.error('Failed to load all departures', error);
    throw toApiError(error);
  }
};

const getActualTime = (isoTime: string, delay?: number | null) => {
  const date = new Date(isoTime);
  return delay && delay > 0 ? new Date(date.getTime() + delay * 60_000) : date;
};

const getFallbackTravelTime = (departureStopId: string, arrivalStopId: string, lineId: string) => {
  if (lineId !== '371') return null;
  if (departureStopId === STOPS.KOBYLISY && arrivalStopId === STOPS.HUSINEC_REZ) return 20;
  if (departureStopId === STOPS.HUSINEC_REZ && arrivalStopId === STOPS.KOBYLISY) return 23;
  return 20;
};

export const calculateTravelTime = async (
  departureStopId: string,
  arrivalStopId: string,
  lineId: string,
  direction?: string,
): Promise<TravelTimeCalculation[]> => {
  try {
    const [departuresResponse, arrivalsResponse] = await Promise.all([
      getDepartures(departureStopId, lineId, 20, direction),
      getArrivals(arrivalStopId, lineId, 20, direction),
    ]);

    const departures = departuresResponse.departures;
    const arrivals = arrivalsResponse.arrivals;

    if (!arrivals.length) {
      const fallbackDuration = getFallbackTravelTime(departureStopId, arrivalStopId, lineId);
      if (fallbackDuration === null) {
        return [];
      }

      return [{
        tripId: `fallback_${lineId}`,
        line: lineId,
        mode: lineId === 'S4' ? 'train' : 'bus',
        duration: fallbackDuration,
        isRealTime: false,
        fallbackUsed: true,
        calculatedAt: new Date(),
        departureTime: new Date(),
        arrivalTime: new Date(Date.now() + fallbackDuration * 60_000),
        sampleCount: 1,
      }];
    }

    const tripDurations = departures.flatMap((departure) => {
      const arrival = arrivals.find((item) => item.tripId === departure.tripId);
      if (!arrival) return [];

      const departureTime = getActualTime(departure.scheduledTime, departure.delay);
      const arrivalTime = getActualTime(arrival.scheduledTime, arrival.delay);
      const duration = Math.round((arrivalTime.getTime() - departureTime.getTime()) / 60_000);

      if (duration <= 0 || duration >= 180) {
        return [];
      }

      return [{
        tripId: departure.tripId,
        line: departure.line,
        mode: departure.mode,
        duration,
        isRealTime: true,
        fallbackUsed: false,
        calculatedAt: new Date(),
        departureTime,
        arrivalTime,
        delay: departure.delay ?? 0,
      } satisfies TravelTimeCalculation];
    });

    if (!tripDurations.length) {
      return [];
    }

    const durations = tripDurations.map((item) => item.duration);
    const averageDuration = Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length);

    return [
      ...tripDurations,
      {
        tripId: `average_${lineId}`,
        line: lineId,
        mode: lineId === 'S4' ? 'train' : 'bus',
        duration: averageDuration,
        isRealTime: true,
        fallbackUsed: false,
        calculatedAt: new Date(),
        sampleCount: durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
      },
    ];
  } catch (error) {
    logger.error('Failed to calculate travel time', error);

    const fallback = TRAVEL_TIMES[lineId === 'S4' ? 'train' : 'bus'];
    return fallback
      ? [{
          tripId: `fallback_${lineId}`,
          line: lineId,
          mode: lineId === 'S4' ? 'train' : 'bus',
          duration: fallback,
          isRealTime: false,
          fallbackUsed: true,
          calculatedAt: new Date(),
          sampleCount: 1,
        }]
      : [];
  }
};

export const clearBoardCache = () => {
  boardCache.clear();
};
