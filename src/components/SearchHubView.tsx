import React, { useState } from "react";
import { Search, TrendingUp, Building2, FileText, ArrowRight, Sparkles } from "lucide-react";
import { ReportIssue, Leader, InfrastructureProject } from "../types.ts";

interface SearchHubViewProps {
  reports: ReportIssue[];
  leaders: Leader[];
  projects: InfrastructureProject[];
  onNavigate: (view: string) => void;
}

export const SearchHubView: React.FC<SearchHubViewProps> = ({
  reports,
  leaders,
  projects,
  onNavigate,
}) => {
  const [query, setQuery] = useState("");

  const filteredReports = reports.filter(
    (r) =>
      r.text.toLowerCase().includes(query.toLowerCase()) ||
      r.category.toLowerCase().includes(query.toLowerCase()) ||
      r.location.city.toLowerCase().includes(query.toLowerCase())
  );

  const filteredLeaders = leaders.filter(
    (l) =>
      l.name.toLowerCase().includes(query.toLowerCase()) ||
      l.party.toLowerCase().includes(query.toLowerCase()) ||
      l.constituency.toLowerCase().includes(query.toLowerCase())
  );

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.region.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-12 animate-fadeIn space-y-5">
      {/* Search Input Bar */}
      <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-200/90 shadow-md space-y-3">
        <h1 className="text-lg md:text-xl font-black text-slate-900">
          Universal Governance Search
        </h1>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search grievances, MPs, MLAs, Metro projects, RTI laws, or schemes..."
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
            autoFocus
          />
        </div>
      </div>

      {/* Results */}
      {query.trim() ? (
        <div className="space-y-5">
          {/* Leaders Results */}
          {filteredLeaders.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 px-1">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Political Representatives ({filteredLeaders.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredLeaders.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => onNavigate("leader")}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3 cursor-pointer hover:border-blue-300 transition-colors"
                  >
                    <img
                      src={l.image}
                      alt={l.name}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{l.name}</h4>
                      <p className="text-[11px] text-slate-500">{l.party} • {l.constituency}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Infrastructure Results */}
          {filteredProjects.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 px-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600" /> Infrastructure Projects ({filteredProjects.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredProjects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onNavigate("infrastructure")}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-blue-300 transition-colors"
                  >
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{p.name}</h4>
                      <p className="text-[11px] text-slate-500">{p.category} • {p.region}</p>
                    </div>
                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                      {p.progressPercent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reports Results */}
          {filteredReports.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 px-1">
                <FileText className="w-3.5 h-3.5 text-blue-600" /> Civic Reports ({filteredReports.length})
              </h3>
              <div className="space-y-2">
                {filteredReports.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => onNavigate("dashboard")}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1 cursor-pointer hover:border-blue-300 transition-colors"
                  >
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-blue-700">{r.category}</span>
                      <span className="text-slate-400">{r.location.city}</span>
                    </div>
                    <p className="text-xs text-slate-800 line-clamp-2">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            onClick={() => onNavigate("aitutor")}
            className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5 cursor-pointer hover:bg-blue-50/50 transition-colors"
          >
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-xs font-extrabold text-slate-900">AI Legal Guidance</h3>
            <p className="text-[11px] text-slate-500">Draft petitions and learn citizen rights.</p>
          </div>
          <div
            onClick={() => onNavigate("leader")}
            className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5 cursor-pointer hover:bg-blue-50/50 transition-colors"
          >
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-xs font-extrabold text-slate-900">Leader Performance</h3>
            <p className="text-[11px] text-slate-500">Track promises & public reviews.</p>
          </div>
          <div
            onClick={() => onNavigate("infrastructure")}
            className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5 cursor-pointer hover:bg-blue-50/50 transition-colors"
          >
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-xs font-extrabold text-slate-900">Public Works Grid</h3>
            <p className="text-[11px] text-slate-500">Real-time status on roads and water.</p>
          </div>
        </div>
      )}
    </div>
  );
};
