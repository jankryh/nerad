import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DepartureBoard } from '../DepartureBoard';
import { Departure } from '../../types';

vi.mock('../../utils/timeCalculations', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../utils/timeCalculations')>()),
  getEnhancedTravelTime: vi.fn().mockResolvedValue(18),
}));

const dep = (tripId: string, scheduledTime: string, delay: number | null = null): Departure => ({
  id: tripId, tripId, routeId: 'S4', line: 'S4', mode: 'train', direction: 'Praha', scheduledTime, delay,
  boardDirection: 'to-masarykovo',
});

afterEach(() => vi.useRealTimers());

describe('DepartureBoard', () => {
  const mockGetLead = vi.fn().mockReturnValue(null);
  const mockSetAlert = vi.fn();

  it('sorts by effective (delayed) time and shows live countdown', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-03-20T10:00:00.000Z'));

    render(
      <DepartureBoard
        departures={[
          dep('late', '2026-03-20T10:00:00.000Z', 10), // effective 10:10
          dep('a', '2026-03-20T10:05:00.000Z'),
          dep('b', '2026-03-20T11:05:00.000Z'),
          dep('c', '2026-03-20T10:08:00.000Z'),
        ]}
        getLead={mockGetLead}
        setAlert={mockSetAlert}
      />,
    );

    const countdowns = screen.getAllByRole('row').slice(1).map((row) => row.querySelectorAll('[role="cell"]')[4]?.textContent);
    expect(countdowns).toEqual(['5 min', '8 min', '10 min', '1 h 5 min']);
  });

  it('shows signed offset relative to targetDateTime in scheduled mode', () => {
    render(
      <DepartureBoard
        departures={[dep('a', '2026-03-20T10:30:00.000Z')]}
        targetDateTime={new Date('2026-03-20T10:00:00.000Z')}
        getLead={mockGetLead}
        setAlert={mockSetAlert}
      />,
    );

    expect(screen.getAllByRole('row')[1].lastElementChild?.textContent).toBe('+30 min');
  });
});
