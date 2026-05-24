import os
import requests
from typing import List, Dict, Optional

class GoogleMapsService:
    """
    Google Maps Platform integration.
    Uses Distance Matrix API, Places API (Nearby Search, Place Details, Geocoding).
    Falls back to mock data gracefully if no API key is configured.
    """

    def __init__(self):
        self.api_key = os.getenv("GOOGLE_MAPS_API_KEY", "")
        self.base_url = "https://maps.googleapis.com/maps/api"
        self._has_key = bool(self.api_key and self.api_key not in ("", "your_google_maps_api_key_here", "your_google_maps_api_key"))

    # ─────────────────────────────────────────────
    # Distance Matrix API
    # ─────────────────────────────────────────────
    def get_distance_matrix(self, origins: List[Dict], destinations: List[Dict], mode: str = "driving") -> Dict:
        """
        Calls the Google Maps Distance Matrix API to get travel duration and distance
        between origin and destination points.

        Args:
            origins: list of dicts with 'lat' and 'lng'
            destinations: list of dicts with 'lat' and 'lng'
            mode: driving (default), walking, bicycling, transit

        Returns:
            Google Distance Matrix API response dict
        """
        if not self._has_key:
            return self._mock_distance_matrix(origins, destinations)

        try:
            origins_str = "|".join([f"{loc['lat']},{loc['lng']}" for loc in origins])
            dest_str = "|".join([f"{loc['lat']},{loc['lng']}" for loc in destinations])

            url = (
                f"{self.base_url}/distancematrix/json"
                f"?origins={origins_str}"
                f"&destinations={dest_str}"
                f"&mode={mode}"
                f"&departure_time=now"
                f"&traffic_model=best_guess"
                f"&key={self.api_key}"
            )
            response = requests.get(url, timeout=8)
            data = response.json()

            if data.get("status") == "OK":
                return data
            else:
                print(f"[GoogleMaps] Distance Matrix API error: {data.get('status')} — {data.get('error_message', '')}")
                return self._mock_distance_matrix(origins, destinations)

        except Exception as e:
            print(f"[GoogleMaps] Distance Matrix request failed: {e}")
            return self._mock_distance_matrix(origins, destinations)

    def get_directions(self, origin: Dict, destination: Dict, waypoints: Optional[List[Dict]] = None, mode: str = "driving") -> Dict:
        """
        Calls the Google Maps Directions API to get polyline and step-by-step directions.

        Args:
            origin: dict with 'lat' and 'lng'
            destination: dict with 'lat' and 'lng'
            waypoints: optional intermediate stops
            mode: driving (default)

        Returns:
            Directions API response dict
        """
        if not self._has_key:
            return self._mock_directions()

        try:
            origin_str = f"{origin['lat']},{origin['lng']}"
            dest_str = f"{destination['lat']},{destination['lng']}"

            url = (
                f"{self.base_url}/directions/json"
                f"?origin={origin_str}"
                f"&destination={dest_str}"
                f"&mode={mode}"
                f"&departure_time=now"
                f"&key={self.api_key}"
            )

            if waypoints:
                wp_str = "optimize:true|" + "|".join([f"{wp['lat']},{wp['lng']}" for wp in waypoints])
                url += f"&waypoints={wp_str}"

            response = requests.get(url, timeout=8)
            data = response.json()

            if data.get("status") == "OK":
                return data
            else:
                print(f"[GoogleMaps] Directions API error: {data.get('status')}")
                return self._mock_directions()

        except Exception as e:
            print(f"[GoogleMaps] Directions request failed: {e}")
            return self._mock_directions()

    # ─────────────────────────────────────────────
    # Places API — Nearby Search
    # ─────────────────────────────────────────────
    def get_nearby_places(self, lat: float, lng: float, radius: int = 1000, place_type: str = "store") -> Dict:
        """
        Calls the Google Places Nearby Search API to find places around a coordinate.

        Args:
            lat: latitude of center point
            lng: longitude of center point
            radius: search radius in meters (default 1000m)
            place_type: Google Place type (e.g. 'store', 'supermarket', 'establishment')

        Returns:
            Places API Nearby Search response dict
        """
        if not self._has_key:
            return self._mock_nearby_places(lat, lng)

        try:
            url = (
                f"{self.base_url}/place/nearbysearch/json"
                f"?location={lat},{lng}"
                f"&radius={radius}"
                f"&type={place_type}"
                f"&key={self.api_key}"
            )
            response = requests.get(url, timeout=8)
            data = response.json()

            if data.get("status") in ("OK", "ZERO_RESULTS"):
                return data
            else:
                print(f"[GoogleMaps] Nearby Places error: {data.get('status')} — {data.get('error_message', '')}")
                return self._mock_nearby_places(lat, lng)

        except Exception as e:
            print(f"[GoogleMaps] Nearby Places request failed: {e}")
            return self._mock_nearby_places(lat, lng)

    # ─────────────────────────────────────────────
    # Places API — Place Details
    # ─────────────────────────────────────────────
    def get_place_details(self, place_id: str) -> Dict:
        """
        Calls the Google Places Details API to enrich a location with metadata.

        Args:
            place_id: Google Maps Place ID

        Returns:
            Places Details API response dict
        """
        if not self._has_key or not place_id:
            return self._mock_place_details(place_id)

        try:
            fields = "name,formatted_address,geometry,rating,opening_hours,business_status"
            url = (
                f"{self.base_url}/place/details/json"
                f"?place_id={place_id}"
                f"&fields={fields}"
                f"&key={self.api_key}"
            )
            response = requests.get(url, timeout=8)
            data = response.json()

            if data.get("status") == "OK":
                return data
            else:
                print(f"[GoogleMaps] Place Details error: {data.get('status')}")
                return self._mock_place_details(place_id)

        except Exception as e:
            print(f"[GoogleMaps] Place Details request failed: {e}")
            return self._mock_place_details(place_id)

    # ─────────────────────────────────────────────
    # Geocoding API
    # ─────────────────────────────────────────────
    def geocode_address(self, address: str) -> Optional[Dict]:
        """
        Converts a human-readable address to lat/lng coordinates.

        Args:
            address: full address string

        Returns:
            dict with 'lat', 'lng', 'formatted_address', 'place_id' or None
        """
        if not self._has_key:
            return self._mock_geocode(address)

        try:
            url = (
                f"{self.base_url}/geocode/json"
                f"?address={requests.utils.quote(address)}"
                f"&key={self.api_key}"
            )
            response = requests.get(url, timeout=8)
            data = response.json()

            if data.get("status") == "OK" and data.get("results"):
                result = data["results"][0]
                location = result["geometry"]["location"]
                return {
                    "lat": location["lat"],
                    "lng": location["lng"],
                    "formatted_address": result.get("formatted_address", address),
                    "place_id": result.get("place_id", "")
                }
            else:
                print(f"[GoogleMaps] Geocode error: {data.get('status')}")
                return self._mock_geocode(address)

        except Exception as e:
            print(f"[GoogleMaps] Geocode request failed: {e}")
            return self._mock_geocode(address)

    def extract_traffic_duration(self, matrix_response: Dict, origin_idx: int = 0, dest_idx: int = 1) -> float:
        """
        Extracts duration_in_traffic (or fallback duration) in minutes from a
        Distance Matrix API response.
        """
        try:
            element = matrix_response["rows"][origin_idx]["elements"][dest_idx]
            if element.get("status") == "OK":
                # Prefer traffic-aware duration
                duration_sec = element.get("duration_in_traffic", element.get("duration", {})).get("value", 600)
                return round(duration_sec / 60.0, 1)
        except (KeyError, IndexError):
            pass
        return 10.0  # Fallback: 10 minutes

    def extract_distance_km(self, matrix_response: Dict, origin_idx: int = 0, dest_idx: int = 1) -> float:
        """
        Extracts distance in km from a Distance Matrix API response.
        """
        try:
            element = matrix_response["rows"][origin_idx]["elements"][dest_idx]
            if element.get("status") == "OK":
                distance_m = element.get("distance", {}).get("value", 5000)
                return round(distance_m / 1000.0, 2)
        except (KeyError, IndexError):
            pass
        return 5.0  # Fallback: 5 km

    # ─────────────────────────────────────────────
    # Mock fallbacks (used when no API key present)
    # ─────────────────────────────────────────────
    def _mock_distance_matrix(self, origins: List, destinations: List) -> Dict:
        """Returns a realistic mock distance matrix when API key is absent."""
        rows = []
        for _ in origins:
            elements = []
            for _ in destinations:
                elements.append({
                    "status": "OK",
                    "distance": {"value": 5000, "text": "5.0 km"},
                    "duration": {"value": 600, "text": "10 mins"},
                    "duration_in_traffic": {"value": 720, "text": "12 mins"}
                })
            rows.append({"elements": elements})
        return {"status": "OK", "rows": rows}

    def _mock_directions(self) -> Dict:
        """Returns a mock directions response when API key is absent."""
        return {
            "status": "OK",
            "routes": [{
                "overview_polyline": {"points": "mock_polyline_xyz"},
                "legs": [{
                    "distance": {"value": 5000, "text": "5 km"},
                    "duration": {"value": 600, "text": "10 mins"}
                }]
            }]
        }

    def _mock_nearby_places(self, lat: float, lng: float) -> Dict:
        """Returns mock nearby places when API key is absent."""
        return {
            "status": "OK",
            "results": [
                {
                    "name": f"Mock Store Near ({lat:.2f},{lng:.2f})",
                    "place_id": "mock_place_id_001",
                    "geometry": {"location": {"lat": lat + 0.001, "lng": lng + 0.001}},
                    "rating": 4.2,
                    "business_status": "OPERATIONAL"
                }
            ]
        }

    def _mock_place_details(self, place_id: str) -> Dict:
        """Returns mock place details when API key is absent."""
        return {
            "status": "OK",
            "result": {
                "name": "Mock Store",
                "place_id": place_id or "mock_place_id",
                "formatted_address": "123 Mock Street, City",
                "geometry": {"location": {"lat": 23.02, "lng": 72.57}},
                "rating": 4.0,
                "business_status": "OPERATIONAL",
                "opening_hours": {"open_now": True}
            }
        }

    def _mock_geocode(self, address: str) -> Dict:
        """Returns mock geocode result when API key is absent."""
        return {
            "lat": 23.0225,
            "lng": 72.5714,
            "formatted_address": address,
            "place_id": "mock_place_id_geocode"
        }
