"""
Script: generate_data.py
Purpose: Generates the synthetic delivery dataset used to train the AI Route
         Optimization models. Outputs data/synthetic_route_dataset.csv and
         data/locations.csv.

Usage:
    python scripts/generate_data.py

Configuration:
    NUM_RECORDS  - total trip records (default: 2500, min requirement: 1000)
    NUM_DRIVERS  - number of drivers (default: 15, min requirement: 10)
    NUM_LOCATIONS - number of unique store locations (default: 70, min: 50)
"""

import pandas as pd
import numpy as np
import random
import os
from datetime import datetime, timedelta

# ─────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────
SEED = 42
NUM_DRIVERS = 15
NUM_LOCATIONS = 70
NUM_RECORDS = 2500
START_DATE = datetime(2026, 1, 1)
END_DATE = datetime(2026, 5, 1)

REGIONS = ["North", "South", "East", "West", "Central"]
TRAFFIC_CATEGORIES = ["Low", "Medium", "High"]
DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

# Ahmedabad area bounding box (lat/lng)
LAT_MIN, LAT_MAX = 22.89, 23.18
LNG_MIN, LNG_MAX = 72.45, 72.74

np.random.seed(SEED)
random.seed(SEED)


def assign_region(lat: float, lng: float) -> str:
    """Assigns a region label based on geographic position."""
    lat_mid = (LAT_MIN + LAT_MAX) / 2
    lng_mid = (LNG_MIN + LNG_MAX) / 2
    if lat > lat_mid and lng < lng_mid:
        return "North"
    elif lat < lat_mid and lng < lng_mid:
        return "South"
    elif lat > lat_mid and lng > lng_mid:
        return "East"
    elif lat < lat_mid and lng > lng_mid:
        return "West"
    return "Central"


def generate_locations(n: int) -> pd.DataFrame:
    """Generates n unique store locations with lat/lng and region."""
    lats = np.random.uniform(LAT_MIN, LAT_MAX, n)
    lngs = np.random.uniform(LNG_MIN, LNG_MAX, n)
    regions = [assign_region(lat, lng) for lat, lng in zip(lats, lngs)]

    return pd.DataFrame({
        "location_id": [f"L{i+1}" for i in range(n)],
        "store_name": [f"Store_{i+1}" for i in range(n)],
        "latitude": lats.round(6),
        "longitude": lngs.round(6),
        "region": regions
    })


def haversine(lat1, lng1, lat2, lng2) -> float:
    """Calculates great-circle distance in km."""
    R = 6371.0
    dlat = np.radians(lat2 - lat1)
    dlng = np.radians(lng2 - lng1)
    a = np.sin(dlat/2)**2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlng/2)**2
    return R * 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))


def generate_records(locations: pd.DataFrame, num_records: int) -> pd.DataFrame:
    """Generates synthetic delivery trip records."""
    drivers = [f"D{i+1}" for i in range(NUM_DRIVERS)]
    date_range = (END_DATE - START_DATE).days

    records = []
    for _ in range(num_records):
        driver = random.choice(drivers)
        date = START_DATE + timedelta(days=random.randint(0, date_range))
        day_of_week = date.strftime("%A")
        weekend_flag = 1 if day_of_week in ("Saturday", "Sunday") else 0

        loc = locations.sample(1).iloc[0]
        traffic = random.choice(TRAFFIC_CATEGORIES)

        # Visit time: between 08:00 and 19:00
        hour = random.randint(8, 18)
        minute = random.choice([0, 15, 30, 45])
        visit_time = f"{hour:02d}:{minute:02d}"

        visit_duration = random.randint(10, 60)  # minutes at stop

        # Distance: random 1–25 km
        distance_km = round(random.uniform(1.0, 25.0), 2)
        stop_count = random.randint(2, 12)
        avg_speed = round(random.uniform(20.0, 50.0), 2)

        # Travel time: physics + traffic multiplier
        traffic_mult = {"Low": 1.0, "Medium": 1.3, "High": 2.1}[traffic]
        travel_time = round((distance_km / avg_speed) * 60.0 * traffic_mult, 2)

        # Efficiency score: 0.6–1.0, inversely correlated with traffic
        base_eff = random.uniform(0.60, 1.00)
        efficiency = round(base_eff - (0.05 if traffic == "Medium" else 0.10 if traffic == "High" else 0.0), 2)
        efficiency = max(0.60, min(1.00, efficiency))

        records.append({
            "driver_id": driver,
            "date": date.strftime("%Y-%m-%d"),
            "day_of_week": day_of_week,
            "weekend_flag": weekend_flag,
            "stop": loc["store_name"],
            "location_id": loc["location_id"],
            "latitude": loc["latitude"],
            "longitude": loc["longitude"],
            "region": loc["region"],
            "traffic_category": traffic,
            "visit_time": visit_time,
            "visit_duration_minutes": visit_duration,
            "distance_km": distance_km,
            "historical_travel_time_minutes": travel_time,
            "stop_count": stop_count,
            "average_speed_kmph": avg_speed,
            "route_efficiency_score": efficiency
        })

    return pd.DataFrame(records)


def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    os.makedirs(data_dir, exist_ok=True)

    print(f"Generating {NUM_LOCATIONS} locations...")
    locations = generate_locations(NUM_LOCATIONS)
    locations_path = os.path.join(data_dir, "locations.csv")
    locations.to_csv(locations_path, index=False)
    print(f"  → Saved to {locations_path}")

    print(f"Generating {NUM_RECORDS} trip records...")
    records = generate_records(locations, NUM_RECORDS)
    dataset_path = os.path.join(data_dir, "synthetic_route_dataset.csv")
    records.to_csv(dataset_path, index=False)
    print(f"  → Saved to {dataset_path}")
    print(f"\nDataset stats:")
    print(f"  Total records : {len(records)}")
    print(f"  Unique drivers: {records['driver_id'].nunique()}")
    print(f"  Unique locations: {records['location_id'].nunique()}")
    print(f"  Date range: {records['date'].min()} → {records['date'].max()}")
    print(f"\n✅ Dataset generation complete.")


if __name__ == "__main__":
    main()
