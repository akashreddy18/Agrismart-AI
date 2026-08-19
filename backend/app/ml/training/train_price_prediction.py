import numpy as np
import pandas as pd
import pickle
import os
from sklearn.ensemble import RandomForestRegressor

def train():
    print("Training Price Prediction Model...")
    np.random.seed(42)
    n_samples = 1500

    crop_enc = np.random.randint(0, 6, n_samples)
    mandi_enc = np.random.randint(0, 5, n_samples)
    month = np.random.randint(1, 13, n_samples)
    historical_avg = np.random.uniform(1200.0, 7500.0, n_samples)

    X = pd.DataFrame({
        'crop_encoded': crop_enc,
        'mandi_encoded': mandi_enc,
        'month': month,
        'historical_price_avg': historical_avg
    })

    prices = []
    # Dynamic formula: historical_avg * monthly fluctuation factor + mandi premium
    for _, row in X.iterrows():
        hist = row['historical_price_avg']
        m = row['month']
        
        # Monthly oscillation (simulating dry/monsoon arrivals cycles)
        seasonal_factor = 1.0 + 0.12 * np.sin((m - 5) * np.pi / 6.0)
        mandi_premium = {0: 100.0, 1: 220.0, 2: 180.0, 3: 50.0, 4: 250.0}[int(row['mandi_encoded'])]
        
        noise = np.random.uniform(-120.0, 120.0)
        val = (hist * seasonal_factor) + mandi_premium + noise
        prices.append(round(max(400.0, val), 2))

    y = np.array(prices)

    model = RandomForestRegressor(n_estimators=50, max_depth=8, random_state=42)
    model.fit(X, y)

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(base_dir, 'models')
    os.makedirs(models_dir, exist_ok=True)

    model_path = os.path.join(models_dir, 'price_prediction_model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
        
    print(f"Price Prediction Model saved successfully to: {model_path}")

if __name__ == "__main__":
    train()
