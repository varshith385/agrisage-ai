# Grow2Gain — Internationalization & Translation Review Registry (`docs/I18N_REVIEW.md`)

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




---

## 6. Phase 5 & Redesign Translation Additions (Unverified — Awaiting Native Review)

The following translations were added across the Phase 1-5 UI overhaul for "What is this?" explanatory dialogs, pictorial mode summaries, guided tour steps, how-to guides, and plain language "What this means for you" templates:

| Context | English String | Telugu Translation (`te`) | Hindi Translation (`hi`) | Review Status |
|---|---|---|---|---|
| **Common UI** | What is this? | ఇది ఏమిటి? | यह क्या है? | **Unverified**: Needs native review. |
| **Common UI** | What this means for you | దీని అర్థం ఏమిటి? | आपके लिए इसका क्या अर्थ है? | **Unverified**: Needs native review. |
| **Common UI** | Listen in audio | ఆడియో వినండి | आवाज सुनें | **Unverified**: Needs native review. |
| **Common UI** | Pictorial Mode | చిత్రాల రూపం | चित्र रूप (सरल दृश्य) | **Unverified**: Needs native review. |
| **Dashboard** | Visual Farm Overview | మీ వ్యవసాయ సారాంశం | खेत का संपूर्ण दृश्य | **Unverified**: Needs native review. |
| **Irrigation** | Crop Water Budget & Watering Advice | పంట నీటి అవసరం మరియు తడుల ప్రణాళిక | फसल जल आवश्यकता एवं सिंचाई सलाह | **Unverified**: Needs native review. |
| **Disease** | Leaf Disease Diagnosis | ఆకు తెగుళ్ల నిర్ధారణ | पत्ती रोग पहचान एवं उपचार | **Unverified**: Needs native review. |
| **Economics** | Farm Profit & Costs | ఆదాయం మరియు ఖర్చుల అంచనా | खेत का मुनाफा और खर्च | **Unverified**: Needs native review. |
| **Weather** | Village Weather & 7-Day Rain | గ్రామ వాతావరణం మరియు వర్ష సూచన | गांव का मौसम और 7 दिन की बारिश | **Unverified**: Needs native review. |
| **Market** | Market Prices & Mandi Payouts | మార్కెట్ ధరలు మరియు లాభం | मंडी के भाव और शुद्ध कमाई | **Unverified**: Needs native review. |
| **Farms** | Farm Holdings & Land Registration | భూమి వివరాలు మరియు హక్కుల రకం | खेत का विवरण और पट्टा स्थिति | **Unverified**: Needs native review. |
| **Soil Card** | Soil Health Card & Nutrients | నేల పరీక్ష ఫలితాలు మరియు ఎరువుల మోతాదు | मिट्टी की जांच और उर्वरक की मात्रा | **Unverified**: Needs native review. |
| **Community** | Farmer Community & Equipment Sharing | రైతు సంఘం మరియు యంత్రాల అద్దె | किसान समूह और कृषि यंत्र किराया | **Unverified**: Needs native review. |
| **Calendar** | Field Operations & Crop Stage Timeline | వ్యవసాయ పనుల క్యాలెండర్ మరియు పంట దశలు | कृषि कार्य कैलेंडर और फसल अवस्थाएं | **Unverified**: Needs native review. |
| **How-To** | How to Use AgriSage AI | అగ్రిసేజ్ యాప్ ఎలా ఉపయోగించాలి? | एग्रीसेज का उपयोग कैसे करें? | **Unverified**: Needs native review. |
| **Video Guide** | Watch How to Use AgriSage AI | అగ్రిసేజ్ వీడియో గైడ్ | एग्रीसेज वीडियो गाइड | **Unverified**: Needs native review. |


---

## 7. Round 2 Phase C Pictorial Mode v2 Additions (Unverified — Awaiting Native Review)

The following translations were added in Round 2 Phase C for the mode toggle hero ("Pictures" vs "Words"), picture gauges, step flows, and spoken greetings across Telugu and Hindi:

| Context | English String | Telugu Translation (`te`) | Hindi Translation (`hi`) | Review Status |
|---|---|---|---|---|
| **Mode Hero** | Choose How to View | చూపు విధానం ఎంచుకోండి | दृश्य मोड चुनें | **Unverified**: Needs native review. |
| **Mode Hero** | Pictures | చిత్రాలు | चित्र | **Unverified**: Needs native review. |
| **Mode Hero** | Simple Visual | సులభ రూపం | सरल दृश्य | **Unverified**: Needs native review. |
| **Mode Hero** | Words | అక్షరాలు | शब्द | **Unverified**: Needs native review. |
| **Mode Hero** | Full Detail | పూర్తి వివరాలు | पूर्ण विवरण | **Unverified**: Needs native review. |
| **Mode Hero** | Do This Today | ఈరోజు చేయాల్సిన ముఖ్య పని | आज का मुख्य कार्य | **Unverified**: Needs native review. |
| **Mode Hero** | See Details | పూర్తి వివరాలు చూడండి | पूरा विवरण देखें | **Unverified**: Needs native review. |
| **Mode Hero** | 4 Steps for Your Farm Today | మీ పొలానికి 4 ముఖ్యమైన అంచెలు | आज आपके खेत के 4 सरल कदम | **Unverified**: Needs native review. |
| **Spoken Greeting** | Welcome to AgriSage AI | నమస్కారం! అగ్రిసేజ్ కి స్వాగతం | नमस्ते! एग्रीसेज में आपका स्वागत है | **Unverified**: Needs native review. |
| **Gauges** | Water Needed | పంట నీటి అవసరం | फसल का पानी | **Unverified**: Needs native review. |
| **Gauges** | Weather & Rain | వాతావరణం & వర్షం | मौसम और बारिश | **Unverified**: Needs native review. |
| **Gauges** | Leaf Disease | ఆకు తెగుళ్లు | पत्ती रोग | **Unverified**: Needs native review. |
| **Gauges** | Farm Profit | వ్యవసాయ లాభం | खेत का मुनाफा | **Unverified**: Needs native review. |
| **Gauges** | Farm Health | పొలం ఆరోగ్యం | खेत का स्वास्थ्य | **Unverified**: Needs native review. |


---

## 8. Round 3 Pictorial Summary & Honesty Additions (Unverified — Awaiting Native Review)

The following translations were added in Round 3 for grey no-data states, honest parser notifications, and 3-tile pictorial summaries across Crop Recommendation, Calendar, Market, and Community:

| Context | English String | Telugu Translation (`te`) | Hindi Translation (`hi`) | Review Status |
|---|---|---|---|---|
| **No-Data State** | No data yet | డేటా అందుబాటులో లేదు | अभी कोई डेटा नहीं | **Unverified**: Needs native review. |
| **No-Data State** | Awaiting Run | రన్ కోసం వేచి ఉంది | परिणाम प्रतीक्षित | **Unverified**: Needs native review. |
| **No-Data State** | No scan yet | ఇంకా ఫోటో తీయలేదు | अभी कोई स्कैन नहीं | **Unverified**: Needs native review. |
| **No-Data State** | No advice yet | సలహా అందుబాటులో లేదు | कोई सलाह नहीं | **Unverified**: Needs native review. |
| **No-Data State** | No Soil Card Recorded Yet | నేల పరీక్ష రికార్డు నమోదు కాలేదు | कोई सॉइल टेस्ट दर्ज नहीं है | **Unverified**: Needs native review. |
| **Crop Rec Pictorial** | Best Match | ఉత్తమ పంట ఎంపిక | सबसे उपयुक्त फसल | **Unverified**: Needs native review. |
| **Crop Rec Pictorial** | Crop Rotation | పంట మార్పిడి | फसल चक्र | **Unverified**: Needs native review. |
| **Crop Rec Pictorial** | Soil Nutrients | నేల పోషకాలు (N-P-K) | मिट्टी के पोषक तत्व | **Unverified**: Needs native review. |
| **Calendar Pictorial** | Crop Days (DAS) | నాటిన రోజుల సంఖ్య | बुवाई के दिन | **Unverified**: Needs native review. |
| **Calendar Pictorial** | Next Field Task | తదుపరి పని | अगला कृषि कार्य | **Unverified**: Needs native review. |
| **Calendar Pictorial** | Growth Stages | పంట దశలు | फसल चरण | **Unverified**: Needs native review. |
| **Market Pictorial** | Top Mandi | ఉత్తమ మండి | सबसे अच्छी मंडी | **Unverified**: Needs native review. |
| **Market Pictorial** | MSP Benchmark | కనీస మద్దతు ధర (MSP) | न्यूनतम समर्थन मूल्य (MSP) | **Unverified**: Needs native review. |
| **Market Pictorial** | Direct Trade | రైతు విక్రయాలు | किसान खरीद-बिक्री | **Unverified**: Needs native review. |
| **Community Pictorial**| Machinery Rental | యంత్రాల అద్దె | कृषि यंत्र किराया | **Unverified**: Needs native review. |
| **Community Pictorial**| Transport Pooling | సరుకు రవాణా | साझा परिवहन | **Unverified**: Needs native review. |
| **Community Pictorial**| Outbreak Radar | తెగుళ్ల హెచ్చరిక మ్యాప్ | कीट प्रकोप नक्शा | **Unverified**: Needs native review. |
| **Parser Status** | Manual Entry & Text Parsing | మాన్యువల్ ఎంట్రీ & టెక్స్ట్ పార్సింగ్ (OCR లేదు) | मैन्युअल प्रविष्टि व टेक्स्ट विश्लेषण (कोई OCR नहीं) | **Unverified**: Needs native review. |
| **Parser Status** | Verify against physical card | భద్రపరిచే ముందు మీ అసలు పత్రంతో సరిచూసుకోండి | सहेजने से पहले अपने कार्ड से मिलान अवश्य करें | **Unverified**: Needs native review. |


---

## 9. Round 5 Phase C Smart Chatbot & Voice Assistant Navigation Additions (Unverified — Awaiting Native Review)

The following translations were added in Round 5 Phase C for deterministic navigation spoken confirmations, small talk responses, settings actions, and the Telugu voice guidance advisory:

