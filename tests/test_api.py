import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


# ─────────────────────────────────────────────
# Health Check
# ─────────────────────────────────────────────
def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


# ─────────────────────────────────────────────
# POST /predict/daily
# ─────────────────────────────────────────────
def test_daily_prediction_basic():
    """Test daily prediction returns required fields."""
    payload = {
        "driver_id": "D1",
        "date": "2026-10-15",
        "locations": [
            {"name": "Store_A", "lat": 23.02, "lng": 72.57},
            {"name": "Store_B", "lat": 23.10, "lng": 72.50},
            {"name": "Store_C", "lat": 22.95, "lng": 72.60}
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
    assert len(data["recommended_route"]) == 3


def test_daily_prediction_with_constraints():
    """Test that constraints are accepted and affect the prediction."""
    payload = {
        "driver_id": "D2",
        "date": "2026-10-16",
        "locations": [
            {"name": "Store_X", "lat": 23.04, "lng": 72.60},
            {"name": "Store_Y", "lat": 23.08, "lng": 72.55}
        ],
        "constraints": {
            "traffic_congestion": "High",
            "road_condition": "Construction",
            "driver_fatigue": "Low",
            "driver_familiarity": "High"
        }
    }
    response = client.post("/predict/daily", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["confidence"] < 0.95  # High traffic should reduce confidence
    assert "execution_logs" in data
    assert len(data["execution_logs"]) > 0


def test_daily_prediction_returns_ml_model_info():
    """Test that ML model usage metadata is returned."""
    payload = {
        "driver_id": "D3",
        "date": "2026-10-17",
        "locations": [
            {"name": "Store_1", "lat": 23.02, "lng": 72.57},
            {"name": "Store_2", "lat": 23.05, "lng": 72.62}
        ]
    }
    response = client.post("/predict/daily", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "ml_models_used" in data
    assert "random_forest" in data["ml_models_used"]
    assert "xgboost" in data["ml_models_used"]
    assert "lstm" in data["ml_models_used"]


# ─────────────────────────────────────────────
# POST /predict/weekly
# ─────────────────────────────────────────────
def test_weekly_prediction_with_week_string():
    """Test weekly prediction returns a day-by-day schedule."""
    payload = {
        "driver_id": "D1",
        "week": "2026-W20",
        "locations": [
            {"name": f"Store_{i}", "lat": 23.02 + i * 0.01, "lng": 72.57 + i * 0.01}
            for i in range(10)
        ]
    }
    response = client.post("/predict/weekly", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert "monday" in data
    assert "tuesday" in data
    assert "wednesday" in data
    assert "thursday" in data
    assert "friday" in data
    assert "weekly_distance" in data
    assert "weekly_duration" in data
    assert "km" in data["weekly_distance"]


def test_weekly_prediction_with_start_date():
    """Test weekly prediction using explicit start_date."""
    payload = {
        "driver_id": "D2",
        "start_date": "2026-05-18",
        "locations": [
            {"name": "Store_A", "lat": 23.02, "lng": 72.57},
            {"name": "Store_B", "lat": 23.10, "lng": 72.50},
            {"name": "Store_C", "lat": 22.95, "lng": 72.60},
            {"name": "Store_D", "lat": 23.07, "lng": 72.65},
            {"name": "Store_E", "lat": 22.90, "lng": 72.55}
        ]
    }
    response = client.post("/predict/weekly", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["driver_id"] == "D2"
    assert "weekly_efficiency" in data
    assert "weekly_confidence" in data


# ─────────────────────────────────────────────
# POST /predict/fleet
# ─────────────────────────────────────────────
def test_fleet_prediction():
    """Test multi-driver fleet route optimization."""
    payload = {
        "date": "2026-10-18",
        "driver_ids": ["D1", "D2"],
        "locations": [
            {"name": f"Store_{i}", "lat": 23.02 + i * 0.02, "lng": 72.57 + i * 0.02}
            for i in range(6)
        ]
    }
    response = client.post("/predict/fleet", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert "fleet_routes" in data
    assert "total_fleet_distance" in data
    assert len(data["fleet_routes"]) > 0


# ─────────────────────────────────────────────
# POST /retrain
# ─────────────────────────────────────────────
def test_retrain_endpoint():
    """Test model retraining trigger."""
    response = client.post("/retrain")
    assert response.status_code == 200
    assert "message" in response.json()


# ─────────────────────────────────────────────
# GET /health
# ─────────────────────────────────────────────
def test_health_returns_correct_format():
    """Verify health check returns exact spec format."""
    response = client.get("/health")
    body = response.json()
    assert body.get("status") == "healthy"
    assert response.status_code == 200
