# Markets & Marketplace — Feature Status

**Namespace:** `market` | **Branch:** `feat/markets`

| Feature | Tier | Status | Badge | Route / Entry Point | Notes & Grounding |
|---|---|---|---|---|---|
| **Mandi Price Service & AGMARKNET Client** | Tier 2 | DEMO | `DEMO` | `GET /api/v1/market/prices`, `/market` | Queries AGMARKNET API via `DATA_GOV_IN_API_KEY`; caches responses in SQLite `mandi_price_cache`; falls back to `datasets/demo/mandi_prices.csv` with `demo=true` when key is missing or offline. Always returns `source`, `fetched_at`, and `demo` status. Marked DEMO when using demo CSV. |
| **Net Realization Mandi Ranking** | Tier 2 | DEMO | `DEMO` | `GET /api/v1/market/ranking`, `/market` | Haversine distance from farm centroid to APMC mandis; net = `price * qty - (dist * rate * qty) - (fee_pct * gross)`; transport rate (₹2.50/km/q) and APMC cess (1.0%) are editable assumptions; ranks mandis by net take-home realization with explainability reasoning. Marked DEMO when computed over demo mandi prices. |
| **MSP Benchmark Comparison** | Tier 2 | PARTIAL | `PARTIAL` | `GET /api/v1/market/msp`, `/market` | Stored in `datasets/msp.csv`; where live opened PRID pages did not display exact values, rows are marked "to verify" with empty `last_verified`. Horticultural crops (Chilli, Tomato) state "MSP not verified". |
| **Price Trend & Selling Window Hint** | Tier 2 | DEMO | `DEMO` | `GET /api/v1/market/trends`, `GET /api/v1/market/warehouses` | 12-month historical modal arrivals from `datasets/demo/historical_prices.csv` with 3-month seasonal projection; indicative seasonal selling window hint without unverified margin claims; nearby warehouse list from `datasets/demo/warehouses.csv`. |
| **Farmer-to-Buyer Marketplace** | Tier 2 | WORKING | `WORKING` | `POST /api/v1/marketplace/listings`, `POST /api/v1/marketplace/inquiries` | Direct harvest listings, buyer inquiries, accept/decline workflow, ratings, Admin "Verified Seller" badge. Strict privacy: only owner can edit listing; buyers cannot see farmer contact details until farmer accepts inquiry. |
| **Voice Assistant Price Intent** | Tier 1/2 | WORKING | `WORKING` | `_handle_price` in `voice_service.py` | Answers modal price queries, notes MSP status, and provides deep link `/market`. |
| **Economics Page "Use Mandi Price"** | Tier 1/2 | WORKING | `WORKING` | `/economics` UI | Button pulls current APMC modal price and updates Expected Price, recalculating Python Decimal revenue, net profit, and break-even. |
