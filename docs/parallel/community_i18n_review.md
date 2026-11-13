# Community Module — Internationalization (i18n) Review

**AgriSage AI | Languages Supported: English (`en`), Telugu (`te`), Hindi (`hi`)**

## 1. Key Terminology Mappings

| English Term | Telugu (`te`) | Hindi (`hi`) | Review Status |
|---|---|---|---|
| Community & Outbreaks | రైతు సంఘం & మ్యాప్ | समुदाय और प्रकोप | Verified in UI |
| Farmer Groups | స్థానిక రైతు సమూహాలు | स्थानीय किसान समूह | Verified in UI |
| Nearby Farmers (Village Only) | సమీప రైతులు (గ్రామ స్థాయి మాత్రమే) | निकटवर्ती किसान (केवल गाँव स्तर) | Verified in UI |
| Hidden until mutual consent | పరస్పర సమ్మతి వరకు దాచబడింది | आपसी सहमति तक छिपा हुआ | Verified in UI |
| Phone Number Shared | ఫోన్ నంబర్ కనిపిస్తుంది | फोन नंबर साझा किया गया | Verified in UI |
| Pooled Transport | ఉమ్మడి రవాణా & సామూహిక కొనుగోళ్లు | संयुक्त परिवहन एवं थोक खरीद | Verified in UI |
| Cost-Split Calculator | స్పష్టమైన సరుకు రవాణా ఖర్చుల కాలిక్యులేటర్ | पारदर्शी माल ढुलाई लागत कैलकुलेटर | Verified in UI |
| Weight Share Ratio | బరువు వాటా (క్వింటాళ్ళ నిష్పత్తిలో) | वजन का हिस्सा (क्विंटल अनुपात) | Verified in UI |
| Ton-Kilometer Ratio | టన్ను-కిలోమీటర్ (బరువు × దూరం) | टन-किलोमीटर (वजन × दूरी) | Verified in UI |
| Farm Machinery Hub | వ్యవసాయ యంత్రాల కేంద్రం & మార్గదర్శి | कृषि मशीनरी केंद्र एवं गाइड | Verified in UI |
| Disease Outbreak Map | గ్రామ స్థాయి పంట వ్యాధుల వ్యాప్తి మ్యాప్ | गाँव स्तरीय फसल रोग प्रकोप नक्शा | Verified in UI |
| Privacy Rule: Min 3 Reports | గోప్యతా నియమం: కనీసం 3 నివేదికలు | गोपनीयता नियम: न्यूनतम 3 रिपोर्ट | Verified in UI |
| District Officer View | మండల / జిల్లా వ్యవసాయ అధికారి వీక్షణ | ब्लॉक / जिला कृषि अधिकारी दृश्य | Verified in UI |
| Demo Data Banner | డెమో డేటా: ఇక్కడ చూపబడిన సమాచారం నమూనా డేటా | डेमो डेटा: यहाँ दिखाया गया डेटा सिमुलेटेड है | Verified in UI |

## 2. Integrity Verification
- All keys nested under `community.*` in [en.json](file:///c:/work/agri-community/frontend/src/i18n/en.json), [te.json](file:///c:/work/agri-community/frontend/src/i18n/te.json), and [hi.json](file:///c:/work/agri-community/frontend/src/i18n/hi.json).
- Zero missing keys or translation fallback errors reported during build.
