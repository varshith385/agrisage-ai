# Grow2Gain — Crop Advisory Rebuild & ML Benchmark Report

**Project**: Grow2Gain (formerly AgriSage AI)  
**Date**: November 2026  
**Host Worktree**: `C:\work\agri-r7`  
**Git Branch**: `feat/round7`  
**Component**: Phase 6 — Crop Advisory Prominence, Root-Cause Analysis, & ML Rebuild  

---

## 1. Executive Summary

In Round 7, **Crop Advisory** has been elevated to the **primary feature** of Grow2Gain:
1. **Navigation Prominence**: Positioned at the very top of the desktop sidebar with a distinct `"Main Feature"` accent badge, first item in mobile bottom navigation, first entry in the command palette (`Ctrl+K`), and featured as the lead card on the Dashboard in both words and pictorial modes.
2. **Root Cause Analysis & Fix**: Diagnosed and resolved the underlying cause of identical crop recommendations across geographically distant farm parcels. Replaced hardcoded frontend state with dynamic Open-Meteo agro-meteorology for farm and district coordinates, and instituted strict separation between measured soil test data and omitted soil values (`"Soil not provided"`).
3. **ML Rebuild & Rigorous Benchmark**: Benchmarked 8 standard `scikit-learn` classifiers using 5-fold Stratified Cross-Validation on an 80/20 train/test split. Fitted an Out-of-Distribution (OOD) detector (`IsolationForest`), measured perturbation stability (±5% and ±10%), analyzed probability calibration (Brier score loss), and trained a dedicated weather-only model variant for when soil tests are unavailable.

---

## 2. Root Cause Analysis: "Same Crop Across Different Locations"

### 2.1 The Underlying Problem in Plain Words
In prior versions, whenever a user loaded the Crop Recommendation page, the React state in `CropRecommendationPage.tsx` was unconditionally initialized with hardcoded values:
```ts
const [n, setN] = useState<number>(50.0);
const [p, setP] = useState<number>(50.0);
const [k, setK] = useState<number>(50.0);
const [ph, setPh] = useState<number>(6.5);
const [temp, setTemp] = useState<number>(28.0);
const [humidity, setHumidity] = useState<number>(70.0);
const [rainfall, setRainfall] = useState<number>(180.0);
const [omitSoil, setOmitSoil] = useState<boolean>(false);
```
Furthermore, the page did **not** inspect `activeFarm.latitude` or `activeFarm.longitude` to fetch local weather. When the recommendation API was invoked, it transmitted the exact same input vector:
$$\mathbf{x} = [N=50, P=50, K=50, \text{pH}=6.5, T=28.0^\circ\text{C}, H=70.0\%, R=180.0\text{ mm}]$$
regardless of whether the farm was in Warangal (semi-arid Deccan), Shimla (Himalayan alpine), Jaipur (Thar desert margin), or Kochi (tropical coastal rainforest).

Compounding the problem, the UI badge claimed `"Full Soil + Weather"` because `omitSoil` defaulted to `false` and synthetic 50-50-50 NPK numbers were silently fed into the model—even though the farmer had never conducted or entered a soil test.

### 2.2 Pre-Fix vs Post-Fix Verification Across 8 Diverse Locations
To demonstrate the root cause and verify the resolution, 8 geographically and climatically diverse Indian locations were tested using `scripts/diagnose_crop_locations.py`:

