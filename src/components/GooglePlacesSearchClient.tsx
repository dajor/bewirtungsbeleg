'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Modal,
  TextInput,
  Stack,
  Text,
  Group,
  Paper,
  Loader,
  Alert,
  ActionIcon,
  Badge,
  Box,
} from '@mantine/core';
import { IconSearch, IconMapPin, IconStar, IconAlertCircle, IconX } from '@tabler/icons-react';

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  street: string;
  postalCode: string;
  city: string;
  fullAddress: string;
  rating?: number;
  userRatingsTotal?: number;
}

interface GooglePlacesSearchClientProps {
  opened: boolean;
  onClose: () => void;
  onSelect: (place: PlaceDetails) => void;
  apiKey: string;
}

// Load Google Maps API script
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google?.maps?.places) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for it to load
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkLoaded);
          resolve();
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=de`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
};

export function GooglePlacesSearchClient({ opened, onClose, onSelect, apiKey }: GooglePlacesSearchClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<google.maps.places.PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const serviceRef = useRef<google.maps.places.PlacesService | null>(null);

  // Load Google Maps script
  useEffect(() => {
    if (!apiKey) {
      setError('Google Places API-Schlüssel nicht konfiguriert');
      return;
    }

    loadGoogleMapsScript(apiKey)
      .then(() => {
        setScriptLoaded(true);
        // Create a dummy div for the service
        const div = document.createElement('div');
        serviceRef.current = new google.maps.places.PlacesService(div);
      })
      .catch((err) => {
        console.error('Error loading Google Maps:', err);
        setError('Fehler beim Laden der Google Maps API');
      });
  }, [apiKey]);

  // Search for places
  const searchPlaces = useCallback((query: string) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    if (!serviceRef.current) {
      setError('Google Places Service nicht verfügbar');
      return;
    }

    setLoading(true);
    setError(null);

    const request: google.maps.places.TextSearchRequest = {
      query,
      type: 'restaurant',
      language: 'de',
    };

    console.log('🔍 Searching for:', query);

    serviceRef.current.textSearch(request, (results, status) => {
      console.log('📍 Search results:', { status, resultsCount: results?.length });
      setLoading(false);

      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        console.log('✅ Found places:', results.map(r => r.name));
        setResults(results.slice(0, 5));
      } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        console.log('ℹ️ No results found');
        setResults([]);
      } else {
        console.error('❌ Places search error:', status);
        setError(`Fehler bei der Suche: ${status}`);
        setResults([]);
      }
    });
  }, []);

  // Debounced search
  useEffect(() => {
    if (!scriptLoaded) return;

    const timer = setTimeout(() => {
      if (searchQuery) {
        searchPlaces(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, scriptLoaded, searchPlaces]);

  // Get place details
  const getPlaceDetails = useCallback((placeId: string): Promise<PlaceDetails> => {
    return new Promise((resolve, reject) => {
      if (!serviceRef.current) {
        reject(new Error('Service not available'));
        return;
      }

      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: ['name', 'formatted_address', 'address_components', 'rating', 'user_ratings_total'],
        language: 'de',
      };

      serviceRef.current.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          // Parse address components
          const addressComponents = place.address_components || [];

          const getComponent = (types: string[]) => {
            const component = addressComponents.find((c) =>
              types.some((t) => c.types.includes(t))
            );
            return component?.long_name || '';
          };

          const street = getComponent(['route']);
          const streetNumber = getComponent(['street_number']);
          const postalCode = getComponent(['postal_code']);
          const city = getComponent(['locality', 'postal_town']);

          const formattedStreet = streetNumber ? `${street} ${streetNumber}` : street;
          const formattedCity = postalCode ? `${postalCode} ${city}` : city;
          const fullAddress = `${formattedStreet}, ${formattedCity}`;

          resolve({
            placeId: place.place_id || placeId,
            name: place.name || '',
            address: place.formatted_address || '',
            street: formattedStreet,
            postalCode,
            city,
            fullAddress,
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total,
          });
        } else {
          reject(new Error(`Failed to get place details: ${status}`));
        }
      });
    });
  }, []);

  // Handle place selection
  const handleSelectPlace = useCallback(async (place: google.maps.places.PlaceResult) => {
    if (!place.place_id) return;

    try {
      setLoading(true);
      const details = await getPlaceDetails(place.place_id);
      onSelect(details);
      onClose();
      setSearchQuery('');
      setResults([]);
      setSelectedIndex(0);
    } catch (err) {
      console.error('Error getting place details:', err);
      setError('Fehler beim Laden der Restaurant-Details');
    } finally {
      setLoading(false);
    }
  }, [getPlaceDetails, onSelect, onClose]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelectPlace(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!opened) {
      setSearchQuery('');
      setResults([]);
      setError(null);
      setSelectedIndex(0);
    }
  }, [opened]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  if (!apiKey) {
    return null;
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconMapPin size={20} />
          <Text fw={600}>Restaurant suchen</Text>
        </Group>
      }
      size="lg"
      centered
    >
      <Stack gap="md">
        <TextInput
          placeholder="Name des Restaurants eingeben..."
          leftSection={<IconSearch size={16} />}
          rightSection={
            searchQuery && (
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => setSearchQuery('')}
                aria-label="Suche löschen"
              >
                <IconX size={16} />
              </ActionIcon>
            )
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          size="md"
          disabled={!scriptLoaded}
          data-testid="places-search-input"
        />

        {!scriptLoaded && (
          <Group justify="center" py="xl">
            <Loader size="md" />
            <Text size="sm" c="dimmed">Lade Google Maps...</Text>
          </Group>
        )}

        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            variant="light"
            onClose={() => setError(null)}
            withCloseButton
          >
            {error}
          </Alert>
        )}

        {loading && scriptLoaded && (
          <Group justify="center" py="xl">
            <Loader size="md" />
            <Text size="sm" c="dimmed">Suche läuft...</Text>
          </Group>
        )}

        {!loading && searchQuery && results.length === 0 && !error && scriptLoaded && (
          <Alert icon={<IconAlertCircle size={16} />} color="gray" variant="light">
            Keine Ergebnisse für "{searchQuery}" gefunden
          </Alert>
        )}

        {!loading && results.length > 0 && (
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              {results.length} {results.length === 1 ? 'Ergebnis' : 'Ergebnisse'} gefunden
            </Text>
            {results.map((place, index) => (
              <Paper
                key={place.place_id || index}
                p="md"
                withBorder
                style={{
                  cursor: 'pointer',
                  backgroundColor: index === selectedIndex ? 'var(--mantine-color-blue-0)' : undefined,
                  borderColor: index === selectedIndex ? 'var(--mantine-color-blue-4)' : undefined,
                }}
                onClick={() => handleSelectPlace(place)}
                onMouseEnter={() => setSelectedIndex(index)}
                data-testid={`place-result-${index}`}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Box style={{ flex: 1 }}>
                    <Text fw={600} size="sm" mb={4}>
                      {place.name}
                    </Text>
                    <Group gap="xs">
                      <IconMapPin size={14} color="gray" />
                      <Text size="xs" c="dimmed" style={{ flex: 1 }}>
                        {place.formatted_address}
                      </Text>
                    </Group>
                  </Box>
                  {place.rating && (
                    <Badge
                      leftSection={<IconStar size={12} />}
                      variant="light"
                      color="yellow"
                      size="sm"
                    >
                      {place.rating.toFixed(1)}
                    </Badge>
                  )}
                </Group>
              </Paper>
            ))}
          </Stack>
        )}

        {!searchQuery && scriptLoaded && (
          <Alert icon={<IconSearch size={16} />} color="blue" variant="light">
            <Text size="sm">
              Geben Sie den Namen des Restaurants ein, um die Suche zu starten
            </Text>
          </Alert>
        )}

        <Text size="xs" c="dimmed" ta="center">
          💡 Tipp: Verwenden Sie ↑ ↓ Pfeiltasten zur Navigation und Enter zum Auswählen
        </Text>
      </Stack>
    </Modal>
  );
}
