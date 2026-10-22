
# ============================================================
# AI SKINCARE ANALYSIS SYSTEM
# app.py - Python Flask AI Service
# ============================================================

import os
import json
import datetime
import traceback
from pathlib import Path

import numpy as np
import jwt

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
from flask_bcrypt import Bcrypt
from werkzeug.utils import secure_filename
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from PIL import Image

# ============================================================
# LOAD THE EXISTING NODE BACKEND .env
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

ENV_CANDIDATES = [
    BASE_DIR / "backend" / ".env",
    BASE_DIR.parent / "backend" / ".env",
    BASE_DIR / ".env",
    BASE_DIR.parent.parent / "backend" / ".env",
]

ENV_FILE = next(
    (candidate for candidate in ENV_CANDIDATES if candidate.is_file()),
    None,
)

if ENV_FILE is None:
    raise RuntimeError(
        "Cannot find the existing backend/.env file. "
        "Check the location of app.py."
    )

load_dotenv(ENV_FILE, override=True)

SECRET_KEY = os.getenv("JWT_SECRET")

if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET is missing from the existing backend/.env file."
    )

JWT_ALGORITHM = "HS256"

print("JWT configuration loaded successfully.")
print(f"Environment file found: {ENV_FILE}")

# ============================================================
# FLASK CONFIGURATION
# ============================================================

app = Flask(__name__)
CORS(app)

bcrypt = Bcrypt(app)

PORT = int(os.getenv("PYTHON_PORT", "5001"))

MAX_IMAGE_SIZE = 10 * 1024 * 1024

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}

app.config["MAX_CONTENT_LENGTH"] = MAX_IMAGE_SIZE

# ============================================================
# MONGODB CONFIGURATION
# ============================================================

MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb://127.0.0.1:27017/skin_analysis_db",
)

mongo_client = None
db = None

users_col = None
scans_col = None
reviews_col = None

try:
    mongo_client = MongoClient(
        MONGO_URI,
        serverSelectionTimeoutMS=5000,
    )

    mongo_client.admin.command("ping")

    db = mongo_client["skin_analysis_db"]

    users_col = db["users"]
    scans_col = db["scans"]
    reviews_col = db["reviews"]

    print("MongoDB connected successfully.")
    print("Database: skin_analysis_db")

except Exception as error:
    print("MongoDB connection failed:", str(error))
    print("Database operations will be unavailable until MongoDB connects.")


def mongodb_ready():
    """Check MongoDB availability before database operations."""
    global mongo_client

    if mongo_client is None:
        return False

    try:
        mongo_client.admin.command("ping")
        return True
    except Exception:
        return False


# ============================================================
# MODEL CONFIGURATION
# ============================================================

MODEL_DIR = BASE_DIR / "model"

MODEL_PATHS = [
    MODEL_DIR / "skin_model.keras",
    MODEL_DIR / "skin_model.h5",
    BASE_DIR / "ai_model" / "skin_model.h5",
]

CLASS_INDICES_PATHS = [
    MODEL_DIR / "class_indices.json",
    BASE_DIR / "ai_model" / "class_indices.json",
]

IMAGE_SIZE = (224, 224)

skin_model = None
class_indices = {}


# ============================================================
# LOAD TENSORFLOW MODEL
# ============================================================

try:
    from tensorflow.keras.models import load_model

    model_path = next(
        (path for path in MODEL_PATHS if path.is_file()),
        None,
    )

    if model_path is None:
        print("WARNING: No trained skin model file was found.")
        print("Model predictions will be unavailable until it is installed.")

    else:
        skin_model = load_model(
            str(model_path),
            custom_objects={
                "preprocess_input": preprocess_input
            },
            compile=False,
        )

        print("Skin model loaded successfully.")
        print(f"Model file: {model_path}")

except Exception as error:
    print("Could not load TensorFlow model:", str(error))
    skin_model = None
    print("Could not load TensorFlow model:", str(error))
    skin_model = None



# ============================================================
# LOAD CLASS INDICES
# ============================================================

for indices_path in CLASS_INDICES_PATHS:
    if indices_path.is_file():
        try:
            with open(indices_path, "r", encoding="utf-8") as file:
                loaded_indices = json.load(file)

            # Format: {"acne": 0, "blackheads": 1, ...}
            if (
                isinstance(loaded_indices, dict)
                and loaded_indices
                and all(
                    isinstance(value, (int, float))
                    for value in loaded_indices.values()
                )
            ):
                class_indices = {
                    int(index): str(label)
                    for label, index in loaded_indices.items()
                }

            # Format: {"0": "acne", "1": "blackheads", ...}
            elif isinstance(loaded_indices, dict):
                class_indices = {
                    int(index): str(label)
                    for index, label in loaded_indices.items()
                }

            print("Class indices loaded successfully.")
            print(f"Class indices file: {indices_path}")
            break

        except Exception as error:
            print("Could not load class indices:", str(error))


