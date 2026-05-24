from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from database.config import get_db
from ml.cluster_model import StoreClusteringModel
from services.google_maps import GoogleMapsService
import os

router = APIRouter()

# Initialize clustering model
clustering_model = StoreClusteringModel()
model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models', 'saved', 'kmeans.pkl')
if os.path.exists(model_path):
    clustering_model.load_model(model_path)

class StoreBase(BaseModel):
    store_id: str
    store_name: str
    address: str
    latitude: float
    longitude: float
    place_id: Optional[str] = None
    delivery_window: str
    average_unload_time: int
    priority_level: int

class StoreCreate(StoreBase):
    pass

class StoreUpdate(BaseModel):
    store_name: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    place_id: Optional[str] = None
    delivery_window: Optional[str] = None
    average_unload_time: Optional[int] = None
    priority_level: Optional[int] = None

class StoreResponse(StoreBase):
    id: str = Field(alias="_id")
    
    class Config:
        populate_by_name = True

def format_store(store_doc):
    if not store_doc:
        return None
    store_doc["_id"] = str(store_doc["_id"])
    return store_doc

@router.post("/", response_model=StoreResponse)
async def create_store(store: StoreCreate, db=Depends(get_db)):
    existing_store = await db.stores.find_one({"store_id": store.store_id})
    if existing_store:
        raise HTTPException(status_code=400, detail="Store ID already exists")
    
    store_dict = store.model_dump()
    result = await db.stores.insert_one(store_dict)
    
    new_store = await db.stores.find_one({"_id": result.inserted_id})
    return format_store(new_store)

@router.get("/", response_model=List[StoreResponse])
async def get_stores(db=Depends(get_db)):
    stores = await db.stores.find().to_list(1000)
    return [format_store(s) for s in stores]

@router.get("/clustered")
async def get_clustered_stores(db=Depends(get_db)):
    stores = await db.stores.find().to_list(1000)
    clustered_data = {}
    
    for s in stores:
        try:
            cluster_id = int(clustering_model.predict(s["latitude"], s["longitude"]))
        except Exception:
            cluster_id = 0 # Default if model is not trained/fails
            
        if cluster_id not in clustered_data:
            clustered_data[cluster_id] = []
            
        formatted_store = format_store(s)
        clustered_data[cluster_id].append(formatted_store)
        
    return clustered_data

@router.put("/{store_id}", response_model=StoreResponse)
async def update_store(store_id: str, store_update: StoreUpdate, db=Depends(get_db)):
    update_data = {k: v for k, v in store_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    result = await db.stores.update_one({"store_id": store_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Store not found")
        
    updated_store = await db.stores.find_one({"store_id": store_id})
    return format_store(updated_store)

@router.delete("/{store_id}")
async def delete_store(store_id: str, db=Depends(get_db)):
    result = await db.stores.delete_one({"store_id": store_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Store not found")
    return {"message": "Store deleted successfully"}


# ─────────────────────────────────────────────
# Google Places API Integration
# ─────────────────────────────────────────────
gmaps = GoogleMapsService()


@router.get("/{store_id}/enrich")
async def enrich_store_with_places(store_id: str, db=Depends(get_db)):
    """
    Enriches a store record with live data from the Google Places API.
    Uses Nearby Search to find matching businesses, then fetches Place Details
    (name, rating, opening hours, business status).
    Updates the store document in MongoDB with the enriched data.
    """
    store = await db.stores.find_one({"store_id": store_id})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    lat = store.get("latitude", 23.02)
    lng = store.get("longitude", 72.57)

    # Step 1: Google Places Nearby Search
    nearby_result = gmaps.get_nearby_places(lat, lng, radius=500, place_type="store")
    nearby_places = nearby_result.get("results", [])

    enriched_data = {
        "google_places_enriched": True,
        "nearby_store_count": len(nearby_places)
    }

    # Step 2: If we have a place_id, fetch detailed info
    place_id = store.get("place_id")
    if not place_id and nearby_places:
        place_id = nearby_places[0].get("place_id")

    if place_id:
        details = gmaps.get_place_details(place_id)
        if details.get("status") == "OK":
            result = details.get("result", {})
            enriched_data.update({
                "google_place_id": place_id,
                "google_name": result.get("name", store.get("store_name")),
                "google_address": result.get("formatted_address", store.get("address")),
                "google_rating": result.get("rating"),
                "google_open_now": result.get("opening_hours", {}).get("open_now"),
                "google_business_status": result.get("business_status")
            })

    # Update store in MongoDB
    await db.stores.update_one(
        {"store_id": store_id},
        {"$set": enriched_data}
    )

    updated_store = await db.stores.find_one({"store_id": store_id})
    return format_store(updated_store)


class GeocodeRequest(BaseModel):
    address: str


@router.post("/geocode")
async def geocode_address(request: GeocodeRequest):
    """
    Converts a human-readable address into latitude/longitude coordinates
    using the Google Maps Geocoding API.
    """
    result = gmaps.geocode_address(request.address)
    if not result:
        raise HTTPException(status_code=400, detail="Could not geocode address")
    return result


@router.get("/{store_id}/nearby-places")
async def get_nearby_places_for_store(
    store_id: str,
    radius: int = 1000,
    place_type: str = "store",
    db=Depends(get_db)
):
    """
    Fetches nearby places (businesses, stores) around a given store's location
    using the Google Places Nearby Search API.
    Useful for understanding store density and competition in an area.
    """
    store = await db.stores.find_one({"store_id": store_id})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    lat = store.get("latitude", 23.02)
    lng = store.get("longitude", 72.57)

    nearby = gmaps.get_nearby_places(lat, lng, radius=radius, place_type=place_type)

    places = []
    for p in nearby.get("results", []):
        loc = p.get("geometry", {}).get("location", {})
        places.append({
            "name": p.get("name"),
            "place_id": p.get("place_id"),
            "lat": loc.get("lat"),
            "lng": loc.get("lng"),
            "rating": p.get("rating"),
            "business_status": p.get("business_status")
        })

    return {
        "store_id": store_id,
        "center": {"lat": lat, "lng": lng},
        "radius_m": radius,
        "nearby_places": places,
        "count": len(places)
    }
