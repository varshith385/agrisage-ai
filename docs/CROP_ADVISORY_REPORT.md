# Grow2Gain — Crop Advisory Rebuild & Comprehensive ML Benchmark Report

**Project**: Grow2Gain (formerly AgriSage AI)  
**Host Worktree**: `C:\work\agri-r7`  
**Git Branch**: `feat/round7`  
**Date**: November 2026  
**Reference**: ROUND 7b — Crop Advisory Classifier Correctness, Honest Decision States, and 16-Location Benchmark  

---

## 1. Executive Summary

In Round 7b, the **Crop Advisory** system has been completely rebuilt to ensure mathematical honesty, agro-climatic validity, and transparent multi-tier decision making:
1. **Root Cause Analysis & Fix**: Eliminated the defect where geographically distant farms received identical recommendations. Replaced hardcoded client-side state with live Open-Meteo 12-month archive climate normals, and decoupled measured soil test data from climate data.
2. **Honest Decision Tiers**: Replaced binary confidence claims with an explicit 4-tier state machine:
   - **Tier 1 (INVALID)**: Physically impossible inputs (negative nutrients, pH outside 0–14, humidity outside 0–100%, temperature outside -50 to 60°C) immediately raise 422 errors and refuse to process.
   - **Tier 2 (UNUSUAL - Envelope Breach)**: Inputs outside the training envelope are refused with: *"Unusual combination, not confident. Please verify with a soil test or local agriculture officer."*
   - **Tier 3 (UNUSUAL - Joint OOD)**: Rare joint combinations of in-envelope values are detected via `IsolationForest` and refused.
   - **Tier 4 (LOW_CONFIDENCE vs CONFIDENT)**: If soil nutrients are absent, the system executes a dedicated weather-only model variant marked *"Indicative only, soil values needed"* and is never labeled High confidence. Full mode is evaluated only when all 7 parameters are present.
3. **Rigorous 8-Classifier Benchmark**: Benchmarked 8 standard `scikit-learn` models under 5-fold Stratified Cross-Validation on the Kaggle benchmark dataset. Selected `GaussianNB` via an objective decision rule (highest CV macro-F1: 99.49%, lowest CV log-loss: 0.0158, 96.55% joint stability).
4. **16-Location Pan-India Experiment**: Validated the complete system across 16 agro-climatically diverse Indian locations in two modes (Fixed Soil vs Soil Absent), confirming dynamic, climatically sensible crop selection.

---

## 2. Root Cause Analysis: Identical Recommendations Across Different Locations

### 2.1 The Problem in Plain Words
In prior rounds, users reported that the crop advisory produced the same recommendation (often Jute) regardless of farm location. The root cause had two parts:
1. **Hardcoded React Initial State**: `CropRecommendationPage.tsx` unconditionally initialized state variables with fixed constants:
   $$\mathbf{x} = [N=50, P=50, K=50, \text{pH}=6.5, T=28.0^\circ\text{C}, H=70.0\%, R=180.0\text{ mm}]$$
   The page did not inspect `activeFarm.latitude` or `activeFarm.longitude` upon loading.
2. **Synthetic Soil Defaults**: Even when the user had never conducted a soil test, the UI silently transmitted the synthetic 50-50-50 NPK numbers, displaying a misleading `"Full Soil + Weather"` badge.

### 2.2 Pre-Fix vs Post-Fix Verification Across 8 Diverse Locations
Executed using `scripts/diagnose_crop_locations.py`:

