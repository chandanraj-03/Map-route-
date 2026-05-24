import os
import xgboost as xgb
import matplotlib.pyplot as plt

def plot_feature_importance():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    model_path = os.path.join(base_dir, 'backend', 'models', 'saved', 'xgb.json')
    output_path = os.path.join(base_dir, 'backend', 'models', 'saved', 'feature_importance.png')

    if not os.path.exists(model_path):
        print(f"Model not found at {model_path}. Train the model first.")
        return

    # Load model
    model = xgb.XGBRegressor()
    model.load_model(model_path)

    # Plot
    plt.figure(figsize=(10, 8))
    
    # We assign mock feature names because we trained without explicit feature names in the DataFrame
    # In a real run, the DataFrame columns would be preserved.
    # The numeric features were: 'driver_id', 'day_of_week', 'weekend_flag', 'region', 'traffic_category', 'hour', 'distance_km', 'stop_count', 'average_speed_kmph'
    feature_names = [
        'Driver ID', 'Day of Week', 'Weekend Flag', 'Region', 
        'Traffic Level', 'Hour of Day', 'Total Distance (km)', 
        'Total Stops', 'Driver Avg Speed (kmph)'
    ]
    
    model.get_booster().feature_names = feature_names

    xgb.plot_importance(model, importance_type='weight', max_num_features=10, 
                        title="XGBoost ETA Prediction - Feature Importance",
                        xlabel="F-Score (Weight)", ylabel="Features")
    
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    print(f"Feature importance visualization saved to {output_path}")

if __name__ == "__main__":
    plot_feature_importance()
