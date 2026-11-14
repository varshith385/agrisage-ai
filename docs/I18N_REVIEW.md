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




