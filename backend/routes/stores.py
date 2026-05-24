from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from backend.database.config import get_db
from backend.ml.cluster_model import StoreClusteringModel
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