| Location & State | Coordinates | Old Hardcoded Vector | Pre-Fix Top Crops (Identical Bug) | Live Open-Meteo Weather Vector | Post-Fix Top Crops (Weather-Only Model) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Warangal, Telangana** | 17.97°N, 79.59°E | `[50, 50, 50, 6.5, 28, 70, 180]` | Jute (100.0%) | 22.0°C, 53% RH, 72.0 mm | **Maize** (65.6%), Pigeonpeas (9.9%), Mothbeans (9.7%) |
| **Rajkot, Gujarat** | 22.30°N, 70.80°E | `[50, 50, 50, 6.5, 28, 70, 180]` | Jute (100.0%) | 23.4°C, 71% RH, 40.0 mm | **Lentil** (64.8%), Maize (16.1%), Watermelon (11.0%) |
| **Jaipur, Rajasthan** | 26.91°N, 75.79°E | `[50, 50, 50, 6.5, 28, 70, 180]` | Jute (100.0%) | 21.7°C, 49% RH, 40.0 mm | **Lentil** (55.1%), Mothbeans (34.5%), Pigeonpeas (5.2%) |
| **Kolkata, West Bengal** | 22.57°N, 88.36°E | `[50, 50, 50, 6.5, 28, 70, 180]` | Jute (100.0%) | 23.2°C, 78% RH, 804.0 mm | **Rice** (54.1%), Jute (37.7%), Cotton (4.3%) |
| **Chennai, Tamil Nadu** | 13.08°N, 80.27°E | `[50, 50, 50, 6.5, 28, 70, 180]` | Jute (100.0%) | 26.3°C, 80% RH, 327.0 mm | **Rice** (70.4%), Jute (19.6%), Banana (4.2%) |
| **Shimla, Himachal Pradesh** | 31.10°N, 77.17°E | `[50, 50, 50, 6.5, 28, 70, 180]` | Jute (100.0%) | 6.0°C, 81% RH, 40.0 mm | **Grapes** (36.8%), Watermelon (35.1%), Lentil (21.0%) |
| **Guwahati, Assam** | 26.14°N, 91.74°E | `[50, 50, 50, 6.5, 28, 70, 180]` | Jute (100.0%) | 19.2°C, 86% RH, 40.0 mm | **Watermelon** (36.9%), Lentil (26.0%), Pomegranate (17.0%) |
| **Kochi, Kerala** | 9.93°N, 76.27°E | `[50, 50, 50, 6.5, 28, 70, 180]` | Jute (100.0%) | 26.4°C, 98% RH, 90.0 mm | **Papaya** (24.9%), Orange (24.0%), Coconut (22.1%) |

### 2.3 The Architectural Fix
1. **Dynamic Open-Meteo Integration**: The page resolves the latitude and longitude of the active farm (or selected district from the bundled pan-India dataset) and automatically queries Open-Meteo for live ambient temperature, relative humidity, and precipitation.
2. **Honest Input Discrimination**:
   - When no soil test values have been entered, `hasUserEnteredSoil` is `false`. The UI prominently displays an amber badge: `"Soil not provided (Weather-only)"`.
   - The payload sent to the backend **omits** N, P, K, and pH.
   - The backend executes the weather-only model variant, reducing the confidence score to **0.50** (`confidence_type: "heuristic"`) and returns an explicit disclaimer:
     > *"Soil nutrients (N, P, K, pH) were not provided; confidence is reduced. Soil testing is strongly recommended."*
   - Only when the farmer checks `"Enter measured soil test data (NPK & pH)"` are soil fields enabled and transmitted, triggering the full model and displaying `"Measured Soil + Weather"`.

---

## 3. Machine Learning Model Rebuild & Benchmark (Phase 6c)

### 3.1 Dataset Specification
- **Dataset File**: `datasets/crop_recommendation.csv`
- **Total Samples**: 2,200 rows, 8 columns
- **Target Variable**: `label` (22 agricultural crops, exactly 100 observations per class: balanced)
- **Feature Columns**:
  - `N`: Soil Nitrogen (kg/ha)
  - `P`: Soil Phosphorus (kg/ha)
  - `K`: Soil Potassium (kg/ha)
  - `temperature`: Ambient temperature (°C)
  - `humidity`: Relative humidity (%)
  - `ph`: Soil pH (dimensionless)
  - `rainfall`: Precipitation (mm)
- **Train/Test Split**: 80% Train (1,760 samples), 20% Held-out Test (440 samples), stratified by `label` with fixed `random_state=42`.

### 3.2 5-Fold Stratified Cross-Validation Benchmark (8 Classifiers)
Executed via `scripts/train_crop_models.py` on the training partition:

| # | Classifier | CV Accuracy (Mean ± Std) | CV Macro-F1 (Mean ± Std) | Held-Out Test Acc | Held-Out Test F1 | Multiclass Brier Score | CV Fit Time (s) |
| :-: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | **GaussianNB** | **99.49% ± 0.42%** | **99.49% ± 0.42%** | **99.55%** | **99.54%** | **0.0096** | **0.06s** |
| 2 | **RandomForestClassifier** | 99.38% ± 0.61% | 99.37% ± 0.61% | 99.55% | 99.55% | 0.0147 | 5.44s |
| 3 | **ExtraTreesClassifier** | 99.38% ± 0.33% | 99.37% ± 0.33% | 99.55% | 99.55% | 0.0299 | 5.19s |
| 4 | **HistGradientBoostingClassifier** | 99.20% ± 0.42% | 99.21% ± 0.42% | 98.86% | 98.87% | 0.0176 | 9.30s |
| 5 | **GradientBoostingClassifier** | 98.69% ± 0.34% | 98.69% ± 0.36% | 98.86% | 98.87% | 0.0165 | 19.01s |
| 6 | **SVC (StandardScaler)** | 97.90% ± 1.03% | 97.88% ± 1.06% | 98.41% | 98.40% | 0.0329 | 0.49s |
| 7 | **LogisticRegression (StandardScaler)** | 96.82% ± 0.66% | 96.78% ± 0.68% | 97.27% | 97.25% | 0.0735 | 0.16s |
| 8 | **KNeighborsClassifier (StandardScaler)** | 96.53% ± 1.21% | 96.50% ± 1.24% | 97.95% | 97.93% | 0.0364 | 0.07s |

*Selected Model Artifact*: GaussianNB and RandomForest/ExtraTrees are essentially tied at >99.3% accuracy due to the clean separation in the Kaggle benchmark dataset. GaussianNB achieved the lowest Multiclass Brier score loss (**0.0096**) and the highest CV accuracy (**99.49%**).

### 3.3 Class-Wise Precision, Recall, and F1-Score (Held-Out 440 Samples)
Evaluated on the 20% test partition (20 samples per crop):

```
              precision    recall  f1-score   support

       apple     1.0000    1.0000    1.0000        20
      banana     1.0000    1.0000    1.0000        20
   blackgram     1.0000    1.0000    1.0000        20
    chickpea     1.0000    1.0000    1.0000        20
     coconut     1.0000    1.0000    1.0000        20
      coffee     1.0000    1.0000    1.0000        20
      cotton     1.0000    1.0000    1.0000        20
      grapes     1.0000    1.0000    1.0000        20
        jute     0.9091    1.0000    0.9524        20
 kidneybeans     1.0000    1.0000    1.0000        20
      lentil     1.0000    1.0000    1.0000        20
       maize     1.0000    1.0000    1.0000        20
       mango     1.0000    1.0000    1.0000        20
   mothbeans     1.0000    1.0000    1.0000        20
    mungbean     1.0000    1.0000    1.0000        20
   muskmelon     1.0000    1.0000    1.0000        20
      orange     1.0000    1.0000    1.0000        20
      papaya     1.0000    1.0000    1.0000        20
  pigeonpeas     1.0000    1.0000    1.0000        20
 pomegranate     1.0000    1.0000    1.0000        20
        rice     1.0000    0.9000    0.9474        20
  watermelon     1.0000    1.0000    1.0000        20

    accuracy                         0.9955       440
   macro avg     0.9959    0.9955    0.9954       440
weighted avg     0.9959    0.9955    0.9954       440
```
Out of 440 test samples, exactly 2 samples were misclassified (confusion between rice and jute under high rainfall/humidity conditions).