| Context | English String | Telugu Translation (`te`) | Hindi Translation (`hi`) | Review Status |
|---|---|---|---|---|
| **Navigation** | Navigating to Irrigation & Water Budget. | నీటి పారుదల మరియు నీటి ప్రణాళిక పేజీకి వెళ్తున్నారు. | सिंचाई एवं जल बजट पृष्ठ खोला जा रहा है। | **Unverified**: Needs native review. |
| **Navigation** | Navigating to Mandi Market & Prices. | మండి మార్కెట్ మరియు నికర ధరల పేజీకి వెళ్తున్నారు. | मंडी भाव एवं शुद्ध लाभ रैंकिंग पृष्ठ खोला जा रहा है। | **Unverified**: Needs native review. |
| **Navigation** | Navigating to Weather & Farm Setup. | వాతావరణ సూచన మరియు ఉష్ణోగ్రత పేజీకి వెళ్తున్నారు. | मौसम पूर्वानुमान एवं तापमान पृष्ठ खोला जा रहा है। | **Unverified**: Needs native review. |
| **Navigation** | Navigating to Crop Calendar. | పంట క్యాలెండర్ మరియు వ్యవసాయ పనుల పేజీకి వెళ్తున్నారు. | फसल कैलेंडर एवं कार्य समय-सारणी पृष्ठ खोला जा रहा है। | **Unverified**: Needs native review. |
| **Navigation** | Navigating to Disease Diagnosis. | ఆకు తెగుళ్ల గుర్తింపు పేజీకి వెళ్తున్నారు. ఆకు ఫోటో తీసి అప్‌లోడ్ చేయండి. | पत्ती रोग पहचान पृष्ठ खोला जा रहा है। पत्ती का फोटो अपलोड करें। | **Unverified**: Needs native review. |
| **Navigation** | Navigating to Farm Economics & Net Profit Calculator. | వ్యవసాయ ఖర్చులు మరియు లాభ కాలిక్యులేటర్ పేజీకి వెళ్తున్నారు. | कृषि लागत एवं शुद्ध मुनाफा कैलकुलेटर पृष्ठ खोला जा रहा है। | **Unverified**: Needs native review. |
| **Navigation** | Navigating to My Farms. | మీ రిజిస్టర్డ్ పొలాల నిర్వహణ పేజీకి వెళ్తున్నారు. | आपके पंजीकृत खेतों के प्रबंधन पृष्ठ पर जाया जा रहा है। | **Unverified**: Needs native review. |
| **Navigation** | Navigating to Reminders & Field Task Alerts. | వ్యవసాయ జ్ఞాపికలు మరియు అలర్ట్‌ల పేజీకి వెళ్తున్నారు. | कृषि स्मरणपत्र एवं अलर्ट पृष्ठ खोला जा रहा है। | **Unverified**: Needs native review. |
| **Navigation** | Navigating to Soil Health Card & Welfare Schemes. | సాయిల్ హెల్త్ కార్డ్ మరియు ప్రభుత్వ సంక్షేమ సమాచార పేజీకి వెళ్తున్నారు. | मृदा स्वास्थ्य कार्ड एवं कृषि योजनाओं के पृष्ठ पर जाया जा रहा है। | **Unverified**: Needs native review. |
| **Navigation** | Navigating to Community Forum, Machinery & Outbreak Map. | రైతు సంఘం, పరికరాల అద్దె మరియు వ్యాధుల మ్యాప్ పేజీకి వెళ్తున్నారు. | किसान समुदाय, मशीनरी किराया एवं कीट प्रकोप मानचित्र पृष्ठ खोला जा रहा है। | **Unverified**: Needs native review. |
| **Navigation** | Navigating to How to Use Guide. | అగ్రిసేజ్ యాప్ ఎలా ఉపయోగించాలో వివరించే మార్గదర్శి పేజీకి వెళ్తున్నారు. | एग्रीसेज ऐप का उपयोग कैसे करें, गाइड पृष्ठ खोला जा रहा है। | **Unverified**: Needs native review. |
| **Navigation** | Starting interactive guided walkthrough tour. | ఇంటరాక్టివ్ గైడెడ్ టూర్ ప్రారంభమవుతోంది. | इंटरैक्टिव गाइडेड टूर शुरू किया जा रहा है। | **Unverified**: Needs native review. |
| **Action** | Switched app language to Telugu. | యాప్ భాష తెలుగులోకి మార్చబడింది. | ऐप की भाषा तेलुगु में बदल दी गई है। | **Unverified**: Needs native review. |
| **Action** | Switched app language to Hindi. | యాప్ భాష హిందీలోకి మార్చబడింది. | ऐप की भाषा हिन्दी में बदल दी गई है। | **Unverified**: Needs native review. |
| **Action** | Dark mode has been enabled. | డార్క్ మోడ్ ఆన్ చేయబడింది. | डार्क मोड चालू कर दिया गया है। | **Unverified**: Needs native review. |
| **Action** | Light mode has been enabled. | లైట్ మోడ్ ఆన్ చేయబడింది. | लाइट मोड चालू कर दिया गया है। | **Unverified**: Needs native review. |
| **Action** | Pictures visual mode has been activated. | చిత్రాల మోడ్ ఆన్ చేయబడింది. | चित्र मोड चालू कर दिया गया है। | **Unverified**: Needs native review. |
| **Action** | Detailed words mode has been activated. | వివరాల పాఠ్య మోడ్ ఆన్ చేయబడింది. | विस्तृत टेक्स्ट मोड चालू कर दिया गया है। | **Unverified**: Needs native review. |
| **Smalltalk** | Glad to help! What would you like to check next on your farm? | సంతోషం! మీ పొలానికి సంబంధించి తర్వాత ఏమి తనిఖీ చేయాలనుకుంటున్నారు? | बहुत बढ़िया! आप अपने खेत के बारे में आगे क्या जानना चाहते हैं? | **Unverified**: Needs native review. |
| **Voice Advisory** | Telugu voice not installed on this device | తెలుగు వాయిస్ ప్యాక్ లేదు (Telugu voice not installed on this device) | डिवाइस पर तेलुगु वॉयस नहीं है | **Unverified**: Needs native review. |


---

## 10. Round 5 Phase D Reminders & Field Task Alerts Additions (Unverified — Awaiting Native Review)

The following translations were added in Round 5 Phase D for the Reminders page, 3-step scheduling wizard, smart suggestions, and delivery limitation notices:

| Context | English String | Telugu Translation (`te`) | Hindi Translation (`hi`) | Review Status |
|---|---|---|---|---|
| **Reminders Header** | Reminders & Field Alerts | వ్యవసాయ జ్ఞాపికలు & అలర్ట్‌లు | कृषि स्मरणपत्र एवं अलर्ट | **Unverified**: Needs native review. |
| **Reminders Subtitle** | Track spray intervals, irrigation water days, and harvest calendar milestones | నీటిపారుదల, ఎరువుల సమయం మరియు వాతావరణ హెచ్చరికలను ఎప్పటికీ మర్చిపోకండి | सिंचाई, खाद का समय और मौसम अलर्ट कभी न भूलें | **Unverified**: Needs native review. |
| **Reminders Action** | + Add Reminder | + కొత్త జ్ఞాపిక | + नया रिमाइंडर | **Unverified**: Needs native review. |
| **Reminders Tile** | Upcoming Tasks | రానున్న పనులు | आगामी कार्य | **Unverified**: Needs native review. |
| **Reminders Tile** | Overdue Tasks | ఆలస్యమైన పనులు | अतिदेय कार्य | **Unverified**: Needs native review. |
| **Reminders Tile** | Farm Suggestions | స్మార్ట్ సూచనలు | सुझाव | **Unverified**: Needs native review. |
| **Reminders Notice** | Delivery Limitation Notice | నోటిఫికేషన్ సమాచారం (Delivery Notice) | अधिसूचना सूचना (Delivery Notice) | **Unverified**: Needs native review. |
| **Reminders Delivery** | Reminders trigger when you open the app or enable browser notifications. SMS/WhatsApp alerts are planned for production rollout. | మీరు యాప్‌ను తెరిచినప్పుడు లేదా బ్రౌజర్ నోటిఫికేషన్‌లను అనుమతించినప్పుడు ఈ జ్ఞాపికలు కనిపిస్తాయి. SMS మరియు WhatsApp అలర్ట్‌లు ప్రొడక్షన్ విడుదల కోసం ప్రణాళిక చేయబడ్డాయి. ఫోన్ క్యాలెండర్‌లో అలర్ట్ పొందడానికి "ఫోన్ క్యాలెండర్‌కు జోడించు" (.ics) బటన్‌ను ఉపయోగించండి. | यह रिमाइंडर ऐप खोलने पर या ब्राउज़र नोटिफिकेशन सक्षम करने पर दिखाई देते हैं। एसएमएस एवं व्हाट्सएप अलर्ट आगामी रिलीज में जोड़े जाएंगे। फोन कैलेंडर में जोड़ने के लिए .ics बटन दबाएं। | **Unverified**: Needs native review. |
| **Reminders 1-Tap** | Suggested for Your Farm (1-Tap Add) | మీ పొలం కోసం ఒకే-ట్యాప్ సూచనలు (Suggested for Your Farm) | आपके खेत हेतु त्वरित सुझाव (Suggested for Your Farm) | **Unverified**: Needs native review. |
| **Reminders Modal** | Create Field Reminder | నూతన జ్ఞాపికను సృష్టించండి | नया स्मरणपत्र बनाएं | **Unverified**: Needs native review. |
| **Reminders Action** | Mark Done | పూర్తయింది | पूर्ण हुआ | **Unverified**: Needs native review. |
| **Reminders Action** | Add to Reminders | జోడించు | जोड़ें | **Unverified**: Needs native review. |

---

## 11. Round 5 Phase E Universal Pictorial Mode, Step-Flows, Legend & Chooser (Unverified — Awaiting Native Review)

The following translations were added in Round 5 Phase E for the First-Run Visual Mode Chooser, Picture Legend Modal ("How to read this screen"), physical StepFlow components across all 14 pages, and Schemes/Soil pictorial tiles:

| Context | English String | Telugu Translation (`te`) | Hindi Translation (`hi`) | Review Status |
|---|---|---|---|---|
| **Visual Chooser** | How would you like to view AgriSage? | మీరు అగ్రిసేజ్ యాప్‌ను ఎలా చూడాలనుకుంటున్నారు? | आप एग्रीसेज ऐप को कैसे देखना चाहते हैं? | **Unverified**: Needs native review. |
| **Visual Chooser** | Pictures Mode (Visual cards, voice speak, simple colors) | చిత్రాల మోడ్ (కార్డులు, వాయిస్, రంగులు) | चित्र मोड (चित्र, आवाज, रंग) | **Unverified**: Needs native review. |
| **Visual Chooser** | Words Mode (Standard tables, detailed numbers and data) | పాఠ్య మోడ్ (వివరమైన పట్టికలు, సంఖ్యలు) | टेक्स्ट मोड (विस्तृत तालिकाएं, डेटा) | **Unverified**: Needs native review. |
| **Legend Modal** | How to Read This Screen | ఈ స్క్రీన్‌ను ఎలా చదవాలి (చిత్రాల సంకేతాలు) | इस स्क्रीन को कैसे समझें (चित्र संकेत) | **Unverified**: Needs native review. |
| **Legend Modal** | Green Circle: Safe / Good to go / Proceed | ఆకుపచ్చ వృత్తం: సురక్షితం / అంతా బాగుంది / కొనసాగించండి | हरा वृत्त: सुरक्षित / सब ठीक / आगे बढ़ें | **Unverified**: Needs native review. |
| **Legend Modal** | Amber Square: Attention / Check Details | పసుపు చతురస్రం: శ్రద్ధ వహించండి / వివరాలు తనిఖీ చేయండి | पीला वर्ग: ध्यान दें / विवरण की जांच करें | **Unverified**: Needs native review. |
| **Legend Modal** | Red Triangle: Urgent Action / Stop / Consult Officer | ఎరుపు త్రికోణం: తక్షణ చర్య అవసరం / ఆగండి / అధికారిని సంప్రదించండి | लाल त्रिभुज: तुरंत कार्रवाई / रुकें / अधिकारी से सलाह लें | **Unverified**: Needs native review. |
| **Legend Modal** | Grey Dashed Circle: Awaiting Data / Unmeasured | బూడిద చుక్కల వృత్తం: డేటా ఇంకా అందలేదు / వేచి ఉంది | धूसर वृत्त: डेटा प्रतीक्षित / अभी उपलब्ध नहीं | **Unverified**: Needs native review. |
| **Legend Modal** | Test Audio (Play Sample) | నమూనా ఆడియో వినండి | नमूना ऑडियो सुनें | **Unverified**: Needs native review. |
| **Schemes Pictorial** | Soil Nutrients (N-P-K) | నత్రజని-భాస్వరం-పొటాష్ | एन-पी-के पोषक तत्व | **Unverified**: Needs native review. |
| **Schemes Pictorial** | pH & Soil Texture | పీహెచ్ & నేల రకం | पीएच व मिट्टी का प्रकार | **Unverified**: Needs native review. |
| **Schemes Pictorial** | Welfare Schemes (Planned) | ప్రభుత్వ పథకాలు (ప్రణాళిక) | सरकारी योजनाएं (प्रस्तावित) | **Unverified**: Needs native review. |
| **Schemes StepFlow** | Soil Sampling | నేల నమూనా సేకరణ | मिट्टी का नमूना संग्रह | **Unverified**: Needs native review. |
| **Schemes StepFlow** | Nutrient Calibration | యాప్‌లో నమోదు & క్యాలిబ్రేషన్ | ऐप में दर्ज व कैलिब्रेशन | **Unverified**: Needs native review. |
| **Schemes StepFlow** | Extension Verification | అధికారులతో సంప్రదింపు | कृषि अधिकारी से संपर्क | **Unverified**: Needs native review. |
| **Market StepFlow** | Check Mandi Prices | మండి ధరల పరిశీలన | मंडी भाव की जांच | **Unverified**: Needs native review. |
| **Market StepFlow** | Deduct Transport Cost | రవాణా ఖర్చు తీసివేత | परिवहन खर्च घटाना | **Unverified**: Needs native review. |
| **Market StepFlow** | Direct Trade or Best Mandi | నేరుగా అమ్మకం లేదా ఉత్తమ మండి | सीधा व्यापार या सर्वश्रेष्ठ मंडी | **Unverified**: Needs native review. |
| **Farm StepFlow** | Village & Location | గ్రామం & ప్రాంత వివరాలు | गांव व स्थान का विवरण | **Unverified**: Needs native review. |
| **Farm StepFlow** | Crop & Soil Selection | పంట & నేల రకం ఎంపిక | फसल और मिट्टी का चयन | **Unverified**: Needs native review. |
| **Farm StepFlow** | Land Acreage & Tenure | ఎకరాలు & యాజమాన్య హక్కు | रकबा व स्वामित्व पट्टा | **Unverified**: Needs native review. |

