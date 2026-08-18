import os
import json
import sys

print("Initializing AI Server...")

# Step 1: Safe Import Checking
try:
    import numpy as np
    from flask import Flask, request, jsonify
    from flask_cors import CORS
    import tensorflow as tf
    from tensorflow.keras.models import load_model
    from tensorflow.keras.preprocessing import image
    print("Dependencies loaded successfully!")
except Exception as e:
    print("\n[CRITICAL ERROR] Failed to import packages: {}".format(e))
    print("Run: py -m pip install tensorflow flask flask-cors pillow numpy\n")
    sys.exit(1)

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'model', 'skin_model.keras')
CLASS_INDICES_PATH = os.path.join(BASE_DIR, 'model', 'class_indices.json')

# Step 2: Validate Model Files
print("Checking model path: {}".format(MODEL_PATH))

if not os.path.exists(MODEL_PATH):
    print("\n[ERROR] Model file missing at: {}".format(MODEL_PATH))
    print("You MUST train the model first by running: py train_model.py\n")
    sys.exit(1)

if not os.path.exists(CLASS_INDICES_PATH):
    print("\n[ERROR] Class mapping file missing at: {}".format(CLASS_INDICES_PATH))
    print("You MUST train the model first by running: py train_model.py\n")
    sys.exit(1)

# Step 3: Load AI Model
try:
    print("Loading TensorFlow Keras model... (This takes a few seconds)")
    model = load_model(MODEL_PATH)
    print("Model loaded successfully!")

    with open(CLASS_INDICES_PATH, 'r') as f:
        class_indices = json.load(f)
    print("Class mapping loaded: {}".format(class_indices))

except Exception as e:
    print("\n[ERROR] Failed to load trained model: {}\n".format(e))
    sys.exit(1)

# Step 4: Prediction Endpoint
@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'success': False, 'message': 'No image file uploaded'}), 400

    file = request.files['image']
    temp_path = os.path.join(BASE_DIR, 'temp_predict.jpg')
    file.save(temp_path)

    try:
        # Load and preprocess image to match MobileNetV2 input (224x224, 1/255 scale)
        img = image.load_img(temp_path, target_size=(224, 224))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0) / 255.0

        predictions = model.predict(img_array)[0]
        predicted_idx = str(np.argmax(predictions))
        predicted_class = class_indices[predicted_idx]
        confidence = float(np.max(predictions))

        probabilities = {
            class_name: round(float(predictions[int(idx)]), 4)
            for idx, class_name in class_indices.items()
        }

        print("Prediction successful: {} ({:.2f})".format(predicted_class, confidence))

        return jsonify({
            'success': True,
            'prediction': predicted_class,
            'confidence': round(confidence, 4),
            'probabilities': probabilities
        })

    except Exception as e:
        print("Prediction Error: {}".format(e))
        return jsonify({'success': False, 'error': str(e)}), 500

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == '__main__':
    print("\n==============================================")
    print("AI Flask API running on http://127.0.0.1:5001")
    print("==============================================\n")
    app.run(host='127.0.0.1', port=5001, debug=False)