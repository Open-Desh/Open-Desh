import { HelpArticle, HelpCategoryInfo } from "../types.ts";

export const HELP_CATEGORIES: HelpCategoryInfo[] = [
  {
    id: "getting_started",
    label: "Getting Started",
    hindiLabel: "शुरुआत करें",
    description: "Complete guide to joining Open Desh, setting up your profile, and taking your first civic action.",
    descriptionHindi: "Open Desh से जुड़ने, अकाउंट सेटअप करने और पहले कदम उठाने की पूरी गाइड।",
    icon: "Rocket",
    color: "from-blue-500 to-indigo-600",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "reports_and_complaints",
    label: "Reports & Complaints",
    hindiLabel: "शिकायतें व रिपोर्टिंग",
    description: "How to report roads, water, electricity, corruption, and garbage issues with photo evidence and live tracking.",
    descriptionHindi: "सड़क, पानी, बिजली, भ्रष्टाचार और कचरे की समस्या दर्ज करने व लाइव ट्रैक करने की विधि।",
    icon: "AlertTriangle",
    color: "from-rose-500 to-amber-600",
    badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    id: "government_and_officials",
    label: "Government & Officials",
    hindiLabel: "विभाग व जन प्रतिनिधि",
    description: "Department jurisdiction routing, elected leader scorecards, and the 4 official verification badges.",
    descriptionHindi: "सरकारी विभागों के अधिकार क्षेत्र, विधायकों/सांसदों के रिपोर्ट कार्ड और 4 आधिकारिक सत्यापन बैज।",
    icon: "Landmark",
    color: "from-purple-500 to-indigo-600",
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    id: "ratings_and_reviews",
    label: "Ratings & Reviews",
    hindiLabel: "रेटिंग व समीक्षा",
    description: "How to rate elected representatives on the 5-pillar score, write verified reviews, and view public sentiment.",
    descriptionHindi: "जन प्रतिनिधियों को निष्पक्ष 5-पिलर स्कोर देने, समीक्षा लिखने और जनमत जांचने की प्रणाली।",
    icon: "Star",
    color: "from-amber-500 to-yellow-600",
    badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
  },
  {
    id: "public_budget",
    label: "Public Budget",
    hindiLabel: "सार्वजनिक बजट व व्यय",
    description: "Transparent per-capita analysis of Union, State, District, and Gram Panchayat tax revenues and expenditures.",
    descriptionHindi: "केंद्रीय बजट, राज्य बजट, जिला व ग्राम पंचायत स्तर पर टैक्स के पैसे का पारदर्शी विश्लेषण।",
    icon: "IndianRupee",
    color: "from-emerald-500 to-teal-600",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: "account_and_privacy",
    label: "Account & Privacy",
    hindiLabel: "खाता व गोपनीयता",
    description: "Profile management, secure authentication, privacy controls, and citizen data protection.",
    descriptionHindi: "प्रोफाइल प्रबंधन, पासवर्ड/लॉगिन सुरक्षा, गोपनीयता सेटिंग्स और डेटा नियंत्रण।",
    icon: "Shield",
    color: "from-sky-500 to-blue-600",
    badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
  },
  {
    id: "safety_and_policies",
    label: "Safety & Policies",
    hindiLabel: "सुरक्षा व दिशानिर्देश",
    description: "Community guidelines, prevention of fake grievances, civic integrity standards, and user protection.",
    descriptionHindi: "कम्युनिटी गाइडलाइन्स, फेक रिपोर्टिंग पर रोक, दुर्भावनापूर्ण आचरण और नागरिक सुरक्षा।",
    icon: "Lock",
    color: "from-slate-600 to-slate-800",
    badgeBg: "bg-slate-100 text-slate-800 border-slate-300",
  },
];

