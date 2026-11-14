/**
 * Safe translation utility for dynamic backend strings (stages, statuses, priorities, crops, tasks, etc.)
 * Ensures that farmers using Telugu or Hindi never see raw English sentences or developer jargon.
 */

export const STAGE_MAP: Record<string, { te: string; hi: string }> = {
  germination: { te: 'మొలకెత్తడం మరియు నాటుకొనడం', hi: 'अंकुरण और स्थापना' },
  seedling: { te: 'మొలక దశ', hi: 'अंकुर अवस्था' },
  vegetative: { te: 'శాఖా ఎదుగుదల దశ', hi: 'वानस्पतिक वृद्धि' },
  flowering: { te: 'పూత దశ', hi: 'फूल आने की अवस्था' },
  'flowering & blossom': { te: 'పూత దశ', hi: 'फूल आने की अवस्था' },
  'flowering & boll formation': { te: 'పూత మరియు కాయ ఏర్పడే దశ', hi: 'फूल और फल बनने की अवस्था' },
  fruiting: { te: 'కాయ / గింజ నిండే దశ', hi: 'फल / दाना भरने की अवस्था' },
  boll: { te: 'కాయ ఏర్పడే దశ', hi: 'फल बनने की अवस्था' },
  maturity: { te: 'పక్వత మరియు కోత దశ', hi: 'परिपक्वता और कटाई' },
  harvest: { te: 'పంట కోత దశ', hi: 'कटाई की अवस्था' },
  initial: { te: 'ప్రారంభ దశ', hi: 'प्रारंभिक अवस्था' },
  mid: { te: 'మధ్య దశ', hi: 'मध्य अवस्था' },
  late: { te: 'చివరి దశ', hi: 'अंतिम अवस्था' },
  'mid-season development': { te: 'మధ్య కాల ఎదుగుదల దశ', hi: 'मध्य-मौसम विकास अवस्था' },
  'active growth': { te: 'చురుకైన ఎదుగుదల దశ', hi: 'सक्रिय वृद्धि अवस्था' },
  emergence: { te: 'మొలక దశ', hi: 'अंकुर अवस्था' },
  bloom: { te: 'పూత దశ', hi: 'फूल आने की अवस्था' },
  'square formation': { te: 'మొగ్గ దశ', hi: 'कली बनने की अवस्था' },
  'boll opening': { te: 'కాయ పగిలే దశ', hi: 'कपास खिलने की अवस्था' },
  tillering: { te: 'పిలకలు పెట్టే దశ', hi: 'कल्ले निकलने की अवस्था' },
  'panicle initiation': { te: 'కంకి ఏర్పడే దశ', hi: 'बाली बनने की अवस्था' },
  booting: { te: 'చిరుపొట్ట దశ', hi: 'गोभ की अवस्था' },
  milking: { te: 'పాలు పోసుకునే దశ', hi: 'दूधिया अवस्था' },
  dough: { te: 'గింజ గట్టిపడే దశ', hi: 'दाना सख्त होने की अवस्था' },
  jointing: { te: 'కణుపుల ఎదుగుదల దశ', hi: 'गांठ बनने की अवस्था' },
  heading: { te: 'కంకి బయటకు వచ్చే దశ', hi: 'बाली निकलने की अवस्था' },
  tasseling: { te: 'మగ పూత దశ', hi: 'नर फूल अवस्था' },
  silking: { te: 'ఆడ పూత దశ', hi: 'सिल्क बनने की अवस्था' },
  'grain filling': { te: 'గింజ నిండే దశ', hi: 'दाना भरने की अवस्था' },
};

export const SEASON_MAP: Record<string, { te: string; hi: string }> = {
  kharif: { te: 'ఖరీఫ్ (వర్షాకాలం)', hi: 'खरीफ (वर्षा ऋतु)' },
  rabi: { te: 'రబీ (శీతాకాలం)', hi: 'रबी (शीत ऋतु)' },
  zaid: { te: 'జైద్ (వేసవి కాలం)', hi: 'जायद (ग्रीष्म ऋतु)' },
  summer: { te: 'వేసవి కాలం', hi: 'ग्रीष्म ऋतु' },
  monsoon: { te: 'వర్షాకాలం', hi: 'वर्षा ऋतु' },
  winter: { te: 'శీతాకాలం', hi: 'शीत ऋतु' },
};

