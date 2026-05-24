from sklearn.cluster import KMeans
import joblib
import os

class StoreClusteringModel:
    def __init__(self, n_clusters=8):
        self.n_clusters = n_clusters
        self.model = KMeans(n_clusters=self.n_clusters, random_state=42)
        
    def train(self, df):
        """Trains the K-Means clustering model on coordinates."""
        coords = df[['latitude', 'longitude']]
        self.model.fit(coords)
        return self.model.labels_

    def predict(self, lat, lng):
        """Predicts the cluster ID for a given coordinate."""
        return self.model.predict([[lat, lng]])[0]

    def save_model(self, path):
        joblib.dump(self.model, path)

    def load_model(self, path):
        if os.path.exists(path):
            self.model = joblib.load(path)
