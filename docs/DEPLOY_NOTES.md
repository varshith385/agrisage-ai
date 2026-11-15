# Grow2Gain — Deployment & Model Artifacts Guide

**Project**: Grow2Gain (formerly AgriSage AI)  
**Host Worktree**: `C:\work\agri-r7`  
**Branch**: `feat/round7`  
**Date**: November 2026  
**Reference**: Phase 8 — Reproducibility & Deployment Verification  

---

## 1. Startup Requirements & Model Artifacts

At startup, the Grow2Gain backend (`backend.app.main:app`) loads machine learning models and agro-climatic metadata to service crop advisory requests. All required artifact files reside in `model_artifacts/`:

| Artifact Path | Format | Role & Contents | Missing Behavior & Fallback |
| :--- | :--- | :--- | :--- |
| `model_artifacts/crop_recommender.joblib` | Python `joblib` | Serialized Isotonic-calibrated multi-crop model (`CalibratedClassifierCV(GaussianNB(), method="isotonic", cv=5)`) and 7-feature OOD detector (`IsolationForest`). Evaluates 7 inputs (N, P, K, pH, temperature, humidity, rainfall). | Fails cleanly with warning in `logger.warning`. Requests return status `MODEL_UNAVAILABLE` (`decision_status: "MODEL_UNAVAILABLE"`), `confidence: 0.0`, and empty crop list, triggering frontend `<ErrorState />`. Zero heuristic fallbacks, zero hardcoded confidences. Never crashes server. |
| `model_artifacts/crop_recommender_weather_only.joblib` | Python `joblib` | Serialized 3-feature weather model (`RandomForestClassifier`, 100 estimators; selected via lowest CV log-loss: 0.3035) and 3-feature weather OOD detector (`IsolationForest`). Used when soil test data is omitted. | Fails cleanly with warning. Requests return status `MODEL_UNAVAILABLE` with zero heuristic fallback. |
| `model_artifacts/crop_recommender_metadata.json` | JSON | Complete model benchmark metadata: candidate CV scores, selection rule justification, feature envelopes, OOD thresholds, calibration metrics, and perturbation stability. | If missing, engine falls back to bundled hardcoded envelope constants (`TRAINING_ENVELOPES` in `crop_recommender.py`) and logs a warning. |
| `model_artifacts/weather_16_locations.json` | JSON | Pre-computed Open-Meteo 12-month archive climate normals for trailing 365 complete days (`2025-11-15` to `2026-11-14`) across 16 benchmark Indian locations (Warangal, Ludhiana, Bikaner, Kolkata, Kochi, Shimla, etc.). | If missing, `get_climate_normals` queries the live Open-Meteo Archive API directly and populates its memory cache keyed by window dates. |

---

## 2. Model Training & Reproducibility Pipeline

The models and metadata can be retrained from scratch at any time with exact deterministic reproducibility.

### 2.1 Exact Retraining Command
```bash
# Using project Python virtual environment
python scripts/train_crop_models.py
```

### 2.2 Input Data Source
- **Path**: `datasets/crop_recommendation.csv`
- **Specification**: 2,200 rows, 8 columns (`N`, `P`, `K`, `temperature`, `humidity`, `ph`, `rainfall`, `label`), 22 balanced crops (100 rows per crop).
- **Integrity**: 0 duplicate rows, 0 null/NaN values.

### 2.3 Output Artifacts Written
The training script automatically writes:
1. `model_artifacts/crop_recommender.joblib` (7-feature model + IsolationForest detector)
2. `model_artifacts/crop_recommender_weather_only.joblib` (3-feature weather model + IsolationForest detector)
3. `model_artifacts/crop_recommender_metadata.json` (Full benchmark results, calibration, OOD stats)

