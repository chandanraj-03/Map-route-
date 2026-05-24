from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from database.config import get_db
from bson import ObjectId

router = APIRouter()

class DriverBase(BaseModel):
    driver_id: str
    full_name: str
    phone: str
    vehicle_type: str
    capacity: int
    average_speed: float
    fuel_efficiency: float
    working_hours: str
    performance_score: float = 100.0

class DriverCreate(DriverBase):
    pass

class DriverUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    vehicle_type: Optional[str] = None
    capacity: Optional[int] = None
    average_speed: Optional[float] = None
    fuel_efficiency: Optional[float] = None
    working_hours: Optional[str] = None
    performance_score: Optional[float] = None

class DriverResponse(DriverBase):
    id: str = Field(alias="_id")
    
    class Config:
        populate_by_name = True

def format_driver(driver_doc):
    if not driver_doc:
        return None
    driver_doc["_id"] = str(driver_doc["_id"])
    return driver_doc

@router.post("/", response_model=DriverResponse)
async def create_driver(driver: DriverCreate, db=Depends(get_db)):
    existing_driver = await db.drivers.find_one({"driver_id": driver.driver_id})
    if existing_driver:
        raise HTTPException(status_code=400, detail="Driver ID already exists")
    
    driver_dict = driver.model_dump()
    result = await db.drivers.insert_one(driver_dict)
    
    new_driver = await db.drivers.find_one({"_id": result.inserted_id})
    return format_driver(new_driver)

@router.get("/", response_model=List[DriverResponse])
async def get_drivers(db=Depends(get_db)):
    drivers = await db.drivers.find().to_list(1000)
    return [format_driver(d) for d in drivers]

@router.put("/{driver_id}", response_model=DriverResponse)
async def update_driver(driver_id: str, driver_update: DriverUpdate, db=Depends(get_db)):
    update_data = {k: v for k, v in driver_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    result = await db.drivers.update_one({"driver_id": driver_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    updated_driver = await db.drivers.find_one({"driver_id": driver_id})
    return format_driver(updated_driver)

@router.delete("/{driver_id}")
async def delete_driver(driver_id: str, db=Depends(get_db)):
    result = await db.drivers.delete_one({"driver_id": driver_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Driver not found")
    return {"message": "Driver deleted successfully"}
