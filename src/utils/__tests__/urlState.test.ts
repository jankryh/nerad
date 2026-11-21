import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseStationParam, parseTimeParam, serializeUrlState } from '../urlState';

describe('URL timetable state', () => {
  beforeEach(() => vi.setSystemTime(new Date('2026-11-21T05:00:00Z')));
  afterEach(() => vi.useRealTimers());

  it.each(['masarykovo', 'bubny'])('accepts station %s', (station) => {
    expect(parseStationParam(station)).toBe(station);
  });

  it.each([null, '', 'hlavni', 'Bubny'])('ignores station %s', (station) => {
    expect(parseStationParam(station)).toBeNull();
  });

  it('parses a scheduled date as Prague wall time', () => {
    expect(parseTimeParam('2026-11-22T07:30')).toEqual(new Date('2026-11-22T06:30:00Z'));
  });

  it.each([
    null, '', 'tomorrow', '7:30', '24:00', '07:60', '2026-11-31T07:30',
    '2026-11-22T07:30Z', '2026-11-22T07:30+01:00', '2026-11-20T07:30',
    '2027-02-19T06:01', '9999-12-31T07:30',
  ])('ignores missing, invalid or out-of-range time %s', (time) => {
    expect(parseTimeParam(time)).toBeNull();
  });

  it('accepts the picker boundaries at minute precision', () => {
    vi.setSystemTime(new Date('2026-11-21T05:00:35Z'));
    expect(parseTimeParam('2026-11-21T06:00')).toEqual(new Date('2026-11-21T05:00:35Z'));
    expect(parseTimeParam('2027-02-19T06:00')).toEqual(new Date('2027-02-19T05:00:00Z'));
  });

  it('uses today for a time that is still upcoming', () => {
    expect(parseTimeParam('07:30')).toEqual(new Date('2026-11-21T06:30:00Z'));
  });

  it('uses tomorrow for a time that has passed', () => {
    vi.setSystemTime(new Date('2026-11-21T06:30:01Z'));
    expect(parseTimeParam('07:30')).toEqual(new Date('2026-11-22T06:30:00Z'));
  });

  it('uses the Prague calendar date when UTC still has the previous date', () => {
    vi.setSystemTime(new Date('2026-11-21T23:15:00Z'));
    expect(parseTimeParam('00:30')).toEqual(new Date('2026-11-21T23:30:00Z'));
  });

  it('skips a nonexistent recurring time at the spring clock change', () => {
    vi.setSystemTime(new Date('2027-03-28T00:00:00Z'));
    expect(parseTimeParam('2027-03-28T02:30')).toBeNull();
    expect(parseTimeParam('02:30')).toEqual(new Date('2027-03-29T00:30:00Z'));
  });

  it('uses the upcoming occurrence of a repeated autumn time', () => {
    vi.setSystemTime(new Date('2026-10-25T00:45:00Z'));
    expect(parseTimeParam('02:30')).toEqual(new Date('2026-10-25T01:30:00Z'));
    expect(parseTimeParam('2026-10-25T02:30')).toEqual(new Date('2026-10-25T01:30:00Z'));
  });

  it('preserves a recurring time when only the station changes', () => {
    const params = new URLSearchParams('t=07:30&s=masarykovo&tag=one&tag=two');
    const updated = serializeUrlState(params, 'bubny');

    expect(updated.get('s')).toBe('bubny');
    expect(updated.get('t')).toBe('07:30');
    expect(updated.getAll('tag')).toEqual(['one', 'two']);
    expect(params.get('s')).toBe('masarykovo');
  });

  it('serializes scheduled time in Prague and removes the time in live mode', () => {
    const params = new URLSearchParams('t=07:30');
    const scheduled = serializeUrlState(params, 'masarykovo', new Date('2026-07-01T05:30:00Z'));

    expect(scheduled.getAll('t')).toEqual(['2026-07-01T07:30']);
    expect(serializeUrlState(scheduled, 'masarykovo', null).has('t')).toBe(false);
  });
});
