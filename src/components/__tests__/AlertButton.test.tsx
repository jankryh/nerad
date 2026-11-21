import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DepartureBoard } from '../DepartureBoard';
import { AlertToasts } from '../AlertButton';
import { Departure } from '../../types';
import { __resetAlertsForTesting, useDepartureAlerts } from '../../hooks/useDepartureAlerts';
import { ALERTS_STORAGE_KEY } from '../../utils/departureAlerts';

vi.mock('../../utils/timeCalculations', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../utils/timeCalculations')>()),
  getEnhancedTravelTime: vi.fn().mockResolvedValue(18),
}));

const T0 = new Date('2026-03-20T10:00:00.000Z').getTime();
const MIN = 60_000;

const dep = (tripId: string, scheduledTime: string, delay: number | null = null): Departure => ({
  id: tripId, tripId, routeId: 'S4', line: 'S4', mode: 'train', direction: 'Praha', scheduledTime, delay,
  boardDirection: 'to-masarykovo',
});

// Test wrapper that provides the alerts hook
const DepartureBoardWithAlerts: React.FC<{ departures: Departure[]; targetDateTime?: Date | null }> = ({ departures, targetDateTime }) => {
  const alertsEnabled = !targetDateTime;
  const { getLead, setAlert, toasts, dismissToast } = useDepartureAlerts(departures, alertsEnabled);
  return (
    <>
      <DepartureBoard departures={departures} targetDateTime={targetDateTime} getLead={getLead} setAlert={setAlert} />
      <AlertToasts toasts={toasts} onDismiss={dismissToast} />
    </>
  );
};

const bell = () => screen.getByRole('button', { name: /^Připomenout odjezd/ });

beforeEach(() => {
  localStorage.clear();
  __resetAlertsForTesting();
  vi.useFakeTimers();
  vi.setSystemTime(T0);
  vi.stubGlobal('Notification', undefined);
  // jsdom has no Notification — remove the stub so the API is "missing"
  delete (window as unknown as Record<string, unknown>).Notification;
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('AlertButton in DepartureBoard', () => {
  it('cycles 5 → 10 → 15 → off with aria-pressed and persists to localStorage', () => {
    render(<DepartureBoardWithAlerts departures={[dep('t1', '2026-03-20T10:30:00.000Z')]} />);
    expect(bell()).toHaveAttribute('aria-pressed', 'false');
    expect(bell().getAttribute('aria-label')).toMatch(/^Připomenout odjezd \d{2}:\d{2}$/);

    fireEvent.click(bell());
    expect(bell()).toHaveAttribute('aria-pressed', 'true');
    expect(JSON.parse(localStorage.getItem(ALERTS_STORAGE_KEY)!)[0]).toMatchObject({ tripId: 't1', leadMinutes: 5 });

    fireEvent.click(bell());
    fireEvent.click(bell());
    expect(bell().getAttribute('aria-label')).toMatch(/15 min předem$/);

    fireEvent.click(bell());
    expect(bell()).toHaveAttribute('aria-pressed', 'false');
    expect(localStorage.getItem(ALERTS_STORAGE_KEY)).toBeNull();
  });

  it('falls back to an in-page alert + vibration when Notification API is missing', () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
    render(<DepartureBoardWithAlerts departures={[dep('t1', '2026-03-20T10:30:00.000Z')]} />);
    fireEvent.click(bell()); // 5 min → fires at 10:25

    act(() => { vi.advanceTimersByTime(25 * MIN - 1000); });
    expect(screen.queryByRole('alert')).toBeNull();

    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByRole('alert')).toHaveTextContent(/S4 do Prahy odjíždí za 5 min \(\d{2}:\d{2}\)/);
    expect(vibrate).toHaveBeenCalled();
    expect(bell()).toHaveAttribute('aria-pressed', 'false');
  });

  it('follows a new delay and cancels silently when the departure disappears', () => {
    const { rerender } = render(<DepartureBoardWithAlerts departures={[dep('t1', '2026-03-20T10:30:00.000Z')]} />);
    fireEvent.click(bell());

    rerender(<DepartureBoardWithAlerts departures={[dep('t1', '2026-03-20T10:30:00.000Z', 10)]} />);
    act(() => { vi.advanceTimersByTime(26 * MIN); });
    expect(screen.queryByRole('alert')).toBeNull(); // shifted to 10:35

    rerender(<DepartureBoardWithAlerts departures={[dep('t2', '2026-03-20T10:50:00.000Z')]} />);
    expect(localStorage.getItem(ALERTS_STORAGE_KEY)).toBeNull();
    act(() => { vi.advanceTimersByTime(20 * MIN); });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('restores reminders after reload and drops expired ones', () => {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify([
      { tripId: 't1', leadMinutes: 10, departureTime: T0 + 30 * MIN, line: 'S4', boardDirection: 'to-masarykovo' },
      { tripId: 'gone', leadMinutes: 5, departureTime: T0 - MIN, line: 'S4', boardDirection: 'to-masarykovo' },
    ]));
    render(<DepartureBoardWithAlerts departures={[dep('t1', '2026-03-20T10:30:00.000Z')]} />);
    expect(bell()).toHaveAttribute('aria-pressed', 'true');
    expect(JSON.parse(localStorage.getItem(ALERTS_STORAGE_KEY)!)).toHaveLength(1);
  });

  it('uses the system notification when permission is granted, asking only on click', () => {
    const ctor = vi.fn();
    const requestPermission = vi.fn().mockResolvedValue('granted');
    class FakeNotification {
      static permission: NotificationPermission = 'default';
      static requestPermission = requestPermission;
      constructor(title: string, options: NotificationOptions) { ctor(title, options); }
    }
    vi.stubGlobal('Notification', FakeNotification);

    render(<DepartureBoardWithAlerts departures={[dep('t1', '2026-03-20T10:30:00.000Z')]} />);
    expect(requestPermission).not.toHaveBeenCalled();
    fireEvent.click(bell());
    expect(requestPermission).toHaveBeenCalledTimes(1);

    FakeNotification.permission = 'granted';
    act(() => { vi.advanceTimersByTime(25 * MIN); });
    expect(ctor).toHaveBeenCalledWith('Připomínka odjezdu', expect.objectContaining({ body: expect.stringMatching(/^S4 do Prahy odjíždí za 5 min/) }));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('fires immediately when a hidden tab becomes visible after the reminder time', () => {
    render(<DepartureBoardWithAlerts departures={[dep('t1', '2026-03-20T10:30:00.000Z')]} />);
    fireEvent.click(bell());
    // Simulate throttled timers: move the clock without running timers
    vi.setSystemTime(T0 + 27 * MIN);
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(screen.getByRole('alert')).toHaveTextContent(/za 3 min/);
  });

  it('hides the bell in scheduled mode and disables it when too late', () => {
    const { rerender } = render(
      <DepartureBoardWithAlerts departures={[dep('t1', '2026-03-20T10:30:00.000Z')]} targetDateTime={new Date(T0)} />,
    );
    expect(screen.queryByRole('button', { name: /^Připomenout odjezd/ })).toBeNull();
    rerender(<DepartureBoardWithAlerts departures={[dep('t1', '2026-03-20T10:04:00.000Z')]} />);
    expect(bell()).toBeDisabled();
  });
});
