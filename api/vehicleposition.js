// GTFS trip id, e.g. 1309_2547_241215 or 371_123_250901.
const TRIP_ID = /^[A-Za-z0-9]{1,16}(?:_[A-Za-z0-9]{1,16}){1,4}$/;
const UPSTREAM = 'https://api.golemio.cz/v2';
// ponytail: per-instance cache of static stop lists (they change with the GTFS feed only); cleared wholesale at 200 trips.
const stopNamesCache = new Map();

function sendError(res, status, error) {
  res.setHeader('cache-control', 'no-store');
  return res.status(status).json({ error });
}

class UpstreamError extends Error {
  constructor(status) {
    super('Upstream API request failed.');
    this.status = status;
  }
}

async function getJson(url, apiKey, signal) {
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'error',
    signal,
    headers: { Accept: 'application/json', 'X-Access-Token': apiKey },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new UpstreamError(response.status);
  const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') throw new UpstreamError(502);
  return response.json();
}

async function getStops(tripId, apiKey, signal) {
  if (stopNamesCache.has(tripId)) return stopNamesCache.get(tripId);
  const url = new URL(`${UPSTREAM}/public/gtfs/trips/${encodeURIComponent(tripId)}`);
  url.searchParams.set('scopes', 'stop_times');
  const data = await getJson(url, apiKey, signal);
  const stops = (data?.stop_times?.features ?? [])
    .map((feature) => feature?.properties)
    .filter((stop) => typeof stop?.stop_name === 'string' && Number.isFinite(stop?.stop_sequence))
    .map((stop) => ({ name: stop.stop_name, sequence: stop.stop_sequence }))
    .sort((a, b) => a.sequence - b.sequence);
  if (stopNamesCache.size >= 200) stopNamesCache.clear();
  if (stops.length) stopNamesCache.set(tripId, stops);
  return stops;
}

// The vehicle may report a waypoint (a station the train passes without stopping), so take the closest real stop.
function lastStopAtOrBefore(stops, sequence) {
  if (!Number.isFinite(sequence)) return null;
  return stops.findLast((stop) => stop.sequence <= sequence)?.name ?? null;
}

function nextStopAtOrAfter(stops, sequence) {
  if (!Number.isFinite(sequence)) return null;
  return stops.find((stop) => stop.sequence >= sequence)?.name ?? null;
}

function toPosition(vehicle, stops) {
  const position = vehicle?.properties?.last_position;
  if (!position || position.is_canceled || position.tracking === false) return null;
  const delaySeconds = position.delay?.actual;
  return {
    lastStop: lastStopAtOrBefore(stops, position.last_stop?.sequence),
    nextStop: nextStopAtOrAfter(stops, position.next_stop?.sequence),
    delay: Number.isFinite(delaySeconds) ? Math.trunc(delaySeconds / 60) : null,
    timestamp: typeof position.origin_timestamp === 'string' ? position.origin_timestamp : null,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed');
  }

  const { tripId } = req.query;
  if (typeof tripId !== 'string' || !TRIP_ID.test(tripId)) {
    return sendError(res, 400, 'Invalid query parameters.');
  }

  const apiKey = process.env.PID_API_KEY;
  if (!apiKey) {
    return sendError(res, 500, 'Server configuration error.');
  }

  const signal = globalThis.AbortSignal.timeout(7000);
  try {
    const vehicleUrl = new URL(`${UPSTREAM}/vehiclepositions/${encodeURIComponent(tripId)}`);
    const [vehicle, stops] = await Promise.all([
      getJson(vehicleUrl, apiKey, signal),
      getStops(tripId, apiKey, signal),
    ]);
    res.setHeader('content-type', 'application/json');
    res.setHeader('cache-control', 's-maxage=10');
    return res.status(200).json({ position: toPosition(vehicle, stops) });
  } catch (error) {
    if (error instanceof UpstreamError) {
      return sendError(res, error.status, error.message);
    }
    if (error?.name === 'TimeoutError' || signal.reason?.name === 'TimeoutError') {
      return sendError(res, 504, 'Upstream API timed out.');
    }
    return sendError(res, 502, 'Upstream API unavailable.');
  }
}
