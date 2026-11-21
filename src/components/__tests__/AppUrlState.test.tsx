import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from '../../App';
import { getAllDepartures } from '../../api/pidApi';

vi.mock('../../api/pidApi', () => ({
  getAllDepartures: vi.fn(() => new Promise(() => {})),
}));

describe('App URL state', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
    localStorage.removeItem('pragueStation');
    vi.useRealTimers();
  });

  it('loads the shared selection and replaces it through the UI', () => {
    vi.setSystemTime(new Date('2026-11-21T05:00:00Z'));
    localStorage.setItem('pragueStation', 'masarykovo');
    const historyState = { existing: true };
    window.history.replaceState(historyState, '', '/?s=bubny&t=07:30&tag=a&tag=b#main-content');
    const historyLength = window.history.length;

    render(<App />);

    const input = screen.getByLabelText('Vybrat datum a čas odjezdu');
    expect(input).toHaveValue('2026-11-21T07:30');
    expect(screen.getByRole('radio', { name: 'Bubny' })).toBeChecked();
    expect(getAllDepartures).toHaveBeenLastCalledWith(new Date('2026-11-21T06:30:00Z'), 'bubny', true);

    fireEvent.click(screen.getByRole('radio', { name: 'Masarykovo' }));
    const params = () => new URLSearchParams(window.location.search);
    expect(params().get('s')).toBe('masarykovo');
    expect(params().get('t')).toBe('07:30');

    fireEvent.change(input, { target: { value: '2026-11-22T08:15' } });
    expect(params().get('t')).toBe('2026-11-22T08:15');
    expect(getAllDepartures).toHaveBeenLastCalledWith(new Date('2026-11-22T07:15:00Z'), 'masarykovo', true);

    fireEvent.click(screen.getByRole('button', { name: 'Přepnout na živé odjezdy' }));
    expect(params().has('t')).toBe(false);
    expect(getAllDepartures).toHaveBeenLastCalledWith(null, 'masarykovo', true);
    expect(params().getAll('tag')).toEqual(['a', 'b']);
    expect(window.location.hash).toBe('#main-content');
    expect(window.history.state).toEqual(historyState);
    expect(window.history.length).toBe(historyLength);
  });

  it('falls back to the stored station and live mode for invalid parameters', () => {
    localStorage.setItem('pragueStation', 'bubny');
    window.history.replaceState(null, '', '/?s=invalid&t=invalid');

    render(<App />);

    expect(screen.getByRole('radio', { name: 'Bubny' })).toBeChecked();
    expect(screen.getByText('live')).toBeInTheDocument();
  });
});
