import os
import csv
import hashlib
from PIL import Image

# ============================================================
# FINAL DATASET PATHS
# ============================================================

BASE_DIR = r"C:\Users\KARTIK\Downloads\AI SKIN"

IMAGE_DIR = os.path.join(
    BASE_DIR,
    "dataset",
    "final_2000",
    "final_images"
)

CSV_FILE = os.path.join(
    BASE_DIR,
    "dataset",
    "final_2000",
    "metadata_final.csv"
)

# ============================================================
# EXPECTED DATASET
# ============================================================

EXPECTED_TOTAL = 2000

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
# HASH FUNCTION
# ============================================================

def get_file_hash(file_path):

    md5 = hashlib.md5()

    with open(file_path, "rb") as f:

        for chunk in iter(
            lambda: f.read(8192),
            b""
        ):
            md5.update(chunk)

    return md5.hexdigest()


# ============================================================
# START
# ============================================================

print("=" * 70)
print("FINAL AI SKIN DATASET VALIDATION")
print("=" * 70)


# ============================================================
# CHECK PATHS
# ============================================================

if not os.path.exists(IMAGE_DIR):

    print("\nERROR: Final image folder not found:")
    print(IMAGE_DIR)
    exit()

if not os.path.exists(CSV_FILE):

    print("\nERROR: Final metadata file not found:")
    print(CSV_FILE)
    exit()


# ============================================================
# 1. IMAGE COUNT
# ============================================================

print("\n1. IMAGE COUNT")
print("-" * 70)

image_files = sorted([
    file
    for file in os.listdir(IMAGE_DIR)
    if file.lower().endswith(VALID_EXTENSIONS)
])

image_set = set(image_files)

print("Images found :", len(image_files))
print("Expected     :", EXPECTED_TOTAL)

if len(image_files) == EXPECTED_TOTAL:
    print("STATUS       : PASS")
else:
    print("STATUS       : FAIL")


# ============================================================
# 2. CSV VALIDATION
# ============================================================

print("\n2. METADATA CSV")
print("-" * 70)

metadata = []

with open(
    CSV_FILE,
    "r",
    encoding="utf-8"
) as f:

    reader = csv.DictReader(f)

    for row in reader:
        metadata.append(row)


print("CSV records  :", len(metadata))
print("Expected     :", EXPECTED_TOTAL)

if len(metadata) == EXPECTED_TOTAL:
    print("STATUS       : PASS")
else:
    print("STATUS       : FAIL")


# ============================================================
# 3. CSV COLUMNS
# ============================================================

print("\n3. CSV COLUMNS")
print("-" * 70)

required_columns = [
    "image",
    "label"
]

if metadata:

    columns = list(metadata[0].keys())

else:

    columns = []

print("Columns found:", columns)

missing_columns = [
    column
    for column in required_columns
    if column not in columns
]

if not missing_columns:

    print("STATUS       : PASS")

else:

    print("Missing      :", missing_columns)
    print("STATUS       : FAIL")


# ============================================================
# 4. CLASS DISTRIBUTION
# ============================================================

print("\n4. CLASS DISTRIBUTION")
print("-" * 70)

class_counts = {
    class_name: 0
    for class_name in EXPECTED_CLASSES
}


for row in metadata:

    label = row.get(
        "label",
        ""
    ).strip()

    if label in class_counts:

        class_counts[label] += 1


all_classes_correct = True


for class_name, expected in EXPECTED_CLASSES.items():

    actual = class_counts[class_name]

    if actual == expected:

        status = "PASS"

    else:

        status = "FAIL"
        all_classes_correct = False

    print(
        f"{class_name:15} "
        f"Actual: {actual:4} "
        f"Expected: {expected:4} "
        f"{status}"
    )


# ============================================================
# 5. UNKNOWN CLASSES
# ============================================================

print("\n5. UNKNOWN CLASSES")
print("-" * 70)

found_classes = set()

for row in metadata:

    label = row.get(
        "label",
        ""
    ).strip()

    if label:
        found_classes.add(label)


unknown_classes = (
    found_classes
    - set(EXPECTED_CLASSES.keys())
)


if not unknown_classes:

    print("Unknown classes: 0")
    print("STATUS        : PASS")

else:

    print(
        "Unknown classes:",
        unknown_classes
    )

    print("STATUS        : FAIL")


# ============================================================
# 6. MISSING IMAGES
# ============================================================

print("\n6. MISSING IMAGES")
print("-" * 70)

csv_images = set()

for row in metadata:

    filename = row.get(
        "image",
        ""
    ).strip()

    if filename:
        csv_images.add(filename)


missing_images = csv_images - image_set


print(
    "Missing images:",
    len(missing_images)
)


if not missing_images:

    print("STATUS        : PASS")

else:

    print("STATUS        : FAIL")

    for filename in list(missing_images)[:10]:

        print(
            " ",
            filename
        )


# ============================================================
# 7. EXTRA IMAGES
# ============================================================

print("\n7. EXTRA IMAGES")
print("-" * 70)

extra_images = image_set - csv_images

print(
    "Extra images:",
    len(extra_images)
)


if not extra_images:

    print("STATUS        : PASS")

else:

    print("STATUS        : FAIL")

    for filename in list(extra_images)[:10]:

        print(
            " ",
            filename
        )


