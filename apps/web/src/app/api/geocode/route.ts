import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    // Use Google Maps Geocoding API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );

    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return NextResponse.json({
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: data.results[0].formatted_address,
      });
    } else if (data.status === 'ZERO_RESULTS') {
      return NextResponse.json({ error: 'No results found for this address' }, { status: 404 });
    } else {
      return NextResponse.json(
        { error: `Geocoding failed: ${data.status} - ${data.error_message || 'Unknown error'}` },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to geocode address' },
      { status: 500 }
    );
  }
}

