from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict
from services.prediction_service import PredictionService
from services.assignment_engine import DriverAssignmentEngine
from services.multi_driver_optimizer import MultiDriverOptimizer
from database.config import get_db
from datetime import datetime, timedelta
import math

router = APIRouter()
prediction_service = PredictionService()


# ─────────────────────────────────────────────
# Pydantic Models
# ─────────────────────────────────────────────
class LocationRequest(BaseModel):
    name: str
    lat: float
    lng: float


class DailyPredictionRequest(BaseModel):
    driver_id: str
    date: str
    locations: List[LocationRequest]
    constraints: dict = None


class WeeklyPredictionRequest(BaseModel):
    """
    Weekly route prediction input.
    Provide either a week string (e.g. '2026-W20') or an explicit start_date.
    Locations are the full pool of stores to be distributed across the week.
    """
    driver_id: str
    week: Optional[str] = None           # ISO week format: "2026-W20"
    start_date: Optional[str] = None     # Alternative: explicit Monday date "2026-05-18"
    locations: Optional[List[LocationRequest]] = None   # Pool of stores for the week
    constraints: Optional[dict] = None


class FleetPredictionRequest(BaseModel):
    date: str
    driver_ids: List[str]
    locations: List[LocationRequest]
    constraints: Optional[dict] = None


class AutoAssignRequest(BaseModel):
    date: str
    locations: List[LocationRequest]
    constraints: Optional[dict] = None


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────
WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _parse_week(week_str: str):
    """Parse ISO week string '2026-W20' → Monday datetime."""
    try:
        year, week_num = week_str.split("-W")
        # Monday of that ISO week
        jan4 = datetime(int(year), 1, 4)
        start_of_week = jan4 + timedelta(weeks=int(week_num) - 1)
        # Roll back to Monday
        start_of_week -= timedelta(days=start_of_week.weekday())
        return start_of_week
    except Exception:
        return datetime.now() - timedelta(days=datetime.now().weekday())


def _distribute_locations(locations: list, num_days: int) -> List[List]:
    """
    Distributes a pool of locations evenly across working days.
    Uses a round-robin strategy so each day gets a balanced workload.
    """
    if not locations:
        return [[] for _ in range(num_days)]

    buckets = [[] for _ in range(num_days)]
    for i, loc in enumerate(locations):
        buckets[i % num_days].append(loc)
    return buckets


# ─────────────────────────────────────────────
# POST /predict/daily
# ─────────────────────────────────────────────
@router.post("/daily")
async def predict_daily(request: DailyPredictionRequest, db=Depends(get_db)):
    """
    Predict the optimized daily route for a single driver.
    Uses RF + XGBoost + OSRM + Google Maps ensemble.
    Also returns LSTM next-stop suggestion if model is trained.
    """
    locations_dict = [{"name": loc.name, "lat": loc.lat, "lng": loc.lng} for loc in request.locations]

    result = prediction_service.predict_daily_route(
        request.driver_id,
        request.date,
        locations_dict,
        request.constraints
    )

    # Persist to MongoDB
    route_doc = {
        "driver_id": request.driver_id,
        "date": request.date,
        "input_locations": locations_dict,
        "constraints": request.constraints,
        "optimized_path": result.get("recommended_route", []),
        "total_duration": result.get("predicted_time", "0 hours"),
        "total_distance": result.get("total_distance", "0 km"),
        "confidence": result.get("confidence", 0),
        "efficiency_score": result.get("efficiency_score", 0),
        "lstm_next_stop": result.get("ml_models_used", {}).get("lstm_next_stop_suggestion")
    }
    await db.routes.insert_one(route_doc)

    return result


