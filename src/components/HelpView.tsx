import React, { useState } from "react";
import {
  HelpCircle,
  Scale,
  FileText,
  Building,
  Phone,
  ShieldCheck,
  Search,
  ChevronRight,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Send,
  MessageSquare,
  Sparkles,
  Loader2,
  Bot,
} from "lucide-react";

export const HelpView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // AI Legal Advisor State
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<string | null>(null);

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim() || aiLoading) return;

    setAiLoading(true);
    setAiAnswer(null);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiQuestion.trim(),
          taskType: "legal_advisor",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiAnswer(data.reply || "No response received.");
        setAiSource(data.source || "gemini");
      } else {
        setAiAnswer("क्षमा करें, AI सलाहकार से जुड़ने में समस्या हुई। कृपया कुछ समय बाद पुनः प्रयास करें।");
      }
    } catch (err) {
      setAiAnswer("नेटवर्क त्रुटि: कृपया अपना इंटरनेट कनेक्शन जांचें।");
    } finally {
      setAiLoading(false);
    }
  };

  const categories = [
    "All",
    "RTI Act 2005",
    "Municipal SLAs",
    "Citizen Charters",
    "Helplines & Grievances",
    "Public Works Audits",
  ];

  const helpTopics = [
    {
      id: "rti_01",
      category: "RTI Act 2005",
      title: "How to draft a formal Right to Information (RTI) application for public works",
      description:
        "Under Section 6(1) of the RTI Act 2005, any citizen can request certified copies of asphalt thickness tests, contractor payment vouchers, and sanctioned DPR drawings from the Public Information Officer (PIO).",
      steps: [
        "Address the petition to the designated Public Information Officer (PIO) of the concerned department (e.g., PWD / Jal Board).",
        "Specify the exact location, road/project name, and sanctioned tender reference number.",
        "Request certified measurement book (MB) records, quality inspection reports, and expenditure certificates.",
        "Attach standard ₹10 postal order / online RTI fee receipt.",
        "The PIO is statutorily mandated to provide information within 30 days of receipt (48 hours if life and liberty is involved).",
      ],
      legalRef: "Right to Information Act, 2005 — Sections 6(1) and 7(1)",
    },
    {
      id: "sla_01",
      category: "Municipal SLAs",
      title: "Citizen SLA Timelines for Civic Grievance Redressal",
      description:
        "Standard statutory service level agreements (SLAs) enforced across municipal corporations for common civic issues.",
      steps: [
        "Pothole and Asphalt Road Hazards: 24 to 48 Hours for emergency patching.",
        "Contaminated Drinking Water Pipelines: 24 Hours inspection and alternate tanker dispatch.",
        "Streetlight Darkness Blackspots: 36 Hours for luminaire/fuse rectification.",
        "Sewer Drainage & Blocked Nullah Overflow: 24 to 48 Hours for suction machine dispatch.",
        "Uncollected Solid Waste & Garbage Dumps: 12 to 24 Hours for sanitation vehicle pickup.",
      ],
      legalRef: "Right to Public Services Act & Municipal Citizen Service Charter",
    },
    {
      id: "cpgrams_01",
      category: "Helplines & Grievances",
      title: "Official Government Portals & National Helplines",
      description:
        "Direct statutory grievance portals integrated with Open Desh for departmental escalation.",
      steps: [
        "CPGRAMS Central Citizen Portal: pgportal.gov.in (Toll-Free: 1800-11-4000)",
        "State Public Services Portal (JharSewa / e-District): Direct service guarantee portal.",
        "National Anti-Corruption & Vigilance Helpline: 1064 / 1800-11-0180",
        "National Emergency Response Support System (ERSS): 112",
        "National Consumer Helpline (NCH): 1915",
        "Electricity Supply Helpline: 1912",
      ],
      legalRef: "Central Public Grievance Redress and Monitoring System (CPGRAMS)",
    },
    {
      id: "audit_01",
      category: "Public Works Audits",
      title: "Citizen Audit Protocol & Independent Site Verification",
      description:
        "Guidelines for capturing verifiable evidence to hold contractors and supervising executive engineers accountable.",
      steps: [
        "Capture multi-angle high-resolution photographs with location metadata enabled.",
        "Record physical measurements (e.g. crater depth, pipe breach diameter) using visible reference points.",
        "Tag the supervising department (@PWD, @JalBoard, @MCD) and elected representative.",
        "Monitor the 4-stage resolution bar on Open Desh from Open to Department Acknowledged, In Progress, and Verified Resolved.",
      ],
      legalRef: "Open Desh Transparent Public Audit Standard",
    },
  ];

  const filteredTopics = helpTopics.filter((topic) => {
    const matchesCategory = selectedCategory === "All" || topic.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.legalRef.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-12 animate-fadeIn space-y-4">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Civic Rights, RTI & AI Legal Guide
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Open Voice, Open Desh — Citizen statutory laws, grievance charters, and AI legal consultation.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Civic AI Legal Advisor Box */}
      <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-blue-800/60 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-inner">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold tracking-tight">Civic AI Legal Advisor</h2>
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-blue-300" />
                  Gemini Powered
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80 mt-0.5">
                RTI Act 2005, CPGRAMS, Municipal Act, and Department Jurisdiction Guidance
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleAskAi} className="space-y-2">
          <div className="relative">
            <input
              type="text"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              placeholder="Ask anything: 'Sadak 3 saal se nahi bani, kiske khilaf RTI dalu?'..."
              disabled={aiLoading}
              className="w-full text-xs sm:text-sm pl-4 pr-24 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:border-blue-400 focus:bg-white/15 text-white placeholder:text-slate-300 transition-colors"
            />
            <button
              type="submit"
              disabled={!aiQuestion.trim() || aiLoading}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  <span>Ask AI</span>
                </>
              )}
            </button>
          </div>
        </form>

        {aiAnswer && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 text-xs sm:text-sm text-slate-100 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-[11px] text-blue-200 pb-2 border-b border-white/10 font-bold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Legal Guidance & Action Plan:
              </span>
              <span className="text-[10px] text-slate-300 bg-white/10 px-2 py-0.5 rounded">
                Source: {aiSource}
              </span>
            </div>
            <div className="whitespace-pre-wrap leading-relaxed text-slate-100 font-normal text-xs sm:text-sm">
              {aiAnswer}
            </div>
          </div>
        )}
      </div>

      {/* Search & Categories */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search RTI drafting guides, municipal SLAs, acts, or government helplines..."
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900 transition-colors"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content Cards */}
      <div className="space-y-4">
        {filteredTopics.map((topic) => (
          <article
            key={topic.id}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-3.5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                {topic.category}
              </span>
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                Statutory Guide
              </span>
            </div>

            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                {topic.title}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed mt-1">{topic.description}</p>
            </div>

            {/* Actionable Steps */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2">
              <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wide block">
                Standard Action Protocol & Guidelines:
              </span>
              <ul className="space-y-1.5">
                {topic.steps.map((step, idx) => (
                  <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Reference Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-[11px]">
                Statute Reference: <strong className="text-blue-700 font-extrabold">{topic.legalRef}</strong>
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
