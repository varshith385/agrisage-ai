# AgriSage AI — Community Module Architectural Decisions

**Yuktik 2026 Hackathon | Community, Logistics & Disease Outbreak Architecture**

In accordance with project guidelines, technical decisions for the Community Module are recorded below with justifications (with ADR numbers omitted per parallel documentation format).

---

## 1. Summary Matrix

| Title / Area | Decision Summary | Rationale / Trade-offs |
|---|---|---|
| **Privacy-Preserving Contact Sharing** | Implemented explicit, revocable per-group contact consent (`consent_share_contact`, `consent_timestamp`) with strict server-side boundary enforcement: non-consenting users receive `phone_number=None` and names masked to first name/alias; a caller who has not consented cannot receive any member's phone number from any endpoint. | Protects smallholder farmers from unsolicited marketing, harassment, and unauthorized data harvesting; respects privacy while enabling verified cooperative peer coordination. |
| **Transparent Cost-Splitting Freight Engine** | Implemented dual-method cost splitting: Weight-Share ($C_{\text{truck}} \times \frac{W_i}{W_{\text{total}}}$) and Ton-Kilometer ($C_{\text{truck}} \times \frac{W_i \times D_i}{\sum W_j \times D_j}$) with mathematical formulas exposed directly in the UI and API. Benchmarked dynamically against small solo commercial vehicles. | Eliminates black-box logistics calculations; ensures fair cost distribution for multi-village transport pickups; clearly quantifies savings compared to going alone. |
| **Machinery Rental Hub & Offline Settlement** | Implemented a 10-crop mechanization matrix across growth stages (labeled "Indicative, to verify. Not from a published source"), Haversine distance search from village centroids, and a booking request flow strictly enforcing offline peer-to-peer settlement (no in-app payment gateway). | Reflects the operational reality of agricultural equipment rentals in rural India (direct farmer-to-farmer settlement upon delivery); avoids fragile payment infrastructure. |
| **Spatial Privacy & Outbreak Mapping** | Leaflet disease outbreak map aggregates predictions strictly at the village level with a hard privacy threshold: villages with fewer than 3 independent reports are suppressed from the farmer map view. District officer view is guarded for Expert and Admin roles. | Prevents exposure of individual farm disease statuses or specific field locations while providing regional epidemiological awareness and early warning signals. |
| **Honest Demonstration Data Handling** | Seeded realistic community data around Geikonda, Warangal, prominently labeled with "DEMO DATA" banners and status badges in both the UI and documentation per Yuktik Honesty Rules. | Strictly avoids claiming simulated community groups or dummy equipment listings as verified production assets. |
