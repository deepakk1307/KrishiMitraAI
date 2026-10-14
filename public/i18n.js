/**
 * KrishiMitra AI - Centralized Multilingual i18n Translation System
 * Supported Languages: English ('en' / 'English') and Hindi ('hi' / 'Hindi')
 */

const I18N_DICTIONARY = {
  en: {
    // Brand & App
    appName: "KrishiMitra AI",
    appTagline: "Intelligent Farming Companion",
    bilingualSubtitle: "Bilingual Agro-Intelligence",
    demoAccount: "Demo Account",
    termsNotice: "By continuing, you agree to our Terms of Service.",
    
    // Navigation
    navHome: "Home",
    navCrop: "Crop",
    navMandi: "Mandi",
    navSchemes: "Schemes",
    
    // Header & Profile Menu
    language: "Language",
    preferredLanguage: "Preferred Language",
    selectLanguage: "Select Language",
    langEnglish: "English",
    langHindi: "हिन्दी",
    profileSettings: "Farmer Profile & Settings",
    switchLanguage: "Switch Language",
    currentLanguage: "Current: English",
    langChangeSuccess: "Language switched to English successfully.",
    saveChanges: "Save Changes",
    close: "Close",
    logout: "Logout",
    
    // Landing Page
    heroTitle: "Your intelligent farming companion.",
    heroSubtitle: "Get personalized crop, weather, market and government-scheme guidance powered by AI.",
    getStarted: "Get Started",
    loginDemo: "Login (Demo Account)",
    
    // Registration Step 1
    step1Of2: "Step 1 of 2",
    step1Title: "Let’s understand you",
    step1Subtitle: "Provide your basic details to personalize your experience.",
    labelName: "Name",
    placeholderName: "Enter your full name",
    labelState: "State",
    selectState: "Select your state",
    labelDistrict: "District",
    selectDistrict: "Select your district",
    btnContinue: "Continue",
    
    // Registration Step 2
    step2Of2: "Step 2 of 2",
    step2Title: "Let’s understand your farm",
    step2Subtitle: "Tell us a bit about your land to get personalized recommendations.",
    farmDetails: "Farm Details",
    labelLandSize: "Land Size",
    placeholderLandSize: "e.g., 2.5",
    landSizeHint: "Enter total cultivable area.",
    unitAcres: "Acres",
    unitHectares: "Hectares",
    unitBigha: "Bigha",
    labelMainCrop: "Main Crop",
    selectCrop: "Select primary crop",
    cropWheat: "Wheat",
    cropRice: "Rice (Paddy)",
    cropMustard: "Mustard",
    cropCotton: "Cotton",
    cropSugarcane: "Sugarcane",
    cropMaize: "Maize",
    cropGram: "Gram (Chana)",
    cropSoybean: "Soybean",
    labelSoilType: "Soil Type",
    optional: "(Optional)",
    soilAlluvial: "Alluvial",
    soilBlack: "Black Soil",
    soilRed: "Red Soil",
    soilSandy: "Sandy Loam",
    btnCompleteSetup: "Complete Setup",
    
    // Home Dashboard
    greetingMorning: "Good morning",
    greetingFarmer: "Namaste",
    homeAiCardTitle: "KrishiMitra AI",
    homeAiPrompt: "What help do you need today?",
    chipWeather: "🌦️ Weather",
    chipCrop: "🌱 Crop Problem",
    chipMandi: "📈 Mandi Prices",
    chipSchemes: "🏛️ Govt Schemes",
    placeholderSearch: "Ask me anything...",
    todaysUpdates: "Today’s Farm Updates",
    viewAll: "View All",
    weatherUpdateTitle: "Rain expected tomorrow",
    cropUpdateTitle: "Crop Check needed",
    mandiUpdateTitle: "APMC Mandi Rates",
    schemesUpdateTitle: "Verified schemes found",
    badgeNew: "NEW",
    
    // Weather Advisory
    weatherTitle: "Weather Advisory",
    weatherLoading: "Loading live weather forecast from IMD...",
    conditionMostlyCloudy: "Mostly Cloudy",
    conditionRainy: "Rainy",
    conditionSunny: "Sunny",
    conditionThunderstorm: "Thunderstorm",
    labelRain: "Rain",
    labelHumidity: "Humidity",
    aiWeatherTitle: "AI Farm Advisory",
    advisoryIrrigation: "Irrigation",
    advisoryCropProtection: "Crop Protection",
    advisoryDiseaseAlert: "Disease Risk Alert",
    forecast5Day: "5-Day Forecast",
    dayToday: "Today",
    dayTomorrow: "Tomorrow",
    dayWed: "Wed",
    dayThu: "Thu",
    dayFri: "Fri",
    daySat: "Sat",
    daySun: "Sun",
    btnAskWeatherAI: "Ask AI about this forecast",
    
    // Mandi Intelligence
    mandiTitle: "Mandi Intelligence",
    mandiLoading: "Fetching live APMC Agmarknet mandi prices...",
    mspLabel: "MSP Reference",
    perQuintal: "/ quintal",
    perQtl: "/ qtl",
    benchmarkPriceTitle: "Current APMC Benchmark Price",
    aboveMsp: "Above MSP Benchmark",
    atMsp: "At Government MSP",
    verifiedSource: "Verified Source",
    aiMandiInsightTitle: "AI Market Insight",
    btnAskSellingStrategy: "Ask AI Selling Strategy",
    nearbyMandis: "Nearby Mandis",
    compareAll: "Compare All",
    topPick: "Top Pick",
    btnCompareMandis: "Compare Mandis",
    
    // Scheme Finder
    schemesTitle: "Scheme Finder",
    schemesSubtitle: "Find government schemes verified for your farm profile.",
    schemesLoading: "Searching verified government schemes via RAG store...",
    profileSummary: "Profile Summary",
    editProfile: "Edit",
    primaryCrop: "Primary Crop",
    aiRecommendedForYou: "AI Recommended for You",
    whyItFits: "Why it fits:",
    btnApplyPortal: "Apply / Official Portal",
    btnRequiredDocs: "Required Docs",
    schemeSourceNote: "Source: Verified Central & State Portals (RAG Grounded)",
    
    // Crop Advisory & Doctor
    cropTitle: "Crop Advisory",
    cropSubtitle: "Ask questions about your crop or upload a photo for AI-assisted analysis.",
    cropIdentifyHelp: "Need help identifying a crop disease or pest?",
    btnOpenCamera: "Open Camera",
    btnOpenGallery: "Open Gallery",
    btnAnalyzeCrop: "Analyze Crop",
    btnReplaceImage: "Replace",
    btnRemoveImage: "Remove",
    cropAiGuidancePrompt: "Please take a clear photo of your crop or choose one from your gallery so I can analyze the pest or disease.",
    fileTooLarge: "Image size must be less than 10 MB.",
    invalidFileType: "Please select a valid image format (JPEG, PNG, WebP).",
    cameraPermissionDenied: "Camera permission was denied. Please allow camera access.",
    btnCapturePhoto: "Capture Photo",
    btnCancelCamera: "Cancel",
    placeholderCropQuestion: "What is wrong with my crop?",
    orDivider: "OR",
    btnAskVoice: "Ask using voice",
    uploadCardTitle: "Upload Crop Photo",
    uploadCardSubtitle: "Take a photo or select from gallery",
    btnSelectPhoto: "Select Crop Photo",
    sampleTestsTitle: "Or try standard crop test samples:",
    sampleWheatTitle: "🌾 Wheat Leaf Rust",
    sampleWheatDesc: "Yellow pustules sample",
    sampleTomatoTitle: "🍅 Tomato Blight",
    sampleTomatoDesc: "Concentric leaf spots",
    analyzingCrop: "Analyzing crop photo with Gemini Vision...",
    possibleIssue: "Possible Issue:",
    confidenceLabel: "Confidence:",
    confidenceHigh: "High",
    confidenceModerate: "Moderate",
    whatAiObserved: "What the AI observed",
    whatYouCanDo: "What you can do",
    prevention: "Prevention",
    placeholderCropFollowup: "Ask a follow-up question...",
    cropDisclaimer: "This is an AI-assisted assessment based on visual indicators and should be verified with your local Agriculture Extension Officer before chemical application.",
    
    // AI Assistant Drawer
    assistantTitle: "KrishiMitra AI Assistant",
    assistantWelcome: "Namaste! I am KrishiMitra AI. You can ask me about today's weather, crop diseases, Agmarknet mandi rates, or eligible government schemes.",
    placeholderAssistantInput: "Ask KrishiMitra anything...",
    thinking: "Thinking...",
    navigatingTo: "Navigating to",
    btnOpenView: "Open View",
    voiceListening: "Listening... speak now",
    voiceNotSupported: "Voice input is not supported in this browser. Please type your query.",
    assistantError: "Unable to reach assistant orchestrator.",
    
    // Common Dialog & Actions
    btnBack: "Back",
    btnCancel: "Cancel",
    btnSubmit: "Submit",
    btnSend: "Send",
    success: "Success",
    error: "Error"
  },

  hi: {
    // Brand & App
    appName: "कृषि मित्र एआई",
    appTagline: "स्मार्ट किसान साथी",
    bilingualSubtitle: "द्विभाषी कृषि बुद्धिमत्ता",
    demoAccount: "डेमो खाता",
    termsNotice: "आगे बढ़कर, आप हमारी सेवा की शर्तों से सहमत होते हैं।",
    
    // Navigation
    navHome: "होम",
    navCrop: "फसल",
    navMandi: "मंडी",
    navSchemes: "योजनाएं",
    
    // Header & Profile Menu
    language: "भाषा",
    preferredLanguage: "पसंदीदा भाषा",
    selectLanguage: "भाषा चुनें",
    langEnglish: "English",
    langHindi: "हिन्दी",
    profileSettings: "किसान प्रोफ़ाइल व भाषा सेटिंग्स",
    switchLanguage: "भाषा बदलें",
    currentLanguage: "वर्तमान: हिन्दी",
    langChangeSuccess: "भाषा सफलतापूर्वक हिन्दी में बदल दी गई है।",
    saveChanges: "बदलाव सहेजें",
    close: "बंद करें",
    logout: "लॉगआउट",
    
    // Landing Page
    heroTitle: "आपका बुद्धिमान खेती साथी।",
    heroSubtitle: "एआई द्वारा संचालित व्यक्तिगत फसल, मौसम, मंडी भाव और सरकारी योजना मार्गदर्शन प्राप्त करें।",
    getStarted: "शुरू करें",
    loginDemo: "लॉगिन (डेमो खाता)",
    
    // Registration Step 1
    step1Of2: "चरण 1 / 2",
    step1Title: "आइए आपको जानें",
    step1Subtitle: "अपने अनुभव को अनुकूलित करने के लिए अपना बुनियादी विवरण प्रदान करें।",
    labelName: "नाम",
    placeholderName: "अपना पूरा नाम दर्ज करें",
    labelState: "राज्य",
    selectState: "अपना राज्य चुनें",
    labelDistrict: "ज़िला",
    selectDistrict: "अपना ज़िला चुनें",
    btnContinue: "आगे बढ़ें",
    
    // Registration Step 2
    step2Of2: "चरण 2 / 2",
    step2Title: "आइए अपने खेत को समझें",
    step2Subtitle: "व्यक्तिगत सिफारिशें प्राप्त करने के लिए अपनी जमीन की जानकारी दें।",
    farmDetails: "खेत की जानकारी",
    labelLandSize: "जमीन का आकार",
    placeholderLandSize: "उदा. 2.5",
    landSizeHint: "कुल कृषि योग्य क्षेत्रफल दर्ज करें।",
    unitAcres: "एकड़",
    unitHectares: "हेक्टेयर",
    unitBigha: "बीघा",
    labelMainCrop: "मुख्य फसल",
    selectCrop: "मुख्य फसल चुनें",
    cropWheat: "गेहूँ",
    cropRice: "धान (चावल)",
    cropMustard: "सरसों",
    cropCotton: "कपास",
    cropSugarcane: "गन्ना",
    cropMaize: "मक्का",
    cropGram: "चना",
    cropSoybean: "सोयाबीन",
    labelSoilType: "मिट्टी का प्रकार",
    optional: "(वैकल्पिक)",
    soilAlluvial: "जलोढ़ मिट्टी",
    soilBlack: "काली मिट्टी",
    soilRed: "लाल मिट्टी",
    soilSandy: "बलुई दोमट",
    btnCompleteSetup: "पंजीकरण पूरा करें",
    
    // Home Dashboard
    greetingMorning: "शुभ प्रभात",
    greetingFarmer: "नमस्ते",
    homeAiCardTitle: "कृषि मित्र एआई",
    homeAiPrompt: "आज आपको क्या सहायता चाहिए?",
    chipWeather: "🌦️ मौसम",
    chipCrop: "🌱 फसल रोग",
    chipMandi: "📈 मंडी भाव",
    chipSchemes: "🏛️ सरकारी योजनाएं",
    placeholderSearch: "मुझसे कुछ भी पूछें...",
    todaysUpdates: "आज के कृषि अपडेट",
    viewAll: "सभी देखें",
    weatherUpdateTitle: "कल बारिश की संभावना",
    cropUpdateTitle: "फसल जांच आवश्यक",
    mandiUpdateTitle: "मंडी में फसल के ताजा भाव",
    schemesUpdateTitle: "सत्यापित योजनाएं उपलब्ध",
    badgeNew: "नया",
    
    // Weather Advisory
    weatherTitle: "मौसम सलाह",
    weatherLoading: "मौसम विभाग (IMD) से लाइव पूर्वानुमान प्राप्त किया जा रहा है...",
    conditionMostlyCloudy: "मुख्यतः बादल",
    conditionRainy: "बारिश",
    conditionSunny: "धूप / साफ़",
    conditionThunderstorm: "तूफान व भारी वर्षा",
    labelRain: "बारिश",
    labelHumidity: "नमी",
    aiWeatherTitle: "एआई कृषि मौसम सलाह",
    advisoryIrrigation: "सिंचाई सलाह",
    advisoryCropProtection: "फसल सुरक्षा",
    advisoryDiseaseAlert: "रोग जोखिम चेतावनी",
    forecast5Day: "5-दिवसीय मौसम पूर्वानुमान",
    dayToday: "आज",
    dayTomorrow: "कल",
    dayWed: "बुध",
    dayThu: "गुरु",
    dayFri: "शुक्र",
    daySat: "शनि",
    daySun: "रवि",
    btnAskWeatherAI: "इस पूर्वानुमान के बारे में एआई से पूछें",
    
    // Mandi Intelligence
    mandiTitle: "मंडी भाव विश्लेषण",
    mandiLoading: "एगमार्कनेट से लाइव एपीएमसी मंडी भाव लोड हो रहे हैं...",
    mspLabel: "सरकारी समर्थन मूल्य (MSP)",
    perQuintal: "/ क्विंटल",
    perQtl: "/ क्विंटल",
    benchmarkPriceTitle: "वर्तमान एपीएमसी बेंचमार्क भाव",
    aboveMsp: "सरकारी एमएसपी से अधिक",
    atMsp: "सरकारी एमएसपी स्तर पर",
    verifiedSource: "सत्यापित स्रोत",
    aiMandiInsightTitle: "एआई मंडी विश्लेषण व सलाह",
    btnAskSellingStrategy: "एआई से बिक्री रणनीति पूछें",
    nearbyMandis: "निकटतम मंडियां",
    compareAll: "सभी की तुलना करें",
    topPick: "सर्वोत्तम विकल्प",
    btnCompareMandis: "मंडियों की तुलना करें",
    
    // Scheme Finder
    schemesTitle: "सरकारी योजना खोजक",
    schemesSubtitle: "अपने खेत और फसल के अनुसार पात्र सरकारी योजनाएं खोजें।",
    schemesLoading: "सत्यापित सरकारी योजनाओं का डेटाबेस खोजा जा रहा है...",
    profileSummary: "किसान प्रोफ़ाइल सारांश",
    editProfile: "संपादित करें",
    primaryCrop: "मुख्य फसल",
    aiRecommendedForYou: "आपके लिए एआई अनुशंसित योजनाएं",
    whyItFits: "यह आपके लिए क्यों उपयुक्त है:",
    btnApplyPortal: "आवेदन / आधिकारिक पोर्टल",
    btnRequiredDocs: "आवश्यक दस्तावेज",
    schemeSourceNote: "स्रोत: सत्यापित केंद्रीय व राज्य पोर्टल (RAG द्वारा प्रमाणित)",
    
    // Crop Advisory & Doctor
    cropTitle: "फसल परामर्श व रोग डॉक्टर",
    cropSubtitle: "अपनी फसल से जुड़े सवाल पूछें या एआई विश्लेषण के लिए तस्वीर अपलोड करें।",
    cropIdentifyHelp: "फसल रोग या कीट की पहचान में सहायता चाहिए?",
    btnOpenCamera: "कैमरा खोलें",
    btnOpenGallery: "गैलरी से चुनें",
    btnAnalyzeCrop: "फसल का विश्लेषण करें",
    btnReplaceImage: "बदलें",
    btnRemoveImage: "हटाएं",
    cropAiGuidancePrompt: "कृपया अपनी फसल की एक स्पष्ट फोटो खींचें या गैलरी से चुनें ताकि मैं कीट या रोग का विश्लेषण कर सकूँ।",
    fileTooLarge: "तस्वीर का आकार 10 MB से कम होना चाहिए।",
    invalidFileType: "कृपया केवल समर्थित छवि प्रारूप (JPEG, PNG, WebP) ही चुनें।",
    cameraPermissionDenied: "कैमरा अनुमति नहीं मिली। कृपया कैमरा अनुमति दें।",
    btnCapturePhoto: "फोटो खींचें",
    btnCancelCamera: "रद्द करें",
    placeholderCropQuestion: "मेरी फसल में क्या समस्या है?",
    orDivider: "या",
    btnAskVoice: "आवाज से पूछें",
    uploadCardTitle: "फसल की फोटो अपलोड करें",
    uploadCardSubtitle: "फोटो खींचें या गैलरी से चुनें",
    btnSelectPhoto: "फसल की फोटो चुनें",
    sampleTestsTitle: "या परीक्षण के लिए नमूना चुनें:",
    sampleWheatTitle: "🌾 गेहूँ का पीला रतुआ",
    sampleWheatDesc: "पत्ती पर पीली धारियां",
    sampleTomatoTitle: "🍅 टमाटर का झुलसा रोग",
    sampleTomatoDesc: "पत्तियों पर गोलाकार धब्बे",
    analyzingCrop: "जेमिनी विजन द्वारा फसल की फोटो का विश्लेषण किया जा रहा है...",
    possibleIssue: "संभावित समस्या:",
    confidenceLabel: "सटीकता:",
    confidenceHigh: "उच्च",
    confidenceModerate: "मध्यम",
    whatAiObserved: "एआई द्वारा देखे गए लक्षण",
    whatYouCanDo: "उपचार व त्वरित समाधान",
    prevention: "भविष्य में रोकथाम",
    placeholderCropFollowup: "कोई अन्य सवाल पूछें...",
    cropDisclaimer: "यह केवल दृश्य डेटा पर आधारित एआई-सहायक मूल्यांकन है। किसी भी रासायनिक छिड़काव से पहले अपने नजदीकी कृषि विस्तार अधिकारी या केवीके से परामर्श लें।",
    
    // AI Assistant Drawer
    assistantTitle: "कृषि मित्र एआई सहायक",
    assistantWelcome: "नमस्ते! मैं आपका कृषि मित्र एआई सहायक हूँ। आप मुझसे आज के मौसम, फसल रोग, मंडी भाव या सरकारी योजनाओं के बारे में पूछ सकते हैं।",
    placeholderAssistantInput: "कृषि मित्र से कुछ भी पूछें...",
    thinking: "सोच रहे हैं...",
    navigatingTo: "पेज पर ले जाया जा रहा है:",
    btnOpenView: "पेज खोलें",
    voiceListening: "सुन रहे हैं... अब बोलें",
    voiceNotSupported: "इस ब्राउज़र में वॉयस इनपुट समर्थित नहीं है। कृपया लिखकर पूछें।",
    assistantError: "एआई सहायक से संपर्क नहीं हो पा रहा है।",
    
    // Common Dialog & Actions
    btnBack: "पीछे",
    btnCancel: "रद्द करें",
    btnSubmit: "जमा करें",
    btnSend: "भेजें",
    success: "सफलता",
    error: "त्रुटि"
  }
};

