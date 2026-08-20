import React, { useState } from "react";
import {
  ArrowLeft,
  Search,
  Star,
  Users,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  MapPin,
  X,
} from "lucide-react";
import { Leader, UserProfile } from "../types.ts";
import { useLanguage } from "../context/LanguageContext.tsx";
import { CategoryVerifiedTick } from "./CategoryBadge.tsx";

interface LeaderTrackerViewProps {
  leaders: Leader[];
  activeUser: UserProfile;
  onBack?: () => void;
  onSelectLeaderProfile: (leader: Leader) => void;
  onRateLeader: (leaderId: string, rating: number, comment: string) => Promise<void>;
}

export const LeaderTrackerView: React.FC<LeaderTrackerViewProps> = ({
  leaders,
  activeUser,
  onBack,
  onSelectLeaderProfile,
  onRateLeader,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPartyFilter, setSelectedPartyFilter] = useState<"all" | "ruling" | "opposition">("all");

  // Filter leaders by coalition and search query
  const filteredLeaders = leaders.filter((l) => {
    const matchesSearch =
      !searchQuery.trim() ||
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.constituency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.party.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesParty =
      selectedPartyFilter === "all" ||
      (selectedPartyFilter === "ruling" && l.category === "ruling") ||
      (selectedPartyFilter === "opposition" && l.category === "opposition");

    return matchesSearch && matchesParty;
  });

  // Calculate dynamic metrics for the selected category
  const totalTrackedCount = filteredLeaders.length;
  const avgRating =
    totalTrackedCount > 0
      ? (
          filteredLeaders.reduce((acc, curr) => acc + (curr.publicRating || 0), 0) /
          totalTrackedCount
        ).toFixed(1)
      : "0.0";

  const avgSystemScore =
    totalTrackedCount > 0
      ? Math.round(
          filteredLeaders.reduce((acc, curr) => acc + (curr.systemScore || 0), 0) /
            totalTrackedCount
        )
      : 0;

  // Coalition counts
  const rulingCount = leaders.filter((l) => l.category === "ruling").length;
  const oppositionCount = leaders.filter((l) => l.category === "opposition").length;

  return (
    <div className="max-w-xl mx-auto pb-24 md:pb-12 animate-fadeIn bg-white border-x border-slate-200 min-h-screen">
      {/* 1. Header: Edge-to-Edge Sticky Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              id="leader-back-btn"
              onClick={onBack}
              className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight leading-none">
                Leader Performance
              </h1>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5 hidden sm:block">
                Statutory Scorecards & Voter Ratings
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 text-xs font-black text-blue-700">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>{leaders.length} Tracked</span>
        </div>
      </header>

      {/* 2. Coalition Filter Tabs (Twitter/X-style Edge-to-Edge Tabs) */}
      <div className="grid grid-cols-3 bg-white border-b border-slate-200 text-xs font-bold">
        <button
          id="leader-tab-all"
          onClick={() => setSelectedPartyFilter("all")}
          className={`py-3 text-center border-b-2 transition-all cursor-pointer relative ${
            selectedPartyFilter === "all"
              ? "border-blue-600 text-slate-900 font-black"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <span>All ({leaders.length})</span>
        </button>

        <button
          id="leader-tab-ruling"
          onClick={() => setSelectedPartyFilter("ruling")}
          className={`py-3 text-center border-b-2 transition-all cursor-pointer relative ${
            selectedPartyFilter === "ruling"
              ? "border-emerald-600 text-emerald-700 font-black"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <span>Ruling ({rulingCount})</span>
        </button>

        <button
          id="leader-tab-opposition"
          onClick={() => setSelectedPartyFilter("opposition")}
          className={`py-3 text-center border-b-2 transition-all cursor-pointer relative ${
            selectedPartyFilter === "opposition"
              ? "border-amber-600 text-amber-700 font-black"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <span>Opposition ({oppositionCount})</span>
        </button>
      </div>

      {/* 3. Edge-to-Edge Clean Summary Bar (Flush & Concise) */}
      <div className="grid grid-cols-2 divide-x divide-slate-200/80 bg-slate-50/70 border-b border-slate-200 px-4 py-3">
        {/* Total Tracked Metric */}
        <div className="pr-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            Total Tracked
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {totalTrackedCount}
            </span>
            <span className="text-xs font-bold text-slate-600">
              Leaders
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
            {rulingCount} Ruling • {oppositionCount} Opposition
          </p>
        </div>

        {/* Avg Rating Metric */}
        <div className="pl-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            Avg Rating
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-amber-600">
              {avgRating}
            </span>
            <span className="text-xs font-bold text-slate-500">/ 5.0</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
            Avg Score: <strong className="text-blue-700 font-bold">{avgSystemScore}/100</strong>
          </p>
        </div>
      </div>

      {/* 4. Edge-to-Edge Search Bar */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-200">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            id="leader-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Leader Name, MLA, Party, or Ward..."
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

      {/* 5. Edge-to-Edge Leaders Timeline (Continuous Divide-Y Feed, No Boxes) */}
      <div className="divide-y divide-slate-100">
        {filteredLeaders.length > 0 ? (
          filteredLeaders.map((leader) => (
            <article
              key={leader.id}
              id={`leader-card-${leader.id}`}
              onClick={() => onSelectLeaderProfile(leader)}
              className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors cursor-pointer space-y-3"
            >
              {/* Header: Avatar + Identity Details + View Profile */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={leader.image}
                    alt={leader.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight hover:text-emerald-700 transition-colors truncate flex items-center gap-1">
                        <span>{leader.name}</span>
                        <CategoryVerifiedTick category="representative" size="xs" />
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {leader.title} •{" "}
                      <span
                        className={`font-bold ${
                          leader.category === "ruling"
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }`}
                      >
                        {leader.party}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{leader.constituency}</span>
                    </p>
                  </div>
                </div>

                {/* View Profile Action */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLeaderProfile(leader);
                  }}
                  className="px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-900 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-800 text-xs font-bold transition-all shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>View Profile</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bio Statement */}
              {leader.bio && (
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {leader.bio}
                </p>
              )}

              {/* Statutory Metric Breakdown Strip */}
              <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-2.5 grid grid-cols-3 divide-x divide-slate-200">
                <div className="text-center px-1 py-0.5">
                  <span className="text-[10px] font-black uppercase text-slate-500 block tracking-tight">
                    System Score
                  </span>
                  <span className="text-sm sm:text-base font-black text-blue-600 leading-tight">
                    {leader.systemScore}/100
                  </span>
                </div>

                <div className="text-center px-1 py-0.5">
                  <span className="text-[10px] font-black uppercase text-slate-500 block tracking-tight">
                    Public Rating
                  </span>
                  <span className="text-sm sm:text-base font-black text-slate-900 flex items-center justify-center gap-1 leading-tight">
                    {leader.publicRating}
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </span>
                </div>

                <div className="text-center px-1 py-0.5">
                  <span className="text-[10px] font-black uppercase text-slate-500 block tracking-tight">
                    Promises Met
                  </span>
                  <span className="text-sm sm:text-base font-black text-emerald-600 leading-tight">
                    {leader.promisesFulfilled}/{leader.promisesTotal}
                  </span>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <p className="font-semibold text-slate-700">No leaders found for the selected filter or query.</p>
            <button
              onClick={() => {
                setSelectedPartyFilter("all");
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