| Location & State | Coordinates | Old Hardcoded Vector | Pre-Fix Top Crops (Bug) | Live Open-Meteo Archive Vector | Post-Fix Top Crops (Weather-Only Model) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Warangal, Telangana** | 17.97°N, 79.59°E | `[50, 50, 50, 6.5, 28, 70, 180]` | Jute (100.0%) | 27.5°C, 59.1% RH, 43.3 mm/mo | **Mothbeans** (57.0%), Lentil (39.0%) |
| **Rajkot, Gujarat** | 22.30°N, 70.80°E | `[50, 50, 50, 6.5, 28, 70, 180]` | Jute (100.0%) | 27.5°C, 56.7% RH, 48.0 mm/mo | **Mothbeans** (71.0%), Lentil (22.0%) |
| **Jaipur, Rajasthan** | 26.91°N, 75.79°E | `[50, 50, 50, 6.5, 28, 70, 180]` | Jute (100.0%) | 25.5°C, 54.4% RH, 39.4 mm/mo | **Mothbeans** (88.0%), Lentil (9.0%) |
| **Kolkata, West Bengal** | 22.57°N, 88.36°E | `[50, 50, 50, 6.5, 28, 70, 180]` | Jute (100.0%) | 26.5°C, 73.3% RH, 172.4 mm/mo | **Jute** (96.0%), Coffee (3.0%) |
| **Chennai, Tamil Nadu** | 13.08°N, 80.27°E | `[50, 50, 50, 6.5, 28, 70, 180]` | Jute (100.0%) | 28.9°C, 70.7% RH, 115.4 mm/mo | **Pigeonpeas** (28.0%), Banana (21.0%) |
| **Shimla, Himachal Pradesh** | 31.10°N, 77.17°E | `[50, 50, 50, 6.5, 28, 70, 180]` | Jute (100.0%) | 13.3°C, 66.4% RH, 96.1 mm/mo | **Maize** (40.0%), Grapes (20.0%) |
| **Guwahati, Assam** | 26.14°N, 91.74°E | `[50, 50, 50, 6.5, 28, 70, 180]` | Jute (100.0%) | 24.1°C, 81.6% RH, 196.8 mm/mo | **Jute** (53.0%), Rice (46.0%) |
| **Kochi, Kerala** | 9.93°N, 76.27°E | `[50, 50, 50, 6.5, 28, 70, 180]` | Jute (100.0%) | 27.6°C, 80.1% RH, 179.7 mm/mo | **Banana** (62.0%), Jute (18.0%) |

---

## 3. Dataset Analysis & Agronomic Limitations

### 3.1 Dataset Summary (`datasets/crop_recommendation.csv`)
- **Total Rows**: 2,200
- **Total Columns**: 8 (`N`, `P`, `K`, `temperature`, `humidity`, `ph`, `rainfall`, `label`)
- **Unique Crops**: 22 crops, exactly 100 rows per crop (perfect class balance)
- **Duplicate Rows**: 0
- **Missing / Null Values**: 0
- **SHA-256**: `808e1d84a544647f1ab2fdae04f434b1842692d6be09eee18a5c2d43eb78d77c`

### 3.2 Overall Feature Distributions (Real Measured Statistics)
| Feature | Units | Min | Max | Mean | Std Dev |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Nitrogen (N)** | kg/ha | 0.00 | 140.00 | 50.55 | 36.92 |
| **Phosphorus (P)** | kg/ha | 5.00 | 145.00 | 53.36 | 32.99 |
| **Potassium (K)** | kg/ha | 5.00 | 205.00 | 48.15 | 50.65 |
| **Temperature** | °C | 8.83 | 43.68 | 25.62 | 5.06 |
| **Relative Humidity** | % | 14.26 | 99.98 | 71.48 | 22.26 |
| **Soil pH** | dimensionless | 3.50 | 9.94 | 6.47 | 0.77 |
| **Rainfall** | mm | 20.21 | 298.56 | 103.46 | 54.96 |

### 3.3 What the Rainfall, Temperature, and Humidity Columns Plausibly Mean
- **Rainfall (20.21 to 298.56 mm, mean 103.46 mm)**: In Indian agriculture, annual rainfall in crop-producing regions typically ranges from 400 mm to over 2,500 mm, while single-day rainfall is zero on most days. The values (20–300 mm) plausibly represent **mean monthly rainfall during the active crop cycle** or a 30-day cumulative window. It cannot represent annual rainfall (which would classify all of India as desert) nor daily rainfall (which would classify 100 mm as torrential flood).
- **Temperature (8.83 to 43.68°C, mean 25.62°C)**: Plausibly represents the **mean daily temperature** averaged over the growing season.
- **Humidity (14.26 to 99.98%, mean 71.48%)**: Plausibly represents the **mean relative humidity (%)** during vegetative growth.
- **Uncertainty Notice**: The Kaggle dataset metadata does not specify the exact measurement window or geographic provenance. In Grow2Gain, we map trailing 12-month precipitation divided by 12.0 ($R = \sum R_i / 12.0$) to align honestly with the 20–300 mm range without inventing arbitrary multipliers.