---

## 12. Round 5b Pluggable LLM, Voice Confirmation, and Voice Guidance Registry (Unverified — Awaiting Native Review)

The following translations were added in Round 5b for interactive voice reminder confirmations (asking before saving), reminder cancellations, and browser/system voice configuration guidance cards:

| Context | English String | Telugu Translation (`te`) | Hindi Translation (`hi`) | Review Status |
|---|---|---|---|---|
| **Voice Reminders Prompt** | Would you like me to schedule a reminder: '{title}' for {time}? Reminder scheduled only after your confirmation. Reply 'Yes' to confirm or 'No' to cancel. | మీరు ఈ జ్ఞాపిక షెడ్యూల్ చేయాలనుకుంటున్నారా: '{title}', సమయం {time} (Asia/Kolkata)? జ్ఞాపిక నమోదు చేయబడింది నిర్ధారణ తర్వాత మాత్రమే. సేవ్ చేయడానికి 'అవును' లేదా రద్దు చేయడానికి 'వద్దు' అనండి. | क्या आप यह स्मरणपत्र जोड़ना चाहते हैं: '{title}', समय {time} (Asia/Kolkata)? स्मरणपत्र दर्ज किया गया पुष्टि के बाद ही। सहेजने के लिए 'हाँ' या रद्द करने के लिए 'नहीं' कहें। | **Unverified**: Needs native review. |
| **Voice Reminders Saved** | Reminder saved successfully: '{title}'. You will see it on your Reminders page. | జ్ఞాపిక విజయవంతంగా భద్రపరచబడింది: '{title}'. మీ రిమైండర్ల పేజీలో ఇది కనిపిస్తుంది. | स्मरणपत्र सफलतापूर्वक जोड़ दिया गया: '{title}'। आपके स्मरणपत्र पृष्ठ पर यह उपलब्ध है। | **Unverified**: Needs native review. |
| **Voice Reminders Cancelled** | Reminder was cancelled. | జ్ఞాపిక రద్దు చేయబడింది. | स्मरणपत्र रद्द कर दिया गया। | **Unverified**: Needs native review. |
| **Voice Audio Guidance** | Open this site in Microsoft Edge, or add the Telugu language and its speech voice in Windows Settings. | ఈ సైట్‌ను Microsoft Edge లో తెరవండి లేదా Windows Settings లో తెలుగు భాష మరియు వాయిస్‌ను జోడించండి. | इस साइट को Microsoft Edge में खोलें, या Windows Settings में हिन्दी भाषा और वాయిస్ जोड़ें। | **Unverified**: Needs native review. |
| **Schemes Pictorial Title** | Planned. Details to verify | ప్రణాళిక. వివరాలు ధృవీకరించబడాలి | प्रस्तावित। विवरण सत्यापित करें | **Unverified**: Needs native review. |

---

## 13. Round 5 Final Accessibility & Audio Override Translations (Unverified — Awaiting Native Review)

The following translations were added for the user avatar menu toggle to support low-vision farmers who prefer Words mode but still need audio reading controls enabled:

| Context | English String | Telugu Translation (`te`) | Hindi Translation (`hi`) | Review Status |
|---|---|---|---|---|
| **Avatar Menu Accessibility** | Always show Listen buttons | ఎల్లప్పుడూ వినండి బటన్లు చూపించు | हमेशा सुनें बटन दिखाएं | **Unverified**: Needs native-speaker review. |

---

## 14. Round 5 Phase 4 Multilingual Translation Additions (Unverified — Awaiting Native Review)

The following agronomic, workflow, and interface strings were added in Round 5 Phase 4 to eliminate English leftovers on core farmer flows (Dashboard, Irrigation, Calendar, Crop Advisory, Reminders) and replace technical jargon. In accordance with honesty rules, these are explicitly catalogued as **not native-reviewed**:

| Context | English String | Telugu Translation (`te`) | Hindi Translation (`hi`) | Review Status |
|---|---|---|---|---|
| **Jargon Replacement** | Tool summary | సాధనాల సారాంశం | उपकरण सारांश | **Unverified**: Not native-reviewed. |
| **Jargon Replacement** | Activity log | కార్యకలాపాల లాగ్ | गतिविधि लॉग | **Unverified**: Not native-reviewed. |
| **Price Honesty** | Assumed price (editable, demo) | అనుకున్న ధర (మార్చగలరు, డెమో) | अनुमानित मूल्य (संपादन योग्य, डेमो) | **Unverified**: Not native-reviewed. |
| **Dashboard Quick Tools** | Quick Field Tools | శీఘ్ర క్షేత్ర సాధనాలు | त्वरित कृषि उपकरण | **Unverified**: Not native-reviewed. |
| **Dashboard Quick Tools** | Direct access to diagnostic and advisory modules | సమస్యల గుర్తింపు మరియు సలహా మాడ్యూళ్లకు వేగవంతమైన ప్రవేశం | नैदानिक व सलाह मॉड्यूल के लिए सीधा प्रवेश | **Unverified**: Not native-reviewed. |
| **Dashboard Phenology** | Crop Cycle Progress | పంట కాలం పురోగతి | फसल चक्र प्रगति | **Unverified**: Not native-reviewed. |
| **Dashboard Phenology** | Days Elapsed | పూర్తయిన రోజులు | व्यतीत दिन | **Unverified**: Not native-reviewed. |
| **Dashboard Health** | Farm Health Score | వ్యవసాయ క్షేత్ర ఆరోగ్య స్కోరు | कृषि स्वास्थ्य स्कोर | **Unverified**: Not native-reviewed. |
| **Dashboard Health** | Evaluated from 3 telemetry components | 3 క్షేత్ర కొలతల ఆధారంగా అంచనా వేయబడింది | 3 टेलीमेट्री घटकों से मूल्यांकित | **Unverified**: Not native-reviewed. |
| **Dashboard Health** | Component Breakdown | విభాగాల వారీగా వివరాలు | घटक विवरण | **Unverified**: Not native-reviewed. |
| **Dashboard Envelopes** | Agent Coordination Status | నిపుణుల వ్యవస్థ సమన్వయ స్థితి | एजेंट समन्वय स्थिति | **Unverified**: Not native-reviewed. |
| **Irrigation Telemetry** | Weather-Based Reference ET0 | వాతావరణ ఆధారిత నీటి ఆవిరి (ET0) | मौसम आधारित संदर्भ वाष्पोत्सर्जन (ET0) | **Unverified**: Not native-reviewed. |
| **Irrigation Telemetry** | Forecast Rain Today | నేటి వర్ష సూచన | आज बारिश का पूर्वानुमान | **Unverified**: Not native-reviewed. |
| **Irrigation Depths** | Net Irrigation Depth | నికర నీటి తడి లోతు | शुद्ध सिंचाई गहराई | **Unverified**: Not native-reviewed. |
| **Irrigation Depths** | Gross Irrigation Depth | స్థూల నీటి తడి లోతు | सकल सिंचाई गहराई | **Unverified**: Not native-reviewed. |
| **Irrigation Depths** | Water Saved Today | నేడు ఆదా అయిన నీరు | आज बचाया गया पानी | **Unverified**: Not native-reviewed. |
| **Irrigation Telemetry** | FAO-56 Soil Water Telemetry | FAO-56 నేల తేమ కొలతలు | FAO-56 मृदा जल टेलीमेट्री | **Unverified**: Not native-reviewed. |
| **Irrigation Schedule** | 7-Day Irrigation Schedule & Soil Balance | 7 రోజుల నీటి పారుదల మరియు నేల తేమ ప్రణాళిక | 7-दिवसीय सिंचाई एवं मृदा संतुलन अनुसूची | **Unverified**: Not native-reviewed. |
| **Irrigation Diagnose** | Diagnose Irrigation Problem | నీటి పారుదల సమస్యను పరిశీలించండి | सिंचाई समस्या की जांच करें | **Unverified**: Not native-reviewed. |
| **Irrigation Attributes** | Soil Type | నేల రకం | मिट्टी का प्रकार | **Unverified**: Not native-reviewed. |
| **Irrigation Attributes** | Irrigation Method | నీటి పారుదల పద్ధతి | सिंचाई विधि | **Unverified**: Not native-reviewed. |
| **Calendar Labels** | Farm Holding | వ్యవసాయ క్షేత్రం | कृषि जोत | **Unverified**: Not native-reviewed. |
| **Calendar Labels** | Crop | పంట | फसल | **Unverified**: Not native-reviewed. |
| **Calendar Labels** | Sowing Date | విత్తిన తేదీ | बुवाई तिथि | **Unverified**: Not native-reviewed. |
| **Calendar Labels** | Current Growth Stage | ప్రస్తుత ఎదుగుదల దశ | वर्तमान विकास चरण | **Unverified**: Not native-reviewed. |
| **Calendar Labels** | Duration | వ్యవధి | अवधि | **Unverified**: Not native-reviewed. |
| **Calendar Labels** | Next Priority Task | తదుపరి ప్రాధాన్యత పని | अगला प्राथमिकता कार्य | **Unverified**: Not native-reviewed. |
| **Calendar Labels** | Regional Agro-Climatic Season Status | ప్రాంతీయ వ్యవసాయ కాలం స్థితి | क्षेत्रीय कृषि-जलवायु ऋतु स्थिति | **Unverified**: Not native-reviewed. |
| **Calendar Tabs** | Agronomic Tasks | వ్యవసాయ పనులు | कृषि कार्य | **Unverified**: Not native-reviewed. |
| **Calendar Tabs** | Growth Stages | ఎదుగుదల దశలు | विकास चरण | **Unverified**: Not native-reviewed. |
| **Calendar Tabs** | Seasonal Awareness | కాలం అవగాహన | मौसमी जागरूकता | **Unverified**: Not native-reviewed. |
| **Calendar Tabs** | Methodology | గణన విధానం | कार्यप्रणाली | **Unverified**: Not native-reviewed. |
| **Recommend Labels** | Rank | ర్యాంకు | रैंक | **Unverified**: Not native-reviewed. |
| **Recommend Labels** | Biological Pest Break | సహజ క్రిమి నియంత్రణ విరామం | जैविक कीट चक्र विराम | **Unverified**: Not native-reviewed. |
| **Recommend Labels** | Evaluation Basis | మూల్యాంకన ఆధారం | मूल्यांकन आधार | **Unverified**: Not native-reviewed. |
| **Recommend Labels** | Soil Telemetry Omitted (Weather-Only) | నేల వివరాలు లేవు (వాతావరణ ఆధారితం మాత్రమే) | मृदा विवरण नहीं (केवल मौसम आधारित) | **Unverified**: Not native-reviewed. |
| **Recommend Labels** | Complete (Soil + Weather) | పూర్తి (నేల + వాతావరణం) | पूर्ण (मिट्टी + मौसम) | **Unverified**: Not native-reviewed. |
| **Recommend Tabs** | Top Matches | ఉత్తమ ఎంపికలు | शीर्ष फसलें | **Unverified**: Not native-reviewed. |
| **Recommend Tabs** | Crop Rotation | పంట మార్పిడి ప్రణాళిక | फसल चक्र | **Unverified**: Not native-reviewed. |
| **Recommend Tabs** | Soil Telemetry | నేల పోషకాల కొలతలు | मृदा टेलीमेट्री | **Unverified**: Not native-reviewed. |
| **Recommend Tabs** | Model Card | మోడల్ వివరాలు | मॉडल विवरण | **Unverified**: Not native-reviewed. |
| **Reminders Title** | Reminders & Field Alerts | జ్ఞాపికలు & క్షేత్ర హెచ్చరికలు | स्मरणपत्र व खेत चेतावनियाँ | **Unverified**: Not native-reviewed. |
| **Reminders Notice** | Delivery Limitation Notice | సమాచార డెలివరీ పరిమితి గమనిక | सूचना वितरण सीमा सम्बन्धी नोटिस | **Unverified**: Not native-reviewed. |
| **Reminders Notice** | In-app reminders trigger when app is open or browser notifications enabled | మీరు యాప్ తెరిచినప్పుడు లేదా బ్రౌజర్ నోటిఫికేషన్లు అనుమతించినప్పుడు మాత్రమే రిమైండర్లు వస్తాయి | जब आप ऐप खोलते हैं या ब्राउज़र सूचनाओं की अनुमति देते हैं तभी स्मरणपत्र आते हैं | **Unverified**: Not native-reviewed. |
| **Reminders Suggestions** | Automated Farm Reminders | ఆటోమేటెడ్ క్షేత్ర సూచనలు | स्वचालित कृषि सुझाव | **Unverified**: Not native-reviewed. |
| **Reminders Tabs** | Upcoming | రానున్నవి | आगामी | **Unverified**: Not native-reviewed. |
| **Reminders Tabs** | Overdue | గడువు దాటినవి | अतिदेय | **Unverified**: Not native-reviewed. |
| **Reminders Tabs** | Completed | పూర్తయినవి | पूर्ण | **Unverified**: Not native-reviewed. |
| **Reminders Buttons** | + New Reminder | + కొత్త జ్ఞాపిక | + नया स्मरणपत्र | **Unverified**: Not native-reviewed. |
| **Reminders Buttons** | Export to Phone Calendar (.ics) | ఫోన్ క్యాలెండర్‌కు ఎగుమతి (.ics) | फ़ोन कैलेंडर में निर्यात (.ics) | **Unverified**: Not native-reviewed. |
| **Reminders Wizard** | What needs to be done? | ఏమి చేయాలి? | क्या कार्य करना है? | **Unverified**: Not native-reviewed. |
| **Reminders Wizard** | When is it due? | ఎప్పుడు చేయాలి? | कब करना है? | **Unverified**: Not native-reviewed. |
| **Reminders Wizard** | Does it repeat? | పునరావృతం కావాలా? | क्या यह दोहराना है? | **Unverified**: Not native-reviewed. |

