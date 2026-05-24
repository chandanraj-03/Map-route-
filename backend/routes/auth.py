from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from passlib.context import CryptContext
from backend.database.config import get_db

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserAuth(BaseModel):
    username: str
    password: str

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

@router.post("/register")
async def register(user: UserAuth, db=Depends(get_db)):
    collection = db.users
    existing_user = await collection.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = {
        "username": user.username,
        "password": hashed_password,
        "role": "admin"
    }
    await collection.insert_one(new_user)
    return {"message": "User created successfully"}

@router.post("/login")
async def login(user: UserAuth, db=Depends(get_db)):
    collection = db.users
    db_user = await collection.find_one({"username": user.username})
    
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # In a real app we'd return a JWT token. Returning simple token for now.
    return {
        "access_token": f"fake-jwt-token-{user.username}",
        "token_type": "bearer",
        "username": user.username
    }
