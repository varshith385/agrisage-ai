# AgriSage AI — Internationalization & Translation Review Registry (`docs/I18N_REVIEW.md`)

**Date:** 2026-11-13  
**Languages:** English (`en`), Telugu (`te`), Hindi (`hi`)  
**Scope:** Phase 2 Frontend Vertical Slice (Auth, Setup, Farms, Weather, Dashboard, Explainability)

---

## 1. Agricultural Domain Glossary & Translation Audit

The following table documents technical and agronomic terms translated into Telugu and Hindi, highlighting dialectical suitability and flagging specific nuances for native speaker verification:

| English Term | Telugu Translation (`te`) | Hindi Translation (`hi`) | Context / Verification Status |
|---|---|---|---|
| **Land Tenure: Owned** | స్వంత భూమి (*Svanta bhūmi*) | स्वयं की भूमि (*Svayam kī bhūmi*) | **Verified**: Standard revenue terminology in TS/AP and North India. |
| **Land Tenure: Leased** | కౌలు భూమి (*Kaulu bhūmi*) | पट्टे / बटाई की भूमि (*Paṭṭe / Baṭāī kī bhūmi*) | **Verified**: "Kaulu" is standard legal/agricultural terminology in Telangana & Andhra Pradesh. "Batai/Patta" is universal in Hindi belt. |
| **Land Tenure: Mixed** | మిశ్రమ భూమి (*Miśrama bhūmi*) | मिश्रित भूमि (*Miśrita bhūmi*) | **Verified**: Natural and self-explanatory. |
| **Evapotranspiration ($ET_0$)** | ఆధార నీటి ఆవిరి (*Ādhāra nīṭi āviri*) | संदर्भ वाष्पोत्सर्जन (*Sandarbha vāṣpōtsarjana*) | **To Check with Agronomist**: Technical term. English acronym ($ET_0$) retained parenthetically for scientific clarity. |
| **Crop Growth Stage / Phenology** | పంట ఎదుగుదల దశ (*Paṇṭa edugudala daśa*) | फसल वृद्धि अवस्था (*Fasal vṛddhi avasthā*) | **Verified**: Standard agricultural extension phrasing. |
| **Days After Sowing (DAS)** | విత్తిన నాటి నుండి రోజులు (*Vittina nāṭi nuṇḍi rōjulu*) | बुवाई के बाद के दिन (*Buwāī kē bād kē din*) | **Verified**: Clear and unambiguous to grassroots farmers. |
| **Stale Weather Data** | పాత డేటా (ఆఫ్‌లైన్ నిల్వ) (*Pāta ḍēṭā*) | ऑफ़लाइन संचित डेटा (*Offline sañcita data*) | **Verified**: Clearly warns the farmer that live connection failed without using condescending jargon. |
| **Confidence: Model Metric vs Prediction** | మోడల్ ఖచ్చితత్వం vs అంచనా విశ్వసనీయత | मॉडल सटीकता vs पूर्वानुमान विश्वास | **Verified**: Carefully distinguishes historical test set performance from instance-level forecast probability. |
| **Krishi Vigyan Kendra (KVK)** | కృషి విజ్ఞాన కేంద్రం (*Kṛṣi vijñāna kēndraṁ*) | कृषि विज्ञान केंद्र (*Kṛṣi vijñāna kēndra*) | **Verified**: Official ICAR administrative term. |

---

## 2. Review Checklist for Native Agronomists

1. **Telugu Dialect**: Currently uses standard contemporary Andhra/Telangana agricultural vocabulary (e.g., *Kaulu*, *Kamatamu*, *Edugudala Dasha*). Field testing in Warangal / Karimnagar will verify colloquial reception.
2. **Hindi Terminology**: Balance maintained between formal extension literature (*ICAR/KVK*) and colloquial northern village understanding (*Pattedaar*, *Batai*).

