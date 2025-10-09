'use client';

import React, { useState, useCallback, useEffect } from 'react';
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
  rem,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch, IconMapPin, IconStar, IconAlertCircle, IconX } from '@tabler/icons-react';

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  userRatingsTotal?: number;
  types?: string[];
  geometry?: {
    lat: number;
    lng: number;
  };
}

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
  geometry?: {
    lat: number;
    lng: number;
  };
}

interface GooglePlacesSearchProps {
  opened: boolean;
  onClose: () => void;
  onSelect: (place: PlaceDetails) => void;
}

export function GooglePlacesSearch({ opened, onClose, onSelect }: GooglePlacesSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(searchQuery, 300);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Search for places
  const searchPlaces = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/places-search?query=${encodeURIComponent(query)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.userMessage || errorData.error || 'Suchfehler');
      }

      const data = await response.json();

      if (data.status === 'ZERO_RESULTS') {
        setResults([]);
      } else {
        setResults(data.results || []);
      }
    } catch (err) {
      console.error('Places search error:', err);
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch place details
  const fetchPlaceDetails = useCallback(async (placeId: string) => {
    try {
      const response = await fetch('/api/places-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ placeId }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Details');
      }

      const placeDetails: PlaceDetails = await response.json();
      return placeDetails;
    } catch (err) {
      console.error('Place details error:', err);
      throw err;
    }
  }, []);

  // Handle place selection
  const handleSelectPlace = useCallback(async (place: PlaceResult) => {
    try {
      setLoading(true);
      const details = await fetchPlaceDetails(place.placeId);
      onSelect(details);
      onClose();
      // Reset state
      setSearchQuery('');
      setResults([]);
      setSelectedIndex(0);
    } catch (err) {
      setError('Fehler beim Laden der Restaurant-Details');
    } finally {
      setLoading(false);
    }
  }, [fetchPlaceDetails, onSelect, onClose]);

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      searchPlaces(debouncedQuery);
    }
  }, [debouncedQuery, searchPlaces]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

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
          data-testid="places-search-input"
        />

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

        {loading && (
          <Group justify="center" py="xl">
            <Loader size="md" />
            <Text size="sm" c="dimmed">Suche läuft...</Text>
          </Group>
        )}

        {!loading && searchQuery && results.length === 0 && !error && (
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
                key={place.placeId}
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
                        {place.address}
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

        {!searchQuery && (
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
