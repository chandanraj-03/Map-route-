import React, { useEffect, useState, useRef } from 'react';
import { Map, AdvancedMarker, useMap, useMapsLibrary, InfoWindow } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { MapPin } from 'lucide-react';

// Traffic layer component
function TrafficLayerComponent() {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const trafficLayer = new window.google.maps.TrafficLayer();
    trafficLayer.setMap(map);
    return () => trafficLayer.setMap(null);
  }, [map]);
  return null;
}

// Directions component using Open Source Routing Machine (Free, No API Key needed!)
function DirectionsRendererComponent({ locations, prediction }) {
  const map = useMap();
  const [polyline, setPolyline] = useState(null);

  // Initialize a Google Maps Polyline
  useEffect(() => {
    if (!map) return;
    const pl = new window.google.maps.Polyline({
      strokeColor: '#2563eb',
      strokeOpacity: 0.8,
      strokeWeight: 6,
      map: map
    });
    setPolyline(pl);
    return () => pl.setMap(null);
  }, [map]);

  // Fetch actual road geometry from OSRM
  useEffect(() => {
    if (!polyline) return;

    // If backend provided the exact traffic-aware path, use it immediately!
    if (prediction && prediction.geojson_path && prediction.geojson_path.length > 0) {
      const path = prediction.geojson_path.map(coord => ({
        lat: coord[1], lng: coord[0]
      }));
      polyline.setPath(path);
      return;
    }

    // Otherwise (live map before prediction), fetch basic OSRM route
    const routePoints = locations;
    if (routePoints.length < 2) {
      polyline.setPath([]);
      return;
    }

    const fetchRoute = async () => {
      try {
        const coords = routePoints.map(p => `${p.lng},${p.lat}`).join(';');
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`);
        const data = await res.json();
        
        if (data.code === 'Ok' && data.routes.length > 0) {
          const path = data.routes[0].geometry.coordinates.map(coord => ({
            lat: coord[1], lng: coord[0]
          }));
          polyline.setPath(path);
        } else {
          polyline.setPath([]);
        }
      } catch (err) {
        console.error("OSRM Error:", err);
      }
    };
    
    fetchRoute();
  }, [polyline, locations, prediction]);

  return null;
}

function GoogleMapContainer({ locations, prediction, onMapClick }) {
  const map = useMap();
  const [markers, setMarkers] = useState({});
  const clusterer = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Initialize MarkerClusterer
  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ map });
    }
  }, [map]);

  // Update clusters when markers change
  useEffect(() => {
    if (clusterer.current) {
      clusterer.current.clearMarkers();
      clusterer.current.addMarkers(Object.values(markers));
    }
  }, [markers]);

  const setMarkerRef = (marker, key) => {
    if (marker && markers[key]) return;
    if (!marker && !markers[key]) return;

    setMarkers(prev => {
      if (marker) {
        return { ...prev, [key]: marker };
      } else {
        const newMarkers = { ...prev };
        delete newMarkers[key];
        return newMarkers;
      }
    });
  };

  const center = locations.length > 0 
    ? { lat: locations[0].lat, lng: locations[0].lng }
    : { lat: 28.6139, lng: 77.2090 };

  return (
    <main className="flex-1 relative">
      <Map
        onClick={(e) => onMapClick && onMapClick(e.detail.latLng)}
        defaultCenter={center}
        defaultZoom={11}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        mapId="ROUTE_AI_MAP_ID"
        className="w-full h-full"
      >
        <TrafficLayerComponent />
        <DirectionsRendererComponent locations={locations} prediction={prediction} />

        {locations.map((loc, idx) => (
          <AdvancedMarker 
            key={`${loc.name}-${idx}`} 
            position={{ lat: loc.lat, lng: loc.lng }}
            ref={marker => setMarkerRef(marker, `${loc.name}-${idx}`)}
            onClick={() => setSelectedLocation({ ...loc, index: idx + 1 })}
          >
            <div className="bg-blue-600 hover:bg-emerald-500 transition-colors text-white w-8 h-8 rounded-full shadow-lg border-2 border-white flex items-center justify-center font-bold text-xs transform -translate-y-1/2 cursor-pointer">
              {idx + 1}
            </div>
          </AdvancedMarker>
        ))}

        {selectedLocation && (
          <InfoWindow
            position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
            onCloseClick={() => setSelectedLocation(null)}
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="font-bold text-slate-800 mb-1">Stop {selectedLocation.index}</h3>
              <p className="text-sm font-medium text-slate-600 truncate">{selectedLocation.name}</p>
              <div className="mt-3 flex gap-2">
                <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-semibold">Priority: High</span>
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>

      {/* Floating Top Bar overlay */}
      <div className="absolute top-6 left-6 right-6 flex justify-between pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-slate-200/50 pointer-events-auto flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="font-semibold text-slate-700 text-sm">System Online - Live Traffic Active</span>
        </div>
      </div>
    </main>
  );
}

export default GoogleMapContainer;