---

## 15. Phase 6 Chat Query & Spoken Telemetry Additions (Not Native-Reviewed)

The following queries and backend-generated conversational spoken responses were tested against the live API on port 8020 and catalogued as **not native-reviewed**:

| Category | Text / Phrase | Language | Translation / Meaning | Review Status |
|---|---|---|---|---|
| **Chat Query** | ఈరోజు నా పత్తి చేనుకు నీరు పెట్టాలా? | `te` | Should I water my cotton farm today? | **Unverified**: Not native-reviewed. |
| **Chat Response** | మీ Cotton పంటకు ఈరోజు నీరు పెట్టాల్సిన అవసరం లేదు. సిఫార్సు చేసిన తడి లోతు 25.0 మి.మీ (మొత్తం 150,000 లీటర్లు). వర్ష సూచన ద్వారా ఆదా అయ్యే నీరు 0 లీటర్లు. | `te` | Your Cotton crop does not need water today. Recommended depth is 25.0 mm (total 150,000 litres). Rain savings forecast is 0 litres. | **Unverified**: Not native-reviewed. |
| **Chat Query** | क्या मुझे आज अपनी फसल में पानी देना चाहिए? | `hi` | Should I give water to my crop today? | **Unverified**: Not native-reviewed. |
| **Chat Response** | आपकी Cotton फसल को आज सिंचाई की आवश्यकता नहीं है। सिंचाई गहराई 25.0 मिमी (कुल 150,000 लीटर) है। बारिश के पूर्वानुमान से अनुमानित जल बचत 0 लीटर है। | `hi` | Your Cotton crop does not need irrigation today. Irrigation depth is 25.0 mm (total 150,000 litres). Estimated water savings from rain forecast is 0 litres. | **Unverified**: Not native-reviewed. |
| **Chat Smalltalk** | Glad to help! What would you like to check next on your farm? | `en` | Conversational acknowledgment response for "okay" | **English**: Standard extension tone. |

---

## 16. Round 7 Phase 2 Complete Multilingual Translation Additions (Unverified — Awaiting Native Review)

The following agronomic, economic, workflow, and interface strings were added in Round 7 Phase 2 across all 15 pages and global components (Auth, WatchHowTo, HowTo, Disease, Weather, Economics, Market, Farms, Schemes, Community, Calendar, Recommend, Dashboard, Reminders, GuidedTour, CommandPalette, VisualModeChooser). In accordance with honesty guidelines, all newly translated Telugu (`te`) and Hindi (`hi`) strings are catalogued as **unverified** and strictly marked as needing native-speaker review:

