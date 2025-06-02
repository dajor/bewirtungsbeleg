import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@/test-utils';
import ReleaseNotes from './page';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock react-chrono
jest.mock('react-chrono', () => ({
  Chrono: ({ items }: any) => (
    <div data-testid="chrono-timeline">
      {items?.map((item: any, index: number) => (
        <div key={index} data-testid={`timeline-item-${index}`}>
          <h3>{item.cardTitle}</h3>
          <p>{item.cardSubtitle}</p>
        </div>
      ))}
    </div>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

describe('ReleaseNotes', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  const user = userEvent.setup();

  const mockReleaseNotes = {
    versions: [
      {
        version: '1.2.0',
        date: '2024-01-15',
        changes: ['Feature 1', 'Bug fix 1'],
        build: '1234',
        commit: 'abc1234567890',
      },
      {
        version: '1.1.0',
        date: '2024-01-10',
        changes: ['Feature 2', 'Enhancement 1'],
        build: '1233',
        commit: 'def1234567890',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render the page with title and logo', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockReleaseNotes,
    } as Response);

    renderWithProviders(<ReleaseNotes />);

    // Check logo
    const logo = screen.getByAltText('DocBits Logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/docbits.svg');

    // Check title
    expect(screen.getByRole('heading', { name: /release notes/i })).toBeInTheDocument();

    // Check back button
    expect(screen.getByRole('link', { name: /zurück zur startseite/i })).toBeInTheDocument();
  });

  it('should load and display release notes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockReleaseNotes,
    } as Response);

    renderWithProviders(<ReleaseNotes />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check if timeline is rendered
    expect(screen.getByTestId('chrono-timeline')).toBeInTheDocument();

    // Check if version items are rendered
    expect(screen.getByTestId('timeline-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-item-1')).toBeInTheDocument();

    // Check version content
    expect(screen.getByText('Version 1.2.0')).toBeInTheDocument();
    expect(screen.getByText('2024-01-15')).toBeInTheDocument();
    expect(screen.getByText('Version 1.1.0')).toBeInTheDocument();
    expect(screen.getByText('2024-01-10')).toBeInTheDocument();
  });

  it('should show loading state while fetching data', () => {
    mockFetch.mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );

    renderWithProviders(<ReleaseNotes />);

    // Should show loader
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should handle fetch errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    renderWithProviders(<ReleaseNotes />);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/release notes konnten nicht geladen werden/i)).toBeInTheDocument();
    });
  });

  it('should handle HTTP errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    renderWithProviders(<ReleaseNotes />);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/release notes konnten nicht geladen werden/i)).toBeInTheDocument();
    });
  });

  it('should handle invalid data format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invalid: 'data' }), // Missing versions array
    } as Response);

    renderWithProviders(<ReleaseNotes />);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/release notes konnten nicht geladen werden/i)).toBeInTheDocument();
    });
  });

  it('should navigate back to home when clicking back button', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockReleaseNotes,
    } as Response);

    renderWithProviders(<ReleaseNotes />);

    const backButton = screen.getByRole('link', { name: /zurück zur startseite/i });
    expect(backButton).toHaveAttribute('href', '/');
  });

  it('should fetch release notes on component mount', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockReleaseNotes,
    } as Response);

    renderWithProviders(<ReleaseNotes />);

    expect(mockFetch).toHaveBeenCalledWith('/release-notes.json');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});