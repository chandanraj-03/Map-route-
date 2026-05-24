import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_daily_prediction():
    payload = {
        "driver_id": "D1",
        "date": "2026-10-15",
        "locations": [
            {"name": "Start Location", "lat": 28.6, "lng": 77.2},
            {"name": "End Location", "lat": 28.7, "lng": 77.3}
        ]
    }
    response = client.post("/predict/daily", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "recommended_route" in data
    assert "predicted_time" in data
    assert "total_distance" in data
    assert "confidence" in data
    assert "efficiency_score" in data
    assert "encoded_polyline" in data
    
    # Assert route length
    assert len(data["recommended_route"]) == 2

def test_retrain_endpoint():
    response = client.post("/retrain")
    assert response.status_code == 200
    assert response.json() == {"message": "Model retraining triggered"}
