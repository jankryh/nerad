import { describe, it, expect, vi } from 'vitest';
import { getAllDepartures, getDepartures } from '../pidApi';
import { STOPS } from '../../constants';

describe('pidApi', () => {
  it('shares identical in-flight requests and caches per limit', async () => {
    const item = (n: number) => ({
      route: { short_name: 'S4', type: 2 },
      trip: { id: `t${n}`, headsign: 'Praha Masarykovo n.' },
      departure_timestamp: { scheduled: new Date(Date.now() + n * 60_000).toISOString() },
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ departures: Array.from({ length: 10 }, (_, i) => item(i + 1)) })),
    );
    vi.stubGlobal('fetch', fetchMock);

    const [small, large] = await Promise.all([
      getDepartures(STOPS.REZ, 'S4', 3, 'to-masarykovo'),
      getDepartures(STOPS.REZ, 'S4', 10, 'to-masarykovo'),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(small.departures).toHaveLength(3);
    expect(large.departures).toHaveLength(10);
    vi.unstubAllGlobals();
  });

  it('keeps working boards when one board fails', async () => {
    const fetchMock = vi.fn((url: URL) => Promise.resolve(
      url.searchParams.get('ids[]') === STOPS.BUBNY
        ? new Response('bad gateway', { status: 502 })
        : new Response(JSON.stringify({ departures: [] })),
    ));
    vi.stubGlobal('fetch', fetchMock);

    const data = await getAllDepartures(null, 'bubny', false);

    expect(data.masarykovoToRez.error).toBeTruthy();
    expect(data.rezToMasarykovo.error).toBeUndefined();
    expect(data.husinecsToKobylisy.departures).toEqual([]);
    vi.unstubAllGlobals();
  });

  it('throws when all boards fail', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('', { status: 503 }))));
    await expect(getAllDepartures(null, 'masarykovo', false)).rejects.toMatchObject({ status: 503 });
    vi.unstubAllGlobals();
  });
});