# ============================================================
# 8. DUPLICATE IMAGE CHECK
# ============================================================

print("\n8. DUPLICATE IMAGE CHECK")
print("-" * 70)

hashes = {}
duplicate_images = []

for index, filename in enumerate(
    image_files,
    start=1
):

    file_path = os.path.join(
        IMAGE_DIR,
        filename
    )

    try:

        file_hash = get_file_hash(
            file_path
        )

        if file_hash in hashes:

            duplicate_images.append(
                (
                    filename,
                    hashes[file_hash]
                )
            )

        else:

            hashes[file_hash] = filename

    except Exception as error:

        print(
            "Hash error:",
            filename,
            error
        )

    if index % 250 == 0:

        print(
            f"Checked {index}/{len(image_files)} images..."
        )


print(
    "Duplicate images:",
    len(duplicate_images)
)


if not duplicate_images:

    print("STATUS        : PASS")

else:

    print("STATUS        : FAIL")

    for duplicate, original in duplicate_images[:20]:

        print(
            f" {duplicate} == {original}"
        )


# ============================================================
# 9. CORRUPTED IMAGE CHECK
# ============================================================

print("\n9. CORRUPTED IMAGE CHECK")
print("-" * 70)

corrupted_images = []

for index, filename in enumerate(
    image_files,
    start=1
):

    file_path = os.path.join(
        IMAGE_DIR,
        filename
    )

    try:

        with Image.open(file_path) as img:

            img.verify()

    except Exception:

        corrupted_images.append(
            filename
        )

    if index % 250 == 0:

        print(
            f"Checked {index}/{len(image_files)} images..."
        )


print(
    "Corrupted images:",
    len(corrupted_images)
)


if not corrupted_images:

    print("STATUS          : PASS")

else:

    print("STATUS          : FAIL")

    for filename in corrupted_images[:20]:

        print(
            " ",
            filename
        )


# ============================================================
# 10. IMAGE DIMENSIONS
# ============================================================

print("\n10. IMAGE DIMENSIONS")
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

        dimension_errors.append(
            filename
        )


if widths and heights:

    print(
        "Minimum width :",
        min(widths)
    )

    print(
        "Maximum width :",
        max(widths)
    )

    print(
        "Minimum height:",
        min(heights)
    )

    print(
        "Maximum height:",
        max(heights)
    )

    print("STATUS        : PASS")

else:

    print(
        "Could not read dimensions."
    )

    print("STATUS        : FAIL")


# ============================================================
# 11. CHECK EMPTY FILENAMES / LABELS
# ============================================================

print("\n11. EMPTY METADATA VALUES")
print("-" * 70)

empty_rows = []

for row in metadata:

    image_name = row.get(
        "image",
        ""
    ).strip()

    label = row.get(
        "label",
        ""
    ).strip()

    if not image_name or not label:

        empty_rows.append(row)


print(
    "Rows with empty values:",
    len(empty_rows)
)


if not empty_rows:

    print("STATUS                  : PASS")

else:

    print("STATUS                  : FAIL")


# ============================================================
# 12. DUPLICATE FILENAMES IN CSV
# ============================================================

print("\n12. DUPLICATE FILENAMES IN CSV")
print("-" * 70)

csv_filename_list = [
    row.get(
        "image",
        ""
    ).strip()
    for row in metadata
]

duplicate_csv_names = []

seen_names = set()

for filename in csv_filename_list:

    if filename in seen_names:

        duplicate_csv_names.append(
            filename
        )

    else:

        seen_names.add(filename)


print(
    "Duplicate CSV filenames:",
    len(duplicate_csv_names)
)


if not duplicate_csv_names:

    print("STATUS                  : PASS")

else:

    print("STATUS                  : FAIL")


# ============================================================
# FINAL SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("FINAL VALIDATION SUMMARY")
print("=" * 70)

print(
    "\nTotal images:",
    len(image_files)
)

print(
    "CSV records :",
    len(metadata)
)

print("\nClass distribution:")

for class_name in EXPECTED_CLASSES:

    print(
        f"{class_name:15}: "
        f"{class_counts[class_name]}"
    )

print(
    "\nMissing images   :",
    len(missing_images)
)

print(
    "Extra images     :",
    len(extra_images)
)

print(
    "Corrupted images :",
    len(corrupted_images)
)

print(
    "Duplicate images :",
    len(duplicate_images)
)

print(
    "Empty CSV rows   :",
    len(empty_rows)
)

print(
    "Duplicate names  :",
    len(duplicate_csv_names)
)


# ============================================================
# FINAL DECISION
# ============================================================

dataset_passed = (
    len(image_files) == 2000
    and len(metadata) == 2000
    and all_classes_correct
    and not unknown_classes
    and not missing_images
    and not extra_images
    and not corrupted_images
    and not duplicate_images
    and not empty_rows
    and not duplicate_csv_names
)


print("\n" + "=" * 70)

if dataset_passed:

    print("FINAL STATUS: DATASET VALIDATION PASSED")
    print()
    print("Your final dataset is ready for")
    print("TRAIN / VALIDATION / TEST SPLITTING.")

else:

    print("FINAL STATUS: DATASET VALIDATION FAILED")
    print()
    print("Please check the warnings/errors above.")

print("=" * 70)