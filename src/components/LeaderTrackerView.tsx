import React, { useState } from "react";
import {
  Search,
  Star,
  Award,
  Sparkles,
  ExternalLink,
  MapPin,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Leader, UserProfile } from "../types.ts";
import { ProfileView } from "./ProfileView.tsx";
import { SystemScoreModal } from "./SystemScoreModal.tsx";
import { RateUserModal } from "./RateUserModal.tsx";

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
  const [selectedPartyFilter, setSelectedPartyFilter] = useState("all");
  const [selectedLeaderForModal, setSelectedLeaderForModal] = useState<Leader | null>(null);
  const [isSystemScoreOpen, setIsSystemScoreOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);

  const filteredLeaders = leaders.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.constituency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.party.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesParty =
      selectedPartyFilter === "all" ||
      (selectedPartyFilter === "ruling" && l.category === "ruling") ||
      (selectedPartyFilter === "opposition" && l.category === "opposition");

    return matchesSearch && matchesParty;
  });

  return (
    <div className="max-w-xl mx-auto pb-24 md:pb-12 animate-fadeIn bg-white border-x border-slate-200 min-h-screen">
      {/* Sticky Header (Twitter/X style) */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-none">
              Elected Representatives Directory
            </h1>
            <span className="text-[11px] text-slate-500 font-medium">
              Real-time Public Scorecard & Accountability Ledger
            </span>
          </div>
          <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
            {leaders.length} Audited
          </span>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Leader Name, MLA, Party, or Ward..."
              className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900"
            />
          </div>

          <select
            value={selectedPartyFilter}
            onChange={(e) => setSelectedPartyFilter(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-full px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Coalitions</option>
            <option value="ruling">Ruling Coalition</option>
            <option value="opposition">Opposition Bench</option>
          </select>
        </div>
      </div>

      {/* Leaders List with Twitter/X High-Density Cards */}
      <div className="divide-y divide-slate-200">
        {filteredLeaders.map((leader) => (
          <article
            key={leader.id}
            id={`leader-card-${leader.id}`}
            onClick={() => onSelectLeaderProfile(leader)}
            className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors cursor-pointer space-y-3"
          >
            {/* Header: DP + Details + Verified Check */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={leader.image}
                  alt={leader.name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight hover:underline">
                      {leader.name}
                    </h2>
                    <CheckCircle2 className="w-4 h-4 text-blue-600 fill-blue-600 text-white shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {leader.title} • <span className="font-bold text-slate-700">{leader.party}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{leader.constituency}</span>
                  </p>
                </div>
              </div>

              {/* View Profile Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectLeaderProfile(leader);
                }}
                className="px-3.5 py-1.5 rounded-full border border-slate-300 hover:bg-slate-900 hover:text-white text-slate-900 text-xs font-bold transition-all shadow-2xs flex items-center gap-1 shrink-0"
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
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedLeaderForModal(leader);
                  setIsSystemScoreOpen(true);
                }}
                className="text-center px-2 hover:bg-slate-100/60 rounded-xl transition-colors py-0.5"
              >
                <span className="text-[10px] font-extrabold uppercase text-slate-500 block">
                  SYSTEM SCORE
                </span>
                <span className="text-base sm:text-lg font-black text-blue-600 leading-tight">
                  {leader.systemScore}/100
                </span>
              </div>

              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedLeaderForModal(leader);
                  setIsRateModalOpen(true);
                }}
                className="text-center px-2 hover:bg-slate-100/60 rounded-xl transition-colors py-0.5"
              >
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
        ))}
      </div>

      {/* Modals for Quick Interaction */}
      {selectedLeaderForModal && (
        <>
          <SystemScoreModal
            isOpen={isSystemScoreOpen}
            onClose={() => setIsSystemScoreOpen(false)}
            targetName={selectedLeaderForModal.name}
            systemScore={selectedLeaderForModal.systemScore}
          />
          <RateUserModal
            isOpen={isRateModalOpen}
            onClose={() => setIsRateModalOpen(false)}
            targetName={selectedLeaderForModal.name}
            targetId={selectedLeaderForModal.id}
            existingReviews={selectedLeaderForModal.reviews || []}
            onSubmitReview={async (rating, comment) => {
              await onRateLeader(selectedLeaderForModal.id, rating, comment);
            }}
          />
        </>
      )}
    </div>
  );
};
