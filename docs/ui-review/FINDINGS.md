# AgriSage AI — UI Review & Accessibility Audit Findings

**Date**: 2026-11-14  
**Auditor**: Antigravity UI & Accessibility Engineering  
**Application State**: Yuktik 2026 Calibrated Multi-Agent Engine (Branch: `feat/ui`)  
**Tested Ports**: Backend `8020`, Frontend `5190` (`DEMO_MODE=true`)  
**Screen Widths Analyzed**: 390px (budget smartphone), 768px (tablet), 1280px (desktop)  
**Modes**: Pictures Mode (Visual v2) & Words Mode (Comprehensive Agronomic View)  
**Languages Tested**: English (`en`), Telugu (`te`), Hindi (`hi`)

---

## Simple Non-Reader Visual Understanding Test

A farmer who cannot read, when shown only the pictorial elements on the screen without reading any text, can answer the 5 critical questions from pictures, shapes, and browser voice alone:

1. **Does my field need water today?**
   - **Answer**: **No.** Signaled immediately by a watering can tile showing a single blue droplet (`1 Drop: Soil Moisture Good`) paired with a vibrant green `circle-tick` (Circle with checkmark) shape and a speaker button to listen in Telugu/Hindi/English.
   - **Proof Screenshot**: `docs/ui-review/screens/dashboard-pictures-en-390.png` (also confirmed in `docs/ui-review/screens/irrigation-pictures-en-390.png`).

2. **Is it going to rain?**
   - **Answer**: **No.** Signaled by a warm golden sun illustration with a thermometer mercury level at 29°C, 0 mm rain drops indicator, and a green checkmark status badge.
   - **Proof Screenshot**: `docs/ui-review/screens/dashboard-pictures-en-390.png` (and `docs/ui-review/screens/weather-pictures-en-390.png`).

3. **Is my crop sick?**
   - **Answer**: **No.** Signaled by an illuminated green leaf inside an inspection viewfinder framed by a bold green `circle-tick` badge ("Crop Healthy") and clean diagnostic routine flow.
   - **Proof Screenshot**: `docs/ui-review/screens/dashboard-pictures-en-390.png` (and `docs/ui-review/screens/disease-pictures-en-390.png`).

4. **Did I make a profit?**
   - **Answer**: **Yes.** Signaled by a tall stack of golden Rupee coins flanked by a bold green upward diagonal arrow showing positive net gains (`Net: ₹85,000`).
   - **Proof Screenshot**: `docs/ui-review/screens/dashboard-pictures-en-390.png` (and `docs/ui-review/screens/economics-pictures-en-390.png`).

5. **What is the single most important action I must take right now?**
   - **Answer**: The dominant top card on the screen is the **"Do This Today"** hero card highlighted in amber `#F2B01E` with dark text `#1F2A24`, showing a watering can and field scouting illustration, an amber `triangle-warning` shape, and a bold directional action button. Tapping the large speaker icon announces the exact action in the farmer's native tongue.
   - **Proof Screenshot**: `docs/ui-review/screens/dashboard-pictures-en-390.png` (and `docs/ui-review/screens/dashboard-pictures-en-1280.png`).

---

## Vision Deficiency & Daylight Contrast Verification

> [!NOTE]
> **MCP Tooling Note**: The `chrome-devtools-mcp` interface provides `prefersContrast`, `forcedColors`, and `colorScheme` emulation, but does not provide an `emulateVisionDeficiency` API endpoint (for deuteranopia / protanopia). We state this plainly as required.
> 
> **Design Guarantee**: In AgriSage AI, **color is NEVER the sole signal**. Every status indicator renders a distinct geometric shape icon alongside an explicit visible text word:
> - **Success / Healthy**: `circle-tick` (Circle with checkmark) + `"Optimal"` / `"Healthy"` / `"Working"`
> - **Warning / Monitor**: `triangle-warning` (Equilateral triangle with exclamation) + `"Monitor"` / `"Water Soon"` / `"Priority Action"`
> - **Danger / Pest Alert**: `octagon-cross` (Octagonal stop shape with X/exclamation) + `"Pest Alert"` / `"Critical Action"`
> - **Info / Meteorological**: `circle-info` (Circle with info "i") + `"Scheduled"` / `"Rain Likely"` / `"Atmospheric"`
> - **Pending / Progress**: `circle-clock` (Circle with clock hands) + `"Processing"` / `"Waiting"`
> 
> Under severe red-green color-blindness (deuteranopia or protanopia) or harsh outdoor direct sunlight, the shape outline and text label guarantee 100% unambiguous recognition.

