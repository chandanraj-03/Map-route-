import os
import joblib
from sklearn.model_selection import train_test_split
import pandas as pd
import numpy as np

# Adjust imports depending on run context
try:
    from dataset_loader import DatasetLoader
    from cluster_model import StoreClusteringModel
    from rf_model import RFRoutePredictor
    from xgb_model import XGBRoutePredictor
    from lstm_model import RouteSequenceLSTM
except ImportError:
    from backend.ml.dataset_loader import DatasetLoader
    from backend.ml.cluster_model import StoreClusteringModel
    from backend.ml.rf_model import RFRoutePredictor
    from backend.ml.xgb_model import XGBRoutePredictor
    from backend.ml.lstm_model import RouteSequenceLSTM

def train_pipeline():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    data_path = os.path.join(base_dir, 'data', 'synthetic_route_dataset.csv')
    models_dir = os.path.join(base_dir, 'backend', 'models', 'saved')
    os.makedirs(models_dir, exist_ok=True)

    print("1. Loading Data...")
    loader = DatasetLoader(data_path)
    df = loader.load_data()

    print("2. Training K-Means Clustering...")
    cluster_model = StoreClusteringModel(n_clusters=8)
    cluster_df = loader.preprocess_for_clustering(df)
    cluster_model.train(cluster_df)
    cluster_model.save_model(os.path.join(models_dir, 'kmeans.pkl'))

    print("3. Training Regression Models (RF & XGBoost)...")
    X, y = loader.preprocess_for_regression(df)
    
    # y has two columns: historical_travel_time_minutes, route_efficiency_score
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    rf_model = RFRoutePredictor()
    rf_model.train(X_train, y_train)
    rf_metrics = rf_model.evaluate(X_test, y_test)
    print(f"   RF MAE: {rf_metrics['mae']}")
    rf_model.save_model(os.path.join(models_dir, 'rf.pkl'))

    xgb_model = XGBRoutePredictor()
    # XGBoost only takes one target natively without wrappers, so we train on travel_time
    y_train_xgb = y_train['historical_travel_time_minutes']
    y_test_xgb = y_test['historical_travel_time_minutes']
    xgb_model.train(X_train, y_train_xgb)
    xgb_metrics = xgb_model.evaluate(X_test, y_test_xgb)
    print(f"   XGB MAE: {xgb_metrics['mae']}")
    xgb_model.save_model(os.path.join(models_dir, 'xgb.json'))

    print("4. Training LSTM Sequence Model...")
    sequences = loader.preprocess_for_lstm(df)
    
    if len(sequences) > 0:
        # Prepare X and y for sequence prediction
        seq_X, seq_y = [], []
        for seq in sequences:
            for i in range(1, len(seq)):
                seq_X.append(seq[:i])
                seq_y.append(seq[i])
        
        # Pad sequences
        from tensorflow.keras.preprocessing.sequence import pad_sequences
        max_len = max([len(x) for x in seq_X])
        seq_X_padded = pad_sequences(seq_X, maxlen=max_len, padding='pre')
        
        vocab_size = len(loader.label_encoders['location_id'].classes_)
        lstm_model = RouteSequenceLSTM(vocab_size=vocab_size)
        
        # Quick train for demo
        lstm_model.train(seq_X_padded, seq_y, epochs=3, batch_size=32)
        lstm_model.save_model(os.path.join(models_dir, 'lstm.h5'))
    else:
        print("   Not enough sequence data for LSTM.")

    # Save Label Encoders
    joblib.dump(loader.label_encoders, os.path.join(models_dir, 'encoders.pkl'))
    joblib.dump(loader.scaler, os.path.join(models_dir, 'scaler.pkl'))

    print("Training Complete. All models saved.")

if __name__ == "__main__":
    train_pipeline()
