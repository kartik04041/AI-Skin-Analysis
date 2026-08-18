import os
import csv
import hashlib
import shutil
import random

# ============================================================
# PATHS
# ============================================================

BASE_DIR = r"C:\Users\KARTIK\Downloads\AI SKIN"

ORIGINAL_DIR = os.path.join(BASE_DIR, "skin_issue")

CLEAN_DIR = os.path.join(
    BASE_DIR,
    "dataset",
    "final_2000",
    "images_clean"
)

CLEAN_CSV = os.path.join(
    BASE_DIR,
    "dataset",
    "final_2000",
    "metadata_clean.csv"
)

FINAL_DIR = os.path.join(
    BASE_DIR,
    "dataset",
    "final_2000",
    "final_images"
)

FINAL_CSV = os.path.join(
    BASE_DIR,
    "dataset",
    "final_2000",
    "metadata_final.csv"
)

# ============================================================
# SETTINGS
# ============================================================

TARGET_PER_CLASS = 400

CLASSES = [
    "acne",
    "blackheades",
    "dark spots",
    "pores",
    "wrinkles"
]

VALID_EXTENSIONS = (
    ".jpg",
    ".jpeg",
    ".png",
    ".webp"
)

random.seed(42)


# ============================================================
# HASH FUNCTION
# ============================================================

def get_hash(file_path):

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
print("CREATING FINAL 2,000 UNIQUE IMAGE DATASET")
print("=" * 70)


# ============================================================
# CREATE FINAL DIRECTORY
# ============================================================

os.makedirs(FINAL_DIR, exist_ok=True)


# ============================================================
# READ CLEAN CSV
# ============================================================

clean_metadata = {}

with open(
    CLEAN_CSV,
    "r",
    encoding="utf-8"
) as f:

    reader = csv.DictReader(f)

    for row in reader:

        clean_metadata[row["image"]] = row["label"]


# ============================================================
# GET CURRENT CLEAN IMAGES
# ============================================================

clean_images = [
    file
    for file in os.listdir(CLEAN_DIR)
    if file.lower().endswith(VALID_EXTENSIONS)
]


print("\nCurrent unique images:", len(clean_images))


# ============================================================
# CALCULATE CURRENT CLASS COUNTS
# ============================================================

class_images = {
    class_name: []
    for class_name in CLASSES
}

for filename in clean_images:

    label = clean_metadata.get(filename)

    if label in class_images:

        class_images[label].append(filename)


print("\nCurrent distribution:")

for class_name in CLASSES:

    print(
        f"{class_name:15}: "
        f"{len(class_images[class_name])}"
    )


# ============================================================
# COPY CURRENT UNIQUE IMAGES
# ============================================================

print("\nCopying existing unique images...")

for filename in clean_images:

    source = os.path.join(
        CLEAN_DIR,
        filename
    )

    destination = os.path.join(
        FINAL_DIR,
        filename
    )

    shutil.copy2(source, destination)


# ============================================================
# GET HASHES OF EXISTING IMAGES
# ============================================================

print("\nChecking existing image hashes...")

existing_hashes = set()

for filename in clean_images:

    file_path = os.path.join(
        CLEAN_DIR,
        filename
    )

    existing_hashes.add(
        get_hash(file_path)
    )


# ============================================================
# ADD MISSING IMAGES
# ============================================================

print("\nFinding replacement images...")


for class_name in CLASSES:

    current_count = len(
        class_images[class_name]
    )

    required = TARGET_PER_CLASS - current_count

    if required <= 0:

        continue

    print(
        f"\n{class_name}: "
        f"need {required} replacement image(s)"
    )


    source_folder = os.path.join(
        ORIGINAL_DIR,
        class_name
    )

    if not os.path.exists(source_folder):

        print(
            "ERROR: Folder not found:",
            source_folder
        )

        continue


    all_original_images = [
        file
        for file in os.listdir(source_folder)
        if file.lower().endswith(
            VALID_EXTENSIONS
        )
    ]

    random.shuffle(all_original_images)

    added = 0

    for filename in all_original_images:

        if added >= required:

            break


        source_path = os.path.join(
            source_folder,
            filename
        )

        # Calculate hash
        file_hash = get_hash(source_path)


        # Skip if already present
        if file_hash in existing_hashes:

            continue


        # Create unique filename
        new_filename = (
            f"{class_name.replace(' ', '_')}"
            f"_replacement_{added + 1:04d}"
            f"{os.path.splitext(filename)[1].lower()}"
        )


        destination_path = os.path.join(
            FINAL_DIR,
            new_filename
        )


        shutil.copy2(
            source_path,
            destination_path
        )


        existing_hashes.add(file_hash)

        class_images[class_name].append(
            new_filename
        )

        added += 1


    print(
        f"Added: {added}"
    )


# ============================================================
# CREATE FINAL METADATA
# ============================================================

print("\nCreating final metadata...")

final_metadata = []


for class_name in CLASSES:

    for filename in class_images[class_name]:

        final_metadata.append([
            filename,
            class_name
        ])


with open(
    FINAL_CSV,
    "w",
    newline="",
    encoding="utf-8"
) as f:

    writer = csv.writer(f)

    writer.writerow([
        "image",
        "label"
    ])

    writer.writerows(final_metadata)


# ============================================================
# FINAL SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("FINAL DATASET SUMMARY")
print("=" * 70)


total = 0

for class_name in CLASSES:

    count = len(
        class_images[class_name]
    )

    total += count

    print(
        f"{class_name:15}: {count}"
    )


print("-" * 70)

print(
    f"{'TOTAL':15}: {total}"
)


# ============================================================
# FINAL STATUS
# ============================================================

print("\nFinal images location:")
print(FINAL_DIR)

print("\nFinal metadata:")
print(FINAL_CSV)


if total == 2000:

    print("\n" + "=" * 70)
    print("SUCCESS!")
    print("Exactly 2,000 unique images created.")
    print("=" * 70)

else:

    print("\n" + "=" * 70)
    print("WARNING!")
    print(
        f"Expected 2,000 images but created {total}."
    )
    print("=" * 70)