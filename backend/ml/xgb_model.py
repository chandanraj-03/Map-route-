import xgboost as xgb
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

class XGBRoutePredictor:
    def __init__(self):
        # Predicts Traffic-aware ETA (single output for simplicity, or multi-output via wrappers)
        # XGBoost natively doesn't support multi-output as well as RF without wrappers.
        # We'll use it to predict just the travel_time as it's the core ETA metric.
        self.model = xgb.XGBRegressor(n_estimators=150, learning_rate=0.1, max_depth=6, random_state=42)
        
    def train(self, X_train, y_train):
        # Assuming y_train is a 1D array of historical_travel_time
        self.model.fit(X_train, y_train)
        return self.model

    def evaluate(self, X_test, y_test):
        predictions = self.model.predict(X_test)
        mae = mean_absolute_error(y_test, predictions)
        r2 = r2_score(y_test, predictions)
        return {"mae": mae, "r2": r2}

    def predict(self, X):
        return self.model.predict(X)

    def save_model(self, path):
        self.model.save_model(path)

    def load_model(self, path):
        if os.path.exists(path):
            self.model.load_model(path)
