import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

class Database:
    client: AsyncIOMotorClient = None

db = Database()

def get_db():
    """Dependency to yield the MongoDB database instance."""
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/ai_route")
    
    if db.client is None:
        db.client = AsyncIOMotorClient(mongo_uri, tlsCAFile=certifi.where())
        
    return db.client.ai_route
