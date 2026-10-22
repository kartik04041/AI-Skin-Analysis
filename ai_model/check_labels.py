
from pathlib import Path
from collections import Counter
import csv

DATASET_DIR = Path(
    r"C:\Users\KARTIK\Downloads\AI SKIN\dataset\final_2000"
)

CSV_FILES = [
    DATASET_DIR / "metadata.csv",
    DATASET_DIR / "metadata_clean.csv",
    DATASET_DIR / "metadata_final.csv",
]

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

# Index image paths by filename across all subfolders.
image_paths = {}
for path in DATASET_DIR.rglob("*"):
    if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
        image_paths.setdefault(path.name.lower(), []).append(path)

for csv_path in CSV_FILES:
    if not csv_path.exists():
        continue

    print("\n" + "=" * 55)
    print("METADATA:", csv_path.name)

    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))

    labels = Counter(
        (row.get("label") or "").strip().lower()
        for row in rows
    )

    print("Metadata rows:", len(rows))
    print("Class counts:")
    for label, count in sorted(labels.items()):
        print(f"  {label or '[EMPTY LABEL]'}: {count}")

    missing = []
    duplicated_names = []
    found = 0

    for row in rows:
        filename = (row.get("image") or "").strip()
        if not filename:
            missing.append("[EMPTY FILENAME]")
            continue

        matches = image_paths.get(Path(filename).name.lower(), [])
        if not matches:
            missing.append(filename)
        else:
            found += 1
            if len(matches) > 1:
                duplicated_names.append(filename)

    print("Rows with a matching image filename:", found)
    print("Rows with missing images:", len(missing))
    print("Filenames found in multiple folders:", len(duplicated_names))

    if missing:
        print("First missing filenames:", missing[:10])
    if duplicated_names:
        print("Example repeated filenames:", duplicated_names[:10])

print("\nCheck complete. No files were changed.")
