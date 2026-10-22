
import json
from pathlib import Path

import numpy as np
import tensorflow as tf
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)
from tensorflow.keras.preprocessing.image import ImageDataGenerator


# --------------------------------------------------
# PATHS
# --------------------------------------------------
PROJECT_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = PROJECT_DIR / "ai_model" / "model" / "skin_model.keras"
CLASS_PATH = PROJECT_DIR / "ai_model" / "model" / "class_indices.json"
TEST_DIR = PROJECT_DIR / "dataset" / "test"
RESULTS_DIR = PROJECT_DIR / "ai_model" / "evaluation_results"

IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32


def main():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

    if not CLASS_PATH.exists():
        raise FileNotFoundError(f"Class mapping not found: {CLASS_PATH}")

    if not TEST_DIR.exists():
        raise FileNotFoundError(
            f"Test dataset not found: {TEST_DIR}\n"
            "Create a correctly labeled test dataset first."
        )

    with open(CLASS_PATH, "r", encoding="utf-8") as file:
        class_mapping = json.load(file)

    # class_indices.json stores output-index -> class-name.
    model_classes = [
        class_mapping[str(i)]
        for i in range(len(class_mapping))
    ]

    model = tf.keras.models.load_model(
        str(MODEL_PATH),
        compile=False
    )

    output_classes = int(model.output_shape[-1])

    if output_classes != len(model_classes):
        raise ValueError(
            f"Model outputs {output_classes} classes, "
            f"but class_indices.json has {len(model_classes)}."
        )

    # Read images in the same pixel range used by app.py.
    generator = ImageDataGenerator(rescale=1.0 / 255.0)

    test_data = generator.flow_from_directory(
        str(TEST_DIR),
        target_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        shuffle=False
    )

    dataset_classes = list(test_data.class_indices.keys())

    # Do not silently evaluate mismatched labels.
    if set(dataset_classes) != set(model_classes):
        raise ValueError(
            "\nClass mismatch. Evaluation stopped.\n"
            f"Model classes: {model_classes}\n"
            f"Test dataset classes: {dataset_classes}\n\n"
            "The test folder must contain the same six classes "
            "as the saved model, with correct ground-truth labels."
        )

    # Ensure the dataset's one-hot positions match model output positions.
    expected_indices = {
        name: index for index, name in enumerate(model_classes)
    }

    if test_data.class_indices != expected_indices:
        raise ValueError(
            "\nClass index order mismatch.\n"
            f"Expected: {expected_indices}\n"
            f"Found: {test_data.class_indices}\n"
            "Rename/reorganize the folders only when their true labels "
            "are correct, then verify the mapping again."
        )

    probabilities = model.predict(test_data, verbose=1)
    y_pred = np.argmax(probabilities, axis=1)
    y_true = test_data.classes

    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(
        y_true, y_pred, average="macro", zero_division=0
    )
    recall = recall_score(
        y_true, y_pred, average="macro", zero_division=0
    )
    f1 = f1_score(
        y_true, y_pred, average="macro", zero_division=0
    )

    report = classification_report(
        y_true,
        y_pred,
        labels=list(range(len(model_classes))),
        target_names=model_classes,
        zero_division=0
    )

    matrix = confusion_matrix(
        y_true,
        y_pred,
        labels=list(range(len(model_classes)))
    )

    print("\n========== MODEL EVALUATION ==========")
    print(f"Test images : {len(y_true)}")
    print(f"Accuracy    : {accuracy * 100:.2f}%")
    print(f"Macro Precision: {precision * 100:.2f}%")
    print(f"Macro Recall   : {recall * 100:.2f}%")
    print(f"Macro F1-score : {f1 * 100:.2f}%")

    print("\nClassification Report:")
    print(report)

    print("Confusion Matrix:")
    print(matrix)

    # Save metrics and reports separately from the model.
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    metrics = {
        "test_images": int(len(y_true)),
        "accuracy_percent": round(float(accuracy * 100), 2),
        "macro_precision_percent": round(float(precision * 100), 2),
        "macro_recall_percent": round(float(recall * 100), 2),
        "macro_f1_score_percent": round(float(f1 * 100), 2),
        "model_classes": model_classes,
    }

    with open(
        RESULTS_DIR / "metrics.json", "w", encoding="utf-8"
    ) as file:
        json.dump(metrics, file, indent=4)

    with open(
        RESULTS_DIR / "classification_report.txt",
        "w",
        encoding="utf-8"
    ) as file:
        file.write(report)
        file.write("\nConfusion Matrix:\n")
        file.write(np.array2string(matrix))

    print(f"\nResults saved to: {RESULTS_DIR}")


if __name__ == "__main__":
    main()
