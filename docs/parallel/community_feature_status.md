# AgriSage AI — Community Feature Status Ledger

**Yuktik 2026 Hackathon | Synchronized Feature Reality Ledger**

> [!NOTE]
> In accordance with the **Honesty Rules**, features that rely on seeded demonstration data are designated as `DEMO` or `PARTIAL`, never `WORKING`.

---

## 1. Feature Status Matrix (Community Module)

| Feature | Tier | Status | UI Badge | Evidence / Route | Description & Limitations |
|---|---|---|---|---|---|
| **Community Groups & Peer Boards** | Tier 2 | DEMO | `DEMO` | `GET /api/v1/community/groups`, `POST /groups`, `/community` (UI) | Seeded DEMO data around Geikonda, Warangal. Village-level disclosure only, crop focus tags, and join/leave flows. Relies on seeded community data. |
| **Pooled Transport & Input Purchasing** | Tier 2 | DEMO | `DEMO` | `GET /api/v1/community/requests`, `POST /requests`, `POST /calculate-split` | Transparent weight-share and ton-km distance splitting math, solo tempo benchmarks, dynamic savings calculation. Relies on seeded community requests. |
| **Opt-in Contact Sharing Flow** | Tier 2 | PARTIAL | `PARTIAL` | `POST /groups/{id}/consent`, `GET /groups/{id}/members`, `test_community.py` | Explicit, per-group revocable consent with UTC timestamp. Strict server-side boundary: unconsented callers never receive phone numbers; names masked to alias. Relies on seeded user profile relationships. |
| **Machinery Rental Hub & Distance Search** | Tier 2 | DEMO | `DEMO` | `GET /api/v1/machinery/listings`, `POST /bookings`, `GET /machinery/guide` | Haversine distance from village centroid. 10-crop mechanization guide by stage ("Indicative, to verify. Not from a published source"). Offline peer booking flow. Relies on seeded equipment listings. |
| **Disease Outbreak Map (Village Clusters)** | Tier 2 | DEMO | `DEMO` | `/community#outbreak-map`, `GET /api/v1/outbreaks/clusters`, `/district-summary` | Interactive Leaflet map with village disease aggregation. Privacy threshold (< 3 reports suppressed from farmer map view). District officer view for Expert/Admin roles. Relies on seeded disease reports. |
