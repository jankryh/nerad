// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handler from '../../api/departureboards.js';

const validQuery = {
  'ids[]': 'U2823Z301',
  limit: '50',
  minutesAfter: '240',
  mode: 'departures',
  order: 'real',
};

function request(query = validQuery) {
  const res = {
    status: vi.fn().mockReturnThis(),
    setHeader: vi.fn(),
    json: vi.fn(),
    send: vi.fn(),
  };
  return handler({ method: 'GET', query }, res).then(() => res);
}

describe('departureboards proxy', () => {
  const upstreamFetch = vi.fn();
  const body = '{"departures":[]}';

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

  it.each([
    [validQuery, 's-maxage=15, stale-while-revalidate=45'],
    [{ ...validQuery, minutesBefore: '-4320', minutesAfter: '4560' }, 's-maxage=15'],
  ])('forwards valid queries and caches JSON responses', async (query, cacheControl) => {
    upstreamFetch.mockResolvedValue(new globalThis.Response(body, {
      headers: { 'content-type': 'application/json; charset=utf-8' },
    }));
    const timeout = vi.spyOn(globalThis.AbortSignal, 'timeout');

    const res = await request({ ...query, ignored: 'value' });

    const [[url, options]] = upstreamFetch.mock.calls;
    expect(Object.fromEntries(url.searchParams)).toEqual(query);
    expect(options).toMatchObject({ redirect: 'error', headers: { 'X-Access-Token': 'test-key' } });
    expect(timeout).toHaveBeenCalledWith(7000);
    expect(options.signal).toBe(timeout.mock.results[0].value);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.setHeader).toHaveBeenCalledWith('content-type', 'application/json');
    expect(res.setHeader).toHaveBeenCalledWith('cache-control', cacheControl);
    expect(res.send).toHaveBeenCalledWith(body);
  });

  it.each([
    ['unknown stop', { 'ids[]': 'U999Z1' }],
    ['two stops', { 'ids[]': ['U2823Z301', 'U480Z301'] }],
    ['array for a scalar', { limit: ['50'] }],
    ['fractional limit', { limit: '50.5' }],
    ['out-of-range minutesAfter', { minutesAfter: '1441' }],
    ['unsupported mode', { mode: 'other' }],
    ['unsupported order', { order: 'scheduled' }],
  ])('rejects %s with 400', async (_label, override) => {
    const res = await request({ ...validQuery, ...override });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid query parameters.' });
    expect(upstreamFetch).not.toHaveBeenCalled();
  });

  it.each([
    [500, 'application/json', 500],
    [200, 'text/html', 502],
    [200, 'application/problem+json', 502],
    [400, 'application/problem+json', 502],
  ])('returns a generic error with no-store for upstream %i (%s)', async (status, contentType, expectedStatus) => {
    upstreamFetch.mockResolvedValue(new globalThis.Response('upstream details', {
      status,
      headers: { 'content-type': contentType },
    }));

    const res = await request();

    expect(res.status).toHaveBeenCalledWith(expectedStatus);
    expect(res.setHeader).toHaveBeenCalledWith('cache-control', 'no-store');
    expect(res.json).toHaveBeenCalledWith({ error: expect.not.stringContaining('upstream details') });
    expect(res.send).not.toHaveBeenCalled();
  });

  it('returns 504 with no-store when fetch times out', async () => {
    upstreamFetch.mockRejectedValue(new globalThis.DOMException('timed out', 'TimeoutError'));

    const res = await request();

    expect(res.status).toHaveBeenCalledWith(504);
    expect(res.setHeader).toHaveBeenCalledWith('cache-control', 'no-store');
  });
});
