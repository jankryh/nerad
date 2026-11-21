import { Departure } from '../types';
import { calculateActualDepartureTime, formatTime } from './timeCalculations';

export const ALERT_LEAD_OPTIONS = [5, 10, 15] as const;
export const ALERTS_STORAGE_KEY = 'departure-alerts';

export interface DepartureAlert {
  tripId: string;
  leadMinutes: number;
  /** Effective departure time (incl. delay) in ms, refreshed on every poll */
  departureTime: number;
  line: string;
  boardDirection?: string;
  /** Stop ID where this reminder was set, to distinguish the same trip at different stops */
  stopId?: string;
}

const MINUTE = 60_000;

export const getFireTime = (alert: DepartureAlert): number =>
  alert.departureTime - alert.leadMinutes * MINUTE;

/** Lead times that still leave the reminder in the future */
export const getAvailableLeads = (departureTime: number, now: number): number[] =>
  ALERT_LEAD_OPTIONS.filter((lead) => departureTime - lead * MINUTE > now);

/** Cycle: off → first available → … → last available → off */
export const getNextLead = (current: number | null, available: number[]): number | null => {
  if (current === null) return available[0] ?? null;
  const next = available.find((lead) => lead > current);
  return next ?? null;
};

export const createAlert = (departure: Departure, leadMinutes: number): DepartureAlert => ({
  tripId: departure.tripId,
  leadMinutes,
  departureTime: calculateActualDepartureTime(departure).getTime(),
  line: departure.line,
  boardDirection: departure.boardDirection,
  stopId: departure.boardDirection,
});

export interface ReconcileResult {
  alerts: DepartureAlert[];
  toFire: DepartureAlert[];
  changed: boolean;
}

/**
 * Sync alerts with the current board and decide which ones fire.
 * - matched by tripId + stopId → departure time follows the current delay
 * - missing from a loaded feed that includes the same stop → dropped silently
 * - missing while its feed is absent (error / other board) → kept as-is
 * - departure already left (+ 2 min grace) → dropped without firing
 * - fire time reached → fired and removed
 */
export const reconcileAlerts = (
  alerts: DepartureAlert[],
  departures: Departure[],
  now: number,
): ReconcileResult => {
  const byTripAndStop = new Map<string, Departure>();
  const loadedStops = new Set<string>();

  for (const d of departures) {
    const key = `${d.tripId}:${d.boardDirection}`;
    byTripAndStop.set(key, d);
    if (d.boardDirection) loadedStops.add(d.boardDirection);
  }

  const kept: DepartureAlert[] = [];
  const toFire: DepartureAlert[] = [];
  let changed = false;

  for (const alert of alerts) {
    let current = alert;
    const key = `${alert.tripId}:${alert.boardDirection}`;
    const departure = byTripAndStop.get(key);

    if (departure) {
      // Trip is on the current board: update departure time with fresh delay
      const departureTime = calculateActualDepartureTime(departure).getTime();
      if (departureTime !== alert.departureTime) {
        current = { ...alert, departureTime };
        changed = true;
      }
    } else if (alert.boardDirection && loadedStops.has(alert.boardDirection)) {
      // Trip is not on the board that should contain it (same direction is loaded) → dropped
      changed = true;
      continue;
    }
    // Otherwise: trip is not on any loaded board → keep the reminder with the last known time

    // Fire reminders when the fire time is reached AND departure hasn't left yet
    if (now >= getFireTime(current) && now < current.departureTime) {
      toFire.push(current);
      changed = true;
      continue;
    }

    // Drop reminders after departure time + 1 min grace period (without firing)
    if (now >= current.departureTime + 60_000) {
      changed = true;
      continue;
    }

    kept.push(current);
  }

  return { alerts: changed ? kept : alerts, toFire, changed };
};

/** Ms until the next reminder is due, or null when nothing is pending */
export const getNextFireDelay = (alerts: DepartureAlert[], now: number): number | null => {
  if (!alerts.length) return null;
  return Math.max(0, Math.min(...alerts.map(getFireTime)) - now);
};

const isAlert = (value: unknown): value is DepartureAlert => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.tripId === 'string'
    && typeof v.leadMinutes === 'number'
    && typeof v.departureTime === 'number'
    && typeof v.line === 'string';
};

/** Parse persisted alerts, dropping malformed and already departed ones */
export const parseStoredAlerts = (raw: string | null, now: number): DepartureAlert[] => {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isAlert).filter((a) => a.departureTime > now);
  } catch {
    return [];
  }
};

const DESTINATION_LABELS: Record<string, string> = {
  'to-masarykovo': 'do Prahy',
  'to-kobylisy': 'do Prahy',
  'to-rez': 'do Řeže',
  'to-husinec': 'do Řeže',
};

export const formatAlertMessage = (alert: DepartureAlert, now: number): string => {
  const minutes = Math.max(0, Math.round((alert.departureTime - now) / MINUTE));
  const destination = alert.boardDirection ? DESTINATION_LABELS[alert.boardDirection] : undefined;
  const subject = destination ? `${alert.line} ${destination}` : alert.line;
  const when = minutes > 0 ? `za ${minutes} min` : 'teď';
  return `${subject} odjíždí ${when} (${formatTime(new Date(alert.departureTime).toISOString())})`;
};