export const STATUS_MAP: Record<string, { te: string; hi: string }> = {
  working: { te: 'పనిచేస్తోంది', hi: 'सक्रिय रूप से कार्यरत' },
  idle: { te: 'సిద్ధంగా ఉంది', hi: 'तैयार अवस्था' },
  modelled: { te: 'మోడల్ ద్వారా అంచనా', hi: 'मॉडल अनुमानित' },
  measured: { te: 'క్షేత్ర కొలత', hi: 'वास्तविक माप' },
  demo: { te: 'డెమో డేటా', hi: 'डेमो डेटा' },
  'demo data': { te: 'డెమో డేటా', hi: 'डेमो डेटा' },
  pending: { te: 'వేచి ఉంది', hi: 'लंबित' },
  completed: { te: 'పూర్తయింది', hi: 'पूर्ण' },
  scheduled: { te: 'నిర్ణయించబడింది', hi: 'निर्धारित' },
  optimal: { te: 'అనుకూలం', hi: 'उत्तम' },
  depleted: { te: 'తేమ తగ్గింది', hi: 'नमी कम' },
  adequate: { te: 'సరిపడా ఉంది', hi: 'पर्याप्त' },
  healthy: { te: 'ఆరోగ్యకరం', hi: 'स्वस्थ' },
  attention: { te: 'శ్రద్ధ వహించండి', hi: 'ध्यान दें' },
  'no data yet': { te: 'డేటా లేదు', hi: 'डेटा नहीं' },
  'details to verify': { te: 'వివరాలు ధృవీకరించాలి', hi: 'विवरण सत्यापित करें' },
  'action needed': { te: 'చర్య అవసరం', hi: 'कार्रवाई आवश्यक' },
  'on schedule': { te: 'సమయానికి నడుస్తోంది', hi: 'समय पर' },
  ready: { te: 'సిద్ధం', hi: 'तैयार' },
  snoozed: { te: 'వాయిదా పడింది', hi: 'स्थगित' },
  done: { te: 'పూర్తయింది', hi: 'पूर्ण' },
  included: { te: 'చేర్చబడింది', hi: 'शामिल' },
  excluded: { te: 'మినహాయించబడింది', hi: 'बहिष्कृत' },
  'indicative, not validated': { te: 'సూచిక మాత్రమే, ధృవీకరించబడలేదు', hi: 'संकेतात्मक, सत्यापित नहीं' },
  'normal optimal agro-climatic conditions.': { te: 'సాధారణ అనుకూల వ్యవసాయ వాతావరణ పరిస్థితులు.', hi: 'सामान्य इष्टतम कृषि-जलवायु स्थितियां।' },
  'multi-agent evaluated': { te: 'ఏజెంట్లు అంచనా వేసినది', hi: 'एजेंटों द्वारा मूल्यांकित' },
  'awaiting run': { te: 'స్కాన్ కోసం వేచి ఉంది', hi: 'समीक्षा प्रतीक्षित' },
  'high heat': { te: 'తీవ్ర ఎండ', hi: 'तेज धूप' },
  'rain alert': { te: 'వర్ష హెచ్చరిక', hi: 'बारिश चेतावनी' },
  'rain likely': { te: 'వర్షం కురిసే అవకాశం', hi: 'बारिश की संभावना' },
  'dry & clear': { te: 'ఎండ & నిర్మలం', hi: 'धूप और साफ' },
  'optimal limits': { te: 'అనుకూల పరిమితులు', hi: 'इष्टतम सीमा' },
  elevated: { te: 'ఎక్కువగా ఉంది', hi: 'बढ़ा हुआ' },
  low: { te: 'తక్కువగా ఉంది', hi: 'कम' },
  active: { te: 'క్రియాశీలం', hi: 'सक्रिय' },
  unverified: { te: 'ధృవీకరించబడలేదు', hi: 'असत्यापित' },
  verified: { te: 'ధృవీకరించబడింది', hi: 'सत्यापित' },
};