| Category | English String | Telugu Translation (`te`) | Hindi Translation (`hi`) | Review Status |
|---|---|---|---|---|
| **Auth** | Smallholder Agricultural Decision Intelligence | సన్నకారు రైతుల వ్యవసాయ నిర్ణయ వేదిక | लघु किसान कृषि निर्णय मंच | **Unverified**: Not native-reviewed. |
| **Auth** | Instant Evaluation | తక్షణ పరిశీలన | त्वरित मूल्यांकन | **Unverified**: Not native-reviewed. |
| **Auth** | ONE-CLICK LOGIN | ఒకే క్లిక్ ప్రవేశం | एक-क्लिक लॉगिन | **Unverified**: Not native-reviewed. |
| **Auth** | One-Click Demo Access | ఒకే క్లిక్ డెమో ప్రవేశం | एक-क्लिक डेमो प्रवेश | **Unverified**: Not native-reviewed. |
| **WatchHowTo** | Walkthrough Slot | వీడియో భాగం | वीडियो स्लॉट | **Unverified**: Not native-reviewed. |
| **WatchHowTo** | Video Coming Soon | వీడియో త్వరలో అందుబాటులోకి వస్తుంది | वीडियो जल्द आ रहा है | **Unverified**: Not native-reviewed. |
| **WatchHowTo** | Video coming soon. Please follow the written steps below. | వీడియో త్వరలో అందుబాటులోకి వస్తుంది. దయచేసి క్రింది లిఖితపూర్వక దశలను అనుసరించండి. | वीडियो जल्द आ रहा है। कृपया नीचे दिए गए लिखित चरणों का पालन करें। | **Unverified**: Not native-reviewed. |
| **WatchHowTo** | Read Illustrated Written Steps | బొమ్మలతో కూడిన దశలను చదవండి | सचित्र चरणबद्ध गाइड पढ़ें | **Unverified**: Not native-reviewed. |
| **WatchHowTo** | Quick Summary of Steps | దశల సంక్షిప్త సారాంశం | चरणों का त्वरित सारांश | **Unverified**: Not native-reviewed. |
| **WatchHowTo** | Listen to summary | సారాంశం వినండి | सारांश सुनें | **Unverified**: Not native-reviewed. |
| **WatchHowTo** | Step 1 • Language & Farm | దశ 1 • భాష & పొలం | चरण 1 • भाषा एवं खेत | **Unverified**: Not native-reviewed. |
| **WatchHowTo** | Step 2 • Weather & Rain | దశ 2 • వాతావరణం & వర్షం | चरण 2 • मौसम एवं बारिश | **Unverified**: Not native-reviewed. |
| **WatchHowTo** | Step 3 • Water Budget | దశ 3 • నీటి బడ్జెట్ | चरण 3 • जल बजट | **Unverified**: Not native-reviewed. |
| **WatchHowTo** | Step 4 • Disease Diagnosis | దశ 4 • తెగుళ్ల నిర్ధారణ | चरण 4 • रोग निदान | **Unverified**: Not native-reviewed. |
| **WatchHowTo** | Step 5 • Profit What-If | దశ 5 • లాభాల సిమ్యులేటర్ | चरण 5 • लाभ सिम्युलेटर | **Unverified**: Not native-reviewed. |
| **WatchHowTo** | Step 6 • Voice Assistant | దశ 6 • వాయిస్ అసిస్టెంట్ | चरण 6 • वॉयस असिस्टेंट | **Unverified**: Not native-reviewed. |
| **Disease** | Compressed & ready for pretrained PyTorch MobileNetV2 leaf scan | ప్రీట్రైన్డ్ PyTorch MobileNetV2 స్కాన్ కోసం సిద్ధం చేయబడింది | प्रीट्रेंड PyTorch MobileNetV2 स्कैन के लिए तैयार | **Unverified**: Not native-reviewed. |
| **Disease** | Analyzing Leaf... | ఆకును విశ్లేషిస్తోంది... | पत्ती का विश्लेषण हो रहा है... | **Unverified**: Not native-reviewed. |
| **Disease** | Scan Another Leaf | మరో ఆకును స్కాన్ చేయండి | दूसरी पत्ती स्कैन करें | **Unverified**: Not native-reviewed. |
| **Disease** | Primary IPM Action | ప్రాథమిక సహజ నివారణ చర్య | प्राथमिक समन्वित कीट प्रबंधन (IPM) कार्रवाई | **Unverified**: Not native-reviewed. |
| **Disease** | Zero Chemical | రసాయనాలు లేని పద్ధతి | शून्य रसायन | **Unverified**: Not native-reviewed. |
| **Disease** | Microclimate Spore Risk | సూక్ష్మ వాతావరణ శిలీంధ్ర ప్రమాదం | सूक्ष्म-जलवायु बीजाणु जोखिम | **Unverified**: Not native-reviewed. |
| **Disease** | Elevated Risk | ఎక్కువ ప్రమాదం | बढ़ा हुआ जोखिम | **Unverified**: Not native-reviewed. |
| **Disease** | Low Atmospheric Risk | తక్కువ వాతావరణ ప్రమాదం | कम वायुमंडलीय जोखिम | **Unverified**: Not native-reviewed. |
| **Disease** | Centroid: | కేంద్ర బిందువు: | केंद्र बिंदु: | **Unverified**: Not native-reviewed. |
| **Disease** | Indicative microclimate assessment based on open agro-meteorological data. | ఓపెన్ వాతావరణ సమాచారం ఆధారంగా సూచించిన అంచనా మాత్రమే. | खुले कृषि-मौसम डेटा पर आधारित सांकेतिक सूक्ष्म-जलवायु मूल्यांकन। | **Unverified**: Not native-reviewed. |
| **Disease** | Leaf Specimen & Farm Parameters | ఆకు నమూనా & పొలం వివరాలు | पत्ती का नमूना एवं खेत पैरामीटर | **Unverified**: Not native-reviewed. |
| **Disease** | Photo Loaded | ఫోటో లోడ్ అయింది | फोटो लोड हो गया | **Unverified**: Not native-reviewed. |
| **Disease** | No Photo Selected | ఫోటో ఎంచుకోలేదు | कोई फोटो नहीं चुना | **Unverified**: Not native-reviewed. |
| **Disease** | Invalid File | చెల్లని ఫైల్ | अमान्य फ़ाइल | **Unverified**: Not native-reviewed. |
| **Disease** | Borderline Agricultural Confidence | సరిహద్దు వ్యవసాయ విశ్వసనీయత | सीमांत कृषि विश्वास | **Unverified**: Not native-reviewed. |
| **Disease** | Visual indication only, not a soil moisture measurement. Please confirm to proceed. | దృశ్య సంకేతం మాత్రమే, నేల తేమ కొలత కాదు. కొనసాగడానికి నిర్ధారించండి. | केवल दृश्य संकेत, मिट्टी की नमी का माप नहीं। आगे बढ़ने के लिए पुष्टि करें। | **Unverified**: Not native-reviewed. |
| **Disease** | Confirm and Continue | నిర్ధారించి కొనసాగించండి | पुष्टि करें और जारी रखें | **Unverified**: Not native-reviewed. |
| **Disease** | Image Gate Verification Rejected | చిత్ర తనిఖీ తిరస్కరించబడింది | छवि सत्यापन अस्वीकृत | **Unverified**: Not native-reviewed. |
| **Disease** | Non-agricultural photo detected. No diagnosis generated. | వ్యవసాయేతర ఫోటో గుర్తించబడింది. ఎటువంటి రోగ నిర్ధారణ చేయలేదు. | गैर-कृषि फोटो पाई गई। कोई निदान नहीं किया गया। | **Unverified**: Not native-reviewed. |
| **Weather** | Today's Agro-Weather | నేటి వ్యవసాయ వాతావరణం | आज का कृषि-मौसम | **Unverified**: Not native-reviewed. |
| **Weather** | Rain Expected | వర్ష సూచన | बारिश की संभावना | **Unverified**: Not native-reviewed. |
| **Weather** | Clear Skies | నిర్మలమైన ఆకాశం | साफ आसमान | **Unverified**: Not native-reviewed. |
| **Weather** | Rain: | వర్షం: | बारिश: | **Unverified**: Not native-reviewed. |
| **Weather** | 7-Day Outlook | 7 రోజుల వాతావరణ సూచన | 7-दिवसीय दृष्टिकोण | **Unverified**: Not native-reviewed. |
| **Weather** | Atmospheric Demand | వాతావరణ నీటి ఆవిరి డిమాండ్ | वायुमंडलीय जल मांग | **Unverified**: Not native-reviewed. |
| **Weather** | Humidity | గాలిలో తేమ | आर्द्रता | **Unverified**: Not native-reviewed. |
| **Weather** | Wind Speed | గాలి వేగం | हवा की गति | **Unverified**: Not native-reviewed. |
| **Weather** | Active Agro-Centroid | క్రియాశీల వ్యవసాయ కేంద్రం | सक्रिय कृषि-केंद्र | **Unverified**: Not native-reviewed. |
| **Weather** | Linked to farm: | లింక్ చేయబడిన పొలం: | जुड़ा हुआ खेत: | **Unverified**: Not native-reviewed. |
| **Weather** | Indicative village-level centroid. | గ్రామ స్థాయి సూచిక కేంద్రం. | सांकेतिक ग्राम-स्तरीय केंद्र। | **Unverified**: Not native-reviewed. |
| **Weather** | Change Village → | గ్రామాన్ని మార్చండి → | गांव बदलें → | **Unverified**: Not native-reviewed. |
| **Weather** | 7-Day Agro-Forecast | 7 రోజుల వ్యవసాయ సూచన | 7-दिवसीय कृषि पूर्वानुमान | **Unverified**: Not native-reviewed. |
| **Weather** | Village & Location Selector | గ్రామం & ప్రాంత ఎంపిక | गांव एवं स्थान चयनकर्ता | **Unverified**: Not native-reviewed. |
| **Weather** | Crop Climate Suitability | పంట వాతావరణ అనుకూలత | फसल जलवायु उपयुक्तता | **Unverified**: Not native-reviewed. |
| **Weather** | 7-Day Daily Rain & Evapotranspiration | 7 రోజుల వర్షపాతం & నీటి ఆవిరి | 7-दिवसीय दैनिक वर्षा एवं वाष्पोत्सर्जन | **Unverified**: Not native-reviewed. |
| **Weather** | Select Agro-Climatic Zone & Village Coordinates | వ్యవసాయ వాతావరణ మండలం & గ్రామ కోఆర్డినేట్లను ఎంచుకోండి | कृषि-जलवायु क्षेत्र एवं ग्राम निर्देशांक चुनें | **Unverified**: Not native-reviewed. |
| **Weather** | Forecast data loading... | వాతావరణ సూచన లోడ్ అవుతోంది... | पूर्वानुमान डेटा लोड हो रहा है... | **Unverified**: Not native-reviewed. |
| **Economics** | Financial Baseline | ఆర్థిక ప్రాథమిక వివరాలు | वित्तीय आधार रेखा | **Unverified**: Not native-reviewed. |
| **Economics** | Margin: | లాభ శాతం: | मार्जिन: | **Unverified**: Not native-reviewed. |
| **Economics** | Per Acre: | ఎకరాకు: | प्रति एकड़: | **Unverified**: Not native-reviewed. |
| **Economics** | Change vs Baseline: | బేస్‌లైన్‌తో పోలిక: | आधार से बदलाव: | **Unverified**: Not native-reviewed. |
| **Economics** | Simulate What-If | వాట్-ఇఫ్ ప్రత్యక్ష అంచనా | व्हाट-इफ सिम्युलेटर | **Unverified**: Not native-reviewed. |
| **Economics** | Gross Revenue | మొత్తం ఆదాయం | सकल राजस्व | **Unverified**: Not native-reviewed. |
| **Economics** | Total Cost | మొత్తం ఖర్చు | कुल लागत | **Unverified**: Not native-reviewed. |
| **Economics** | Break-Even Thresholds | సమతూక (బ్రేక్-ఈవెన్) పరిమితులు | संतुलन (ब्रेक-इवेन) सीमाएं | **Unverified**: Not native-reviewed. |
| **Economics** | Land | భూమి | भूमि | **Unverified**: Not native-reviewed. |
| **Economics** | Break-Even Price: | కనీస సమతూక ధర: | संतुलन मूल्य: | **Unverified**: Not native-reviewed. |
| **Economics** | Break-Even Yield: | కనీస సమతూక దిగుబడి: | संतुलन उपज: | **Unverified**: Not native-reviewed. |
| **Economics** | Tenure Structure: | యాజమాన్య వివరాలు: | भूमि पट्टा संरचना: | **Unverified**: Not native-reviewed. |
| **Economics** | Prices below break-even result in seasonal debt. Verify prices at local APMC mandi. | సమతూక ధర కంటే తక్కువ ధర లభిస్తే నష్టం వస్తుంది. స్థానిక APMC మార్కెట్లో ధరలను ధృవీకరించుకోండి. | संतुलन मूल्य से कम भाव मिलने पर घाटा हो सकता है। स्थानीय APMC मंडी में भाव सत्यापित करें। | **Unverified**: Not native-reviewed. |
| **Economics** | What-If Simulator | వాట్-ఇఫ్ ప్రత్యక్ష లాభాల సిమ్యులేటర్ | व्हाट-इफ लाभ सिम्युलेटर | **Unverified**: Not native-reviewed. |
| **Market** | List Harvest for Farm-Gate Sale | పంటను నేరుగా విక్రయించడానికి జాబితా చేయండి | खेत से बिक्री के लिए फसल सूचीबद्ध करें | **Unverified**: Not native-reviewed. |
| **Market** | Mandi Rankings & Trends | మండి ర్యాంకులు & ధరల ధోరణి | मंडी रैंकिंग एवं रुझान | **Unverified**: Not native-reviewed. |
| **Market** | Farm-Gate Marketplace | నేరుగా పొలం వద్ద కొనుగోలు మార్కెట్ | खेत-गेट बाज़ार | **Unverified**: Not native-reviewed. |
| **Market** | Buyer Inquiries & Inbox | కొనుగోలుదారుల విచారణలు & సందేశాలు | खरीदार पूछताछ व इनबॉक्स | **Unverified**: Not native-reviewed. |
| **Market** | Gross modal price is misleading without transport cost. Always choose based on net realization. | రవాణా ఖర్చు పరిగణనలోకి తీసుకోకుండా స్థూల ధరను నమ్మవద్దు. ఎల్లప్పుడూ నికర ధర ఆధారంగానే మండిని ఎంచుకోండి. | परिवहन लागत के बिना केवल थोक भाव भ्रमित कर सकता है। हमेशा शुद्ध आय के आधार पर ही मंडी चुनें। | **Unverified**: Not native-reviewed. |
| **Market** | APMC modal prices and transport rates are calibrated on illustrative market datasets. | APMC మోడల్ ధరలు మరియు రవాణా రేట్లు మార్కెట్ సమాచారం ఆధారంగా లెక్కించబడ్డాయి. | APMC मॉडल भाव और परिवहन दरें बाज़ार डेटा पर आधारित हैं। | **Unverified**: Not native-reviewed. |
| **Market** | Realization Simulator Parameters | నికర ఆదాయ సిమ్యులేటర్ కొలతలు | शुद्ध आय सिम्युलेटर पैरामीटर | **Unverified**: Not native-reviewed. |
| **Market** | APMC Mandis Ranked by Net Realization | నికర ఆదాయం ప్రకారం APMC మండీల ర్యాంకులు | शुद्ध आय के आधार पर APMC मंडियों की रैंकिंग | **Unverified**: Not native-reviewed. |
| **Market** | Formula: (Modal Price × Qty) - Transport Cost - Mandi Fee | సూత్రం: (మార్కెట్ ధర × పరిమాణం) - రవాణా ఖర్చు - మండి రుసుము | सूत्र: (मॉडल भाव × मात्रा) - परिवहन लागत - मंडी शुल्क | **Unverified**: Not native-reviewed. |
| **Market** | Modal Price | మార్కెట్ ధర | मॉडल भाव | **Unverified**: Not native-reviewed. |
| **Market** | Transport Cost | రవాణా ఖర్చు | परिवहन लागत | **Unverified**: Not native-reviewed. |
| **Market** | Mandi Fee | మండి రుసుము | मंडी शुल्क | **Unverified**: Not native-reviewed. |
| **Market** | Net Realization / q | క్వింటాల్‌కు నికర ధర | प्रति क्विंटल शुद्ध आय | **Unverified**: Not native-reviewed. |
| **Market** | Total Net Payout | మొత్తం నికర చెల్లింపు | कुल शुद्ध भुगतान | **Unverified**: Not native-reviewed. |
| **Market** | Details | వివరాలు | विवरण | **Unverified**: Not native-reviewed. |
| **Farms** | Total Acreage: | మొత్తం విస్తీర్ణం: | कुल रकबा: | **Unverified**: Not native-reviewed. |
| **Farms** | Owned Land: | సొంత భూమి: | स्वामित्व भूमि: | **Unverified**: Not native-reviewed. |
| **Farms** | Leased Land: | కౌలు భూమి: | पट्टे की भूमि: | **Unverified**: Not native-reviewed. |
| **Farms** | Annual Lease Rent: | వార్షిక కౌలు మొత్తం: | वार्षिक पट्टा किराया: | **Unverified**: Not native-reviewed. |
| **Farms** | Soil Type: | నేల రకం: | मिट्टी का प्रकार: | **Unverified**: Not native-reviewed. |
| **Farms** | Water Source: | నీటి వనరు: | जल स्रोत: | **Unverified**: Not native-reviewed. |
| **Farms** | Irrigation Method: | నీటి పారుదల పద్ధతి: | सिंचाई विधि: | **Unverified**: Not native-reviewed. |
| **Farms** | Irrigation method directly influences application efficiency (Drip 90%, Flood 60%). | సాగునీటి పద్ధతి నీటి సామర్థ్యంపై ప్రత్యక్ష ప్రభావం చూపుతుంది (డ్రిప్ 90%, వరద పారుదల 60%). | सिंचाई विधि जल उपयोग दक्षता को सीधे प्रभावित करती है (ड्रिप 90%, सतही थाला 60%)। | **Unverified**: Not native-reviewed. |
| **Schemes** | Calibrate Soil | నేల వివరాలను నమోదు చేయండి | मिट्टी डेटा दर्ज करें | **Unverified**: Not native-reviewed. |
| **Schemes** | Agronomic Precision | వ్యవసాయ ఖచ్చితత్వం | कृषि सटीकता | **Unverified**: Not native-reviewed. |
| **Schemes** | Evaluation Shift | విశ్లేషణ మార్పు | मूल्यांकन बदलाव | **Unverified**: Not native-reviewed. |
| **Schemes** | Weather Baseline Mode: | వాతావరణ ఆధారిత విధానం: | मौसम आधार मोड: | **Unverified**: Not native-reviewed. |
| **Schemes** | With Confirmed Soil Card: | ధృవీకరించిన సాయిల్ కార్డుతో: | पुष्टित मृदा स्वास्थ्य कार्ड के साथ: | **Unverified**: Not native-reviewed. |
| **Schemes** | Upload & Calibrate Soil Card | సాయిల్ కార్డును అప్‌లోడ్ చేసి సరిచూడండి | मृदा कार्ड अपलोड कर जांचें | **Unverified**: Not native-reviewed. |
| **Schemes** | Agronomic Impact Shift | వ్యవసాయ ప్రభావంలో మార్పు | कृषि प्रभाव में बदलाव | **Unverified**: Not native-reviewed. |
| **Schemes** | Welfare Schemes (Planned) | సంక్షేమ పథకాలు (ప్రణాళిక చేయబడినవి) | कल्याणकारी योजनाएं (नियोजित) | **Unverified**: Not native-reviewed. |
| **Community** | Browse Machinery | యంత్రాలను చూడండి | मशीनरी ब्राउज़ करें | **Unverified**: Not native-reviewed. |
| **Community** | View Groups | రైతు సంఘాలను చూడండి | समूह देखें | **Unverified**: Not native-reviewed. |
| **Community** | Open Split Calculator | ఖర్చుల విభజన కాలిక్యులేటర్ తెరవండి | लागत विभाजन कैलकुलेटर खोलें | **Unverified**: Not native-reviewed. |
| **Calendar** | Season Period: | పంట కాలం: | ऋतु अवधि: | **Unverified**: Not native-reviewed. |
| **Calendar** | Primary Seasonal Risk: | ముఖ్యమైన కాల ప్రమాదం: | मुख्य मौसमी जोखिम: | **Unverified**: Not native-reviewed. |
| **Calendar** | IMD Agromet Guidelines | భారత వాతావరణ శాఖ (IMD) మార్గదర్శకాలు | IMD कृषि-मौसम दिशा-निर्देश | **Unverified**: Not native-reviewed. |
| **Calendar** | Primary Seasonal Risks: | ముఖ్యమైన కాల ప్రమాదాలు: | मुख्य मौसमी जोखिम: | **Unverified**: Not native-reviewed. |
| **Recommend** | Climate Suitability Warnings: | వాతావరణ అనుకూలత హెచ్చరికలు: | जलवायु उपयुक्तता चेतावनियाँ: | **Unverified**: Not native-reviewed. |
| **Dashboard** | Live weather available in Weather tab. | ప్రత్యక్ష వాతావరణం 'వాతావరణం' ట్యాబ్‌లో అందుబాటులో ఉంది. | लाइव मौसम 'मौसम' टैब में उपलब्ध है। | **Unverified**: Not native-reviewed. |
| **Dashboard** | Nutrient Shifts | పోషకాల మార్పులు | पोषक तत्व बदलाव | **Unverified**: Not native-reviewed. |
| **Reminders** | Loading reminders... | జ్ఞాపికలు లోడ్ అవుతున్నాయి... | स्मरणपत्र लोड हो रहे हैं... | **Unverified**: Not native-reviewed. |
| **Pictorial** | Recommended | సిఫార్సు చేయబడింది | अनुशंसित | **Unverified**: Not native-reviewed. |
| **Pictorial** | Standard | సాధారణం | मानक | **Unverified**: Not native-reviewed. |
| **Tour** | Grow2Gain Guided Tour | Grow2Gain సహాయక టూర్ | Grow2Gain निर्देशित टूर | **Unverified**: Not native-reviewed. |
| **Tour** | Step 1: Choose Your Language | దశ 1: మీ భాషను ఎంచుకోండి | चरण 1: अपनी भाषा चुनें | **Unverified**: Not native-reviewed. |
| **Tour** | Step 2: Choose or Add Your Farm Parcel | దశ 2: మీ పొలాన్ని ఎంచుకోండి లేదా జోడించండి | चरण 2: अपना खेत चुनें या जोड़ें | **Unverified**: Not native-reviewed. |
| **Tour** | Step 3: Check Agro-Weather & 7-Day Forecast | దశ 3: వ్యవసాయ వాతావరణం & 7 రోజుల సూచన | चरण 3: कृषि-मौसम एवं 7-दिवसीय पूर्वानुमान | **Unverified**: Not native-reviewed. |
| **Tour** | Step 4: Crop Water Budget & Irrigation Advice | దశ 4: పంట నీటి బడ్జెట్ & సాగునీటి సలహా | चरण 4: फसल जल बजट एवं सिंचाई सलाह | **Unverified**: Not native-reviewed. |
| **Tour** | Step 5: Scan Crop Leaf for Disease Diagnosis | దశ 5: తెగుళ్లను గుర్తించడానికి ఆకును స్కాన్ చేయండి | चरण 5: रोग निदान के लिए फसल की पत्ती स्कैन करें | **Unverified**: Not native-reviewed. |
| **Tour** | Step 6: Understand Farm Costs & Live Profit | దశ 6: వ్యవసాయ ఖర్చులు & ప్రత్యక్ష లాభాలు | चरण 6: खेत की लागत एवं लाइव लाभ समझें | **Unverified**: Not native-reviewed. |
| **Tour** | Step 7: Ask the Voice Assistant Anytime | దశ 7: ఎప్పుడైనా వాయిస్ అసిస్టెంట్‌ను అడగండి | चरण 7: किसी भी समय वॉयस असिस्टेंट से पूछें | **Unverified**: Not native-reviewed. |
| **Command** | No matching pages or tools found | సరిపోలే పేజీలు లేదా సాధనాలు కనుగొనబడలేదు | कोई मेल खाते पेज या टूल नहीं मिले | **Unverified**: Not native-reviewed. |
| **Command** | Try searching for "weather", "irrigation", "mandi" or "language" | "వాతావరణం", "నీటిపారుదల", "మండి" లేదా "భాష" కోసం వెతకండి | "मौसम", "सिंचाई", "मंडी" या "भाषा" खोजें | **Unverified**: Not native-reviewed. |
| **WatchHowTo** | Your browser does not support HTML5 video. | మీ బ్రౌజర్ HTML5 వీడియోకు మద్దతు ఇవ్వదు. | आपका ब्राउज़र HTML5 वीडियो का समर्थन नहीं करता है। | **Unverified**: Not native-reviewed. |
| **Disease** | Upload or capture a sharp photo of an affected leaf to identify symptoms and safe cultural treatments. | లక్షణాలను గుర్తించి సురక్షిత సేంద్రీయ నివారణలను తెలుసుకోవడానికి ప్రభావిత ఆకు ఫోటోను తీయండి లేదా అప్‌లోడ్ చేయండి. | लक्षणों की पहचान और सुरक्षित जैविक उपचार जानने के लिए प्रभावित पत्ती का स्पष्ट फोटो खींचें या अपलोड करें। | **Unverified**: Not native-reviewed. |
| **Community** | Community tools allow you to pool transport with neighbouring farmers in {{village}} and rent idle farm machinery at fair daily rates. | {{village}} పరిసరాల్లోని రైతులతో కలిసి సరుకు రవాణా పంచుకోవడానికి మరియు అందుబాటు ధరల్లో వ్యవసాయ యంత్రాలను అద్దెకు తీసుకోవడానికి Grow2Gain కమ్యూనిటీ వేదిక సహాయపడుతుంది. | {{village}} के आसपास के साथी किसानों के साथ मिलकर वाहन साझा करने और उचित दरों पर कृषि मशीनरी किराए पर लेने में मदद मिलती है। | **Unverified**: Not native-reviewed. |
| **Community** | Local Hub | స్థానిక కేంద్రం | स्थानीय केंद्र | **Unverified**: Not native-reviewed. |
| **Market** | Top Mandi Realization | అత్యుత్తమ మార్కెట్ ఆదాయం | सर्वोत्तम मंडी शुद्ध प्राप्ति | **Unverified**: Not native-reviewed. |
| **Market** | Awaiting prices | ధరల కోసం వేచి ఉంది | भाव की प्रतीक्षा है | **Unverified**: Not native-reviewed. |
| **Market** | Total Net Payout | మొత్తం నికర ఆదాయం | कुल शुद्ध भुगतान | **Unverified**: Not native-reviewed. |
| **Market** | View All Mandis | అన్ని మండీలు చూడండి | सभी मंडियां देखें | **Unverified**: Not native-reviewed. |
| **Market** | Transport & Cess Math | రవాణా మరియు సెస్ లెక్కలు | भाड़ा और मंडी सेस गणना | **Unverified**: Not native-reviewed. |
| **Market** | Gross Realization | మొత్తం అమ్మకం ఆదాయం | सकल प्राप्ति | **Unverified**: Not native-reviewed. |
| **Market** | Freight Logistics | రవాణా చార్జీలు | मालभाड़ा खर्च | **Unverified**: Not native-reviewed. |
| **Market** | Mandi Cess | మార్కెట్ సెస్ | मंडी सेस | **Unverified**: Not native-reviewed. |
| **Economics** | At current price of ₹{{price}}/q and harvest yield of {{yield}} q/acre, your estimated net profit is ₹{{profit}} with a {{margin}}% margin. | ప్రస్తుత ధర ₹{{price}}/క్వింటాల్ మరియు దిగుబడి {{yield}} క్వింటాళ్లు/ఎకరా లెక్కన, మీ అంచనా నికర లాభం ₹{{profit}} ({{margin}}% మార్జిన్). | वर्तमान मूल्य ₹{{price}}/क्विंटल और पैदावार {{yield}} क्विंटल/एकड़ पर, आपका अनुमानित शुद्ध लाभ ₹{{profit}} ({{margin}}% मार्जिन) है। | **Unverified**: Not native-reviewed. |
| **Economics** | Warning: Projected net deficit of ₹{{deficit}}. Break-even requires at least ₹{{breakeven}}/q or reduced operating expenditure. | హెచ్చరిక: ₹{{deficit}} అంచనా నికర నష్టం. లాభనష్టాలు సమానం కావడానికి కనీసం ₹{{breakeven}}/క్వింటాల్ ధర లేదా నిర్వహణ ఖర్చులు తగ్గించాలి. | चेतावनी: ₹{{deficit}} का अनुमानित घाटा। लागत निकालने के लिए कम से कम ₹{{breakeven}}/क्विंटल भाव या परिचालन खर्च में कमी की आवश्यकता है। | **Unverified**: Not native-reviewed. |
| **Market** | Selling {{quantity}} quintals of {{crop}} at {{mandi}} gives your highest net payout of ₹{{rate}}/q after deducting transport and mandi fees. | రవాణా మరియు మార్కెట్ రుసుములను తీసివేసిన తర్వాత {{mandi}}లో {{quantity}} క్వింటాళ్ల {{crop}} అమ్మితే క్వింటాల్‌కు అత్యధికంగా ₹{{rate}} నికర ఆదాయం లభిస్తుంది. | भाड़ा और मंडी सेस घटाने के बाद {{mandi}} में {{quantity}} क्विंटल {{crop}} बेचने पर आपको प्रति क्विंटल सबसे अधिक ₹{{rate}} की शुद्ध प्राप्ति मिलती है। | **Unverified**: Not native-reviewed. |
| **Market** | Calculating net mandi realization rankings... | మండీల నికర ఆదాయ ర్యాంకింగ్‌లు లెక్కిస్తోంది... | मंडियों की शुद्ध प्राप्ति रैंकिंग की गणना की जा रही है... | **Unverified**: Not native-reviewed. |

