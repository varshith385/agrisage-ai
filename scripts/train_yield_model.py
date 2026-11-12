"""
AgriSage AI — Yield Regressor Model Training Script
Trains a time-aware quantile regression model on Indian crop production statistics.

Methodology:
- Excludes non-tonne crops (Coconut: nuts, Jute/Mesta: bales, Cotton(lint): bales) to avoid unit errors.
- Converts valid metric tonnes/hectare to quintals/acre:
    Yield (quintals/acre) = (Production / Area) * (10 quintals / 2.47105 acres) = (Production / Area) * 4.0468564
- Implements strict time-aware split: Train on years <= 2012, Holdout Test on 2013-2015 to prevent leakage.
- Compares against historical naive district-mean baseline.
- Trains multi-quantile HistGradientBoostingRegressor (q10, q50, q90) for honest prediction intervals.
- Computes holdout MAE, RMSE, R², and empirical coverage of the 10-90% interval.
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
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import TargetEncoder

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATASET_PATH = PROJECT_ROOT / "datasets" / "crop_production.csv"
ARTIFACTS_DIR = PROJECT_ROOT / "model_artifacts"

TONNE_PER_HA_TO_QUINTAL_PER_ACRE = 4.0468564

# Crops excluded due to non-tonne units in Indian DES statistics:
NON_TONNE_EXCLUDED_CROPS = [
    "COCONUT",
    "COCONUT ",
    "JUTE",
    "MESTA",
    "SANNHAMP",
    "COTTON(LINT)",
]


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
    print(f"Loading {DATASET_PATH.name}...")
    df = pd.read_csv(DATASET_PATH)
    raw_count = len(df)
    print(f"Raw rows: {raw_count:,}")

    # 1. Clean and Standardize Strings
    for col in ["State_Name", "District_Name", "Crop", "Season"]:
        df[col] = df[col].astype(str).str.strip().str.upper()

    # 2. Filter valid production and area
    df = df.dropna(subset=["Area", "Production", "Crop_Year"])
    df = df[(df["Area"] > 0) & (df["Production"] > 0)]

    # 3. Exclude non-tonne crops
    df_excluded = df[df["Crop"].isin(NON_TONNE_EXCLUDED_CROPS)]
    excluded_crops_found = sorted(df_excluded["Crop"].unique().tolist())
    print(f"Excluding non-tonne crops ({len(df_excluded):,} rows): {excluded_crops_found}")

    df_valid = df[~df["Crop"].isin(NON_TONNE_EXCLUDED_CROPS)].copy()

    # 4. Compute target: Yield in quintals / acre
    df_valid["yield_q_acre"] = (df_valid["Production"] / df_valid["Area"]) * TONNE_PER_HA_TO_QUINTAL_PER_ACRE

    # Remove extreme outlier recording errors (> 99.5th percentile per crop)
    initial_clean_len = len(df_valid)
    clean_frames = []
    for crop_name, group in df_valid.groupby("Crop"):
        if len(group) >= 20:
            p995 = group["yield_q_acre"].quantile(0.995)
            # Cap at realistic upper threshold
            clean_frames.append(group[group["yield_q_acre"] <= p995])
        else:
            clean_frames.append(group)
    df_clean = pd.concat(clean_frames, ignore_index=True)
    print(f"Filtered outliers: {initial_clean_len - len(df_clean):,} anomalous records removed. Remaining: {len(df_clean):,}")

    # Feature Engineering
    df_clean["year_trend"] = df_clean["Crop_Year"] - 1997
    df_clean["log_area"] = np.log1p(df_clean["Area"])

    # 5. Strict Time-Aware Split
    # Train: <= 2012, Holdout Test: >= 2013
    train_df = df_clean[df_clean["Crop_Year"] <= 2012].copy()
    test_df = df_clean[df_clean["Crop_Year"] >= 2013].copy()

    print(f"\n--- Time-Aware Split ---")
    print(f"Training Period: 1997 - 2012 ({len(train_df):,} rows)")
    print(f"Holdout Test Period: 2013 - 2015 ({len(test_df):,} rows)")

    # 6. Build Naive Historical District-Mean Baseline
    print("\n--- Computing Naive Historical Baseline (Train District-Crop Mean) ---")
    district_crop_means = train_df.groupby(["District_Name", "Crop"])["yield_q_acre"].mean().to_dict()
    state_crop_means = train_df.groupby(["State_Name", "Crop"])["yield_q_acre"].mean().to_dict()
    crop_means = train_df.groupby("Crop")["yield_q_acre"].mean().to_dict()
    global_mean = float(train_df["yield_q_acre"].mean())

    def predict_naive_baseline(row):
        key_dist = (row["District_Name"], row["Crop"])
        if key_dist in district_crop_means:
            return district_crop_means[key_dist]
        key_state = (row["State_Name"], row["Crop"])
        if key_state in state_crop_means:
            return state_crop_means[key_state]
        if row["Crop"] in crop_means:
            return crop_means[row["Crop"]]
        return global_mean

    test_baseline_preds = test_df.apply(predict_naive_baseline, axis=1).values
    baseline_mae = float(mean_absolute_error(test_df["yield_q_acre"], test_baseline_preds))
    baseline_rmse = float(np.sqrt(mean_squared_error(test_df["yield_q_acre"], test_baseline_preds)))
    baseline_r2 = float(r2_score(test_df["yield_q_acre"], test_baseline_preds))
    print(f"Baseline Holdout MAE:  {baseline_mae:.4f} q/acre")
    print(f"Baseline Holdout RMSE: {baseline_rmse:.4f} q/acre")
    print(f"Baseline Holdout R²:   {baseline_r2:.4f}")

    # 7. Model Encoding and Features
    cat_features = ["State_Name", "District_Name", "Crop", "Season"]
    num_features = ["year_trend", "log_area"]
    feature_names = cat_features + num_features

    encoder = TargetEncoder(smooth="auto", cv=5, random_state=42)
    train_cat_encoded = encoder.fit_transform(train_df[cat_features], train_df["yield_q_acre"])
    test_cat_encoded = encoder.transform(test_df[cat_features])

    X_train = np.hstack([train_cat_encoded, train_df[num_features].values])
    y_train = train_df["yield_q_acre"].values

    X_test = np.hstack([test_cat_encoded, test_df[num_features].values])
    y_test = test_df["yield_q_acre"].values

    # 8. Train Quantile Regressors (q10, q50, q90)
    print("\n--- Training Multi-Quantile HistGradientBoosting Models ---")

    print("Training Median Model (q=0.50)...")
    model_q50 = HistGradientBoostingRegressor(
        loss="quantile",
        quantile=0.50,
        max_iter=120,
        random_state=42,
    )
    model_q50.fit(X_train, y_train)

    print("Training Lower-Bound Model (q=0.10)...")
    model_q10 = HistGradientBoostingRegressor(
        loss="quantile",
        quantile=0.10,
        max_iter=100,
        random_state=42,
    )
    model_q10.fit(X_train, y_train)

    print("Training Upper-Bound Model (q=0.90)...")
    model_q90 = HistGradientBoostingRegressor(
        loss="quantile",
        quantile=0.90,
        max_iter=100,
        random_state=42,
    )
    model_q90.fit(X_train, y_train)

    # 9. Holdout Test Set Predictions & Interval Metrics
    print("\n--- Holdout Evaluation vs Naive Baseline ---")
    pred_q50 = model_q50.predict(X_test)
    pred_q10 = model_q10.predict(X_test)
    pred_q90 = model_q90.predict(X_test)

    # Enforce non-negative yields and monotonic bounds
    pred_q10 = np.maximum(0.0, pred_q10)
    pred_q50 = np.maximum(pred_q10, pred_q50)
    pred_q90 = np.maximum(pred_q50, pred_q90)

    model_mae = float(mean_absolute_error(y_test, pred_q50))
    model_rmse = float(np.sqrt(mean_squared_error(y_test, pred_q50)))
    model_r2 = float(r2_score(y_test, pred_q50))

    # Empirical Coverage of 10-90% prediction interval
    inside_interval = (y_test >= pred_q10) & (y_test <= pred_q90)
    empirical_coverage = float(np.mean(inside_interval))

    print(f"Model Holdout MAE:  {model_mae:.4f} q/acre (vs Baseline {baseline_mae:.4f})")
    print(f"Model Holdout RMSE: {model_rmse:.4f} q/acre (vs Baseline {baseline_rmse:.4f})")
    print(f"Model Holdout R²:   {model_r2:.4f} (vs Baseline {baseline_r2:.4f})")
    print(f"Empirical 10-90% Interval Coverage: {empirical_coverage * 100:.2f}% (Nominal 80.0%)")

    beats_baseline = (model_mae < baseline_mae) and (model_r2 > baseline_r2)
    print(f"Honestly beats district-mean baseline? {'YES' if beats_baseline else 'NO'}")

    # 10. Save Model Artifacts
    model_path = ARTIFACTS_DIR / "yield_model.joblib"
    metrics_path = ARTIFACTS_DIR / "yield_metrics.json"

    # Pre-compute state/district averages as instant fallback when unseen
    state_averages = {f"{s}_{c}": float(v) for (s, c), v in state_crop_means.items()}
    crop_averages = {str(k): float(v) for k, v in crop_means.items()}

    yield_payload = {
        "model_q50": model_q50,
        "model_q10": model_q10,
        "model_q90": model_q90,
        "encoder": encoder,
        "cat_features": cat_features,
        "num_features": num_features,
        "supported_crops": sorted(df_clean["Crop"].unique().tolist()),
        "unsupported_crops": excluded_crops_found,
        "state_averages": state_averages,
        "crop_averages": crop_averages,
        "global_average_q_acre": global_mean,
        "version": "1.0.0",
        "training_period": "1997-2012",
        "trained_date": datetime.now(timezone.utc).isoformat(),
    }
    joblib.dump(yield_payload, model_path)
    model_sha = compute_sha256(model_path)
    print(f"\nSaved yield model bundle to {model_path} (SHA-256: {model_sha})")

    metrics_data = {
        "model_name": "CropYield-MultiQuantileHistGradientBoosting",
        "training_date": datetime.now(timezone.utc).isoformat(),
        "training_period": "1997-2012",
        "test_period": "2013-2015",
        "total_valid_rows": len(df_clean),
        "train_rows": len(train_df),
        "test_rows": len(test_df),
        "target_unit": "quintals/acre (derived from tonnes/ha * 4.0468564)",
        "excluded_non_tonne_crops": excluded_crops_found,
        "supported_crops_count": len(yield_payload["supported_crops"]),
        "naive_district_mean_baseline": {
            "mae": baseline_mae,
            "rmse": baseline_rmse,
            "r2": baseline_r2,
        },
        "holdout_test_metrics": {
            "mae": model_mae,
            "rmse": model_rmse,
            "r2": model_r2,
            "empirical_coverage_10_90": empirical_coverage,
            "beats_naive_baseline": beats_baseline,
        },
        "artifact_hashes": {
            "yield_model.joblib": model_sha,
        },
        "scientific_caveat": (
            "Training data spans 1997 to 2012 with holdout testing on 2013 to 2015. "
            "Extrapolation to present-day agronomic yields (2026) is unvalidated due to changing climate "
            "and seed hybrids. Predictions represent indicative historical distributions."
        ),
    }

    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=2)
    print(f"Saved yield metrics to {metrics_path}")


if __name__ == "__main__":
    main()
