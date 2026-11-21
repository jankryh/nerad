import type { PragueStation } from '../constants';
import { formatPragueDateTime, getNextPragueTime, getScheduleLimit, parsePragueDateTime } from './pragueDateTime';

export const parseStationParam = (value: string | null): PragueStation | null => (
  value === 'masarykovo' || value === 'bubny' ? value : null
);

export const parseTimeParam = (value: string | null, now = new Date()): Date | null => {
  if (!value) return null;
  if (value.length === 5) return getNextPragueTime(value, now);

  // Match the minute precision of the picker's minimum and maximum.
  const min = new Date(now);
  min.setUTCSeconds(0, 0);
  const date = parsePragueDateTime(value, min);
  if (!date || date < min || date > getScheduleLimit(now)) return null;
  return date < now ? now : date;
};

export const serializeUrlState = (
  params: URLSearchParams,
  station: PragueStation,
  time?: Date | null,
): URLSearchParams => {
  const next = new URLSearchParams(params);
  next.set('s', station);
  if (time === null) next.delete('t');
  else if (time !== undefined) next.set('t', formatPragueDateTime(time));
  return next;
};
