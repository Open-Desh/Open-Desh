import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Building2,
  HardHat,
  ShieldCheck,
  Search,
  ChevronRight,
  Activity,
  MapPin,
  X,
  Star,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { InfrastructureProject, ReportIssue } from "../types.ts";

interface InfrastructureViewProps {
  projects: InfrastructureProject[];
  reports?: ReportIssue[];
  onBack?: () => void;
  onSelectUser?: (userId: string) => void;
  onOpenReportModal?: (projectId: string) => void;
  onViewProjectReports?: (projectId: string) => void;
}

export const InfrastructureView: React.FC<InfrastructureViewProps> = ({
  projects,
  reports = [],
  onBack,
  onSelectUser,
  onOpenReportModal,
  onViewProjectReports,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  const categories = [
    "All",
    "Roads & Bridges",
    "Water Supply",
    "Public Transit",
    "Clean Sanitation & Energy",
  ];

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesCat =
        selectedCategory === "All" || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.contractor.toLowerCase().includes(q) ||
        p.region.toLowerCase().includes(q) ||
        p.supervisingOfficer.toLowerCase().includes(q) ||
        p.contractorLicense.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [projects, selectedCategory, searchQuery]);

  // Aggregate Metrics
  const totalProjectsCount = filteredProjects.length;

  const totalBudgetNumericCr = useMemo(() => {
    return projects.reduce((acc, curr) => {
      const match = curr.budgetAllocated.match(/₹([\d,.]+)/);
      if (match) {
        return acc + parseFloat(match[1].replace(/,/g, ""));
      }
      return acc;
    }, 0);
  }, [projects]);

  const avgProgress = useMemo(() => {
    if (totalProjectsCount === 0) return 0;
    return Math.round(
      filteredProjects.reduce((acc, curr) => acc + curr.progressPercent, 0) /
        totalProjectsCount
    );
  }, [filteredProjects, totalProjectsCount]);

  const avgHealthIndex = useMemo(() => {
    if (totalProjectsCount === 0) return 0;
    return Math.round(
      filteredProjects.reduce((acc, curr) => acc + curr.healthIndex, 0) /
        totalProjectsCount
    );
  }, [filteredProjects, totalProjectsCount]);

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
      {/* 1. Dedicated Edge-to-Edge Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              id="infra-back-btn"
              onClick={onBack}
              className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <HardHat className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight leading-none">
                Infrastructure
              </h1>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5 hidden sm:block">
                Tender, Budget & Contractor Audit
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 text-xs font-black text-blue-700">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>{projects.length} Works Tracked</span>
        </div>
      </header>

      {/* 2. Edge-to-Edge Category Filter Tabs (Twitter/X-style) */}
      <div className="flex bg-white border-b border-slate-200 text-xs font-bold overflow-x-auto no-scrollbar">
        {categories.map((cat) => {
          const count =
            cat === "All"
              ? projects.length
              : projects.filter((p) => p.category === cat).length;

          const isActive = selectedCategory === cat;

          return (
            <button
              key={cat}
              id={`infra-tab-${cat.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
              onClick={() => setSelectedCategory(cat)}
              className={`py-3 px-4 text-center border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? "border-blue-600 text-blue-600 font-black bg-blue-50/20"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span>
                {cat} ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Edge-to-Edge Summary KPI Bar (2-Column Flush Strip) */}
      <div className="grid grid-cols-2 divide-x divide-slate-200/80 bg-slate-50/70 border-b border-slate-200 px-4 py-3">
        {/* Total Outlay Metric */}
        <div className="pr-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-blue-600" />
            Capital Outlay
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              ₹{totalBudgetNumericCr.toFixed(0)}
            </span>
            <span className="text-xs font-bold text-slate-600">Cr Tracked</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
            {totalProjectsCount} projects in active audit
          </p>
        </div>

        {/* Avg Progress Metric */}
        <div className="pl-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            Avg Completion
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-600">
              {avgProgress}%
            </span>
            <span className="text-xs font-bold text-slate-500">Progress</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
            Avg Health Score:{" "}
            <strong className="text-blue-700 font-bold">{avgHealthIndex}/100</strong>
          </p>
        </div>
      </div>

      {/* 4. Edge-to-Edge Search Bar */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-200">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            id="infra-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by project name, contractor, officer, or license..."
            className="w-full text-xs sm:text-sm pl-9.5 pr-9 py-2 bg-slate-100/90 border border-slate-200/80 rounded-full focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 text-slate-900 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 5. Edge-to-Edge Projects Feed (Continuous Divide-Y Feed, No Boxes) */}
      <div className="divide-y divide-slate-100">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => {
            const isExpanded = expandedProjectId === project.id;
            const hasContractorProfile = Boolean(project.contractorId);
            const hasOfficerProfile = Boolean(project.supervisingOfficerId);

            return (
              <article
                key={project.id}
                id={`project-card-${project.id}`}
                className="p-4 sm:p-5 hover:bg-slate-50/40 transition-colors space-y-3"
              >
                {/* Header: Badges + Health Index */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {project.category}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${getStatusBadge(
                          project.status
                        )}`}
                      >
                        {project.status}
                      </span>
                    </div>

                    <h2 className="text-sm sm:text-base font-black text-slate-900 leading-snug pt-0.5">
                      {project.name}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{project.region}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/70">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                      Health Index
                    </span>
                    <span className="text-sm font-black text-emerald-600">
                      {project.healthIndex}/100
                    </span>
                  </div>
                </div>

                {/* Progress & Financial Utilization Bar */}
                <div className="space-y-2 bg-slate-50/80 border border-slate-200/80 rounded-xl p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">
                      Physical Execution
                    </span>
                    <span className="text-blue-600 font-black">
                      {project.progressPercent}% Completed
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${project.progressPercent}%` }}
                    />
                  </div>

                  {/* Financial Breakdown */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Sanctioned Budget
                      </span>
                      <span className="text-xs sm:text-sm font-black text-slate-900">
                        {project.budgetAllocated}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Amount Utilized
                      </span>
                      <span className="text-xs sm:text-sm font-black text-emerald-600">
                        {project.budgetSpent}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Public Contractor & Supervising Officer Audit Grid */}
                <div className="space-y-2">
                  {/* 1. Executing Contractor Card (With View Profile option) */}
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {project.contractorAvatar ? (
                        <img
                          src={project.contractorAvatar}
                          alt={project.contractor}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0">
                          <HardHat className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">
                            Executing Contractor / Thekedaar
                          </span>
                          <CheckCircle2 className="w-3 h-3 text-blue-600 fill-blue-600 text-white" />
                        </div>
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate leading-tight mt-0.5">
                          {project.contractor}
                        </h3>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                          <span>License: {project.contractorLicense}</span>
                          {project.contractorRating && (
                            <span className="flex items-center gap-0.5 font-bold text-slate-700">
                              • {project.contractorRating}
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* View Profile Button for Contractor */}
                    {hasContractorProfile && onSelectUser && (
                      <button
                        onClick={() => onSelectUser(project.contractorId!)}
                        className="px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-900 bg-white hover:bg-slate-900 hover:text-white text-slate-800 text-xs font-bold transition-all shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
                        title="View Contractor Profile"
                      >
                        <span>View Profile</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* 2. Supervising Authority Card (With Officer View Profile) */}
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider">
                          Supervising Authority
                        </span>
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate leading-tight mt-0.5">
                          {project.supervisingOfficer}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                          {project.supervisingDept}
                        </p>
                      </div>
                    </div>

                    {/* View Profile Button for Officer */}
                    {hasOfficerProfile && onSelectUser && (
                      <button
                        onClick={() => onSelectUser(project.supervisingOfficerId!)}
                        className="px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-900 bg-white hover:bg-slate-900 hover:text-white text-slate-800 text-xs font-bold transition-all shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
                        title="View Officer Profile"
                      >
                        <span>View Profile</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable Live IoT Sensor Stream & Telemetry */}
                <div className="pt-1">
                  <button
                    onClick={() =>
                      setExpandedProjectId(isExpanded ? null : project.id)
                    }
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200/80 rounded-xl text-xs font-bold text-slate-800 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-600" />
                      Public Telemetry & Citizen Audit ({project.reportedIssuesCount} Citizen Issues)
                    </span>
                    <ChevronRight
                      className={`w-4 h-4 text-slate-500 transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="mt-2.5 space-y-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl animate-fadeIn">
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
                                className="p-2.5 bg-white rounded-lg border border-slate-200 text-center"
                              >
                                <span className="text-[10px] text-slate-500 block font-medium">
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
                      <div className="flex flex-wrap justify-between items-center text-xs pt-2 border-t border-slate-200 text-slate-600 gap-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Target Completion: <strong>{project.deadline}</strong>
                        </span>
                        {project.penaltiesImposed && (
                          <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Penalty: {project.penaltiesImposed}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <p className="font-semibold text-slate-700">
              No infrastructure projects match your filter or search query.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="text-blue-600 font-bold hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
