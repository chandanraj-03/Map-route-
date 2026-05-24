from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from backend.services.prediction_service import PredictionService
from backend.services.assignment_engine import DriverAssignmentEngine
from backend.services.multi_driver_optimizer import MultiDriverOptimizer
from backend.database.config import get_db

router = APIRouter()
prediction_service = PredictionService()

class LocationRequest(BaseModel):
    name: str
    lat: float
    lng: float

class DailyPredictionRequest(BaseModel):
    driver_id: str
    date: str
    locations: List[LocationRequest]
    constraints: dict = None

@router.post("/daily")
async def predict_daily(request: DailyPredictionRequest, db=Depends(get_db)):
    locations_dict = [{"name": loc.name, "lat": loc.lat, "lng": loc.lng} for loc in request.locations]
    
    # Run the ML Prediction
    result = prediction_service.predict_daily_route(
        request.driver_id, 
        request.date, 
        locations_dict, 
        request.constraints
    )
    
    # Save the route to MongoDB
    route_doc = {
        "driver_id": request.driver_id,
        "date": request.date,
        "input_locations": locations_dict,
        "constraints": request.constraints,
        "optimized_path": result.get("optimized_path", []),
        "total_duration": result.get("total_duration", 0),
        "total_distance": result.get("total_distance", 0)
    }
    await db.routes.insert_one(route_doc)
    
    return result

class FleetPredictionRequest(BaseModel):
    date: str
    driver_ids: List[str]
    locations: List[LocationRequest]
    constraints: Optional[dict] = None

@router.post("/fleet")
async def predict_fleet(request: FleetPredictionRequest, db=Depends(get_db)):
    # Fetch drivers from database
    drivers = await db.drivers.find({"driver_id": {"$in": request.driver_ids}}).to_list(100)
    
    if not drivers:
        drivers = [
            {"driver_id": "D1", "full_name": "John Doe (Expert)", "vehicle_type": "Van", "capacity": 1000, "fuel_efficiency": 12.5},
            {"driver_id": "D2", "full_name": "Jane Smith", "vehicle_type": "Truck", "capacity": 2500, "fuel_efficiency": 8.0}
        ]
        
    locations_dict = [{"name": loc.name, "lat": loc.lat, "lng": loc.lng} for loc in request.locations]
    
    optimizer = MultiDriverOptimizer()
    result = optimizer.optimize_fleet(drivers, request.date, locations_dict, request.constraints)
    
    # Save the fleet route to MongoDB
    route_doc = {
        "type": "fleet_optimization",
        "date": request.date,
        "input_locations": locations_dict,
        "drivers_used": request.driver_ids,
        "total_distance": result.get("total_fleet_distance", 0),
        "total_duration": result.get("total_fleet_duration", 0),
        "fleet_routes": result.get("fleet_routes", [])
    }
    await db.routes.insert_one(route_doc)
    
    return result

class AutoAssignRequest(BaseModel):
    date: str
    locations: List[LocationRequest]
    constraints: Optional[dict] = None

@router.post("/auto-assign")
async def predict_auto_assign(request: AutoAssignRequest, db=Depends(get_db)):
    engine = DriverAssignmentEngine()
    
    locations_dict = [{"name": loc.name, "lat": loc.lat, "lng": loc.lng} for loc in request.locations]
    
    # Estimate requirements (mock logic based on store count)
    estimated_distance = len(request.locations) * 12.5 # ~12.5km per stop
    required_capacity = len(request.locations) * 150   # ~150kg per store
    
    route_details = {
        "distance": estimated_distance,
        "capacity_required": required_capacity,
        "time_window": "09:00-17:00"
    }
    
    assignment_result = await engine.assign_driver_to_route(route_details)
    
    if not assignment_result or not assignment_result.get("assigned_driver"):
        return {"error": "No eligible driver available with sufficient capacity."}
        
    assigned_driver = assignment_result["assigned_driver"]
    driver_id = assigned_driver.get("driver_id")
    
    # Run the ML Prediction with the selected driver
    result = prediction_service.predict_daily_route(
        driver_id, 
        request.date, 
        locations_dict, 
        request.constraints
    )
    
    # Add assignment info to the result
    result["assignment"] = {
        "driver": assigned_driver,
        "match_score": assignment_result["match_score"],
        "reason": assignment_result["reason"]
    }
    
    # Save the route to MongoDB
    route_doc = {
        "driver_id": driver_id,
        "date": request.date,
        "input_locations": locations_dict,
        "constraints": request.constraints,
        "optimized_path": result.get("optimized_path", []),
        "total_duration": result.get("total_duration", 0),
        "total_distance": result.get("total_distance", 0),
        "ai_assigned": True,
        "assignment_score": assignment_result["match_score"]
    }
    await db.routes.insert_one(route_doc)
    
    return result

@router.post("/weekly")
def predict_weekly():
    return {"message": "Weekly prediction endpoint"}
