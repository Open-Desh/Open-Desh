import React, { useState } from "react";
import {
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
  HelpCircle,
} from "lucide-react";

export const HelpView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

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
        "Tag the supervising department (@PWD, @JalBoard) and elected representative.",
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
              Civic Rights, RTI & SLA Guide
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Open Voice, Open Desh — Citizen statutory laws, grievance charters, and civic handbook.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search RTI drafting, statutory timelines, PWD standards, helplines..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Topics List */}
      <div className="space-y-3">
        {filteredTopics.length > 0 ? (
          filteredTopics.map((topic) => (
            <div
              key={topic.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200/60">
                      {topic.category}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-slate-400" />
                      {topic.legalRef}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {topic.title}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {topic.description}
              </p>

              {/* Action Steps */}
              <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 space-y-1.5">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Key Protocols & Procedures
                </h4>
                <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside">
                  {topic.steps.map((step, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Legal Topics Found</h3>
            <p className="text-xs text-slate-500">
              Try searching with different terms like "RTI", "SLA", "PWD", or "Helplines".
            </p>
          </div>
        )}
      </div>

      {/* Emergency Helpline Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900">Anti-Corruption Helpline</h4>
            <p className="text-xs font-black text-amber-600 mt-0.5">1064 / 1800-11-0180</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900">CPGRAMS Grievance</h4>
            <p className="text-xs font-black text-blue-600 mt-0.5">pgportal.gov.in (1800-11-4000)</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900">National Emergency</h4>
            <p className="text-xs font-black text-rose-600 mt-0.5">112 (Police, Fire, Ambulance)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
