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

export const REFRESH_INTERVAL = 30000;

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

export const UI_CONFIG = {
  showPerformanceMonitor: false,
  showPerformanceInProduction: false,
} as const;
