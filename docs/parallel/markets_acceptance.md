# Markets & Marketplace — Acceptance Criteria & Test Plan

**Namespace:** `market` | **Branch:** `feat/markets`

### Acceptance Test Checklist

- [x] **1. Mandi Price Service & AGMARKNET Graceful Degradation**
  - AGMARKNET API client queries data.gov.in using `DATA_GOV_IN_API_KEY`.
  - Fallback to `datasets/demo/mandi_prices.csv` with `demo=true` when key is unset or API call fails.
  - Responses always include `source`, `fetched_at`, and `demo`.
  - UI displays visible `DEMO DATA` banner when `demo=true`.

- [x] **2. Net Realization Mandi Ranking**
  - Calculates haversine distance from farm location (or Warangal default) to nearby APMCs.
  - Formula: $\text{net} = (\text{price} \times Q) - (\text{dist} \times \text{rate} \times Q) - (\text{fee\_pct} \times \text{gross})$.
  - Per-km rate (₹2.50/km/q) and market fee (1.0%) labeled explicitly as editable assumptions.
  - Mandis ranked in descending order of net realization with calculation reasoning expander.

- [x] **3. MSP Comparison**
  - Crops stored in `datasets/msp.csv`.
  - Opened PRID validation: only rows verified from opened pages have values and dates; unverified rows set to `"to verify"` with `last_verified` empty.
  - Crops without official MSP (Chilli, Tomato) return `"MSP not verified"`.

- [x] **4. Price Trends & Seasonal Best-Time-To-Sell Hint**
  - Historical modal prices plotted with seasonal projection.
  - Labelled as indicative statistical signal, never as a price guarantee. No fabricated error margin or arbitrary gain percentage.
  - Nearby warehouses listed from `datasets/demo/warehouses.csv` with distance and storage charge.

- [x] **5. Produce Marketplace Permissions & Privacy**
  - Smallholder harvest listings created and listed.
  - Role permissions: strictly only the listing owner can edit or delete a listing (403 for non-owners).
  - Privacy Guard (Rule 8): farmer contact details remain hidden (`contact_unlocked=false`) from buyers until the farmer accepts the inquiry.
  - Admin workflow for "Verified Seller" badge.

- [x] **6. Voice & Economics Integration**
  - Voice assistant `_handle_price` returns modal prices and link to `/market`.
  - Economics page has "Use Mandi Price" button that updates expected price and recalculates Decimal profit.
