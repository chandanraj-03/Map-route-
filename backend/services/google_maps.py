import os
import requests
from typing import List, Dict

class GoogleMapsService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_MAPS_API_KEY", "")
        self.base_url = "https://maps.googleapis.com/maps/api"

    def get_distance_matrix(self, origins: List[Dict], destinations: List[Dict]):
        """Fetches distance and duration between points."""
        if not self.api_key or self.api_key == "your_google_maps_api_key_here":
            # Mock response if no key
            return self._mock_distance_matrix(origins, destinations)
            
        # Actual implementation would construct the URL and fetch
        # origins_str = "|".join([f"{loc['lat']},{loc['lng']}" for loc in origins])
        # dest_str = "|".join([f"{loc['lat']},{loc['lng']}" for loc in destinations])
        # url = f"{self.base_url}/distancematrix/json?origins={origins_str}&destinations={dest_str}&key={self.api_key}"
        # return requests.get(url).json()
        return self._mock_distance_matrix(origins, destinations)

    def get_directions(self, origin: Dict, destination: Dict, waypoints: List[Dict] = None):
        """Fetches directions and polyline."""
        if not self.api_key or self.api_key == "your_google_maps_api_key_here":
            return self._mock_directions()
            
        return self._mock_directions()

    def _mock_distance_matrix(self, origins, destinations):
        # Mock logic
        return {"status": "OK", "rows": [{"elements": [{"status": "OK", "distance": {"value": 5000, "text": "5 km"}, "duration": {"value": 600, "text": "10 mins"}}]}]}

    def _mock_directions(self):
        return {"status": "OK", "routes": [{"overview_polyline": {"points": "mock_polyline_xyz"}}]}