# ─────────────────────────────────────────────
# POST /predict/weekly
# ─────────────────────────────────────────────
@router.post("/weekly")
async def predict_weekly(request: WeeklyPredictionRequest, db=Depends(get_db)):
    """
    Predict the optimized weekly schedule for a driver.

    Input:
      - driver_id: "D1"
      - week: "2026-W20"  (or start_date: "2026-05-18")
      - locations: pool of all stores to visit during the week

    Output (assignment-spec format):
      {
        "driver_id": "D1",
        "week": "2026-W20",
        "monday":    [{"store": "Store_A", "lat": ..., "lng": ..., "eta": "09:30 AM"}],
        "tuesday":   [...],
        "wednesday": [...],
        "thursday":  [...],
        "friday":    [...],
        "weekly_distance": "230.5 km",
        "weekly_duration": "18.2 hours",
        "weekly_efficiency": 91.4,
        "weekly_confidence": 0.87,
        "lstm_weekly_insight": "LSTM suggests Store_L5 is frequently next after Store_L12 on Fridays."
      }
    """
    # ── Determine week start date ──
    if request.week:
        week_start = _parse_week(request.week)
        week_label = request.week
    elif request.start_date:
        week_start = datetime.strptime(request.start_date, "%Y-%m-%d")
        iso = week_start.isocalendar()
        week_label = f"{iso[0]}-W{iso[1]:02d}"
    else:
        week_start = datetime.now() - timedelta(days=datetime.now().weekday())
        iso = week_start.isocalendar()
        week_label = f"{iso[0]}-W{iso[1]:02d}"

    # ── Use provided locations or fetch driver's historical stores from DB ──
    if request.locations:
        location_pool = [{"name": loc.name, "lat": loc.lat, "lng": loc.lng} for loc in request.locations]
    else:
        # Look up driver's recent routes for their typical stores
        recent_routes = await db.routes.find(
            {"driver_id": request.driver_id}
        ).sort("_id", -1).limit(20).to_list(20)

        seen = set()
        location_pool = []
        for route in recent_routes:
            for stop in route.get("optimized_path", []):
                key = stop.get("store", "")
                if key and key not in seen:
                    seen.add(key)
                    location_pool.append({
                        "name": stop.get("store", "Unknown"),
                        "lat": stop.get("lat", 23.02),
                        "lng": stop.get("lng", 72.57)
                    })

        # Fallback: generate sample store pool if no history
        if not location_pool:
            location_pool = [
                {"name": f"Store_{i}", "lat": 23.02 + (i * 0.01), "lng": 72.57 + (i * 0.01)}
                for i in range(1, 11)
            ]

    # ── Distribute locations across working days (Mon–Fri = 5 days) ──
    num_working_days = 5
    daily_buckets = _distribute_locations(location_pool, num_working_days)

    # ── Run daily predictions for each day ──
    weekly_result = {}
    total_distance_km = 0.0
    total_duration_mins = 0.0
    total_efficiency = 0.0
    total_confidence = 0.0
    active_days = 0
    lstm_insights = []

    for day_idx in range(num_working_days):
        day_name = WEEKDAYS[day_idx].lower()
        day_date = (week_start + timedelta(days=day_idx)).strftime("%Y-%m-%d")
        day_locations = daily_buckets[day_idx]

        if not day_locations:
            weekly_result[day_name] = []
            continue

        try:
            day_result = prediction_service.predict_daily_route(
                driver_id=request.driver_id,
                date=day_date,
                locations=day_locations,
                constraints=request.constraints
            )

            weekly_result[day_name] = day_result.get("recommended_route", [])

            # Accumulate weekly metrics
            dist_str = day_result.get("total_distance", "0 km")
            dist_km = float(dist_str.replace(" km", "").strip()) if " km" in dist_str else 0.0

            time_str = day_result.get("predicted_time", "0 hours")
            time_hrs = float(time_str.replace(" hours", "").strip()) if " hours" in time_str else 0.0

            total_distance_km += dist_km
            total_duration_mins += time_hrs * 60.0
            total_efficiency += day_result.get("efficiency_score", 90.0)
            total_confidence += day_result.get("confidence", 0.88)
            active_days += 1

            # Collect LSTM insights
            lstm_next = day_result.get("ml_models_used", {}).get("lstm_next_stop_suggestion")
            if lstm_next:
                lstm_insights.append(
                    f"{WEEKDAYS[day_idx]}: LSTM suggests {lstm_next} as the next logical stop after the current sequence."
                )

            # Persist each day's route
            await db.routes.insert_one({
                "driver_id": request.driver_id,
                "date": day_date,
                "week": week_label,
                "day": WEEKDAYS[day_idx],
                "optimized_path": weekly_result[day_name],
                "total_distance": dist_str,
                "total_duration": time_str,
                "confidence": day_result.get("confidence", 0),
                "efficiency_score": day_result.get("efficiency_score", 0)
            })

        except Exception as e:
            print(f"[Weekly] Day {day_name} prediction failed: {e}")
            weekly_result[day_name] = []

    # ── Build response ──
    avg_efficiency = round(total_efficiency / active_days, 1) if active_days > 0 else 0.0
    avg_confidence = round(total_confidence / active_days, 2) if active_days > 0 else 0.0

    response = {
        "driver_id": request.driver_id,
        "week": week_label,
        **weekly_result,
        "weekly_distance": f"{round(total_distance_km, 1)} km",
        "weekly_duration": f"{round(total_duration_mins / 60.0, 1)} hours",
        "weekly_efficiency": avg_efficiency,
        "weekly_confidence": avg_confidence,
        "lstm_weekly_insight": lstm_insights if lstm_insights else
            "LSTM model not yet trained — run POST /retrain to enable sequence predictions."
    }

    return response


