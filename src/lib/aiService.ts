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
 * to refine a citizen's raw complaint into a well-structured, formal civic report.
 */
export async function refineCivicReportTextWithAI(
  rawText: string,
  category?: string,
  location?: string
): Promise<string> {
  const trimmed = rawText.trim();
  if (!trimmed) return "";

  const systemPrompt = `You are Open Nation's Civic AI Assistant. The user is a citizen submitting a public grievance or infrastructure issue report in India.
Your task is to refine the citizen's complaint into a polite, clear, specific, and official-sounding report without altering any factual details, names, locations, or numbers.
Keep it concise, high-impact, and ready for public governance feed.
If the input is in Hindi/Hinglish, keep it naturally in Hindi/Hinglish or clean bilingual tone. If in English, keep it professional English.
Output ONLY the refined text. Do not add conversational intro or outro.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(WORKER_AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: `Refine this civic complaint:\nCategory: ${category || "General"}\nLocation: ${location || "India"}\nRaw Complaint: "${trimmed}"`,
        text: trimmed,
        category: category,
        location: location,
        systemInstruction: systemPrompt,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Raw complaint: ${trimmed}` }
        ]
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      // Handle various possible response shapes from Cloudflare worker
      const resultText =
        data.response ||
        data.refinedText ||
        data.text ||
        data.result ||
        data.choices?.[0]?.message?.content ||
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        (typeof data === "string" ? data : "");

      if (resultText && typeof resultText === "string" && resultText.trim().length > 5) {
        return resultText.trim();
      }
    }
  } catch (error) {
    console.warn("Worker AI call notice, using local intelligent civic refinement:", error);
  }

  // Graceful rule-based civic refinement fallback if worker is unreachable or returns different format
  return fallbackCivicRefine(trimmed, category, location);
}

/**
 * Intelligent local refinement fallback
 */
function fallbackCivicRefine(text: string, category?: string, location?: string): string {
  const cat = category || "Civic Issue";
  const loc = location ? ` at ${location}` : "";
  
  // Format sentences cleanly
  const cleaned = text
    .replace(/\s+/g, " ")
    .trim();

  const startsWithCapital = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  const endsWithPunct = /[.!?]$/.test(startsWithCapital) ? startsWithCapital : `${startsWithCapital}.`;

  return `[URGENT CIVIC NOTICE: ${cat.toUpperCase()}${loc.toUpperCase()}]\n${endsWithPunct}\n\nImmediate on-site inspection and remedial action requested by local residents.`;
}

/**
 * AI & Rule-based Department Decider:
 * Evaluates the report text and category against ONLY the authentic,
 * registered profiles present in the Firestore/App database.
 * If a department is not registered, it will NOT be auto-tagged.
 */
export function determineResponsibleAuthorities(
  text: string,
  category: string,
  availableAuthorities: RegisteredAuthority[]
): RegisteredAuthority[] {
  if (!availableAuthorities || availableAuthorities.length === 0) {
    return [];
  }

  const lowerText = text.toLowerCase();
  const matchedAuthorities = new Set<RegisteredAuthority>();

  // Map keywords to official departments
  const isRoadInfra =
    category === "Infrastructure" ||
    lowerText.includes("road") ||
    lowerText.includes("sadak") ||
    lowerText.includes("pothole") ||
    lowerText.includes("gaddha") ||
    lowerText.includes("bridge") ||
    lowerText.includes("flyover") ||
    lowerText.includes("tar") ||
    lowerText.includes("bitumen") ||
    lowerText.includes("highway");

  const isWaterSupply =
    category === "Water" ||
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
    category === "Electricity" ||
    lowerText.includes("power") ||
    lowerText.includes("bijli") ||
    lowerText.includes("transformer") ||
    lowerText.includes("spark") ||
    lowerText.includes("outage") ||
    lowerText.includes("wire") ||
    lowerText.includes("voltage") ||
    lowerText.includes("current");

  const isSanitation =
    category === "Sanitation" ||
    lowerText.includes("garbage") ||
    lowerText.includes("kachra") ||
    lowerText.includes("dustbin") ||
    lowerText.includes("safai") ||
    lowerText.includes("swachh") ||
    lowerText.includes("waste") ||
    lowerText.includes("stagnant") ||
    lowerText.includes("mosquito");

  const isCorruption =
    category === "Corruption" ||
    lowerText.includes("bribe") ||
    lowerText.includes("ghoos") ||
    lowerText.includes("scam") ||
    lowerText.includes("corruption") ||
    lowerText.includes("extortion") ||
    lowerText.includes("officer demanded") ||
    lowerText.includes("desk");

  const isTransit =
    category === "Public Transport" ||
    lowerText.includes("bus") ||
    lowerText.includes("metro") ||
    lowerText.includes("transit") ||
    lowerText.includes("traffic signal") ||
    lowerText.includes("auto");

  const isHealth =
    category === "Health" ||
    lowerText.includes("hospital") ||
    lowerText.includes("doctor") ||
    lowerText.includes("ambulance") ||
    lowerText.includes("health") ||
    lowerText.includes("dawai") ||
    lowerText.includes("clinic");

  // 1. Department matching against verified DB records
  availableAuthorities.forEach((auth) => {
    const uname = auth.username.toLowerCase();
    const fname = auth.fullName.toLowerCase();
    const role = (auth.role || "").toLowerCase();

    if (auth.category === "department") {
      // PWD matching
      if (isRoadInfra && (uname.includes("pwd") || fname.includes("public works") || role.includes("works") || uname.includes("infra"))) {
        matchedAuthorities.add(auth);
      }
      // Water matching
      if (isWaterSupply && (uname.includes("water") || uname.includes("wabag") || fname.includes("water") || fname.includes("jal") || role.includes("water"))) {
        matchedAuthorities.add(auth);
      }
      // Transit matching
      if (isTransit && (uname.includes("afcons") || uname.includes("metro") || fname.includes("transit") || role.includes("transit"))) {
        matchedAuthorities.add(auth);
      }
      // Electricity matching
      if (isElectricity && (uname.includes("elec") || uname.includes("power") || uname.includes("bijli") || fname.includes("electricity") || fname.includes("power"))) {
        matchedAuthorities.add(auth);
      }
      // Sanitation matching
      if (isSanitation && (uname.includes("sanitat") || uname.includes("swachh") || uname.includes("mcd") || fname.includes("municipal") || fname.includes("swachhata"))) {
        matchedAuthorities.add(auth);
      }
    }

    // 2. Leader & Representative routing (e.g. Local MLA or Chief Minister / Minister)
    if (auth.category === "representative") {
      // Area MLA / Representative
      if (uname === "niteshgupta950") {
        matchedAuthorities.add(auth);
      }
      // Corruption or Critical -> Tag opposition watchdog or Chief Minister
      if (isCorruption && (uname.includes("babulal") || uname.includes("hemant") || role.includes("opposition") || role.includes("chief minister"))) {
        matchedAuthorities.add(auth);
      }
      // Health issues -> Health Minister / Leader
      if (isHealth && (uname.includes("banna") || role.includes("health"))) {
        matchedAuthorities.add(auth);
      }
    }
  });

  // If no specific match, default to the primary verified MLA / representative in DB
  if (matchedAuthorities.size === 0) {
    const primaryRep = availableAuthorities.find((a) => a.category === "representative" || a.username === "niteshgupta950");
    if (primaryRep) {
      matchedAuthorities.add(primaryRep);
    }
  }

  return Array.from(matchedAuthorities);
}
