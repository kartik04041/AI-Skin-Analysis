
# ============================================================
# AI SKINCARE ANALYSIS SYSTEM
# evaluate_model.py
# MobileNetV2: Final Test Evaluation
# ============================================================

import json
from pathlib import Path

import numpy as np
import pandas as pd
import tensorflow as tf
import matplotlib.pyplot as plt

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support,
)

# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "model" / "skin_model.keras"
CLASS_INDICES_PATH = BASE_DIR / "model" / "class_indices.json"

# Test data must be separate from training and validation data.
TEST_DIR = BASE_DIR.parent / "dataset" / "test"

REPORT_DIR = BASE_DIR / "evaluation_results"
REPORT_DIR.mkdir(parents=True, exist_ok=True)

IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32

# ============================================================
# CHECK FILES
# ============================================================

if not MODEL_PATH.is_file():
    raise FileNotFoundError(
        f"Trained model not found: {MODEL_PATH}"
    )

if not TEST_DIR.is_dir():
    raise FileNotFoundError(
        f"Test dataset not found: {TEST_DIR}\n"
        "Create dataset/test/ with one subfolder per class. "
        "Do not use training images as final test images."
    )

print("\n" + "=" * 65)
print("AI SKIN ANALYSIS - FINAL MODEL EVALUATION")
print("=" * 65)

# ============================================================
# LOAD MODEL
# ============================================================

print("\nLoading trained model...")

model = tf.keras.models.load_model(str(MODEL_PATH))

print("Model loaded successfully.")
print("Model input shape:", model.input_shape)
print("Model output shape:", model.output_shape)

# ============================================================
# LOAD CLASS LABELS
# ============================================================

saved_labels = {}

if CLASS_INDICES_PATH.is_file():
    with open(CLASS_INDICES_PATH, "r", encoding="utf-8") as file:
        raw_labels = json.load(file)

    # Supports {"0": "Acne", "1": "Dry", ...}
    # and {"acne": 0, "dry": 1, ...}
    if raw_labels and all(
        str(key).isdigit() for key in raw_labels
    ):
        saved_labels = {
            int(key): str(value)
            for key, value in raw_labels.items()
        }
    elif raw_labels and all(
        isinstance(value, (int, float))
        for value in raw_labels.values()
    ):
        saved_labels = {
            int(index): str(label)
            for label, index in raw_labels.items()
        }

# ============================================================
# LOAD TEST DATA
# ============================================================

test_dataset = tf.keras.utils.image_dataset_from_directory(
    str(TEST_DIR),
    labels="inferred",
    label_mode="int",
    image_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    shuffle=False,
)

folder_classes = test_dataset.class_names

# Training used ImageDataGenerator(rescale=1./255).
# Apply the same pixel scaling during evaluation.
test_dataset = test_dataset.map(
    lambda images, labels: (
        tf.cast(images, tf.float32) / 255.0,
        labels,
    ),
    num_parallel_calls=tf.data.AUTOTUNE,
).prefetch(tf.data.AUTOTUNE)

number_of_classes = len(folder_classes)
model_output_classes = int(model.output_shape[-1])

if number_of_classes != model_output_classes:
    raise ValueError(
        f"Test folders contain {number_of_classes} classes, "
        f"but model predicts {model_output_classes} classes. "
        "Check your dataset and training labels."
    )

# Verify that the folder class order agrees with the order
# used when training the model.
if saved_labels:
    expected_labels = [
        saved_labels.get(index) for index in range(number_of_classes)
    ]

    normalized_expected = [
        str(label).strip().lower() for label in expected_labels
    ]
    normalized_folders = [
        str(label).strip().lower() for label in folder_classes
    ]

    if (
        any(label is None for label in expected_labels)
        or normalized_expected != normalized_folders
    ):
        raise ValueError(
            "\nClass order mismatch!\n"
            f"Saved model labels by index: {expected_labels}\n"
            f"Test folder order: {folder_classes}\n"
            "Do not calculate metrics until the class-index mapping "
            "matches the mapping used during training."
        )

class_names = [
    saved_labels.get(index, folder_classes[index])
    for index in range(number_of_classes)
]

print("\nClasses:", class_names)

# ============================================================
# PREDICT
# ============================================================

print("\nEvaluating test images...")

y_true_batches = []
y_probability_batches = []

for images, labels in test_dataset:
    probabilities = model.predict(images, verbose=0)

    y_true_batches.extend(labels.numpy().tolist())
    y_probability_batches.extend(probabilities.tolist())

y_true = np.asarray(y_true_batches, dtype=int)
y_probabilities = np.asarray(y_probability_batches)

if len(y_true) == 0:
    raise ValueError("The test dataset contains no images.")

if not np.isfinite(y_probabilities).all():
    raise ValueError("Model predictions contain invalid values.")

if y_probabilities.shape[1] != number_of_classes:
    raise ValueError("Prediction output does not match class count.")

y_pred = np.argmax(y_probabilities, axis=1)

# ============================================================
# METRICS
# ============================================================

test_accuracy = accuracy_score(y_true, y_pred)

precision, recall, f1, support = precision_recall_fscore_support(
    y_true,
    y_pred,
    labels=list(range(number_of_classes)),
    zero_division=0,
)

