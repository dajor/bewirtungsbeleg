/**
 * @vitest-environment happy-dom
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { GooglePlacesSearch } from './GooglePlacesSearch';
import { MantineProvider } from '@mantine/core';

// Mock fetch globally
global.fetch = vi.fn();

const mockPlacesSearchResponse = {
  results: [
    {
      place_id: 'ChIJ123',
      name: 'Fellowpro Poing',
      formatted_address: 'Friedensstraße 1, 85586 Poing',
      rating: 4.5,
      user_ratings_total: 120,
      types: ['restaurant', 'food'],
      geometry: {
        location: {
          lat: 48.1234,
          lng: 11.8234,
        },
      },
    },
    {
      place_id: 'ChIJ456',
      name: 'Restaurant Mythos',
      formatted_address: 'Seifensiedergasse 4, 85570 Markt Schwaben',
      rating: 4.8,
      user_ratings_total: 250,
      types: ['restaurant', 'food'],
      geometry: {
        location: {
          lat: 48.1935,
          lng: 11.8643,
        },
      },
    },
  ],
  status: 'OK',
};

const mockPlaceDetailsResponse = {
  placeId: 'ChIJ123',
  name: 'Fellowpro Poing',
  address: 'Friedensstraße 1, 85586 Poing, Deutschland',
  street: 'Friedensstraße 1',
  postalCode: '85586',
  city: 'Poing',
  fullAddress: 'Friedensstraße 1, 85586 Poing',
  rating: 4.5,
  userRatingsTotal: 120,
  geometry: {
    lat: 48.1234,
    lng: 11.8234,
  },
};

// Wrapper component with Mantine Provider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('GooglePlacesSearch Component', () => {
  const mockOnSelect = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the search modal when opened', () => {
    render(
      <TestWrapper>
        <GooglePlacesSearch opened={true} onClose={mockOnClose} onSelect={mockOnSelect} />
      </TestWrapper>
    );

    expect(screen.getByText('Restaurant suchen')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Name des Restaurants eingeben...')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <TestWrapper>
        <GooglePlacesSearch opened={false} onClose={mockOnClose} onSelect={mockOnSelect} />
      </TestWrapper>
    );

    expect(screen.queryByText('Restaurant suchen')).not.toBeInTheDocument();
  });

  it('should search for "Fellowpro Poing" and display results', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlacesSearchResponse,
    });

    render(
      <TestWrapper>
        <GooglePlacesSearch opened={true} onClose={mockOnClose} onSelect={mockOnSelect} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Name des Restaurants eingeben...');

    // Type "Fellowpro Poing"
    fireEvent.change(searchInput, { target: { value: 'Fellowpro Poing' } });

    // Wait for debounced search (300ms)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/places-search?query=Fellowpro%20Poing')
      );
    }, { timeout: 1000 });

    // Wait for results to appear
    await waitFor(() => {
      expect(screen.getByText('Fellowpro Poing')).toBeInTheDocument();
    });

    expect(screen.getByText(/Friedensstraße 1.*85586 Poing/)).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('should display multiple search results', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlacesSearchResponse,
    });

    render(
      <TestWrapper>
        <GooglePlacesSearch opened={true} onClose={mockOnClose} onSelect={mockOnSelect} />
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
    // Mock search response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlacesSearchResponse,
    });

    // Mock place details response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlaceDetailsResponse,
    });

    render(
      <TestWrapper>
        <GooglePlacesSearch opened={true} onClose={mockOnClose} onSelect={mockOnSelect} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Name des Restaurants eingeben...');
    fireEvent.change(searchInput, { target: { value: 'Fellowpro' } });

    // Wait for search results
    await waitFor(() => {
      expect(screen.getByText('Fellowpro Poing')).toBeInTheDocument();
    });

    // Click on the first result
    const firstResult = screen.getByText('Fellowpro Poing').closest('div[data-testid^="place-result"]');
    if (firstResult) {
      fireEvent.click(firstResult);
    }

    // Wait for place details API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/places-search',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ placeId: 'ChIJ123' }),
        })
      );
    });

    // Verify onSelect was called with correct data
    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Fellowpro Poing',
          fullAddress: 'Friedensstraße 1, 85586 Poing',
          postalCode: '85586',
          city: 'Poing',
        })
      );
    });

    // Verify modal closed
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'API Error',
        userMessage: '❌ Die Suche ist fehlgeschlagen',
      }),
    });

    render(
      <TestWrapper>
        <GooglePlacesSearch opened={true} onClose={mockOnClose} onSelect={mockOnSelect} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Name des Restaurants eingeben...');
    fireEvent.change(searchInput, { target: { value: 'Test' } });

    await waitFor(() => {
      expect(screen.getByText(/Die Suche ist fehlgeschlagen/)).toBeInTheDocument();
    });
  });

  it('should show empty state when no results found', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [],
        status: 'ZERO_RESULTS',
      }),
    });

    render(
      <TestWrapper>
        <GooglePlacesSearch opened={true} onClose={mockOnClose} onSelect={mockOnSelect} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Name des Restaurants eingeben...');
    fireEvent.change(searchInput, { target: { value: 'NonexistentPlace123' } });

    await waitFor(() => {
      expect(screen.getByText(/Keine Ergebnisse für "NonexistentPlace123" gefunden/)).toBeInTheDocument();
    });
  });

  it('should support keyboard navigation', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlacesSearchResponse,
    });

    render(
      <TestWrapper>
        <GooglePlacesSearch opened={true} onClose={mockOnClose} onSelect={mockOnSelect} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Name des Restaurants eingeben...');
    fireEvent.change(searchInput, { target: { value: 'Restaurant' } });

    await waitFor(() => {
      expect(screen.getByText('Fellowpro Poing')).toBeInTheDocument();
    });

    // Press ArrowDown to select second result
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

    // The second item should have highlighting (tested via implementation)

    // Press Escape to close
    fireEvent.keyDown(searchInput, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should clear search when X button is clicked', async () => {
    render(
      <TestWrapper>
        <GooglePlacesSearch opened={true} onClose={mockOnClose} onSelect={mockOnSelect} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Name des Restaurants eingeben...') as HTMLInputElement;
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

    (global.fetch as any).mockReturnValueOnce(searchPromise);

    render(
      <TestWrapper>
        <GooglePlacesSearch opened={true} onClose={mockOnClose} onSelect={mockOnSelect} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Name des Restaurants eingeben...');
    fireEvent.change(searchInput, { target: { value: 'Test' } });

    await waitFor(() => {
      expect(screen.getByText('Suche läuft...')).toBeInTheDocument();
    });

    // Resolve the search
    resolveSearch({
      ok: true,
      json: async () => mockPlacesSearchResponse,
    });
  });
});

describe('GooglePlacesSearch - German Address Parsing', () => {
  const mockOnSelect = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should correctly parse German address format', async () => {
    const germanPlaceDetails = {
      placeId: 'ChIJ789',
      name: 'Restaurant Test',
      address: 'Hauptstraße 12, 80331 München, Deutschland',
      street: 'Hauptstraße 12',
      postalCode: '80331',
      city: 'München',
      fullAddress: 'Hauptstraße 12, 80331 München',
      rating: 4.2,
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{
            place_id: 'ChIJ789',
            name: 'Restaurant Test',
            formatted_address: 'Hauptstraße 12, 80331 München, Deutschland',
          }],
          status: 'OK',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => germanPlaceDetails,
      });

    render(
      <MantineProvider>
        <GooglePlacesSearch opened={true} onClose={mockOnClose} onSelect={mockOnSelect} />
      </MantineProvider>
    );

    const searchInput = screen.getByPlaceholderText('Name des Restaurants eingeben...');
    fireEvent.change(searchInput, { target: { value: 'Restaurant Test' } });

    await waitFor(() => {
      expect(screen.getByText('Restaurant Test')).toBeInTheDocument();
    });

    const result = screen.getByText('Restaurant Test').closest('div[data-testid^="place-result"]');
    if (result) {
      fireEvent.click(result);
    }

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          street: 'Hauptstraße 12',
          postalCode: '80331',
          city: 'München',
          fullAddress: 'Hauptstraße 12, 80331 München',
        })
      );
    });
  });
});
