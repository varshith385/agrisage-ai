# Markets & Marketplace — Technical Specification

**Namespace:** `market` | **Branch:** `feat/markets`

### 1. Mandi Price Service
- **Endpoint**: `GET /api/v1/market/prices?crop={crop}&district={district}&state={state}`
- **Fallback**: Tries `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070` with `DATA_GOV_IN_API_KEY`. Falls back to `datasets/demo/mandi_prices.csv` with `demo=true`.
- **Cache**: SQLite `mandi_price_cache` with a 30-minute TTL.

### 2. Net Realization Mandi Ranking
- **Endpoint**: `GET /api/v1/market/ranking?crop={crop}&quantity_quintals={q}&transport_rate_per_km_q={r}&market_fee_pct={pct}&lat={lat}&lon={lon}`
- **Distance**: Haversine formula over WGS84 coordinates.
- **Deductions**:
  - Cartage: $\text{distance} \times \text{rate} \times \text{quantity}$
  - Cess: $\text{price} \times \text{quantity} \times (\text{fee\_pct} / 100)$
  - Net: $\text{Gross} - \text{Cartage} - \text{Cess}$
- **Assumptions**: Rate and Cess are explicit user-editable parameters labeled as assumptions.

### 3. MSP Comparison
- **Endpoint**: `GET /api/v1/market/msp?crop={crop}&expected_price={price}`
- **Data Source**: `datasets/msp.csv`
- **Output**: Returns benchmark item, status (`above_msp`, `below_msp`, `at_msp`, `msp_not_verified`), variance amount, variance percentage, and explanation.

### 4. Price Trends & Warehouses
- **Endpoints**:
  - `GET /api/v1/market/trends?crop={crop}&mandi={mandi}`
  - `GET /api/v1/market/warehouses?lat={lat}&lon={lon}`
- **Trend**: 12-month historical modal arrivals from `datasets/demo/historical_prices.csv` with a 3-month seasonal projection and indicative selling hint.
- **Warehouses**: Filtered by haversine proximity from `datasets/demo/warehouses.csv`.

### 5. Produce Marketplace
- **Endpoints**:
  - `GET /api/v1/marketplace/listings`: Lists listings with contact privacy filtering.
  - `POST /api/v1/marketplace/listings`: Create listing (Farmer only).
  - `PUT /api/v1/marketplace/listings/{id}`: Edit listing (Owner only).
  - `DELETE /api/v1/marketplace/listings/{id}`: Delete listing (Owner only).
  - `POST /api/v1/marketplace/inquiries`: Submit procurement inquiry (Buyer only).
  - `GET /api/v1/marketplace/inquiries`: Read user's inquiries.
  - `PUT /api/v1/marketplace/inquiries/{id}/status`: Accept or decline offer (Farmer owner only).
  - `PUT /api/v1/marketplace/farmers/{id}/verify`: Admin verify farmer.
  - `POST /api/v1/marketplace/reviews`: Submit review.
