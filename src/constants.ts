export const API_BASE_URL = 'https://api.golemio.cz/pid/v4/pid/transferboards';
export const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzM0OCwiaWF0IjoxNzM5NjQ2NDA2LCJleHAiOjExNzM5NjQ2NDA2LCJpc3MiOiJnb2xlbWlvIiwianRpIjoiODRiZGRlYWQtNGMzMi00NTg2LTgwZDgtYjFkM2I2ZWU2NmY3In0.4aqFmHTrzXh8pdvK1T99GIGeB7assGzbS3nIhPfKKzc';

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
