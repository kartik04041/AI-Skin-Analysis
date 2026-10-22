
import os
import csv
import json
import numpy as np
import tensorflow as tf

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.layers import (
    Input,
    Dense,
    GlobalAveragePooling2D,
    Dropout,
    RandomFlip,
    RandomRotation,
    RandomZoom
)
from tensorflow.keras.models import Model
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)

DATASET_DIR = os.path.join(
    PROJECT_DIR, "dataset", "final_2000"
)

IMAGE_DIR = os.path.join(DATASET_DIR, "final_images")
METADATA_PATH = os.path.join(DATASET_DIR, "metadata_final.csv")

MODEL_DIR = os.path.join(BASE_DIR, "model")
os.makedirs(MODEL_DIR, exist_ok=True)

MODEL_PATH = os.path.join(MODEL_DIR, "skin_model.keras")
CLASS_INDICES_PATH = os.path.join(MODEL_DIR, "class_indices.json")
METRICS_PATH = os.path.join(MODEL_DIR, "evaluation_metrics.json")
REPORT_PATH = os.path.join(MODEL_DIR, "classification_report.json")

IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 8
SEED = 42
VALIDATION_SIZE = 0.20

EXPECTED_CLASSES = [
    "acne",
    "blackheads",
    "dark spots",
    "pores",
    "wrinkles"
]

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp"}

np.random.seed(SEED)
tf.random.set_seed(SEED)

# ============================================================
# VERIFY DATASET PATHS
# ============================================================

print("=" * 65)
print("AI SKINCARE ANALYSIS SYSTEM - MOBILENETV2 TRAINING")
print("=" * 65)

print("Image directory:", IMAGE_DIR)
print("Metadata file:  ", METADATA_PATH)
print("Model output:   ", MODEL_PATH)

if not os.path.isdir(IMAGE_DIR):
    raise FileNotFoundError(
        f"Image directory not found:\n{IMAGE_DIR}"
    )

if not os.path.isfile(METADATA_PATH):
    raise FileNotFoundError(
        f"Metadata CSV not found:\n{METADATA_PATH}"
    )

# ============================================================
# READ METADATA AND MATCH IMAGES
# ============================================================

image_paths = []
labels = []
missing_images = []

# Correct the spelling in the source dataset label.
# This does not alter the original CSV or image files.
LABEL_CORRECTIONS = {
    "blackheades": "blackheads"
}

with open(
    METADATA_PATH,
    "r",
    newline="",
    encoding="utf-8-sig"
) as file:
    reader = csv.DictReader(file)

    if not reader.fieldnames:
        raise ValueError("The metadata CSV has no header.")

    required_columns = {"image", "label"}

    if not required_columns.issubset(set(reader.fieldnames)):
        raise ValueError(
            "The metadata CSV must contain 'image' and 'label' columns. "
            f"Found: {reader.fieldnames}"
        )

    for row in reader:
        filename = (row.get("image") or "").strip()
        label = (row.get("label") or "").strip().lower()

        label = LABEL_CORRECTIONS.get(label, label)

        if not filename or not label:
            continue

        # Metadata filenames are expected to be simple filenames.
        # Reject paths that could point outside the image directory.
        if os.path.basename(filename) != filename:
            raise ValueError(
                f"Unexpected image path in metadata: {filename}"
            )

        if os.path.splitext(filename)[1].lower() not in IMAGE_EXTENSIONS:
            continue

        full_path = os.path.join(IMAGE_DIR, filename)

        if not os.path.isfile(full_path):
            missing_images.append(filename)
            continue

        image_paths.append(full_path)
        labels.append(label)

if not image_paths:
    raise ValueError(
        "No matching images were found. Check the CSV filenames "
        "and the final_images directory."
    )

found_classes = sorted(set(labels))

print("\nClasses found:")
for class_name in found_classes:
    print(f"  - {class_name}: {labels.count(class_name)} images")

if set(found_classes) != set(EXPECTED_CLASSES):
    raise ValueError(
        "\nDataset labels do not match the expected five classes.\n"
        f"Expected: {EXPECTED_CLASSES}\n"
        f"Found: {found_classes}\n"
        "Check metadata_final.csv before training."
    )

if missing_images:
    print(
        f"\nWarning: {len(missing_images)} metadata entries "
        "refer to missing image files."
    )
    print("First missing filenames:", missing_images[:10])