# Fallback class names if the class-indices file is unavailable



# DISPLAY CLASS NAMES
# This changes displayed labels only. It does not retrain the model.
DISPLAY_CLASS_NAMES = {
    0: "acne",
    1: "oily",
    2: "dry",
    3: "sensitive",
    4: "combination",
}

if skin_model is not None:
    output_count = int(skin_model.output_shape[-1])

    class_indices = {
        index: DISPLAY_CLASS_NAMES.get(
            index,
            class_indices.get(index, f"class_{index}"),
        )
        for index in range(output_count)
    }
# ============================================================
# GENERAL HELPERS
# ============================================================

def json_safe(value):
    """Convert MongoDB and NumPy values into JSON-compatible values."""

    if isinstance(value, ObjectId):
        return str(value)

    if isinstance(value, datetime.datetime):
        return value.isoformat()

    if isinstance(value, np.ndarray):
        return value.tolist()

    if isinstance(value, np.generic):
        return value.item()

    if isinstance(value, dict):
        return {
            str(key): json_safe(item)
            for key, item in value.items()
        }

    if isinstance(value, (list, tuple)):
        return [json_safe(item) for item in value]

    return value


def allowed_file(filename):
    if not filename or "." not in filename:
        return False

    extension = filename.rsplit(".", 1)[1].lower()

    return extension in ALLOWED_EXTENSIONS


def safe_object_id(value):
    """Return ObjectId only for valid MongoDB IDs."""
    try:
        return ObjectId(str(value))
    except Exception:
        return None


# ============================================================
# JWT AUTHENTICATION
# ============================================================

def get_user_from_token():
    """
    Validate the JWT issued by Node.js.

    Node and Python must use the same JWT_SECRET and HS256.
    """

    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return None, "Authorization token required."

    token = auth_header[7:].strip()

    if not token:
        return None, "Authorization token is empty."

    try:
        decoded = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )

        user_id = (
            decoded.get("user_id")
            or decoded.get("userId")
            or decoded.get("id")
            or decoded.get("sub")
        )

        if not user_id:
            return None, "JWT does not contain a user ID."

        # The Node admin login uses a non-MongoDB user ID.
        if decoded.get("role") == "admin":
            return None, "Admin accounts cannot perform user skin scans."

        # If a MongoDB ID is supplied, it must be valid.
        if not safe_object_id(user_id):
            return None, "JWT contains an invalid user ID."

        return {
            "user_id": str(user_id),
            "email": decoded.get("email", ""),
            "role": decoded.get("role", "user"),
        }, None

    except jwt.ExpiredSignatureError:
        return None, "Token has expired. Please log in again."

    except jwt.InvalidTokenError:
        return None, "Invalid token signature. Check that Node and Python use the same JWT_SECRET."

    except Exception:
        return None, "Unable to validate authentication token."


# ============================================================
# IMAGE PREPROCESSING
# ============================================================

# ============================================================
# IMAGE PREPROCESSING
# ============================================================

def preprocess_image(file_storage):
    """Prepare an uploaded image for the trained Keras model."""

    image = Image.open(file_storage.stream).convert("RGB")
    image = image.resize(IMAGE_SIZE)

    image_array = np.asarray(image, dtype=np.float32)

    # The saved model applies MobileNetV2 preprocess_input internally.
    # Keep pixel values in the [0, 255] range here.
    return np.expand_dims(image_array, axis=0)
    """Prepare an uploaded image for the trained Keras model."""

    image = Image.open(file_storage.stream).convert("RGB")
    image = image.resize(IMAGE_SIZE)

    image_array = np.asarray(image, dtype=np.float32)

    # Keep preprocessing consistent with the training pipeline.
    # This default assumes the model was trained with pixels / 255.
    image_array = image_array / 255.0

    return np.expand_dims(image_array, axis=0)


# ============================================================
# MODEL PREDICTION
# ============================================================