### 3.4 Inherent Limitations of the Dataset
1. **Synthetic / Curated Nature**: The dataset exhibits unusually clean, non-overlapping Gaussian clusters. Real field soils exhibit wide spatial heterogeneity, micro-nutrient deficiencies (Zn, Fe, B), and drainage variations that this dataset ignores.
2. **No Location or Season Metadata**: The dataset contains zero geographic coordinates, soil classification types (Vertisols vs Alfisols), or calendar sowing dates (Kharif, Rabi, Zaid).
3. **Unverified Field Accuracy**: Model predictions reflect proximity to synthetic benchmark clusters. **Real-world agronomic efficacy is unverified**; farmers must always consult their local Agricultural Extension Officer (AEO) or Krishi Vigyan Kendra (KVK).

---

## 4. Open-Meteo Climate Normals Integration

### 4.1 Trailing 12-Month Archive Methodology
To prevent seasonal distortion (e.g., winter readings yielding 0 mm rainfall across India), Grow2Gain queries the Open-Meteo Historical Weather API across trailing 365 days:
$$\bar{T} = \frac{1}{365} \sum_{i=1}^{365} T_i, \quad \bar{H} = \frac{1}{365} \sum_{i=1}^{365} H_i, \quad R_{\text{monthly}} = \frac{1}{12} \sum_{i=1}^{365} P_i$$
- **Window Dates**: Trailing 365 days (e.g., `2023-11-15` to `2024-11-14`).
- **Caching**: Results are cached in `CLIMATE_NORMALS_CACHE` keyed by rounded latitude/longitude (`round(lat, 2)`, `round(lon, 2)`) and calendar month.
- **Graceful Failure**: If the Open-Meteo API is unreachable, the system raises an explicit HTTP 503 error, renders an `ErrorState` in the UI with a retry button, and prompts the farmer to enter local values manually. **It never injects hidden fallback defaults.**

---

## 5. Machine Learning Benchmark & Selection Rule

### 5.1 5-Fold Stratified Cross-Validation Benchmark (8 Classifiers)
Trained with `random_state=42` on 80% train partition (1,760 samples), evaluated on 20% test partition (440 samples):

| Classifier | CV Acc (Mean ± Std) | CV Macro-F1 (Mean ± Std) | CV Weighted-F1 | CV Log-Loss (Mean ± Std) | Test Acc | Test Macro-F1 | Test Log-Loss | CV Fit Time (s) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **GaussianNB** | **99.49% ± 0.42%** | **99.49% ± 0.42%** | **99.49% ± 0.42%** | **0.0158 ± 0.0088** | **99.55%** | **99.54%** | **0.0156** | **0.11s** |
| **RandomForest** | 99.38% ± 0.61% | 99.37% ± 0.61% | 99.37% ± 0.61% | 0.0596 ± 0.0054 | 99.55% | 99.55% | 0.0504 | 1.47s |
| **ExtraTrees** | 99.38% ± 0.33% | 99.37% ± 0.33% | 99.37% ± 0.33% | 0.1068 ± 0.0040 | 99.55% | 99.55% | 0.0990 | 1.22s |
| **HistGradientBoosting** | 99.20% ± 0.42% | 99.21% ± 0.42% | 99.21% ± 0.42% | 0.0466 ± 0.0292 | 98.86% | 98.87% | 0.0415 | 33.03s |
| **DecisionTree** | 98.52% ± 0.68% | 98.52% ± 0.68% | 98.52% ± 0.68% | 0.5102 ± 0.2355 | 97.95% | 97.94% | 0.7065 | 0.19s |
| **SVC (StandardScaler)** | 97.90% ± 1.03% | 97.88% ± 1.06% | 97.88% ± 1.06% | 0.1888 ± 0.0050 | 98.41% | 98.40% | 0.1396 | 1.19s |
| **LogisticRegression (Scaled)** | 96.82% ± 0.66% | 96.78% ± 0.68% | 96.78% ± 0.68% | 0.2365 ± 0.0171 | 97.27% | 97.25% | 0.1998 | 0.41s |
| **KNeighbors (Scaled)** | 96.53% ± 1.21% | 96.50% ± 1.24% | 96.50% ± 1.24% | 0.1871 ± 0.1158 | 97.95% | 97.93% | 0.1329 | 0.17s |