print(f"\nMatched images: {len(image_paths)}")

# ============================================================
# STRATIFIED TRAINING / VALIDATION SPLIT
# ============================================================

X = np.asarray(image_paths, dtype=str)
y = np.asarray(labels, dtype=str)

X_train, X_val, y_train, y_val = train_test_split(
    X,
    y,
    test_size=VALIDATION_SIZE,
    random_state=SEED,
    stratify=y,
    shuffle=True
)

class_names = sorted(set(y_train.tolist()))
class_to_index = {
    class_name: index
    for index, class_name in enumerate(class_names)
}

index_to_label = {
    str(index): class_name
    for class_name, index in class_to_index.items()
}

y_train_indices = np.asarray(
    [class_to_index[label] for label in y_train],
    dtype=np.int32
)

y_val_indices = np.asarray(
    [class_to_index[label] for label in y_val],
    dtype=np.int32
)

num_classes = len(class_names)

print("\nClass mapping:")
for index, class_name in enumerate(class_names):
    print(f"  {index} -> {class_name}")

print(f"\nTraining images:   {len(X_train)}")
print(f"Validation images: {len(X_val)}")
print(f"Number of classes: {num_classes}")

# Save the class mapping for the Python prediction service.
with open(
    CLASS_INDICES_PATH,
    "w",
    encoding="utf-8"
) as file:
    json.dump(index_to_label, file, indent=2)

# ============================================================
# IMAGE LOADING PIPELINE
# ============================================================

AUTOTUNE = tf.data.AUTOTUNE

def load_image(path, label):
    image_bytes = tf.io.read_file(path)

    image = tf.io.decode_image(
        image_bytes,
        channels=3,
        expand_animations=False
    )

    image.set_shape([None, None, 3])

    image = tf.image.resize(
        image,
        IMAGE_SIZE,
        antialias=True
    )

    # Keep raw pixel values until the model's preprocessing layer.
    image = tf.cast(image, tf.float32)

    label = tf.one_hot(
        label,
        depth=num_classes
    )

    return image, label


train_ds = tf.data.Dataset.from_tensor_slices(
    (X_train, y_train_indices)
)

train_ds = train_ds.shuffle(
    buffer_size=len(X_train),
    seed=SEED,
    reshuffle_each_iteration=True
)

train_ds = train_ds.map(
    load_image,
    num_parallel_calls=AUTOTUNE
)

train_ds = train_ds.batch(BATCH_SIZE).prefetch(AUTOTUNE)

val_ds = tf.data.Dataset.from_tensor_slices(
    (X_val, y_val_indices)
)

val_ds = val_ds.map(
    load_image,
    num_parallel_calls=AUTOTUNE
)

val_ds = val_ds.batch(BATCH_SIZE).prefetch(AUTOTUNE)

# ============================================================
# BUILD MOBILENETV2
# ============================================================

print("\nLoading MobileNetV2 with ImageNet pretrained weights...")

base_model = MobileNetV2(
    weights="imagenet",
    include_top=False,
    input_shape=(224, 224, 3)
)

# Initial transfer-learning stage: freeze pretrained layers.
base_model.trainable = False

inputs = Input(shape=(224, 224, 3), name="face_image")

# Augmentation runs during training only.
x = RandomFlip("horizontal", seed=SEED)(inputs)
x = RandomRotation(0.08, seed=SEED)(x)
x = RandomZoom(0.10, seed=SEED)(x)

# MobileNetV2 expects pixels scaled to [-1, 1].
x = tf.keras.layers.Lambda(
    preprocess_input,
    name="mobilenetv2_preprocessing"
)(x)

x = base_model(x, training=False)
x = GlobalAveragePooling2D()(x)
x = Dropout(0.30)(x)

outputs = Dense(
    num_classes,
    activation="softmax",
    name="skin_concern_classification"
)(x)

model = Model(inputs=inputs, outputs=outputs)

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

model.summary()

# ============================================================
# TRAIN
# ============================================================

callbacks = [
    EarlyStopping(
        monitor="val_loss",
        patience=3,
        restore_best_weights=True,
        verbose=1
    ),
    ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.2,
        patience=2,
        min_lr=1e-6,
        verbose=1
    )
]

print("\nStarting training...")

history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=EPOCHS,
    callbacks=callbacks,
    verbose=1
)