export const PRIORITY_MAP: Record<string, { te: string; hi: string }> = {
  high: { te: 'అధిక ప్రాధాన్యత', hi: 'उच्च प्राथमिकता' },
  medium: { te: 'మధ్యస్థ ప్రాధాన్యత', hi: 'मध्यम प्राथमिकता' },
  low: { te: 'సాధారణ ప్రాధాన్యత', hi: 'सामान्य प्राथमिकता' },
  critical: { te: 'కీలక అత్యవసరం', hi: 'अति आवश्यक' },
  normal: { te: 'సాధారణ ప్రాధాన్యత', hi: 'सामान्य प्राथमिकता' },
};

export const TENURE_MAP: Record<string, { te: string; hi: string }> = {
  owned: { te: 'స్వంత భూమి', hi: 'स्वयं की भूमि' },
  leased: { te: 'కౌలు భూమి', hi: 'पट्टे / बटाई की भूमि' },
  mixed: { te: 'మిశ్రమ భూమి', hi: 'मिश्रित भूमि' },
};

export const SOIL_MAP: Record<string, { te: string; hi: string }> = {
  'black cotton': { te: 'నల్ల రేగడి నేల', hi: 'काली कपास मिट्टी' },
  'red loam': { te: 'ఎర్ర నేల', hi: 'लाल दोमट मिट्टी' },
  'sandy loam': { te: 'ఇసుక నేల', hi: 'बलुई दोमट मिट्टी' },
  clay: { te: 'బంకమట్టి నేల', hi: 'चिकनी मिट्टी' },
  alluvial: { te: 'ఒండ్రు నేల', hi: 'जलोढ़ मिट्टी' },
  'silt loam': { te: 'సిల్ట్ రెండు నేల', hi: 'गाद दोमट मिट्टी' },
  'clay loam': { te: 'బంకమట్టి దోమట నేల', hi: 'चिकनी दोमट मिट्टी' },
};

export const IRRIGATION_MAP: Record<string, { te: string; hi: string }> = {
  drip: { te: 'డ్రిప్ (బిందు సేద్యం)', hi: 'ड्रिप सिंचाई' },
  sprinkler: { te: 'స్ప్రింక్లర్ (తుంపర)', hi: 'फव्वारा (स्प्रिंकलर)' },
  flood: { te: 'కాలువ / వరద పారుదల', hi: 'सतही / थाला सिंचाई' },
  furrow: { te: 'సాళ్ల పారుదల', hi: 'कूड़ सिंचाई' },
  surface: { te: 'ఉపరితల పారుదల', hi: 'सतही सिंचाई' },
  rainfed: { te: 'వర్షాధారం', hi: 'वर्षा आधारित' },
};

export const CROP_MAP: Record<string, { te: string; hi: string }> = {
  cotton: { te: 'పత్తి', hi: 'कपास' },
  rice: { te: 'వరి', hi: 'धान / चावल' },
  wheat: { te: 'గోధుమ', hi: 'गेहूं' },
  maize: { te: 'మొక్కజొన్న', hi: 'मक्का' },
  chilli: { te: 'మిరప', hi: 'मिर्च' },
  tomato: { te: 'టమాట', hi: 'टमाटर' },
  groundnut: { te: 'వేరుశనగ', hi: 'मूंगफली' },
  sugarcane: { te: 'చెరకు', hi: 'गन्ना' },
  'pulses / redgram': { te: 'కందులు / పప్పుధాన్యాలు', hi: 'दालें / अरहर' },
  redgram: { te: 'కందులు', hi: 'अरहर / तूर' },
  pigeonpea: { te: 'కందులు', hi: 'अरहर' },
  chickpea: { te: 'శనగలు', hi: 'चना' },
  soybean: { te: 'సోయాబీన్', hi: 'सोयाबीन' },
  mustard: { te: 'ఆవాలు', hi: 'सरसों' },
  coffee: { te: 'కాఫీ', hi: 'कॉफ़ी' },
  jute: { te: 'జనపనార', hi: 'जूट' },
  blackgram: { te: 'మినుములు', hi: 'उड़द' },
  lentil: { te: 'మసూర్ పప్పు', hi: 'मसूर' },
  mothbeans: { te: 'బొబ్బర్లు', hi: 'मोठ' },
  mungbean: { te: 'పెసలు', hi: 'मूंग' },
  kidneybeans: { te: 'రాజ్మా', hi: 'राजमा' },
  banana: { te: 'అరటి', hi: 'केला' },
  mango: { te: 'మామిడి', hi: 'आम' },
  grapes: { te: 'ద్రాక్ష', hi: 'अंगूर' },
  watermelon: { te: 'పుచ్చకాయ', hi: 'तरबूज' },
  muskmelon: { te: 'ఖర్బూజా', hi: 'खरबूजा' },
  apple: { te: 'యాపిల్', hi: 'सेब' },
  orange: { te: 'నారింజ', hi: 'संतरा' },
  papaya: { te: 'బొప్పాయి', hi: 'पपीता' },
  coconut: { te: 'కొబ్బరి', hi: 'नारियल' },
  pomegranate: { te: 'దానిమ్మ', hi: 'अनार' },
};

