// Cloudflare Pages Function for Gemini AI Legal & Civic Guidance
// Endpoint: /api/gemini

interface Env {
  GEMINI_API_KEY?: string;
  [key: string]: any;
}

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
  [key: string]: any;
}): Promise<Response> => {
  try {
    const request = context.request;
    const env = context.env;
    const apiKey = env.GEMINI_API_KEY || (typeof process !== "undefined" ? (process.env?.GEMINI_API_KEY || "") : "");

    const body = await request.json() as {
      prompt?: string;
      systemInstruction?: string;
      category?: string;
      location?: string;
      taskType?: "legal_advisor" | "draft_grievance" | "classify_department" | "general";
    };

    const userPrompt = body.prompt || "";
    if (!userPrompt.trim()) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If Gemini API Key is configured in Cloudflare Pages Variables, call Google Gemini 2.5 API
    if (apiKey && apiKey.trim().length > 10) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;
        
        const systemPrompt = body.systemInstruction || `You are the official Civic AI Legal Advisor for Open Nation (Open Desh), India's premier civic tech governance and leader accountability platform.
You assist Indian citizens with legal statutes (RTI Act 2005, CPGRAMS, Citizen SLA Charters, IPC/BNS, Municipal Acts), drafting formal grievances, and identifying responsible government departments.
Provide structured, empathetic, accurate, and actionable legal guidance in clear Hindi/Hinglish or English as queried.`;

        const geminiPayload = {
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nUser Question/Grievance:\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1200,
          },
        };

        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiPayload),
        });

        if (res.ok) {
          const geminiData = await res.json() as any;
          const candidateText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            return new Response(
              JSON.stringify({
                success: true,
                reply: candidateText,
                source: "gemini-2.5-flash",
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            );
          }
        }
      } catch (geminiErr) {
        console.warn("Cloudflare Gemini upstream call warning:", geminiErr);
      }
    }

    // Intelligent Fallback response if API key is not yet set or during offline mode
    const fallbackReply = generateCivicFallbackAdvice(userPrompt, body.category);
    return new Response(
      JSON.stringify({
        success: true,
        reply: fallbackReply,
        source: "civic-knowledge-engine",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Failed to process AI query" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

function generateCivicFallbackAdvice(query: string, category?: string): string {
  const q = query.toLowerCase();
  
  if (q.includes("road") || q.includes("sadak") || q.includes("pothole") || q.includes("gaddha")) {
    return `📋 **सड़क व गड्ढे से संबंधित कानूनी सलाह व मार्गदर्शन (Road Maintenance & PWD)**

1. **कानूनी अधिकार (Statutory Right):** 
   - संविधान के अनुच्छेद 21 (Right to Life) के तहत सुरक्षित और गड्ढा-मुक्त सड़क पाना नागरिक का मौलिक अधिकार है (सुप्रीम कोर्ट दिशा-निर्देश)।
   - **Citizen SLA:** आपातकालीन सड़क गड्ढों की मरम्मत 48 घंटे के भीतर करना अनिवार्य है।

2. **ज़िम्मेदार विभाग:**
   - **कॉलोनी / शहर की सड़क:** नगर निगम / नगर पालिका (@MunicipalCorp).
   - **मुख्य मार्ग / स्टेट हाईवे:** लोक निर्माण विभाग (@PWD / B&R).
   - **राष्ट्रीय राजमार्ग:** भारतीय राष्ट्रीय राजमार्ग प्राधिकरण (NHAI).

3. **कदम उठाएँ:**
   - Open Nation पर फ़ोटो और GPS के साथ रिपोर्ट दर्ज करें।
   - यदि 7 दिन में कार्रवाई न हो, तो अधिशासी अभियंता (Executive Engineer, PWD) को **RTI Act 2005 की धारा 6(1)** के तहत टेंडर, ठेकेदार का नाम और बिल भुगतान की जानकारी माँगने हेतु आवेदन दें।`;
  }

  if (q.includes("water") || q.includes("pani") || q.includes("pipeline") || q.includes("sewer") || q.includes("nali")) {
    return `💧 **पेयजल व सीवरेज समस्या पर कानूनी मार्गदर्शन (Water & Sanitation)**

1. **कानूनी प्रावधान:** 
   - नगर निगम अधिनियम के अनुसार स्वच्छ पेयजल की निर्बाध आपूर्ति करना स्थानीय प्रशासन का वैधानिक कर्तव्य है।
   - दूषित पानी या पाइपलाइन लीकेज का निवारण 24 घंटे के अंदर होना चाहिए।

2. **ज़िम्मेदार अधिकारी:** 
   - जल बोर्ड / जन स्वास्थ्य यांत्रिकी विभाग (PHED / Jal Sansthan) के सहायक अभियंता (AE) या नगर निगम के जोनल अधिकारी।

3. **RTI व शिकायत का प्रारूप:**
   - जन स्वास्थ्य विभाग के लोक सूचना अधिकारी (PIO) से पिछले 6 महीने में पाइपलाइन मरम्मत पर खर्च हुए फंड और टेस्टिंग रिपोर्ट की सर्टिफाइड कॉपी माँगें।`;
  }

  if (q.includes("transformer") || q.includes("light") || q.includes("bijli") || q.includes("electricity")) {
    return `⚡ **बिजली व ट्रांसफार्मर खराबी पर मार्गदर्शन (Electricity Regulatory Commission Standards)**

1. **SLA समय-सीमा:** 
   - राज्य विद्युत नियामक आयोग (SERC) के नियमों के अनुसार ग्रामीण क्षेत्र में 48 घंटे और शहरी क्षेत्र में 24 घंटे के भीतर जला हुआ ट्रांसफार्मर बदलना अनिवार्य है।
   - देरी होने पर उपभोक्ता को मुआवजे (Compensation) का अधिकार है।

2. **शिकायत दर्ज करें:** 
   - विद्युत हेल्पलाइन: **1912** पर कंप्लेंट नंबर लें।
   - संबंधित सब-डिवीजन के SDO (विद्युत) को लिखित ज्ञापन सौंपें।`;
  }

  return `⚖️ **नागरिक अधिकार व समाधान प्रक्रिया (Open Nation Civic Guidance)**

1. **शिकायत दर्ज करें:** सबसे पहले अपनी समस्या का फोटो और सटीक लोकेशन Open Nation ऐप पर पोस्ट करें ताकि संबंधित विभाग को ऑटो-टैग किया जा सके।
2. **SLA ट्रैकिंग:** 4-चरणीय प्रोग्रेस बार (Reported ➔ Acknowledged ➔ Field Work ➔ Resolved) पर नज़र रखें।
3. **CPGRAMS पोर्टल:** राष्ट्रीय स्तर पर समस्या दर्ज कराने हेतु pgportal.gov.in (टोल-फ्री: 1800-11-4000) का उपयोग करें।
4. **सूचना का अधिकार (RTI 2005):** संबंधित विभाग के लोक सूचना अधिकारी (PIO) को ₹10 के शुल्क के साथ आवेदन देकर कार्य प्रगति रिपोर्ट माँगें।`;
}
