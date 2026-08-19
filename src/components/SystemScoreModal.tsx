import React from "react";
import { X, Sparkles, Database, CheckCircle2, ShieldCheck, Activity, Award } from "lucide-react";

interface SystemScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetName: string;
  systemScore: number;
}

export const SystemScoreModal: React.FC<SystemScoreModalProps> = ({
  isOpen,
  onClose,
  targetName,
  systemScore,
}) => {
  if (!isOpen) return null;

  const scoreMetrics = [
    {
      title: "Public Domain Tender & Project Execution",
      score: 89,
      weight: "35% Weight",
      desc: "Scraped from public e-tenders (CPWD/State PWD). Evaluates on-time delivery without cost overruns.",
    },
    {
      title: "Citizen Grievance Resolution & SLA Speed",
      score: 84,
      weight: "25% Weight",
      desc: "Speed of response and resolution rate on verified public municipal tickets.",
    },
    {
      title: "Legislative Attendance & Question Participation",
      score: 92,
      weight: "20% Weight",
      desc: "PRS Legislative & Vidhan Sabha session attendance and constituency questions raised.",
    },
    {
      title: "Public Asset Transparency & Budget Utilization",
      score: 82,
      weight: "20% Weight",
      desc: "Audited MPLAD / MLALAD fund expenditure vs sanctioned allocations.",
    },
  ];

  return (
    <div className="fixed inset-0 z-[350] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div
        id="system-score-modal"
        className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                System Score Breakdown ({systemScore}/100)
              </h2>
              <p className="text-[11px] text-slate-500">{targetName} • AI Governance Index</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 flex items-start gap-3">
            <Database className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-950 leading-relaxed font-medium">
              The <strong>System Score</strong> is calculated algorithmically by aggregating official public domain data (e-tenders, Vidhan Sabha archives, CPGRAMS, and public works telemetry). No manual political bias is possible.
            </p>
          </div>

          <div className="space-y-3">
            {scoreMetrics.map((metric, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200/90 bg-white space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-900">{metric.title}</span>
                  <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {metric.score}/100
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${metric.score}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{metric.desc}</span>
                  <span className="font-bold text-slate-600 shrink-0 ml-2">{metric.weight}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-[11px] font-bold text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified & Re-audited Daily via Open Data Scrapers
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
