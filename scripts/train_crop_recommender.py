"""
AgriSage AI — Crop Recommender Model Training Script
Trains a multi-class crop classifier using stratified train/val/test splits.
Models compared:
- Baseline (DummyClassifier)
- RandomForestClassifier
- HistGradientBoostingClassifier

Also trains a weather-only variant (temperature, humidity, rainfall) for when
soil nutrients (N, P, K, pH) are missing, strictly avoiding invented soil data.

Caveat: The Kaggle Crop Recommendation dataset is clean/heavily augmented;
reported holdout scores reflect benchmark distribution fit, not raw field accuracy.
Outputs are labeled as 'model probability (uncalibrated)'.
"""
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATASET_PATH = PROJECT_ROOT / "datasets" / "crop_recommendation.csv"
ARTIFACTS_DIR = PROJECT_ROOT / "model_artifacts"


def compute_sha256(filepath: Path) -> str:
    sha = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            sha.update(chunk)
    return sha.hexdigest()


def main():
    if not DATASET_PATH.exists():
        print(f"Error: dataset missing at {DATASET_PATH}", file=sys.stderr)
        sys.exit(1)

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    df = pd.read_csv(DATASET_PATH)
    print(f"Loaded {DATASET_PATH.name}: {df.shape[0]} rows, {df.shape[1]} columns.")

    soil_and_weather_features = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
    weather_only_features = ["temperature", "humidity", "rainfall"]
    target_col = "label"

    X_full = df[soil_and_weather_features]
    X_weather = df[weather_only_features]
    y = df[target_col]

    classes = sorted(y.unique().tolist())
    print(f"Number of classes: {len(classes)}")

    # 1. Stratified 70/15/15 Split
    # First split: 70% train, 30% temp
    X_train_full, X_temp_full, y_train, y_temp = train_test_split(
        X_full, y, test_size=0.30, random_state=42, stratify=y
    )
    # Second split: 15% validation, 15% test
    X_val_full, X_test_full, y_val, y_test = train_test_split(
        X_temp_full, y_temp, test_size=0.50, random_state=42, stratify=y_temp
    )

    X_train_weather = X_train_full[weather_only_features]
    X_val_weather = X_val_full[weather_only_features]
    X_test_weather = X_test_full[weather_only_features]

    print(f"Split sizes: Train={len(y_train)} (70%), Val={len(y_val)} (15%), Test={len(y_test)} (15%)")

    # 2. Model Comparison (Full Soil + Weather)
    print("\n--- Comparing Candidates on Train Set (5-Fold Stratified CV) ---")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    candidates = {
        "DummyBaseline": DummyClassifier(strategy="stratified", random_state=42),
        "RandomForest": RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1),
        "HistGradientBoosting": HistGradientBoostingClassifier(max_iter=100, max_depth=8, random_state=42),
    }

    cv_results = {}
    for name, clf in candidates.items():
        scores = cross_val_score(clf, X_train_full, y_train, cv=cv, scoring="accuracy")
        cv_results[name] = {"mean": float(scores.mean()), "std": float(scores.std())}
        print(f"  {name:22s}: CV Accuracy = {scores.mean():.4f} (+/- {scores.std():.4f})")

    # Train best model (RandomForest has strong generalization and feature importances)
    best_clf_name = "RandomForest"
    best_model = RandomForestClassifier(n_estimators=150, max_depth=12, random_state=42, n_jobs=-1)
    best_model.fit(X_train_full, y_train)

    # Evaluate strictly on HOLDOUT Test Set
    y_test_pred = best_model.predict(X_test_full)
    holdout_acc = float(accuracy_score(y_test, y_test_pred))
    holdout_macro_f1 = float(f1_score(y_test, y_test_pred, average="macro"))
    print("\n--- Holdout Test Evaluation (Full Features) ---")
    print(f"Holdout Test Accuracy: {holdout_acc:.4f}")
    print(f"Holdout Test Macro-F1: {holdout_macro_f1:.4f}")

    cm = confusion_matrix(y_test, y_test_pred, labels=classes).tolist()
    feat_importances = dict(zip(soil_and_weather_features, [round(float(v), 4) for v in best_model.feature_importances_]))
    print("Feature Importances:", feat_importances)

    # 3. Train Weather-Only Model Variant for Missing Soil
    print("\n--- Training Weather-Only Recommender (temperature, humidity, rainfall) ---")
    weather_model = RandomForestClassifier(n_estimators=150, max_depth=10, random_state=42, n_jobs=-1)
    weather_model.fit(X_train_weather, y_train)
    y_test_pred_w = weather_model.predict(X_test_weather)
    holdout_acc_w = float(accuracy_score(y_test, y_test_pred_w))
    holdout_macro_f1_w = float(f1_score(y_test, y_test_pred_w, average="macro"))
    print(f"Weather-Only Holdout Test Accuracy: {holdout_acc_w:.4f}")
    print(f"Weather-Only Holdout Test Macro-F1: {holdout_macro_f1_w:.4f}")

    # 4. Save Artifacts with Joblib
    full_model_path = ARTIFACTS_DIR / "crop_recommender.joblib"
    weather_model_path = ARTIFACTS_DIR / "crop_recommender_weather_only.joblib"
    metrics_path = ARTIFACTS_DIR / "crop_recommender_metrics.json"

    # Save dictionary wrapping model and metadata
    full_payload = {
        "model": best_model,
        "features": soil_and_weather_features,
        "classes": classes,
        "version": "1.0.0",
        "trained_date": datetime.now(timezone.utc).isoformat(),
    }
    joblib.dump(full_payload, full_model_path)
    full_sha = compute_sha256(full_model_path)
    print(f"\nSaved full model to {full_model_path} (SHA-256: {full_sha})")

    weather_payload = {
        "model": weather_model,
        "features": weather_only_features,
        "classes": classes,
        "version": "1.0.0",
        "trained_date": datetime.now(timezone.utc).isoformat(),
    }
    joblib.dump(weather_payload, weather_model_path)
    weather_sha = compute_sha256(weather_model_path)
    print(f"Saved weather-only model to {weather_model_path} (SHA-256: {weather_sha})")

    # Metrics JSON
    metrics_data = {
        "model_name": "CropRecommender-RandomForest",
        "training_date": datetime.now(timezone.utc).isoformat(),
        "dataset_path": str(DATASET_PATH.relative_to(PROJECT_ROOT)),
        "dataset_size": len(df),
        "split_counts": {"train": len(y_train), "val": len(y_val), "test": len(y_test)},
        "features": soil_and_weather_features,
        "classes": classes,
        "supported_crops_count": len(classes),
        "unsupported_common_crops": ["wheat", "groundnut", "chilli", "tomato", "sugarcane", "soybean", "mustard", "onion"],
        "models_cv_comparison": cv_results,
        "holdout_test_metrics": {
            "accuracy": holdout_acc,
            "macro_f1": holdout_macro_f1,
            "confusion_matrix": cm,
            "feature_importances": feat_importances,
        },
        "weather_only_holdout_test_metrics": {
            "accuracy": holdout_acc_w,
            "macro_f1": holdout_macro_f1_w,
            "features": weather_only_features,
        },
        "artifact_hashes": {
            "crop_recommender.joblib": full_sha,
            "crop_recommender_weather_only.joblib": weather_sha,
        },
        "scientific_caveat": (
            "The Kaggle Crop Recommendation dataset is clean/heavily augmented benchmark data. "
            "Holdout metrics measure statistical fit against this specific distribution, NOT field accuracy "
            "across diverse Indian soil microclimates. Predictions must be labeled as 'model probability (uncalibrated)'."
        ),
    }

    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=2)
    print(f"Saved metrics to {metrics_path}")


if __name__ == "__main__":
    main()