export const HEALTH_COMPONENT_MAP: Record<string, { te: string; hi: string }> = {
  weather_risk: { te: 'వాతావరణ ప్రమాద అంచనా', hi: 'मौसम जोखिम मूल्यांकन' },
  'weather risk assessment': { te: 'వాతావరణ ప్రమాద అంచనా', hi: 'मौसम जोखिम मूल्यांकन' },
  disease_status: { te: 'తెగుళ్ల స్థితి', hi: 'रोग एवं कीट स्थिति' },
  'disease diagnostics': { te: 'తెగుళ్ల నిర్ధారణ', hi: 'रोग निदान' },
  water_status: { te: 'నీటి లభ్యత స్థితి', hi: 'जल उपलब्धता स्थिति' },
  'water & irrigation': { te: 'నీరు మరియు సాగునీరు', hi: 'जल एवं सिंचाई' },
  stage_appropriateness: { te: 'ఎదుగుదల దశ అనుకూలత', hi: 'वृद्धि चरण उपयुक्तता' },
  'crop phenology & holding': { te: 'పంట ఎదుగుదల దశ & కమతం', hi: 'फसल वृद्धि चरण एवं जोत' },
  economic_health: { te: 'ఆర్థిక లాభదాయకత', hi: 'आर्थिक स्वास्थ्य' },
  'yield & profit': { te: 'దిగుబడి మరియు లాభం', hi: 'उपज एवं लाभ' },
  'yield & economics': { te: 'దిగుబడి మరియు ఆర్థికం', hi: 'उपज एवं अर्थशास्त्र' },
};