### 2.4 Training Hyperparameters & Execution Characteristics
- **Random Seed**: Fixed `random_state = 42` across all splits, cross-validation folds, and probabilistic model initializations (`StratifiedKFold(n_splits=5, shuffle=True, random_state=42)`).
- **Execution Time**: Approximately **18 to 25 seconds** on a standard modern x86 CPU (evaluates 8 candidate classifiers under 5-fold CV, fits 3 calibration methods, evaluates perturbation sensitivity across 7 variables, and validates 2 IsolationForest detectors).
- **Dependencies**: `scikit-learn>=1.4.0`, `joblib>=1.3.0`, `numpy>=1.26.0`, `pandas>=2.2.0`.

---

## 3. Server Health & Pre-Flight Validation Suite

To verify that all required artifacts are valid, non-empty, and loadable prior to production deployment:

```bash
# Run artifact loading and decision tier tests
python -m pytest backend/tests/test_crop_advisory_round7b.py -v
```

This test suite explicitly verifies:
- `test_metadata_json_loads_and_has_valid_schema`: Validates metadata structure, 8 benchmark models, and calibrated decision thresholds.
- `test_trained_artifacts_exist_non_empty_and_loadable`: Asserts that `crop_recommender.joblib`, `crop_recommender_weather_only.joblib`, and `crop_recommender_metadata.json` exist, have size > 0 bytes, and can be deserialized into executable estimators.
- `test_tier1_negative_value_handled_as_invalid`: Confirms negative inputs are rejected with 422 errors.
- `test_tier2_n500_handled_as_unusual` & `test_rare_in_range_combination_flagged_by_ood`: Confirms out-of-distribution inputs refuse recommendations with status `UNUSUAL`.
- `test_real_training_row_is_confident_or_low_confidence_never_unusual`: Confirms in-envelope real data is never rejected.

---

## 4. Production Asset Deployment & Copy Inventory

When deploying `feat/round7` to the production host, ensure that all required non-git or binary assets are synchronized alongside the application codebase:

### 4.1 Asset Inventory Table

| Asset Path | Location / Category | Committed in Git? | Description |
| :--- | :--- | :---: | :--- |
| `model_artifacts/crop_recommender.joblib` | Machine Learning Models | No (`.gitignore`) | Isotonic-calibrated GaussianNB + IsolationForest (7 features) |
| `model_artifacts/crop_recommender_weather_only.joblib` | Machine Learning Models | No (`.gitignore`) | 3-Feature Weather-Only RandomForest + IsolationForest |
| `model_artifacts/crop_recommender_metadata.json` | Model Metadata | Yes | Calibration scores, candidate benchmarks, OOD metrics |
| `model_artifacts/weather_16_locations.json` | Telemetry Cache | Yes | 12-month climate normals for 16 test locations |
| `datasets/crop_recommendation.csv` | Dataset | Yes | 2,200 rows Kaggle crop dataset used for training/validation |
| `backend/app/data/subdistricts_villages.json` | Location Registry | Yes | Census 2011 Mandals/Taluks hierarchy for Telangana & AP |
| `frontend/src/data/india_districts.json` | Location Hierarchy | Yes | Pan-India State -> District mapping (en/te/hi) |
| `frontend/src/data/subdistricts_villages.json` | Location Hierarchy | Yes | Frontend clone of subdistricts/villages hierarchy |

### 4.2 Production Server File Copy Steps

If deploying to a fresh production container or server where binary model weights are not checked into Git:

```bash
# 1. Option A: Copy pre-trained artifacts from staging worktree
cp -r C:/work/agri-r7/model_artifacts/* /path/to/production/model_artifacts/

# 2. Option B: Retrain deterministically on the production server from datasets/
python scripts/train_crop_models.py

# 3. Verify all required location JSON files exist in their expected paths
ls -l backend/app/data/subdistricts_villages.json
ls -l frontend/src/data/india_districts.json
ls -l frontend/src/data/subdistricts_villages.json

# 4. Confirm backend tests pass and missing-artifact guard works
python -m pytest backend/tests/test_crop_advisory_round7b.py -q
```
