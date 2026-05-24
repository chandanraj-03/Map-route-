from fastapi import APIRouter, Depends
from database.config import get_db

router = APIRouter()

@router.get("/models")
async def get_model_metrics(db=Depends(get_db)):
    # Mocking data for the Model Monitoring Dashboard
    # In a real app, this would fetch the latest evaluation scores from the `model_metrics` collection
    return {
        "random_forest": {
            "accuracy": 0.89,
            "mse": 0.05,
            "drift_score": 0.02
        },
        "xgboost": {
            "accuracy": 0.92,
            "mse": 0.03,
            "drift_score": 0.01
        },
        "lstm": {
            "accuracy": 0.85,
            "mse": 0.08,
            "drift_score": 0.05
        },
        "history": [
            {"date": "2026-05-18", "rf_acc": 0.88, "xgb_acc": 0.90, "lstm_acc": 0.83},
            {"date": "2026-05-19", "rf_acc": 0.89, "xgb_acc": 0.91, "lstm_acc": 0.84},
            {"date": "2026-05-20", "rf_acc": 0.89, "xgb_acc": 0.91, "lstm_acc": 0.84},
            {"date": "2026-05-21", "rf_acc": 0.89, "xgb_acc": 0.92, "lstm_acc": 0.85},
            {"date": "2026-05-22", "rf_acc": 0.88, "xgb_acc": 0.91, "lstm_acc": 0.85},
            {"date": "2026-05-23", "rf_acc": 0.89, "xgb_acc": 0.92, "lstm_acc": 0.85}
        ]
    }
