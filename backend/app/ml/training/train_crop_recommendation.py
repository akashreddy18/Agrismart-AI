import numpy as np
import pandas as pd
import pickle
import os
from sklearn.ensemble import RandomForestClassifier

def train():
    print("Training Crop Recommendation Model...")
    np.random.seed(42)
    n_samples = 1500

    # N, P, K ranges represent Nitrogen, Phosphorus, Potassium in soil
    N = np.random.uniform(10, 140, n_samples)
    P = np.random.uniform(5, 120, n_samples)
    K = np.random.uniform(5, 200, n_samples)
    temp = np.random.uniform(12, 40, n_samples)
    hum = np.random.uniform(15, 98, n_samples)
    ph = np.random.uniform(4.5, 8.5, n_samples)
    rain = np.random.uniform(30, 300, n_samples)

    X = pd.DataFrame({
        'N': N, 'P': P, 'K': K,
        'temperature': temp, 'humidity': hum,
        'ph': ph, 'rainfall': rain
    })

    crops = []
    for _, row in X.iterrows():
        # High rainfall + high humidity is ideal for Rice
        if row['rainfall'] > 180 and row['humidity'] > 70:
            crops.append('Rice')
        # High Potassium (K) + high Nitrogen (N) is ideal for Banana
        elif row['K'] > 100 and row['N'] > 80:
            crops.append('Banana')
        # High heat + alkaline pH is typical for Cotton fields
        elif row['temperature'] > 28 and row['ph'] > 6.8:
            crops.append('Cotton')
        # Low water requirements and sandy soils suitability
        elif row['rainfall'] < 80 and row['humidity'] < 50:
            crops.append('Chickpea')
        # General maize conditions
        elif row['N'] > 50 and row['rainfall'] > 100:
            crops.append('Maize')
        # Resilient mango trees
        else:
            crops.append('Mango')

    y = np.array(crops)

    model = RandomForestClassifier(n_estimators=50, max_depth=10, random_state=42)
    model.fit(X, y)

    # Save binary pickle model file
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(base_dir, 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    model_path = os.path.join(models_dir, 'crop_recommendation_model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
        
    print(f"Crop Recommendation Model saved successfully to: {model_path}")

if __name__ == "__main__":
    train()
