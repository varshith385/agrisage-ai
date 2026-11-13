# Market Intelligence & Produce Marketplace — Architectural Decisions

**Namespace:** `market` | **Branch:** `feat/markets` | **Module:** Markets & Marketplace

---

### Mandi Price Service & AGMARKNET Graceful Degradation
- **Decision:** Integrated `data.gov.in` AGMARKNET API client using `DATA_GOV_IN_API_KEY` with SQLite caching (`mandi_price_cache`) and transparent fallback to `datasets/demo/mandi_prices.csv` (`demo=true`). When the API key is unset or external API is offline, all responses explicitly set `demo=true`, cite `datasets/demo/mandi_prices.csv`, and render a prominent `DEMO DATA` banner in the UI with status marked `DEMO`.
- **Rationale:** Strictly avoids fabricated market figures, preserves offline and local hackathon testability, and complies with Rule 4 (real data where available, labelled DEMO otherwise).

### Farmer-to-Buyer Marketplace Contact Privacy Protocol
- **Decision:** Implemented zero-payment harvest listings and procurement inquiry workflow under `/api/v1/marketplace`. Under Rule 8 (Privacy Guard), farmer telephone and email are strictly masked and inaccessible to buyers until the farmer explicitly accepts that specific buyer's inquiry (`status="accepted"`).
- **Rationale:** Protects smallholders from unsolicited telemarketing, data harvesting, and unauthorized off-platform exploitation while enabling direct negotiations.

### Editable Assumptions for Haversine Net Realization Arithmetic
- **Decision:** Mandated that per-km cartage rate (default ₹2.50/km/q) and APMC market cess (default 1.0%) are strictly surfaced and labeled as user-editable assumptions, never as facts, allowing the farmer to tweak parameters according to their actual vehicle and mandi committee norms. Mandis are ranked by take-home revenue:
  $$\text{Net Realization} = (\text{Modal Price} \times Q) - (\text{Haversine Distance} \times \text{Cartage Rate} \times Q) - (\text{Gross} \times \text{APMC Cess})$$
- **Rationale:** Reflects economic reality where the nearest mandi with a lower headline price often yields a higher take-home return than a distant mandi with a higher price after deducting transport costs.

### MSP Verification Guard
- **Decision:** In accordance with Rule 4, all MSP entries must strictly reflect official Government of India Gazette / PIB CCEA notifications. Where external government portal pages cannot be independently opened to confirm the exact value in the release text, the value is marked `"to verify"` with `last_verified` left empty. Horticultural commodities (e.g. Chilli, Tomato) that do not fall under the central 22 mandated MSP crops return `"MSP not verified"` with a transparent explanation.
- **Rationale:** Eliminates hallucinated government guaranteed rates, ensuring farmers are never misled regarding price support eligibility.

### Subsystem Namespace & Port Isolation
- **Decision:** Assigned backend port to `8001` (configured via untracked `.env`), frontend port to `5174`, namespace to `"market"`, and notes prefix to `"markets"`. Voice assistant price intent (`_handle_price`) returns live modal prices, MSP comparisons, and deep links to `/market`. Added "Use Mandi Price" button to Economics page.
- **Rationale:** Ensures complete port and router isolation without modifying other modules' API contracts.
