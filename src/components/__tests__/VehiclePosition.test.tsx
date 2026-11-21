import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VehiclePosition } from '../VehiclePosition';
import { getVehiclePosition } from '../../api/pidApi';

vi.mock('../../api/pidApi', () => ({ getVehiclePosition: vi.fn() }));
const mockedGet = vi.mocked(getVehiclePosition);

describe('VehiclePosition', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockedGet.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it('loads immediately, refreshes every 30 s and stops on unmount', async () => {
    mockedGet.mockResolvedValue({ lastStop: 'Libčice', nextStop: 'Roztoky', delay: 2, timestamp: null });
    const { unmount } = await act(async () => render(<VehiclePosition tripId="1309_1_251214" />));

    expect(mockedGet).toHaveBeenCalledWith('1309_1_251214');
    expect(screen.getByText('Poloha: Libčice → Roztoky, +2 min')).toBeInTheDocument();

    await act(async () => { vi.advanceTimersByTime(30_000); });
    expect(mockedGet).toHaveBeenCalledTimes(2);

    unmount();
    await act(async () => { vi.advanceTimersByTime(60_000); });
    expect(mockedGet).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['no position', () => mockedGet.mockResolvedValue(null)],
    ['error', () => mockedGet.mockRejectedValue(new Error('HTTP 429'))],
  ])('renders nothing on %s', async (_label, setup) => {
    setup();
    const { container } = await act(async () => render(<VehiclePosition tripId="1309_1_251214" />));
    expect(container).toBeEmptyDOMElement();
  });
});
