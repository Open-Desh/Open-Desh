import React, { useState } from "react";
import {
  Search,
  Star,
  Users,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  MapPin,
  Sparkles,
  Award,
} from "lucide-react";
import { Leader, UserProfile } from "../types.ts";

interface LeaderTrackerViewProps {
  leaders: Leader[];
  activeUser: UserProfile;
  onSelectLeaderProfile: (leader: Leader) => void;
  onRateLeader: (leaderId: string, rating: number, comment: string) => Promise<void>;
}

export const LeaderTrackerView: React.FC<LeaderTrackerViewProps> = ({
  leaders,
  activeUser,
  onSelectLeaderProfile,
  onRateLeader,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPartyFilter, setSelectedPartyFilter] = useState<"all" | "ruling" | "opposition">("all");

  // Filter leaders by coalition and search text
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

  // Counts for tabs
  const rulingCount = leaders.filter((l) => l.category === "ruling").length;
  const oppositionCount = leaders.filter((l) => l.category === "opposition").length;

  return (
    <div className="max-w-xl mx-auto pb-24 md:pb-12 animate-fadeIn bg-white border-x border-slate-200 min-h-screen">
      {/* Sticky Header (Twitter/X style) */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3.5 border-b border-slate-200 space-y-3">
        {/* Title & Headline */}
        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Leader Performance Tracker
            </h1>
            <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
              {leaders.length} Tracked
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Independent statutory scorecards & citizen voter rating ledger
          </p>
        </div>

        {/* Coalition Filter Buttons */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setSelectedPartyFilter("all")}
            className={`py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer text-center ${
              selectedPartyFilter === "all"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            All ({leaders.length})
          </button>
          <button
            onClick={() => setSelectedPartyFilter("ruling")}
            className={`py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer text-center ${
              selectedPartyFilter === "ruling"
                ? "bg-white text-emerald-700 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Ruling ({rulingCount})
          </button>
          <button
            onClick={() => setSelectedPartyFilter("opposition")}
            className={`py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer text-center ${
              selectedPartyFilter === "opposition"
                ? "bg-white text-orange-700 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Opposition ({oppositionCount})
          </button>
        </div>

        {/* 2 Dynamic Summary Cards (Total Tracked & Avg Rating) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Card 1: Total Tracked */}
          <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-0.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                TOTAL TRACKED
              </span>
              <Users className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                {totalTrackedCount}
              </span>
              <span className="text-xs text-slate-500 font-bold">
                {selectedPartyFilter === "ruling"
                  ? "Ruling Members"
                  : selectedPartyFilter === "opposition"
                  ? "Opposition Members"
                  : "Elected Leaders"}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              {selectedPartyFilter === "ruling"
                ? "Active treasury & cabinet ministers"
                : selectedPartyFilter === "opposition"
                ? "Opposition & legislative watchdogs"
                : "All audited legislative representatives"}
            </p>
          </div>

          {/* Card 2: Avg Rating */}
          <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-0.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                AVG RATING
              </span>
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-600">
                {avgRating}
              </span>
              <span className="text-xs text-slate-500 font-bold">/ 5.0</span>
              <span className="text-[10px] font-extrabold text-blue-600 ml-auto bg-blue-50 px-1.5 py-0.5 rounded">
                Avg Score {avgSystemScore}/100
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Calculated across verified public voter reviews
            </p>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Leader Name, MLA, Party, or Ward..."
            className="w-full text-xs sm:text-sm pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Leaders List with Twitter/X High-Density Cards */}
      <div className="divide-y divide-slate-200">
        {filteredLeaders.length > 0 ? (
          filteredLeaders.map((leader) => (
            <article
              key={leader.id}
              id={`leader-card-${leader.id}`}
              onClick={() => onSelectLeaderProfile(leader)}
              className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors cursor-pointer space-y-3"
            >
              {/* Header: DP + Details + Verified Check */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={leader.image}
                    alt={leader.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight hover:underline truncate">
                        {leader.name}
                      </h2>
                      <CheckCircle2 className="w-4 h-4 text-blue-600 fill-blue-600 text-white shrink-0" />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {leader.title} •{" "}
                      <span
                        className={`font-bold ${
                          leader.category === "ruling"
                            ? "text-emerald-700"
                            : "text-orange-700"
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

                {/* View Profile Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLeaderProfile(leader);
                  }}
                  className="px-3.5 py-1.5 rounded-full border border-slate-300 hover:bg-slate-900 hover:text-white text-slate-900 text-xs font-bold transition-all shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>View Profile</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bio Snippet */}
              <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">
                {leader.bio}
              </p>

              {/* Performance Scorecard Row (System Score, Public Rating, Promises) */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 grid grid-cols-3 divide-x divide-slate-200">
                <div className="text-center px-2 py-0.5">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 block">
                    SYSTEM SCORE
                  </span>
                  <span className="text-base sm:text-lg font-black text-blue-600 leading-tight">
                    {leader.systemScore}/100
                  </span>
                </div>

                <div className="text-center px-2 py-0.5">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 block">
                    PUBLIC RATING
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-900 flex items-center justify-center gap-1 leading-tight">
                    {leader.publicRating}
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </span>
                </div>

                <div className="text-center px-2 py-0.5">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 block">
                    PROMISES MET
                  </span>
                  <span className="text-base sm:text-lg font-black text-emerald-600 leading-tight">
                    {leader.promisesFulfilled}/{leader.promisesTotal}
                  </span>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="p-12 text-center text-xs text-slate-400 space-y-1">
            <p>No leaders found for the selected filter or query.</p>
            <button
              onClick={() => {
                setSelectedPartyFilter("all");
                setSearchQuery("");
              }}
              className="text-blue-600 font-bold hover:underline"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
