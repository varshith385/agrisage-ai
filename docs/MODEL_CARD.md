# AgriSage AI — Model Cards (`docs/MODEL_CARD.md`)

**Yuktik 2026 Hackathon | Synchronized Model Documentation**

> [!NOTE]
> In accordance with the **Yuktik Honesty Rules**:
> - All performance metrics below are copied verbatim from real holdout test runs recorded in `model_artifacts/crop_recommender_metrics.json` and `model_artifacts/yield_metrics.json`.
> - Zero synthetic data was used for model training; all data was loaded from verified files in `datasets/`.
> - Datasets are third-party GitHub mirrors of public datasets; licenses and original institutional gazette records remain "to verify".
> - Artifacts are loaded strictly from our local builds verified by SHA-256 checksums.

---

## 1. Crop Recommender (`CropRecommender-RandomForest`)

### 1.1 Overview & Intended Use
- **Task**: Multi-class classification predicting top-3 optimal crops based on soil nutrients and meteorological features.
- **Intended Use**: Guiding Indian smallholder farmers on seasonal crop selection based on field soil test chemistry ($N, P, K, \text{pH}$) and agro-meteorological forecasts (temperature, humidity, rainfall).
- **Missing Soil Nutrients Fallback**: When soil chemistry is not provided, a dedicated weather-only model variant (`crop_recommender_weather_only.joblib`) is executed with confidence capped at 0.50, explicitly labeled as *"weather-only model (soil parameters omitted)"*.

### 1.2 Training Data & Preprocessing
- **Dataset**: `datasets/crop_recommendation.csv` (Harvestify third-party GitHub copy, original ICAR benchmark to verify).
- **Dataset Size**: 2,200 observation rows (100 samples per class across 22 crops).
- **Classes (22)**: `apple`, `banana`, `blackgram`, `chickpea`, `coconut`, `coffee`, `cotton`, `grapes`, `jute`, `kidneybeans`, `lentil`, `maize`, `mango`, `mothbeans`, `mungbean`, `muskmelon`, `orange`, `papaya`, `pigeonpeas`, `pomegranate`, `rice`, `watermelon`.
- **Common Crops NOT Covered**: `wheat`, `groundnut`, `chilli`, `tomato`, `sugarcane`, `soybean`, `mustard`, `onion`.
- **Split Strategy**: Stratified Split — 70% Train (1,540 rows), 15% Validation (330 rows), 15% Holdout Test (330 rows) with `stratify=y` and `random_state=42`.

### 1.3 Model Architecture & Hyperparameters
- **Candidate Models Compared (5-Fold Stratified CV on Train Set)**:
  - `DummyClassifier(strategy="stratified")`: CV Accuracy = $3.96\% \pm 1.07\%$
  - `HistGradientBoostingClassifier(max_iter=100, max_depth=8)`: CV Accuracy = $99.03\% \pm 0.46\%$
  - `RandomForestClassifier(n_estimators=100, max_depth=12)`: CV Accuracy = $99.35\% \pm 0.36\%$
- **Selected Model**: `RandomForestClassifier(n_estimators=150, max_depth=12, random_state=42)`

### 1.4 Holdout Test Metrics (Strictly Holdout Test Set)
- **Holdout Test Accuracy**: **99.39%** (`0.9939`)
- **Holdout Test Macro-F1**: **99.39%** (`0.9939`)
- **Feature Importances**:
  - `rainfall`: 0.2195 (22.0%)
  - `humidity`: 0.2116 (21.2%)
  - `K` (Potassium): 0.1799 (18.0%)
  - `P` (Phosphorous): 0.1498 (15.0%)
  - `N` (Nitrogen): 0.1088 (10.9%)
  - `temperature`: 0.0779 (7.8%)
  - `ph`: 0.0526 (5.3%)

### 1.5 Weather-Only Model Variant (Missing Soil Nutrients)
- **Holdout Test Accuracy**: **92.73%** (`0.9273`)
- **Holdout Test Macro-F1**: **92.67%** (`0.9267`)
- **Features Used**: `temperature, humidity, rainfall`

### 1.6 Artifact Integrity Hashes
- `model_artifacts/crop_recommender.joblib`: `37768dc24e9b75cd5a80a260f67741976c8f816e21f24be36f5e24c99ce98f76`
- `model_artifacts/crop_recommender_weather_only.joblib`: `30e72329200f559fd2dc0122e5ca0b7ae961c052b755fb09d034e9b0a1dc2fa6`

### 1.7 Limitations & Ethical Considerations
- **Clean/Augmented Benchmark Data**: The source dataset is clean and heavily augmented. The 99.4% holdout score reflects benchmark distribution fit, NOT true field accuracy across heterogeneous Indian soil series. The UI NEVER advertises 99% accuracy; output probabilities are explicitly displayed as *"model probability (uncalibrated)"*.
- **Climate Suitability Guardrails**: A rule-based climate suitability filter suppresses or warns against geographically incongruous recommendations (e.g. Apple or Coffee in semi-arid southern plains).

---

## 2. Crop Yield Regressor (`CropYield-MultiQuantileHistGradientBoosting`)

### 2.1 Overview & Intended Use
- **Task**: Multi-quantile tabular regression predicting expected crop yield (quintals/acre) along with an empirical 10–90% prediction interval (`lower_bound`, `expected_yield`, `upper_bound`).
- **Intended Use**: Providing smallholder farmers with realistic expected yield bounds to calibrate seasonal revenue and operating loans, avoiding single-point overconfidence.

