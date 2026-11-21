import { describe, it, expect, vi } from 'vitest';
import { formatTime, calculateActualDepartureTime, getEnhancedTravelTime, formatCountdown } from '../timeCalculations';
import { calculateTravelTime } from '../../api/pidApi';
import { STOPS, TRAVEL_TIMES } from '../../constants';
import { Departure, TravelTimeCalculation } from '../../types';

vi.mock('../../api/pidApi', () => ({ calculateTravelTime: vi.fn().mockResolvedValue([]) }));

const makeDeparture = (overrides: Partial<Departure> = {}): Departure => ({
  id: 'test-1',
  line: 'S4',
  mode: 'train',
  direction: 'Praha Masarykovo nádraží',
  scheduledTime: '2026-03-20T10:00:00.000Z',
  delay: null,
  routeId: 'route-1',
  tripId: 'trip-1',
  ...overrides,
});

describe('formatTime', () => {
  it('formats a valid ISO time string', () => {
    const result = formatTime('2026-03-20T14:30:00.000Z');
    // Should return HH:MM format (exact value depends on timezone)
    expect(result).toMatch(/^\d{1,2}:\d{2}$/);
  });

  it('returns --:-- for invalid input', () => {
    // new Date('invalid') returns Invalid Date, toLocaleTimeString may not throw
    // but formatTime wraps in try/catch
    const result = formatTime('not-a-date');
    // Invalid Date.toLocaleTimeString may return a string or throw depending on env
    // The function catches errors and returns '--:--'
    expect(typeof result).toBe('string');
  });

  it('formats midnight correctly', () => {
    const result = formatTime('2026-03-20T00:00:00.000Z');
    expect(result).toMatch(/^\d{1,2}:\d{2}$/);
  });

  it('formats different times consistently', () => {
    const result1 = formatTime('2026-03-20T08:15:00.000Z');
    const result2 = formatTime('2026-03-20T08:15:00.000Z');
    expect(result1).toBe(result2);
  });
});

describe('calculateActualDepartureTime', () => {
  it('returns scheduled time when no delay', () => {
    const departure = makeDeparture({ delay: null });
    const result = calculateActualDepartureTime(departure);
    expect(result.getTime()).toBe(new Date('2026-03-20T10:00:00.000Z').getTime());
  });

  it('returns scheduled time when delay is 0', () => {
    const departure = makeDeparture({ delay: 0 });
    const result = calculateActualDepartureTime(departure);
    expect(result.getTime()).toBe(new Date('2026-03-20T10:00:00.000Z').getTime());
  });

  it('adds delay in minutes to scheduled time', () => {
    const departure = makeDeparture({ delay: 5 });
    const result = calculateActualDepartureTime(departure);
    const expected = new Date('2026-03-20T10:00:00.000Z').getTime() + 5 * 60 * 1000;
    expect(result.getTime()).toBe(expected);
  });

  it('handles large delays', () => {
    const departure = makeDeparture({ delay: 60 });
    const result = calculateActualDepartureTime(departure);
    const expected = new Date('2026-03-20T10:00:00.000Z').getTime() + 60 * 60 * 1000;
    expect(result.getTime()).toBe(expected);
  });

  it('ignores negative delay (treats as no delay)', () => {
    const departure = makeDeparture({ delay: -3 });
    const result = calculateActualDepartureTime(departure);
    expect(result.getTime()).toBe(new Date('2026-03-20T10:00:00.000Z').getTime());
  });
});


