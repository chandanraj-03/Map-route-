import pandas as pd
import numpy as np
import os
from sklearn.preprocessing import StandardScaler, LabelEncoder

class DatasetLoader:
    def __init__(self, data_path: str):
        self.data_path = data_path
        self.scaler = StandardScaler()
        self.label_encoders = {}
        
    def load_data(self) -> pd.DataFrame:
        """Loads raw data from CSV."""
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"Dataset not found at {self.data_path}")
        return pd.read_csv(self.data_path)

    def preprocess_for_clustering(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extracts latitude and longitude for spatial clustering."""
        # Using unique locations for clustering
        locations_df = df[['location_id', 'latitude', 'longitude']].drop_duplicates()
        return locations_df
        
    def preprocess_for_regression(self, df: pd.DataFrame) -> pd.DataFrame:
        """Prepares features for Random Forest and XGBoost."""
        # Feature Engineering based on prompt requirements
        features = df.copy()
        
        # Convert visit time to hour numeric
        features['hour'] = pd.to_datetime(features['visit_time'], format='%H:%M').dt.hour
        
        # Encode categorical variables
        cat_cols = ['driver_id', 'day_of_week', 'region', 'traffic_category']
        for col in cat_cols:
            if col not in self.label_encoders:
                self.label_encoders[col] = LabelEncoder()
            features[col] = self.label_encoders[col].fit_transform(features[col])
            
        # Select numeric features
        numeric_features = [
            'driver_id', 'day_of_week', 'weekend_flag', 'region', 'traffic_category', 
            'hour', 'distance_km', 'stop_count', 'average_speed_kmph'
        ]
        
        # Targets
        targets = ['historical_travel_time_minutes', 'route_efficiency_score']
        
        X = features[numeric_features]
        y = features[targets]
        
        # Scale X
        X_scaled = pd.DataFrame(self.scaler.fit_transform(X), columns=X.columns)
        
        return X_scaled, y

    def preprocess_for_lstm(self, df: pd.DataFrame):
        """Prepares sequential data for LSTM."""
        # Group by driver and date to form sequences of locations
        df_sorted = df.sort_values(by=['driver_id', 'date', 'visit_time'])
        
        sequences = []
        for (driver, date), group in df_sorted.groupby(['driver_id', 'date']):
            # Sequence of location IDs (label encoded)
            if 'location_id' not in self.label_encoders:
                self.label_encoders['location_id'] = LabelEncoder()
                self.label_encoders['location_id'].fit(df['location_id'])
            
            seq = self.label_encoders['location_id'].transform(group['location_id']).tolist()
            if len(seq) > 2: # Need at least a small sequence
                sequences.append(seq)
                
        return sequences