export const TASK_MAP: Record<string, { te: string; hi: string }> = {
  'scout pests': { te: 'పురుగుల ఉధృతిని గమనించండి', hi: 'कीटों की निगरानी करें' },
  'check bollworm traps': { te: 'పసుపు జిగురు లేదా లింగాకర్షక బుట్టలు తనిఖీ చేయండి', hi: 'फेरोमोन ट्रैप की जांच करें' },
  'scout for bollworms': { te: 'కాయతొలుచు పురుగుల ఆనవాళ్లు పరిశీలించండి', hi: 'कपास सुंडी की निगरानी करें' },
  'irrigate field': { te: 'చేనుకు నీటి తడి అందించండి', hi: 'खेत में पानी दें' },
  'inspect field': { te: 'చేను పరిశీలన చేపట్టండి', hi: 'खेत का निरीक्षण करें' },
  'apply scheduled light irrigation': { te: 'షెడ్యూల్ ప్రకారం తేలికపాటి తడి అందించండి', hi: 'हल्की सिंचाई करें' },
  'defer scheduled irrigation (rain forecast)': { te: 'నీటి తడిని వాయిదా వేయండి (వర్ష సూచన)', hi: 'सिंचाई स्थगित करें (बारिश का पूर्वानुमान)' },
  'foliar fungal inspection': { te: 'ఆకులపై శిలీంధ్ర మచ్చలను పరిశీలించండి', hi: 'पत्तियों पर फफूंद धब्बों की जांच करें' },
  'interculture weeding & aeration': { te: 'అంతరకృషి లేదా కలుపు తీత చేపట్టండి', hi: 'निराई-गुड़ाई करें' },
  'harvest bag preparation': { te: 'పంట కోతకు శుభ్రమైన సంచులను సిద్ధం చేయండి', hi: 'फसल कटाई के साफ बोरों की तैयारी' },
  'field drainage channel clearance': { te: 'మురుగు కాలువలను శుభ్రం చేయండి', hi: 'जल निकासी नालियों की सफाई' },
  'foliar nutrient spraying': { te: 'ఆకులపై సూక్ష్మపోషకాల పిచికారీ', hi: 'पोषक तत्वों का पर्णीय छिड़काव' },
  'weed control, vegetative scouting, and soil moisture checks.': {
    te: 'కలుపు నివారణ, చేను పరిశీలన మరియు నేల తేమ తనిఖీ.',
    hi: 'खरपतवार नियंत्रण, फसल निगरानी और मिट्टी नमी की जांच।',
  },
  'inspect underside of leaves for early sucking pests and verify root zone soil moisture.': {
    te: 'ఆకుల అడుగుభాగాన రసం పీల్చే పురుగులను గమనించండి మరియు నేల తేమను పరిశీలించండి.',
    hi: 'पत्तियों के नीचे रस चूसक कीटों की जांच करें और जड़ क्षेत्र की नमी देखें।',
  },
  'favourable thermal and moisture conditions for root establishment.': {
    te: 'వేర్లు బలంగా నాటుకోవడానికి అనుకూలమైన ఉష్ణోగ్రత మరియు తేమ పరిస్థితులు.',
    hi: 'जड़ों के अच्छे विकास के लिए अनुकूल तापमान और नमी की स्थिति।',
  },
  'fixes atmospheric nitrogen into depleted soils and breaks pest cycles.': {
    te: 'నేలలో నత్రజనిని స్థిరీకరించి తెగుళ్ల చక్రాన్ని విచ్ఛిన్నం చేస్తుంది.',
    hi: 'मिट्टी में नाइट्रोजन की आपूर्ति कर कीट चक्र को तोड़ती है।',
  },
  'extreme heat stress (t >= 40°c)': { te: 'తీవ్రమైన ఎండ వేడిమి (ఉష్ణోగ్రత >= 40°C)', hi: 'अत्यधिक गर्मी का तनाव (तापमान >= 40°C)' },
  'elevated heat stress (t >= 36°c)': { te: 'ఎక్కువ వేడి ఒత్తిడి (ఉష్ణోగ్రత >= 36°C)', hi: 'बढ़ा हुआ गर्मी का तनाव (तापमान >= 36°C)' },
  'cold injury risk (t <= 12°c)': { te: 'చలి ప్రభావ ప్రమాదం (ఉష్ణోగ్రత <= 12°C)', hi: 'शीत लहर का जोखिम (तापमान <= 12°C)' },
  'high wind shear risk (wind >= 35 km/h)': { te: 'తీవ్రమైన ఈదురుగాలులు (గాలి >= 35 కి.మీ/గం)', hi: 'तेज आंधी का जोखिम (हवा >= 35 किमी/घंटा)' },
  'moderate wind exposure (wind >= 25 km/h)': { te: 'మోస్తరు గాలులు (గాలి >= 25 కి.మీ/గం)', hi: 'मध्यम हवा का प्रभाव (हवा >= 25 किमी/घंटा)' },
  'excessive heavy downpour warning (rain >= 50 mm)': { te: 'భారీ వర్ష హెచ్చరిక (వర్షం >= 50 మి.మీ)', hi: 'भारी बारिश की चेतावनी (बारिश >= 50 मिमी)' },
  'stale weather telemetry penalty (-10)': { te: 'పాత వాతావరణ సమాచారం తగ్గింపు (-10)', hi: 'पुराना मौसम डेटा पेनल्टी (-10)' },
  'soil moisture within fao-56 optimal limits.': { te: 'FAO-56 ప్రకారం నేల తేమ అనుకూల పరిమితుల్లో ఉంది.', hi: 'FAO-56 के अनुसार मिट्टी की नमी उपयुक्त सीमा में है।' },
  'severe root zone moisture depletion detected.': { te: 'వేర్ల భాగంలో తీవ్రమైన తేమ కొరత గుర్తించబడింది.', hi: 'जड़ क्षेत्र में गंभीर नमी की कमी पाई गई।' },
  'moderate root zone water stress.': { te: 'వేర్ల భాగంలో మోస్తరు నీటి ఎద్దడి.', hi: 'जड़ क्षेत्र में मध्यम जल तनाव।' },
  'optimal root zone moisture maintained.': { te: 'వేర్ల భాగంలో తగినంత తేమ నిర్వహించబడుతోంది.', hi: 'जड़ क्षेत्र में इष्टतम नमी बनी हुई है।' },
  'no active symptomatic foliar lesions detected.': { te: 'ఆకులపై ఎలాంటి క్రియాశీల తెగుళ్ల మచ్చలు లేవు.', hi: 'पत्तियों पर कोई सक्रिय रोग धब्बे नहीं पाए गए।' },
  'high humidity fungal sporulation risk elevated.': { te: 'అధిక తేమ కారణంగా శిలీంధ్ర తెగుళ్ల వ్యాప్తి ప్రమాదం ఉంది.', hi: 'अधिक नमी के कारण फफूंद जनित रोगों का खतरा अधिक है।' },
  'active fungal/pest symptoms identified.': { te: 'క్రియాశీల శిలీంధ్ర/కీటక లక్షణాలు గుర్తించబడ్డాయి.', hi: 'सक्रिय फफूंद/कीट लक्षण पहचाने गए।' },
};

