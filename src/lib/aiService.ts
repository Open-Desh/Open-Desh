import { RegisteredAuthority } from "./firestoreSync";

const WORKER_AI_ENDPOINT = "https://oj.opendesh.workers.dev";

export interface AIRefineResponse {
  refinedText: string;
  summary?: string;
  categorySuggestion?: string;
  detectedIssue?: string;
}

/**
 * Calls the Cloudflare Worker AI endpoint (https://oj.opendesh.workers.dev)
 * to refine a citizen's raw complaint into a natural, high-impact, articulate civic report.
 * NO static templates or robotic bracket headers.
 */
export async function refineCivicReportTextWithAI(
  rawText: string,
  category?: string,
  location?: string
): Promise<string> {
  const trimmed = rawText.trim();
  if (!trimmed) return "";

  const systemPrompt = `You are Open Nation's Civic AI Assistant. The user is a citizen in India reporting an actual municipal/civic/infrastructure problem.
Your task is to take the citizen's exact words and rewrite it into a well-crafted, polite, high-impact, and compelling grievance for public governance feed.
Rules:
1. NEVER add generic bracket titles like "[URGENT CIVIC NOTICE]" or "[OFFICIAL REPORT]".
2. If the user wrote in Hindi/Hinglish (e.g., "Road sahi nahi" or "pani nahi aa raha"), refine it in natural, impactful Hindi or clean Hinglish.
3. If the user wrote in English, refine it into professional, clear English.
4. Highlight the exact problem, the location if mentioned, and the public safety/daily life impact on citizens.
5. Keep it concise (2-4 sentences max), punchy, and respectful.
6. Return ONLY the refined grievance text without intro/outro chat.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(WORKER_AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: `Rewrite this civic issue into an impactful, articulate public grievance:\nLocation: ${location || "Local Area"}\nCategory: ${category || "Civic"}\nCitizen says: "${trimmed}"`,
        text: trimmed,
        category: category,
        location: location,
        systemInstruction: systemPrompt,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please refine this citizen report: "${trimmed}". Location: ${location || "Local Area"}. Category: ${category || "General"}` }
        ]
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const resultText =
        data.response ||
        data.refinedText ||
        data.text ||
        data.result ||
        data.choices?.[0]?.message?.content ||
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        (typeof data === "string" ? data : "");

      if (resultText && typeof resultText === "string" && resultText.trim().length > 5) {
        // Strip any accidental boilerplate markdown titles if returned
        let clean = resultText.trim();
        clean = clean.replace(/^\[.*?\]\s*/i, "");
        clean = clean.replace(/^(URGENT NOTICE|CIVIC ALERT|OFFICIAL NOTICE):\s*/i, "");
        return clean;
      }
    }
  } catch (error) {
    console.warn("Worker AI call notice, using dynamic natural civic refiner:", error);
  }

  // Dynamic natural language refiner fallback
  return naturalCivicRefineFallback(trimmed, category, location);
}

/**
 * Natural dynamic civic refinement without rigid templates
 */
