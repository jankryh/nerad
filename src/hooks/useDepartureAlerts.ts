import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { Departure } from '../types';
import {
  ALERTS_STORAGE_KEY,
  DepartureAlert,
  createAlert,
  formatAlertMessage,
  getNextFireDelay,
  parseStoredAlerts,
  reconcileAlerts,
} from '../utils/departureAlerts';
import { logger } from '../utils/logger';

// Shared across board instances so a reminder fires exactly once, whichever board notices it first
let alertsState: DepartureAlert[] | null = null;
const listeners = new Set<() => void>();

const persistAlerts = (alerts: DepartureAlert[]) => {
  try {
    if (alerts.length) localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    else localStorage.removeItem(ALERTS_STORAGE_KEY);
  } catch (storageError) {
    logger.warn('Failed to persist departure alerts', storageError);
  }
};

const readAlerts = (): DepartureAlert[] => {
  if (alertsState === null) {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(ALERTS_STORAGE_KEY);
    } catch {
      // storage unavailable (private mode) — reminders just won't survive a reload
    }
    alertsState = parseStoredAlerts(raw, Date.now());
    // Write back so expired/malformed entries don't linger in storage
    if (raw !== null) persistAlerts(alertsState);
  }
  return alertsState;
};

const writeAlerts = (next: DepartureAlert[]) => {
  alertsState = next;
  persistAlerts(next);
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

export const __resetAlertsForTesting = () => {
  alertsState = null;
  listeners.clear();
};

const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window;

const showSystemNotification = (message: string, tag: string): boolean => {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;
  try {
    new Notification('Připomínka odjezdu', { body: message, tag });
    return true;
  } catch {
    // e.g. Android Chrome only allows notifications via a service worker
    return false;
  }
};

const MAX_TIMER_MS = 60_000;

export interface AlertToast {
  id: string;
  message: string;
}

export const useDepartureAlerts = (departures: Departure[], enabled = true) => {
  const alerts = useSyncExternalStore(subscribe, readAlerts, readAlerts);
  const [toasts, setToasts] = useState<AlertToast[]>([]);
  const [tick, setTick] = useState(0);

  const check = useCallback(() => {
    const now = Date.now();
    // In scheduled mode the board shows another time window, so only time-based firing/expiry applies
    const result = reconcileAlerts(readAlerts(), enabled ? departures : [], now);
    if (result.changed) writeAlerts(result.alerts);

    for (const alert of result.toFire) {
      const message = formatAlertMessage(alert, now);
      if (showSystemNotification(message, alert.tripId)) continue;
      setToasts((prev) => [...prev, { id: `${alert.tripId}-${now}`, message }]);
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, [departures, enabled]);

  // Re-check on new data, timer tick and alert changes; re-arm the timer to the next due reminder
  useEffect(() => {
    check();
    const delay = getNextFireDelay(readAlerts(), Date.now());
    if (delay === null) return;
    const timer = setTimeout(() => setTick((t) => t + 1), Math.min(delay, MAX_TIMER_MS));
    return () => clearTimeout(timer);
  }, [check, alerts, tick]);

  // Background tabs throttle timers — catch up as soon as the tab is visible again
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [check]);

  const setAlert = useCallback((departure: Departure, leadMinutes: number | null) => {
    if (notificationsSupported() && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined);
    }
    const rest = readAlerts().filter((a) => a.tripId !== departure.tripId);
    writeAlerts(leadMinutes === null ? rest : [...rest, createAlert(departure, leadMinutes)]);
  }, []);

  const getLead = useCallback(
    (tripId: string): number | null => alerts.find((a) => a.tripId === tripId)?.leadMinutes ?? null,
    [alerts],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { getLead, setAlert, toasts, dismissToast };
};
