
import csv
from pathlib import Path
from collections import Counter

BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR.parent / "dataset"

IMAGE_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".webp", ".bmp"
}

print("\nSKIN DATASET CLASS-WISE IMAGE REPORT")
print("=" * 60)
print("Dataset folder:", DATASET_DIR)

if not DATASET_DIR.exists():
    print("ERROR: Dataset folder not found.")
    raise SystemExit(1)

# Find CSV files that may contain the image labels.
csv_files = list(DATASET_DIR.rglob("*.csv"))
metadata_found = False

for csv_path in csv_files:
    try:
        with open(csv_path, "r", encoding="utf-8-sig", newline="") as file:
            reader = csv.DictReader(file)

            if not reader.fieldnames:
                continue

            # Match column names regardless of capitalization.
            columns = {
                name.strip().lower(): name
                for name in reader.fieldnames
                if name
            }

            if "label" not in columns or "image" not in columns:
                continue

            image_column = columns["image"]
            label_column = columns["label"]
            counts = Counter()
            rows_read = 0

            for row in reader:
                label = str(row.get(label_column, "")).strip()
                image_name = str(row.get(image_column, "")).strip()

                if not label or not image_name:
                    continue

                if Path(image_name).suffix.lower() not in IMAGE_EXTENSIONS:
                    continue

                counts[label] += 1
                rows_read += 1

            if counts:
                metadata_found = True

                print("\nMetadata file:", csv_path)
                print("-" * 60)

                for class_name, count in sorted(counts.items()):
                    print(f"{class_name:<30} {count:>8} images")

                print("-" * 60)
                print(f"{'TOTAL LABELLED IMAGES':<30} {rows_read:>8}")
                print("\nCounts are based on metadata rows.")
                break

    except (OSError, UnicodeError, csv.Error) as error:
        print(f"Could not read {csv_path.name}: {error}")

if not metadata_found:
    print("\nNo CSV with usable 'image' and 'label' columns was found.")
    print("\nCSV files discovered:")

    if csv_files:
        for path in csv_files:
            print(" -", path)
    else:
        print("No CSV files found inside the dataset folder.")

    print(
        "\nPlease check where the dataset labels are stored. "
        "The three folder names alone cannot identify the skin classes."
    )
