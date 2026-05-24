import React, { useState, useEffect } from 'react';
import { Polygon } from '@vis.gl/react-google-maps';
import axios from 'axios';

export default function GeofenceLayer() {
  const [geofences, setGeofences] = useState([]);

  useEffect(() => {
    const fetchGeofences = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/geofence/`);
        setGeofences(response.data);
      } catch (err) {
        console.error("Failed to fetch geofences", err);
      }
    };
    fetchGeofences();
  }, []);

  return (
    <>
      {geofences.map(fence => (
        <Polygon
          key={fence.id}
          paths={fence.polygon}
          options={{
            fillColor: fence.color || '#FF0000',
            fillOpacity: 0.2,
            strokeColor: fence.color || '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            clickable: true,
            editable: false,
          }}
          onClick={() => alert(`Geofence: ${fence.name}`)}
        />
      ))}
    </>
  );
}