### 3.4 Feature Importance / Input Sensitivity
Measured across the 7 input features:
1. **Rainfall**: `0.2302` (23.0%) — Primary environmental discriminator
2. **Humidity**: `0.2242` (22.4%) — Critical for tropical vs arid crop boundary
3. **Potassium (K)**: `0.1754` (17.5%) — Key discriminator for fruits (grapes, banana, apple)
4. **Phosphorus (P)**: `0.1508` (15.1%) — High requirement in apples and legumes
5. **Nitrogen (N)**: `0.0964` (9.6%) — Vegetative biomass demand (rice, cotton, maize)
6. **Temperature**: `0.0724` (7.2%) — Warm vs temperate chilling cutoff
7. **Soil pH**: `0.0506` (5.1%) — Buffer range constraint

### 3.5 Perturbation Stability Analysis
To measure sensitivity to sensor noise or estimation inaccuracies, input features across the 440 test samples were systematically perturbed by $\pm 5\%$ and $\pm 10\%$:

| Perturbation Level | Evaluations | Stable Predictions | Flips | Stability Rate | Flip Rate |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **$\pm 5\%$ Shift** | 880 | 855 | 25 | **97.16%** | **2.84%** |
| **$\pm 10\%$ Shift** | 880 | 716 | 164 | **81.36%** | **18.64%** |

*Finding*: The model exhibits robust stability under $\pm 5\%$ input noise, with a flip rate under 3%. At $\pm 10\%$ input shift, marginal boundary crops (e.g., mothbeans vs lentil, or rice vs jute) begin shifting.

### 3.6 Out-of-Distribution (OOD) Detector
- **Architecture**: `IsolationForest(contamination=0.03, random_state=42)` fitted on the 7-dimensional feature space of training observations.
- **In-Distribution Test Score**: **95.91%** of test samples are recognized as normal in-distribution data.
- **Empirical Validation on Extreme Synthetic Outliers**:
  - `Point 1` ($N=400$, $\text{pH}=1.5$, $T=65^\circ\text{C}$): Flagged as **Out-of-Distribution** (`predict == -1`).
  - `Point 2` ($T=-15^\circ\text{C}$, $R=800\text{ mm}$): Flagged as **Out-of-Distribution** (`predict == -1`).
  - `Point 3` ($N=80$, $P=40$, $K=40$, $\text{pH}=6.5$, $T=25^\circ\text{C}$, $R=200\text{ mm}$): Flagged as **Normal In-Distribution** (`predict == 1`).
- **Runtime Behavior**: When an OOD sample is detected, the API returns `is_out_of_distribution: true`, caps confidence at **0.45**, and adds an explicit warning notice on both backend and frontend.

### 3.7 Weather-Only Model Variant (Soil Omitted)
- **Features**: `[temperature, humidity, rainfall]`
- **Model**: `RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)`
- **Held-Out Test Accuracy**: **92.73%**
- **Held-Out Test Macro-F1**: **92.65%**
- **Operating Policy**: Assigned a maximum heuristic confidence of **0.50** to prevent farmers from relying solely on weather data without conducting soil tests.

### 3.8 Artifact Hashes
- Full Model (`model_artifacts/crop_recommender.joblib`): `185d7c15a4de168d29ffaaa8bb2058365a4b864537e4db07899525a6fe453a50`
- Weather-Only Model (`model_artifacts/crop_recommender_weather_only.joblib`): `b6886096eb338757e919f74136f1f194e28eb5f2d5badd06b6fe952405ab43e0`

---

## 4. Scientific Honesty & Regulatory Disclaimers

1. **Benchmark Caveat**: The Kaggle Crop Recommendation dataset contains 2,200 synthetic/augmented clean benchmark samples. The near-100% held-out test score reflects mathematical separation within this benchmark distribution, **not** guaranteed real-world field yield or agronomic certainty across all Indian microclimates.
2. **Probability Labeling**: All model probabilities are explicitly labeled in the UI and API as `"uncalibrated model score"`.
3. **Unsupported Crops Disclosure**: The model classifies 22 crops. Common Indian commercial crops not covered by the dataset (including **wheat, sugarcane, soybean, mustard, chilli, tomato, onion, and groundnut**) are explicitly declared in the API response under `unsupported_common_crops`.
4. **Soil Health Card Priority**: The application explicitly advises farmers to input verified Soil Health Card parameters rather than relying on weather-only estimates.
