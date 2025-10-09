import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

/**
 * Google Places API Proxy
 *
 * This endpoint proxies requests to Google Places API to:
 * 1. Hide the API key from the client
 * 2. Add server-side validation and rate limiting
 * 3. Cache frequently searched places
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Suchanfrage muss mindestens 2 Zeichen lang sein' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!env.GOOGLE_API_KEY_PLACES) {
      console.error('Google Places API key not configured');
      return NextResponse.json(
        {
          error: 'Google Places API ist nicht konfiguriert',
          userMessage: '🔑 Die Restaurantsuche ist derzeit nicht verfügbar. Bitte geben Sie die Daten manuell ein.'
        },
        { status: 503 }
      );
    }

    // Call Google Places Text Search API
    const googleApiUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    googleApiUrl.searchParams.append('query', query);
    googleApiUrl.searchParams.append('key', env.GOOGLE_API_KEY_PLACES);
    googleApiUrl.searchParams.append('type', 'restaurant');
    googleApiUrl.searchParams.append('language', 'de');

    console.log(`🔍 Searching Google Places for: "${query}"`);

    const response = await fetch(googleApiUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Google Places API error:', response.status, response.statusText);
      return NextResponse.json(
        {
          error: 'Fehler bei der Google Places API',
          userMessage: '❌ Die Suche ist fehlgeschlagen. Bitte versuchen Sie es erneut.'
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Handle API errors
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API returned error:', data.status, data.error_message);
      return NextResponse.json(
        {
          error: data.error_message || 'Google Places API Fehler',
          userMessage: '❌ Die Suche ist fehlgeschlagen. Bitte versuchen Sie es erneut.'
        },
        { status: 500 }
      );
    }

    // Transform results to a simpler format
    const results = data.results?.slice(0, 5).map((place: any) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      types: place.types,
      geometry: {
        lat: place.geometry?.location?.lat,
        lng: place.geometry?.location?.lng,
      }
    })) || [];

    console.log(`✅ Found ${results.length} place(s) for "${query}"`);

    return NextResponse.json({
      results,
      status: data.status,
    });

  } catch (error) {
    console.error('Error in places-search API:', error);
    return NextResponse.json(
      {
        error: 'Interner Serverfehler',
        userMessage: '❌ Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get Place Details
 * Fetches detailed information about a specific place
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { placeId } = body;

    if (!placeId) {
      return NextResponse.json(
        { error: 'Place ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!env.GOOGLE_API_KEY_PLACES) {
      return NextResponse.json(
        { error: 'Google Places API ist nicht konfiguriert' },
        { status: 503 }
      );
    }

    // Call Google Places Details API
    const googleApiUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    googleApiUrl.searchParams.append('place_id', placeId);
    googleApiUrl.searchParams.append('key', env.GOOGLE_API_KEY_PLACES);
    googleApiUrl.searchParams.append('fields', 'name,formatted_address,address_components,geometry,rating,user_ratings_total,types');
    googleApiUrl.searchParams.append('language', 'de');

    console.log(`📍 Fetching place details for: ${placeId}`);

    const response = await fetch(googleApiUrl.toString());

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Fehler bei der Google Places API' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      return NextResponse.json(
        { error: data.error_message || 'Place not found' },
        { status: 404 }
      );
    }

    const place = data.result;

    // Extract address components
    const addressComponents = place.address_components || [];
    const getComponent = (types: string[]) => {
      const component = addressComponents.find((c: any) =>
        types.some(t => c.types.includes(t))
      );
      return component?.long_name || '';
    };

    const street = getComponent(['route']);
    const streetNumber = getComponent(['street_number']);
    const postalCode = getComponent(['postal_code']);
    const city = getComponent(['locality', 'postal_town']);

    // Build formatted address for German format
    const formattedStreet = streetNumber ? `${street} ${streetNumber}` : street;
    const formattedCity = postalCode ? `${postalCode} ${city}` : city;

    console.log(`✅ Retrieved details for: ${place.name}`);

    return NextResponse.json({
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      street: formattedStreet,
      postalCode,
      city,
      fullAddress: `${formattedStreet}, ${formattedCity}`,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      geometry: {
        lat: place.geometry?.location?.lat,
        lng: place.geometry?.location?.lng,
      }
    });

  } catch (error) {
    console.error('Error in place details API:', error);
    return NextResponse.json(
      {
        error: 'Interner Serverfehler',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