function naturalCivicRefineFallback(text: string, category?: string, location?: string): string {
  const locStr = location ? ` in ${location}` : "";
  const isHindiOrHinglish = /[\u0900-\u097F]|sahi|nahi|gaddha|paani|pani|sadak|bijli|kachra|ha\b|hai\b|karo\b|raha\b|kharab\b/i.test(text);

  if (isHindiOrHinglish) {
    const locHindi = location ? `${location} क्षेत्र में ` : "";
    if (/road|sadak|gaddha|pothole/i.test(text)) {
      return `${locHindi}सड़क की जर्जर हालत और गहरे गड्ढों के कारण आवागमन में भारी असुविधा व दुर्घटना का खतरा बना हुआ है। संबंधित विभाग से तत्काल संज्ञान लेकर पक्की मरम्मत कराने का अनुरोध है।`;
    }
    if (/water|pani|jal|pipeline|drain|nala/i.test(text)) {
      return `${locHindi}पानी की गंभीर समस्या/जलभराव से स्थानीय निवासियों का दैनिक जीवन प्रभावित हो रहा है। जलापूर्ति एवं ड्रेनेज लाइन की तत्काल जांच कर समस्या का समाधान किया जाए।`;
    }
    if (/bijli|power|current|transformer|light/i.test(text)) {
      return `${locHindi}बिजली आपूर्ति बाधित होने एवं फॉल्ट के कारण नागरिकों को परेशानी हो रही है। विद्युत विभाग से प्राथमिकता के आधार पर त्वरित समाधान की मांग है।`;
    }
    if (/kachra|garbage|safai|swachh/i.test(text)) {
      return `${locHindi}कूड़े के ढेर व सफाई की अनदेखी से इलाके में अस्वच्छता और बीमारियों का खतरा बढ़ रहा है। नगर निगम स्वच्छता शाखा से तत्काल सफाई अभियान चलाने की अपील है।`;
    }
    return `${locHindi}${text}। इस गंभीर समस्या पर संबंधित प्राधिकारियों से त्वरित संज्ञान व जमीनी कार्रवाई की मांग की जाती है।`;
  }

  // English natural enhancement
  const cleaned = text.replace(/\s+/g, " ").trim();
  const startsWithCapital = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  const baseSentence = /[.!?]$/.test(startsWithCapital) ? startsWithCapital : `${startsWithCapital}.`;

  if (/road|pothole|infra|bridge|asphalt/i.test(text)) {
    return `${baseSentence} Critical road surface deterioration${locStr} is causing severe disruption and severe safety hazards for commuters. Requesting immediate inspection and remedial resurfacing.`;
  }
  if (/water|drain|sewer|pipe|leak/i.test(text)) {
    return `${baseSentence} Severe water distribution/drainage disruption${locStr} impacting resident households. Requesting prompt technical intervention and water line restoration.`;
  }
  if (/electric|power|transformer|wire|outage/i.test(text)) {
    return `${baseSentence} Power supply irregularity and feeder issues reported${locStr}. Requesting the electricity distribution utility to expedite repair work.`;
  }
  if (/garbage|waste|sanitation|dump|clean/i.test(text)) {
    return `${baseSentence} Accumulation of municipal waste and poor sanitation conditions observed${locStr}. Requesting the municipal sanitation team for urgent cleanup.`;
  }

  return `${baseSentence} Requesting the concerned department to take prompt cognizance and initiate necessary ground action${locStr}.`;
}

/**
 * State & Union Territory Geolocation Jurisdiction Recognizer
 */
interface LocationJurisdiction {
  state: "haryana" | "delhi" | "jharkhand" | "maharashtra" | "karnataka" | "uttar_pradesh" | "tamil_nadu" | "telangana" | "west_bengal" | "national" | "unknown";
  cities: string[];
  isNationalHighway: boolean;
}