/**
 * Normalizes language string to 'en' or 'hi'
 */
function normalizeLang(lang) {
  if (!lang) return 'hi';
  const l = String(lang).toLowerCase().trim();
  if (l === 'english' || l === 'en' || l === 'en-in') return 'en';
  return 'hi';
}

/**
 * Returns translated string for given key in active language
 */
function t(key, lang = null) {
  const currentLang = normalizeLang(lang || window.__CURRENT_APP_LANG || 'hi');
  const dict = I18N_DICTIONARY[currentLang] || I18N_DICTIONARY.hi;
  if (dict && dict[key] !== undefined) {
    return dict[key];
  }
  // Fallback to English if missing in target
  if (I18N_DICTIONARY.en && I18N_DICTIONARY.en[key] !== undefined) {
    return I18N_DICTIONARY.en[key];
  }
  return key;
}

/**
 * Returns crop name translated
 */
function translateCrop(cropName, lang = null) {
  const currentLang = normalizeLang(lang || window.__CURRENT_APP_LANG || 'hi');
  const mapping = {
    'Wheat': { en: 'Wheat', hi: 'गेहूँ' },
    'Rice (Paddy)': { en: 'Rice (Paddy)', hi: 'धान (चावल)' },
    'Rice': { en: 'Rice', hi: 'धान' },
    'Mustard': { en: 'Mustard', hi: 'सरसों' },
    'Cotton': { en: 'Cotton', hi: 'कपास' },
    'Sugarcane': { en: 'Sugarcane', hi: 'गन्ना' },
    'Maize': { en: 'Maize', hi: 'मक्का' },
    'Gram': { en: 'Gram (Chana)', hi: 'चना' },
    'Soybean': { en: 'Soybean', hi: 'सोयाबीन' }
  };
  const match = mapping[cropName];
  if (match) return match[currentLang] || match.en;
  return cropName;
}