def predict_single_image(file_storage):
    """Predict skin concern for one image."""

    if skin_model is None:
        raise RuntimeError(
            "The trained AI model is unavailable. "
            "Check the model file path and TensorFlow logs."
        )

    processed = preprocess_image(file_storage)

    prediction_array = skin_model.predict(
        processed,
        verbose=0,
    )

    probabilities = np.asarray(prediction_array[0], dtype=float)

    if probabilities.size == 0:
        raise RuntimeError("The AI model returned no predictions.")

    predicted_index = int(np.argmax(probabilities))

    prediction_label = class_indices.get(
        predicted_index,
        f"class_{predicted_index}",
    )

    confidence = float(probabilities[predicted_index])

    all_probabilities = {}

    for index, probability in enumerate(probabilities):
        label = class_indices.get(index, f"class_{index}")
        all_probabilities[label] = float(probability)

    return {
        "prediction": prediction_label,
        "label": prediction_label,
        "confidence": confidence,
        "probabilities": all_probabilities,
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "success": True,
        "message": "AI Skincare Python AI Service is running!",
        "service": "python",
        "port": PORT,
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "success": True,
        "status": "online",
        "python": "running",
        "mongodb": "connected" if mongodb_ready() else "disconnected",
        "model_loaded": skin_model is not None,
        "class_count": len(class_indices),
    })


# ============================================================
# REGISTER
# ============================================================

@app.route("/register", methods=["POST"])
@app.route("/api/register", methods=["POST"])
def register():
    if not mongodb_ready():
        return jsonify({
            "success": False,
            "message": "MongoDB is not connected.",
        }), 503

    try:
        data = request.get_json(silent=True) or {}

        name = str(
            data.get("name") or data.get("username") or "User"
        ).strip()

        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", ""))

        if not email or not password:
            return jsonify({
                "success": False,
                "message": "Email and password are required.",
            }), 400

        if len(password) < 6:
            return jsonify({
                "success": False,
                "message": "Password must contain at least 6 characters.",
            }), 400

        if users_col.find_one({"email": email}):
            return jsonify({
                "success": False,
                "message": "User already exists.",
            }), 409

        hashed_password = bcrypt.generate_password_hash(
            password
        ).decode("utf-8")

        user_document = {
            "name": name,
            "email": email,
            "password": hashed_password,
            "createdAt": datetime.datetime.now(datetime.timezone.utc),
        }

        result = users_col.insert_one(user_document)

        token = jwt.encode(
            {
                "user_id": str(result.inserted_id),
                "email": email,
                "role": "user",
                "exp": datetime.datetime.now(
                    datetime.timezone.utc
                ) + datetime.timedelta(days=7),
            },
            SECRET_KEY,
            algorithm=JWT_ALGORITHM,
        )

        return jsonify({
            "success": True,
            "message": "Registration successful.",
            "token": token,
            "user": {
                "id": str(result.inserted_id),
                "_id": str(result.inserted_id),
                "name": name,
                "username": name,
                "email": email,
                "role": "user",
                "isAdmin": False,
            },
        }), 201

    except Exception as error:
        print("Python registration error:", str(error))

        return jsonify({
            "success": False,
            "message": "Registration failed.",
        }), 500


# ============================================================
# LOGIN
# ============================================================

@app.route("/login", methods=["POST"])
@app.route("/api/login", methods=["POST"])
def login():
    if not mongodb_ready():
        return jsonify({
            "success": False,
            "message": "MongoDB is not connected.",
        }), 503

    try:
        data = request.get_json(silent=True) or {}

        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", ""))

        if not email or not password:
            return jsonify({
                "success": False,
                "message": "Email and password are required.",
            }), 400

        user = users_col.find_one({"email": email})

        if not user:
            return jsonify({
                "success": False,
                "message": "Invalid email or password.",
            }), 401

        stored_password = user.get("password", "")

        if not bcrypt.check_password_hash(
            stored_password,
            password,
        ):
            return jsonify({
                "success": False,
                "message": "Invalid email or password.",
            }), 401

        user_id = str(user["_id"])

        token = jwt.encode(
            {
                "user_id": user_id,
                "email": email,
                "role": "user",
                "exp": datetime.datetime.now(
                    datetime.timezone.utc
                ) + datetime.timedelta(days=7),
            },
            SECRET_KEY,
            algorithm=JWT_ALGORITHM,
        )

        return jsonify({
            "success": True,
            "message": "Login successful.",
            "token": token,
            "user": {
                "id": user_id,
                "_id": user_id,
                "name": user.get("name", "User"),
                "username": user.get("name", "User"),
                "email": email,
                "role": "user",
                "isAdmin": False,
            },
        })

    except Exception as error:
        print("Python login error:", str(error))

        return jsonify({
            "success": False,
            "message": "Login failed.",
        }), 500