---

## 7. Phase 5 Location Dropdowns & District Names (`docs/I18N_REVIEW.md`)

**Date:** 2026-11-15  
**Scope:** Cascading State & District dropdowns for Farm Registration & Location Management.  
**Policy:** Telangana (33) and Andhra Pradesh (26) districts are provided with official state government transliterations in Telugu and Hindi. All other 34 States and UTs show their English administrative names with an `[EN]` marker when Telugu or Hindi is active.

| Category | English / Admin Name | Telugu (`te`) | Hindi (`hi`) | Review Status |
|---|---|---|---|---|
| **State** | Telangana | తెలంగాణ | तेलंगाना | **Verified**: Official constitutional state name. |
| **State** | Andhra Pradesh | ఆంధ్రప్రదేశ్ | आंध्र प्रदेश | **Verified**: Official constitutional state name. |
| **District (TS)** | Warangal | వరంగల్ | वारंगल | **Unverified**: Standard administrative transliteration. |
| **District (TS)** | Hanumakonda | హనుమకొండ | हनुमकोंडा | **Unverified**: Standard administrative transliteration. |
| **District (TS)** | Adilabad | ఆదిలాబాద్ | आदिलाबाद | **Unverified**: Standard administrative transliteration. |
| **District (TS)** | Bhadradri Kothagudem | భద్రాద్రి కొత్తగూడెం | भद्राद्री कोठागुडेम | **Unverified**: Standard administrative transliteration. |
| **District (TS)** | Mulugu | ములుగు | मुलुगु | **Unverified**: Standard administrative transliteration. |
| **District (AP)** | Alluri Sitharama Raju | అల్లూరి సీతారామరాజు | अल्लूरी सीताराम राजू | **Unverified**: Standard administrative transliteration. |
| **District (AP)** | Dr. B.R. Ambedkar Konaseema | డా. బి.ఆర్. అంబేద్కర్ కోనసీమ | डॉ. बी.आर. अंबेडकर कोनासीमा | **Unverified**: Standard administrative transliteration. |
| **District (AP)** | Guntur | గుంటూరు | गुंटूर | **Unverified**: Standard administrative transliteration. |
| **District (AP)** | Kurnool | కర్నూలు | कुरनूल | **Unverified**: Standard administrative transliteration. |
| **Other States** | Non-TS/AP Districts | Name + `[EN]` | Name + `[EN]` | **Verified Fallback**: Explicit marker prevents simulated translations. |
| **UI Label** | approximate district centre | జిల్లా కేంద్రం సుమారు | जिला केंद्र अनुमानित | **Unverified**: Awaiting native agronomist review. |
| **UI Label** | Edit Farm Parcel | పొలం వివరాలు సవరించండి | खेत विवरण बदलें | **Unverified**: Awaiting native agronomist review. |
| **UI Label** | Save Changes | మార్పులను భద్రపరచండి | बदलाव सहेजें | **Unverified**: Awaiting native agronomist review. |

