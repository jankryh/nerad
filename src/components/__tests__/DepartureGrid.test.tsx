import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DepartureGrid } from '../DepartureGrid';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Train: (props: any) => <span data-testid="train-icon" {...props} />,
  Bus: (props: any) => <span data-testid="bus-icon" {...props} />,
  AlertTriangle: (props: any) => <span data-testid="alert-icon" {...props} />,
  Loader: (props: any) => <span data-testid="loader-icon" {...props} />,
  RefreshCw: (props: any) => <span data-testid="refresh-icon" {...props} />,
  ArrowRight: (props: any) => <span data-testid="arrow-right-icon" {...props} />,
  ArrowLeft: (props: any) => <span data-testid="arrow-left-icon" {...props} />,
}));

// Mock DepartureBoard to avoid deep rendering
vi.mock('../DepartureBoard', () => ({
  DepartureBoard: ({ departures }: any) => (
    <div data-testid="departure-board">
      {departures.length} departures
    </div>
  ),
}));

const defaultProps = {
  trainToPrague: [],
  trainFromPrague: [],
  busToPrague: [],
  busFromPrague: [],
  isLoading: false,
  error: null,
};

describe('DepartureGrid', () => {
  it('renders loading state with spinner', () => {
    render(<DepartureGrid {...defaultProps} isLoading={true} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/načítání spojů/i)).toBeInTheDocument();
  });

  it('renders error state with error message', () => {
    render(
      <DepartureGrid
        {...defaultProps}
        error="API nedostupné"
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('API nedostupné')).toBeInTheDocument();
    expect(screen.getByText(/chyba při načítání dat/i)).toBeInTheDocument();
  });

  it('renders retry button in error state when manualRetry is provided', () => {
    const manualRetry = vi.fn();
    render(
      <DepartureGrid
        {...defaultProps}
        error="Chyba"
        manualRetry={manualRetry}
      />
    );

    const retryButton = screen.getByRole('button', { name: /zkusit znovu/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('renders departure boards when data is loaded', () => {
    render(<DepartureGrid {...defaultProps} />);

    const boards = screen.getAllByTestId('departure-board');
    expect(boards).toHaveLength(2);
  });

  it('shows retry count in error state', () => {
    render(
      <DepartureGrid
        {...defaultProps}
        error="Chyba"
        retryCount={3}
      />
    );

    expect(screen.getByText(/pokus 3\/5/i)).toBeInTheDocument();
  });
});
