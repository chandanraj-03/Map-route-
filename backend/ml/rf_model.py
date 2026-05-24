from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

class RFRoutePredictor:
    def __init__(self):
        # We predict two targets: travel time and efficiency score
        self.model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
        
    def train(self, X_train, y_train):
        self.model.fit(X_train, y_train)
        return self.model

    def evaluate(self, X_test, y_test):
        predictions = self.model.predict(X_test)
        mae = mean_absolute_error(y_test, predictions, multioutput='raw_values')
        r2 = r2_score(y_test, predictions, multioutput='raw_values')
        return {"mae": mae, "r2": r2}

    def predict(self, X):
        return self.model.predict(X)

    def save_model(self, path):
        joblib.dump(self.model, path)

    def load_model(self, path):
        if os.path.exists(path):
            self.model = joblib.load(path)
