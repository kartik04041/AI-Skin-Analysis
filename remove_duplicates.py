import os
import csv
import hashlib
import shutil

DATASET_DIR = r"C:\Users\KARTIK\Downloads\AI SKIN\dataset\final_2000"

IMAGE_DIR = os.path.join(DATASET_DIR, "images")
CSV_FILE = os.path.join(DATASET_DIR, "metadata.csv")

CLEAN_DIR = os.path.join(DATASET_DIR, "images_clean")

VALID_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")


def get_hash(file_path):
    hash_md5 = hashlib.md5()

    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)

    return hash_md5.hexdigest()


print("=" * 70)
print("REMOVING EXACT DUPLICATES")
print("=" * 70)

os.makedirs(CLEAN_DIR, exist_ok=True)

seen_hashes = set()
kept_images = []
removed_images = []

image_files = sorted([
    f for f in os.listdir(IMAGE_DIR)
    if f.lower().endswith(VALID_EXTENSIONS)
])

for filename in image_files:

    file_path = os.path.join(IMAGE_DIR, filename)

    file_hash = get_hash(file_path)

    if file_hash in seen_hashes:

        removed_images.append(filename)

    else:

        seen_hashes.add(file_hash)

        shutil.copy2(
            file_path,
            os.path.join(CLEAN_DIR, filename)
        )

        kept_images.append(filename)


# ------------------------------------------------------------
# READ ORIGINAL CSV
# ------------------------------------------------------------

metadata = {}

with open(
    CSV_FILE,
    "r",
    encoding="utf-8"
) as f:

    reader = csv.DictReader(f)

    for row in reader:
        metadata[row["image"]] = row["label"]


# ------------------------------------------------------------
# CREATE CLEAN CSV
# ------------------------------------------------------------

clean_csv = os.path.join(
    DATASET_DIR,
    "metadata_clean.csv"
)

with open(
    clean_csv,
    "w",
    newline="",
    encoding="utf-8"
) as f:

    writer = csv.writer(f)

    writer.writerow([
        "image",
        "label"
    ])

    for filename in kept_images:

        writer.writerow([
            filename,
            metadata[filename]
        ])


# ------------------------------------------------------------
# SUMMARY
# ------------------------------------------------------------

print("\nOriginal images :", len(image_files))
print("Duplicate images:", len(removed_images))
print("Clean images    :", len(kept_images))

print("\nDuplicates removed:")

for filename in removed_images:
    print(" -", filename)

print("\nClean dataset:")
print(CLEAN_DIR)

print("\nClean metadata:")
print(clean_csv)

print("\n" + "=" * 70)
print("DUPLICATE REMOVAL COMPLETED")
print("=" * 70)