/**
 * Returns land unit translated
 */
function translateUnit(unitName, lang = null) {
  const currentLang = normalizeLang(lang || window.__CURRENT_APP_LANG || 'hi');
  const mapping = {
    'acres': { en: 'acres', hi: 'एकड़' },
    'Acres': { en: 'Acres', hi: 'एकड़' },
    'Acre': { en: 'Acre', hi: 'एकड़' },
    'hectares': { en: 'hectares', hi: 'हेक्टेयर' },
    'Hectares': { en: 'Hectares', hi: 'हेक्टेयर' },
    'bigha': { en: 'bigha', hi: 'बीघा' },
    'Bigha': { en: 'Bigha', hi: 'बीघा' }
  };
  const match = mapping[unitName];
  if (match) return match[currentLang] || match.en;
  return unitName;
}

/**
 * Returns soil type translated
 */
function translateSoil(soil, lang = null) {
  const currentLang = normalizeLang(lang || window.__CURRENT_APP_LANG || 'hi');
  const mapping = {
    'Alluvial': { en: 'Alluvial', hi: 'जलोढ़ मिट्टी' },
    'Black Soil': { en: 'Black Soil', hi: 'काली मिट्टी' },
    'Red Soil': { en: 'Red Soil', hi: 'लाल मिट्टी' },
    'Sandy Loam': { en: 'Sandy Loam', hi: 'बलुई दोमट' }
  };
  const match = mapping[soil];
  if (match) return match[currentLang] || match.en;
  return soil;
}

// Global expose
window.I18N_DICTIONARY = I18N_DICTIONARY;
window.normalizeLang = normalizeLang;
window.t = t;
window.translateCrop = translateCrop;
window.translateUnit = translateUnit;
window.translateSoil = translateSoil;
