from fastapi import APIRouter, Depends
from typing import List, Optional
from backend.database.config import get_db

router = APIRouter()

def format_doc(doc):
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc

@router.get("/")
async def get_audit_logs(limit: int = 100, db=Depends(get_db)):
    logs = await db.audit_logs.find().sort("timestamp", -1).limit(limit).to_list(limit)
    return [format_doc(log) for log in logs]
