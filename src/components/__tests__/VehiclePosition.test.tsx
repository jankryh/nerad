import { act, fireEvent, render, screen } from '@testing-library/react';
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

  it('loads only on demand, refreshes every 30 s while open and stops when closed', async () => {
    mockedGet.mockResolvedValue({ lastStop: 'Libčice', nextStop: 'Roztoky', delay: 2, timestamp: null });
    render(<VehiclePosition tripId="1309_1_251214" line="S4" />);
    const button = screen.getByRole('button', { name: 'Kde je spoj S4?' });

    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(mockedGet).not.toHaveBeenCalled();

    await act(async () => { fireEvent.click(button); });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(mockedGet).toHaveBeenCalledWith('1309_1_251214');
    expect(screen.getByText('Poloha: Libčice → Roztoky, +2 min')).toBeInTheDocument();

    await act(async () => { vi.advanceTimersByTime(30_000); });
    expect(mockedGet).toHaveBeenCalledTimes(2);

    await act(async () => { fireEvent.click(button); });
    await act(async () => { vi.advanceTimersByTime(60_000); });
    expect(mockedGet).toHaveBeenCalledTimes(2);
  });

  it.each([
    [() => mockedGet.mockResolvedValue(null), 'Poloha není k dispozici'],
    [() => mockedGet.mockRejectedValue(new Error('HTTP 429')), 'Polohu se nepodařilo načíst'],
  ])('shows a fallback message', async (setup, message) => {
    setup();
    render(<VehiclePosition tripId="1309_1_251214" line="S4" />);

    await act(async () => { fireEvent.click(screen.getByRole('button')); });

    expect(screen.getByText(message)).toBeInTheDocument();
  });
});