### 5.2 Selection Rule & Justification
- **Rule**: Select highest CV Macro-F1. Candidates within 1 standard deviation of the highest are considered tied; ties are broken by lowest CV Log-Loss, then highest perturbation stability.
- **Evaluation**: The top 4 models (GaussianNB 99.49%, ExtraTrees 99.37%, RandomForest 99.37%, HistGradientBoosting 99.21%) fall within 1-std (threshold: $99.49\% - 0.42\% = 99.07\%$).
- **Tie Breaker**: `GaussianNB` achieves dramatically lower CV log-loss (**0.0158**) compared to RandomForest (**0.0596**), ExtraTrees (**0.1068**), and HistGradientBoosting (**0.0466**). It also trains in 0.11 seconds and achieved 96.55% joint perturbation stability. Therefore, **GaussianNB** was selected as the production multi-crop model.

---

## 6. Probability Calibration & Out-of-Distribution Validation

### 6.1 Calibration Comparison (Raw vs Sigmoid vs Isotonic)
Evaluated on held-out test data and on synthetic extreme points ($N=500, \text{pH}=14, T=60^\circ\text{C}, R=0\text{ mm}$):

| Model | Variant | Test Log-Loss | Expected Calibration Error (ECE) | Max Prob on Extreme Point |
| :--- | :--- | :---: | :---: | :---: |
| **GaussianNB** | **Raw (Production)** | **0.0156** | **0.0064** | **1.0000** |
| GaussianNB | Sigmoid | 0.0858 | 0.0640 | 0.9345 |
| GaussianNB | Isotonic | 0.0141 | 0.0036 | 1.0000 |
| RandomForest | Raw | 0.0504 | 0.0376 | 0.5600 |
| RandomForest | Sigmoid | 0.0846 | 0.0696 | 0.8802 |
| RandomForest | Isotonic | 0.0195 | 0.0061 | 0.8142 |
| ExtraTrees | Raw | 0.0990 | 0.0797 | 0.5400 |
| ExtraTrees | Sigmoid | 0.0854 | 0.0726 | 0.6752 |
| ExtraTrees | Isotonic | 0.0164 | 0.0087 | 0.7201 |

> [!IMPORTANT]
> Because GaussianNB produces confident probabilities (1.0000) even when evaluated on extreme points, relying solely on model softmax probabilities is dangerous. This necessitates our **Tier 2 (Envelope Checking)** and **Tier 3 (IsolationForest OOD)** pre-filters to refuse extreme/unusual points before outputting a recommendation.

### 6.2 Out-of-Distribution (OOD) Detector Validation
Two separate `IsolationForest` detectors were trained (contamination=0.03, random_state=42):
- **Full 7-Feature Model Detector**:
  - False positive rate on held-out real test samples: **4.09%**
  - Detection rate on extreme/impossible test points: **100.0%**
- **Weather-Only 3-Feature Model Detector**:
  - False positive rate on held-out real test samples: **2.95%**
  - Detection rate on extreme/impossible test points: **100.0%**

### 6.3 Perturbation Sensitivity & Stability
Evaluated by perturbing inputs by ±5% and ±10% of their feature range across all test samples:

| Input Variable | Stability at ±5% | Flip Rate at ±5% | Stability at ±10% | Flip Rate at ±10% |
| :--- | :---: | :---: | :---: | :---: |
| **Nitrogen (N)** | 99.66% | 0.34% | 99.55% | 0.45% |
| **Phosphorus (P)** | 99.55% | 0.45% | 98.41% | 1.59% |
| **Potassium (K)** | 98.41% | 1.59% | 78.52% | 21.48% |
| **Temperature** | 99.66% | 0.34% | 97.73% | 2.27% |
| **Humidity** | 98.18% | 1.82% | 88.75% | 11.25% |
| **Soil pH** | 99.55% | 0.45% | 96.82% | 3.18% |
| **Rainfall** | 93.98% | 6.02% | 75.57% | 24.43% |
| **All 7 Variables (Joint)** | **96.55%** | **3.45%** | **78.36%** | **21.64%** |

- **Per-Crop Stability at ±5%**: Apple, Banana, Chickpea, Coconut, Coffee, Cotton, Grapes, Kidneybeans, Mungbean, Watermelon = **100.0%**; Mothbeans = **99.0%**; Jute = **98.0%**; Maize = **95.0%**; Rice = **86.0%**; Lentil = **78.0%**.

---

## 7. Class-Wise Performance Metrics (Held-Out Test Set)

Evaluated on the 20% test partition (20 samples per crop, 440 total):

