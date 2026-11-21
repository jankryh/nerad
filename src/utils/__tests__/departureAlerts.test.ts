import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Departure } from '../../types';
import {
  DepartureAlert,
  createAlert,
  formatAlertMessage,
  getAvailableLeads,
  getFireTime,
  getNextFireDelay,
  getNextLead,
  parseStoredAlerts,
  reconcileAlerts,
} from '../departureAlerts';

const T0 = new Date('2026-03-20T10:00:00.000Z').getTime();
const MIN = 60_000;

const dep = (tripId: string, scheduledTime: string, delay: number | null = null, boardDirection = 'to-masarykovo'): Departure => ({
  id: tripId, tripId, routeId: 'S4', line: 'S4', mode: 'train', direction: 'Praha', scheduledTime, delay, boardDirection,
});

const alert = (overrides: Partial<DepartureAlert> = {}): DepartureAlert => ({
  tripId: 't1', leadMinutes: 10, departureTime: T0 + 30 * MIN, line: 'S4', boardDirection: 'to-masarykovo', ...overrides,
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
});
afterEach(() => vi.useRealTimers());

describe('lead selection', () => {
  it('offers only leads that are still in the future', () => {
    expect(getAvailableLeads(T0 + 30 * MIN, Date.now())).toEqual([5, 10, 15]);
    expect(getAvailableLeads(T0 + 12 * MIN, Date.now())).toEqual([5, 10]);
    expect(getAvailableLeads(T0 + 5 * MIN, Date.now())).toEqual([]);
  });

  it('cycles off → 5 → 10 → 15 → off', () => {
    const all = [5, 10, 15];
    expect(getNextLead(null, all)).toBe(5);
    expect(getNextLead(5, all)).toBe(10);
    expect(getNextLead(10, all)).toBe(15);
    expect(getNextLead(15, all)).toBeNull();
    expect(getNextLead(null, [])).toBeNull();
    expect(getNextLead(5, [5])).toBeNull();
  });
});

describe('createAlert', () => {
  it('uses the effective (delayed) departure time', () => {
    const a = createAlert(dep('t1', '2026-03-20T10:30:00.000Z', 3), 10);
    expect(a.departureTime).toBe(T0 + 33 * MIN);
    expect(getFireTime(a)).toBe(T0 + 23 * MIN);
  });
});

describe('reconcileAlerts', () => {
  it('keeps a pending alert untouched', () => {
    const alerts = [alert()];
    const r = reconcileAlerts(alerts, [dep('t1', '2026-03-20T10:30:00.000Z')], Date.now());
    expect(r).toEqual({ alerts, toFire: [], changed: false });
  });

  it('shifts with a changed delay (matched by tripId)', () => {
    const r = reconcileAlerts([alert()], [dep('t1', '2026-03-20T10:30:00.000Z', 4)], Date.now());
    expect(r.changed).toBe(true);
    expect(r.alerts[0].departureTime).toBe(T0 + 34 * MIN);
  });

  it('fires when the lead time is reached, not before', () => {
    const departures = [dep('t1', '2026-03-20T10:30:00.000Z')];
    vi.advanceTimersByTime(20 * MIN - 1);
    expect(reconcileAlerts([alert()], departures, Date.now()).toFire).toHaveLength(0);
    vi.advanceTimersByTime(1);
    const r = reconcileAlerts([alert()], departures, Date.now());
    expect(r.toFire).toHaveLength(1);
    expect(r.alerts).toEqual([]);
  });

  it('a new delay postpones firing', () => {
    vi.advanceTimersByTime(21 * MIN);
    const r = reconcileAlerts([alert()], [dep('t1', '2026-03-20T10:30:00.000Z', 5)], Date.now());
    expect(r.toFire).toHaveLength(0);
    expect(getFireTime(r.alerts[0])).toBe(T0 + 25 * MIN);
  });

  it('fires late after a hidden tab returns, while the train has not left', () => {
    vi.advanceTimersByTime(27 * MIN);
    const r = reconcileAlerts([alert()], [dep('t1', '2026-03-20T10:30:00.000Z')], Date.now());
    expect(r.toFire).toHaveLength(1);
    expect(formatAlertMessage(r.toFire[0], Date.now())).toMatch(/^S4 do Prahy odjíždí za 3 min \(\d{2}:\d{2}\)$/);
  });

  it('drops without firing when the departure already left', () => {
    vi.advanceTimersByTime(31 * MIN);
    const r = reconcileAlerts([alert()], [], Date.now());
    expect(r).toMatchObject({ alerts: [], toFire: [], changed: true });
  });

  it('cancels silently when the trip vanished from its loaded feed', () => {
    const r = reconcileAlerts([alert()], [dep('other', '2026-03-20T10:40:00.000Z')], Date.now());
    expect(r).toMatchObject({ alerts: [], toFire: [], changed: true });
  });

  it('keeps alerts of another direction or when the feed is empty', () => {
    const alerts = [alert()];
    expect(reconcileAlerts(alerts, [], Date.now()).alerts).toBe(alerts);
    const other = [dep('x', '2026-03-20T10:40:00.000Z', null, 'to-rez')];
    expect(reconcileAlerts(alerts, other, Date.now()).alerts).toBe(alerts);
  });
});

describe('getNextFireDelay', () => {
  it('returns ms to the earliest reminder', () => {
    expect(getNextFireDelay([], Date.now())).toBeNull();
    expect(getNextFireDelay([alert(), alert({ tripId: 't2', leadMinutes: 15 })], Date.now())).toBe(15 * MIN);
    expect(getNextFireDelay([alert({ departureTime: T0 + 5 * MIN })], Date.now())).toBe(0);
  });
});

describe('parseStoredAlerts', () => {
  it('restores valid alerts and drops expired or malformed ones', () => {
    const raw = JSON.stringify([alert(), alert({ tripId: 'old', departureTime: T0 - MIN }), { tripId: 3 }]);
    expect(parseStoredAlerts(raw, Date.now())).toEqual([alert()]);
    expect(parseStoredAlerts('not json', Date.now())).toEqual([]);
    expect(parseStoredAlerts('{}', Date.now())).toEqual([]);
    expect(parseStoredAlerts(null, Date.now())).toEqual([]);
  });
});

describe('formatAlertMessage', () => {
  it('names the destination by board direction', () => {
    expect(formatAlertMessage(alert({ line: '371', boardDirection: 'to-husinec' }), Date.now()))
      .toMatch(/^371 do Řeže odjíždí za 30 min/);
    expect(formatAlertMessage(alert({ boardDirection: undefined }), T0 + 30 * MIN)).toMatch(/^S4 odjíždí teď/);
  });
});
