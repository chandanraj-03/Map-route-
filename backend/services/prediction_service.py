import os
import json
import hashlib
import numpy as np
import joblib
import pandas as pd
from services.google_maps import GoogleMapsService
from ml.rf_model import RFRoutePredictor
from ml.xgb_model import XGBRoutePredictor
from ml.lstm_model import RouteSequenceLSTM
from ml.optimizer import HeuristicOptimizer
from utils.redis_client import RedisClient

import requests
from datetime import datetime, timedelta

# Traffic category encoding (must match training LabelEncoder order: High=0, Low=1, Medium=2)
TRAFFIC_ENCODING = {"High": 0, "Low": 1, "Medium": 2}
# Region encoding (must match training: Central=0, East=1, North=2, South=3, West=4)
REGION_ENCODING = {"Central": 0, "East": 1, "North": 2, "South": 3, "West": 4}
# Day of week encoding (must match training: Friday=0, Monday=1, Saturday=2, Sunday=3, Thursday=4, Tuesday=5, Wednesday=6)
DAY_ENCODING = {"Friday": 0, "Monday": 1, "Saturday": 2, "Sunday": 3, "Thursday": 4, "Tuesday": 5, "Wednesday": 6}


class PredictionService:
    """
    Core AI prediction service.
    Orchestrates:
      1. Nearest-Neighbor route optimization (TSP heuristic)
      2. OSRM routing for real road geometry
      3. Google Maps Distance Matrix for traffic-aware duration
      4. Random Forest (multi-output) for travel time + efficiency
      5. XGBoost for high-accuracy ETA prediction
      6. LSTM for next-stop sequence suggestion
      7. Redis caching of full prediction results
    """

    def __init__(self):
        self.gmaps = GoogleMapsService()
        self.optimizer = HeuristicOptimizer()
        self.redis = RedisClient()

        models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models', 'saved')

        # Load RF model
        self.rf_model = RFRoutePredictor()
        rf_path = os.path.join(models_dir, 'rf.pkl')
        if os.path.exists(rf_path):
            self.rf_model.load_model(rf_path)
            self._rf_ready = True
        else:
            self._rf_ready = False

        # Load XGBoost model
        self.xgb_model = XGBRoutePredictor()
        xgb_path = os.path.join(models_dir, 'xgb.json')
        if os.path.exists(xgb_path):
            self.xgb_model.load_model(xgb_path)
            self._xgb_ready = True
        else:
            self._xgb_ready = False

        # Load LSTM model
        self.lstm_model = None
        self._lstm_ready = False
        lstm_path = os.path.join(models_dir, 'lstm.h5')
        if os.path.exists(lstm_path):
            try:
                self.lstm_model = RouteSequenceLSTM(vocab_size=71)  # 70 locations + padding
                self.lstm_model.load_model(lstm_path)
                self._lstm_ready = True
                print("[PredictionService] LSTM model loaded successfully.")
            except Exception as e:
                print(f"[PredictionService] LSTM load failed: {e}")

        # Load encoders and scaler for feature engineering
        self._encoders = None
        self._scaler = None
        encoders_path = os.path.join(models_dir, 'encoders.pkl')
        scaler_path = os.path.join(models_dir, 'scaler.pkl')
        if os.path.exists(encoders_path):
            self._encoders = joblib.load(encoders_path)
        if os.path.exists(scaler_path):
            self._scaler = joblib.load(scaler_path)

    # ─────────────────────────────────────────────
    # Public API
    # ─────────────────────────────────────────────
    def predict_daily_route(self, driver_id: str, date: str, locations: list, constraints: dict = None):
        """
        Full AI prediction pipeline:
          1. Redis cache check
          2. TSP nearest-neighbor optimization
          3. OSRM road geometry + distance
          4. Google Maps traffic-aware duration (if key present)
          5. RF + XGBoost ensemble ETA prediction
          6. LSTM next-stop sequence suggestion
          7. Per-stop ETA timestamps
          8. Cache result in Redis
        """
        execution_logs = [
            f"[{_ts()}] [SYS] Initializing AI Route Optimization Engine v2.0..."
        ]

        # ── 1. Redis Cache ──
        constraints_str = json.dumps(constraints, sort_keys=True) if constraints else ""
        cache_str = f"{driver_id}_{date}_{constraints_str}_" + "_".join([loc['name'] for loc in locations])
        cache_key = f"route_predict_{hashlib.md5(cache_str.encode()).hexdigest()}"

        cached = self.redis.get(cache_key)
        if cached:
            execution_logs.append(f"[{_ts()}] [CACHE] Cache hit — restoring route from Redis.")
            result = json.loads(cached)
            result['execution_logs'] = execution_logs
            return result

        # ── 2. Route Optimization (TSP Nearest Neighbor) ──
        execution_logs.append(
            f"[{_ts()}] [OPT] Running Nearest-Neighbor TSP optimizer on {len(locations)} stops..."
        )
        optimized_locations = self.optimizer.optimize_route_nearest_neighbor(locations)
        execution_logs.append(
            f"[{_ts()}] [OPT] TSP solved. Optimized visit order: {[l['name'] for l in optimized_locations]}"
        )

        # ── 3. OSRM Road Geometry ──
        execution_logs.append(f"[{_ts()}] [NET] Fetching real road geometry from OSRM routing engine...")
        geojson_path = []
        base_distance_km = 0.0
        base_duration_mins = 0.0

        try:
            coords = ";".join([f"{loc['lng']},{loc['lat']}" for loc in optimized_locations])
            traffic = constraints.get("traffic_congestion", "Low") if constraints else "Low"
            osrm_url = (
                f"https://router.project-osrm.org/route/v1/driving/{coords}"
                f"?overview=full&geometries=geojson&alternatives=3"
            )
            response = requests.get(osrm_url, timeout=10)
            data = response.json()

            if data.get('code') == 'Ok':
                route_idx = 0
                if traffic == "High" and len(data['routes']) > 1:
                    route_idx = 1
                elif traffic == "Extreme" and len(data['routes']) > 1:
                    route_idx = len(data['routes']) - 1

                route = data['routes'][route_idx]
                base_distance_km = route['distance'] / 1000.0
                base_duration_mins = route['duration'] / 60.0
                geojson_path = route['geometry']['coordinates']
                execution_logs.append(
                    f"[{_ts()}] [NET] OSRM → {round(base_distance_km, 1)} km, "
                    f"{round(base_duration_mins, 1)} mins (route alt #{route_idx})"
                )
            else:
                raise ValueError(f"OSRM code: {data.get('code')}")

        except Exception as e:
            print(f"[OSRM] Error: {e}")
            base_distance_km = len(optimized_locations) * 8.0
            base_duration_mins = len(optimized_locations) * 18.0
            execution_logs.append(f"[{_ts()}] [NET] OSRM unavailable — using heuristic distance estimate.")

        # ── 4. Google Maps Traffic Duration ──
        google_duration_mins = None
        if len(optimized_locations) >= 2:
            execution_logs.append(f"[{_ts()}] [GOOGLE] Querying Google Maps Distance Matrix API for traffic data...")
            try:
                matrix = self.gmaps.get_distance_matrix(
                    [optimized_locations[0]],
                    [optimized_locations[-1]]
                )
                google_duration_mins = self.gmaps.extract_traffic_duration(matrix, 0, 0)
                google_distance_km = self.gmaps.extract_distance_km(matrix, 0, 0)

                # Blend Google traffic data with OSRM geometry
                # Scale OSRM route duration by ratio of Google traffic vs Google base
                if google_duration_mins and google_duration_mins > 0:
                    execution_logs.append(
                        f"[{_ts()}] [GOOGLE] Google Maps traffic duration (O→D): {google_duration_mins} mins "
                        f"({google_distance_km} km) — blending with OSRM multi-stop geometry."
                    )
                    # Use Google time-to-distance ratio to adjust full OSRM route
                    if google_distance_km > 0:
                        google_speed = google_distance_km / (google_duration_mins / 60.0)
                        base_duration_mins = (base_distance_km / google_speed) * 60.0
            except Exception as e:
                execution_logs.append(f"[{_ts()}] [GOOGLE] Distance Matrix failed: {e} — using OSRM duration.")

        # ── 5. ML Feature Vector + Ensemble Prediction ──
        execution_logs.append(
            f"[{_ts()}] [ML] Building feature vector for RF + XGBoost ensemble inference..."
        )

        predicted_time_mins = base_duration_mins
        efficiency_val = 92.0
        confidence_val = 0.90

        date_obj = _parse_date(date)
        day_of_week = date_obj.strftime("%A") if date_obj else "Monday"
        weekend_flag = 1 if day_of_week in ("Saturday", "Sunday") else 0
        hour = datetime.now().hour

        feature_vector = self._build_feature_vector(
            driver_id=driver_id,
            day_of_week=day_of_week,
            weekend_flag=weekend_flag,
            region="Central",  # default region for the route center
            traffic_category=constraints.get("traffic_congestion", "Low") if constraints else "Low",
            hour=hour,
            distance_km=base_distance_km,
            stop_count=len(optimized_locations),
            average_speed_kmph=max(1.0, (base_distance_km / (base_duration_mins / 60.0)) if base_duration_mins > 0 else 30.0)
        )

        rf_pred_mins = None
        xgb_pred_mins = None

        if feature_vector is not None:
            # RF prediction (multi-output: [travel_time, efficiency_score])
            if self._rf_ready:
                try:
                    rf_result = self.rf_model.predict(feature_vector)
                    rf_pred_mins = float(rf_result[0][0])
                    rf_efficiency = float(rf_result[0][1]) * 100.0  # scale 0–1 → 0–100
                    execution_logs.append(
                        f"[{_ts()}] [ML-RF] Random Forest prediction: "
                        f"{round(rf_pred_mins, 1)} mins, efficiency: {round(rf_efficiency, 1)}%"
                    )
                except Exception as e:
                    execution_logs.append(f"[{_ts()}] [ML-RF] RF inference failed: {e}")

            # XGBoost prediction (single-output: travel_time)
            if self._xgb_ready:
                try:
                    xgb_result = self.xgb_model.predict(feature_vector)
                    xgb_pred_mins = float(xgb_result[0])
                    execution_logs.append(
                        f"[{_ts()}] [ML-XGB] XGBoost prediction: {round(xgb_pred_mins, 1)} mins"
                    )
                except Exception as e:
                    execution_logs.append(f"[{_ts()}] [ML-XGB] XGBoost inference failed: {e}")

        # Ensemble: blend OSRM + RF + XGBoost with weighted average
        sources = [(base_duration_mins, 0.4)]  # OSRM gets 40% weight
        if rf_pred_mins and rf_pred_mins > 0:
            sources.append((rf_pred_mins, 0.35))   # RF gets 35%
        if xgb_pred_mins and xgb_pred_mins > 0:
            sources.append((xgb_pred_mins, 0.25))  # XGBoost gets 25%

        total_weight = sum(w for _, w in sources)
        predicted_time_mins = sum(t * w for t, w in sources) / total_weight

        if rf_pred_mins:
            efficiency_val = float(self.rf_model.predict(feature_vector)[0][1]) * 100.0 if feature_vector is not None else 92.0
        efficiency_val = max(10.0, min(100.0, efficiency_val))

        execution_logs.append(
            f"[{_ts()}] [ML] Ensemble ETA (OSRM×0.4 + RF×0.35 + XGB×0.25): "
            f"{round(predicted_time_mins, 1)} mins"
        )

        # ── Apply Constraint Penalties ──
        if constraints:
            predicted_time_mins, efficiency_val, confidence_val, execution_logs = self._apply_constraints(
                predicted_time_mins, efficiency_val, confidence_val, constraints, execution_logs
            )

        # ── 6. LSTM Next-Stop Suggestion ──
        lstm_next_stop = None
        lstm_sequence_log = None
        if self._lstm_ready and self._encoders and 'location_id' in self._encoders:
            try:
                loc_encoder = self._encoders['location_id']
                known_classes = set(loc_encoder.classes_)

                # Map location names to encoded IDs (use known locations that match)
                location_ids = []
                for loc in optimized_locations:
                    # Try to find matching location_id pattern
                    possible_id = f"L{loc['name'].split('_')[-1]}" if '_' in loc['name'] else None
                    if possible_id and possible_id in known_classes:
                        encoded = int(loc_encoder.transform([possible_id])[0])
                        location_ids.append(encoded)

                if len(location_ids) >= 2:
                    # Predict next stop after the current sequence
                    from tensorflow.keras.preprocessing.sequence import pad_sequences
                    padded = pad_sequences([location_ids], maxlen=max(5, len(location_ids)), padding='pre')
                    next_encoded = self.lstm_model.predict_next_stop(padded[0])
                    if 0 <= next_encoded < len(loc_encoder.classes_):
                        lstm_next_stop = str(loc_encoder.inverse_transform([next_encoded])[0])
                        lstm_sequence_log = (
                            f"[{_ts()}] [LSTM] Sequence model suggests next logical stop: "
                            f"{lstm_next_stop} (confidence based on {len(location_ids)}-stop history)"
                        )
                        execution_logs.append(lstm_sequence_log)
            except Exception as e:
                execution_logs.append(f"[{_ts()}] [LSTM] Sequence prediction skipped: {e}")

        # ── 7. Per-Stop ETA Timestamps ──
        route_response = []
        current_time = datetime.now()
        for i, loc in enumerate(optimized_locations):
            leg_time = (predicted_time_mins / max(1, len(optimized_locations) - 1)) * i
            stop_time = current_time + timedelta(minutes=leg_time)
            route_response.append({
                "store": loc['name'],
                "lat": loc['lat'],
                "lng": loc['lng'],
                "eta": stop_time.strftime("%I:%M %p"),
                "stop_number": i + 1
            })

        execution_logs.append(f"[{_ts()}] [SYS] Prediction complete. Route finalized.")

        response_payload = {
            "recommended_route": route_response,
            "predicted_time": f"{round(predicted_time_mins / 60, 2)} hours",
            "total_distance": f"{round(base_distance_km, 1)} km",
            "confidence": round(max(0.1, min(0.99, confidence_val)), 2),
            "efficiency_score": round(efficiency_val, 1),
            "geojson_path": geojson_path,
            "execution_logs": execution_logs,
            "ml_models_used": {
                "random_forest": self._rf_ready,
                "xgboost": self._xgb_ready,
                "lstm": self._lstm_ready,
                "lstm_next_stop_suggestion": lstm_next_stop,
                "google_maps_traffic": google_duration_mins is not None
            }
        }

        # Cache for 1 hour
        self.redis.set(cache_key, json.dumps(response_payload), ex=3600)
        return response_payload

    # ─────────────────────────────────────────────
    # Feature Vector Builder
    # ─────────────────────────────────────────────
    def _build_feature_vector(self, driver_id: str, day_of_week: str, weekend_flag: int,
                               region: str, traffic_category: str, hour: int,
                               distance_km: float, stop_count: int, average_speed_kmph: float):
        """
        Constructs the exact feature vector used during model training.
        Numeric features (in order):
          driver_id, day_of_week, weekend_flag, region, traffic_category,
          hour, distance_km, stop_count, average_speed_kmph
        """
        try:
            # Encode driver_id (extract numeric suffix e.g. D1 → 0, D2 → 1)
            driver_num = 0
            if self._encoders and 'driver_id' in self._encoders:
                try:
                    driver_num = int(self._encoders['driver_id'].transform([driver_id])[0])
                except Exception:
                    # Unknown driver — use hash-based encoding
                    driver_num = abs(hash(driver_id)) % 15

            dow_num = DAY_ENCODING.get(day_of_week, 1)
            region_num = REGION_ENCODING.get(region, 0)
            traffic_num = TRAFFIC_ENCODING.get(traffic_category, 1)

            raw_features = pd.DataFrame([[
                driver_num, dow_num, weekend_flag, region_num, traffic_num,
                hour, distance_km, stop_count, average_speed_kmph
            ]], columns=[
                'driver_id', 'day_of_week', 'weekend_flag', 'region', 
                'traffic_category', 'hour', 'distance_km', 'stop_count', 
                'average_speed_kmph'
            ], dtype=float)

            if self._scaler:
                scaled = self._scaler.transform(raw_features)
                return scaled
            return raw_features

        except Exception as e:
            print(f"[PredictionService] Feature vector build failed: {e}")
            return None

    # ─────────────────────────────────────────────
    # Constraint Penalty Engine
    # ─────────────────────────────────────────────
    def _apply_constraints(self, time_mins: float, efficiency: float, confidence: float,
                            constraints: dict, logs: list):
        """Applies real-world constraint multipliers to predicted metrics."""
        traffic = constraints.get("traffic_congestion", "Low")
        road = constraints.get("road_condition", "Clear")
        fatigue = constraints.get("driver_fatigue", "Low")
        familiarity = constraints.get("driver_familiarity", "High")

        if traffic != "Low":
            logs.append(f"[{_ts()}] [CONSTRAINT] Traffic penalty applied: {traffic}")
        if traffic == "Moderate":
            time_mins *= 1.20; efficiency -= 4.5
        elif traffic == "High":
            time_mins *= 1.50; efficiency -= 12.0; confidence -= 0.08
        elif traffic == "Extreme":
            time_mins *= 2.20; efficiency -= 28.0; confidence -= 0.15

        if road != "Clear":
            logs.append(f"[{_ts()}] [CONSTRAINT] Road condition penalty: {road}")
        if road == "Construction":
            time_mins *= 1.15; efficiency -= 5.0
        elif road == "Weather Disruptions":
            time_mins *= 1.40; efficiency -= 15.0; confidence -= 0.10

        if fatigue != "Low":
            logs.append(f"[{_ts()}] [CONSTRAINT] Driver fatigue penalty: {fatigue}")
        if fatigue == "Moderate":
            time_mins *= 1.05; efficiency -= 2.0
        elif fatigue == "High":
            time_mins *= 1.18; efficiency -= 8.0; confidence -= 0.05

        if familiarity == "Low":
            time_mins *= 1.10; confidence -= 0.05
        elif familiarity == "Medium":
            time_mins *= 1.02

        efficiency = max(10.0, min(100.0, efficiency))
        confidence = max(0.10, min(0.99, confidence))
        return time_mins, efficiency, confidence, logs


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────
def _ts() -> str:
    return datetime.now().strftime('%H:%M:%S.%f')[:-3]


def _parse_date(date_str: str):
    for fmt in ("%Y-%m-%d", "%Y/%m/%d"):
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    return None
