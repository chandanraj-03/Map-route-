from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import predict, auth, data, drivers, stores, audit, analytics, geofence
from workers.reporting import reporting_worker
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    reporting_worker.start()
    yield
    # Shutdown
    await reporting_worker.stop()

app = FastAPI(
    title="AI Route Optimization API",
    description="Backend for AI Route Optimization and Prediction Platform",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(data.router, prefix="/data", tags=["data"])
app.include_router(predict.router, prefix="/predict", tags=["prediction"])
app.include_router(drivers.router, prefix="/drivers", tags=["drivers"])
app.include_router(stores.router, prefix="/stores", tags=["stores"])
app.include_router(audit.router, prefix="/audit", tags=["audit"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(geofence.router, prefix="/geofence", tags=["geofence"])

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/retrain")
def retrain_models():
    # Trigger background tasks to retrain RF, XGBoost, LSTM and update clusters
    return {"message": "Model retraining triggered"}

