// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handler from '../../api/vehicleposition.js';

function request(query) {
  const res = {
    status: vi.fn().mockReturnThis(),
    setHeader: vi.fn(),
    json: vi.fn(),
    send: vi.fn(),
  };
  return handler({ method: 'GET', query }, res).then(() => res);
}

const json = (body, status = 200, contentType = 'application/json; charset=utf-8') =>
  new globalThis.Response(JSON.stringify(body), { status, headers: { 'content-type': contentType } });

const vehicle = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [14.4, 50.1] },
  properties: {
    trip: { vehicle_registration_number: 1234, secret: 'x' },
    last_position: {
      last_stop: { id: 'U1', sequence: 3 },
      next_stop: { id: 'U2', sequence: 5 },
      delay: { actual: 150 },
      origin_timestamp: '2026-11-21T10:00:00.000Z',
      is_canceled: false,
      tracking: true,
    },
  },
};

const stopTimes = {
  stop_times: {
    features: [
      { properties: { stop_name: 'Roztoky', stop_sequence: 5 } },
      { properties: { stop_name: 'Řež', stop_sequence: 1 } },
      { properties: { stop_name: 'Libčice', stop_sequence: 2 } },
    ],
  },
};

let tripCounter = 0;
// Unique trip per test so the static stop cache does not leak between tests.
const nextTripId = () => `1309_${++tripCounter}_251214`;

describe('vehicleposition proxy', () => {
  const upstreamFetch = vi.fn();

  beforeEach(() => {
    upstreamFetch.mockReset();
    vi.stubGlobal('fetch', upstreamFetch);
    vi.stubEnv('PID_API_KEY', 'test-key');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  const routeUpstream = (vehicleResponse, stopsResponse = json(stopTimes)) =>
    upstreamFetch.mockImplementation((url) =>
      Promise.resolve(url.pathname.includes('/gtfs/trips/') ? stopsResponse : vehicleResponse));

  it('returns only the minimal position fields, mapping waypoints to real stops', async () => {
    routeUpstream(json(vehicle));
    const timeout = vi.spyOn(globalThis.AbortSignal, 'timeout');
    const tripId = nextTripId();

    const res = await request({ tripId, ignored: 'value' });

    expect(upstreamFetch).toHaveBeenCalledTimes(2);
    for (const [url, options] of upstreamFetch.mock.calls) {
      expect(url.origin).toBe('https://api.golemio.cz');
      expect(url.pathname.endsWith(`/${tripId}`)).toBe(true);
      expect(url.searchParams.has('ignored')).toBe(false);
      expect(options).toMatchObject({ redirect: 'error', headers: { 'X-Access-Token': 'test-key' } });
      expect(options.signal).toBe(timeout.mock.results[0].value);
    }
    expect(timeout).toHaveBeenCalledWith(7000);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.setHeader).toHaveBeenCalledWith('cache-control', 's-maxage=10');
    expect(res.json).toHaveBeenCalledWith({
      position: { lastStop: 'Libčice', nextStop: 'Roztoky', delay: 2, timestamp: '2026-11-21T10:00:00.000Z' },
    });
  });

  it('caches the static stop list per trip', async () => {
    routeUpstream(json(vehicle));
    const tripId = nextTripId();
    await request({ tripId });
    routeUpstream(json(vehicle));
    await request({ tripId });

    const stopCalls = upstreamFetch.mock.calls.filter(([url]) => url.pathname.includes('/gtfs/trips/'));
    expect(stopCalls).toHaveLength(1);
  });

  it.each([
    ['upstream 404', () => new globalThis.Response('', { status: 404 })],
    ['canceled trip', () => json({ properties: { last_position: { ...vehicle.properties.last_position, is_canceled: true } } })],
    ['not tracking', () => json({ properties: { last_position: { ...vehicle.properties.last_position, tracking: false } } })],
  ])('returns position null for %s', async (_label, makeResponse) => {
    routeUpstream(makeResponse());

    const res = await request({ tripId: nextTripId() });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ position: null });
  });

  it.each([
    ['missing tripId', {}],
    ['array tripId', { tripId: ['1309_1_251214'] }],
    ['path traversal', { tripId: '../departureboards' }],
    ['encoded slash', { tripId: '1309%2F1_251214' }],
    ['query injection', { tripId: '1309_1?x=1' }],
    ['single segment', { tripId: '1309' }],
    ['too long', { tripId: `${'1'.repeat(17)}_1` }],
  ])('rejects %s with 400', async (_label, query) => {
    const res = await request(query);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.setHeader).toHaveBeenCalledWith('cache-control', 'no-store');
    expect(upstreamFetch).not.toHaveBeenCalled();
  });

  it.each([
    [429, 'text/plain', 429],
    [503, 'text/html', 503],
    [200, 'text/html', 502],
  ])('returns a generic error with no-store for upstream %i (%s)', async (status, contentType, expectedStatus) => {
    routeUpstream(new globalThis.Response('upstream details', { status, headers: { 'content-type': contentType } }));

    const res = await request({ tripId: nextTripId() });

    expect(res.status).toHaveBeenCalledWith(expectedStatus);
    expect(res.setHeader).toHaveBeenCalledWith('cache-control', 'no-store');
    expect(res.json).toHaveBeenCalledWith({ error: expect.not.stringContaining('upstream details') });
  });

  it('returns 504 with no-store when fetch times out', async () => {
    upstreamFetch.mockRejectedValue(new globalThis.DOMException('timed out', 'TimeoutError'));

    const res = await request({ tripId: nextTripId() });

    expect(res.status).toHaveBeenCalledWith(504);
    expect(res.setHeader).toHaveBeenCalledWith('cache-control', 'no-store');
  });

  it('returns 500 without a server key', async () => {
    vi.stubEnv('PID_API_KEY', '');

    const res = await request({ tripId: nextTripId() });

    expect(res.status).toHaveBeenCalledWith(500);
    expect(upstreamFetch).not.toHaveBeenCalled();
  });
});
