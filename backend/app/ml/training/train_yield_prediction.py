import numpy as np
import pandas as pd
import pickle
import os
from sklearn.ensemble import RandomForestRegressor

def train():
    print("Training Yield Prediction Model...")
    np.random.seed(42)
    n_samples = 1500

    # Categories Encodings
    # Clay: 0, Black: 1, Sandy: 2, Red: 3, Loamy: 4, Silty: 5
    soil_enc = np.random.randint(0, 6, n_samples)
    # Rice: 0, Banana: 1, Cotton: 2, Chickpea: 3, Maize: 4, Mango: 5
    crop_enc = np.random.randint(0, 6, n_samples)
    
    acreage = np.random.uniform(1.0, 30.0, n_samples)
    rainfall = np.random.uniform(40.0, 280.0, n_samples)
    fertilizer = np.random.uniform(20.0, 400.0, n_samples)

    X = pd.DataFrame({
        'crop_encoded': crop_enc,
        'soil_encoded': soil_enc,
        'acreage': acreage,
        'rainfall': rainfall,
        'fertilizer_usage': fertilizer
    })

    # Yield base estimates per crop type
    base_yields = {0: 1200.0, 1: 2500.0, 2: 900.0, 3: 700.0, 4: 1600.0, 5: 1800.0}
    yields = []
    
    for _, row in X.iterrows():
        base = base_yields[int(row['crop_encoded'])]
        ac = row['acreage']
        
        # Calculate yield with fertilizer and rainfall coefficient multipliers
        fert_coeff = 0.85 + (row['fertilizer_usage'] / 400.0) * 0.3
        rain_coeff = 0.90 + (row['rainfall'] / 280.0) * 0.25
        
        # Add random environmental variance
        noise = np.random.uniform(0.92, 1.08)
        
        val = base * ac * fert_coeff * rain_coeff * noise
        yields.append(round(val, 2))

    y = np.array(yields)

    model = RandomForestRegressor(n_estimators=50, max_depth=8, random_state=42)
    model.fit(X, y)

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(base_dir, 'models')
    os.makedirs(models_dir, exist_ok=True)

    model_path = os.path.join(models_dir, 'yield_prediction_model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
        
    print(f"Yield Prediction Model saved successfully to: {model_path}")

if __name__ == "__main__":
    train()