---

## 8. Round 7b Crop Advisory Decision States & Input Sourcing (`docs/I18N_REVIEW.md`)

**Date:** 2026-11-15  
**Scope:** 4-Tier decision status system, input sourcing chips, refusal states, and benchmark model transparency.

| Phrase Category | English Phrase | Telugu Translation (`te`) | Hindi Translation (`hi`) | Review Status |
|---|---|---|---|---|
| **Status Badge** | Confident Match | నమ్మదగిన సరిపోలిక | विश्वसनीय मिलान | **Unverified**: Not native-reviewed. |
| **Status Badge** | Indicative Only (Soil Needed) | సూచనాత్మకమైనది మాత్రమే (నేల వివరాలు అవసరం) | केवल सांकेतिक (मिट्टी विवरण आवश्यक) | **Unverified**: Not native-reviewed. |
| **Status Badge** | Unusual Combination | అసాధారణ కలయిక | असामान्य संयोजन | **Unverified**: Not native-reviewed. |
| **Status Badge** | Invalid Input | చెల్లని ఇన్‌పుట్ | अमान्य इनपुट | **Unverified**: Not native-reviewed. |
| **Refusal Headline** | Unusual Combination, Not Confident | అసాధారణ కలయిక, నమ్మకం సరిపోదు | असामान्य संयोजन, विश्वास योग्य नहीं | **Unverified**: Not native-reviewed. |
| **Refusal Message** | Please verify with a soil test or local agriculture officer. | దయచేసి నేల పరీక్ష లేదా స్థానిక వ్యవసాయ అధికారితో ధృవీకరించండి. | कृपया मिट्टी परीक्षण या स्थानीय कृषि अधिकारी से सत्यापित करें। | **Unverified**: Not native-reviewed. |
| **Input Source** | Measured (weather API) | కొలవబడినది (వాతావరణ API) | मापा गया (मौसम API) | **Unverified**: Not native-reviewed. |
| **Input Source** | Entered (user) | నమోదు చేసినది (రైతు) | दर्ज किया गया (उपयोगकर्ता) | **Unverified**: Not native-reviewed. |
| **Input Source** | From soil card | నేల ఆరోగ్య పత్రం నుండి | मृदा कार्ड से | **Unverified**: Not native-reviewed. |
| **Input Source** | Not provided | అందించలేదు | उपलब्ध नहीं | **Unverified**: Not native-reviewed. |
| **UI Header** | How This Was Chosen | ఇది ఎలా ఎంపిక చేయబడింది | इसे कैसे चुना गया | **Unverified**: Not native-reviewed. |
| **Disclaimer** | Advisory based on public benchmark dataset. Field verification is advised. | పబ్లిక్ బెంచ్‌మార్క్ డేటాసెట్ ఆధారిత సలహా. క్షేత్రస్థాయి ధృవీకరణ అవసరం. | सार्वजनिक बेंचमार्क डेटासेट पर आधारित सलाह। क्षेत्रीय सत्यापन की सलाह दी जाती है। | **Unverified**: Not native-reviewed. |

---

## 9. Round 7c Multilingual Voice Assistant & Sub-District Hierarchy Review (`docs/I18N_REVIEW.md`)

**Date:** 2026-11-15  
**Scope:** Strict prompt guidelines for Voice/Chat assistant, 16-query multi-language benchmark, and sub-district/mandal administrative unit hierarchy.

### 9.1 Multi-Query Chat Assistant Evaluation (16 Queries)
A rigorous evaluation across 16 queries (8 in Telugu `te`, 4 in Hindi `hi`, and 4 in English `en`) was conducted via `scripts/evaluate_chat_16_queries.py` against active farm context (Cotton in Warangal, Telangana):

| Language | Query Intent | Prompt Grounding & Strict Rules | Evaluation Result | Review Status |
|---|---|---|---|---|
| **Telugu** (8 queries) | Irrigation status, Mandi prices, Crop recommendation, Crop rotation, General pest scouting | Grounded in live farm context: states "no irrigation today" when `irrigate_now=False`, quotes ₹7,180/q ground truth mandi modal price, requires soil testing before crop recommendations, never mentions tomato/pachadi or invented past waterings. | **100% Pass** (8/8 queries linguistically grounded in Telugu script) | **Unverified**: Telugu responses are grammatically coherent but strictly require native agricultural speaker review before high-stakes field deployment. |
| **Hindi** (4 queries) | Irrigation status, Mandi prices, Crop recommendation, General advice | Grounded in live farm context: respects weather normals, cites DEMO DATA labels, requires soil NPK data for crop recommendations. | **100% Pass** (4/4 queries linguistically grounded in Devanagari script) | **Unverified**: Requires native speaker review. |
| **English** (4 queries) | Irrigation status, Mandi prices, Crop recommendation, Crop rotation | Formatted with exact figures, no hallucinated past farmer actions, clear disclaimers. | **100% Pass** (4/4 queries pass automated assertion checks) | **Verified** |

### 9.2 Sub-District & Mandal Localization Ledger
1,659 sub-district units (mandals in TS/AP, talukas in KA/MH) were bundled from verified open shapefiles (`datta07/INDIAN-SHAPEFILES`, MIT License).
- **Telugu & Hindi transliteration status**: District-level names for Telangana (33) and Andhra Pradesh (26) are fully transliterated. Sub-district mandal names currently display their official survey transliteration in Latin script with Telugu and Hindi phonetics.
- **Native Review Policy**: In accordance with Grow2Gain honesty rules, all non-English voice and text advisory outputs are flagged as requiring native agronomist field validation.

---

## 10. Round 7e Voice Reminders, Mandi/Crop Translations & Wording Ledger

**Date:** 2026-11-15  
**Scope:** Multilingual voice reminders with Asia/Kolkata timestamps and confirmation prompts, grounded entity translation maps (crops, mandis, agricultural officers), user-visible "Mandal / Taluk" wording update, and typo resolution.

### 10.1 Voice Reminder Confirmation Prompts & Task Titles
Voice reminders deterministically parse natural speech in Asia/Kolkata timezone (UTC+05:30) and ask for farmer confirmation before persisting to the database.

| Phrase Category | English Phrase | Telugu Translation (`te`) | Hindi Translation (`hi`) | Review Status |
|---|---|---|---|---|
| **Voice Reminder Command** | remind me tomorrow 6 am to water | రేపు ఉదయం 6 గంటలకు పత్తికి నీరు పెట్టాలని గుర్తు చేయండి | कल सुबह 6 बजे कपास में पानी देने का स्मरण कराएं | **needs native review** |
| **Clean Extracted Title** | Water | పత్తికి నీరు పెట్టాలని | कपास में पानी देने | **needs native review** |
| **Confirmation Prompt** | Would you like me to schedule a reminder: '{title}' for {formatted_date} (Asia/Kolkata)? Reminder scheduled only after your confirmation. Reply 'Yes' to confirm or 'No' to cancel. | మీరు ఈ జ్ఞాపిక షెడ్యూల్ చేయాలనుకుంటున్నారా: '{title}', సమయం {formatted_date} (Asia/Kolkata)? జ్ఞాపిక నమోదు చేయబడింది నిర్ధారణ తర్వాత మాత్రమే. సేవ్ చేయడానికి 'అవును' లేదా రద్దు చేయడానికి 'వద్దు' అనండి. | क्या आप यह स्मरणपत्र जोड़ना चाहते हैं: '{title}', समय {formatted_date} (Asia/Kolkata)? स्मरणपत्र दर्ज किया गया पुष्टि के बाद ही। सहेजने के लिए 'हाँ' या रद्द करने के लिए 'नहीं' कहें। | **needs native review** |
| **Confirmation Action Chip** | Confirm in Reminders | రిమైండర్లలో నిర్ధారించండి | स्मरणपत्र में पुष्टि करें | **needs native review** |
| **Reminder Saved Spoken** | Reminder saved successfully: '{title}'. You will see it on your Reminders page. | జ్ఞాపిక విజయవంతంగా భద్రపరచబడింది: '{title}'. ఇది మీ రిమైండర్ల పేజీలో కనిపిస్తుంది. | स्मरणपत्र सफलतापूर्वक सहेजा गया: '{title}'। यह आपके स्मरणपत्र पृष्ठ पर दिखाई देगा। | **needs native review** |
| **Reminder Cancelled Spoken** | Reminder was cancelled. | జ్ఞాపిక రద్దు చేయబడింది. | स्मरणपत्र रद्द कर दिया गया। | **needs native review** |

### 10.2 Entity Grounding & Translation Maps
To eliminate raw English terminology appearing in Telugu and Hindi rule-based chat responses, comprehensive translation mappings are applied. Any unknown entity retains an explicit `[EN]` fallback marker rather than fabricating translations.