function detectLocationJurisdiction(locationStr: string, text: string): LocationJurisdiction {
  const combined = `${locationStr} ${text}`.toLowerCase();

  const isNationalHighway = /nh[-\s]?\d+|national highway|expressway|morth|toll plaza|gt road/i.test(combined);

  // Haryana / NCR
  if (/haryana|gurgaon|gurugram|sohna|faridabad|manesar|rewari|panipat|rohtak|karnal|ambala|panchkula/i.test(combined)) {
    return {
      state: "haryana",
      cities: ["gurugram", "gurgaon", "sohna", "faridabad", "manesar"],
      isNationalHighway,
    };
  }

  // Delhi / NCT
  if (/delhi|new delhi|nct|rohini|dwarka|saket|karol bagh|connaught|laxmi nagar|janakpuri|pitampura/i.test(combined)) {
    return {
      state: "delhi",
      cities: ["delhi", "new delhi", "rohini", "dwarka"],
      isNationalHighway,
    };
  }

  // Jharkhand
  if (/jharkhand|ranchi|dhanbad|jamshedpur|bokaro|deoghar|hazaribagh|giridih|kanke|harmu|doranda/i.test(combined)) {
    return {
      state: "jharkhand",
      cities: ["ranchi", "dhanbad", "jamshedpur", "bokaro"],
      isNationalHighway,
    };
  }

  // Maharashtra
  if (/maharashtra|mumbai|pune|nagpur|thane|navi mumbai|andheri|bandra|nashik/i.test(combined)) {
    return {
      state: "maharashtra",
      cities: ["mumbai", "pune", "nagpur", "thane"],
      isNationalHighway,
    };
  }

  // Karnataka
  if (/karnataka|bangalore|bengaluru|mysore|hubli|mangalore|whitefield|koramangala|indiranagar/i.test(combined)) {
    return {
      state: "karnataka",
      cities: ["bengaluru", "bangalore", "mysore"],
      isNationalHighway,
    };
  }

  // Uttar Pradesh
  if (/uttar pradesh|\bup\b|noida|greater noida|ghaziabad|lucknow|kanpur|varanasi|agra|meerut/i.test(combined)) {
    return {
      state: "uttar_pradesh",
      cities: ["noida", "ghaziabad", "lucknow", "kanpur"],
      isNationalHighway,
    };
  }

  return {
    state: isNationalHighway ? "national" : "unknown",
    cities: [],
    isNationalHighway,
  };
}

/**
 * AI & Rule-based Department Decider:
 * Evaluates the report text, location, and category against ONLY authentic,
 * registered profiles present in the Firestore/App database.
 * 
 * CRITICAL RULES:
 * 1. Checks Location Jurisdiction: Never tags a Jharkhand department for a Haryana/Delhi issue!
 * 2. Checks Category: Roads, Water, Electricity, Sanitation, Transport, Corruption.
 * 3. Checks Registered DB Profiles: If no registered profile exists in DB for that state/department, returns ONLY matching valid profiles or none.
 * 4. NEVER force-tags an unrelated state authority!
 */
