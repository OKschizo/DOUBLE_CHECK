import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Types of places relevant for film production safety
const PLACE_TYPES: Record<string, string> = {
  hospital: 'hospital',
  police: 'police',
  fire_station: 'fire_station',
  pharmacy: 'pharmacy',
  gas_station: 'gas_station',
  restaurant: 'restaurant',
  parking: 'parking',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const type = searchParams.get('type') || 'hospital';
  const radius = searchParams.get('radius') || '5000'; // Default 5km

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();

    if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
      const places = (data.results || []).slice(0, 5).map((place: any) => ({
        name: place.name,
        address: place.vicinity,
        latitude: place.geometry?.location?.lat,
        longitude: place.geometry?.location?.lng,
        rating: place.rating,
        isOpen: place.opening_hours?.open_now,
        placeId: place.place_id,
      }));

      return NextResponse.json({ places });
    }

    return NextResponse.json({ error: data.status, places: [] }, { status: 400 });
  } catch (error) {
    console.error('Places API error:', error);
    return NextResponse.json({ error: 'Failed to fetch nearby places' }, { status: 500 });
  }
}
