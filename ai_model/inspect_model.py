
import json
from pathlib import Path
import tensorflow as tf
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = ROOT / "ai_model" / "model" / "skin_model.keras"
CLASS_PATH = ROOT / "ai_model" / "model" / "class_indices.json"
CSV_PATH = ROOT / "dataset" / "final_2000" / "metadata_final.csv"

print("=== SAVED MODEL ===")
model = tf.keras.models.load_model(str(MODEL_PATH), compile=False)
print("Input shape:", model.input_shape)
print("Output shape:", model.output_shape)

with open(CLASS_PATH, encoding="utf-8") as f:
    classes = json.load(f)

print("\nModel class mapping:")
print(json.dumps(classes, indent=2))

print("\n=== DATASET ===")
df = pd.read_csv(CSV_PATH)
print("Image count:", len(df))
print("Dataset classes:")
print(df["label"].value_counts().to_string())

print("\n=== COMPARISON ===")
model_classes = set(classes.values())
dataset_classes = set(df["label"].astype(str).str.strip())

print("Model classes:", sorted(model_classes))
print("Dataset classes:", sorted(dataset_classes))
print("Same classes:", model_classes == dataset_classes)

print("\nThis script only inspects files; it does not retrain the model.")
