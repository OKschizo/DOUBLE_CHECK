import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const address = searchParams.get('address');
    const name = searchParams.get('name') || 'Location';
    const mapId = searchParams.get('mapId') || process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      // Return error page if no API key
      const errorHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                margin: 0; 
                padding: 0; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                background: #000; 
                color: #fff; 
                font-family: 'Space Grotesk', sans-serif;
              }
              .error-container {
                text-align: center;
                padding: 2rem;
              }
              .error-icon { font-size: 4rem; margin-bottom: 1rem; }
              .error-title { font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem; }
              .error-message { color: #999; margin-bottom: 1rem; }
              .error-link { color: #b5ff00; text-decoration: underline; }
            </style>
          </head>
          <body>
            <div class="error-container">
              <div class="error-icon">🗺️</div>
              <div class="error-title">Google Maps API Key Required</div>
              <div class="error-message">
                Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file and restart the dev server.<br><br>
                <strong>Important:</strong> Make sure your API key has:<br>
                1. Maps JavaScript API enabled<br>
                2. Places API enabled<br>
                3. Directions API enabled<br>
                4. HTTP referrer restrictions allow localhost (for dev) or your domain (for prod)
              </div>
              ${lat && lng ? (
                `<a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" class="error-link">Open in Google Maps</a>`
              ) : address ? (
                `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}" target="_blank" class="error-link">Open in Google Maps</a>`
              ) : ''}
            </div>
          </body>
        </html>
      `;
      return new NextResponse(errorHtml, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Dark mode map style
    const darkStyle = [
      { elementType: 'geometry', stylers: [{ color: '#212121' }] },
      { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
      { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
      { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
      { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
      { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
      { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
      { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
      { featureType: 'poi.park', elementType: 'labels.text.stroke', stylers: [{ color: '#1b1b1b' }] },
      { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2a2a2a' }] },
      { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9a9a9a' }] },
      { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
      { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#4e4e4e' }] },
      { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
      { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
      { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
    ];

    let query = '';
    if (lat && lng) {
      query = `${lat},${lng}`;
    } else if (address) {
      query = encodeURIComponent(address);
    } else {
      return NextResponse.json({ error: 'Lat/lng or address required' }, { status: 400 });
    }

    // Return HTML page with Google Maps JavaScript API and dark styling
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; overflow: hidden; background: #000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; }
            #map { width: 100%; height: 100vh; }
            .controls {
              position: absolute;
              top: 10px;
              left: 10px;
              z-index: 1000;
              display: flex;
              flex-direction: column;
              gap: 10px;
              max-width: 300px;
            }
            .directions-panel {
              background: rgba(0, 0, 0, 0.9);
              border: 1px solid #333;
              padding: 12px;
              border-radius: 4px;
              display: none;
            }
            .directions-panel.active {
              display: block;
            }
            .directions-panel h4 {
              margin: 0 0 8px 0;
              font-size: 14px;
              font-weight: 600;
              color: #b5ff00;
            }
            .directions-panel input {
              width: 100%;
              padding: 8px 12px;
              background: #1a1a1a;
              border: 1px solid #333;
              border-radius: 4px;
              color: #fff;
              font-size: 13px;
              outline: none;
              margin-bottom: 8px;
              box-sizing: border-box;
            }
            .directions-panel input:focus {
              border-color: #b5ff00;
            }
            .directions-panel .btn-group {
              display: flex;
              gap: 6px;
            }
            .directions-panel button {
              flex: 1;
              padding: 6px 12px;
              background: #b5ff00;
              color: #000;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
              font-weight: 600;
            }
            .directions-panel button:hover {
              background: #9ecc00;
            }
            .directions-panel button.secondary {
              background: #333;
              color: #fff;
            }
            .directions-panel button.secondary:hover {
              background: #444;
            }
            .directions-results {
              margin-top: 8px;
              max-height: 200px;
              overflow-y: auto;
              font-size: 12px;
              color: #ccc;
            }
            .directions-results .route-info {
              padding: 6px;
              border-bottom: 1px solid #333;
            }
            .directions-results .route-info:last-child {
              border-bottom: none;
            }
            .info-window {
              background: rgba(0, 0, 0, 0.95);
              border: 1px solid #333;
              padding: 12px;
              border-radius: 4px;
              color: #fff;
              min-width: 200px;
            }
            .info-window h3 {
              margin: 0 0 8px 0;
              font-size: 16px;
              font-weight: 600;
              color: #b5ff00;
            }
            .info-window p {
              margin: 4px 0;
              font-size: 14px;
              color: #ccc;
            }
            .info-window .directions-btn {
              margin-top: 8px;
              padding: 6px 12px;
              background: #b5ff00;
              color: #000;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 600;
              text-decoration: none;
              display: inline-block;
            }
            .info-window .directions-btn:hover {
              background: #9ecc00;
            }
            .error { 
              display: none; 
              position: absolute; 
              top: 50%; 
              left: 50%; 
              transform: translate(-50%, -50%); 
              text-align: center; 
              z-index: 1000;
              background: rgba(0, 0, 0, 0.9);
              padding: 2rem;
              border: 1px solid #333;
            }
            .error.show { display: block; }
            .error-icon { font-size: 3rem; margin-bottom: 1rem; }
            .error-title { font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem; color: #b5ff00; }
            .error-message { color: #999; margin-bottom: 1rem; font-size: 0.9rem; }
            .error-link { color: #b5ff00; text-decoration: underline; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <div class="controls">
            <div class="directions-panel" id="directions-panel">
              <h4>Get Directions</h4>
              <input type="text" id="directions-input" placeholder="Enter starting location..." />
              <div class="btn-group">
                <button id="get-directions-btn">Get Directions</button>
                <button id="clear-directions-btn" class="secondary">Clear</button>
              </div>
              <div class="directions-results" id="directions-results"></div>
            </div>
          </div>
          <div id="error" class="error">
            <div class="error-icon">⚠️</div>
            <div class="error-title">Google Maps API Error</div>
            <div class="error-message" id="errorMsg">Loading map...</div>
            ${lat && lng ? (
              `<a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" class="error-link">Open in Google Maps</a>`
            ) : address ? (
              `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}" target="_blank" class="error-link">Open in Google Maps</a>`
            ) : ''}
          </div>
          <script>
            // Handle API authentication errors globally
            window.gm_authFailure = function() {
              showError('Google Maps API authentication failed. Please check: 1) Your API key is correct, 2) Maps JavaScript API is enabled, 3) API key restrictions allow this domain (localhost for dev, your domain for prod), 4) Places API and Directions API are enabled.');
            };

            // Load Google Maps API asynchronously
            (function() {
              const script = document.createElement('script');
              script.src = 'https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async';
              script.async = true;
              script.defer = true;
              script.onload = function() {
                // Small delay to ensure DOM is ready
                setTimeout(initMap, 100);
              };
              script.onerror = function() {
                console.error('Google Maps API script failed to load');
                showError('Failed to load Google Maps API. Please check: 1) API key is correct, 2) Maps JavaScript API is enabled, 3) HTTP referrer restrictions allow this domain, 4) Check browser console for details.');
              };
              document.head.appendChild(script);
            })();

            let map;
            let marker;
            let infoWindow;
            let directionsService;
            let directionsRenderer;
            let directionsAutocomplete;
            const locationName = ${JSON.stringify(name || 'Location')};
            const locationAddress = ${JSON.stringify(address || '')};

            function initMap() {
              try {
                const mapElement = document.getElementById('map');
                if (!mapElement) {
                  showError('Map container not found');
                  return;
                }

                let center;
                ${lat && lng ? `
                  center = { lat: ${lat}, lng: ${lng} };
                ` : `
                  center = null;
                `}

                map = new google.maps.Map(mapElement, {
                  center: center || { lat: 0, lng: 0 },
                  zoom: center ? 15 : 2,
                  mapId: ${JSON.stringify(mapId)},
                  styles: ${JSON.stringify(darkStyle)},
                  disableDefaultUI: false,
                  zoomControl: true,
                  mapTypeControl: false,
                  scaleControl: true,
                  streetViewControl: false,
                  rotateControl: false,
                  fullscreenControl: true
                });

                // Create info window
                infoWindow = new google.maps.InfoWindow();

                // Initialize Directions Service and Renderer
                directionsService = new google.maps.DirectionsService();
                directionsRenderer = new google.maps.DirectionsRenderer({
                  map: map,
                  suppressMarkers: false,
                  polylineOptions: {
                    strokeColor: '#b5ff00',
                    strokeWeight: 4,
                    strokeOpacity: 0.8
                  }
                });

                // Initialize marker and info window using AdvancedMarkerElement
                ${lat && lng ? `
                  const position = { lat: ${lat}, lng: ${lng} };
                  marker = new google.maps.marker.AdvancedMarkerElement({
                    map: map,
                    position: position,
                    title: locationName
                  });
                  
                  // Show info window with address and directions
                  const infoContent = createInfoWindowContent(locationName, locationAddress, position);
                  infoWindow.setContent(infoContent);
                  infoWindow.open(map, marker);
                  
                  marker.addListener('click', function() {
                    infoWindow.open(map, marker);
                    const directionsPanel = document.getElementById('directions-panel');
                    if (directionsPanel) {
                      directionsPanel.classList.add('active');
                    }
                  });
                ` : `
                  const geocoder = new google.maps.Geocoder();
                  geocoder.geocode({ address: locationAddress }, (results, status) => {
                    if (status === 'OK' && results && results[0]) {
                      const location = results[0].geometry.location;
                      const position = { lat: location.lat(), lng: location.lng() };
                      map.setCenter(position);
                      map.setZoom(15);
                      
                      marker = new google.maps.marker.AdvancedMarkerElement({
                        map: map,
                        position: position,
                        title: locationName
                      });
                      
                      // Show info window with address and directions
                      const formattedAddress = results[0].formatted_address || locationAddress;
                      const infoContent = createInfoWindowContent(locationName, formattedAddress, position);
                      infoWindow.setContent(infoContent);
                      infoWindow.open(map, marker);
                      
                      marker.addListener('click', function() {
                        infoWindow.open(map, marker);
                        const directionsPanel = document.getElementById('directions-panel');
                        if (directionsPanel) {
                          directionsPanel.classList.add('active');
                        }
                      });
                    } else {
                      showError('Could not find location. Status: ' + status);
                    }
                  });
                `}

                // Initialize Directions Autocomplete
                // Note: google.maps.places.Autocomplete is deprecated but still functional
                // Consider migrating to PlaceAutocompleteElement in the future
                const directionsInput = document.getElementById('directions-input');
                if (directionsInput) {
                  directionsAutocomplete = new google.maps.places.Autocomplete(directionsInput, {
                    fields: ['geometry', 'formatted_address'],
                    types: ['geocode', 'establishment']
                  });

                  // Get Directions button handler
                  const getDirectionsBtn = document.getElementById('get-directions-btn');
                  const clearDirectionsBtn = document.getElementById('clear-directions-btn');
                  const directionsPanel = document.getElementById('directions-panel');
                  const directionsResults = document.getElementById('directions-results');

                  if (getDirectionsBtn) {
                    getDirectionsBtn.addEventListener('click', function() {
                      calculateAndDisplayRoute();
                    });
                  }

                  if (clearDirectionsBtn) {
                    clearDirectionsBtn.addEventListener('click', function() {
                      clearDirections();
                    });
                  }

                  // Show directions panel when clicking on marker
                  if (marker) {
                    marker.addListener('click', function() {
                      if (directionsPanel) {
                        directionsPanel.classList.add('active');
                      }
                    });
                  }
                }

              } catch (error) {
                console.error('Map initialization error:', error);
                showError('Error loading map: ' + (error.message || 'Unknown error'));
              }
            }

            function createInfoWindowContent(name, address, position) {
              // Escape HTML and quotes
              const safeName = (name || 'Location').replace(/'/g, '\\\'').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
              const safeAddress = (address || 'No address available').replace(/'/g, '\\\'').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
              return '<div class="info-window">' +
                '<h3>' + safeName + '</h3>' +
                '<p>' + safeAddress + '</p>' +
                '<button onclick="showDirectionsPanel()" class="directions-btn" style="margin-top: 8px; padding: 6px 12px; background: #b5ff00; color: #000; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 600;">Get Directions</button>' +
                '</div>';
            }

            function showDirectionsPanel() {
              const directionsPanel = document.getElementById('directions-panel');
              if (directionsPanel) {
                directionsPanel.classList.add('active');
                const directionsInput = document.getElementById('directions-input');
                if (directionsInput) {
                  directionsInput.focus();
                }
              }
            }

            function calculateAndDisplayRoute() {
              const directionsInput = document.getElementById('directions-input');
              const directionsResults = document.getElementById('directions-results');
              
              if (!directionsInput || !directionsInput.value) {
                alert('Please enter a starting location');
                return;
              }

              if (!directionsService || !directionsRenderer || !marker) {
                return;
              }

              const destination = marker.position;
              const request = {
                origin: directionsInput.value,
                destination: destination,
                travelMode: google.maps.TravelMode.DRIVING
              };

              directionsService.route(request, function(result, status) {
                if (status === 'OK') {
                  directionsRenderer.setDirections(result);
                  
                  // Display route information
                  if (directionsResults) {
                    const route = result.routes[0];
                    const leg = route.legs[0];
                    directionsResults.innerHTML = 
                      '<div class="route-info">' +
                      '<strong>Distance:</strong> ' + leg.distance.text + '<br>' +
                      '<strong>Duration:</strong> ' + leg.duration.text +
                      '</div>';
                  }
                } else {
                  if (directionsResults) {
                    directionsResults.innerHTML = '<div class="route-info" style="color: #ff6b6b;">Could not calculate route: ' + status + '</div>';
                  }
                  alert('Could not calculate route: ' + status);
                }
              });
            }

            function clearDirections() {
              if (directionsRenderer) {
                directionsRenderer.setDirections({ routes: [] });
              }
              const directionsInput = document.getElementById('directions-input');
              const directionsResults = document.getElementById('directions-results');
              if (directionsInput) {
                directionsInput.value = '';
              }
              if (directionsResults) {
                directionsResults.innerHTML = '';
              }
            }

            // Make functions available globally for onclick handlers
            window.showDirectionsPanel = showDirectionsPanel;

            function showError(message) {
              const errorDiv = document.getElementById('error');
              const errorMsg = document.getElementById('errorMsg');
              if (errorDiv && errorMsg) {
                errorMsg.textContent = message;
                errorDiv.classList.add('show');
              }
            }

          </script>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'X-Frame-Options': 'SAMEORIGIN',
        'Content-Security-Policy': "frame-ancestors 'self'",
      },
    });
  } catch (error: any) {
    console.error('Dark map error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

