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

  it('reports 429 when any of the failed boards was rate limited', async () => {
    let call = 0;
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('', { status: ++call === 3 ? 429 : 503 }))));
    await expect(getAllDepartures(null, 'masarykovo', false)).rejects.toMatchObject({ status: 429 });
    vi.unstubAllGlobals();
  });

  it('sets bubnyHasTrains when Masarykovo is empty and Bubny has S4 trains', async () => {
    const s4Item = {
      route: { short_name: 'S4', type: 2 },
      trip: { id: 't1', headsign: 'Kralupy nad Vltavou' },
      departure_timestamp: { scheduled: new Date(Date.now() + 10 * 60_000).toISOString() },
    };
    const fetchMock = vi.fn((url: URL) => {
      const stopId = url.searchParams.get('ids[]');
      // Masarykovo returns empty, Bubny returns S4
      const departures = stopId === STOPS.BUBNY ? [s4Item] : [];
      return Promise.resolve(new Response(JSON.stringify({ departures })));
    });
    vi.stubGlobal('fetch', fetchMock);

    const data = await getAllDepartures(null, 'masarykovo', false);

    expect(data.masarykovoToRez.departures).toEqual([]);
    expect(data.masarykovoToRez.bubnyHasTrains).toBe(true);
    vi.unstubAllGlobals();
  });

  it('does not check Bubny when Masarykovo has S4 trains', async () => {
    const s4Item = {
      route: { short_name: 'S4', type: 2 },
      trip: { id: 't1', headsign: 'Kralupy nad Vltavou' },
      departure_timestamp: { scheduled: new Date(Date.now() + 10 * 60_000).toISOString() },
    };
    const fetchMock = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ departures: [s4Item] }))),
    );
    vi.stubGlobal('fetch', fetchMock);

    const data = await getAllDepartures(null, 'masarykovo', false);

    expect(data.masarykovoToRez.departures.length).toBeGreaterThan(0);
    expect(data.masarykovoToRez.bubnyHasTrains).toBeUndefined();
    // 4 boards in parallel, no extra Bubny check afterward
    expect(fetchMock).toHaveBeenCalledTimes(4);
    vi.unstubAllGlobals();
  });
});
