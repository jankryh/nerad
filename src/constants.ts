export const API_BASE_URL = import.meta.env.VITE_PID_API_BASE_URL || '/api';
export const API_KEY = import.meta.env.VITE_PID_API_KEY || '';
export const API_REQUEST_TIMEOUT = 8000;
export const BOARD_CACHE_TTL = 30000;

export const STOPS = {
  REZ: 'U2823Z301',
  MASARYKOVO: 'U480Z301',
  HUSINEC_REZ: 'U2245Z2',
  KOBYLISY: 'U675Z12',
} as const;

export const TRAVEL_TIMES = {
  train: 18,
  bus: 20,
} as const;

export const DEPARTURE_INTERVALS = {
  train: 30,
  bus: 60,
} as const;

export const TRAVEL_TIME_CONFIG = {
  useRealTimeAPI: true,
  fallbackToHardcoded: true,
  cacheDuration: 300000,
  maxRetries: 2,
  timeout: 5000,
  enableRealTimeInUI: true,
  validationEnabled: true,
  minSampleCount: 1,
  maxCacheSize: 50,
} as const;

export type BoardKey = 'trainToPrague' | 'trainFromPrague' | 'busToPrague' | 'busFromPrague';

export interface BoardConfig {
  stopId: string;
  lineIds: string[];
  direction: string;
  /** Fallback headsign patterns pro zpětnou kompatibilitu pokud API nefiltruje správně */
  headsignPatterns: {
    include: string[];
    exclude: string[];
  };
}

export const BOARD_CONFIG: Record<BoardKey, BoardConfig> = {
  trainToPrague: {
    stopId: STOPS.REZ,
    lineIds: ['S4'],
    direction: 'to-masarykovo',
    headsignPatterns: {
      include: ['Masarykovo', 'Praha'],
      exclude: [],
    },
  },
  trainFromPrague: {
    stopId: STOPS.MASARYKOVO,
    lineIds: ['S4'],
    direction: 'to-rez',
    headsignPatterns: {
      include: ['Ústí', 'Kralupy', 'Řež'],
      exclude: ['Praha'],
    },
  },
  busToPrague: {
    stopId: STOPS.HUSINEC_REZ,
    lineIds: ['371'],
    direction: 'to-kobylisy',
    headsignPatterns: {
      include: ['Kobylisy', 'Praha', 'Klecany'],
      exclude: [],
    },
  },
  busFromPrague: {
    stopId: STOPS.KOBYLISY,
    lineIds: ['371'],
    direction: 'to-husinec',
    headsignPatterns: {
      include: ['Husinec', 'Řež'],
      exclude: ['Klecany', 'Astrapark', 'Klecánky'],
    },
  },
} as const;

export const UI_CONFIG = {
  showPerformanceMonitor: false,
  showPerformanceInProduction: false,
} as const;