export const HELP_ARTICLES: HelpArticle[] = [
  // ==========================================
  // 1. GETTING STARTED (4 Articles)
  // ==========================================
  {
    id: "art_getting_started_01",
    slug: "what-is-open-desh",
    category: "getting_started",
    categoryLabel: "Getting Started",
    categoryHindi: "शुरुआत करें",
    title: "Open Desh क्या है?",
    englishTitle: "What is Open Desh?",
    summary:
      "Open Desh (टैगलाइन: 'Open Voice, Open Desh') भारत का पहला नागरिक अधिकार, शासन जवाबदेही और रियल-टाइम जन-समस्या निवारण डिजिटल प्लेटफॉर्म है।",
    englishSummary:
      "Open Desh (Tagline: 'Open Voice, Open Desh') is India's premier digital civic governance, elected leader accountability, and real-time grievance redressal platform.",
    keyPoints: [
      "नागरिकों को अपनी स्थानीय समस्याओं (सड़क, पानी, बिजली, भ्रष्टाचार) को सीधे संबंधित विभाग और चुने हुए जन प्रतिनिधि तक पहुंचाने का माध्यम।",
      "X/Twitter की तरह तेज, पारदर्शी और सार्वजनिक फीड जहां हर शिकायत का ऑडिट ट्रेल रहता है।",
      "भारत के 28 राज्यों, 8 केंद्र शासित प्रदेशों और केंद्रीय बजट का प्रति-व्यक्ति पारदर्शी विश्लेषण।",
      "जन प्रतिनिधियों (MLAs, MPs, पार्षदों) का डेटा-आधारित 5-पिलर सिस्टम स्कोर और पब्लिक रेटिंग।",
    ],
    englishKeyPoints: [
      "Direct bridge connecting citizens to government departments and elected representatives for local grievances.",
      "Fast, Twitter/X-inspired transparent civic feed with tamper-proof audit trails.",
      "Per-capita transparent tax allocation analysis across Union, 28 States, and 8 Union Territories.",
      "Elected representatives' performance tracked via a 5-pillar mathematical score (Max 100).",
    ],
    fullContent: [
      "Open Desh एक गैर-पक्षपाती, नागरिक-केंद्रित मंच है जो आम जनता, सरकारी विभागों और निर्वाचित जन प्रतिनिधियों के बीच की दूरी को समाप्त करता है।",
      "पारंपरिक सरकारी पोर्टल्स पर शिकायतें अक्सर फाइलों में दब जाती हैं। Open Desh पर आपकी शिकायत सार्वजनिक रूप से दिखाई देती है, जिससे अधिकारियों और नेताओं पर समयबद्ध कार्रवाई (SLA) का सकारात्मक दबाव बनता है।",
      "इसके साथ ही, यह प्लेटफॉर्म भारत के राष्ट्रीय और राज्य बजटों को सीधे नागरिक के प्रति-व्यक्ति आवंटन में बदलकर जनता को वित्तीय जागरूकता प्रदान करता है।",
    ],
    englishFullContent: [
      "Open Desh is a non-partisan, citizen-centric platform bridging the gap between Indian citizens, administrative departments, and elected representatives.",
      "Unlike conventional grievance portals where complaints remain hidden behind bureaucratic layers, Open Desh makes grievances public to ensure transparency and time-bound SLA enforcement.",
      "Additionally, the platform translates Union and State budgets into transparent per-capita figures, providing citizens with actionable financial literacy regarding their tax contributions.",
    ],
    faqQuestions: [
      {
        question: "क्या Open Desh पर शिकायत दर्ज करने का कोई शुल्क है?",
        answer: "नहीं, Open Desh भारत के सभी नागरिकों के लिए 100% निःशुल्क और ओपन-एक्सेस है।",
        englishQuestion: "Is there any fee to file a grievance on Open Desh?",
        englishAnswer: "No, Open Desh is 100% free and open-access for all Indian citizens.",
      },
      {
        question: "क्या मेरी पहचान सुरक्षित रहेगी?",
        answer: "हाँ, आप अपनी प्रोफाइल को आवश्यकतानुसार कस्टमाइज़ कर सकते हैं और संवेदनशील मामलों में सुरक्षित रूप से रिपोर्ट कर सकते हैं।",
        englishQuestion: "Is citizen data protected?",
        englishAnswer: "Yes, citizen privacy is safeguarded under strict encryption and privacy controls.",
      },
    ],
    tags: ["Open Desh", "Civic Tech", "Citizen Rights", "Overview", "परिचय"],
    englishTags: ["Open Desh", "Civic Tech", "Citizen Rights", "Overview", "Governance"],
    readTimeMinutes: 2,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "Globe",
  },
  {
    id: "art_getting_started_02",
    slug: "how-open-desh-works",
    category: "getting_started",
    categoryLabel: "Getting Started",
    categoryHindi: "शुरुआत करें",
    title: "Open Desh कैसे काम करता है?",
    englishTitle: "How Open Desh Works?",
    summary:
      "Open Desh 4 मुख्य चरणों में कार्य करता है: रिपोर्ट दर्ज करना → ऑटो-डिपार्टमेंट टैगिंग → जन समर्थन व री-रिपोर्ट → सत्यापन व समाधान।",
    englishSummary:
      "Open Desh operates through 4 distinct stages: Grievance Composition → Smart Department Routing → Public Citizen Support & Re-reporting → Official Action & Resolution.",
    keyPoints: [
      "1. कंपोज़र ('Kya Problem ha ?') में फोटो सबूत और GPS लोकेशन के साथ पोस्ट लिखें।",
      "2. सिस्टम स्वचालित रूप से समस्या की कैटेगरी पहचान कर जिम्मेदार विभाग (जैसे @PWD, @JalBoard) और स्थानीय नेता को टैग करता है।",
      "3. अन्य नागरिक आपकी रिपोर्ट को 'Re-report' और सपोर्ट कर सकते हैं, जिससे समस्या ट्रेंडिंग में आती है।",
      "4. विभाग द्वारा की गई कार्रवाई की 4-स्टेज लाइव ट्रैकिंग: Open → Acknowledged → In Progress → Verified Resolved.",
    ],
    englishKeyPoints: [
      "1. Compose grievance with evidence photos and GPS geocoding via the 'Kya Problem ha ?' composer.",
      "2. Automated routing algorithms tag the responsible nodal department (e.g. @PWD, @JalBoard) and elected leader.",
      "3. Fellow citizens re-report and upvote to escalate urgency into trending civic queues.",
      "4. Live 4-stage tracking: Open → Acknowledged → In Progress → Verified Resolved.",
    ],
    fullContent: [
      "Open Desh आधुनिक वेब टेक्नोलॉजी, ओपनस्ट्रीटमैप GPS रिवर्स-जियोकोडिंग और क्लाउडफ्लेयर मीडिया आर्किटेक्चर पर संचालित होता है।",
      "जब आप पोस्ट करते हैं, तो यह सीधे लाइव फीड में प्रकाशित होती है और साथ ही संबंधित विभाग के आधिकारिक डैशबोर्ड में दर्ज हो जाती है।",
      "समाधान के बाद, नागरिक 'Before & After' फोटो सत्यापन देखकर पुष्टि करते हैं कि काम वास्तव में पूरा हुआ है या नहीं।",
    ],
    englishFullContent: [
      "Open Desh is powered by modern cloud infrastructure, OpenStreetMap reverse-geocoding, and Cloudflare media storage.",
      "Every grievance submitted is routed instantly to the live public feed as well as the departmental action queue.",
      "Once work is completed, resolution is verified through 'Before & After' photographic proof.",
    ],
    faqQuestions: [
      {
        question: "क्या अधिकारियों को मेरी पोस्ट की सूचना मिलती है?",
        answer: "हाँ, जब विभाग या नेता को टैग किया जाता है, तो उनके डैशबोर्ड और नोटिफिकेशन में अलर्ट जाता है।",
        englishQuestion: "Do officials receive real-time notifications?",
        englishAnswer: "Yes, tagged departments and elected leaders receive instant alerts in their official dashboard.",
      },
    ],
    tags: ["Workflow", "How it works", "Process", "कार्यप्रणाली"],
    englishTags: ["Workflow", "How It Works", "Civic Lifecycle", "Resolution Process"],
    readTimeMinutes: 2,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "Cpu",
  },
  {
    id: "art_getting_started_03",
    slug: "how-to-create-account",
    category: "getting_started",
    categoryLabel: "Getting Started",
    categoryHindi: "शुरुआत करें",
    title: "Account कैसे बनाएं?",
    englishTitle: "How to Create an Account?",
    summary:
      "Open Desh पर खाता बनाना बहुत सरल है। आप Google One-Click लॉगिन या ईमेल और पासवर्ड के जरिए मात्र 10 सेकंड में जुड़ सकते हैं।",
    englishSummary:
      "Creating an account on Open Desh is seamless. You can join in seconds using Google One-Click Auth or email and password.",
    keyPoints: [
      "साइडबार या हेडर में 'Sign In' बटन पर क्लिक करें।",
      "'Continue with Google' चुनें या अपना नाम, ईमेल और सुरक्षित पासवर्ड दर्ज करें।",
      "लॉगिन के बाद अपनी प्रोफाइल में शहर, राज्य और वॉर्ड विवरण अपडेट करें।",
      "नागरिक, व्यापारी, विभाग या जन प्रतिनिधि 'Get Verified' के जरिए अपनी श्रेणी के अनुसार 4 आधिकारिक बैज (Citizen 🔵, Business 🟡, Department 🟤, Representative 🟢) के लिए आवेदन कर सकते हैं।",
    ],
    englishKeyPoints: [
      "Click the 'Sign In' button in the sidebar or top header.",
      "Select 'Continue with Google' or enter your name, email, and password.",
      "Complete your profile by selecting your State, District, and Ward/Constituency.",
      "Apply for one of the 4 official verification badges (Citizen 🔵, Business 🟡, Department 🟤, Representative 🟢) under 'Get Verified'.",
    ],
    fullContent: [
      "बिना अकाउंट बनाए भी आप सार्वजनिक फीड, बजट और लीडर स्कोर्स देख सकते हैं।",
      "लेकिन शिकायत दर्ज करने, वोट देने, री-रिपोर्ट करने और जन प्रतिनिधियों को रेटिंग देने के लिए एक वेरिफाइड नागरिक अकाउंट होना आवश्यक है।",
      "आपका पासवर्ड और डेटा फायरबेस ऑथेंटिकेशन और इंडस्ट्री-स्टैंडर्ड एन्क्रिप्शन के जरिए पूरी तरह सुरक्षित रहता है।",
    ],
    englishFullContent: [
      "Public feeds, civic budgets, and leader ratings are visible to guest visitors without mandatory login.",
      "However, posting grievances, re-reporting, voting, and rating representatives requires an authenticated profile to prevent bot manipulation.",
      "All credentials and personal details are secured via Firebase Authentication and end-to-end cloud encryption.",
    ],
    faqQuestions: [
      {
        question: "क्या एक ईमेल से कई अकाउंट बन सकते हैं?",
        answer: "नहीं, निष्पक्षता और 1-नागरिक-1-वोट बनाए रखने के लिए एक ईमेल पर केवल एक अकाउंट अनुमत है।",
        englishQuestion: "Can I create multiple accounts with one email?",
        englishAnswer: "No, to uphold 1-citizen-1-vote integrity, each email is strictly linked to a single profile.",
      },
    ],
    tags: ["Account", "Signup", "Login", "Google Auth", "खाता बनाएं"],
    englishTags: ["Account Setup", "Authentication", "Google Login", "Citizen Profile"],
    readTimeMinutes: 2,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "UserPlus",
  },
  {
    id: "art_getting_started_04",
    slug: "how-to-file-first-complaint",
    category: "getting_started",
    categoryLabel: "Getting Started",
    categoryHindi: "शुरुआत करें",
    title: "पहली शिकायत कैसे दर्ज करें?",
    englishTitle: "How to File Your First Grievance?",
    summary:
      "अपनी पहली नागरिक शिकायत दर्ज करने के लिए नीचे दिए गए स्टेप्स का पालन करें और समस्या का ठोस फोटो सबूत साथ में जोड़ें।",
    englishSummary:
      "Follow these step-by-step instructions to report civic infrastructure failures with photographic evidence and precise GPS coordinates.",
    keyPoints: [
      "निचले नेविगेशन बार या साइड मेनू में '+' (Compose) बटन दबाएं।",
      "समस्या का संक्षिप्त और स्पष्ट विवरण लिखें (जैसे: सड़क का गड्ढा, टूटी पाइपलाइन, स्ट्रीटलाइट)।",
      "गैलरी या कैमरा आइकन से स्थल की स्पष्ट तस्वीर अपलोड करें।",
      "GPS पिन आइकन दबाकर सटीक लोकेशन अटैच करें और 'Post Issue' पर क्लिक करें।",
    ],
    englishKeyPoints: [
      "Click the '+' (Compose) button on the mobile bottom bar or web sidebar.",
      "Describe the grievance concisely in the 'Kya Problem ha ?' text area.",
      "Attach up to 6 clear on-site photographs using the camera or gallery button.",
      "Tap the GPS pin to auto-populate the exact latitude/longitude and address, then click 'Post Issue'.",
    ],
    fullContent: [
      "पहली शिकायत दर्ज करते समय सुनिश्चित करें कि आप समस्या की श्रेणी (Category) सही चुन रहे हैं, जैसे 'Roads & Potholes', 'Water Supply', 'Sanitation', आदि।",
      "यदि संभव हो तो गड्ढे की गहराई या जलभराव के घंटों का संक्षिप्त ब्यौरा भी दें। इससे संबंधित विभाग को तुरंत संसाधन भेजने में मदद मिलती है।",
    ],
    englishFullContent: [
      "Select the appropriate category (e.g., 'Roads & Potholes', 'Water Supply', 'Sanitation', 'Electricity', 'Corruption').",
      "Include key audit parameters such as pothole depth, water disruption hours, or transformer pole ID for rapid departmental deployment.",
    ],
    faqQuestions: [
      {
        question: "क्या शिकायत पोस्ट करने के बाद एडिट की जा सकती है?",
        answer: "आप पोस्ट मेनू से विवरण अपडेट कर सकते हैं या अतिरिक्त फॉलो-अप फोटो जोड़ सकते हैं।",
        englishQuestion: "Can I edit a grievance after posting?",
        englishAnswer: "You can update the description or append progress photos from the post options menu.",
      },
    ],
    tags: ["First Report", "Grievance", "Compose", "शिकायत दर्ज करें"],
    englishTags: ["File Grievance", "First Report", "Compose", "Pothole Reporting"],
    readTimeMinutes: 2,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "FilePlus",
  },

  // ==========================================
  // 2. REPORTS & COMPLAINTS (6 Articles)
  // ==========================================
  {
    id: "art_reports_01",
    slug: "how-to-report-an-issue",
    category: "reports_and_complaints",
    categoryLabel: "Reports & Complaints",
    categoryHindi: "शिकायतें व रिपोर्टिंग",
    title: "Report कैसे करें?",
    englishTitle: "How to Report an Issue?",
    summary:
      "नागरिक समस्याओं को प्रभावी ढंग से रिपोर्ट करने के लिए Open Desh का फुल-स्क्रीन कंपोज़र इस्तेमाल करें जो Twitter/X के समान सहज है।",
    englishSummary:
      "Use Open Desh's full-screen Twitter/X-style composer to file effective, actionable reports for local infrastructure issues.",
    keyPoints: [
      "कंपोज़र विंडो में 'Kya Problem ha ?' टेक्स्ट बॉक्स में मुख्य समस्या लिखें।",
      "कैटेगरी स्विचर से उपयुक्त श्रेणी (बिजली, सड़क, जल, सफाई, स्वास्थ्य, शिक्षा) चुनें।",
      "संबंधित विभाग (@JharkhandPWD, @RMC_Swachhata) को ऑटो-सजेस्ट से टैग करें।",
      "प्राथमिकता (Urgency: High, Medium, Low) सेट करें और पोस्ट प्रकाशित करें।",
    ],
    englishKeyPoints: [
      "Enter the core problem in the 'Kya Problem ha ?' prompt field.",
      "Switch category to assign correct municipal/departmental handling.",
      "Tag relevant departments (@PWD, @JalBoard) or elected leaders (@niteshgupta950).",
      "Set urgency priority (High, Medium, Normal) and submit.",
    ],
    fullContent: [
      "स्पष्ट और तथ्यपरक भाषा का प्रयोग करें। किसी व्यक्ति विशेष पर अभद्र टिप्पणी करने के बजाय बुनियादी ढांचे की खराबी पर ध्यान केंद्रित करें।",
      "आपकी पोस्ट प्रकाशित होते ही उसे एक यूनिक रिपोर्ट आईडी आवंटित हो जाती है जिसे आप भविष्य के संदर्भ के लिए ट्रैक कर सकते हैं।",
    ],
    englishFullContent: [
      "Maintain objective, factual language focused on public infrastructure rather than personal attacks.",
      "Each grievance is assigned a permanent alphanumeric Reference ID for statutory audit and tracking.",
    ],
    faqQuestions: [
      {
        question: "क्या रिपोर्ट सीधे मुख्यमंत्री या मंत्री तक पहुंचती है?",
        answer: "हाँ, यदि आप संबंधित विधायक/मंत्री को टैग करते हैं, तो उनकी प्रोफाइल के 'Tagged Issues' में यह लाइव दिखाई देती है।",
        englishQuestion: "Do tagged representatives see the report directly?",
        englishAnswer: "Yes, tagged MLAs, MPs, and Ministers receive it in their official Tagged Issues queue.",
      },
    ],
    tags: ["Report", "Issue Filing", "Civic Problem", "शिकायत"],
    englishTags: ["Grievance Reporting", "Civic Problem", "Issue Filing", "Public Feed"],
    readTimeMinutes: 2,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "Send",
  },
  {
    id: "art_reports_02",
    slug: "how-to-add-evidence",
    category: "reports_and_complaints",
    categoryLabel: "Reports & Complaints",
    categoryHindi: "शिकायतें व रिपोर्टिंग",
    title: "Evidence कैसे जोड़ें?",
    englishTitle: "How to Add Evidence & Photos?",
    summary:
      "ठोस सबूत से शिकायत 3 गुना तेजी से हल होती है। Open Desh पर आप एक साथ 6 उच्च-गुणवत्ता वाली तस्वीरें और दस्तावेज जोड़ सकते हैं।",
    englishSummary:
      "Complaints backed by verifiable visual evidence are resolved 3x faster. Open Desh supports up to 6 high-resolution evidence images.",
    keyPoints: [
      "कंपोज़र के बॉटम टूलबार में 'Gallery / Camera' आइकन पर टैप करें।",
      "समस्या के अलग-अलग कोणों (Wide Angle और Close-Up) से 1 से 6 तस्वीरें चुनें।",
      "फोटो में लैंडमार्क (जैसे पास की दुकान, पोल नंबर, मील का पत्थर) साफ दिखना चाहिए।",
      "क्लाउडफ्लेयर R2 आर्किटेक्चर के जरिए तस्वीरें तुरंत बिना कंप्रेस हुए सुरक्षित अपलोड होती हैं।",
    ],
    englishKeyPoints: [
      "Tap the Gallery/Camera icon in the composer toolbar.",
      "Select 1 to 6 photos capturing both wide-angle context and close-up depth.",
      "Include identifiable landmarks (street poles, mile markers, building corners).",
      "Images are uploaded with high-fidelity compression via Cloudflare R2.",
    ],
    fullContent: [
      "फर्जी दावों से बचने के लिए वास्तविक स्थल की ताज़ा तस्वीरें ही अपलोड करें।",
      "यदि आपके पास पूर्व में दिए गए आवेदन की रसीद या टेंडर नंबर है, तो उसका फोटो भी अटैच कर सकते हैं।",
    ],
    englishFullContent: [
      "Upload authentic, unedited photos taken on-site to ensure credibility and prevent spam flags.",
      "Physical receipt copies of previous administrative memos or RTI filings may also be attached.",
    ],
    faqQuestions: [
      {
        question: "क्या मैं वीडियो भी अपलोड कर सकता हूँ?",
        answer: "वर्तमान में 6 हाई-रेजोल्यूशन तस्वीरें समर्थित हैं। वीडियो सपोर्ट आगामी अपडेट में जोड़ा जा रहा है।",
        englishQuestion: "Is video evidence supported?",
        englishAnswer: "Currently up to 6 high-resolution photos are supported, with direct video upload planned for upcoming releases.",
      },
    ],
    tags: ["Evidence", "Photos", "Upload", "सबूत"],
    englishTags: ["Evidence", "Photo Upload", "Proof", "Cloudflare Storage"],
    readTimeMinutes: 2,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "Camera",
  },
  {
    id: "art_reports_03",
    slug: "how-to-add-location",
    category: "reports_and_complaints",
    categoryLabel: "Reports & Complaints",
    categoryHindi: "शिकायतें व रिपोर्टिंग",
    title: "Location कैसे जोड़ें?",
    englishTitle: "How to Tag GPS Location?",
    summary:
      "Open Desh में ऑटोमैटिक GPS रिवर्स-जियोकोडिंग (OpenStreetMap) की सुविधा है जिससे आपकी सटीक लोकेशन स्वतः दर्ज हो जाती है।",
    englishSummary:
      "Open Desh features automatic GPS reverse-geocoding via OpenStreetMap Nominatim to stamp exact civic coordinates.",
    keyPoints: [
      "कंपोज़र में 'GPS Pin' आइकन पर क्लिक करें।",
      "ब्राउज़र द्वारा लोकेशन परमिशन मांगे जाने पर 'Allow' करें।",
      "सिस्टम आपके अक्षांश/देशांतर से सड़क का नाम, मोहल्ला, शहर और पिनकोड स्वतः भर देगा।",
      "आप चाहें तो मैप पर पिन खींचकर या मैनुअल सर्च करके भी लोकेशन एडजस्ट कर सकते हैं।",
    ],
    englishKeyPoints: [
      "Click the GPS Pin icon in the composer toolbar.",
      "Allow browser location access when prompted.",
      "The system automatically retrieves the street, colony, city, district, and PIN code.",
      "You can also fine-tune coordinates by dragging the pin on the map preview.",
    ],
    fullContent: [
      "सटीक लोकेशन होने से संबंधित नगर निगम वार्ड और जूनियर इंजीनियर (JE) को समस्या का स्थल ढूंढने में कोई परेशानी नहीं होती।",
      "लोकेशन के साथ एक्यूरेसी इंडिकेटर (जैसे '±5 meters') भी प्रदर्शित होता है।",
    ],
    englishFullContent: [
      "Accurate geocoding allows Junior Engineers and municipal field teams to locate repair spots without delay.",
      "An accuracy radius indicator is stamped on the grievance metadata for audit reliability.",
    ],
    faqQuestions: [
      {
        question: "क्या लोकेशन न देने पर भी शिकायत दर्ज हो सकती है?",
        answer: "हाँ, लेकिन त्वरित समाधान के लिए कम से कम शहर और मोहल्ले का नाम लिखना अनिवार्य है।",
        englishQuestion: "Can I file without GPS permission?",
        englishAnswer: "Yes, you can manually type the locality and landmark if device GPS is unavailable.",
      },
    ],
    tags: ["GPS", "Location", "OpenStreetMap", "स्थान"],
    englishTags: ["GPS Geocoding", "OpenStreetMap", "Location Tagging", "Coordinates"],
    readTimeMinutes: 2,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "MapPin",
  },
  {
    id: "art_reports_04",
    slug: "how-to-choose-department",
    category: "reports_and_complaints",
    categoryLabel: "Reports & Complaints",
    categoryHindi: "शिकायतें व रिपोर्टिंग",
    title: "Department कैसे चुनें?",
    englishTitle: "How to Select Responsible Department?",
    summary:
      "समस्या की प्रकृति के अनुसार सही सरकारी विभाग को टैग करें ताकि फाइल सही डेस्क पर पहुंचे।",
    englishSummary:
      "Tag the correct government ministry or municipal division according to the civic nature of the issue.",
    keyPoints: [
      "सड़क व पुलिया: @PWD / @RCD_Roads / @NHAI",
      "पीने का पानी व सीवरेज: @JalBoard / @PHED / @Municipal_Water",
      "कचरा, नाली व सफाई: @Municipal_Corporation / @Swachhata",
      "बिजली आपूर्ति व ट्रांसफॉर्मर: @Electricity_Discom / @PowerCorp",
      "रिश्वत व भ्रष्टाचार: @AntiCorruptionBureau / @Vigilance",
    ],
    englishKeyPoints: [
      "Roads & Bridges: @PWD / @NHAI / @RCD_Roads",
      "Water Supply & Pipelines: @JalBoard / @PHED / @WaterBoard",
      "Sanitation & Waste Disposal: @Municipal_Corporation / @Swachhata",
      "Electricity & Transformers: @Electricity_Discom / @PowerCorp",
      "Bribery & Corruption: @AntiCorruptionBureau / @Vigilance",
    ],
    fullContent: [
      "Open Desh का स्मार्ट एल्गोरिदम आपके लिखे गए शब्दों (उदा. 'गड्ढा' या 'ट्रांसफॉर्मर जल गया') के आधार पर सबसे उपयुक्त विभाग को स्वतः सुझा देता है।",
      "यदि आप सुनिश्चित नहीं हैं, तो 'General Municipal' चुन सकते हैं, जहां से एडमिन टीम उसे सही विभाग को फॉरवर्ड कर देगी।",
    ],
    englishFullContent: [
      "Open Desh's NLP suggestion engine auto-recommends the appropriate nodal body based on keywords in your complaint.",
      "If unsure, select 'General Municipal', and civic moderators will route it to the exact jurisdiction.",
    ],
    faqQuestions: [
      {
        question: "अगर गलत विभाग टैग हो जाए तो क्या होगा?",
        answer: "विभाग या एडमिन मॉडरेटर उसे सही नोडल एजेंसी को पुनः निर्देशित (Re-route) कर सकते हैं।",
        englishQuestion: "What if the wrong department is tagged?",
        englishAnswer: "Departmental nodal officers or moderators can seamlessly re-route the ticket to the correct department.",
      },
    ],
    tags: ["Department", "Tagging", "PWD", "Municipal", "विभाग चयन"],
    englishTags: ["Department Routing", "Jurisdiction", "PWD", "Municipal Tagging"],
    readTimeMinutes: 2,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "Building2",
  },
  {
    id: "art_reports_05",
    slug: "understanding-report-status",
    category: "reports_and_complaints",
    categoryLabel: "Reports & Complaints",
    categoryHindi: "शिकायतें व रिपोर्टिंग",
    title: "Report Status कैसे समझें?",
    englishTitle: "Understanding Report Status & SLA Lifecycle",
    summary:
      "आपकी शिकायत 4 स्पष्ट चरणों से होकर गुजरती है: Open, In Progress, Resolved और Verified Resolved।",
    englishSummary:
      "Every grievance progresses through 4 transparent SLA lifecycle stages: Open, In Progress, Resolved, and Citizen-Verified.",
    keyPoints: [
      "🔴 Open (दर्ज): शिकायत सार्वजनिक हो चुकी है और संबंधित विभाग को नोटिस भेजा गया है।",
      "🟡 In Progress (प्रक्रियाधीन): विभाग ने संज्ञान ले लिया है, टेंडर/वर्क ऑर्डर जारी हो गया है।",
      "🟢 Resolved (हल): विभाग ने काम पूरा होने की रिपोर्ट और तस्वीर सबमिट कर दी है।",
      "🔵 Verified Resolved (नागरिक सत्यापित): शिकायतकर्ता ने मौके पर जाकर पुष्टि की है।",
    ],
    englishKeyPoints: [
      "🔴 Open: Issue published to feed; departmental notice dispatched.",
      "🟡 In Progress: Official acknowledged; site engineer or work order assigned.",
      "🟢 Resolved: Department submitted official Action Taken Report and repair photo.",
      "🔵 Verified Resolved: Reporting citizen verified physical completion on-site.",
    ],
    fullContent: [
      "यदि विभाग समय सीमा (SLA) के भीतर कार्रवाई नहीं करता, तो स्टेटस 'Overdue (विलंबित)' में बदल जाता है और उच्च अधिकारियों को ऑटो-एस्केलेट हो जाता है।",
    ],
    englishFullContent: [
      "If the statutory SLA deadline expires without departmental action, the ticket is flagged 'Overdue' and escalated to District Magistrate and Chief Secretary dashboards.",
    ],
    faqQuestions: [
      {
        question: "यदि कोई झूठी 'Resolved' रिपोर्ट डाल दे तो?",
        answer: "आप तुरंत 'Dispute Resolution' बटन दबाकर आपत्ति दर्ज कर सकते हैं।",
        englishQuestion: "What if a fake resolution report is submitted?",
        englishAnswer: "You can click 'Dispute Resolution' to reject false claims and reopen the escalation queue.",
      },
    ],
    tags: ["Status", "SLA", "Resolved", "Progress", "स्थिति"],
    englishTags: ["Report Status", "SLA Tracking", "Resolution Lifecycle", "Dispute Resolution"],
    readTimeMinutes: 2,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "CheckCircle",
  },
  {
    id: "art_reports_06",
    slug: "re-report-and-support",
    category: "reports_and_complaints",
    categoryLabel: "Reports & Complaints",
    categoryHindi: "शिकायतें व रिपोर्टिंग",
    title: "Re-Report व जन समर्थन कैसे दें?",
    englishTitle: "How to Re-Report & Amplify Issues?",
    summary:
      "जब एक ही समस्या से कई नागरिक प्रभावित होते हैं, तो अलग-अलग शिकायत करने के बजाय उसी पोस्ट को 'Re-Report' करके ताकत दी जाती है।",
    englishSummary:
      "When multiple citizens face the same civic disruption, Re-reporting consolidates community voice without cluttering duplicate tickets.",
    keyPoints: [
      "किसी भी पोस्ट के नीचे 'Re-Report' (🔁) आइकन पर क्लिक करें।",
      "आप अपना अतिरिक्त फोटो या कमेंट जोड़ सकते हैं कि यह समस्या आपको कैसे प्रभावित कर रही है।",
      "जितने अधिक Re-Reports होंगे, समस्या का 'Urgency Index' उतना ही ऊंचा होगा।",
      "ट्रेंडिंग मुद्दे सीधे प्रशासन और मीडिया के रडार पर आते हैं।",
    ],
    englishKeyPoints: [
      "Tap the 'Re-Report' (🔁) icon on any existing grievance card.",
      "Append your own situational photo or comment detailing local impact.",
      "Higher Re-Report counts elevate the Urgency Index on municipal radars.",
      "Trending issues gain immediate media visibility and legislative attention.",
    ],
    fullContent: [
      "Re-report फीचर डुप्लीकेट शिकायतों को रोकता है और सामूहिक जनशक्ति को एक मंच पर लाता है।",
    ],
    englishFullContent: [
      "Consolidated community re-reporting gives civic authorities undeniable proof of widespread constituency impact.",
    ],
    faqQuestions: [
      {
        question: "क्या Re-Report करने पर मुझे भी अपडेट मिलेंगे?",
        answer: "हाँ, जब भी उस मुद्दे पर कोई एक्शन होगा, आपको नोटिफिकेशन मिलेगा।",
        englishQuestion: "Will I receive alerts after re-reporting?",
        englishAnswer: "Yes, you will receive real-time notifications for any departmental progress on that issue.",
      },
    ],
    tags: ["Re-Report", "Upvote", "Trending", "री-रिपोर्ट"],
    englishTags: ["Re-Report", "Community Support", "Amplify Issue", "Trending Feed"],
    readTimeMinutes: 2,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "Repeat",
  },

  // ==========================================
  // 3. GOVERNMENT & OFFICIALS (5 Articles)
  // ==========================================
  {
    id: "art_gov_01",
    slug: "department-tagging-rules",
    category: "government_and_officials",
    categoryLabel: "Government & Officials",
    categoryHindi: "विभाग व जन प्रतिनिधि",
    title: "विभागीय अधिकार क्षेत्र व टैगिंग नियम",
    englishTitle: "Department Jurisdiction & Tagging Protocol",
    summary:
      "विभिन्न विभागों के कार्यक्षेत्र और उनके कानूनी दायित्वों की विस्तृत नियमावली।",
    englishSummary:
      "Detailed jurisdiction mapping and statutory responsibilities of state and municipal civic authorities.",
    keyPoints: [
      "नेशनल हाईवे: NHAI (सड़क परिवहन एवं राजमार्ग मंत्रालय)",
      "स्टेट हाईवे व जिला सड़कें: राज्य PWD / RCD",
      "शहर की आंतरिक गलियां: नगर निगम / नगरपालिका",
      "पेयजल आपूर्ति: राज्य जल बोर्ड / PHED",
      "बिजली ट्रांसफॉर्मर व तार: राज्य विद्युत वितरण निगम (DISCOM)",
    ],
    englishKeyPoints: [
      "National Highways: NHAI (Ministry of Road Transport & Highways)",
      "State Highways & Major District Roads: State PWD / RCD",
      "City Colony Roads & Streetlights: Municipal Corporation / Municipality",
      "Drinking Water Supply & Drainage: State Jal Board / PHED",
      "Electricity Distribution & Sub-stations: State Power DISCOM",
    ],
    fullContent: [
      "गलत विभाग को शिकायत भेजने पर समय नष्ट हो सकता है। इसलिए टैगिंग से पहले सड़क या समस्या के स्वामित्व की जांच करें।",
    ],
    englishFullContent: [
      "Understanding administrative jurisdiction ensures immediate nodal allocation without procedural delays.",
    ],
    faqQuestions: [
      {
        question: "क्या प्राइवेट कॉलोनियों की शिकायतें भी दर्ज हो सकती हैं?",
        answer: "हाँ, लेकिन उन्हें 'Resident Welfare Association (RWA)' या संबंधित डेवलपर के अंतर्गत चिह्नित किया जाना चाहिए।",
        englishQuestion: "Can private colony maintenance issues be reported?",
        englishAnswer: "Yes, tag under Resident Welfare Association (RWA) or town planning authorities.",
      },
    ],
    tags: ["Jurisdiction", "Rules", "Departments", "अधिकार क्षेत्र"],
    englishTags: ["Jurisdiction", "Statutory Roles", "PWD", "Municipal Limits"],
    readTimeMinutes: 2,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "Landmark",
  },
  {
    id: "art_gov_02",
    slug: "elected-leader-profiles",
    category: "government_and_officials",
    categoryLabel: "Government & Officials",
    categoryHindi: "विभाग व जन प्रतिनिधि",
    title: "Elected Leader Profiles",
    englishTitle: "Elected Leader Profiles & Trackers",
    summary:
      "Open Desh पर हर सांसद (MP), विधायक (MLA) और पार्षद की आधिकारिक प्रोफाइल होती है जहां उनके विकास कार्यों का पूरा ब्यौरा रहता है।",
    englishSummary:
      "Every MP, MLA, and Corporator has an open performance profile tracking constituency development and citizen ratings.",
    keyPoints: [
      "नेता के निर्वाचन क्षेत्र में दर्ज कुल शिकायतें और उनके समाधान की दर (Resolution Rate)।",
      "विधायक/सांसद निधि (LAD Fund) का उपयोग और स्वीकृत योजनाओं की स्थिति।",
      "जनता द्वारा दिए गए 5-पिलर स्कोर और वास्तविक नागरिकों की सत्यापित समीक्षाएं।",
      "सदन (विधानसभा/संसद) में उपस्थिति और उठाए गए जनहित के मुद्दे।",
    ],
    englishKeyPoints: [
      "Total constituency grievances received vs. officially resolved.",
      "MPLAD / MLALAD development fund expenditure and completed project ledger.",
      "Verified citizen 5-pillar scores and constituent reviews.",
      "Legislative attendance and questions raised in Parliament/Assembly.",
    ],
    fullContent: [
      "लीडर प्रोफाइल पूरी तरह निष्पक्ष और चुनाव आयोग व आधिकारिक विधानसभा रिकॉर्ड पर आधारित होती है।",
    ],
    englishFullContent: [
      "Profiles are objective, transparent, and grounded in official Election Commission filings and legislative gazettes.",
    ],
    faqQuestions: [
      {
        question: "क्या नेता अपनी प्रोफाइल से नकारात्मक समीक्षा हटा सकते हैं?",
        answer: "नहीं, समीक्षाएं निष्पक्ष हैं। नेता उन पर अपना आधिकारिक स्पष्टीकरण (Official Response) दे सकते हैं।",
        englishQuestion: "Can leaders delete negative citizen reviews?",
        englishAnswer: "No, verified citizen reviews cannot be removed. Representatives can submit Official Responses.",
      },
    ],
    tags: ["Elected Leaders", "MLA", "MP", "Scorecard", "नेता प्रोफाइल"],
    englishTags: ["Elected Leaders", "MLA Tracker", "MP Performance", "Scorecards"],
    readTimeMinutes: 2,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "Award",
  },
  {
    id: "art_gov_03",
    slug: "verification-badges",
    category: "government_and_officials",
    categoryLabel: "Government & Officials",
    categoryHindi: "विभाग व जन प्रतिनिधि",
    title: "4 आधिकारिक वेरिफिकेशन बैज व सत्यापन ढांचा",
    englishTitle: "4 Official Verification Badges & Verification Framework",
    summary:
      "Open Desh पर प्रामाणिकता और विश्वास सुनिश्चित करने के लिए 4 श्रेणियों में विशिष्ट सत्यापन बैज (Badges) प्रदान किए जाते हैं: Citizen 🔵, Business 🟡, Department 🟤, और Representative 🟢।",
    englishSummary:
      "Open Desh provides 4 distinct official verification badges to ensure transparency, accountability, and authentic identity across citizens, businesses, government departments, and elected representatives: Citizen 🔵, Business 🟡, Department 🟤, and Representative 🟢.",
    keyPoints: [
      "🔵 Citizen (Blue Tick) — सत्यापित भारतीय नागरिक, पंजीकृत मतदाता और सक्रिय नागरिक योगदानकर्ता। (Voter ID / Aadhaar / स्थानीय निवास सत्यापन)",
      "🟡 Business (Yellow Tick) — कॉर्पोरेट, उद्योग, MSME, इंफ्रास्ट्रक्चर ठेकेदार व पंजीकृत व्यापारिक संस्थान। (GSTIN / CIN / Trade License)",
      "🟤 Department (Brown Tick) — नगर निगम, PWD, DISCOM बिजली बोर्ड, जल पर्षद व नोडल प्रशासनिक एजेंसियां। (Govt .gov.in/.nic.in Email / Nodal Order)",
      "🟢 Representative (Green Tick) — निर्वाचित जन प्रतिनिधि (सांसद, विधायक, मंत्री, महापौर, नगर निगम पार्षद)। (ECI Election Certificate / Gazette)",
    ],
    englishKeyPoints: [
      "🔵 Citizen (Blue Tick) — Verified Indian citizen, registered voter, and active civic contributor. (Requires Voter ID / Aadhaar / Resident ID)",
      "🟡 Business (Yellow Tick) — Registered corporations, industrial enterprises, MSMEs, and infrastructure contractors. (Requires GSTIN / CIN / Trade License)",
      "🟤 Department (Brown Tick) — Municipal corporations, PWD, DISCOM electricity boards, Jal Boards, and nodal administrative bodies. (Requires .gov.in/.nic.in Official Email / Nodal Order)",
      "🟢 Representative (Green Tick) — Elected public representatives (MPs, MLAs, Ministers, Mayors, Ward Corporators). (Requires ECI Election Certificate / Gazette Notification)",
    ],
    fullContent: [
      "Open Desh का 4-टियर सत्यापन ढांचा सभी हितधारकों को प्रामाणिक डिजिटल पहचान और विशिष्ट अधिकार प्रदान करता है:",
      "1. 🔵 Citizen (Blue Tick): वास्तविक भारतीय नागरिकों और मतदाताओं की प्रामाणिकता की पुष्टि। इससे आपकी शिकायतों को उच्च प्राथमिकता मिलती है और आप जनप्रतिनिधियों को प्रमाणित समीक्षाएं व रेटिंग दे सकते हैं।",
      "2. 🟡 Business (Yellow Tick): कॉर्पोरेट, निर्माण ठेकेदारों और औद्योगिक उद्यमों की वैधता। यह पब्लिक इंफ्रास्ट्रक्चर टेंडर, कॉर्पोरेट CSR और वाणिज्यिक मामलों में सीधे आधिकारिक संवाद की सुविधा देता है।",
      "3. 🟤 Department (Brown Tick): सरकारी विभागों और नागरिक एजेंसियों की आधिकारिक उपस्थिति। इस बैज के साथ जारी किए गए सभी उत्तर 'Official Action Taken Reports (ATR)' के रूप में कानूनी मान्यता प्राप्त करते हैं।",
      "4. 🟢 Representative (Green Tick): चुनाव आयोग द्वारा विधिवत निर्वाचित जन प्रतिनिधियों की आधिकारिक प्रोफाइल। यह विधायकों/सांसदों को सीधे अपने निर्वाचन क्षेत्र की शिकायतों को देखने, प्राथमिकता देने और नागरिकों को आधिकारिक उत्तर देने का अधिकार देती है।",
      "आवेदन प्रक्रिया: अपनी प्रोफ़ाइल में जाएं, 'Get Verified' बटन दबाएं, अपनी श्रेणी चुनें और आवश्यक पहचान दस्तावेज अपलोड करें। हमारी प्रशासनिक टीम 24 से 48 घंटे के भीतर सत्यापन पूरा करती है।",
    ],
    englishFullContent: [
      "The Open Desh 4-Tier Verification Architecture establishes authentic digital credentials and accountability standards across all governance stakeholders:",
      "1. 🔵 Citizen (Blue Tick): Authenticates genuine Indian citizens and registered voters. Verified citizens receive enhanced grievance routing priority and verified voter weighting when submitting performance ratings on MLAs, MPs, and corporators.",
      "2. 🟡 Business (Yellow Tick): Validates corporate entities, infrastructure contractors, MSMEs, and industrial bodies. Allows official corporate discourse on civic tenders, CSR initiatives, and industrial infrastructure.",
      "3. 🟤 Department (Brown Tick): Designated exclusively for government ministries, municipal corporations, PWD divisions, electricity distribution companies (DISCOMs), and water boards. Responses published under this badge hold statutory status as Official Action Taken Reports (ATR).",
      "4. 🟢 Representative (Green Tick): Exclusively granted to constitutionally elected leaders (Members of Parliament, Members of Legislative Assembly, Councilors, Mayors). Enables representatives to directly respond to constituent reviews and manage ward-level issue queues.",
      "How to Apply: Navigate to your Profile, tap the 'Get Verified' button, select your category (Citizen, Business, Department, or Representative), and submit the required verification credentials. Administrative review is completed within 24 to 48 hours.",
    ],
    faqQuestions: [
      {
        question: "वेरिफिकेशन बैज के लिए आवेदन कैसे करें?",
        answer: "अपनी प्रोफाइल में 'Get Verified' बटन दबाएं और अपनी श्रेणी (Citizen 🔵, Business 🟡, Department 🟤 या Representative 🟢) के अनुसार आवश्यक दस्तावेज सबमिट करें।",
        englishQuestion: "How do I apply for an official verification badge?",
        englishAnswer: "Go to your Profile, click the 'Get Verified' button, select your category (Citizen 🔵, Business 🟡, Department 🟤, or Representative 🟢), and submit the required supporting documents.",
      },
      {
        question: "सत्यापन में कितना समय लगता है?",
        answer: "दस्तावेज जमा होने के बाद प्रशासनिक समीक्षा और डेटाबेस सत्यापन में आमतौर पर 24 से 48 घंटे का समय लगता है।",
        englishQuestion: "How long does verification review take?",
        englishAnswer: "Once credentials are submitted, administrative review and statutory verification typically takes 24 to 48 hours.",
      },
      {
        question: "क्या वेरिफिकेशन बैज का कोई शुल्क है?",
        answer: "नहीं, Open Desh पर नागरिकों और निर्वाचित जन प्रतिनिधियों के लिए सत्यापन प्रक्रिया 100% निःशुल्क है।",
        englishQuestion: "Is there any fee for verification?",
        englishAnswer: "No, verification on Open Desh is 100% free of charge for citizens, civic bodies, and elected representatives.",
      },
      {
        question: "यदि कोई गलत जानकारी देकर बैज प्राप्त करने का प्रयास करे तो क्या होगा?",
        answer: "फर्जी दस्तावेज जमा करने पर खाता तत्काल ब्लॉक कर दिया जाता है और भारतीय कानून के तहत नागरिक अखंडता दिशानिर्देशों के अनुसार कार्रवाई की जाती है।",
        englishQuestion: "What happens if fraudulent documents are submitted?",
        englishAnswer: "Submission of fraudulent documentation results in immediate account revocation and restriction under Open Desh Civic Integrity Guidelines.",
      },
    ],
    tags: ["Verification", "Badge", "Blue Tick", "Yellow Tick", "Brown Tick", "Green Tick", "सत्यापन"],
    englishTags: ["Verification", "Official Badge", "Blue Tick", "Yellow Tick", "Brown Tick", "Green Tick", "Credentials"],
    readTimeMinutes: 3,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "BadgeCheck",
  },
  {
    id: "art_gov_04",
    slug: "department-response",
    category: "government_and_officials",
    categoryLabel: "Government & Officials",
    categoryHindi: "विभाग व जन प्रतिनिधि",
    title: "Department Response",
    englishTitle: "Official Department Responses & Action Reports",
    summary:
      "जब कोई विभाग आपकी शिकायत पर औपचारिक जवाब देता है, तो वह 'Official Action Taken Report (ATR)' के रूप में प्रकाशित होता है।",
    englishSummary:
      "When a civic department responds to a grievance, it is published with statutory standing as an Official Action Taken Report (ATR).",
    keyPoints: [
      "आधिकारिक जवाब पर विभाग का ब्राउन बैज (🟤 Brown Tick) और जारीकर्ता अधिकारी का पदनाम होता है।",
      "जवाब में काम पूरा होने का समय, टेंडर संदर्भ या साइट फोटो संलग्न होते हैं।",
      "नागरिक उस जवाब पर 'Satisfied' या 'Unsatisfied' फीडबैक दे सकते हैं।",
    ],
    englishKeyPoints: [
      "Responses bear the Department Brown Badge (🟤) and issuing officer designation.",
      "Includes completion timelines, tender work-order numbers, and on-site repair images.",
      "Citizens can rate responses as Satisfied or Unsatisfied.",
    ],
    fullContent: [
      "विभाग के आधिकारिक रिस्पॉन्स को कानूनी रिकॉर्ड के रूप में सुरक्षित रखा जाता है जिसका उपयोग जरूरत पड़ने पर आरटीआई या जनसुनवाई में किया जा सकता है।",
    ],
    englishFullContent: [
      "Official department responses are stored permanently as legal public audit records admissible in RTI appeals and public hearings.",
    ],
    faqQuestions: [
      {
        question: "यदि विभाग का जवाब संतोषजनक न हो तो क्या करें?",
        answer: "आप रिपोर्ट को 'Dispute' कर सकते हैं जिससे मामला उच्च प्रशासनिक अधिकारियों के संज्ञान में आ जाता है।",
        englishQuestion: "What if the department response is unsatisfactory?",
        englishAnswer: "You can dispute the resolution to trigger higher administrative review.",
      },
    ],
    tags: ["ATR", "Department Response", "Resolution", "विभागीय जवाब"],
    englishTags: ["Action Taken Report", "Official Response", "Department ATR", "Redressal"],
    readTimeMinutes: 2,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "MessageSquare",
  },
  {
    id: "art_gov_05",
    slug: "official-clarifications",
    category: "government_and_officials",
    categoryLabel: "Government & Officials",
    categoryHindi: "विभाग व जन प्रतिनिधि",
    title: "Official Clarification",
    englishTitle: "Leader Official Clarifications & Press Releases",
    summary:
      "निर्वाचित विधायक या सांसद किसी जन-मुद्दे पर अपना पक्ष रखने के लिए 'Official Clarification' जारी कर सकते हैं।",
    englishSummary:
      "Elected MLAs and MPs can issue Official Clarifications to communicate ground realities and legislative updates directly to constituents.",
    keyPoints: [
      "यह स्पष्टीकरण सीधे नेता की सत्यापित प्रोफाइल (🟢 Green Tick) से जारी होता है।",
      "इसमें परियोजना में हो रही देरी के कारण (जैसे बजट आवंटन, भूमि अधिग्रहण) स्पष्ट किए जाते हैं।",
      "नागरिक सीधे उस स्पष्टीकरण पर अपने सवाल पूछ सकते हैं।",
    ],
    englishKeyPoints: [
      "Clarifications originate from verified representative profiles (🟢 Green Badge).",
      "Provides transparent context regarding project delays, fund releases, or land acquisition.",
      "Constituents can engage directly through structured Q&A.",
    ],
    fullContent: [
      "यह सुविधा नेताओं और जनता के बीच पारदर्शिता को बढ़ावा देती है और अफ़वाहों को रोकती है।",
    ],
    englishFullContent: [
      "Promotes direct civic dialogue between elected officials and local voters while eliminating disinformation.",
    ],
    faqQuestions: [
      {
        question: "क्या स्पष्टीकरण की कानूनी वैधता होती है?",
        answer: "यह जन प्रतिनिधि का अधिकृत सार्वजनिक वक्तव्य होता है।",
        englishQuestion: "Is the clarification an official public statement?",
        englishAnswer: "Yes, it functions as the representative's official public record.",
      },
    ],
    tags: ["Clarification", "Leader Statement", "Green Tick", "स्पष्टीकरण"],
    englishTags: ["Official Clarification", "Leader Statement", "Representative Q&A", "Transparency"],
    readTimeMinutes: 2,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "Edit3",
  },

  // ==========================================
  // 4. RATINGS & REVIEWS (4 Articles)
  // ==========================================
  {
    id: "art_rating_01",
    slug: "system-score-explained",
    category: "ratings_and_reviews",
    categoryLabel: "Ratings & Reviews",
    categoryHindi: "रेटिंग व समीक्षा",
    title: "Leader System Score कैसे तय होता है?",
    englishTitle: "Understanding the 5-Pillar System Score (100 pts)",
    summary:
      "Open Desh पर हर जन प्रतिनिधि का स्कोर 5 मुख्य स्तंभों (प्रत्येक 20 अंक, कुल 100) के आधार पर तय होता है।",
    englishSummary:
      "Representative performance is calculated objectively across 5 core governance pillars (20 points each, Maximum 100).",
    keyPoints: [
      "1. Resolution Rate (20 pts): क्षेत्र की शिकायतों के निवारण का प्रतिशत।",
      "2. Project Delivery (20 pts): विकास योजनाओं और फंड का समय पर क्रियान्वयन।",
      "3. Legislative Activity (20 pts): सदन में उपस्थिति, पूछे गए प्रश्न और बिल।",
      "4. Transparency & Response (20 pts): जनता के मुद्दों पर त्वरित आधिकारिक जवाब।",
      "5. Citizen Feedback (20 pts): सत्यापित मतदाताओं की औसत स्टार रेटिंग।",
    ],
    englishKeyPoints: [
      "1. Grievance Resolution Rate (20 pts): Percentage of constituency issues solved.",
      "2. Project Delivery & MPLAD Fund (20 pts): On-time completion of local development works.",
      "3. Legislative Activity (20 pts): Assembly attendance, bills introduced, debates participated.",
      "4. Transparency & Accountability (20 pts): Response time to citizen queries and town halls.",
      "5. Citizen Sentiment & Ratings (20 pts): Normalized reviews from verified local voters.",
    ],
    fullContent: [
      "सिस्टम स्कोर पूरी तरह एल्गोरिदम द्वारा स्वचालित गणना पर आधारित है जिसमें किसी भी प्रकार का मानवीय पक्षपात संभव नहीं है।",
    ],
    englishFullContent: [
      "The System Score is computed dynamically through automated algorithms without manual bias or political manipulation.",
    ],
    faqQuestions: [
      {
        question: "क्या स्कोर तुरंत बदलता है?",
        answer: "हाँ, जैसे ही नई शिकायतें हल होती हैं या नई समीक्षाएं आती हैं, स्कोर रियल-टाइम अपडेट होता है।",
        englishQuestion: "Does the score update in real time?",
        englishAnswer: "Yes, score components recalculate dynamically as grievances resolve or ratings are submitted.",
      },
    ],
    tags: ["System Score", "5 Pillars", "Performance", "स्कोर गणना"],
    englishTags: ["System Score", "5-Pillar Rating", "Leader Evaluation", "Mathematical Index"],
    readTimeMinutes: 3,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "Calculator",
  },
  {
    id: "art_rating_02",
    slug: "how-to-rate-a-leader",
    category: "ratings_and_reviews",
    categoryLabel: "Ratings & Reviews",
    categoryHindi: "रेटिंग व समीक्षा",
    title: "Leader को Rate कैसे करें?",
    englishTitle: "How to Rate & Review an Elected Representative?",
    summary:
      "अपने स्थानीय सांसद या विधायक को 1 से 5 स्टार रेटिंग और निष्पक्ष समीक्षा देने की सरल प्रक्रिया।",
    englishSummary:
      "Step-by-step guide for verified constituency voters to submit objective 1-5 star ratings and reviews.",
    keyPoints: [
      "लीडर की प्रोफाइल पर जाएं और 'Rate Leader' बटन दबाएं।",
      "1 से 5 स्टार रेटिंग चुनें (1 = अत्यंत असंतोषजनक, 5 = उत्कृष्ट कार्य)।",
      "अपने अनुभव के आधार पर 100 शब्दों में विस्तृत समीक्षा लिखें।",
      "समीक्षा सबमिट करें; यह तुरंत पब्लिक फीड में जुड़ जाएगी।",
    ],
    englishKeyPoints: [
      "Navigate to the representative's profile and tap 'Rate Leader'.",
      "Select a rating from 1 to 5 stars (1 = Very Poor, 5 = Excellent).",
      "Write a constructive review highlighting local road, water, health, or school progress.",
      "Submit review to publish to the constituency rating ledger.",
    ],
    fullContent: [
      "समीक्षा लिखते समय शालीन भाषा का प्रयोग करें। अभद्र भाषा वाली समीक्षाएं सिस्टम द्वारा स्वतः ब्लॉक हो जाती हैं।",
    ],
    englishFullContent: [
      "Ensure reviews maintain constructive, non-abusive civic language adhering to Open Desh standards.",
    ],
    faqQuestions: [
      {
        question: "क्या मैं अपनी रेटिंग बाद में बदल सकता हूँ?",
        answer: "हाँ, यदि नेता का प्रदर्शन बेहतर होता है, तो आप अपनी रेटिंग अपडेट कर सकते हैं।",
        englishQuestion: "Can I edit my rating later?",
        englishAnswer: "Yes, you can update your rating as your representative's performance evolves.",
      },
    ],
    tags: ["Rate Leader", "Stars", "Review", "रेटिंग दें"],
    englishTags: ["Rate Representative", "Constituent Review", "Star Rating", "Public Accountability"],
    readTimeMinutes: 2,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "Star",
  },
  {
    id: "art_rating_03",
    slug: "1-voter-1-review-rule",
    category: "ratings_and_reviews",
    categoryLabel: "Ratings & Reviews",
    categoryHindi: "रेटिंग व समीक्षा",
    title: "1-Voter-1-Review Rule",
    englishTitle: "1-Voter-1-Review Integrity Protocol",
    summary:
      "फर्जी रेटिंग और बॉट से सुरक्षा के लिए Open Desh '1-नागरिक-1-समीक्षा' का कड़ा नियम लागू करता है।",
    englishSummary:
      "To prevent spam and astroturfing, Open Desh enforces a strict 1-voter-1-review rule per elected leader.",
    keyPoints: [
      "एक मतदाता एक नेता को केवल एक ही सक्रिय समीक्षा दे सकता है।",
      "नागरिक केवल अपने पंजीकृत राज्य/संसदीय क्षेत्र के नेताओं को ही वोट दे सकते हैं।",
      "समीक्षाओं में बॉट गतिविधि को रोकने के लिए एआई आधारित स्पैम डिटेक्शन सक्रिय रहता है।",
    ],
    englishKeyPoints: [
      "Each authenticated citizen can maintain exactly one active review per representative.",
      "Weighted review priority is granted to verified voters registered within the leader's constituency.",
      "AI spam filters actively detect and purge coordinated bot reviews.",
    ],
    fullContent: [
      "यह नियम सुनिश्चित करता है कि रेटिंग किसी राजनीतिक आईटी सेल द्वारा प्रभावित न हो बल्कि वास्तविक जनता की आवाज हो।",
    ],
    englishFullContent: [
      "Protects scorecards against political astroturfing and reflects genuine constituent sentiment.",
    ],
    faqQuestions: [
      {
        question: "क्या दूसरे राज्य के नेता को रेटिंग दी जा सकती है?",
        answer: "आप समीक्षा पढ़ सकते हैं लेकिन रेटिंग केवल अपने गृह क्षेत्र के जन प्रतिनिधियों को ही दे सकते हैं।",
        englishQuestion: "Can I rate representatives from other states?",
        englishAnswer: "You can view out-of-state scorecards, but ratings are weighted strictly by constituency voters.",
      },
    ],
    tags: ["Fairness", "1-Voter-1-Review", "Integrity", "समीक्षा नियम"],
    englishTags: ["Integrity", "1-Voter-1-Review", "Anti-Bot Protection", "Civic Democracy"],
    readTimeMinutes: 2,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "ShieldCheck",
  },
  {
    id: "art_rating_04",
    slug: "official-representative-response",
    category: "ratings_and_reviews",
    categoryLabel: "Ratings & Reviews",
    categoryHindi: "रेटिंग व समीक्षा",
    title: "Representative Official Response",
    englishTitle: "Leader Official Response to Citizen Reviews",
    summary:
      "जन प्रतिनिधि अपने ऊपर की गई समीक्षाओं पर अपना पक्ष और स्पष्टीकरण आधिकारिक रूप से दे सकते हैं।",
    englishSummary:
      "Elected leaders have a dedicated right of reply to provide official clarifications under citizen reviews.",
    keyPoints: [
      "आधिकारिक जवाब पर ग्रीन बैज (🟢 Green Tick) प्रदर्शित होता है।",
      "नेता बता सकते हैं कि समस्या पर क्या प्रगति हुई है और कब तक काम पूरा होगा।",
      "यह सीधा संवाद लोकतंत्र को मजबूत बनाता है।",
    ],
    englishKeyPoints: [
      "Official responses are badged with the Green Tick (🟢).",
      "Representatives can detail progress milestones, budget constraints, or site inspections.",
      "Fosters transparent, direct constituent engagement.",
    ],
    fullContent: [
      "नेताओं के आधिकारिक जवाब भी सार्वजनिक रिकॉर्ड में हमेशा सुरक्षित रहते हैं।",
    ],
    englishFullContent: [
      "Official representative replies are archived in the permanent public ledger.",
    ],
    faqQuestions: [
      {
        question: "क्या नेता का जवाब आने पर मुझे सूचना मिलती है?",
        answer: "हाँ, यदि नेता ने आपकी समीक्षा पर जवाब दिया है, तो आपको तुरंत पुश नोटिफिकेशन मिलेगा।",
        englishQuestion: "Do I get notified when a leader replies to my review?",
        englishAnswer: "Yes, you will receive an instant notification alert.",
      },
    ],
    tags: ["Response", "Green Tick", "Dialogue", "नेता का जवाब"],
    englishTags: ["Official Reply", "Leader Response", "Direct Dialogue", "Representative Response"],
    readTimeMinutes: 2,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "MessageSquare",
  },

  // ==========================================
  // 5. PUBLIC BUDGET (3 Articles)
  // ==========================================
  {
    id: "art_budget_01",
    slug: "budget-per-capita-analysis",
    category: "public_budget",
    categoryLabel: "Public Budget",
    categoryHindi: "सार्वजनिक बजट व व्यय",
    title: "Per-Capita Budget क्या है?",
    englishTitle: "What is Per-Capita Budget Analysis?",
    summary:
      "Open Desh देश के ₹48+ लाख करोड़ के बजट को सीधे प्रति-नागरिक हिस्सेदारी में बदलकर सरल बनाता है।",
    englishSummary:
      "Open Desh demystifies India's ₹48+ Lakh Crore public budgets by translating them into actionable per-capita tax allocation figures.",
    keyPoints: [
      "केंद्रीय बजट: ₹48.21 लाख करोड़ (प्रति नागरिक ~₹34,435)।",
      "राज्य बजट: आपके राज्य में स्वास्थ्य, शिक्षा, सड़क और पुलिस पर प्रति व्यक्ति कितना खर्च होता है।",
      "जिला व पंचायत स्तर पर फंड का प्रवाह और विकास कार्यों की लागत।",
    ],
    englishKeyPoints: [
      "Union Budget: ₹48.21 Lakh Crore (~₹34,435 per citizen).",
      "State Budgets: Granular per-capita breakdown across Health, Education, Roads, and Policing.",
      "District and Gram Panchayat fund allocations and expenditure tracking.",
    ],
    fullContent: [
      "पारंपरिक बजट दस्तावेज हजारों पन्नों के जटिल आंकड़ों में होते हैं। Open Desh इसे हर आम नागरिक के समझने योग्य इंटरैक्टिव चार्ट्स में प्रस्तुत करता है।",
    ],
    englishFullContent: [
      "Transforms dense thousand-page government budget gazettes into accessible, real-time interactive visualizers.",
    ],
    faqQuestions: [
      {
        question: "बजट का डेटा कहाँ से आता है?",
        answer: "यह डेटा वित्त मंत्रालय, नियंत्रक एवं महालेखापरीक्षक (CAG) और राज्य बजट अभिलेखों से सीधे लिया जाता है।",
        englishQuestion: "What is the source of budget figures?",
        englishAnswer: "All figures are pulled from the Ministry of Finance, CAG reports, and state finance departments.",
      },
    ],
    tags: ["Per Capita", "Budget", "Finance", "प्रति व्यक्ति बजट"],
    englishTags: ["Per-Capita Budget", "Public Finance", "Tax Allocation", "Union Budget"],
    readTimeMinutes: 3,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "PieChart",
  },
  {
    id: "art_budget_02",
    slug: "comparing-state-budgets",
    category: "public_budget",
    categoryLabel: "Public Budget",
    categoryHindi: "सार्वजनिक बजट व व्यय",
    title: "State Budget Comparison",
    englishTitle: "How to Compare State Budgets & Spending?",
    summary:
      "भारत के 28 राज्यों और 8 केंद्र शासित प्रदेशों के बजट की तुलना करें और जानें कि कौन सा राज्य शिक्षा व स्वास्थ्य पर अधिक खर्च कर रहा है।",
    englishSummary:
      "Compare fiscal priorities and per-capita spending across all 28 Indian States and 8 Union Territories.",
    keyPoints: [
      "बजट मॉड्यूल में 'Compare States' विकल्प चुनें।",
      "दो या अधिक राज्यों (उदा. झारखंड vs बिहार vs महाराष्ट्र) का चयन करें।",
      "शिक्षा, स्वास्थ्य, इंफ्रास्ट्रक्चर और प्रति-व्यक्ति कर्ज का तुलनात्मक ग्राफ देखें।",
    ],
    englishKeyPoints: [
      "Select 'Compare States' in the Public Budget tab.",
      "Choose any two or more states (e.g., Jharkhand vs. Bihar vs. Maharashtra).",
      "Compare per-capita health, education, infrastructure spending, and state debt ratios.",
    ],
    fullContent: [
      "यह तुलना नागरिकों को यह जानने में सक्षम बनाती है कि उनके टैक्स के पैसे का उपयोग अन्य राज्यों की तुलना में कितना बेहतर हो रहा है।",
    ],
    englishFullContent: [
      "Enables citizens to benchmark state governance and understand fiscal efficiency relative to other regions.",
    ],
    faqQuestions: [
      {
        question: "क्या बजट के आंकड़े हर साल अपडेट होते हैं?",
        answer: "हाँ, हर वर्ष बजट पेश होने के 24 घंटे के भीतर नए आंकड़े अपडेट कर दिए जाते हैं।",
        englishQuestion: "How frequently is budget data updated?",
        englishAnswer: "Budget tables are updated within 24 hours of official state/union budget presentations.",
      },
    ],
    tags: ["State Budget", "Comparison", "States", "राज्य बजट तुलना"],
    englishTags: ["State Comparison", "Fiscal Metrics", "Education Spending", "Healthcare Allocation"],
    readTimeMinutes: 2,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "TrendingUp",
  },
  {
    id: "art_budget_03",
    slug: "gram-panchayat-fund-tracking",
    category: "public_budget",
    categoryLabel: "Public Budget",
    categoryHindi: "सार्वजनिक बजट व व्यय",
    title: "Gram Panchayat Fund Tracking",
    englishTitle: "Gram Panchayat & Local Body Fund Tracking",
    summary:
      "15वें वित्त आयोग (15th FC) और मनरेगा (MGNREGA) के तहत आपकी ग्राम पंचायत को मिले फंड और उनके खर्च की जांच करें।",
    englishSummary:
      "Track 15th Finance Commission grants and MGNREGA development funds allocated to your Gram Panchayat.",
    keyPoints: [
      "सर्च बार में अपना राज्य, जिला, ब्लॉक और ग्राम पंचायत चुनें।",
      "पेयजल, स्वच्छता, सोलर लाइट और पक्की नाली के लिए स्वीकृत राशि देखें।",
      "कार्य पूर्णता प्रमाण पत्र और खर्च का ऑडिट रिपोर्ट डाउनलोड करें।",
    ],
    englishKeyPoints: [
      "Select your State, District, Block, and Gram Panchayat.",
      "View sanctioned amounts for drinking water, paved drains, solar lights, and sanitation.",
      "Access social audit records and physical completion status.",
    ],
    fullContent: [
      "ग्राम पंचायत स्तर पर पारदर्शिता आने से ग्रामीण क्षेत्रों में भ्रष्टाचार पर प्रभावी अंकुश लगता है।",
    ],
    englishFullContent: [
      "Empowers rural citizens with granular financial transparency to eliminate grassroots leakage.",
    ],
    faqQuestions: [
      {
        question: "यदि पंचायत में काम हुए बिना फंड निकाल लिया जाए तो?",
        answer: "आप Open Desh पर 'Corruption/Fraud' श्रेणी में शिकायत दर्ज कर सीधे राज्य विजिलेंस को सूचित कर सकते हैं।",
        englishQuestion: "What if funds are embezzled without on-ground work?",
        englishAnswer: "File an instant grievance under 'Corruption / Vigilance' with photographic site evidence.",
      },
    ],
    tags: ["Gram Panchayat", "15th FC", "Village Fund", "पंचायत फंड"],
    englishTags: ["Gram Panchayat", "Local Governance", "Panchayat Funds", "Rural Transparency"],
    readTimeMinutes: 2,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "BarChart3",
  },

  // ==========================================
  // 6. ACCOUNT & PRIVACY (3 Articles)
  // ==========================================
  {
    id: "art_account_01",
    slug: "profile-and-privacy-settings",
    category: "account_and_privacy",
    categoryLabel: "Account & Privacy",
    categoryHindi: "खाता व गोपनीयता",
    title: "Profile & Privacy Settings",
    englishTitle: "Profile Management & Privacy Controls",
    summary:
      "अपनी प्रोफाइल को प्रबंधित करने, नाम बदलने और व्यक्तिगत विवरण को सुरक्षित रखने की गाइड।",
    englishSummary:
      "Complete guide to managing your citizen profile, customizing display preferences, and securing personal data.",
    keyPoints: [
      "साइडबार में 'Profile' पर क्लिक करके 'Edit Profile' चुनें।",
      "आप अपना उपनाम (Display Name), बायो और निर्वाचन क्षेत्र बदल सकते हैं।",
      "गोपनीयता सेटिंग्स से तय करें कि आपका ईमेल या फोन नंबर सार्वजनिक होगा या नहीं।",
    ],
    englishKeyPoints: [
      "Access 'Profile' from the sidebar and select 'Edit Profile'.",
      "Customize your display name, civic bio, and home constituency.",
      "Toggle privacy controls to ensure phone numbers and email remain private.",
    ],
    fullContent: [
      "Open Desh कभी भी आपका व्यक्तिगत फोन नंबर या ईमेल सार्वजनिक रूप से प्रदर्शित नहीं करता।",
    ],
    englishFullContent: [
      "Open Desh strictly adheres to privacy standards and never reveals personal contact credentials publicly.",
    ],
    faqQuestions: [
      {
        question: "क्या मैं अपना पंजीकृत निर्वाचन क्षेत्र बदल सकता हूँ?",
        answer: "हाँ, यदि आप किसी अन्य शहर में स्थानांतरित होते हैं, तो प्रोफाइल सेटिंग्स से वॉर्ड बदल सकते हैं।",
        englishQuestion: "Can I update my registered constituency?",
        englishAnswer: "Yes, you can update your district and ward if you relocate.",
      },
    ],
    tags: ["Profile", "Privacy", "Settings", "प्रोफाइल"],
    englishTags: ["Profile Settings", "Privacy Controls", "Data Security", "Account Customization"],
    readTimeMinutes: 2,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "User",
  },
  {
    id: "art_account_02",
    slug: "secure-authentication",
    category: "account_and_privacy",
    categoryLabel: "Account & Privacy",
    categoryHindi: "खाता व गोपनीयता",
    title: "Password & Account Security",
    englishTitle: "Password Security & Multi-Factor Protection",
    summary:
      "अपने अकाउंट को हैकिंग और अनधिकृत एक्सेस से सुरक्षित रखने के सुरक्षा उपाय।",
    englishSummary:
      "Best practices for safeguarding your citizen account with robust passwords and secure session handling.",
    keyPoints: [
      "हमेशा एक मजबूत पासवर्ड (अक्षर, अंक और विशेष चिह्न) का उपयोग करें।",
      "गूगल लॉगिन (Google Sign-In) सबसे सुरक्षित और तेज़ विकल्प है।",
      "संदिग्ध गतिविधि दिखने पर 'Sign Out All Devices' का प्रयोग करें।",
    ],
    englishKeyPoints: [
      "Use strong alphanumeric passwords with special characters.",
      "Google One-Click Auth provides enhanced enterprise-grade session protection.",
      "Use 'Sign Out from All Devices' if you suspect unauthorized access.",
    ],
    fullContent: [
      "Open Desh आधुनिक फायरबेस सुरक्षा नियमों का उपयोग करता है जो आपके डेटा को पूरी तरह एन्क्रिप्टेड रखते हैं।",
    ],
    englishFullContent: [
      "All account authentication is managed securely via Firebase Auth with salted cryptographic hashing.",
    ],
    faqQuestions: [
      {
        question: "यदि पासवर्ड भूल जाऊं तो क्या करें?",
        answer: "लॉगिन पेज पर 'Forgot Password' पर क्लिक करें और अपने ईमेल पर रीसेट लिंक प्राप्त करें।",
        englishQuestion: "How do I reset a forgotten password?",
        englishAnswer: "Click 'Forgot Password' on the login modal to receive a secure recovery email.",
      },
    ],
    tags: ["Security", "Password", "Auth", "सुरक्षा"],
    englishTags: ["Account Security", "Password Reset", "Firebase Auth", "Data Privacy"],
    readTimeMinutes: 2,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "Key",
  },
  {
    id: "art_account_03",
    slug: "data-privacy-and-retention",
    category: "account_and_privacy",
    categoryLabel: "Account & Privacy",
    categoryHindi: "खाता व गोपनीयता",
    title: "Citizen Data Protection Policy",
    englishTitle: "Citizen Data Privacy & Digital Rights Policy",
    summary:
      "Open Desh नागरिकों के डेटा संरक्षण अधिनियम (DPDP Act 2023) का पूर्ण अनुपालन करता है।",
    englishSummary:
      "Open Desh strictly complies with the Digital Personal Data Protection (DPDP) Act 2023 standards.",
    keyPoints: [
      "आपका डेटा किसी तीसरे पक्ष या विज्ञापन एजेंसी को नहीं बेचा जाता।",
      "आप किसी भी समय अपना खाता और संबंधित डेटा हटाने (Delete Account) का अनुरोध कर सकते हैं।",
      "शिकायतें सार्वजनिक रिकॉर्ड के रूप में केवल जनहित के लिए प्रदर्शित होती हैं।",
    ],
    englishKeyPoints: [
      "Citizen data is strictly confidential and never sold to third-party ad brokers.",
      "Users possess the statutory Right to Erasure / Account Deletion at any time.",
      "Grievance archives serve public civic interest under transparent open-data principles.",
    ],
    fullContent: [
      "नागरिकों की निजता और विश्वास हमारी सर्वोच्च प्राथमिकता है।",
    ],
    englishFullContent: [
      "Citizen trust, privacy, and statutory democratic safety are the non-negotiable core pillars of Open Desh.",
    ],
    faqQuestions: [
      {
        question: "क्या मैं अपना डेटा डाउनलोड कर सकता हूँ?",
        answer: "हाँ, सेटिंग्स मेनू में 'Export My Civic Data' के जरिए अपनी सभी शिकायतों की प्रति प्राप्त कर सकते हैं।",
        englishQuestion: "Can I export my civic data?",
        englishAnswer: "Yes, you can download a full archive of your submitted reports under Account Settings.",
      },
    ],
    tags: ["DPDP Act", "Privacy", "Data Protection", "गोपनीयता नीति"],
    englishTags: ["DPDP Act 2023", "Data Rights", "Privacy Policy", "GDPR Standards"],
    readTimeMinutes: 2,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "ShieldAlert",
  },

  // ==========================================
  // 7. SAFETY & POLICIES (3 Articles)
  // ==========================================
  {
    id: "art_safety_01",
    slug: "community-guidelines",
    category: "safety_and_policies",
    categoryLabel: "Safety & Policies",
    categoryHindi: "सुरक्षा व दिशानिर्देश",
    title: "Community Guidelines & Civic Standards",
    englishTitle: "Community Guidelines & Civic Decorum",
    summary:
      "Open Desh पर स्वस्थ, मर्यादित और समाधान-उन्मुख माहौल बनाए रखने के लिए अनिवार्य नियम।",
    englishSummary:
      "Mandatory civic standards and etiquette to maintain a constructive, solution-oriented discourse on Open Desh.",
    keyPoints: [
      "अभद्र, अश्लील या हिंसा भड़काने वाली भाषा का प्रयोग पूरी तरह प्रतिबंधित है।",
      "धर्म, जाति, लिंग या संप्रदाय के आधार पर नफरत फैलाने वाले पोस्ट तत्काल हटा दिए जाएंगे।",
      "हमेशा बुनियादी ढांचे की खामियों और प्रशासनिक सुधार पर केंद्रित रहें।",
    ],
    englishKeyPoints: [
      "Abusive, defamatory, or inciteful language is strictly prohibited.",
      "Hate speech targeting religion, caste, gender, or community results in instant suspension.",
      "Focus posts on verifiable civic infrastructure defects and administrative solutions.",
    ],
    fullContent: [
      "कम्युनिटी गाइडलाइन्स का उल्लंघन करने वाले खातों को 24 घंटे के भीतर निलंबित किया जा सकता है।",
    ],
    englishFullContent: [
      "Violations of community standards trigger automatic automated moderation flags and account restrictions.",
    ],
    faqQuestions: [
      {
        question: "अनुचित पोस्ट दिखने पर क्या करें?",
        answer: "पोस्ट के मेनू में 'Report Abuse / Flag' बटन दबाएं, हमारी मॉडरेशन टीम 1 घंटे में समीक्षा करेगी।",
        englishQuestion: "How do I report an abusive post?",
        englishAnswer: "Click 'Report Post' on the post menu; our moderation team reviews flags within 1 hour.",
      },
    ],
    tags: ["Guidelines", "Community", "Rules", "कम्युनिटी नियम"],
    englishTags: ["Community Guidelines", "Civic Standards", "Moderation Rules", "Safety"],
    readTimeMinutes: 2,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "FileCheck",
  },
  {
    id: "art_safety_02",
    slug: "preventing-fake-reports",
    category: "safety_and_policies",
    categoryLabel: "Safety & Policies",
    categoryHindi: "सुरक्षा व दिशानिर्देश",
    title: "Prevention of Fake Complaints",
    englishTitle: "Zero Tolerance Policy on Fake Grievances",
    summary:
      "प्रशासन का समय व्यर्थ करने वाली दुर्भावनापूर्ण या फर्जी रिपोर्टिंग पर Open Desh की सख्त नीति।",
    englishSummary:
      "Strict policy against malicious or fabricated grievances that waste municipal resources.",
    keyPoints: [
      "इंटरनेट से चुराई गई या पुरानी तस्वीरों का प्रयोग न करें।",
      "फर्जी लोकेशन डालने पर सिस्टम द्वारा अकाउंट की विश्वसनीयता घटा दी जाती है।",
      "लगातार झूठी शिकायतें दर्ज करने पर आईपी और डिवाइस हमेशा के लिए ब्लॉक कर दिए जाएंगे।",
    ],
    englishKeyPoints: [
      "Do not upload stock, unrelated, or outdated internet photos.",
      "Falsifying GPS coordinates reduces user trust score and triggers administrative review.",
      "Repeated fabricated claims lead to permanent device and account bans.",
    ],
    fullContent: [
      "विश्वसनीयता ही Open Desh की सबसे बड़ी ताकत है। हम हर रिपोर्ट के डिजिटल फिंगरप्रिंट की पुष्टि करते हैं।",
    ],
    englishFullContent: [
      "Civic credibility is our highest priority. All submitted evidence is cryptographically stamped and audited.",
    ],
    faqQuestions: [
      {
        question: "क्या फर्जी रिपोर्ट करने पर कानूनी कार्रवाई हो सकती है?",
        answer: "हाँ, सरकारी मशीनरी को गुमराह करने पर भारतीय कानून के तहत कार्रवाई हो सकती है।",
        englishQuestion: "Can filing fake complaints lead to legal penalties?",
        englishAnswer: "Misleading public emergency services is punishable under statutory Indian laws.",
      },
    ],
    tags: ["Fake Report", "Zero Tolerance", "Verification", "फर्जी शिकायत पर रोक"],
    englishTags: ["Anti-Spam", "Fake Grievance Policy", "Civic Integrity", "Account Penalties"],
    readTimeMinutes: 2,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "AlertOctagon",
  },
  {
    id: "art_safety_03",
    slug: "anti-corruption-whistleblower-policy",
    category: "safety_and_policies",
    categoryLabel: "Safety & Policies",
    categoryHindi: "सुरक्षा व दिशानिर्देश",
    title: "Anti-Corruption & Whistleblower Policy",
    englishTitle: "Anti-Corruption & Whistleblower Protection Protocol",
    summary:
      "रिश्वतखोरी और भ्रष्टाचार के मामलों में शिकायतकर्ता की सुरक्षा और कानूनी प्रक्रिया की जानकारी।",
    englishSummary:
      "Protective guidelines for citizens exposing bribery and corrupt practices under Whistleblower Protection frameworks.",
    keyPoints: [
      "भ्रष्टाचार निवारण अधिनियम 1988 (Prevention of Corruption Act) के तहत शिकायत दर्ज करने की विधि।",
      "संवेदनशील मामलों में सुरक्षित व्हिसलब्लोअर रिपोर्टिंग का विकल्प।",
      "एंटी-करप्शन ब्यूरो (ACB) और केंद्रीय सतर्कता आयोग (CVC) को सीधी फॉरवर्डिंग।",
    ],
    englishKeyPoints: [
      "Filing procedures under the Prevention of Corruption Act 1988.",
      "Secure encrypted channel for high-risk whistleblower submissions.",
      "Direct escalations to State Anti-Corruption Bureaus (ACB) and Central Vigilance Commission (CVC).",
    ],
    fullContent: [
      "भ्रष्टाचार मुक्त भारत के निर्माण में हर नागरिक की सुरक्षा हमारी जिम्मेदारी है।",
    ],
    englishFullContent: [
      "Open Desh is committed to empowering citizens with secure, fearless anti-corruption reporting mechanisms.",
    ],
    faqQuestions: [
      {
        question: "भ्रष्टाचार की शिकायत पर कार्रवाई कौन करता है?",
        answer: "संबंधित राज्य का एंटी-करप्शन ब्यूरो (ACB) और विजिलेंस विभाग सीधे जांच शुरू करते हैं।",
        englishQuestion: "Which agency investigates corruption reports?",
        englishAnswer: "The State Anti-Corruption Bureau (ACB) and Vigilance Directorate initiate direct inquiries.",
      },
    ],
    tags: ["Corruption", "Whistleblower", "ACB", "CVC", "भ्रष्टाचार विरोधी"],
    englishTags: ["Anti-Corruption", "Whistleblower", "Vigilance", "ACB Hotline"],
    readTimeMinutes: 3,
    sourceUrl: "https://help.opendesh.com",
    lastUpdated: "26 Aug 2026",
    iconName: "Flame",
  },
];