# ============================================================
# SKIN ANALYSIS / PREDICT
# ============================================================

@app.route("/predict", methods=["POST"])
def predict():
    # Verify the original JWT forwarded by Node.
    authenticated_user, auth_error = get_user_from_token()

    if auth_error:
        return jsonify({
            "success": False,
            "message": auth_error,
        }), 401

    if not mongodb_ready():
        return jsonify({
            "success": False,
            "message": "MongoDB is not connected.",
        }), 503

    if skin_model is None:
        return jsonify({
            "success": False,
            "message": (
                "The trained skin model is not loaded. "
                "Check the model file and restart the Python service."
            ),
        }), 503

    user_id = authenticated_user["user_id"]
    mongo_user_id = safe_object_id(user_id)

    if mongo_user_id is None:
        return jsonify({
            "success": False,
            "message": "Invalid authenticated user ID.",
        }), 401

    try:
        # Optional consistency check against the authenticated identity.
        forwarded_user_id = request.headers.get("X-User-ID")

        if forwarded_user_id and forwarded_user_id != user_id:
            return jsonify({
                "success": False,
                "message": "User ID does not match authenticated token.",
            }), 403

        image_fields = ("front", "left", "right")
        image_predictions = []
        image_flags = {}

        for field in image_fields:
            uploaded = request.files.get(field)

            if not uploaded or not uploaded.filename:
                image_flags[field] = False
                continue

            if not allowed_file(uploaded.filename):
                return jsonify({
                    "success": False,
                    "message": (
                        f"Unsupported image type for {field}. "
                        "Use JPG, JPEG, PNG, or WEBP."
                    ),
                }), 400

            image_flags[field] = True

            prediction_result = predict_single_image(uploaded)

            image_predictions.append({
                "angle": field,
                **prediction_result,
            })

        if not image_predictions:
            return jsonify({
                "success": False,
                "message": "Please upload at least one image.",
            }), 400

        # Average probabilities across available angles.
        probability_keys = set()

        for item in image_predictions:
            probability_keys.update(
                item["probabilities"].keys()
            )

        averaged_probabilities = {}

        for label in probability_keys:
            values = [
                item["probabilities"].get(label, 0.0)
                for item in image_predictions
            ]

            averaged_probabilities[label] = float(
                np.mean(values)
            )

        best_label = max(
            averaged_probabilities,
            key=averaged_probabilities.get,
        )

        confidence = float(
            averaged_probabilities[best_label]
        )

        user_data = {
            "gender": request.form.get("gender", ""),
            "age": request.form.get("age", ""),
            "sleep": request.form.get("sleep", ""),
            "concern": request.form.get("concern", ""),
            "secondaryConcern": request.form.get(
                "secondaryConcern", ""
            ),
            "sensitivity": request.form.get("sensitivity", ""),
            "waterIntake": request.form.get("waterIntake", ""),
            "climate": request.form.get("climate", ""),
            "lighting": request.form.get("lighting", ""),
        }

        analysis_result = {
            "prediction": best_label,
            "label": best_label,
            "concern": best_label,
            "confidence": confidence,
            "confidence_score": confidence,
            "probabilities": averaged_probabilities,
            "images": image_flags,
            "individual_predictions": image_predictions,
            "userData": user_data,
        }

        # Save one scan record. Node also saves the returned result
        # in its own upload route; avoid depending on Python history
        # for the Node application's /api/history endpoint.
        scan_document = {
            "userId": mongo_user_id,
            "userEmail": authenticated_user.get("email", ""),
            "prediction": best_label,
            "label": best_label,
            "concern": best_label,
            "confidence": confidence,
            "analysis": analysis_result,
            "result": analysis_result,
            "userData": user_data,
            "images": image_flags,
            "createdAt": datetime.datetime.now(
                datetime.timezone.utc
            ),
        }

        saved_scan = scans_col.insert_one(scan_document)

        return jsonify({
            "success": True,
            "message": "Skin analysis completed successfully.",
            "scan_id": str(saved_scan.inserted_id),
            "prediction": best_label,
            "label": best_label,
            "concern": best_label,
            "confidence": confidence,
            "confidence_score": confidence,
            "probability": confidence,
            "probabilities": averaged_probabilities,
            "images": image_flags,
            "individual_predictions": image_predictions,
            "userData": user_data,
            "analysis": analysis_result,
            "result": analysis_result,
        })

    except Exception as error:
        print("Skin prediction error:", str(error))
        traceback.print_exc()

        return jsonify({
            "success": False,
            "message": "Failed to process skin analysis.",
        }), 500


