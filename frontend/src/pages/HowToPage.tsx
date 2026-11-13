import React from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Globe,
  Layers,
  CloudSun,
  Droplets,
  Leaf,
  Coins,
  Mic,
  ArrowRight,
  Video,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { useTranslation } from '../context/LanguageContext';
import {
  LeafScanIllustration,
  WateringFieldIllustration,
  WeatherIllustration,
  MoneyProfitIllustration,
} from '../components/common/FarmerIllustrations';
import { ReadAloudButton } from '../components/common/ReadAloudButton';

export const HowToPage: React.FC = () => {
  const { language } = useTranslation();

  const steps = [
    {
      step: 1,
      title: language === 'te' ? '1. మీ భాషను ఎంచుకోండి' : language === 'hi' ? '1. अपनी भाषा चुनें' : '1. Choose Your Language',
      desc: language === 'te'
        ? 'పై బార్‌లోని బటన్‌ను నొక్కి తెలుగు, హిందీ లేదా ఇంగ్లీషుకు మార్చుకోండి. అన్ని సలహాలు మరియు వాయిస్ మీ భాషలోనే అందుతాయి.'
        : language === 'hi'
        ? 'शीर्ष बार में बटन दबाकर तेलुगु, हिन्दी या अंग्रेजी चुनें। सभी सिफारिशें और ऑडियो आपकी भाषा में उपलब्ध हैं।'
        : 'Select English, Telugu (తెలుగు), or Hindi (हिन्दी) from the top bar anytime. All advisory text and voice read-aloud respect your language choice.',
      icon: Globe,
      illustration: null,
      linkTo: '/dashboard',
      linkText: 'Go to Dashboard',
    },
    {
      step: 2,
      title: language === 'te' ? '2. మీ పొలాన్ని ఎంచుకోండి లేదా నమోదు చేయండి' : language === 'hi' ? '2. अपना खेत चुनें या पंजीकृत करें' : '2. Select or Add Your Farm Parcel',
      desc: language === 'te'
        ? 'పొలం విస్తీర్ణం, సొంతమా లేదా కౌలుదా అనే వివరాలు ఇవ్వండి. దీనివల్ల నీటి బడ్జెట్ మరియు లాభాల లెక్కలు కచ్చితంగా వస్తాయి.'
        : language === 'hi'
        ? 'खेत का रकबा, खुद की जमीन है या पट्टे पर, यह दर्ज करें। इससे पानी का बजट और शुद्ध लाभ सटीक बनता है।'
        : 'Register your land holding with accurate area, soil type, and owned vs. leased tenure. This calibrates your crop water demand and lease expenses.',
      icon: Layers,
      illustration: null,
      linkTo: '/farms',
      linkText: 'Manage Farms',
    },
    {
      step: 3,
      title: language === 'te' ? '3. వాతావరణం మరియు వర్ష సూచన చూడండి' : language === 'hi' ? '3. मौसम और 7 दिनों की बारिश देखें' : '3. Check Weather & 7-Day Rainfall',
      desc: language === 'te'
        ? 'ఈరోజు ఉష్ణోగ్రత, తేమ మరియు రాబోయే వర్ష సూచనను చూడండి. FAO-56 ఆధారిత నీటి ఆవిరి డిమాండ్ (ET0) కూడా తెలుస్తుంది.'
        : language === 'hi'
        ? 'आज का तापमान, आर्द्रता और अगले 7 दिनों का बारिश पूर्वानुमान देखें। FAO-56 आधारित जल मांग (ET0) भी दिखाई देगी।'
        : 'View live temperature, rainfall chances, and reference evapotranspiration (ET0) for your village to prepare your farm operations.',
      icon: CloudSun,
      illustration: <WeatherIllustration size={72} />,
      linkTo: '/setup',
      linkText: 'Check Weather',
    },
    {
      step: 4,
      title: language === 'te' ? '4. పంట నీటి బడ్జెట్ మరియు నీటి తడులు' : language === 'hi' ? '4. फसल जल बजट और सिंचाई सलाह' : '4. Check Crop Water Budget',
      desc: language === 'te'
        ? 'నేలలో తేమ ఎంత ఉంది, ఎప్పుడు నీరు పెట్టాలి, వర్షం వస్తే తడి ఆపవచ్చా అనేది స్పష్టంగా తెలుస్తుంది.'
        : language === 'hi'
        ? 'मिट्टी में नमी का स्तर, कब पानी देना है और बारिश आने पर सिंचाई टालने की स्पष्ट सलाह प्राप्त करें।'
        : 'Compute root zone soil moisture depletion using FAO-56 agro-meteorology. Know exactly when to irrigate and when rain allows skipping a watering.',
      icon: Droplets,
      illustration: <WateringFieldIllustration size={72} />,
      linkTo: '/irrigation',
      linkText: 'View Water Budget',
    },
    {
      step: 5,
      title: language === 'te' ? '5. ఆకు ఫోటో తీసి తెగులు గుర్తించండి' : language === 'hi' ? '5. पत्ते की फोटो खींचकर रोग पहचानें' : '5. Scan Leaf for Disease Diagnosis',
      desc: language === 'te'
        ? 'తెగులు సోకిన ఆకు ఫోటోను అప్‌లోడ్ చేయండి. AI దానిని విశ్లేషించి తెగులు పేరు, నమ్మక శాతము మరియు సేంద్రీయ/రసాయన నివారణ చర్యలు చూపుతుంది.'
        : language === 'hi'
        ? 'प्रभावित पत्ते की फोटो अपलोड करें। AI रोग की पहचान, आत्मविश्वास प्रतिशत और जैविक/रासायनिक उपचार उपाय तुरंत सुझाता है।'
        : 'Take or upload a leaf photo to diagnose crop diseases with clear confidence percentages, honest limitations, and IPM-compliant treatments.',
      icon: Leaf,
      illustration: <LeafScanIllustration size={72} />,
      linkTo: '/disease',
      linkText: 'Diagnose Leaf',
    },
    {
      step: 6,
      title: language === 'te' ? '6. ఖర్చులు మరియు లాభాల లెక్కలు (What-If)' : language === 'hi' ? '6. खर्च और शुद्ध मुनाफा सिम्युलेटर' : '6. Calculate Profit & What-If Scenarios',
      desc: language === 'te'
        ? 'విత్తనాలు, ఎరువులు మరియు కౌలు ఖర్చులు లెక్కించండి. దిగుబడి మరియు మండి ధర మారితే లాభం ఎంత మారుతుందో స్లైడర్‌తో చూడండి.'
        : language === 'hi'
        ? 'बीज, खाद और पट्टा खर्च जोड़ें। उत्पादन और मंडी भाव बदलने पर शुद्ध लाभ पर क्या असर पड़ेगा, स्लाइडर से देखें।'
        : 'Track full operating expenses, compare alternative crops, and use the What-If slider to simulate profit across different yield and price points.',
      icon: Coins,
      illustration: <MoneyProfitIllustration size={72} />,
      linkTo: '/economics',
      linkText: 'Explore Economics',
    },
    {
      step: 7,
      title: language === 'te' ? '7. వాయిస్ అసిస్టెంట్‌ని మాట్లాడి అడగండి' : language === 'hi' ? '7. बोलकर वॉइस असिस्टेंट से पूछें' : '7. Ask the Multilingual Voice Assistant',
      desc: language === 'te'
        ? 'మైక్రోఫోన్ బటన్ నొక్కి మీ సొంత మాటల్లో తెలుగులో అడగండి. "ఈరోజు వర్షం పడుతుందా?", "పత్తి ధర ఎంత ఉంది?" అని అడగవచ్చు.'
        : language === 'hi'
        ? 'माइक का बटन दबाएं और हिन्दी में बोलें: "क्या आज बारिश होगी?", "कपास का मंडी भाव क्या है?"। सटीक जवाब तुरंत मिलेगा।'
        : 'Tap the Voice button anytime to ask questions aloud in Telugu, Hindi, or English. Receive honest, grounded answers linked to tools.',
      icon: Mic,
      illustration: null,
      linkTo: '/dashboard',
      linkText: 'Open Dashboard',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <PageHeader
        icon={HelpCircle}
        title={language === 'te' ? 'అగ్రిసేజ్ ఎలా వాడాలి?' : language === 'hi' ? 'एग्रीसेज का उपयोग कैसे करें?' : 'How to Use AgriSage AI'}
        purpose={
          language === 'te'
            ? 'రైతుల కోసం సులభమైన 7-దశల సమగ్ర మార్గదర్శిని'
            : language === 'hi'
            ? 'किसानों के लिए 7 चरणों वाली सरल और स्पष्ट उपयोग मार्गदर्शिका'
            : 'A plain-language 7-step guide designed for farmers to get immediate value from every screen.'
        }
        actions={
          <Link
            to="/watch"
            className="min-h-[48px] px-5 py-2.5 rounded-xl font-bold bg-[#DA9A4C] text-[#0E241B] hover:bg-[#F5C989] shadow-sm flex items-center gap-2 transition-all"
          >
            <Video className="w-4 h-4" />
            <span>{language === 'te' ? 'వీడియో చూడండి' : language === 'hi' ? 'वीडियो देखें' : 'Watch Video Guide'}</span>
          </Link>
        }
      />

      {/* Guide Cards */}
      <div className="grid grid-cols-1 gap-5 max-w-4xl mx-auto">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.step}
              className="bg-white rounded-2xl border border-[#7A553A]/20 shadow-sm p-5 sm:p-6 hover:border-[#183D2E]/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-[#183D2E] text-[#DA9A4C] flex items-center justify-center font-bold shrink-0 shadow-sm">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg sm:text-xl font-bold text-[#183D2E]">
                      {s.title}
                    </h2>
                  </div>
                  <p className="text-base text-[#4E5F57] leading-relaxed">
                    {s.desc}
                  </p>
                  <div className="pt-2 flex items-center gap-3">
                    <ReadAloudButton text={`${s.title}. ${s.desc}`} />
                    <Link
                      to={s.linkTo}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-[#183D2E] hover:text-[#265C46] underline underline-offset-4"
                    >
                      <span>{s.linkText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {s.illustration && (
                <div className="shrink-0 self-center sm:self-auto hidden sm:block">
                  {s.illustration}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