# Save the best restored model weights.
model.save(MODEL_PATH)

print(f"\nModel saved to: {MODEL_PATH}")

# ============================================================
# VALIDATION EVALUATION
# ============================================================

print("\n" + "=" * 65)
print("VALIDATION PERFORMANCE")
print("=" * 65)

y_probabilities = model.predict(val_ds, verbose=1)
y_pred = np.argmax(y_probabilities, axis=1)
y_true = y_val_indices

if len(y_true) != len(y_pred):
    raise RuntimeError(
        f"Validation count mismatch: {len(y_true)} labels, "
        f"{len(y_pred)} predictions."
    )

labels_range = list(range(num_classes))

accuracy = accuracy_score(y_true, y_pred)

report = classification_report(
    y_true,
    y_pred,
    labels=labels_range,
    target_names=class_names,
    output_dict=True,
    zero_division=0
)

matrix = confusion_matrix(
    y_true,
    y_pred,
    labels=labels_range
)

macro_precision = report["macro avg"]["precision"]
macro_recall = report["macro avg"]["recall"]
macro_f1 = report["macro avg"]["f1-score"]

weighted_precision = report["weighted avg"]["precision"]
weighted_recall = report["weighted avg"]["recall"]
weighted_f1 = report["weighted avg"]["f1-score"]

print(f"\nValidation accuracy: {accuracy * 100:.2f}%")
print(f"Macro precision:     {macro_precision * 100:.2f}%")
print(f"Macro recall:        {macro_recall * 100:.2f}%")
print(f"Macro F1-score:      {macro_f1 * 100:.2f}%")

print("\nPer-class classification report:")
print(
    classification_report(
        y_true,
        y_pred,
        labels=labels_range,
        target_names=class_names,
        digits=4,
        zero_division=0
    )
)

print("\nConfusion matrix:")
print("Class order:", class_names)
print(matrix)

# ============================================================
# SAVE EVALUATION RESULTS
# ============================================================

def percent(value):
    return round(float(value) * 100, 2)

metrics_results = {
    "model": "MobileNetV2",
    "task": "five_class_skin_concern_classification",
    "evaluation_type": "validation",
    "dataset_directory": IMAGE_DIR,
    "metadata_file": METADATA_PATH,
    "total_matched_images": int(len(X)),
    "training_samples": int(len(X_train)),
    "validation_samples": int(len(X_val)),
    "class_labels": class_names,
    "class_indices": index_to_label,
    "accuracy_percent": percent(accuracy),
    "macro_precision_percent": percent(macro_precision),
    "macro_recall_percent": percent(macro_recall),
    "macro_f1_score_percent": percent(macro_f1),
    "weighted_precision_percent": percent(weighted_precision),
    "weighted_recall_percent": percent(weighted_recall),
    "weighted_f1_score_percent": percent(weighted_f1),
    "per_class_report": report,
    "confusion_matrix": matrix.tolist(),
    "confusion_matrix_class_order": class_names,
    "epochs_requested": EPOCHS,
    "epochs_completed": len(history.history["loss"]),
    "final_training_accuracy_percent": percent(
        history.history["accuracy"][-1]
    ),
    "final_validation_accuracy_percent": percent(
        history.history["val_accuracy"][-1]
    ),
    "final_training_loss": round(
        float(history.history["loss"][-1]), 4
    ),
    "final_validation_loss": round(
        float(history.history["val_loss"][-1]), 4
    ),
    "random_seed": SEED,
    "validation_split": VALIDATION_SIZE,
    "notes": (
        "Metrics are measured on the validation split. "
        "They are not independent test-set results."
    )
}

with open(
    METRICS_PATH,
    "w",
    encoding="utf-8"
) as file:
    json.dump(metrics_results, file, indent=2)

with open(
    REPORT_PATH,
    "w",
    encoding="utf-8"
) as file:
    json.dump(report, file, indent=2)

print("\n" + "=" * 65)
print("TRAINING AND VALIDATION COMPLETED")
print("=" * 65)
print("Model:              ", MODEL_PATH)
print("Class mapping:      ", CLASS_INDICES_PATH)
print("Evaluation metrics: ", METRICS_PATH)
print("Classification JSON:", REPORT_PATH)
print("\nUse the measured validation values in your report.")
print("Do not describe these values as independent test accuracy.")
print("=" * 65)
