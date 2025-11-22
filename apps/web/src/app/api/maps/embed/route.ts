import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const address = searchParams.get('address');

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    let embedUrl = '';

    if (lat && lng) {
      if (apiKey) {
        embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=15`;
      } else {
        // Fallback to static map link if no API key
        embedUrl = `https://www.google.com/maps?q=${lat},${lng}`;
      }
    } else if (address) {
      if (apiKey) {
        embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(address)}&zoom=15`;
      } else {
        // Fallback to search link if no API key
        embedUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
      }
    } else {
      return NextResponse.json({ error: 'Lat/lng or address required' }, { status: 400 });
    }

    // Return HTML page with iframe (for embed) or redirect (for links)
    if (apiKey && embedUrl.includes('embed')) {
      // Return HTML with iframe for embedding
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin:0;padding:0;overflow:hidden;">
            <iframe
              width="100%"
              height="100%"
              style="border:0;position:absolute;top:0;left:0;"
              src="${embedUrl}"
              allowfullscreen
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade">
            </iframe>
          </body>
        </html>
      `;
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    } else {
      // Redirect to Google Maps if no API key
      return NextResponse.redirect(embedUrl);
    }
  } catch (error: any) {
    console.error('Map embed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

