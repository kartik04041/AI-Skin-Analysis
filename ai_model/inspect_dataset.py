
from pathlib import Path
import json
import tensorflow as tf

BASE_DIR = Path(r"C:\Users\KARTIK\Downloads\AI SKIN")
MODEL_DIR = BASE_DIR / "ai_model" / "model"

print("\n========== MODEL FILES ==========")

model_files = [
    MODEL_DIR / "skin_model.keras",
    MODEL_DIR / "skin_model.h5",
    BASE_DIR / "ai_model" / "skin_model.keras",
    BASE_DIR / "ai_model" / "skin_model.h5",
]

existing_models = [p for p in model_files if p.exists()]

if not existing_models:
    print("No skin_model.keras or skin_model.h5 found.")
    print("Search for model files:")
    for p in BASE_DIR.rglob("*"):
        if p.is_file() and p.suffix.lower() in {".keras", ".h5"}:
            print(p)
    raise SystemExit("Find the model file before evaluation.")

for path in existing_models:
    print("\nModel:", path)

    try:
        model = tf.keras.models.load_model(path, compile=False)
        print("Input shape:", model.input_shape)
        print("Output shape:", model.output_shape)

        output_shape = model.output_shape
        if isinstance(output_shape, list):
            print("Model has multiple outputs.")
        else:
            print("Number of output classes:", output_shape[-1])

    except Exception as e:
        print("Could not load model:", e)

print("\n========== CLASS MAPPING FILES ==========")

mapping_files = [
    BASE_DIR / "ai_model" / "model" / "class_indices.json",
    BASE_DIR / "ai_model" / "class_indices.json",
]

found_mapping = False

for path in mapping_files:
    if path.exists():
        found_mapping = True
        print("\nMapping file:", path)
        try:
            print(json.dumps(
                json.loads(path.read_text(encoding="utf-8")),
                indent=2
            ))
        except Exception as e:
            print("Could not read mapping:", e)

if not found_mapping:
    print("No class_indices.json found in the expected locations.")

print("\n========== CHECK COMPLETE ==========")
