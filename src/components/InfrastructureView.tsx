import React, { useState } from "react";
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Coins,
  ShieldCheck,
  Search,
  Activity,
  HardHat,
  FileSpreadsheet,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { InfrastructureProject, ReportIssue } from "../types.ts";

interface InfrastructureViewProps {
  projects: InfrastructureProject[];
  reports: ReportIssue[];
  onOpenReportModal?: (projectId: string) => void;
  onViewProjectReports?: (projectId: string) => void;
}

export const InfrastructureView: React.FC<InfrastructureViewProps> = ({
  projects,
  reports,
  onOpenReportModal,
  onViewProjectReports,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>("infra_road_01");

  const categories = [
    "All",
    "Roads & Bridges",
    "Water Supply",
    "Public Transit",
    "Clean Sanitation & Energy",
  ];

  const filteredProjects = projects.filter((p) => {
    const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.contractor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.region.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getStatusBadge = (status: InfrastructureProject["status"]) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "Delayed":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      case "Active":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  return (
    <div className="max-w-xl mx-auto pb-24 md:pb-12 animate-fadeIn bg-white border-x border-slate-200 min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-none">
              Public Infrastructure Ledger
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Open Public Domain Tender, Budget & Contractor Audit
            </p>
          </div>
          <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
            {projects.length} Major Works
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by project name, contractor, or region..."
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-extrabold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List */}
      <div className="divide-y divide-slate-200">
        {filteredProjects.map((project) => {
          const isExpanded = expandedProjectId === project.id;
          const linkedIssues = reports.filter((r) => r.linkedProjectId === project.id);

          return (
            <article
              key={project.id}
              className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {project.category}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${getStatusBadge(project.status)}`}>
                      {project.status}
                    </span>
                  </div>

                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                    {project.name}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">{project.region}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 block">Health Index</span>
                  <span className="text-sm font-black text-emerald-600">
                    {project.healthIndex}/100
                  </span>
                </div>
              </div>

              {/* Progress & Financial Utilization Bar */}
              <div className="space-y-1.5 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700">Physical Progress</span>
                  <span className="text-blue-600 font-black">{project.progressPercent}% Completed</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${project.progressPercent}%` }}
                  ></div>
                </div>

                {/* Financial Breakdown (Budget Allocated vs Spent) */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                      Budget Allocated
                    </span>
                    <span className="text-xs sm:text-sm font-black text-slate-900">
                      {project.budgetAllocated}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                      Amount Utilized
                    </span>
                    <span className="text-xs sm:text-sm font-black text-emerald-600">
                      {project.budgetSpent}
                    </span>
                  </div>
                </div>
              </div>

              {/* Public Contractor & Supervising Officer Audit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                    <HardHat className="w-3.5 h-3.5 text-amber-600" /> Executing Contractor
                  </span>
                  <p className="font-extrabold text-slate-900">{project.contractor}</p>
                  <p className="text-[10px] text-slate-500">License: {project.contractorLicense}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Supervising Authority
                  </span>
                  <p className="font-extrabold text-slate-900">{project.supervisingOfficer}</p>
                  <p className="text-[10px] text-slate-500">{project.supervisingDept}</p>
                </div>
              </div>

              {/* Expandable Live IoT Sensor Stream & Linked Citizen Reports */}
              <div className="pt-1">
                <button
                  onClick={() =>
                    setExpandedProjectId(isExpanded ? null : project.id)
                  }
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-800 transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    Public Telemetry & Citizen Audit ({project.reportedIssuesCount} Issues)
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-500 transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="mt-3 space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl animate-fadeIn">
                    {/* Live Sensor Streams */}
                    {project.liveSensors && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                          Real-time Sensor Monitoring (IoT Stream)
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {project.liveSensors.map((sensor, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 bg-white rounded-xl border border-slate-200/80 text-center"
                            >
                              <span className="text-[10px] text-slate-500 block">
                                {sensor.label}
                              </span>
                              <span className="text-xs font-black text-slate-900 block mt-0.5">
                                {sensor.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Deadline & Penalty Info */}
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200 text-slate-600">
                      <span>Target Completion: <strong>{project.deadline}</strong></span>
                      {project.penaltiesImposed && (
                        <span className="text-rose-600 font-bold">
                          Penalty: {project.penaltiesImposed}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
