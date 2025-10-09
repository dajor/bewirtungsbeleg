/**
 * @vitest-environment happy-dom
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { GooglePlacesSearchClient } from './GooglePlacesSearchClient';
import { MantineProvider } from '@mantine/core';

// Mock Google Maps API
const mockTextSearch = vi.fn();
const mockGetDetails = vi.fn();

const mockPlacesService = {
  textSearch: mockTextSearch,
  getDetails: mockGetDetails,
};

// Setup global Google Maps mock
beforeEach(() => {
  // @ts-ignore
  global.window.google = {
    maps: {
      places: {
        PlacesService: vi.fn(() => mockPlacesService),
        PlacesServiceStatus: {
          OK: 'OK',
          ZERO_RESULTS: 'ZERO_RESULTS',
          REQUEST_DENIED: 'REQUEST_DENIED',
          OVER_QUERY_LIMIT: 'OVER_QUERY_LIMIT',
          INVALID_REQUEST: 'INVALID_REQUEST',
        },
      },
    },
  };
});

const mockPlaceResults = [
  {
    place_id: 'ChIJ123',
    name: 'Fellowpro Poing',
    formatted_address: 'Friedensstraße 1, 85586 Poing, Deutschland',
    rating: 4.5,
    user_ratings_total: 120,
    address_components: [
      { long_name: 'Friedensstraße', short_name: 'Friedensstraße', types: ['route'] },
      { long_name: '1', short_name: '1', types: ['street_number'] },
      { long_name: '85586', short_name: '85586', types: ['postal_code'] },
      { long_name: 'Poing', short_name: 'Poing', types: ['locality'] },
    ],
  },
  {
    place_id: 'ChIJ456',
    name: 'Restaurant Mythos',
    formatted_address: 'Seifensiedergasse 4, 85570 Markt Schwaben, Deutschland',
    rating: 4.8,
    user_ratings_total: 250,
    address_components: [
      { long_name: 'Seifensiedergasse', short_name: 'Seifensiedergasse', types: ['route'] },
      { long_name: '4', short_name: '4', types: ['street_number'] },
      { long_name: '85570', short_name: '85570', types: ['postal_code'] },
      { long_name: 'Markt Schwaben', short_name: 'Markt Schwaben', types: ['locality'] },
    ],
  },
];

const mockPlaceDetails = {
  place_id: 'ChIJ123',
  name: 'Fellowpro Poing',
  formatted_address: 'Friedensstraße 1, 85586 Poing, Deutschland',
  rating: 4.5,
  user_ratings_total: 120,
  address_components: [
    { long_name: 'Friedensstraße', short_name: 'Friedensstraße', types: ['route'] },
    { long_name: '1', short_name: '1', types: ['street_number'] },
    { long_name: '85586', short_name: '85586', types: ['postal_code'] },
    { long_name: 'Poing', short_name: 'Poing', types: ['locality'] },
  ],
};

// Wrapper component with Mantine Provider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('GooglePlacesSearchClient Component', () => {
  const mockOnSelect = vi.fn();
  const mockOnClose = vi.fn();
  const testApiKey = 'test-api-key-123';

  beforeEach(() => {
    vi.clearAllMocks();
    mockTextSearch.mockClear();
    mockGetDetails.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the search modal when opened', () => {
    render(
      <TestWrapper>
        <GooglePlacesSearchClient
          opened={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          apiKey={testApiKey}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Restaurant suchen')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Name des Restaurants eingeben...')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <TestWrapper>
        <GooglePlacesSearchClient
          opened={false}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          apiKey={testApiKey}
        />
      </TestWrapper>
    );

    expect(screen.queryByText('Restaurant suchen')).not.toBeInTheDocument();
  });

  it('should search for "Fellowpro Poing" and display results', async () => {
    mockTextSearch.mockImplementation((request, callback) => {
      // Simulate async API call
      setTimeout(() => {
        callback(mockPlaceResults, 'OK');
      }, 100);
    });

    render(
      <TestWrapper>
        <GooglePlacesSearchClient
          opened={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          apiKey={testApiKey}
        />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Name des Restaurants eingeben...');

    // Type "Fellowpro Poing"
    fireEvent.change(searchInput, { target: { value: 'Fellowpro Poing' } });

    // Wait for debounced search (300ms) and results
    await waitFor(
      () => {
        expect(mockTextSearch).toHaveBeenCalledWith(
          expect.objectContaining({
            query: 'Fellowpro Poing',
            language: 'de',
            region: 'de',
          }),
          expect.any(Function)
        );
      },
      { timeout: 1000 }
    );

    // Wait for results to appear
    await waitFor(() => {
      expect(screen.getByText('Fellowpro Poing')).toBeInTheDocument();
    });

    expect(screen.getByText(/Friedensstraße 1.*85586 Poing/)).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('should display multiple search results', async () => {
    mockTextSearch.mockImplementation((request, callback) => {
      setTimeout(() => {
        callback(mockPlaceResults, 'OK');
      }, 100);
    });

    render(
      <TestWrapper>
        <GooglePlacesSearchClient
          opened={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          apiKey={testApiKey}
        />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Name des Restaurants eingeben...');
    fireEvent.change(searchInput, { target: { value: 'Restaurant' } });

    await waitFor(() => {
      expect(screen.getByText('2 Ergebnisse gefunden')).toBeInTheDocument();
    });

    expect(screen.getByText('Fellowpro Poing')).toBeInTheDocument();
    expect(screen.getByText('Restaurant Mythos')).toBeInTheDocument();
  });

  it('should select a place and call onSelect with place details', async () => {
    mockTextSearch.mockImplementation((request, callback) => {
      setTimeout(() => {
        callback(mockPlaceResults, 'OK');
      }, 100);
    });

    mockGetDetails.mockImplementation((request, callback) => {
      setTimeout(() => {
        callback(mockPlaceDetails, 'OK');
      }, 100);
    });

    render(
      <TestWrapper>
        <GooglePlacesSearchClient
          opened={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          apiKey={testApiKey}
        />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Name des Restaurants eingeben...');
    fireEvent.change(searchInput, { target: { value: 'Fellowpro' } });

    // Wait for search results
    await waitFor(() => {
      expect(screen.getByText('Fellowpro Poing')).toBeInTheDocument();
    });

    // Click on the first result
    const firstResult = screen.getByTestId('place-result-0');
    fireEvent.click(firstResult);

    // Wait for place details API call
    await waitFor(() => {
      expect(mockGetDetails).toHaveBeenCalledWith(
        expect.objectContaining({
          placeId: 'ChIJ123',
          fields: ['name', 'formatted_address', 'address_components', 'rating', 'user_ratings_total'],
          language: 'de',
        }),
        expect.any(Function)
      );
    });

    // Verify onSelect was called with correct data
    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          placeId: 'ChIJ123',
          name: 'Fellowpro Poing',
          street: 'Friedensstraße 1',
          postalCode: '85586',
          city: 'Poing',
          fullAddress: 'Friedensstraße 1, 85586 Poing',
        })
      );
    });

    // Verify modal closed
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should handle REQUEST_DENIED error', async () => {
    mockTextSearch.mockImplementation((request, callback) => {
      setTimeout(() => {
        callback(null, 'REQUEST_DENIED');
      }, 100);
    });

    render(
      <TestWrapper>
        <GooglePlacesSearchClient
          opened={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          apiKey={testApiKey}
        />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Name des Restaurants eingeben...');
    fireEvent.change(searchInput, { target: { value: 'Test' } });

    await waitFor(() => {
      expect(screen.getByText(/API-Schlüssel abgelehnt/)).toBeInTheDocument();
    });
  });

  it('should handle OVER_QUERY_LIMIT error', async () => {
    mockTextSearch.mockImplementation((request, callback) => {
      setTimeout(() => {
        callback(null, 'OVER_QUERY_LIMIT');
      }, 100);
    });

    render(
      <TestWrapper>
        <GooglePlacesSearchClient
          opened={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          apiKey={testApiKey}
        />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Name des Restaurants eingeben...');
    fireEvent.change(searchInput, { target: { value: 'Test' } });

    await waitFor(() => {
      expect(screen.getByText(/API-Limit überschritten/)).toBeInTheDocument();
    });
  });

  it('should show empty state when no results found', async () => {
    mockTextSearch.mockImplementation((request, callback) => {
      setTimeout(() => {
        callback([], 'ZERO_RESULTS');
      }, 100);
    });

    render(
      <TestWrapper>
        <GooglePlacesSearchClient
          opened={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          apiKey={testApiKey}
        />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Name des Restaurants eingeben...');
    fireEvent.change(searchInput, { target: { value: 'NonexistentPlace123' } });

    await waitFor(() => {
      expect(screen.getByText(/Keine Ergebnisse für "NonexistentPlace123" gefunden/)).toBeInTheDocument();
    });
  });

  it('should support keyboard navigation with Escape', async () => {
    mockTextSearch.mockImplementation((request, callback) => {
      setTimeout(() => {
        callback(mockPlaceResults, 'OK');
      }, 100);
    });

    render(
      <TestWrapper>
        <GooglePlacesSearchClient
          opened={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          apiKey={testApiKey}
        />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Name des Restaurants eingeben...');
    fireEvent.change(searchInput, { target: { value: 'Restaurant' } });

    await waitFor(() => {
      expect(screen.getByText('Fellowpro Poing')).toBeInTheDocument();
    });

    // Press Escape to close
    fireEvent.keyDown(searchInput, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should clear search when X button is clicked', async () => {
    render(
      <TestWrapper>
        <GooglePlacesSearchClient
          opened={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          apiKey={testApiKey}
        />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(
      'Name des Restaurants eingeben...'
    ) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Test Search' } });

    expect(searchInput.value).toBe('Test Search');

    // Find and click the clear button (X icon)
    const clearButton = screen.getByLabelText('Suche löschen');
    fireEvent.click(clearButton);

    expect(searchInput.value).toBe('');
  });

  it('should show loading state while searching', async () => {
    let resolveSearch: any;
    const searchPromise = new Promise((resolve) => {
      resolveSearch = resolve;
    });

    mockTextSearch.mockImplementation((request, callback) => {
      searchPromise.then(() => {
        callback(mockPlaceResults, 'OK');
      });
    });

    render(
      <TestWrapper>
        <GooglePlacesSearchClient
          opened={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          apiKey={testApiKey}
        />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Name des Restaurants eingeben...');
    fireEvent.change(searchInput, { target: { value: 'Test' } });

    await waitFor(() => {
      expect(screen.getByText('Suche läuft...')).toBeInTheDocument();
    });

    // Resolve the search
    resolveSearch();
  });

  it('should use initialSearchQuery when provided', async () => {
    mockTextSearch.mockImplementation((request, callback) => {
      setTimeout(() => {
        callback(mockPlaceResults, 'OK');
      }, 100);
    });

    render(
      <TestWrapper>
        <GooglePlacesSearchClient
          opened={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          apiKey={testApiKey}
          initialSearchQuery="FELLOWPRO"
        />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(
      'Name des Restaurants eingeben...'
    ) as HTMLInputElement;

    // Check that input is pre-filled
    expect(searchInput.value).toBe('FELLOWPRO');

    // Wait for automatic search to trigger
    await waitFor(
      () => {
        expect(mockTextSearch).toHaveBeenCalledWith(
          expect.objectContaining({
            query: 'FELLOWPRO',
          }),
          expect.any(Function)
        );
      },
      { timeout: 1000 }
    );
  });

  it('should correctly parse German address format', async () => {
    mockTextSearch.mockImplementation((request, callback) => {
      setTimeout(() => {
        callback(mockPlaceResults, 'OK');
      }, 100);
    });

    mockGetDetails.mockImplementation((request, callback) => {
      setTimeout(() => {
        callback(mockPlaceDetails, 'OK');
      }, 100);
    });

    render(
      <TestWrapper>
        <GooglePlacesSearchClient
          opened={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          apiKey={testApiKey}
        />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Name des Restaurants eingeben...');
    fireEvent.change(searchInput, { target: { value: 'Fellowpro' } });

    await waitFor(() => {
      expect(screen.getByText('Fellowpro Poing')).toBeInTheDocument();
    });

    const result = screen.getByTestId('place-result-0');
    fireEvent.click(result);

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          street: 'Friedensstraße 1',
          postalCode: '85586',
          city: 'Poing',
          fullAddress: 'Friedensstraße 1, 85586 Poing',
        })
      );
    });
  });
});
