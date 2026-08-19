import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense
import os

def train():
    print("Training Disease Detection Model (TensorFlow CNN)...")
    np.random.seed(42)
    tf.random.set_seed(42)

    # Seed mock image datasets
    # 100 images of size 128x128x3 (RGB channels)
    n_samples = 100
    X_train = np.random.uniform(0.0, 1.0, (n_samples, 128, 128, 3)).astype(np.float32)
    # 4 Disease categories: 0: Healthy, 1: Leaf Spot, 2: Late Blight, 3: Powdery Mildew
    y_train = np.random.randint(0, 4, n_samples)

    # Basic CNN layer design
    model = Sequential([
        Conv2D(8, (3, 3), activation='relu', input_shape=(128, 128, 3)),
        MaxPooling2D((2, 2)),
        Conv2D(16, (3, 3), activation='relu'),
        MaxPooling2D((2, 2)),
        Flatten(),
        Dense(16, activation='relu'),
        Dense(4, activation='softmax')
    ])

    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

    # Train briefly (2 epochs is enough to output a valid structured .h5 binary file)
    model.fit(X_train, y_train, epochs=2, batch_size=16, verbose=1)

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(base_dir, 'models')
    os.makedirs(models_dir, exist_ok=True)

    model_path = os.path.join(models_dir, 'disease_detection_model.h5')
    model.save(model_path)
    
    print(f"Disease Detection Model saved successfully to: {model_path}")

if __name__ == "__main__":
    train()