/**
 * Translates a dynamic backend string into the chosen language, or falls back safely.
 */
export function translateBackendString(
  value: string | null | undefined,
  lang: string,
  fallback = ''
): string {
  if (!value) return fallback;
  if (lang === 'en') return value;

  const key = value.trim().toLowerCase();

  // 1. Direct Stage check
  if (STAGE_MAP[key]) {
    return lang === 'te' ? STAGE_MAP[key].te : STAGE_MAP[key].hi;
  }
  // 2. Direct Season check
  if (SEASON_MAP[key]) {
    return lang === 'te' ? SEASON_MAP[key].te : SEASON_MAP[key].hi;
  }
  // 3. Direct Status check
  if (STATUS_MAP[key]) {
    return lang === 'te' ? STATUS_MAP[key].te : STATUS_MAP[key].hi;
  }
  // 4. Direct Priority check
  if (PRIORITY_MAP[key]) {
    return lang === 'te' ? PRIORITY_MAP[key].te : PRIORITY_MAP[key].hi;
  }
  // 5. Direct Tenure check
  if (TENURE_MAP[key]) {
    return lang === 'te' ? TENURE_MAP[key].te : TENURE_MAP[key].hi;
  }
  // 6. Direct Soil check
  if (SOIL_MAP[key]) {
    return lang === 'te' ? SOIL_MAP[key].te : SOIL_MAP[key].hi;
  }
  // 7. Direct Irrigation check
  if (IRRIGATION_MAP[key]) {
    return lang === 'te' ? IRRIGATION_MAP[key].te : IRRIGATION_MAP[key].hi;
  }
  // 8. Direct Crop check
  if (CROP_MAP[key]) {
    return lang === 'te' ? CROP_MAP[key].te : CROP_MAP[key].hi;
  }
  // 9. Health Component check
  if (HEALTH_COMPONENT_MAP[key]) {
    return lang === 'te' ? HEALTH_COMPONENT_MAP[key].te : HEALTH_COMPONENT_MAP[key].hi;
  }
  // 10. Task and Phrases check
  if (TASK_MAP[key]) {
    return lang === 'te' ? TASK_MAP[key].te : TASK_MAP[key].hi;
  }

  // Handle semicolon or comma separated items (e.g. Health Score rationale components)
  if (value.includes(';')) {
    const parts = value.split(';').map((p) => translateBackendString(p.trim(), lang));
    return parts.join('; ');
  }

  // Partial phrase / word replacement for combined strings
  for (const [mapKey, trans] of Object.entries(TASK_MAP)) {
    if (key.includes(mapKey)) {
      return lang === 'te' ? trans.te : trans.hi;
    }
  }

  for (const [mapKey, trans] of Object.entries(STAGE_MAP)) {
    if (key.includes(mapKey)) {
      return lang === 'te' ? trans.te : trans.hi;
    }
  }

  return value;
}
