# Community Module — Acceptance Criteria & Test Verification

**AgriSage AI | Yuktik 2026 Hackathon**

## 1. Acceptance Criteria & Invariants

### 1.1 Privacy & Consent Boundary
- [x] **Village-Level Spatial Aggregation**: Coordinates are restricted to village centroids; exact farm GPS coordinates are never transmitted or displayed.
- [x] **Explicit Opt-in Consent**: Sharing phone numbers requires explicit per-group consent stored with an immutable UTC timestamp (`consent_share_contact`, `consent_timestamp`).
- [x] **Revocability**: Consent can be revoked at any time via `POST /api/v1/community/groups/{id}/consent` with `consent: false`.
- [x] **Strict Server-Side Phone Scrubbing**:
  - If member has not consented: `phone_number` is returned as `null` and `full_name` is masked to a first name or alias (e.g., `Voice T.`).
  - If caller has not consented to the group: caller cannot receive any member's phone number regardless of other members' consent statuses.
  - Verified by: `test_permission_boundary_strict_phone_scrubbing`.

### 1.2 Logistics & Cost-Splitting Engine
- [x] **Transparent Formula**: Formulas for weight-share ($C_{\text{truck}} \times \frac{w_i}{W}$) and ton-km ($C_{\text{truck}} \times \frac{w_i d_i}{\sum w_j d_j}$) are returned in LaTeX and displayed in UI.
- [x] **Dynamic Savings Benchmark**: Solo trip alternatives are calculated based on small commercial vehicle rates, quantifying individual and collective savings without hardcoded strings.
- [x] **Zero Division & Negative Input Protection**: Validated with positive constraints.
- [x] **Verified by**: `test_cost_split_math`.

### 1.3 Farm Machinery Rental Hub
- [x] **Haversine Distance**: Distance computed via great-circle trigonometry from the active village centroid.
- [x] **Mechanization Guide**: 10 crops mapped across growth stages with implement recommendations, hours/acre, and efficiency tips labeled as "Indicative, to verify. Not from a published source."
- [x] **Offline Settlement**: Rental booking flow captures schedule and purpose; no payments processed in-app.
- [x] **Verified by**: `test_haversine_distance_search`, `test_machinery_guide_endpoint`, `test_machinery_booking_lifecycle`.

### 1.4 Disease Outbreak Map (`/community#outbreak-map`)
- [x] **Leaflet Integration**: Interactive map rendering village disease clusters with threat-level pins.
- [x] **Privacy Threshold Gate**: Villages with $< 3$ reports are strictly suppressed from the farmer map view (`GET /api/v1/outbreaks/clusters`).
- [x] **District Officer View**: Role-guarded analytics (`GET /api/v1/outbreaks/district-summary`) restricted to `Expert` and `Admin` users with disease breakdowns and weekly trends.
- [x] **Verified by**: `test_outbreak_map_aggregation_and_privacy_threshold`, `test_district_officer_summary_role_guards`.
