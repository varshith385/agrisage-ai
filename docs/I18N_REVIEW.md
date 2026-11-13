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

---

## 3. Phase 3.5 Advisory & Phenology Translation Additions (Unverified — Awaiting Review)

The following agronomic phrases were added in Phase 3.5 for the 5-stage phenology model, stage guidance, 7-day action plan, and Farm Health Score. In accordance with user instructions, these phrases are catalogued as **unverified** and strictly marked as needing native-speaker agricultural review:

| Phrase Category | English Phrase | Telugu Translation (`te`) | Hindi Translation (`hi`) | Review Status |
|---|---|---|---|---|
| **Stage 1** | Germination & Emergence | మొలకెత్తడం మరియు నాటుకొనడం | अंकुरण और स्थापना | **Unverified**: Needs native-speaker agronomic review. |
| **Stage 2** | Vegetative Growth | శాఖా ఎదుగుదల దశ | वानस्पतिक वृद्धि | **Unverified**: Needs native-speaker agronomic review. |
| **Stage 3** | Flowering & Blossom | పూత దశ | फूल आने की अवस्था | **Unverified**: Needs native-speaker agronomic review. |
| **Stage 4** | Fruiting / Boll / Grain Filling | కాయ / గింజ నిండే దశ | फल / दाना भरने की अवस्था | **Unverified**: Needs native-speaker agronomic review. |
| **Stage 5** | Maturity & Harvest | పక్వత మరియు కోత దశ | परिपक्वता और कटाई | **Unverified**: Needs native-speaker agronomic review. |
| **Action** | Defer scheduled irrigation (rain forecast) | నీటి తడిని వాయిదా వేయండి; రానున్న వర్షం వల్ల తగినంత తేమ లభిస్తుంది. | सिंचाई स्थगित करें; आगामी बारिश से पर्याप्त नमी मिलेगी। | **Unverified**: Needs native-speaker agronomic review. |
| **Action** | Apply scheduled light irrigation | షెడ్యూల్ ప్రకారం తేలికపాటి తడి అందించండి | हल्की सिंचाई करें | **Unverified**: Needs native-speaker agronomic review. |
| **Action** | Scout pests during flowering | పూత మొగ్గలు మరియు ఆకుల అడుగు భాగాన రసం పీల్చే పురుగులను గమనించండి. | फूलों की कलियों और पत्तियों पर रस चूसक कीटों की निगरानी करें। | **Unverified**: Needs native-speaker agronomic review. |
| **Action** | Foliar fungal inspection | మొక్కల దిగువ ఆకులపై మచ్చలు లేదా పసుపు రంగు మార్పులను పరిశీలించండి. | निचली पत्तियों पर फफूंद के धब्बों या पीलापन की जांच करें। | **Unverified**: Needs native-speaker agronomic review. |
| **Action** | Yellow sticky / pheromone traps | పురుగుల ఉధృతిని గమనించడానికి పసుపు జిగురు లేదా లింగాకర్షక బుట్టలు ఏర్పాటు చేయండి. | कीटों की निगरानी के लिए पीले चिपचिपे या फेरोमोन ट्रैप लगाएं। | **Unverified**: Needs native-speaker agronomic review. |
| **Action** | Interculture weeding & aeration | అంతరకృషి లేదా కలుపు తీత చేపట్టి తేమ ఆవిరి కాకుండా కాపాడండి. | निराई-गुड़ाई करें ताकि जड़ों को हवा मिले और नमी बची रहे। | **Unverified**: Needs native-speaker agronomic review. |
| **Action** | Harvest bag preparation | పంట కోతకు సిద్ధం చేయండి; శుభ్రమైన సంచులను సిద్ధంగా ఉంచుకోండి. | फसल कटाई की तैयारी करें और साफ बोरों की व्यवस्था करें। | **Unverified**: Needs native-speaker agronomic review. |
| **Action** | Field drainage channel clearance | భారీ వర్షాలు కురిసినా నీరు నిలవకుండా మురుగు కాలువలను శుభ్రం చేయండి. | खेत में पानी भरने से रोकने के लिए जल निकासी नालियों को साफ करें। | **Unverified**: Needs native-speaker agronomic review. |
| **Reason** | Rain conservation | వాతావరణ శాఖ వర్ష సూచన ఇచ్చినందున, భూగర్భ జలాలు మరియు విద్యుత్ ఆదా అవుతాయి. | क्योंकि बारिश का पूर्वानुमान है, जिससे भूजल और बिजली की बचत होगी। | **Unverified**: Needs native-speaker agronomic review. |
| **Reason** | Flowering moisture sensitivity | పూత దశలో నీటి ఎద్దడి ఏర్పడితే పూత మరియు పిందెలు రాలిపోయే ప్రమాదం ఉన్నందున. | क्योंकि फूल आने की अवस्था में पानी की कमी से फूल और फल झड़ने का खतरा रहता है। | **Unverified**: Needs native-speaker agronomic review. |
| **Reason** | High humidity fungal risk | గాలిలో తేమ శాతం ఎక్కువగా ఉన్నందున శిలీంధ్ర వ్యాధులు వ్యాపించే అవకాశం ఉన్నందున. | क्योंकि हवा में नमी अधिक होने से फफूंद रोगों का प्रकोप बढ़ सकता है। | **Unverified**: Needs native-speaker agronomic review. |
| **Reason** | High ET0 evaporation | ఎండ తీవ్రత మరియు ఆవిరి రేటు అధికంగా ఉండటం వల్ల నేలలోని తేమ వేగంగా తగ్గుతున్నందున. | क्योंकि तेज धूप और वाष्पीकरण दर अधिक होने से मिट्टी की नमी तेजी से घट रही है। | **Unverified**: Needs native-speaker agronomic review. |
| **Reason** | Root hypoxia / waterlogging | నేలలో నీరు నిలిచిపోతే వేరు వ్యవస్థకు ఆక్సిజన్ అందక వేరుకుళ్ళు వచ్చే అవకాశం ఉన్నందున. | क्योंकि खेत में पानी ठहरने से जड़ों में सड़न का खतरा होता है। | **Unverified**: Needs native-speaker agronomic review. |
| **Guidance** | Agricultural officer disclaimer | సాధారణ మార్గదర్శకం మాత్రమే, మీ స్థానిక వ్యవసాయ అధికారిని సంప్రదించండి | सामान्य मार्गदर्शन मात्र, अपने स्थानीय कृषि अधिकारी से पुष्टि करें | **Unverified**: Needs native-speaker agronomic review. |
| **Health Score** | Farm Health Score breakdown | వ్యవసాయ క్షేత్ర ఆరోగ్య స్కోరు విభజన | कृषि स्वास्थ्य स्कोर विवरण | **Unverified**: Needs native-speaker agronomic review. |