| Crop | Precision | Recall | F1-Score | Support | Confused Pairs |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **apple** | 1.0000 | 1.0000 | 1.0000 | 20 | None |
| **banana** | 1.0000 | 1.0000 | 1.0000 | 20 | None |
| **blackgram** | 1.0000 | 1.0000 | 1.0000 | 20 | None |
| **chickpea** | 1.0000 | 1.0000 | 1.0000 | 20 | None |
| **coconut** | 1.0000 | 1.0000 | 1.0000 | 20 | None |
| **coffee** | 1.0000 | 1.0000 | 1.0000 | 20 | None |
| **cotton** | 1.0000 | 1.0000 | 1.0000 | 20 | None |
| **grapes** | 1.0000 | 1.0000 | 1.0000 | 20 | None |
| **jute** | 0.9091 | 1.0000 | 0.9524 | 20 | 2 instances of true rice predicted as jute |
| **kidneybeans** | 1.0000 | 1.0000 | 1.0000 | 20 | None |
| **lentil** | 1.0000 | 1.0000 | 1.0000 | 20 | None |
| **maize** | 1.0000 | 1.0000 | 1.0000 | 20 | None |
| **mango** | 1.0000 | 1.0000 | 1.0000 | 20 | None |
| **mothbeans** | 1.0000 | 1.0000 | 1.0000 | 20 | None |
| **mungbean** | 1.0000 | 1.0000 | 1.0000 | 20 | None |
| **muskmelon** | 1.0000 | 1.0000 | 1.0000 | 20 | None |
| **orange** | 1.0000 | 1.0000 | 1.0000 | 20 | None |
| **papaya** | 1.0000 | 1.0000 | 1.0000 | 20 | None |
| **pigeonpeas** | 1.0000 | 1.0000 | 1.0000 | 20 | None |
| **pomegranate** | 1.0000 | 1.0000 | 1.0000 | 20 | None |
| **rice** | 1.0000 | 0.9000 | 0.9474 | 20 | 2 misclassified as jute |
| **watermelon** | 1.0000 | 1.0000 | 1.0000 | 20 | None |

---

## 8. 16-Location Pan-India Experiment

Executed across 16 agro-climatically diverse Indian locations using real Open-Meteo 12-month climate normals:
- **Experiment 1 (Fixed Typical Soil)**: User provides $N=37, P=51, K=32, \text{pH}=6.43$.
- **Experiment 2 (Soil Absent / Weather-Only)**: Soil inputs are completely omitted.

