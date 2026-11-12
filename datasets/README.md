# AgriSage AI — Datasets Directory (`datasets/`)

**Yuktik 2026 Hackathon | Synchronized Code Reality Ledger**

> [!NOTE]
> In accordance with the **Yuktik Honesty Rules**:
> - All licences, provenance, and historical authority records below are marked **"to verify"** unless directly inspected at the original official gazette.
> - Datasets are downloaded as third-party GitHub copies of public data; the original government/institutional sources are not independently verified.
> - Row counts and column schemas below reflect the exact files loaded on disk.
> - Large dataset files (`> 20 MB` or raw CSVs) are gitignored in `.gitignore`. Reproduce using `python scripts/download_datasets.py`.

---

## 1. Crop Recommendation Dataset (`datasets/crop_recommendation.csv`)

- **File Path**: `datasets/crop_recommendation.csv`
- **Source URL**: `https://raw.githubusercontent.com/Gladiator07/Harvestify/master/Data-processed/crop_recommendation.csv` (Harvestify repository copy).
- **Original Source**: Claimed ICAR / Indian soil test benchmarks (*to verify*).
- **Licence**: Open Source / Public Domain (*to verify*).
- **SHA-256**: `808e1d84a544647f1ab2fdae04f434b1842692d6be09eee18a5c2d43eb78d77c`
- **File Size**: 147,833 bytes (~148 KB).
- **Total Rows**: 2,201 (1 header row + 2,200 observation rows).
- **Class Balance**: 22 crops, exactly 100 observations per crop.
- **Columns**:
  1. `N` (float): Ratio of Nitrogen content in soil (kg/ha equivalent, range: 0 to 140).
  2. `P` (float): Ratio of Phosphorous content in soil (kg/ha equivalent, range: 5 to 145).
  3. `K` (float): Ratio of Potassium content in soil (kg/ha equivalent, range: 5 to 205).
  4. `temperature` (float): Ambient temperature in degrees Celsius (range: 8.83 to 43.68 °C).
  5. `humidity` (float): Relative humidity percentage (range: 14.26 to 99.98%).
  6. `ph` (float): Soil pH value (range: 3.50 to 9.94).
  7. `rainfall` (float): Precipitation in mm (range: 20.21 to 298.56 mm).
  8. `label` (string): Crop target class (22 crops).

### Covered Crops (22):
`rice`, `maize`, `chickpea`, `kidneybeans`, `pigeonpeas`, `mothbeans`, `mungbean`, `blackgram`, `lentil`, `pomegranate`, `banana`, `mango`, `grapes`, `watermelon`, `muskmelon`, `apple`, `orange`, `papaya`, `coconut`, `cotton`, `jute`, `coffee`.

### Important Limitations & Uncovered Crops:
- **Clean/Augmented Benchmark Data**: This dataset is synthetic/heavily augmented; holdout validation metrics reflect model fit on benchmark distributions, NOT field accuracy across raw microclimates.
- **Common Indian Crops NOT Covered**: `wheat`, `groundnut`, `chilli`, `tomato`, `sugarcane`, `soybean`, `mustard`, `onion`. The application explicitly surfaces that these common crops are outside the model's domain.

---

## 2. Indian Crop Production & Yield Dataset (`datasets/crop_production.csv`)

- **File Path**: `datasets/crop_production.csv`
- **Source URL**: `https://raw.githubusercontent.com/ankitaS11/Crop-Yield-Prediction-in-India-using-ML/master/crop_production.csv` (Third-party GitHub mirror).
- **Original Source**: Directorate of Economics and Statistics (DES), Ministry of Agriculture and Farmers Welfare, Government of India via Open Government Data (OGD) platform (*to verify*).
- **Licence**: Government Open Data License - India (NDSAP) (*to verify*).
- **SHA-256**: `5b2637058ca4aff2ef7c0e0f2f391bca712300d082693b585f489871fd91d520`
- **File Size**: 15,316,741 bytes (~15.3 MB).
- **Total Rows**: 246,092 (1 header row + 246,091 observation rows).
- **Temporal Coverage**: Years 1997 to 2015 (Telangana records span 1997 to 2014). Extrapolation beyond 2015 is unvalidated.
- **Columns**:
  1. `State_Name` (string): State or Union Territory name (33 distinct states; includes `'Telangana '` with legacy 10 districts).
  2. `District_Name` (string): District administrative centroid.
  3. `Crop_Year` (integer): Agricultural harvest year (1997 to 2015).
  4. `Season` (string): Cropping season (`Kharif`, `Rabi`, `Whole Year`, `Summer`, `Autumn`, `Winter`).
  5. `Crop` (string): Crop name (124 distinct crop labels).
  6. `Area` (float): Cultivated land area in hectares.
  7. `Production` (float): Total harvest production quantity.

### Production Units Analysis & Supported Yield Crops:
Inspection of the production data reveals that units of `Production` differ fundamentally by crop:
- **Metric Tonnes**: Foodgrains (Rice, Wheat, Maize, Jowar, Bajra), Pulses (Gram, Moong, Urad, Arhar), Oilseeds (Groundnut, Soyabean, Sunflower, Mustard), and Spices. Yield is computed as:
  $$\text{Yield (quintals/acre)} = \frac{\text{Production (tonnes)}}{\text{Area (hectares)}} \times 4.04686$$
- **Nuts / Thousand Nuts (Excluded)**: `Coconut ` exhibits production ratios exceeding 38,000 per hectare (recorded in nuts, not tonnes). Excluded from the yield model as "not supported".
- **Bales of 180 kg (Excluded)**: `Jute`, `Mesta`, `Sannhamp` are recorded in commercial fiber bales. Excluded as "not supported".
- **Bales of 170 kg / Ambiguous (Excluded)**: `Cotton(lint)` in official Indian DES returns is recorded in 170 kg lint bales. To prevent unit distortion with metric tonnes, Cotton is excluded from the general tonnes regression model and flagged as "not supported" in the yield regressor.

---

## 3. Reproduction Instructions

To reproduce datasets on a fresh environment:
```powershell
python scripts/download_datasets.py
```
This fetches verified copies directly into `datasets/` and calculates SHA-256 integrity hashes.