# ============================================================
# USER SCAN HISTORY
# ============================================================

@app.route("/history", methods=["GET"])
@app.route("/api/history", methods=["GET"])
def history():
    authenticated_user, auth_error = get_user_from_token()

    if auth_error:
        return jsonify({
            "success": False,
            "message": auth_error,
        }), 401

    if not mongodb_ready():
        return jsonify({
            "success": False,
            "message": "MongoDB is not connected.",
        }), 503

    try:
        user_object_id = safe_object_id(
            authenticated_user["user_id"]
        )

        scans = list(
            scans_col.find({
                "userId": user_object_id,
            })
            .sort("createdAt", -1)
            .limit(100)
        )

        return jsonify({
            "success": True,
            "count": len(scans),
            "history": json_safe(scans),
        })

    except Exception as error:
        print("History error:", str(error))

        return jsonify({
            "success": False,
            "message": "Unable to fetch scan history.",
        }), 500


# ============================================================
# PUBLIC REVIEWS
# ============================================================

@app.route("/reviews", methods=["GET"])
@app.route("/api/reviews", methods=["GET"])
def get_reviews():
    if not mongodb_ready():
        return jsonify({
            "success": False,
            "message": "MongoDB is not connected.",
        }), 503

    try:
        reviews = list(
            reviews_col.find({})
            .sort("createdAt", -1)
            .limit(100)
        )

        return jsonify({
            "success": True,
            "reviews": json_safe(reviews),
        })

    except Exception as error:
        print("Reviews error:", str(error))

        return jsonify({
            "success": False,
            "message": "Unable to fetch reviews.",
        }), 500


# ============================================================
# ADD REVIEW
# ============================================================

@app.route("/reviews", methods=["POST"])
@app.route("/api/reviews", methods=["POST"])
def add_review():
    authenticated_user, auth_error = get_user_from_token()

    if auth_error:
        return jsonify({
            "success": False,
            "message": auth_error,
        }), 401

    if not mongodb_ready():
        return jsonify({
            "success": False,
            "message": "MongoDB is not connected.",
        }), 503

    try:
        data = request.get_json(silent=True) or {}

        review_text = str(data.get("text", "")).strip()

        if not review_text:
            return jsonify({
                "success": False,
                "message": "Review text is required.",
            }), 400

        try:
            rating = int(data.get("rating", 5))
        except (TypeError, ValueError):
            rating = 5

        rating = min(max(rating, 1), 5)

        review_document = {
            "userId": safe_object_id(
                authenticated_user["user_id"]
            ),
            "user": authenticated_user.get("email", "Anonymous"),
            "text": review_text,
            "rating": rating,
            "createdAt": datetime.datetime.now(
                datetime.timezone.utc
            ),
        }

        result = reviews_col.insert_one(review_document)
        review_document["_id"] = result.inserted_id

        return jsonify({
            "success": True,
            "message": "Review submitted successfully.",
            "review": json_safe(review_document),
        }), 201

    except Exception as error:
        print("Add review error:", str(error))

        return jsonify({
            "success": False,
            "message": "Unable to submit review.",
        }), 500


# ============================================================
# ERROR HANDLERS
# ============================================================

@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({
        "success": False,
        "message": "Image upload exceeds the 10 MB limit.",
    }), 413


@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "message": "Python AI endpoint not found.",
    }), 404


@app.errorhandler(Exception)
def handle_unexpected_error(error):
    print("Unexpected Flask error:", str(error))

    return jsonify({
        "success": False,
        "message": "Internal Python AI service error.",
    }), 500


# ============================================================
# START PYTHON AI SERVER
# ============================================================

if __name__ == "__main__":
    print("")
    print("=" * 55)
    print("       AI SKINCARE PYTHON AI SERVICE")
    print("=" * 55)
    print(f"Python service: http://127.0.0.1:{PORT}")
    print(f"MongoDB status: {'connected' if mongodb_ready() else 'disconnected'}")
    print(f"AI model loaded: {'yes' if skin_model is not None else 'no'}")
    print(f"Class count: {len(class_indices)}")
    print("=" * 55)
    print("")

    app.run(
        host="127.0.0.1",
        port=PORT,
        debug=False,
        use_reloader=False,
    )