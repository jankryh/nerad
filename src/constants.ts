export const API_BASE_URL = 'https://api.golemio.cz/v2';
export const API_KEY = import.meta.env.VITE_PID_API_KEY || '';

// ✅ KOMPLETNÍ: Všechny 4 zastávky mají skutečná PID ID
export const STOPS = {
  REZ: 'U2823Z301',           // Řež - ✅ SKUTEČNÉ PID ID
  MASARYKOVO: 'U480Z301', // Praha Masarykovo nádraží - ✅ SKUTEČNÉ PID ID
  HUSINEC_REZ: 'U2245Z2',  // Husinec,Rozc. B - ✅ SKUTEČNÉ PID ID
  KOBYLISY: 'U675Z12'     // Praha Kobylisy J - ✅ SKUTEČNÉ PID ID
} as const;

// ID linek podle PID (tyto by měly být správné)
export const LINES = {
  S4: 's4', // Vlak S4
  BUS_371: '371' // Autobus 371
} as const;

// Směry pro API volání
export const DIRECTIONS = {
  FROM_REZ: 'from-rez', // Z Řeže
  TO_REZ: 'to-rez' // Do Řeže
} as const;

// Interval pro obnovu dat (30 sekund)
export const REFRESH_INTERVAL = 30000;

// Travel times in minutes for different transport modes (FALLBACK ONLY - real API data preferred)
export const TRAVEL_TIMES = {
  train: 18, // Vlak S4: Řež ↔ Praha Masarykovo (FALLBACK ONLY)
  bus: 20    // Autobus 371: Řež ↔ Praha Kobylisy (FALLBACK ONLY - adjusted from 28 to 20)
} as const;

// Departure intervals in minutes for calculating next departure
export const DEPARTURE_INTERVALS = {
  train: 30, // Vlak jede každých 30 minut
  bus: 60    // Autobus jede každých 60 minut
} as const;

// Configuration for travel time calculation
export const TRAVEL_TIME_CONFIG = {
  useRealTimeAPI: true,        // Enable real-time API calculation (PRIORITIZED)
  fallbackToHardcoded: true,   // Fallback to hardcoded times if API fails
  cacheDuration: 300000,       // Cache travel times for 5 minutes
  maxRetries: 2,               // Maximum retries for API calls
  timeout: 5000,               // API timeout in milliseconds
  enableRealTimeInUI: true,    // Toggle for UI: false = hardcoded, true = real-time
  validationEnabled: true,     // Enable validation of calculated travel times
  minSampleCount: 1,           // Minimum number of samples for average calculation
  maxCacheSize: 50             // Maximum number of cached travel time entries
} as const;

// Configuration for UI components
export const UI_CONFIG = {
  showPerformanceMonitor: false,  // Toggle for performance monitor visibility
  showPerformanceInProduction: false  // Allow performance monitor in production
} as const;