### 2.2 Training Data & Unit Conversion
- **Dataset**: `datasets/crop_production.csv` (Ministry of Agriculture & Farmers Welfare, DES via third-party GitHub copy, original to verify).
- **Total Valid Observations**: 226,047 records across 100 crops.
- **Unit Conversion Formula**:
  In official Indian DES records, agricultural production is recorded in metric tonnes, while area is recorded in hectares. To convert to standard smallholder units:
  $$\text{Yield (quintals/acre)} = \frac{\text{Production (tonnes)}}{\text{Area (hectares)}} \times \frac{10\text{ quintals/tonne}}{2.47105\text{ acres/hectare}} \approx \text{Yield (tonnes/ha)} \times 4.0468564$$
- **Excluded Non-Tonne Crops**:
  - `COCONUT`: Recorded in nuts / thousand nuts (values reach 38,000+ nuts/ha). Excluded from yield regressor as *"not supported"*.
  - `JUTE`, `MESTA`, `SANNHAMP`: Recorded in commercial bales of 180 kg each. Excluded as *"not supported"*.
  - `COTTON(LINT)`: In official DES returns, cotton is reported in bales of 170 kg lint. To prevent unit distortion, cotton is excluded from the general tonnes model and flagged as *"not supported"*.
- **Supported Crops (100)**: All metric-tonne foodgrains (Rice, Wheat, Maize, Jowar, Bajra), pulses (Gram, Moong, Urad, Arhar), oilseeds (Groundnut, Soyabean, Sunflower, Mustard), tubers, and vegetables.

### 2.3 Time-Aware Split (Leakage-Free Validation)
To prevent temporal leakage across historical seasons:
- **Training Period**: Harvest years $1997 \le \text{Year} \le 2012$ (202,591 observation rows).
- **Holdout Test Period**: Harvest years $2013 \le \text{Year} \le 2015$ (23,456 observation rows).

### 2.4 Model Architecture & Encoding
- **Categoricals**: `State_Name`, `District_Name` (639 districts), `Crop`, `Season` encoded via `TargetEncoder(smooth="auto", cv=5, random_state=42)`.
- **Numericals**: `year_trend = Crop_Year - 1997`, `log_area = log1p(Area)`.
- **Quantile Regressors**:
  - `model_q50`: `HistGradientBoostingRegressor(loss="quantile", quantile=0.50, max_iter=120)`
  - `model_q10`: `HistGradientBoostingRegressor(loss="quantile", quantile=0.10, max_iter=100)`
  - `model_q90`: `HistGradientBoostingRegressor(loss="quantile", quantile=0.90, max_iter=100)`

### 2.5 Holdout Test Metrics & Honest Baseline Comparison
Evaluated on the 23,456 holdout test samples ($2013–2015$):

| Metric | Machine Learning Model (`HistGradientBoosting`) | Naive District-Mean Historical Baseline | Does ML Beat Baseline? |
|---|---|---|---|
| **MAE** | **6.45 quintals/acre** (`6.4469`) | **4.57 quintals/acre** (`4.5667`) | **NO** (Baseline is 1.88 q/acre closer) |
| **RMSE** | **21.96 quintals/acre** (`21.9649`) | **16.10 quintals/acre** (`16.1001`) | **NO** (Baseline has lower squared error) |
| **$R^2$ Score** | **0.8265** | **0.9068** | **NO** (Baseline captures more variance) |
| **10–90% Interval Empirical Coverage** | **77.26%** (Nominal: 80.0%) | N/A (Baseline provides point estimate only) | **CALIBRATED** |

**Honest Scientific Finding**: The machine learning model does **NOT** beat the historical district-mean naive baseline on point accuracy. In Indian district crop statistics, historical local averages already absorb regional soil series and micro-climates. The machine learning model's primary contribution is providing **empirically calibrated 10–90% prediction intervals** (77.3% coverage against 80% nominal), preventing deceptive point precision.

### 2.6 Dynamic Upstream Heuristic Adjustments
When integrated into the multi-agent pipeline, the baseline predicted yield is modified by upstream agent telemetry:
- **Fungal Disease Infection**: $-10.0\%$ penalty (*indicative assumption, no source*).
- **Vegetative Moisture Deficit**: $-8.0\%$ penalty (*indicative assumption, no source*).
- **Root Hypoxia / Waterlogging**: $-12.0\%$ penalty (*indicative assumption, no source*).
All penalties are visibly disclosed in `adjustment_factors[]` with exact percentages and the mandatory label *"indicative assumption, no source"*.

### 2.7 Artifact Integrity Hashes
- `model_artifacts/yield_model.joblib`: `422909f56f865887abc11505c44936c39afdd54c7a42e915417be13b0d90443a`

### 2.8 Limitations & Extrapolation Caveat
- **Temporal Validity**: Training data covers 1997 to 2012 with holdout testing on 2013 to 2015. Extrapolation to present-day agronomic yields (2026) is **unvalidated** due to changes in seed hybrids, GM bollgard adoptions, and climate shifts.
- **District Reorganization**: Telangana was formed in 2014; post-2016 split districts (Hanamkonda, Jangaon, etc.) are mapped to historical 1997–2014 parent districts (Warangal, Medak, etc.). If a district is completely unmapped, the system falls back to state-level averages with lower confidence, never silently guessing.
