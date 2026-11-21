export const PRAGUE_TIME_ZONE = 'Europe/Prague';

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: PRAGUE_TIME_ZONE,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export const formatPragueDateTime = (date: Date): string => {
  const { year, month, day, hour, minute } = Object.fromEntries(
    formatter.formatToParts(date).map(({ type, value }) => [type, value]),
  );
  return `${year.padStart(4, '0')}-${month}-${day}T${hour}:${minute}`;
};

export const getScheduleLimit = (now: Date): Date => new Date(now.getTime() + 90 * DAY_MS);

const getPragueDateTimes = (value: string): Date[] => {
  if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) return [];

  const utc = Date.parse(`${value}Z`);
  if (!Number.isFinite(utc)) return [];

  // Both sides of a clock change can supply a valid offset for the same wall time.
  const offsets = new Set([utc - DAY_MS, utc + DAY_MS].map((sample) => (
    Date.parse(`${formatPragueDateTime(new Date(sample))}Z`) - sample
  )));

  return [...offsets]
    .filter(Number.isFinite)
    .map((offset) => new Date(utc - offset))
    .filter((date) => formatPragueDateTime(date) === value)
    .sort((a, b) => a.getTime() - b.getTime());
};

export const parsePragueDateTime = (value: string, now: Date): Date | null => {
  const dates = getPragueDateTimes(value);
  return dates.find((date) => date >= now) ?? dates[0] ?? null;
};

export const getNextPragueTime = (value: string, now: Date): Date | null => {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;

  const today = formatPragueDateTime(now).slice(0, 10);
  const start = Date.parse(`${today}T00:00Z`);
  // A time skipped when daylight saving starts can require one extra day.
  for (let day = 0; day <= 2; day++) {
    const calendarDate = new Date(start + day * DAY_MS).toISOString().slice(0, 10);
    const next = getPragueDateTimes(`${calendarDate}T${value}`).find((date) => date >= now);
    if (next) return next;
  }
  return null;
};