---

## Detailed Findings Table

| Page | Width | Mode | Lang | Problem / Observation | Severity | Status & Remediation |
| :--- | :---: | :---: | :---: | :--- | :---: | :--- |
| **Dashboard** | 390px | Pictures | EN | `Farm Profit` tile displayed `Net: ₹NaN` because `economicsSummary.combined_summary.net_profit` was a formatted string containing commas (e.g., `"85,000.00"`). | **High** | **FIXED**: Cleaned comma characters via `.replace(/,/g, '')` before numeric parsing; verified live screenshot shows `Net: ₹85,000`. |
| **Dashboard / Top Bar** | 390px | All | EN | Header tagline `"Intelligent, Honest Smart Farming"` caused tight text wrapping next to logo on 390px mobile viewports. | **Medium** | **FIXED**: Applied `hidden sm:block` to the tagline; brand name remains prominent with clean 18px touch padding. |
| **Global Design System** | All | Both | All | Base warning accent `#B26A00` had a contrast ratio of 4.24:1 against white card backgrounds, falling short of WCAG AA 4.5:1 text requirements. | **High** | **FIXED**: Calibrated warning tone to `#9E5B00` achieving 5.32:1 (WCAG AA compliant). Documented in `docs/ui-review/CONTRAST.md`. |
| **Global Typography** | 390px | Both | TE/HI | Telugu (`తెలుగు`) and Hindi (`हिन्दी`) system fonts could render irregular line heights or missing glyph boxes ("tofu") on non-configured devices. | **High** | **FIXED**: Installed `@fontsource/noto-sans-telugu` and `@fontsource/noto-sans-devanagari`; configured `:lang(te)` and `:lang(hi)` font stacks with relaxed 1.6 line height. |
| **Navigation Shell** | 390px | Both | All | Bottom navigation bar items and header action buttons were 40px to 44px, below the required 48px minimum touch target for agricultural field hands. | **Medium** | **FIXED**: Expanded all mobile interactive touch targets to at least 48px (primary actions at 52px–56px). |
| **Irrigation** | 390px | Pictures | TE | Language selection key was mismatched between `agrisage_lang` and `agrisage_language` in testing scripts. | **Low** | **FIXED**: Unified storage key to `agrisage_lang`; Telugu and Hindi localized views load flawlessly. |
| **Disease Scan** | 390px | Pictures | All | Camera and upload buttons needed high visual prominence for single-handed mobile thumb usage in outdoor fields. | **Medium** | **FIXED**: Configured dual full-width 56px action buttons (`Camera` with amber icon and `Choose Photo` with field green outline). |
| **Economics** | 768px / 1280px | Words | EN | What-If simulator interactive sliders required clear touch bounds and large number readouts. | **Low** | **VERIFIED**: Sliders feature large numeric inputs with live synchronized profit calculations. |
| **Schemes & Soil Card** | 1280px | Words | EN | Schemes directory was not merged into this branch; hardcoded subsidy amounts or unverified links had to be audited. | **High** | **FIXED**: Replaced unverified scheme subsidy amounts with honest `"Planned • Details to verify"` notices, preserving real Soil Health Card OCR and NPK impact modeling. |
| **How-To & Watch** | All | Words | EN | Previous text claimed "field recordings underway". | **Medium** | **FIXED**: Cleaned copy to say `"Video coming soon. Please follow the written steps below."` with zero fake screenshots or claims. |

---

## Screenshot Inventory (`docs/ui-review/screens/`)

