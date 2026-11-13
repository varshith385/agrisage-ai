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

---

## 4. Phase 4 Economics, Rotation, and Calendar Translation Additions (Unverified — Awaiting Review)

The following phrases were added in Phase 4 for the Economics Engine (tenure math, what-if simulator, crop matrix), Crop Recommendation & Rotation Planner, and Crop Lifecycle Calendar (RFC 5545). In accordance with honesty guidelines, these phrases are catalogued as **unverified** and strictly marked as needing native-speaker agricultural/economic review:

| Phrase Category | English Phrase | Telugu Translation (`te`) | Hindi Translation (`hi`) | Review Status |
|---|---|---|---|---|
| **Navigation** | Economics | ఆర్థిక లెక్కలు | आर्थिक विश्लेषण | **Unverified**: Needs review. |
| **Navigation** | Calendar & Stages | క్యాలెండర్ & దశలు | कैलेंडर व चरण | **Unverified**: Needs review. |
| **Navigation** | Crop Advisory | పంట సలహాలు | फसल सलाह | **Unverified**: Needs review. |
| **Economics** | Cost of Cultivation & Economic Profit Engine | సాగు ఖర్చులు & లాభాల గణాంక యంత్రం | खेती की लागत व लाभ विश्लेषण इंजन | **Unverified**: Needs review. |
| **Economics** | Gross Expected Revenue | మొత్తం ఆశించిన ఆదాయం | कुल अनुमानित आय | **Unverified**: Needs review. |
| **Economics** | Total Production Cost | మొత్తం ఉత్పత్తి ఖర్చు | कुल उत्पादन लागत | **Unverified**: Needs review. |
| **Economics** | Net Operating Profit | నికర నిర్వహణ లాభం | शुद्ध परिचालन लाभ | **Unverified**: Needs review. |
| **Economics** | Break-Even Price | సమతూక ధర (బ్రేక్-ఈవెన్) | संतुलन मूल्य (ब्रेक-इवन) | **Unverified**: Needs review. |
| **Economics** | Break-Even Yield | సమతూక దిగుబడి | संतुलन उपज | **Unverified**: Needs review. |
| **Economics** | Land Tenure Separation Analysis | యాజమాన్య విభజన విశ్లేషణ (సొంత vs కౌలు) | भूमि पट्टा विभाजन विश्लेषण (स्वामित्व बनाम पट्टा) | **Unverified**: Needs review. |
| **Economics** | Combined Holding | మొత్తం పొలం | कुल खेत | **Unverified**: Needs review. |
| **Economics** | Owned Portion | సొంత భూమి వాటా | स्वामित्व हिस्सा | **Unverified**: Needs review. |
| **Economics** | Leased Portion | కౌలు భూమి వాటా | पट्टे का हिस्सा | **Unverified**: Needs review. |
| **Economics** | Multi-Scenario Projections | వివిధ పరిస్థితుల అంచనాలు | परिदृश्य प्रक्षेपण | **Unverified**: Needs review. |
| **Economics** | What-If Interactive Profit Simulator | వాట్-ఇఫ్ ప్రత్యక్ష లాభాల సిమ్యులేటర్ | व्हॉट-इफ़ लाइव लाभ सिम्युलेटर | **Unverified**: Needs review. |
| **Economics** | Per-Acre Expenditure Line Items | ఎకరాకు అయ్యే ఖర్చుల వివరాలు | प्रति एकड़ व्यय मद विवरण | **Unverified**: Needs review. |
| **Economics** | Price: Your Estimate | ధర: మీ అంచనా | मूल्य: आपका अनुमान | **Unverified**: Needs review. |
| **Economics** | MSP Not Verified | కనీస మద్దతు ధర (MSP) ధృవీకరించబడలేదు | एमएसपी (MSP) सत्यापित नहीं | **Unverified**: Needs review. |
| **Calendar** | Crop Lifecycle & Field Operation Calendar | పంట జీవన చక్రం & వ్యవసాయ పనుల క్యాలెండర్ | फसल जीवनचक्र एवं कृषि कार्य कैलेंडर | **Unverified**: Needs review. |
| **Calendar** | Export Calendar (.ics) | క్యాలెండర్ డౌన్‌లోడ్ చేయండి (.ics) | कैलेंडर डाउनलोड करें (.ics) | **Unverified**: Needs review. |
| **Calendar** | Agro-Climatic Season Status | ప్రస్తుత వ్యవసాయ కాలం స్థితి | वर्तमान कृषि ऋतु स्थिति | **Unverified**: Needs review. |
| **Calendar** | Crop Phenological Stages | పంట ఎదుగుదల దశలు | फसल विकास चरण | **Unverified**: Needs review. |
| **Calendar** | Scheduled Agronomic Operations | షెడ్యూల్ చేసిన వ్యవసాయ పనులు | निर्धारित कृषि कार्य | **Unverified**: Needs review. |
| **Recommendation** | Crop Recommendation | పంట ఎంపిక సిఫార్సు | फसल चयन सिफारिश | **Unverified**: Needs review. |
| **Recommendation** | Crop Rotation Planner | పంట మార్పిడి ప్రణాళిక | फसल चक्र योजना | **Unverified**: Needs review. |
| **Recommendation** | Omit Soil Telemetry (Weather-Only) | నేల పరీక్ష వివరాలు లేకుండా (వాతావరణ ఆధారితం) | मृदा डेटा छोड़ें (केवल मौसम आधारित) | **Unverified**: Needs review. |
| **Recommendation** | Restorative Crop Rotation Guide | నేల పునరుజ్జీవన పంట మార్పిడి మార్గదర్శి | मृदा पुनरुद्धार फसल चक्र मार्गदर्शिका | **Unverified**: Needs review. |
| **Recommendation** | Previous Harvested Crop | గతంలో వేసిన పంట | पिछली काटी गई फसल | **Unverified**: Needs review. |

