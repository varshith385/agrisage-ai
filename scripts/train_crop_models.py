"""
Grow2Gain — Crop Recommender ML Benchmarking & Model Rebuild Script
Implements Phase 6c requirements:
- Loads datasets/crop_recommendation.csv (2,200 rows, 22 classes)
- 80/20 train/test stratified split with fixed random_state=42
- Benchmarks 8 standard scikit-learn classifiers with 5-fold Stratified CV:
    1. RandomForestClassifier
    2. ExtraTreesClassifier
    3. GradientBoostingClassifier
    4. HistGradientBoostingClassifier
    5. LogisticRegression(max_iter=1000) with StandardScaler
    6. SVC(probability=True) with StandardScaler
    7. KNeighborsClassifier with StandardScaler
    8. GaussianNB
- Computes CV accuracy (mean +/- std), macro-F1, held-out test accuracy/F1
- Measures feature importance / input sensitivity
- Measures perturbation stability (+/-5%, +/-10% on test inputs)
- Implements an Out-of-Distribution (OOD) detector using IsolationForest
- Checks probability calibration (Brier score loss)
- Saves the winning model artifact to model_artifacts/crop_recommender.joblib
  and weather-only variant to model_artifacts/crop_recommender_weather_only.joblib
"""
import hashlib
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import (
    ExtraTreesClassifier,
    GradientBoostingClassifier,
    HistGradientBoostingClassifier,
    IsolationForest,
    RandomForestClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATASET_PATH = PROJECT_ROOT / "datasets" / "crop_recommendation.csv"
ARTIFACTS_DIR = PROJECT_ROOT / "model_artifacts"


def compute_sha256(filepath: Path) -> str:
    sha = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            sha.update(chunk)
    return sha.hexdigest()


def compute_multiclass_brier(y_true_indices: np.ndarray, y_prob: np.ndarray, n_classes: int) -> float:
    """Computes mean multiclass Brier score loss: 1/N * sum_{i,k} (p_{i,k} - y_{i,k})^2"""
    n_samples = len(y_true_indices)
    one_hot = np.zeros((n_samples, n_classes))
    one_hot[np.arange(n_samples), y_true_indices] = 1.0
    return float(np.mean(np.sum((y_prob - one_hot) ** 2, axis=1)))


def evaluate_perturbation_stability(model, X_test: pd.DataFrame, percentages=(0.05, 0.10)):
    """
    Evaluates prediction flip rate when test inputs are perturbed by +/- delta%.
    Returns percentage of predictions that remained unchanged (stability %).
    """
    base_preds = model.predict(X_test)
    stability_results = {}

    for pct in percentages:
        flips = 0
        total_evals = 0
        for sign in [-1.0, 1.0]:
            multiplier = 1.0 + (sign * pct)
            X_pert = X_test * multiplier
            pert_preds = model.predict(X_pert)
            flips += np.sum(base_preds != pert_preds)
            total_evals += len(base_preds)

        stability_rate = 1.0 - (flips / total_evals)
        stability_results[f"+/-{int(pct*100)}%"] = {
            "stability_pct": round(float(stability_rate * 100), 2),
            "flip_rate_pct": round(float((flips / total_evals) * 100), 2),
            "flips": int(flips),
            "total_evals": int(total_evals),
        }
    return stability_results


def main():
    if not DATASET_PATH.exists():
        print(f"Error: dataset missing at {DATASET_PATH}", file=sys.stderr)
        sys.exit(1)

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    df = pd.read_csv(DATASET_PATH)
    print("=" * 80)
    print("PHASE 6c: CROP RECOMMENDER ML BENCHMARK & MODEL REBUILD")
    print(f"Dataset: {DATASET_PATH.name} ({len(df)} rows, {df.shape[1]} columns)")
    print("=" * 80)

    soil_and_weather_features = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
    weather_only_features = ["temperature", "humidity", "rainfall"]
    target_col = "label"

    X_full = df[soil_and_weather_features]
    y = df[target_col]

    classes = sorted(y.unique().tolist())
    n_classes = len(classes)
    class_to_idx = {c: i for i, c in enumerate(classes)}
    print(f"Number of classes: {n_classes} ({', '.join(classes[:5])}...)\n")

    # 1. 80/20 Stratified Split with fixed random_state=42
    X_train, X_test, y_train, y_test = train_test_split(
        X_full, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Dataset Split: Train={len(y_train)} (80.0%), Test={len(y_test)} (20.0%)")
    y_test_indices = np.array([class_to_idx[c] for c in y_test])

    # 2. Benchmark 8 Standard Classifiers with 5-Fold Stratified CV
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    classifiers = {
        "RandomForest": RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
        "ExtraTrees": ExtraTreesClassifier(n_estimators=100, random_state=42, n_jobs=-1),
        "GradientBoosting": GradientBoostingClassifier(random_state=42),
        "HistGradientBoosting": HistGradientBoostingClassifier(random_state=42),
        "LogisticRegression": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(max_iter=1000, random_state=42))
        ]),
        "SVC": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", SVC(probability=True, random_state=42))
        ]),
        "KNeighbors": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", KNeighborsClassifier())
        ]),
        "GaussianNB": GaussianNB(),
    }

    benchmark_results = {}
    print("\n--- 5-Fold Stratified CV on Training Set (80% / 1,760 samples) ---")
    print(f"{'Classifier':24s} | {'CV Acc Mean +/- Std':21s} | {'CV Macro-F1 +/- Std':22s} | {'Test Acc':8s} | {'Test F1':8s} | {'Time (s)':8s}")
    print("-" * 105)

    scoring = {"accuracy": "accuracy", "macro_f1": "f1_macro"}

    best_name = None
    best_score = -1.0
    fitted_models = {}

    for name, clf in classifiers.items():
        t0 = time.time()
        cv_res = cross_validate(clf, X_train, y_train, cv=cv, scoring=scoring, n_jobs=-1)
        fit_time = time.time() - t0

        cv_acc_mean = float(np.mean(cv_res["test_accuracy"]))
        cv_acc_std = float(np.std(cv_res["test_accuracy"]))
        cv_f1_mean = float(np.mean(cv_res["test_macro_f1"]))
        cv_f1_std = float(np.std(cv_res["test_macro_f1"]))

        # Fit on full training set and evaluate on held-out test set
        clf.fit(X_train, y_train)
        fitted_models[name] = clf
        y_pred = clf.predict(X_test)
        test_acc = float(accuracy_score(y_test, y_pred))
        test_f1 = float(f1_score(y_test, y_pred, average="macro"))

        # Brier score calculation if predict_proba available
        y_prob = clf.predict_proba(X_test)
        brier = compute_multiclass_brier(y_test_indices, y_prob, n_classes)

        benchmark_results[name] = {
            "cv_accuracy_mean": cv_acc_mean,
            "cv_accuracy_std": cv_acc_std,
            "cv_macro_f1_mean": cv_f1_mean,
            "cv_macro_f1_std": cv_f1_std,
            "test_accuracy": test_acc,
            "test_macro_f1": test_f1,
            "brier_score": round(brier, 4),
            "cv_time_sec": round(fit_time, 2),
        }

        print(f"{name:24s} | {cv_acc_mean*100:6.2f}% +/- {cv_acc_std*100:4.2f}% | {cv_f1_mean*100:6.2f}% +/- {cv_f1_std*100:4.2f}% | {test_acc*100:6.2f}% | {test_f1*100:6.2f}% | {fit_time:7.2f}s")

        # Select best model based on CV accuracy then test F1
        if cv_acc_mean > best_score:
            best_score = cv_acc_mean
            best_name = name

    print("-" * 105)
    print(f"Winning Classifier: {best_name} (CV Acc: {benchmark_results[best_name]['cv_accuracy_mean']*100:.2f}%, Test Acc: {benchmark_results[best_name]['test_accuracy']*100:.2f}%)")

    winning_model = fitted_models[best_name]

    # 3. Feature Importance / Input Sensitivity
    print("\n--- Feature Importance / Input Sensitivity ---")
    if hasattr(winning_model, "feature_importances_"):
        raw_importances = winning_model.feature_importances_
    elif hasattr(winning_model, "named_steps") and hasattr(winning_model.named_steps["clf"], "feature_importances_"):
        raw_importances = winning_model.named_steps["clf"].feature_importances_
    else:
        # Fallback to RF feature importances for consistency
        raw_importances = fitted_models["RandomForest"].feature_importances_

    feature_importances = {feat: round(float(imp), 4) for feat, imp in zip(soil_and_weather_features, raw_importances)}
    # Sort descending
    sorted_fi = sorted(feature_importances.items(), key=lambda x: x[1], reverse=True)
    for feat, imp in sorted_fi:
        print(f"  {feat:15s}: {imp:.4f} ({imp*100:.1f}%)")

    # 4. Perturbation Stability (+/-5%, +/-10%)
    print("\n--- Perturbation Stability Test on Held-Out Test Set (440 samples) ---")
    stability_res = evaluate_perturbation_stability(winning_model, X_test, percentages=(0.05, 0.10))
    for pert, metrics in stability_res.items():
        print(f"  Perturbation {pert:7s}: Prediction Stability = {metrics['stability_pct']}%, Flip Rate = {metrics['flip_rate_pct']}% ({metrics['flips']}/{metrics['total_evals']} evaluations)")

    # 5. Out-of-Distribution (OOD) Detector
    print("\n--- Out-of-Distribution (OOD) Detector Training ---")
    # Fit IsolationForest on valid training features with contamination=0.03
    ood_detector = IsolationForest(contamination=0.03, random_state=42)
    ood_detector.fit(X_train)
    # Check in-distribution vs extreme synthetic OOD points
    in_dist_test = ood_detector.predict(X_test)
    in_dist_normal_rate = float(np.mean(in_dist_test == 1))
    print(f"  Test set identified as In-Distribution: {in_dist_normal_rate*100:.2f}%")

    synthetic_ood = pd.DataFrame([
        {"N": 400.0, "P": 10.0, "K": 20.0, "temperature": 65.0, "humidity": 10.0, "ph": 1.5, "rainfall": 5.0}, # extreme pH & temp
        {"N": 0.0, "P": 0.0, "K": 0.0, "temperature": -15.0, "humidity": 100.0, "ph": 12.0, "rainfall": 800.0}, # sub-zero temp & extreme rain
        {"N": 80.0, "P": 40.0, "K": 40.0, "temperature": 25.0, "humidity": 80.0, "ph": 6.5, "rainfall": 200.0}, # realistic normal
    ])
    synthetic_preds = ood_detector.predict(synthetic_ood)
    print(f"  Extreme Synthetic Point 1 (pH 1.5, 65°C): {'OOD Flagged' if synthetic_preds[0] == -1 else 'Normal'}")
    print(f"  Extreme Synthetic Point 2 (-15°C, 800mm rain): {'OOD Flagged' if synthetic_preds[1] == -1 else 'Normal'}")
    print(f"  Realistic Point 3 (pH 6.5, 25°C, 200mm rain): {'Normal' if synthetic_preds[2] == 1 else 'OOD Flagged'}")

    # 6. Train Weather-Only Model Variant for Missing Soil Nutrients
    print("\n--- Training Weather-Only Model Variant (temperature, humidity, rainfall) ---")
    X_train_weather = X_train[weather_only_features]
    X_test_weather = X_test[weather_only_features]

    weather_model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
    weather_model.fit(X_train_weather, y_train)
    y_pred_w = weather_model.predict(X_test_weather)
    weather_test_acc = float(accuracy_score(y_test, y_pred_w))
    weather_test_f1 = float(f1_score(y_test, y_pred_w, average="macro"))
    print(f"  Weather-Only Model Test Accuracy: {weather_test_acc*100:.2f}%")
    print(f"  Weather-Only Model Test Macro-F1: {weather_test_f1*100:.2f}%")

    # 7. Probability Calibration Analysis
    y_test_probs = winning_model.predict_proba(X_test)
    winning_brier = compute_multiclass_brier(y_test_indices, y_test_probs, n_classes)
    max_probs = np.max(y_test_probs, axis=1)
    print("\n--- Probability Calibration Check ---")
    print(f"  Multiclass Brier Score Loss: {winning_brier:.4f}")
    print(f"  Mean Top-1 Confidence: {float(np.mean(max_probs))*100:.2f}% vs Actual Accuracy {test_acc*100:.2f}%")
    print("  Caveat: Tree ensembles can produce sharp/overconfident leaf probabilities.")
    print("  Compliance: Top crop scores are explicitly marked as 'uncalibrated model score'.")

    # 8. Save Artifacts
    full_model_path = ARTIFACTS_DIR / "crop_recommender.joblib"
    weather_model_path = ARTIFACTS_DIR / "crop_recommender_weather_only.joblib"
    metrics_path = ARTIFACTS_DIR / "crop_recommender_metrics.json"

    full_payload = {
        "model": winning_model,
        "model_name": best_name,
        "features": soil_and_weather_features,
        "classes": classes,
        "ood_detector": ood_detector,
        "version": "2.0.0",
        "trained_date": datetime.now(timezone.utc).isoformat(),
        "random_state": 42,
    }
    joblib.dump(full_payload, full_model_path)
    full_sha = compute_sha256(full_model_path)
    print(f"\nSaved full model payload to {full_model_path} (SHA-256: {full_sha})")

    weather_payload = {
        "model": weather_model,
        "model_name": "RandomForest_WeatherOnly",
        "features": weather_only_features,
        "classes": classes,
        "version": "2.0.0",
        "trained_date": datetime.now(timezone.utc).isoformat(),
        "random_state": 42,
    }
    joblib.dump(weather_payload, weather_model_path)
    weather_sha = compute_sha256(weather_model_path)
    print(f"Saved weather-only model to {weather_model_path} (SHA-256: {weather_sha})")

    # Save metrics JSON
    metrics_data = {
        "model_name": f"CropRecommender-{best_name}",
        "dataset": "datasets/crop_recommendation.csv",
        "dataset_rows": len(df),
        "dataset_classes": n_classes,
        "split": {"train": len(y_train), "test": len(y_test), "ratio": "80/20", "random_state": 42},
        "benchmark_8_classifiers": benchmark_results,
        "winning_classifier": best_name,
        "feature_importances": feature_importances,
        "perturbation_stability": stability_res,
        "brier_score_loss": round(winning_brier, 4),
        "weather_only_variant": {
            "test_accuracy": round(weather_test_acc, 4),
            "test_macro_f1": round(weather_test_f1, 4),
            "features": weather_only_features,
        },
        "artifact_hashes": {
            "crop_recommender.joblib": full_sha,
            "crop_recommender_weather_only.joblib": weather_sha,
        },
        "scientific_honesty_note": (
            "The Kaggle Crop Recommendation dataset contains 2,200 clean, synthetic/augmented observations "
            "(100 per crop class). Reported accuracy measures statistical separation on this benchmark distribution, "
            "NOT agronomic certainty across all Indian farm microclimates. Probabilities are labeled as "
            "'uncalibrated model score'."
        ),
    }

    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=2)
    print(f"Saved comprehensive metrics to {metrics_path}")


if __name__ == "__main__":
    main()
