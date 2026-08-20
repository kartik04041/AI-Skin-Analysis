import os
import json
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'skin_model.h5')
CLASS_INDICES_PATH = os.path.join(BASE_DIR, 'class_indices.json')

# Load Trained Model (Graceful Fallback)
model = None
if os.path.exists(MODEL_PATH):
    try:
        model = load_model(MODEL_PATH)
        print("✅ TensorFlow Skin Model loaded successfully.")
    except Exception as e:
        print(f"⚠️ Error loading model file: {e}")
else:
    print(f"⚠️ Warning: Model file not found at '{MODEL_PATH}'. Running in Mock Prediction Mode.")

# Load Class Mapping
if os.path.exists(CLASS_INDICES_PATH):
    with open(CLASS_INDICES_PATH, 'r') as f:
        class_indices = json.load(f)
    class_indices = {str(k): v for k, v in class_indices.items()}
else:
    class_indices = {"0": "Oily", "1": "Dry", "2": "Normal", "3": "Combination"}

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "running", "model_loaded": model is not None})

@app.route('/predict', methods=['POST'])
def predict():
    uploaded_files = []
    for key in ['front', 'left', 'right', 'image']:
        if key in request.files and request.files[key].filename != '':
            uploaded_files.append((key, request.files[key]))

    if not uploaded_files:
        return jsonify({'success': False, 'message': 'No image files provided'}), 400

    predictions_list = []
    temp_files_to_clean = []

    try:
        for angle_key, file_obj in uploaded_files:
            temp_path = os.path.join(BASE_DIR, f'temp_{angle_key}_{os.getpid()}.jpg')
            file_obj.save(temp_path)
            temp_files_to_clean.append(temp_path)

            if model is not None:
                img = image.load_img(temp_path, target_size=(224, 224))
                img_array = image.img_to_array(img)
                img_array = np.expand_dims(img_array, axis=0) / 255.0
                pred_probs = model.predict(img_array)[0]
            else:
                # Mock probabilities for testing frontend UI
                pred_probs = np.array([0.65, 0.15, 0.10, 0.10])

            predictions_list.append(pred_probs)

        avg_predictions = np.mean(predictions_list, axis=0)
        predicted_idx = str(np.argmax(avg_predictions))
        predicted_class = class_indices.get(predicted_idx, "Unknown")
        confidence = float(np.max(avg_predictions))

        probabilities = {
            class_name: round(float(avg_predictions[int(k)]), 4)
            for k, class_name in class_indices.items()
        }

        lighting_condition = request.form.get('lighting', 'Natural Daylight')
        gender = request.form.get('gender', 'Not Specified')
        age = request.form.get('age', 'N/A')
        concern = request.form.get('concern', 'General')

        return jsonify({
            'success': True,
            'prediction': predicted_class,
            'confidence': round(confidence, 4),
            'probabilities': probabilities,
            'views_analyzed': len(uploaded_files),
            'lighting': lighting_condition,
            'metadata': {
                'gender': gender,
                'age': age,
                'concern': concern
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

    finally:
        for temp_file in temp_files_to_clean:
            if os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except Exception:
                    pass

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001, debug=True)