// Keep in sync with STOPS in src/constants.ts.
const VALID_STOP_IDS = new Set(['U2823Z301', 'U480Z301', 'U100Z301', 'U2245Z2', 'U675Z12']);
const MINUTES_PER_DAY = 1440;
// Match the date picker and the four-hour window in the PID client.
const MAX_SCHEDULED_OFFSET = 90 * MINUTES_PER_DAY;
const SCHEDULED_WINDOW = 240;

function isIntegerInRange(value, min, max) {
  return typeof value === 'string' && /^-?\d+$/.test(value) &&
    Number(value) >= min && Number(value) <= max;
}

function sendError(res, status, error) {
  res.setHeader('cache-control', 'no-store');
  return res.status(status).json({ error });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed');
  }

  const { 'ids[]': ids, minutesBefore } = req.query;
  const stopId = Array.isArray(ids) && ids.length === 1 ? ids[0] : ids;
  if (!VALID_STOP_IDS.has(stopId) ||
      (minutesBefore !== undefined && !isIntegerInRange(minutesBefore, -MAX_SCHEDULED_OFFSET, MINUTES_PER_DAY))) {
    return sendError(res, 400, 'Invalid query parameters.');
  }

  const upstreamUrl = new URL('https://api.golemio.cz/v2/pid/departureboards');
  upstreamUrl.searchParams.set('ids[]', stopId);
  if (minutesBefore !== undefined) {
    upstreamUrl.searchParams.set('minutesBefore', minutesBefore);
  }

  const maxMinutesAfter = Math.max(MINUTES_PER_DAY, SCHEDULED_WINDOW - Number(minutesBefore ?? 0));
  const validators = {
    limit: (value) => isIntegerInRange(value, 1, 200),
    minutesAfter: (value) => isIntegerInRange(value, 0, maxMinutesAfter),
    mode: (value) => value === 'departures' || value === 'arrivals',
    order: (value) => value === 'real',
  };

  for (const [key, validate] of Object.entries(validators)) {
    const value = req.query[key];
    if (value === undefined) continue;
    if (!validate(value)) {
      return sendError(res, 400, 'Invalid query parameters.');
    }
    upstreamUrl.searchParams.set(key, value);
  }

  const apiKey = process.env.PID_API_KEY;
  if (!apiKey) {
    return sendError(res, 500, 'Server configuration error.');
  }

  const signal = globalThis.AbortSignal.timeout(7000);
  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'GET',
      redirect: 'error',
      signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Access-Token': apiKey,
      },
    });

    if (!upstreamResponse.ok) {
      return sendError(res, upstreamResponse.status, 'Upstream API request failed.');
    }

    const contentType = upstreamResponse.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
    if (contentType !== 'application/json' && !/^application\/[\w.+-]+\+json$/.test(contentType)) {
      return sendError(res, 502, 'Invalid upstream response.');
    }

    const body = await upstreamResponse.text();
    res.setHeader('content-type', 'application/json');
    res.setHeader('cache-control', minutesBefore !== undefined
      ? 's-maxage=60, stale-while-revalidate=120'
      : 's-maxage=15, stale-while-revalidate=45'
    );
    return res.status(upstreamResponse.status).send(body);
  } catch (error) {
    if (error?.name === 'TimeoutError' || signal.reason?.name === 'TimeoutError') {
      return sendError(res, 504, 'Upstream API timed out.');
    }
    return sendError(res, 502, 'Upstream API unavailable.');
  }
}
