import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../Header';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock localStorage for jsdom
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock lucide-react icons to avoid SVG rendering issues in jsdom
vi.mock('lucide-react', () => ({
  Train: (props: any) => <span data-testid="train-icon" {...props} />,
  Clock: (props: any) => <span data-testid="clock-icon" {...props} />,
  RefreshCw: (props: any) => <span data-testid="refresh-icon" {...props} />,
  Sun: (props: any) => <span data-testid="sun-icon" {...props} />,
  Moon: (props: any) => <span data-testid="moon-icon" {...props} />,
}));

const renderHeader = (props: Partial<React.ComponentProps<typeof Header>> = {}) => {
  const defaultProps = {
    onRefresh: vi.fn(),
    isRefreshing: false,
  };

  return render(
    <ThemeProvider>
      <Header {...defaultProps} {...props} />
    </ThemeProvider>
  );
};

describe('Header', () => {
  it('renders the title', () => {
    renderHeader();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Praha');
  });

  it('renders the clock (time element)', () => {
    renderHeader();
    expect(screen.getByRole('time')).toBeInTheDocument();
  });

  it('renders the refresh button', () => {
    renderHeader();
    const button = screen.getByRole('button', { name: /obnovit/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('disables refresh button when refreshing', () => {
    renderHeader({ isRefreshing: true });
    const button = screen.getByRole('button', { name: /načítání/i });
    expect(button).toBeDisabled();
  });

  it('renders Live PID badge', () => {
    renderHeader();
    expect(screen.getByText('Live PID')).toBeInTheDocument();
  });
});
