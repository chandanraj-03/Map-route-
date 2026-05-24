import numpy as np
from sklearn.cluster import KMeans
from backend.services.prediction_service import PredictionService

class MultiDriverOptimizer:
    def __init__(self):
        self.prediction_service = PredictionService()

    def optimize_fleet(self, drivers: list, date: str, locations: list, constraints: dict = None):
        """
        Partitions the locations among available drivers and calculates optimized routes for each.
        """
        if not drivers or not locations:
            return {"error": "Drivers and locations are required."}

        # 1. Cluster locations based on number of drivers available
        n_drivers = len(drivers)
        
        if len(locations) < n_drivers:
            # More drivers than locations, just assign first n drivers
            n_drivers = len(locations)
            drivers = drivers[:n_drivers]
            
        coords = np.array([[loc['lat'], loc['lng']] for loc in locations])
        
        # Using KMeans to partition locations geographically
        kmeans = KMeans(n_clusters=n_drivers, random_state=42, n_init=10)
        labels = kmeans.fit_predict(coords)
        
        # 2. Group locations by cluster
        clusters = {i: [] for i in range(n_drivers)}
        for idx, label in enumerate(labels):
            clusters[label].append(locations[idx])
            
        # 3. Assign clusters to drivers (could be enhanced by matching cluster center to driver's zone)
        fleet_routes = []
        total_distance = 0
        total_duration = 0
        
        for i, driver in enumerate(drivers):
            driver_locations = clusters[i]
            if not driver_locations:
                continue
                
            driver_id = driver.get("driver_id")
            
            # 4. Get optimized route for this specific driver and their assigned locations
            route_result = self.prediction_service.predict_daily_route(
                driver_id=driver_id,
                date=date,
                locations=driver_locations,
                constraints=constraints
            )
            
            # Incorporate cost tracking based on driver's fuel efficiency
            fuel_efficiency = driver.get("fuel_efficiency", 10.0) # km per liter
            fuel_cost_per_liter = 1.5 # Mock cost
            
            dist_km = route_result.get("total_distance", 0)
            est_fuel_cost = (dist_km / fuel_efficiency) * fuel_cost_per_liter if fuel_efficiency > 0 else 0
            
            route_result["estimated_fuel_cost"] = round(est_fuel_cost, 2)
            route_result["driver"] = driver
            
            fleet_routes.append(route_result)
            total_distance += dist_km
            total_duration += route_result.get("total_duration", 0)
            
        return {
            "date": date,
            "total_fleet_distance": round(total_distance, 2),
            "total_fleet_duration": round(total_duration, 2),
            "fleet_routes": fleet_routes
        }