### 8.1 Results Table: Fixed Soil vs Soil Absent
| Location & State | Lat/Lon | 12-Month Climate Vector | Exp 1: Fixed Soil Top-1 (Status) | Exp 2: Soil Absent Top-1 (Status) |
| :--- | :---: | :---: | :---: | :---: |
| **Warangal, Telangana** | 17.97, 79.59 | 27.5°C, 59.1% RH, 43.3 mm/mo | **Mothbeans** 99.8% (CONFIDENT) | **Mothbeans** 57.0% (LOW_CONFIDENCE) |
| **Rajkot, Gujarat** | 22.30, 70.80 | 27.5°C, 56.7% RH, 48.0 mm/mo | **Mothbeans** 100.0% (CONFIDENT) | **Mothbeans** 71.0% (LOW_CONFIDENCE) |
| **Jaipur, Rajasthan** | 26.91, 75.79 | 25.5°C, 54.4% RH, 39.4 mm/mo | **Mothbeans** 100.0% (CONFIDENT) | **Mothbeans** 88.0% (LOW_CONFIDENCE) |
| **Kolkata, West Bengal** | 22.57, 88.36 | 26.5°C, 73.3% RH, 172.4 mm/mo | **Jute** 100.0% (CONFIDENT) | **Jute** 96.0% (LOW_CONFIDENCE) |
| **Chennai, Tamil Nadu** | 13.08, 80.27 | 28.9°C, 70.7% RH, 115.4 mm/mo | **Pigeonpeas** 62.3% (CONFIDENT) | **Pigeonpeas** 28.0% (LOW_CONFIDENCE) |
| **Shimla, Himachal Pradesh** | 31.10, 77.17 | 13.3°C, 66.4% RH, 96.1 mm/mo | **Maize** 83.4% (CONFIDENT) | **Maize** 40.0% (LOW_CONFIDENCE) |
| **Guwahati, Assam** | 26.14, 91.74 | 24.1°C, 81.6% RH, 196.8 mm/mo | **Jute** 54.3% (CONFIDENT) | **Jute** 53.0% (LOW_CONFIDENCE) |
| **Kochi, Kerala** | 9.93, 76.27 | 27.6°C, 80.1% RH, 179.7 mm/mo | **Jute** 93.3% (CONFIDENT) | **Banana** 62.0% (LOW_CONFIDENCE) |
| **Nagpur, Maharashtra** | 21.15, 79.08 | 28.0°C, 49.9% RH, 64.4 mm/mo | **Mothbeans** 100.0% (CONFIDENT) | **Mothbeans** 78.0% (LOW_CONFIDENCE) |
| **Ludhiana, Punjab** | 30.90, 75.85 | 24.0°C, 67.1% RH, 47.9 mm/mo | **Mothbeans** 68.7% (CONFIDENT) | **Lentil** 91.0% (LOW_CONFIDENCE) |
| **Patna, Bihar** | 25.60, 85.14 | 25.5°C, 70.5% RH, 79.8 mm/mo | **Maize** 57.0% (CONFIDENT) | **Maize** 77.0% (LOW_CONFIDENCE) |
| **Bhubaneswar, Odisha** | 20.30, 85.82 | 26.7°C, 75.6% RH, 237.2 mm/mo | **Jute** 96.2% (CONFIDENT) | **Rice** 50.0% (LOW_CONFIDENCE) |
| **Pune, Maharashtra** | 18.52, 73.86 | 25.8°C, 57.9% RH, 62.6 mm/mo | **Mothbeans** 98.6% (CONFIDENT) | **Blackgram** 38.0% (LOW_CONFIDENCE) |
| **Coimbatore, Tamil Nadu** | 11.02, 76.96 | 26.5°C, 69.4% RH, 87.9 mm/mo | **Maize** 66.4% (CONFIDENT) | **Maize** 61.0% (LOW_CONFIDENCE) |
| **Srinagar, Jammu & Kashmir** | 34.08, 74.80 | 13.0°C, 68.6% RH, 96.1 mm/mo | **Maize** 81.5% (CONFIDENT) | **Maize** 41.0% (LOW_CONFIDENCE) |
| **Bikaner, Rajasthan** | 28.02, 73.31 | 27.3°C, 44.7% RH, 19.9 mm/mo | **Mothbeans** (UNUSUAL / Refusal) | **Mothbeans** (UNUSUAL / Refusal) |

### 8.2 Summary of Distribution & Agro-Climatic Insights
- **Experiment 1 Status Counts**: 15 CONFIDENT, 0 LOW_CONFIDENCE, 1 UNUSUAL, 0 INVALID.
  - **Top-1 Crops**: Mothbeans (7), Maize (4), Jute (4), Pigeonpeas (1).
- **Experiment 2 Status Counts**: 0 CONFIDENT, 15 LOW_CONFIDENCE, 1 UNUSUAL, 0 INVALID.
  - **Top-1 Crops**: Mothbeans (5), Maize (4), Jute (2), Banana (1), Lentil (1), Rice (1), Blackgram (1), Pigeonpeas (1).
- **Why the Distribution Looks the Way It Does**:
  1. **Bikaner Refusal**: Bikaner's trailing rainfall is 19.9 mm/month, which falls strictly below the Kaggle training min (20.21 mm). Both models correctly flag this as **UNUSUAL (Refusal)** and refuse recommendation.
  2. **Dry Semi-Arid Cluster**: Warangal, Rajkot, Jaipur, and Nagpur experience low monthly rainfall (39–64 mm) and moderate humidity (50–59%). Combined with low-to-medium nitrogen (N=37), this matches the ecological niche of drought-tolerant legumes (**Mothbeans**).
  3. **High-Rainfall Deltaic Cluster**: Kolkata (172.4 mm), Bhubaneswar (237.2 mm), and Guwahati (196.8 mm) experience heavy precipitation and high humidity (>73%). In full mode, this activates **Jute**; in weather-only mode, Bhubaneswar selects **Rice** (50.0%) and Kochi selects tropical **Banana** (62.0%).
  4. **Cooler / Hill Cluster**: Shimla (13.3°C) and Srinagar (13.0°C) possess cooler climates where tropical crops cannot thrive, consistently activating **Maize** (81–83%).
  5. **Dynamic Agro-Climatic Diversity**: When soil is absent, 8 distinct crops emerge across the 16 locations (Mothbeans, Maize, Jute, Banana, Lentil, Rice, Blackgram, Pigeonpeas), demonstrating that crop selection is driven entirely by real climate variation rather than hardcoded heuristics.