# ─────────────────────────────────────────────
# POST /predict/fleet
# ─────────────────────────────────────────────
@router.post("/fleet")
async def predict_fleet(request: FleetPredictionRequest, db=Depends(get_db)):
    """Optimize routes for an entire fleet using KMeans geographic partitioning."""
    drivers = await db.drivers.find({"driver_id": {"$in": request.driver_ids}}).to_list(100)

    if not drivers:
        drivers = [
            {"driver_id": "D1", "full_name": "John Doe (Expert)", "vehicle_type": "Van", "capacity": 1000, "fuel_efficiency": 12.5},
            {"driver_id": "D2", "full_name": "Jane Smith", "vehicle_type": "Truck", "capacity": 2500, "fuel_efficiency": 8.0}
        ]

    locations_dict = [{"name": loc.name, "lat": loc.lat, "lng": loc.lng} for loc in request.locations]

    optimizer = MultiDriverOptimizer()
    result = optimizer.optimize_fleet(drivers, request.date, locations_dict, request.constraints)

    await db.routes.insert_one({
        "type": "fleet_optimization",
        "date": request.date,
        "input_locations": locations_dict,
        "drivers_used": request.driver_ids,
        "total_distance": result.get("total_fleet_distance", 0),
        "total_duration": result.get("total_fleet_duration", 0),
        "fleet_routes": result.get("fleet_routes", [])
    })

    return result


# ─────────────────────────────────────────────
# POST /predict/auto-assign
# ─────────────────────────────────────────────
@router.post("/auto-assign")
async def predict_auto_assign(request: AutoAssignRequest, db=Depends(get_db)):
    """Auto-select the best driver for a route based on capacity and availability."""
    engine = DriverAssignmentEngine()
    locations_dict = [{"name": loc.name, "lat": loc.lat, "lng": loc.lng} for loc in request.locations]

    estimated_distance = len(request.locations) * 12.5
    required_capacity = len(request.locations) * 150

    route_details = {
        "distance": estimated_distance,
        "capacity_required": required_capacity,
        "time_window": "09:00-17:00"
    }

    assignment_result = await engine.assign_driver_to_route(route_details)

    if not assignment_result or not assignment_result.get("assigned_driver"):
        return {"error": "No eligible driver available with sufficient capacity."}

    assigned_driver = assignment_result["assigned_driver"]
    driver_id = assigned_driver.get("driver_id")

    result = prediction_service.predict_daily_route(
        driver_id, request.date, locations_dict, request.constraints
    )

    result["assignment"] = {
        "driver": assigned_driver,
        "match_score": assignment_result["match_score"],
        "reason": assignment_result["reason"]
    }

    await db.routes.insert_one({
        "driver_id": driver_id,
        "date": request.date,
        "input_locations": locations_dict,
        "constraints": request.constraints,
        "optimized_path": result.get("recommended_route", []),
        "total_duration": result.get("predicted_time", "0 hours"),
        "total_distance": result.get("total_distance", "0 km"),
        "ai_assigned": True,
        "assignment_score": assignment_result["match_score"]
    })

    return result
