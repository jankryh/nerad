import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDepartures } from '../useDepartures';
import { getAllDepartures } from '../../api/pidApi';
import { REFRESH_INTERVAL } from '../../constants';

vi.mock('../../api/pidApi', () => ({ getAllDepartures: vi.fn() }));

const board = { departures: [] };
const mocked = vi.mocked(getAllDepartures);

describe('useDepartures', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocked.mockReset();
    mocked.mockResolvedValue({
      rezToMasarykovo: board,
      masarykovoToRez: board,
      husinecsToKobylisy: board,
      kobylisyToHusinec: board,
      offlineSince: null,
    });
  });
  afterEach(() => vi.useRealTimers());

  it('polls in live mode', async () => {
    renderHook(() => useDepartures(null));
    await act(async () => {});
    expect(mocked).toHaveBeenCalledTimes(1);

    await act(async () => { vi.advanceTimersByTime(REFRESH_INTERVAL); });
    expect(mocked).toHaveBeenCalledTimes(2);
  });

  it('offline cache: marks offline, uses the cache time and drops departed trains', async () => {
    const dep = (minutes: number) => ({
      id: `t${minutes}`, tripId: `t${minutes}`, scheduledTime: new Date(Date.now() + minutes * 60_000).toISOString(),
      delay: 0, line: 'S4', direction: 'Praha', mode: 'train' as const, platform: null, routeId: 'S4',
    });
    const cachedAt = Date.now() - 600_000;
    mocked.mockResolvedValue({
      rezToMasarykovo: { departures: [dep(-5), dep(10)] },
      masarykovoToRez: board,
      husinecsToKobylisy: board,
      kobylisyToHusinec: board,
      offlineSince: cachedAt,
    });
    const { result } = renderHook(() => useDepartures(null));
    await act(async () => {});
    expect(result.current.isOffline).toBe(true);
    expect(result.current.lastUpdate?.getTime()).toBe(cachedAt);
    expect(result.current.trainToPrague.map((d) => d.id)).toEqual(['t10']);
  });

  it('does not poll in scheduled mode', async () => {
    const target = new Date(Date.now() + 3600_000);
    renderHook(() => useDepartures(target));
    await act(async () => {});
    await act(async () => { vi.advanceTimersByTime(REFRESH_INTERVAL * 3); });
    expect(mocked).toHaveBeenCalledTimes(1);
  });

  it('manual refresh after a failure starts backoff from zero', async () => {
    mocked.mockRejectedValue({ message: 'down' });
    const { result } = renderHook(() => useDepartures(null));
    await act(async () => {});
    // Simulates onClick passing the click event
    await act(async () => { (result.current.refreshData as (e: unknown) => void)({ type: 'click' }); });
    expect(result.current.retryCount).toBe(0);
  });

  it('skips the live poll while a backoff retry is pending', async () => {
    mocked.mockRejectedValue({ message: 'down', status: 503 });
    const { result } = renderHook(() => useDepartures(null));
    await act(async () => {});
    expect(mocked).toHaveBeenCalledTimes(1);

    // Retries fire at 5s, 10s (cumulative 15s) and 20s (35s); the poll at 30s must not add a call or reset the attempt
    await act(async () => { await vi.advanceTimersByTimeAsync(REFRESH_INTERVAL); });
    expect(mocked).toHaveBeenCalledTimes(3);
    expect(result.current.retryCount).toBe(2);
  });

  it('shows the real error message for non-4xx failures in scheduled mode', async () => {
    mocked.mockRejectedValue({ message: 'Nepodařilo se načíst data z PID API.', status: 503 });
    const target = new Date(Date.now() + 3600_000);
    const { result } = renderHook(() => useDepartures(target));
    await act(async () => {});
    expect(result.current.error).toBe('Nepodařilo se načíst data z PID API.');
  });

  it('manual refresh bypasses the board cache', async () => {
    const { result } = renderHook(() => useDepartures(null));
    await act(async () => {});
    await act(async () => { result.current.refreshData(); });
    expect(mocked).toHaveBeenLastCalledWith(null, 'masarykovo', false);
  });

  it('keeps the retry cap: after it, a failing poll does not restart the short backoff', async () => {
    mocked.mockRejectedValue({ message: 'rate limited', status: 429 });
    const { result } = renderHook(() => useDepartures(null));
    await act(async () => {});
    // 5 retries at 5, 15, 35, 65, 95 s; polls at 30/60/90 s are skipped while a retry is pending
    await act(async () => { await vi.advanceTimersByTimeAsync(100_000); });
    expect(mocked).toHaveBeenCalledTimes(6);
    expect(result.current.isRetrying).toBe(false);

    // Poll at 120 s fails; without the cap fix it would reset to attempt 0 and retry again at 125 s
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(mocked).toHaveBeenCalledTimes(7);
    expect(result.current.retryCount).toBe(5);
    expect(result.current.error).toBe('Příliš mnoho požadavků, zkusím to znovu za chvíli.');
  });
});