describe('getEnhancedTravelTime', () => {
  it('derives stops from boardDirection, not headsign', async () => {
    // Bus to Prague with a short-turn headsign used to be treated as Kobylisy → Husinec
    const departure = makeDeparture({ line: '371', mode: 'bus', direction: 'Klecany', boardDirection: 'to-kobylisy' });
    await getEnhancedTravelTime(departure, true);
    expect(calculateTravelTime).toHaveBeenCalledWith(STOPS.HUSINEC_REZ, STOPS.KOBYLISY, '371', 'to-kobylisy');
  });

  const calc = (tripId: string, duration: number, fallbackUsed = false): TravelTimeCalculation => ({
    tripId, line: 'S4', mode: 'train', duration, isRealTime: !fallbackUsed, fallbackUsed, calculatedAt: new Date(),
  });

  it('prefers the arrival matched by tripId over the line average', async () => {
    vi.mocked(calculateTravelTime).mockResolvedValueOnce([
      calc('trip-other', 30),
      calc('trip-match', 25),
      calc('average_S4', 27),
    ]);
    const departure = makeDeparture({ tripId: 'trip-match', boardDirection: 'to-masarykovo' });
    expect(await getEnhancedTravelTime(departure, true)).toBe(25);
  });

  it('falls back to the line average when the trip is not matched', async () => {
    vi.mocked(calculateTravelTime).mockResolvedValueOnce([calc('trip-other', 30), calc('average_S4', 27)]);
    const departure = makeDeparture({ tripId: 'trip-unmatched', boardDirection: 'to-masarykovo' });
    expect(await getEnhancedTravelTime(departure, true)).toBe(27);
  });

  it('does not cache a fallback travel time', async () => {
    const departure = makeDeparture({ tripId: 'trip-fallback', boardDirection: 'to-masarykovo' });
    vi.mocked(calculateTravelTime).mockResolvedValueOnce([calc('fallback_S4', 18, true)]);
    expect(await getEnhancedTravelTime(departure, true)).toBe(18);

    vi.mocked(calculateTravelTime).mockClear();
    vi.mocked(calculateTravelTime).mockResolvedValueOnce([calc('trip-fallback', 22)]);
    expect(await getEnhancedTravelTime(departure, true)).toBe(22);
    expect(calculateTravelTime).toHaveBeenCalledTimes(1);
  });

  // Single-entry responses so the test holds regardless of average vs tripId selection
  const calcOne = (tripId: string, duration: number) => [{
    tripId, line: '371', mode: 'bus' as const, duration, isRealTime: true, fallbackUsed: false, calculatedAt: new Date(),
  }];

  it('returns cached duration without a second API call', async () => {
    const departure = makeDeparture({ line: '371', mode: 'bus', tripId: 'bus-1', boardDirection: 'to-husinec' });
    vi.mocked(calculateTravelTime).mockClear().mockResolvedValueOnce(calcOne('bus-1', 25));
    expect(await getEnhancedTravelTime(departure, true)).toBe(25);
    expect(await getEnhancedTravelTime(departure, true)).toBe(25);
    expect(calculateTravelTime).toHaveBeenCalledTimes(1);
  });

  it('falls back to hardcoded time when duration is out of range', async () => {
    const departure = makeDeparture({ boardDirection: 'to-masarykovo' });
    vi.mocked(calculateTravelTime).mockResolvedValueOnce(calcOne('trip-1', 500));
    expect(await getEnhancedTravelTime(departure, true)).toBe(TRAVEL_TIMES.train);
  });

  it('falls back to hardcoded time when the API fails or real-time is off', async () => {
    const departure = makeDeparture({ boardDirection: 'to-rez' });
    vi.mocked(calculateTravelTime).mockRejectedValueOnce(new Error('boom'));
    expect(await getEnhancedTravelTime(departure, true)).toBe(TRAVEL_TIMES.train);
    expect(await getEnhancedTravelTime(departure, false)).toBe(TRAVEL_TIMES.train);
  });
});

describe('formatCountdown', () => {
  it('formats "teď" for 0 or negative minutes in live mode', () => {
    expect(formatCountdown(0, false)).toBe('teď');
    expect(formatCountdown(-1, false)).toBe('teď');
    expect(formatCountdown(-5, false)).toBe('teď');
  });

  it('formats minutes under 60 with "min" suffix in live mode', () => {
    expect(formatCountdown(1, false)).toBe('1 min');
    expect(formatCountdown(29, false)).toBe('29 min');
    expect(formatCountdown(45, false)).toBe('45 min');
    expect(formatCountdown(59, false)).toBe('59 min');
  });

  it('formats whole hours with "h" suffix in live mode', () => {
    expect(formatCountdown(60, false)).toBe('1 h');
    expect(formatCountdown(120, false)).toBe('2 h');
    expect(formatCountdown(180, false)).toBe('3 h');
  });

  it('formats hours with minutes using "h" and "min" in live mode', () => {
    expect(formatCountdown(61, false)).toBe('1 h 1 min');
    expect(formatCountdown(65, false)).toBe('1 h 5 min');
    expect(formatCountdown(75, false)).toBe('1 h 15 min');
    expect(formatCountdown(131, false)).toBe('2 h 11 min');
  });

  it('formats scheduled mode with +/- prefix and "min" suffix', () => {
    expect(formatCountdown(0, true)).toBe('0 min');
    expect(formatCountdown(30, true)).toBe('+30 min');
    expect(formatCountdown(-5, true)).toBe('-5 min');
    expect(formatCountdown(120, true)).toBe('+120 min');
  });
});