---

## 5. Phase 6.1 Voice Assistant & Multilingual Translation Registry (Unverified — Awaiting Review)

The following multilingual phrases were added in Phase 6.1 for the global voice assistant floating action button, capability detection, microphone fallbacks, and quick agricultural prompts across English, Telugu, and Hindi:

| Phrase Category | English Phrase | Telugu Translation (`te`) | Hindi Translation (`hi`) | Review Status |
|---|---|---|---|---|
| **Voice UI** | AgriSage Voice Assistant | అగ్రిసేజ్ వాయిస్ అసిస్టెంట్ | एग्रीसेज वॉयस सहायक | **Unverified**: Needs review. |
| **Voice UI** | Listening... Speak now | వింటున్నాను... మాట్లాడండి | सुन रहा हूँ... बोलिए | **Unverified**: Needs review. |
| **Voice UI** | Ask in English, Telugu, or Hindi | తెలుగు, హిందీ లేదా ఇంగ్లీషులో ప్రశ్న అడగండి | हिन्दी, तेलुगु या अंग्रेजी में पूछें | **Unverified**: Needs review. |
| **Voice UI** | Analyzing your agricultural query... | మీ వ్యవసాయ ప్రశ్నకు సమాధానాన్ని విశ్లేషిస్తున్నాను... | आपके कृषि प्रश्न का विश्लेषण हो रहा है... | **Unverified**: Needs review. |
| **Voice UI** | Speech Recognition Not Supported | వాయిస్ గుర్తింపు మద్దతు లేదు | वॉयस पहचान समर्थित नहीं | **Unverified**: Needs review. |
| **Voice UI** | Browser Speech Unsupported Advisory | మీ బ్రౌజర్ వెబ్ స్పీచ్ రికగ్నిషన్‌కు మద్దతు ఇవ్వదు. మీరు క్రింద ప్రశ్నను టైప్ చేయవచ్చు. | आपका ब्राउज़र वेब स्पीच रिकग्निशन का समर्थन नहीं करता। आप नीचे प्रश्न टाइप कर सकते हैं। | **Unverified**: Needs review. |
| **Voice UI** | Microphone Access Denied | మైక్రోఫోన్ అనుమతి నిరాకరించబడింది | माइक्रोफोन अनुमति अस्वीकृत | **Unverified**: Needs review. |
| **Voice UI** | Browser Voice Unavailable | బ్రౌజర్ వాయిస్ అందుబాటులో లేదు | ब्राउज़र वॉयस अनुपलब्ध | **Unverified**: Needs review. |
| **Voice UI** | Browser Recommendation | సూచన: భారతీయ భాషలలో స్పష్టమైన వాయిస్ గుర్తింపు కొరకు ఆండ్రాయిడ్ లేదా డెస్క్‌టాప్‌లోని గూగుల్ క్రోమ్ ఉత్తమం. | अनुशंसा: भारतीय भाषाओं में सटीक आवाज पहचान हेतु एंड्रॉइड या डेस्कटॉप पर गूगल क्रोम का उपयोग करें। | **Unverified**: Needs review. |
| **Voice Prompt** | Will it rain today? | ఈరోజు వర్షం పడుతుందా? | क्या आज बारिश होगी? | **Unverified**: Needs review. |
| **Voice Prompt** | Should I irrigate today? | ఈరోజు నీరు పెట్టాలా? | क्या आज सिंचाई करनी चाहिए? | **Unverified**: Needs review. |
| **Voice Prompt** | How to check leaf disease? | ఆకు తెగులు ఎలా గుర్తించాలి? | पत्ती रोग की पहचान कैसे करें? | **Unverified**: Needs review. |
| **Voice Prompt** | Cultivation cost per acre | ఎకరాకు సాగు ఖర్చు ఎంత? | प्रति एकड़ खेती लागत कितनी है? | **Unverified**: Needs review. |
| **Voice Prompt** | Rythu Bandhu & PM-KISAN info | రైతు బంధు & పీఎం-కిసాన్ వివరాలు | पीएम-किसान व रायथू बंधु जानकारी | **Unverified**: Needs review. |
| **Voice Prompt** | Cotton mandi price | పత్తి మార్కెట్ ధర | कपास का मंडी भाव | **Unverified**: Needs review. |
| **Voice Safety** | Zero Chemical Dosages | రసాయన మోతాదులు లేవు | रासायनिक खुराक वर्जित | **Unverified**: Needs review. |




