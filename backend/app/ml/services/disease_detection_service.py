import os
import cv2
import numpy as np
import tensorflow as tf
from app.ml.training.train_disease_detection import train

class DiseaseDetectionService:
    _model = None
    
    # Class categories mapping
    CLASSES = {
        0: "Healthy",
        1: "Leaf Spot",
        2: "Late Blight",
        3: "Powdery Mildew"
    }

    ADVISORIES = {
        "Healthy": "No disease detected. Maintain optimal crop irrigation and nitrogen fertilizer schedules.",
        "Leaf Spot": "Fungal infection detected. Apply Copper-based Fungicide. Prune severely spotted lower leaves to prevent splash dispersion.",
        "Late Blight": "Late blight alert. Spray Mancozeb or Chlorothalonil immediately. Shift to drip irrigation to prevent wet foliage spreading.",
        "Powdery Mildew": "White powdery mildew spores spotted. Apply Neem oil or Potassium Bicarbonate sprays. Improve air circulation."
    }

    @classmethod
    def get_model(cls):
        if cls._model is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            model_path = os.path.join(base_dir, 'models', 'disease_detection_model.h5')
            if not os.path.exists(model_path):
                print("Disease detection CNN model not found. Training on-the-fly...")
                train()
            cls._model = tf.keras.models.load_model(model_path)
        return cls._model

    @classmethod
    def detect(cls, image_bytes: bytes):
        # 1. Decode image bytes using OpenCV
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Invalid image file format. OpenCV could not parse bytes.")

        # 2. Resize to model input shape (128x128)
        img_resized = cv2.resize(img, (128, 128))
        
        # 3. Preprocess image: normalize pixel values to [0.0, 1.0]
        img_normalized = img_resized.astype(np.float32) / 255.0
        
        # 4. Expand dimensions for batch size [1, 128, 128, 3]
        img_batch = np.expand_dims(img_normalized, axis=0)

        # 5. Load model and predict
        model = cls.get_model()
        predictions = model.predict(img_batch)[0]
        
        predicted_idx = int(np.argmax(predictions))
        confidence = float(predictions[predicted_idx])
        disease_name = cls.CLASSES.get(predicted_idx, "Unknown")
        advisory = cls.ADVISORIES.get(disease_name, "Consult local agricultural extension office for further leaf diagnostics.")

        return disease_name, confidence, advisory