| English Entity | Telugu Translation (`te`) | Hindi Translation (`hi`) | Review Status |
|---|---|---|---|
| **Cotton** | పత్తి | कपास | **needs native review** |
| **Rice / Paddy** | వరి | धान | **needs native review** |
| **Wheat** | గోధుమ | गेहूं | **needs native review** |
| **Maize / Corn** | మొక్కజొన్న | मक्का | **needs native review** |
| **Chilli / Chili** | మిర్చి | मिर्च | **needs native review** |
| **Groundnut** | వేరుశనగ | मूंगफली | **needs native review** |
| **Tomato** | టమోటా | टमाटर | **needs native review** |
| **Potato** | బంగాళాదుంప | आलू | **needs native review** |
| **Pulses** | పప్పుధాన్యాలు | दालें | **needs native review** |
| **Redgram / Pigeonpeas** | కందులు | अरहर | **needs native review** |
| **Blackgram** | మినుములు | उड़द | **needs native review** |
| **Greengram / Mungbean** | పెసలు | मूंग | **needs native review** |
| **Bengalgram / Chickpea** | శనగలు | चना | **needs native review** |
| **Soyabean** | సోయాబీన్ | सोयाबीन | **needs native review** |
| **Sugarcane** | చెరకు | गन्ना | **needs native review** |
| **Turmeric** | పసుపు | हल्दी | **needs native review** |
| **Onion** | ఉల్లిపాయ | प्याज | **needs native review** |
| **Enumamula (Warangal)** | ఎనుమాముల (వరంగల్) | एनुमामुला (वारंगल) | **needs native review** |
| **Khammam** | ఖమ్మం | खम्मम | **needs native review** |
| **Badepalli (Jadcherla)** | బాదేపల్లి (జడ్చర్ల) | बादेपल्ली (जडचेर्ला) | **needs native review** |
| **Agriculture Extension Officer** | వ్యవసాయ విస్తరణ అధికారి | कृषि विस्तार अधिकारी | **needs native review** |
| **Block / Mandal Agriculture Officer** | మండల వ్యవసాయ అధికారి | प्रखंड / मंडल कृषि अधिकारी | **needs native review** |

### 10.3 Typo Correction: Soil Testing Causative Infix
- **Reported Typo:** `"పరీక్షించించుకోండి"` (accidental double-causative duplication of `-చించు-`).
- **Correction:** Standardized across all Telugu advisory copy to `"పరీక్షించుకోండి"` (or `"నేల పరీక్ష చేయించుకోండి"` / `"నేల పరీక్ష విలువలను నమోదు చేయండి"`). Marked as **needs native review**.

### 10.4 User-Visible Sub-District Wording: "Mandal / Taluk"
To accurately represent administrative reality in South India (TS/AP/KA/MH) where Census 2011 subdistricts are mandals/taluks rather than individual revenue villages, all user-facing labels were renamed. Underlying database schema and JSON API properties (`village`, `precision`) remain unchanged for strict backward compatibility.

| UI Component | English (`en`) | Telugu (`te`) | Hindi (`hi`) | Review Status |
|---|---|---|---|---|
| **farms.village_label** | Mandal / Taluk | మండలం / తాలూకా | मंडल / तालुका | **needs native review** |
| **Farm Parcel Wizard Step 2** | Mandal / Taluk & Weather Location | మండలం / తాలూకా & జీపీఎస్ లొకేషన్ | मंडल / तालुका व स्थान | **needs native review** |
| **Farm Parcel Wizard Description** | Pinpoint mandal or taluk coordinates for hyper-local rain telemetry | ఖచ్చితమైన వర్షపాత సూచన కోసం మండలం / తాలూకా ఎంచుకోండి | सटीक बारिश के लिए मंडल / तालुका का चयन करें | **needs native review** |
| **Farm Form Field Prompt** | Parcel name, total acres, tenure breakdown (owned/leased), soil type, water source, and mandal / taluk. | పొలం పేరు, విస్తీర్ణం (ఎకరాల్లో), భూమి రకం (సొంతం/కౌలు), నేల స్వభావం మరియు మండలం / తాలూకా. | खेत का नाम, रकबा (एकड़ में), जमीन का प्रकार (खुद की/बटाई), मिट्टी का प्रकार और मंडल / तालुका। | **needs native review** |

---

## 11. Round 8 Phase 2 Calendar Cleanup (Unreviewed Strings)

In Round 8 Phase 2, the "Export Calendar" (.ics export) button and all user-facing references to calendar RFC 5545 export were removed from the Calendar page. The backend ICS endpoint (`/api/v1/calendar/export.ics`) and its test coverage remain preserved in the backend codebase for API backward compatibility, but are documented as unused by the frontend UI.

| UI Key / Location | English (`en`) | Telugu (`te`) | Hindi (`hi`) | Review Status |
|---|---|---|---|---|
| **calendar.subtitle** | Stage-by-stage agronomic timeline tied to your sowing date. | విత్తిన తేదీ ఆధారంగా దశలవారీ వ్యవసాయ ప్రణాళిక. | बुवाई की तिथि से जुड़े चरणबद्ध कृषि कार्य। | **NOT native-reviewed** |
| **calendar.explain_title** | Calendar Logic & Agronomic Principles | క్యాలెండర్ విధానం & వ్యవసాయ సూత్రాలు | कैलेंडर तर्क एवं कृषि सिद्धांत | **NOT native-reviewed** |

---

## 12. Round 8 Phase 4 & Phase 5 Soil Card Flow & Crop Advisory (Unreviewed Strings)

In Round 8 Phases 4 and 5, full Gemini Vision Soil Health Card extraction, farm-scoped persistence, and Crop Advisory 7-feature integration were implemented. The following keys were introduced across `en`, `te`, and `hi` locale catalogs and are catalogued here as **NOT native-reviewed**:

| UI Key / Location | English (`en`) | Telugu (`te`) | Hindi (`hi`) | Review Status |
|---|---|---|---|---|
| **soilcard.read_from_card** | Read from your card | మీ కార్డ్ నుండి గుర్తించబడింది | आपके कार्ड से पहचाना गया | **NOT native-reviewed** |
| **soilcard.read_from_card_conf** | Read from your card ({{conf}}%) | మీ కార్డ్ నుండి గుర్తించబడింది ({{conf}}%) | आपके कार्ड से पहचाना गया ({{conf}}%) | **NOT native-reviewed** |
| **soilcard.field_unreadable** | Not detected — enter manually | గుర్తించబడలేదు — నేరుగా నమోదు చేయండి | पहचाना नहीं गया — कृपया दर्ज करें | **NOT native-reviewed** |
| **soilcard.confirm_save_farm** | Confirm and save to this farm | నిర్ధారించి ఈ పొలానికి భద్రపరచండి | पुष्टि करें और इस खेत में सहेजें | **NOT native-reviewed** |
| **soilcard.go_to_crop_advisory** | Go to Crop Advisory | పంట సలహాకు వెళ్లండి | फसल परामर्श पर जाएं | **NOT native-reviewed** |
| **soilcard.back_to_crop_advisory** | Back to Crop Advisory | తిరిగి పంట సలహాకు వెళ్లండి | फसल परामर्श पर वापस जाएं | **NOT native-reviewed** |
| **soilcard.replace_or_remove_btn** | Replace card / Remove saved values | కార్డ్ మార్చండి / భద్రపరిచిన విలువలను తొలగించండి | कार्ड बदलें / सहेजे गए मान हटाएं | **NOT native-reviewed** |
| **soilcard.replace_card_btn** | Replace card | కార్డ్ మార్చండి | कार्ड बदलें | **NOT native-reviewed** |
| **soilcard.remove_card_btn** | Remove saved values | విలువలను తొలగించండి | मान हटाएं | **NOT native-reviewed** |
| **soilcard.remove_confirm_msg** | Are you sure you want to remove the saved soil values for this farm? | ఈ పొలం కోసం భద్రపరిచిన నేల వివరాలను ఖచ్చితంగా తొలగించాలనుకుంటున్నారా? | क्या आप इस खेत के लिए सहेजे गए मृदा मान हटाना चाहते हैं? | **NOT native-reviewed** |
| **soilcard.removing** | Removing saved values... | తొలగిస్తున్నాము... | हटाया जा रहा है... | **NOT native-reviewed** |
| **soilcard.card_removed_success** | Saved soil values removed successfully. | భద్రపరిచిన నేల వివరాలు విజయవంతంగా తొలగించబడ్డాయి. | सहेजे गए मृदा मान सफलतापूर्वक हटा दिए गए। | **NOT native-reviewed** |
| **soilcard.ai_provider_notice** | Photo is sent to an AI provider (Google Gemini) to read values. | విలువలను గుర్తించడానికి ఫోటో AI ప్రొవైడర్ (Google Gemini) కు పంపబడుతుంది. | मान पढ़ने के लिए फोटो AI प्रदाता (Google Gemini) को भेजा जाता है। | **NOT native-reviewed** |
| **soilcard.saved_values_active** | Saved soil values active for this farm | ఈ పొలానికి నేల వివరాలు భద్రపరచబడి ఉన్నాయి | इस खेत के लिए मृदा परीक्षण मान सक्रिय हैं | **NOT native-reviewed** |
| **soilcard.source_label** | Source | మూలం | स्रोत | **NOT native-reviewed** |
| **soilcard.test_date_label** | Test Date | పరీక్ష తేదీ | परीक्षण तिथि | **NOT native-reviewed** |
| **soilcard.source_ai** | Photo read by AI | AI ద్వారా ఫోటో నుండి గుర్తించబడింది | AI द्वारा फोटो से पढ़ा गया | **NOT native-reviewed** |
| **soilcard.source_manual** | Typed by farmer | రైతు ద్వారా నమోదు చేయబడింది | किसान द्वारा दर्ज किया गया | **NOT native-reviewed** |
| **soilcard.extracting_vision** | Reading soil values with AI vision... | AI విజన్ ద్వారా నేల వివరాలను గుర్తిస్తున్నాము... | AI विज़न द्वारा मृदा मान पढ़े जा रहे हैं... | **NOT native-reviewed** |
| **soilcard.take_photo_camera** | Choose photo or capture with camera | ఫోటో ఎంచుకోండి లేదా కెమెరాతో తీయండి | फोटो चुनें या कैमरे से खींचें | **NOT native-reviewed** |
| **soilcard.manual_entry_note** | Or fill in values directly below without uploading a card | లేదా కార్డ్ అప్‌లోడ్ చేయకుండా నేరుగా క్రింద నమోదు చేయండి | या कार्ड अपलोड किए बिना नीचे सीधे विवरण दर्ज करें | **NOT native-reviewed** |
| **soilcard.reset_form_btn** | Clear Form | ఫారమ్ ఖాళీ చేయండి | फॉर्म रीसेट करें | **NOT native-reviewed** |
| **recommend.soil_values_missing** | Soil values missing. Add them from your Soil Card for the best crop recommendation | నేల పరీక్ష వివరాలు లేవు. ఉత్తమ పంట సలహా కోసం మీ సాయిల్ హెల్త్ కార్డ్ నుండి జోడించండి | मृदा मान अनुपलब्ध हैं। सर्वोत्तम फसल सलाह के लिए अपने सॉइल कार्ड से जोड़ें | **NOT native-reviewed** |
| **recommend.save_to_farm** | Save to farm | పొలానికి భద్రపరచండి | खेत में सहेजें | **NOT native-reviewed** |
| **recommend.not_saved_notice** | Not saved to farm profile | పొలం ప్రొఫైల్‌లో ఇంకా భద్రపరచబడలేదు | खेत प्रोफाइल में सहेजा नहीं गया है | **NOT native-reviewed** |
| **recommend.source_soil_card_tested** | Soil card, tested {date} | సాయిల్ కార్డ్, పరీక్షించిన తేదీ {date} | सॉइल कार्ड, परीक्षण तिथि {date} | **NOT native-reviewed** |
| **recommend.source_typed_farmer** | Typed by farmer | రైతు ద్వారా నమోదు చేయబడింది | किसान द्वारा दर्ज किया गया | **NOT native-reviewed** |












