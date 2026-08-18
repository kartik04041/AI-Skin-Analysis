import os
import csv
import hashlib
from PIL import Image

# ============================================================
# SETTINGS
# ============================================================

DATASET_DIR = r"C:\Users\KARTIK\Downloads\AI SKIN\dataset\final_2000"

IMAGE_DIR = os.path.join(DATASET_DIR, "images")
CSV_FILE = os.path.join(DATASET_DIR, "metadata.csv")

EXPECTED_TOTAL = 2000
EXPECTED_PER_CLASS = 400

EXPECTED_CLASSES = {
    "acne": 400,
    "blackheades": 400,
    "dark spots": 400,
    "pores": 400,
    "wrinkles": 400
}

VALID_EXTENSIONS = (
    ".jpg",
    ".jpeg",
    ".png",
    ".webp"
)


# ============================================================
# FUNCTIONS
# ============================================================

def get_file_hash(file_path):
    """
    Creates a unique hash for an image.
    Used to detect duplicate images.
    """
    hash_md5 = hashlib.md5()

    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)

    return hash_md5.hexdigest()


# ============================================================
# START VALIDATION
# ============================================================

print("=" * 70)
print("AI SKIN ANALYSIS - DATASET VALIDATION")
print("=" * 70)


# ============================================================
# CHECK DATASET FOLDER
# ============================================================

if not os.path.exists(DATASET_DIR):
    print("\nERROR: Dataset folder does not exist:")
    print(DATASET_DIR)
    exit()

if not os.path.exists(IMAGE_DIR):
    print("\nERROR: Images folder does not exist:")
    print(IMAGE_DIR)
    exit()

if not os.path.exists(CSV_FILE):
    print("\nERROR: metadata.csv does not exist:")
    print(CSV_FILE)
    exit()


# ============================================================
# GET IMAGE FILES
# ============================================================

image_files = [
    file for file in os.listdir(IMAGE_DIR)
    if file.lower().endswith(VALID_EXTENSIONS)
]

print("\n1. IMAGE COUNT")
print("-" * 70)

print("Images found:", len(image_files))
print("Expected:", EXPECTED_TOTAL)

if len(image_files) == EXPECTED_TOTAL:
    print("STATUS: PASS")
else:
    print("STATUS: WARNING")


# ============================================================
# READ CSV
# ============================================================

print("\n2. CSV VALIDATION")
print("-" * 70)

metadata = []

with open(
    CSV_FILE,
    "r",
    encoding="utf-8"
) as csv_file:

    reader = csv.DictReader(csv_file)

    for row in reader:
        metadata.append(row)

print("CSV records:", len(metadata))
print("Expected:", EXPECTED_TOTAL)

if len(metadata) == EXPECTED_TOTAL:
    print("STATUS: PASS")
else:
    print("STATUS: WARNING")


# ============================================================
# CHECK CSV COLUMNS
# ============================================================

required_columns = [
    "image",
    "label"
]

csv_columns = metadata[0].keys() if metadata else []

print("\n3. CSV COLUMNS")
print("-" * 70)

print("Columns found:", list(csv_columns))

missing_columns = [
    column
    for column in required_columns
    if column not in csv_columns
]

if not missing_columns:
    print("STATUS: PASS")
else:
    print("Missing columns:", missing_columns)
    print("STATUS: FAIL")


# ============================================================
# CLASS DISTRIBUTION
# ============================================================

print("\n4. CLASS DISTRIBUTION")
print("-" * 70)

class_counts = {}

for row in metadata:

    label = row.get("label", "").strip()

    if label:
        class_counts[label] = class_counts.get(label, 0) + 1

for class_name, expected_count in EXPECTED_CLASSES.items():

    actual_count = class_counts.get(class_name, 0)

    print(
        f"{class_name:15} "
        f"Actual: {actual_count:4} "
        f"Expected: {expected_count:4}",
        end=" "
    )

    if actual_count == expected_count:
        print("PASS")
    else:
        print("WARNING")


# ============================================================
# CHECK FOR UNKNOWN CLASSES
# ============================================================

print("\n5. UNKNOWN CLASSES")
print("-" * 70)

unknown_classes = set(class_counts.keys()) - set(
    EXPECTED_CLASSES.keys()
)

if not unknown_classes:
    print("No unknown classes found.")
    print("STATUS: PASS")
else:
    print("Unknown classes:", unknown_classes)
    print("STATUS: WARNING")


# ============================================================
# CHECK MISSING IMAGES
# ============================================================

print("\n6. MISSING IMAGES")
print("-" * 70)

