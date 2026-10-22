
import json
import csv
from pathlib import Path

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.preprocessing.image import load_img, img_to_array

ROOT = Path(__file__).resolve().parent.parent

MODEL_PATH = ROOT / "ai_model" / "model" / "skin_model.keras"
CLASS_PATH = ROOT / "ai_model" / "model" / "class_indices.json"
DATA_DIR = ROOT / "dataset" / "final_2000" / "final_images"
CSV_PATH = ROOT / "dataset" / "final_2000" / "metadata_final.csv"
OUT_DIR = ROOT / "ai_model" / "evaluation_results"

OUT_DIR.mkdir(parents=True, exist_ok=True)

# Load existing model; do not train or save it.
model = tf.keras.models.load_model(str(MODEL_PATH), compile=False)

with open(CLASS_PATH, encoding="utf-8") as f:
    class_map = json.load(f)

class_names = [
    class_map[str(i)] for i in range(model.output_shape[-1])
]

metadata = pd.read_csv(CSV_PATH)

results = []
missing = 0

for _, row in metadata.iterrows():
    image_path = DATA_DIR / str(row["image"])

    if not image_path.exists():
        missing += 1
        continue

    try:
        image = load_img(image_path, target_size=(224, 224))
        image = img_to_array(image).astype("float32") / 255.0

        probabilities = model.predict(
            np.expand_dims(image, axis=0), verbose=0
        )[0]

        predicted_index = int(np.argmax(probabilities))

        results.append({
            "image": row["image"],
            "dataset_label": row["label"],
            "predicted_class": class_names[predicted_index],
            "top_confidence_percent":
                round(float(probabilities[predicted_index] * 100), 2)
        })

    except Exception as error:
        print(f"Could not process {row['image']}: {error}")

if not results:
    raise RuntimeError(
        "No images processed. Check DATA_DIR and the CSV filenames."
    )

df = pd.DataFrame(results)

print("\n=== EXISTING MODEL PREDICTION SUMMARY ===")
print("Images processed:", len(df))
print("Images missing:", missing)
print(
    "Mean top prediction confidence:",
    f"{df['top_confidence_percent'].mean():.2f}%"
)
print(
    "Median top prediction confidence:",
    f"{df['top_confidence_percent'].median():.2f}%"
)

print("\nPredicted class distribution:")
print(df["predicted_class"].value_counts().to_string())

df.to_csv(OUT_DIR / "prediction_summary.csv", index=False)

print("\nSaved prediction details to:")
print(OUT_DIR / "prediction_summary.csv")

print(
    "\nAccuracy, precision, recall and F1-score were not calculated "
    "because dataset labels are incompatible with model output classes."
)