export function determineResponsibleAuthorities(
  text: string,
  category: string,
  availableAuthorities: RegisteredAuthority[],
  locationStr: string = ""
): RegisteredAuthority[] {
  if (!availableAuthorities || availableAuthorities.length === 0) {
    return [];
  }

  const lowerText = text.toLowerCase();
  const lowerCat = (category || "").toLowerCase();
  const jurisdiction = detectLocationJurisdiction(locationStr, text);

  // Issue category detection
  const isRoadInfra =
    lowerCat.includes("infra") ||
    lowerCat.includes("road") ||
    lowerText.includes("road") ||
    lowerText.includes("sadak") ||
    lowerText.includes("pothole") ||
    lowerText.includes("gaddha") ||
    lowerText.includes("bridge") ||
    lowerText.includes("flyover") ||
    lowerText.includes("tar") ||
    lowerText.includes("bitumen") ||
    lowerText.includes("highway") ||
    lowerText.includes("expressway");

  const isWaterSupply =
    lowerCat.includes("water") ||
    lowerText.includes("water") ||
    lowerText.includes("pani") ||
    lowerText.includes("pipeline") ||
    lowerText.includes("leak") ||
    lowerText.includes("sewage") ||
    lowerText.includes("drain") ||
    lowerText.includes("nala") ||
    lowerText.includes("contamination") ||
    lowerText.includes("jal");

  const isElectricity =
    lowerCat.includes("electr") ||
    lowerCat.includes("power") ||
    lowerText.includes("power") ||
    lowerText.includes("bijli") ||
    lowerText.includes("transformer") ||
    lowerText.includes("spark") ||
    lowerText.includes("outage") ||
    lowerText.includes("wire") ||
    lowerText.includes("voltage") ||
    lowerText.includes("current");

  const isSanitation =
    lowerCat.includes("sanit") ||
    lowerCat.includes("waste") ||
    lowerText.includes("garbage") ||
    lowerText.includes("kachra") ||
    lowerText.includes("dustbin") ||
    lowerText.includes("safai") ||
    lowerText.includes("swachh") ||
    lowerText.includes("waste") ||
    lowerText.includes("stagnant") ||
    lowerText.includes("mosquito");

  const isCorruption =
    lowerCat.includes("corrupt") ||
    lowerText.includes("bribe") ||
    lowerText.includes("ghoos") ||
    lowerText.includes("scam") ||
    lowerText.includes("corruption") ||
    lowerText.includes("extortion") ||
    lowerText.includes("officer demanded") ||
    lowerText.includes("babu") ||
    lowerText.includes("desk");

  const isTransit =
    lowerCat.includes("transport") ||
    lowerCat.includes("transit") ||
    lowerText.includes("bus") ||
    lowerText.includes("metro") ||
    lowerText.includes("traffic signal") ||
    lowerText.includes("auto");

  const isHealth =
    lowerCat.includes("health") ||
    lowerText.includes("hospital") ||
    lowerText.includes("doctor") ||
    lowerText.includes("ambulance") ||
    lowerText.includes("dawai") ||
    lowerText.includes("clinic");

  const matchedAuthorities = new Set<RegisteredAuthority>();

  // Helper to check if an authority profile belongs to a given state/city
  const isAuthorityInRegion = (auth: RegisteredAuthority, targetState: string): boolean => {
    const combinedAuth = `${auth.username} ${auth.fullName} ${auth.location || ""} ${auth.jurisdictionRegion || ""} ${auth.constituency || ""}`.toLowerCase();
    
    // Pan-India / National authorities match all regions
    if (combinedAuth.includes("pan-india") || combinedAuth.includes("national") || combinedAuth.includes("central") || auth.username === "nhai_official" || auth.username === "cpgrams_india") {
      return true;
    }

    if (targetState === "haryana") {
      return combinedAuth.includes("haryana") || combinedAuth.includes("gurgaon") || combinedAuth.includes("gurugram") || combinedAuth.includes("sohna") || combinedAuth.includes("faridabad") || combinedAuth.includes("mcg") || combinedAuth.includes("gmda") || combinedAuth.includes("dhbvn");
    }
    if (targetState === "delhi") {
      return combinedAuth.includes("delhi") || combinedAuth.includes("mcd") || combinedAuth.includes("djb");
    }
    if (targetState === "jharkhand") {
      return combinedAuth.includes("jharkhand") || combinedAuth.includes("ranchi") || combinedAuth.includes("dhanbad") || combinedAuth.includes("jamshedpur") || combinedAuth.includes("rmc") || combinedAuth.includes("jbvnl") || combinedAuth.includes("pwd-jh");
    }
    if (targetState === "maharashtra") {
      return combinedAuth.includes("maharashtra") || combinedAuth.includes("mumbai") || combinedAuth.includes("bmc");
    }
    if (targetState === "karnataka") {
      return combinedAuth.includes("karnataka") || combinedAuth.includes("bengaluru") || combinedAuth.includes("bangalore") || combinedAuth.includes("bbmp");
    }
    if (targetState === "uttar_pradesh") {
      return combinedAuth.includes("uttar pradesh") || combinedAuth.includes("noida") || combinedAuth.includes("lucknow");
    }
    return false;
  };

  // 1. Process National Highways or Central Authorities first if applicable
  if (jurisdiction.isNationalHighway && isRoadInfra) {
    const nhai = availableAuthorities.find((a) => a.username.toLowerCase() === "nhai_official" || a.fullName.toLowerCase().includes("national highways"));
    if (nhai) matchedAuthorities.add(nhai);
  }

  if (isCorruption) {
    const cpgrams = availableAuthorities.find((a) => a.username.toLowerCase() === "cpgrams_india" || a.fullName.toLowerCase().includes("grievance"));
    if (cpgrams) matchedAuthorities.add(cpgrams);
  }

  // 2. Iterate through all registered authorities and match strictly by location + domain
  availableAuthorities.forEach((auth) => {
    const uname = auth.username.toLowerCase();
    const fname = auth.fullName.toLowerCase();
    const role = (auth.role || "").toLowerCase();
    const juris = (auth.jurisdictionRegion || "").toLowerCase();
    const loc = (auth.location || "").toLowerCase();
    const consti = (auth.constituency || "").toLowerCase();

    // Check if authority is location-compatible
    const isLocCompatible =
      jurisdiction.state === "unknown" ||
      jurisdiction.state === "national" ||
      isAuthorityInRegion(auth, jurisdiction.state);

    if (!isLocCompatible) {
      // STRICT FILTER: Do NOT tag an authority from a different state!
      return;
    }

    // DEPARTMENT MATCHING
    if (auth.category === "department") {
      // Roads & Infrastructure
      if (isRoadInfra) {
        if (
          uname.includes("pwd") ||
          uname.includes("mcg") ||
          uname.includes("gmda") ||
          uname.includes("mcd") ||
          uname.includes("infra") ||
          fname.includes("public works") ||
          fname.includes("metropolitan") ||
          fname.includes("corporation") ||
          juris.includes("road") ||
          role.includes("works")
        ) {
          matchedAuthorities.add(auth);
        }
      }

      // Water Supply & Drainage
      if (isWaterSupply) {
        if (
          uname.includes("water") ||
          uname.includes("jal") ||
          uname.includes("djb") ||
          uname.includes("wabag") ||
          fname.includes("jal board") ||
          fname.includes("water") ||
          juris.includes("water")
        ) {
          matchedAuthorities.add(auth);
        }
      }

      // Electricity & Power
      if (isElectricity) {
        if (
          uname.includes("elec") ||
          uname.includes("power") ||
          uname.includes("dhbvn") ||
          uname.includes("jbvnl") ||
          fname.includes("bijli") ||
          fname.includes("power") ||
          fname.includes("vitran")
        ) {
          matchedAuthorities.add(auth);
        }
      }

      // Sanitation & Waste Management
      if (isSanitation) {
        if (
          uname.includes("swachh") ||
          uname.includes("sanitat") ||
          uname.includes("mcg") ||
          uname.includes("mcd") ||
          uname.includes("rmc") ||
          fname.includes("swachhata") ||
          fname.includes("municipal")
        ) {
          matchedAuthorities.add(auth);
        }
      }

      // Public Transit & Metro
      if (isTransit) {
        if (uname.includes("metro") || uname.includes("transit") || uname.includes("afcons") || fname.includes("transit")) {
          matchedAuthorities.add(auth);
        }
      }
    }

    // ELECTED LEADER / REPRESENTATIVE MATCHING
    if (auth.category === "representative") {
      // Match representative based on jurisdiction constituency
      if (jurisdiction.state === "haryana") {
        if (uname.includes("mukeshsharma") || uname.includes("sohna") || consti.includes("gurugram") || consti.includes("sohna") || loc.includes("haryana")) {
          matchedAuthorities.add(auth);
        }
      } else if (jurisdiction.state === "jharkhand") {
        if (uname.includes("niteshgupta") || uname.includes("cpsingh") || uname.includes("hemant") || consti.includes("ranchi") || loc.includes("jharkhand")) {
          matchedAuthorities.add(auth);
        }
      }

      // Corruption / High-priority watchdog tagging
      if (isCorruption && (uname.includes("babulal") || role.includes("opposition") || role.includes("chief minister"))) {
        if (jurisdiction.state === "jharkhand" || jurisdiction.state === "unknown") {
          matchedAuthorities.add(auth);
        }
      }
    }
  });

  return Array.from(matchedAuthorities);
}
