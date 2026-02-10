import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 });
  }

  try {
    // Use Google Weather API
    const response = await fetch(
      `https://weather.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_MAPS_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: {
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
          },
        }),
      }
    );

    if (!response.ok) {
      // Fallback: return mock data or indicate weather not available
      return NextResponse.json({
        available: false,
        message: 'Weather data not available',
      });
    }

    const data = await response.json();
    
    return NextResponse.json({
      available: true,
      temperature: data.temperature?.degrees,
      temperatureUnit: data.temperature?.unit || 'F',
      humidity: data.humidity?.percent,
      condition: data.weatherCondition?.description?.text,
      uvIndex: data.uvIndex,
      windSpeed: data.wind?.speed?.value,
      windDirection: data.wind?.direction?.degrees,
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json({ 
      available: false, 
      error: 'Weather data unavailable' 
    });
  }
}
