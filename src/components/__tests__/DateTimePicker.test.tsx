import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DateTimePicker } from '../DateTimePicker';

vi.mock('lucide-react', () => ({
  Calendar: (props: any) => <span data-testid="calendar-icon" {...props} />,
  Radio: (props: any) => <span data-testid="radio-icon" {...props} />,
}));

describe('DateTimePicker', () => {
  it('calls onChange with null when input is cleared', () => {
    const onChange = vi.fn();
    render(<DateTimePicker value={new Date()} onChange={onChange} />);

    const input = screen.getByLabelText(/vybrat datum a čas/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('calls onChange with valid date when valid input is provided', () => {
    const onChange = vi.fn();
    render(<DateTimePicker value={null} onChange={onChange} />);

    const input = screen.getByLabelText(/vybrat datum a čas/i) as HTMLInputElement;
    const futureDate = '2026-12-25T10:30';

    Object.defineProperty(input, 'validity', {
      writable: true,
      value: { valid: true },
    });

    fireEvent.change(input, { target: { value: futureDate } });

    expect(onChange).toHaveBeenCalledWith(expect.any(Date));
  });

  it('does not call onChange when input validity is false', () => {
    const onChange = vi.fn();
    render(<DateTimePicker value={null} onChange={onChange} />);

    const input = screen.getByLabelText(/vybrat datum a čas/i) as HTMLInputElement;

    Object.defineProperty(input, 'validity', {
      writable: true,
      value: { valid: false },
    });

    fireEvent.change(input, { target: { value: '2020-01-01T10:00' } });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders live mode button when value is set', () => {
    const onChange = vi.fn();
    render(<DateTimePicker value={new Date()} onChange={onChange} />);

    const liveButton = screen.getByRole('button', { name: /přepnout na živé odjezdy/i });
    expect(liveButton).toBeInTheDocument();

    fireEvent.click(liveButton);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('does not render live mode button when value is null', () => {
    const onChange = vi.fn();
    render(<DateTimePicker value={null} onChange={onChange} />);

    const liveButton = screen.queryByRole('button', { name: /přepnout na živé odjezdy/i });
    expect(liveButton).not.toBeInTheDocument();
  });
});
