import numpy as np
import math

class HeuristicOptimizer:
    def __init__(self):
        pass
        
    def haversine(self, lat1, lon1, lat2, lon2):
        """Calculate the great circle distance between two points."""
        R = 6371.0 # Earth radius in km
        dLat = math.radians(lat2 - lat1)
        dLon = math.radians(lon2 - lon1)
        a = math.sin(dLat / 2)**2 + math.cos(math.radians(lat1)) * \
            math.cos(math.radians(lat2)) * math.sin(dLon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = R * c
        return distance

    def optimize_route_nearest_neighbor(self, locations):
        """
        Sorts a list of locations using nearest neighbor approach.
        locations format: [{'name': 'Store A', 'lat': 28.6, 'lng': 77.2}, ...]
        Returns sorted list.
        """
        if not locations or len(locations) <= 1:
            return locations

        unvisited = locations.copy()
        # Start with the first location given (assuming it's start or depot)
        current = unvisited.pop(0)
        route = [current]

        while unvisited:
            # Find nearest
            nearest = min(
                unvisited, 
                key=lambda x: self.haversine(current['lat'], current['lng'], x['lat'], x['lng'])
            )
            route.append(nearest)
            unvisited.remove(nearest)
            current = nearest

        return route
