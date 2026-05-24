import numpy as np
from datetime import datetime
from backend.database.config import get_db

class DriverAssignmentEngine:
    def __init__(self):
        pass

    async def _get_available_drivers(self, shift_time: str = None):
        """Fetch active drivers from the database."""
        db_instance = get_db()
        # Simple heuristic: filter by shift_time if provided, else all drivers
        drivers = await db_instance.drivers.find().to_list(1000)
        if shift_time:
            # Assuming working_hours like "08:00-16:00"
            pass # Shift filtering logic could be added here
        return drivers

    def _calculate_score(self, driver, route_distance, route_weight_capacity):
        """Calculate a matching score for a driver to a given route. Higher is better."""
        score = 0.0
        
        # 1. Capacity Match
        if driver.get("capacity", 0) >= route_weight_capacity:
            score += 30.0
        else:
            return -1  # Cannot assign, capacity too low
            
        # 2. Performance Score
        perf = driver.get("performance_score", 80)
        score += (perf / 100.0) * 20.0
        
        # 3. Fuel Efficiency
        # Lower fuel consumption per km is better. Let's assume higher is better MPG or km/L.
        fuel_eff = driver.get("fuel_efficiency", 10.0)
        score += min(fuel_eff, 20.0) # max 20 points
        
        # 4. Route Familiarity (Simulated)
        # In a real system, you'd check historical routes
        familiarity = np.random.choice([0, 5, 10, 15], p=[0.2, 0.4, 0.3, 0.1])
        score += familiarity
        
        return score

    async def assign_driver_to_route(self, route_details: dict):
        """
        route_details expects:
        - distance: float (km)
        - capacity_required: int
        - time_window: str
        """
        drivers = await self._get_available_drivers()
        
        if not drivers:
            return None

        best_driver = None
        best_score = -1

        for d in drivers:
            score = self._calculate_score(
                d, 
                route_details.get("distance", 0), 
                route_details.get("capacity_required", 0)
            )
            
            if score > best_score:
                best_score = score
                best_driver = d

        if best_driver:
            best_driver["_id"] = str(best_driver["_id"])
            return {
                "assigned_driver": best_driver,
                "match_score": round(best_score, 2),
                "reason": f"Optimal match based on capacity, performance ({best_driver.get('performance_score')}), and fuel efficiency."
            }
        
        return None