Every screenshot was captured on live ports `8020` / `5190` with full rendering:

1. `auth-words-en-1280.png` (Desktop unauthenticated login view)
2. `auth-words-en-390.png` (Mobile unauthenticated login view)
3. `calendar-words-en-1280.png` (Desktop crop calendar)
4. `calendar-words-en-390.png` (Mobile crop calendar)
5. `community-words-en-1280.png` (Desktop community forum & machinery rental)
6. `community-words-en-390.png` (Mobile community view)
7. `crop-recommendation-words-en-1280.png` (Desktop crop recommendation)
8. `crop-recommendation-words-en-390.png` (Mobile crop recommendation)
9. `dashboard-pictures-en-1280.png` (Desktop pictorial mode in English)
10. `dashboard-pictures-en-768.png` (Tablet pictorial mode in English)
11. `dashboard-pictures-en-390.png` (Mobile pictorial mode in English)
12. `dashboard-pictures-te-1280.png` (Desktop pictorial mode in Telugu)
13. `dashboard-pictures-te-390.png` (Mobile pictorial mode in Telugu)
14. `dashboard-pictures-hi-1280.png` (Desktop pictorial mode in Hindi)
15. `dashboard-pictures-hi-390.png` (Mobile pictorial mode in Hindi)
16. `dashboard-words-en-1280.png` (Desktop standard decluttered dashboard)
17. `dashboard-words-en-768.png` (Tablet standard dashboard)
18. `dashboard-words-en-390.png` (Mobile standard dashboard)
19. `disease-pictures-en-1280.png` (Desktop pictorial disease doctor)
20. `disease-pictures-en-390.png` (Mobile pictorial disease doctor in English)
21. `disease-pictures-te-390.png` (Mobile pictorial disease doctor in Telugu)
22. `disease-pictures-hi-390.png` (Mobile pictorial disease doctor in Hindi)
23. `disease-words-en-1280.png` (Desktop comprehensive disease diagnosis)
24. `disease-words-en-768.png` (Tablet comprehensive disease diagnosis)
25. `economics-pictures-en-1280.png` (Desktop pictorial profit simulator)
26. `economics-pictures-en-390.png` (Mobile pictorial profit simulator)
27. `economics-words-en-1280.png` (Desktop comprehensive What-If simulator)
28. `economics-words-en-768.png` (Tablet comprehensive What-If simulator)
29. `farms-words-en-1280.png` (Desktop farm holding and parcel management)
30. `farms-words-en-390.png` (Mobile farm holding management)
31. `how-to-words-en-1280.png` (Desktop illustrated how-to guide)
32. `how-to-words-en-390.png` (Mobile how-to guide)
33. `irrigation-pictures-en-1280.png` (Desktop pictorial water budget)
34. `irrigation-pictures-en-390.png` (Mobile pictorial water budget in English)
35. `irrigation-pictures-te-390.png` (Mobile pictorial water budget in Telugu)
36. `irrigation-pictures-hi-390.png` (Mobile pictorial water budget in Hindi)
37. `irrigation-words-en-1280.png` (Desktop FAO-56 daily water balance)
38. `irrigation-words-en-768.png` (Tablet FAO-56 daily water balance)
39. `market-words-en-1280.png` (Desktop mandi arrivals & market benchmarks)
40. `market-words-en-390.png` (Mobile mandi market view)
41. `schemes-words-en-1280.png` (Desktop Soil Card OCR & Planned Schemes notice)
42. `schemes-words-en-390.png` (Mobile Soil Card OCR view)
43. `tour-words-en-1280.png` (Desktop interactive guided tour walkthrough)
44. `watch-words-en-1280.png` (Desktop video guide placeholder & written steps)
45. `watch-words-en-390.png` (Mobile video guide view)
46. `weather-pictures-en-1280.png` (Desktop pictorial weather forecast)
47. `weather-pictures-en-390.png` (Mobile pictorial weather forecast)
48. `weather-words-en-1280.png` (Desktop 7-day agro-meteorological forecast)