csv_image_names = set(
    row.get("image", "").strip()
    for row in metadata
)

actual_image_names = set(image_files)

missing_images = csv_image_names - actual_image_names

if not missing_images:
    print("No images referenced by CSV are missing.")
    print("STATUS: PASS")
else:
    print("Missing images:", len(missing_images))

    for image in list(missing_images)[:10]:
        print(" ", image)

    print("STATUS: FAIL")


# ============================================================
# CHECK EXTRA IMAGES
# ============================================================

print("\n7. EXTRA IMAGES")
print("-" * 70)

extra_images = actual_image_names - csv_image_names

if not extra_images:
    print("No extra images found.")
    print("STATUS: PASS")
else:
    print("Extra images:", len(extra_images))

    for image in list(extra_images)[:10]:
        print(" ", image)

    print("STATUS: WARNING")


# ============================================================
# CHECK CORRUPTED IMAGES
# ============================================================

print("\n8. CORRUPTED IMAGE CHECK")
print("-" * 70)

corrupted_images = []

for index, filename in enumerate(image_files, start=1):

    file_path = os.path.join(
        IMAGE_DIR,
        filename
    )

    try:

        with Image.open(file_path) as img:

            # Verify image
            img.verify()

    except Exception:

        corrupted_images.append(filename)

    # Progress
    if index % 250 == 0:
        print(
            f"Checked {index}/{len(image_files)} images..."
        )


if not corrupted_images:

    print("Corrupted images: 0")
    print("STATUS: PASS")

else:

    print(
        "Corrupted images:",
        len(corrupted_images)
    )

    for image in corrupted_images[:10]:
        print(" ", image)

    print("STATUS: FAIL")


# ============================================================
# IMAGE DIMENSION CHECK
# ============================================================

print("\n9. IMAGE DIMENSIONS")
print("-" * 70)

widths = []
heights = []
dimension_errors = []

for filename in image_files:

    file_path = os.path.join(
        IMAGE_DIR,
        filename
    )

    try:

        with Image.open(file_path) as img:

            width, height = img.size

            widths.append(width)
            heights.append(height)

    except Exception:

        dimension_errors.append(filename)


if widths and heights:

    print("Minimum width :", min(widths))
    print("Maximum width :", max(widths))
    print("Minimum height:", min(heights))
    print("Maximum height:", max(heights))

    print("STATUS: PASS")

else:

    print("Could not read image dimensions.")
    print("STATUS: FAIL")


# ============================================================
# DUPLICATE IMAGE CHECK
# ============================================================

print("\n10. DUPLICATE IMAGE CHECK")
print("-" * 70)

hashes = {}
duplicate_images = []

for index, filename in enumerate(image_files, start=1):

    file_path = os.path.join(
        IMAGE_DIR,
        filename
    )

    try:

        file_hash = get_file_hash(file_path)

        if file_hash in hashes:

            duplicate_images.append(
                (
                    filename,
                    hashes[file_hash]
                )
            )

        else:

            hashes[file_hash] = filename

    except Exception:
        pass

    if index % 250 == 0:
        print(
            f"Hash checked {index}/{len(image_files)} images..."
        )


if not duplicate_images:

    print("Duplicate images: 0")
    print("STATUS: PASS")

else:

    print(
        "Duplicate images:",
        len(duplicate_images)
    )

    for duplicate, original in duplicate_images[:10]:

        print(
            f" {duplicate} == {original}"
        )

    print("STATUS: WARNING")


# ============================================================
# FINAL SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("FINAL VALIDATION SUMMARY")
print("=" * 70)

print("\nTotal images:", len(image_files))
print("CSV records:", len(metadata))

print("\nClass distribution:")

for class_name in EXPECTED_CLASSES:

    print(
        f"{class_name:15}: "
        f"{class_counts.get(class_name, 0)}"
    )

print("\nCorrupted images:", len(corrupted_images))
print("Duplicate images:", len(duplicate_images))
print("Missing images:", len(missing_images))
print("Extra images:", len(extra_images))

print("\n" + "=" * 70)

if (
    len(image_files) == 2000
    and len(metadata) == 2000
    and not missing_images
    and not corrupted_images
    and not duplicate_images
    and all(
        class_counts.get(
            class_name,
            0
        ) == expected
        for class_name, expected
        in EXPECTED_CLASSES.items()
    )
):

    print("FINAL STATUS: DATASET VALIDATION PASSED")
    print("Your 2,000-image dataset is ready for the next stage.")

else:

    print("FINAL STATUS: CHECK WARNINGS/ERRORS ABOVE")

print("=" * 70)