report_dict = classification_report(
    y_true,
    y_pred,
    labels=list(range(number_of_classes)),
    target_names=class_names,
    output_dict=True,
    zero_division=0,
)

matrix = confusion_matrix(
    y_true,
    y_pred,
    labels=list(range(number_of_classes)),
)

# ============================================================
# DISPLAY FINAL RESULTS
# ============================================================

print("\n" + "=" * 65)
print("FINAL TEST RESULTS")
print("=" * 65)

print(f"Total test images : {len(y_true)}")
print(f"Correct predictions: {int(np.sum(y_true == y_pred))}")
print(f"Incorrect predictions: {int(np.sum(y_true != y_pred))}")
print(f"FINAL TEST ACCURACY: {test_accuracy * 100:.2f}%")

print("\nCLASS-WISE EVALUATION")
print("-" * 75)
print(
    f"{'Class':<20} {'Precision':>10} {'Recall':>10} "
    f"{'F1-score':>10} {'Support':>10}"
)
print("-" * 75)

for index, class_name in enumerate(class_names):
    print(
        f"{class_name:<20} "
        f"{precision[index]:>10.4f} "
        f"{recall[index]:>10.4f} "
        f"{f1[index]:>10.4f} "
        f"{support[index]:>10}"
    )

print("-" * 75)
print(
    f"{'Macro average':<20} "
    f"{report_dict['macro avg']['precision']:>10.4f} "
    f"{report_dict['macro avg']['recall']:>10.4f} "
    f"{report_dict['macro avg']['f1-score']:>10.4f}"
)

print(
    f"{'Weighted average':<20} "
    f"{report_dict['weighted avg']['precision']:>10.4f} "
    f"{report_dict['weighted avg']['recall']:>10.4f} "
    f"{report_dict['weighted avg']['f1-score']:>10.4f}"
)

# ============================================================
# SAVE TEXT REPORT
# ============================================================

report_text = classification_report(
    y_true,
    y_pred,
    labels=list(range(number_of_classes)),
    target_names=class_names,
    digits=4,
    zero_division=0,
)

with open(
    REPORT_DIR / "final_evaluation_report.txt",
    "w",
    encoding="utf-8",
) as file:
    file.write("AI SKIN ANALYSIS - FINAL TEST EVALUATION\n")
    file.write("=" * 50 + "\n")
    file.write(f"Model: {MODEL_PATH.name}\n")
    file.write(f"Test directory: {TEST_DIR}\n")
    file.write(f"Test images: {len(y_true)}\n")
    file.write(f"Test accuracy: {test_accuracy * 100:.2f}%\n\n")
    file.write(report_text)
    file.write("\nConfusion matrix:\n")
    file.write(np.array2string(matrix))

# ============================================================
# SAVE CLASS-WISE CSV
# ============================================================

metrics_df = pd.DataFrame({
    "Class": class_names,
    "Precision": precision,
    "Recall": recall,
    "F1_Score": f1,
    "Support": support,
})

metrics_df.to_csv(
    REPORT_DIR / "class_wise_metrics.csv",
    index=False,
)

# ============================================================
# SAVE ALL TEST PREDICTIONS
# ============================================================

prediction_data = {
    "Actual_Class": [class_names[i] for i in y_true],
    "Predicted_Class": [class_names[i] for i in y_pred],
    "Correct": (y_true == y_pred),
}

for index, class_name in enumerate(class_names):
    safe_name = "".join(
        char if char.isalnum() else "_"
        for char in class_name
    )
    prediction_data[f"Probability_{safe_name}"] = (
        y_probabilities[:, index]
    )

predictions_df = pd.DataFrame(prediction_data)

predictions_df.to_csv(
    REPORT_DIR / "test_predictions.csv",
    index=False,
)

# ============================================================
# SAVE CONFUSION MATRIX
# ============================================================

fig, ax = plt.subplots(figsize=(10, 8))

image = ax.imshow(matrix, interpolation="nearest")
fig.colorbar(image, ax=ax)

ax.set(
    xticks=np.arange(number_of_classes),
    yticks=np.arange(number_of_classes),
    xticklabels=class_names,
    yticklabels=class_names,
    xlabel="Predicted class",
    ylabel="Actual class",
    title="MobileNetV2 - Test Confusion Matrix",
)

plt.setp(
    ax.get_xticklabels(),
    rotation=45,
    ha="right",
    rotation_mode="anchor",
)

threshold = matrix.max() / 2 if matrix.size else 0

for row in range(matrix.shape[0]):
    for column in range(matrix.shape[1]):
        ax.text(
            column,
            row,
            str(matrix[row, column]),
            ha="center",
            va="center",
            color="white" if matrix[row, column] > threshold else "black",
        )

fig.tight_layout()
fig.savefig(
    REPORT_DIR / "confusion_matrix.png",
    dpi=200,
    bbox_inches="tight",
)
plt.close(fig)

# ============================================================
# FINISHED
# ============================================================

print("\nEvaluation files saved to:")
print(REPORT_DIR.resolve())
print("\nGenerated files:")
print("- final_evaluation_report.txt")
print("- class_wise_metrics.csv")
print("- test_predictions.csv")
print("- confusion_matrix.png")
print("\nEvaluation completed.")
