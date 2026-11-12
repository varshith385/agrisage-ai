"""
Download script for AgriSage AI Phase 3.4 datasets.
Downloads:
1. Crop Recommendation dataset (Harvestify project, open source copy of ICAR benchmark data)
2. Indian Crop Production dataset (Ministry of Agriculture & Farmers Welfare, DES via OGD India copy)

All provenance and licenses are recorded as 'to verify' per Yuktik Honesty Rules.
"""
import hashlib
import os
import sys
import urllib.request
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATASETS_DIR = PROJECT_ROOT / "datasets"

DATASETS = {
    "crop_recommendation.csv": {
        "url": "https://raw.githubusercontent.com/Gladiator07/Harvestify/master/Data-processed/crop_recommendation.csv",
        "description": "Third-party GitHub copy of crop recommendation dataset (N, P, K, temp, humidity, ph, rainfall, label). Original ICAR source to verify.",
    },
    "crop_production.csv": {
        "url": "https://raw.githubusercontent.com/ankitaS11/Crop-Yield-Prediction-in-India-using-ML/master/crop_production.csv",
        "description": "Third-party GitHub copy of Indian district crop production statistics (State_Name, District_Name, Crop_Year, Season, Crop, Area, Production). Original DES / OGD source to verify.",
    },
}


def compute_sha256(filepath: Path) -> str:
    sha = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            sha.update(chunk)
    return sha.hexdigest()


def download_datasets():
    DATASETS_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Target datasets directory: {DATASETS_DIR}")

    for filename, meta in DATASETS.items():
        dest = DATASETS_DIR / filename
        url = meta["url"]
        print(f"\n--- Downloading {filename} ---")
        print(f"URL: {url}")
        print(f"Description: {meta['description']}")

        if dest.exists() and dest.stat().st_size > 0:
            print(f"File already exists at {dest} ({dest.stat().st_size:,} bytes). Skipping download.")
        else:
            try:
                urllib.request.urlretrieve(url, dest)
                print(f"Saved {filename} ({dest.stat().st_size:,} bytes).")
            except Exception as e:
                print(f"ERROR downloading {filename} from {url}: {e}", file=sys.stderr)
                continue

        # Inspect downloaded file
        sha = compute_sha256(dest)
        with open(dest, "r", encoding="utf-8", errors="replace") as f:
            lines = [f.readline() for _ in range(5)]
            f.seek(0)
            total_lines = sum(1 for _ in f)

        header = lines[0].strip() if lines else ""
        print(f"SHA-256: {sha}")
        print(f"Total Rows: {total_lines:,} (including header)")
        print(f"Header: {header}")


if __name__ == "__main__":
    download_datasets()
