from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from database.config import get_db
import datetime

router = APIRouter()

class Point(BaseModel):
    lat: float
    lng: float

class GeofenceBase(BaseModel):
    name: str
    polygon: List[Point]
    assigned_driver_id: str = None
    color: str = "#FF0000"

class GeofenceCreate(GeofenceBase):
    pass

class GeofenceResponse(GeofenceBase):
    id: str

def format_doc(doc):
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc

@router.post("/", response_model=GeofenceResponse)
async def create_geofence(geofence: GeofenceCreate, db=Depends(get_db)):
    geofence_dict = geofence.model_dump()
    geofence_dict["created_at"] = datetime.datetime.utcnow().isoformat()
    result = await db.geofences.insert_one(geofence_dict)
    
    new_fence = await db.geofences.find_one({"_id": result.inserted_id})
    return format_doc(new_fence)

@router.get("/", response_model=List[GeofenceResponse])
async def get_geofences(db=Depends(get_db)):
    fences = await db.geofences.find().to_list(100)
    return [format_doc(f) for f in fences]

class LocationCheck(BaseModel):
    driver_id: str
    lat: float
    lng: float

@router.post("/check")
async def check_location(check: LocationCheck, db=Depends(get_db)):
    """
    Checks if a driver's current location is inside or outside their assigned geofence.
    Basic implementation: uses ray-casting algorithm to determine point in polygon.
    """
    # 1. Fetch assigned geofences for this driver
    driver_fences = await db.geofences.find({"assigned_driver_id": check.driver_id}).to_list(10)
    
    alerts = []
    
    # Simple point-in-polygon (ray casting)
    def is_point_in_polygon(x, y, poly):
        n = len(poly)
        inside = False
        p1x, p1y = poly[0]["lat"], poly[0]["lng"]
        for i in range(1, n + 1):
            p2x, p2y = poly[i % n]["lat"], poly[i % n]["lng"]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y
        return inside

    for fence in driver_fences:
        inside = is_point_in_polygon(check.lat, check.lng, fence["polygon"])
        if not inside:
            alerts.append({
                "type": "GEOFENCE_BREACH",
                "driver_id": check.driver_id,
                "fence_name": fence["name"],
                "message": f"Driver {check.driver_id} is outside the assigned zone: {fence['name']}",
                "timestamp": datetime.datetime.utcnow().isoformat()
            })
            
    # Save alerts to database
    if alerts:
        await db.alerts.insert_many(alerts)
        
    return {"status": "ok", "inside_zones": len(driver_fences) - len(alerts), "alerts": alerts}
