import os
import random
import shutil
import csv

# ============================================================
# SETTINGS
# ============================================================

SOURCE_DIR = r"C:\Users\KARTIK\Downloads\AI SKIN\skin_issue"

OUTPUT_DIR = r"C:\Users\KARTIK\Downloads\AI SKIN\dataset\final_2000"

IMAGES_PER_CLASS = 400

CLASSES = [
    "acne",
    "blackheades",
    "dark spots",
    "pores",
    "wrinkles"
]

VALID_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")

# Fixed seed = same selection every time
random.seed(42)


# ============================================================
# CREATE OUTPUT FOLDERS
# ============================================================

IMAGE_OUTPUT_DIR = os.path.join(OUTPUT_DIR, "images")

os.makedirs(IMAGE_OUTPUT_DIR, exist_ok=True)


# ============================================================
# METADATA
# ============================================================

metadata = []

print("=" * 60)
print("CREATING 2,000 IMAGE DATASET")
print("=" * 60)


# ============================================================
# PROCESS EACH CLASS
# ============================================================

for class_name in CLASSES:

    class_path = os.path.join(SOURCE_DIR, class_name)

    if not os.path.exists(class_path):
        print(f"\nERROR: Folder not found:")
        print(class_path)
        continue

    # Get image files
    image_files = [
        file for file in os.listdir(class_path)
        if file.lower().endswith(VALID_EXTENSIONS)
    ]

    print(f"\n{class_name}")
    print(f"Available images: {len(image_files)}")

    # Check whether enough images exist
    if len(image_files) < IMAGES_PER_CLASS:
        print(
            f"WARNING: Only {len(image_files)} images available. "
            f"Could not select {IMAGES_PER_CLASS}."
        )

        selected_files = image_files

    else:
        selected_files = random.sample(
            image_files,
            IMAGES_PER_CLASS
        )

    # Copy selected images
    for index, filename in enumerate(selected_files, start=1):

        source_path = os.path.join(
            class_path,
            filename
        )

        extension = os.path.splitext(filename)[1].lower()

        new_filename = (
            f"{class_name.replace(' ', '_')}_{index:04d}{extension}"
        )

        destination_path = os.path.join(
            IMAGE_OUTPUT_DIR,
            new_filename
        )

        shutil.copy2(
            source_path,
            destination_path
        )

        # Add metadata
        metadata.append([
            new_filename,
            class_name
        ])

    print(f"Selected: {len(selected_files)}")


# ============================================================
# CREATE CSV
# ============================================================

csv_path = os.path.join(
    OUTPUT_DIR,
    "metadata.csv"
)

with open(
    csv_path,
    "w",
    newline="",
    encoding="utf-8"
) as csv_file:

    writer = csv.writer(csv_file)

    # Header
    writer.writerow([
        "image",
        "label"
    ])

    # Data
    writer.writerows(metadata)


# ============================================================
# FINAL RESULT
# ============================================================

print("\n" + "=" * 60)
print("DATASET CREATION COMPLETED")
print("=" * 60)

print(f"\nTotal images created: {len(metadata)}")

print(f"\nImages location:")
print(IMAGE_OUTPUT_DIR)

print(f"\nMetadata file:")
print(csv_path)

print("\nClass distribution:")

for class_name in CLASSES:

    count = sum(
        1 for row in metadata
        if row[1] == class_name
    )

    print(f"{class_name:15} : {count}")

print("\nDone!")