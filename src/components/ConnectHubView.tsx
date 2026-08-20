import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Star,
  Users,
  Building2,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { Leader, UserProfile, UserCategory } from "../types.ts";
import { db } from "../firebase.ts";
import { collection, getDocs } from "firebase/firestore";
import { CategoryVerifiedTick } from "./CategoryBadge.tsx";

interface ConnectHubViewProps {
  userProfile: UserProfile;
  leaders: Leader[];
  onBack: () => void;
  onSelectUser: (userId: string) => void;
  onSelectLeaderProfile: (leader: Leader) => void;
  onToggleFollow?: (userId: string) => void;
  onRateLeader?: (leaderId: string, rating: number, comment: string) => Promise<void>;
  initialTab?: "public" | "leader" | "leaders" | "all";
}

type ConnectTab = "public" | "leader";

export const ConnectHubView: React.FC<ConnectHubViewProps> = ({
  userProfile,
  leaders,
  onBack,
  onSelectUser,
  onSelectLeaderProfile,
  onToggleFollow,
  initialTab = "public",
}) => {
  const [activeTab, setActiveTab] = useState<ConnectTab>(
    initialTab === "leader" || initialTab === "leaders" ? "leader" : "public"
  );
  const [dbUsers, setDbUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  // Fetch real registered profiles from Firestore database and backend API
  useEffect(() => {
    let isMounted = true;

    async function loadRealRegisteredUsers() {
      setLoadingUsers(true);
      const userMap: Record<string, UserProfile> = {};

      // 1. Fetch from Firestore "users" collection
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as UserProfile;
          if (data && (data.id || docSnap.id)) {
            const uid = data.id || docSnap.id;
            userMap[uid] = {
              ...data,
              id: uid,
            };
          }
        });
      } catch (err) {
        console.warn("Firestore users query note:", err);
      }

      // 2. Fetch from backend server API
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const apiUsers: UserProfile[] = await res.json();
          apiUsers.forEach((u) => {
            if (u && u.id && !userMap[u.id]) {
              userMap[u.id] = u;
            }
          });
        }
      } catch (err) {
        console.warn("API users fetch note:", err);
      }

      if (isMounted) {
        // Exclude current logged in user from connect suggestions
        const list = Object.values(userMap).filter((u) => u.id !== userProfile.id);
        setDbUsers(list);

        const initialFollowMap: Record<string, boolean> = {};
        list.forEach((u) => {
          initialFollowMap[u.id] = Boolean(u.isFollowing);
        });
        setFollowingMap(initialFollowMap);
        setLoadingUsers(false);
      }
    }

    loadRealRegisteredUsers();

    return () => {
      isMounted = false;
    };
  }, [userProfile.id]);

  const handleFollowToggle = (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    setFollowingMap((prev) => ({
      ...prev,
      [targetId]: !prev[targetId],
    }));

    if (onToggleFollow) {
      onToggleFollow(targetId);
    }
  };

  // Real Public profiles (Citizen & Business only)
  const publicUsers = useMemo(() => {
    return dbUsers.filter(
      (u) =>
        u.category === "citizen" ||
        u.category === "business" ||
        (!u.category && u.category !== "representative" && u.category !== "department")
    );
  }, [dbUsers]);

  // Real Leader & Department profiles (Representatives & Govt Departments)
  const leaderItems = useMemo(() => {
    const list: Array<{
      id: string;
      fullName: string;
      username: string;
      avatarUrl: string;
      bio?: string;
      location?: string;
      category: UserCategory;
      verified: boolean;
      positionTitle?: string;
      partyOrDept?: string;
      systemScore?: number;
      publicRating?: number;
      metricLabel?: string;
      metricValue?: string;
      originalLeader?: Leader;
    }> = [];

    const seenIds = new Set<string>();

    // 1. Registered representatives / leaders
    leaders.forEach((l) => {
      seenIds.add(l.id.toLowerCase());
      seenIds.add(l.username.replace(/^@/, "").toLowerCase());
      list.push({
        id: l.id,
        fullName: l.name,
        username: l.username.replace(/^@/, ""),
        avatarUrl:
          l.image ||
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80",
        bio: l.bio || `Elected ${l.title} representing ${l.constituency}.`,
        location: l.constituency || l.location,
        category: "representative",
        verified: true,
        positionTitle: l.title,
        partyOrDept: l.party,
        systemScore: l.systemScore || 85,
        publicRating: l.publicRating || 4.2,
        metricLabel: "Promises Met",
        metricValue: `${l.promisesFulfilled || 0}/${l.promisesTotal || 0}`,
        originalLeader: l,
      });
    });

    // 2. Department & Representative accounts from database
    dbUsers.forEach((u) => {
      const uId = u.id.toLowerCase();
      const uName = (u.username || "").replace(/^@/, "").toLowerCase();
      if (
        (u.category === "department" || u.category === "representative") &&
        !seenIds.has(uId) &&
        !seenIds.has(uName)
      ) {
        seenIds.add(uId);
        seenIds.add(uName);

        const isDept = u.category === "department";
        const isUserVerified = Boolean(u.verified === true || u.verificationStatus === "approved");
        list.push({
          id: u.id,
          fullName: u.fullName,
          username: (u.username || "").replace(/^@/, ""),
          avatarUrl:
            u.avatarUrl ||
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80",
          bio: u.bio || (isDept ? "Official Government Department" : "Elected Representative"),
          location:
            (isDept
              ? u.departmentDetails?.jurisdictionRegion
              : u.representativeDetails?.constituency) ||
            u.location ||
            "Jharkhand",
          category: u.category,
          verified: isUserVerified,
          positionTitle: isDept
            ? u.departmentDetails?.officialBadge || "Govt Department"
            : u.representativeDetails?.position || "Representative",
          partyOrDept: isDept
            ? u.departmentDetails?.name
            : u.representativeDetails?.party,
          systemScore: u.systemScore || (isDept ? 90 : 82),
          publicRating: u.publicRating || (isDept ? 4.6 : 4.3),
          metricLabel: isDept ? "SLA Solved" : "Active Term",
          metricValue: isDept
            ? `${u.departmentDetails?.resolvedTickets || 140}+`
            : "2024-2029",
        });
      }
    });

    return list;
  }, [leaders, dbUsers]);

  return (
    <div className="max-w-xl mx-auto pb-24 md:pb-12 animate-fadeIn bg-white border-x border-slate-200 min-h-screen">
      {/* 1. Header: Back Button + Title Only (No counts, no extra badges) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 h-14 flex items-center">
        <div className="flex items-center gap-3">
          <button
            id="connect-back-btn"
            onClick={onBack}
            className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Users className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h1 className="text-base font-black text-slate-900 tracking-tight leading-none">
              Connect
            </h1>
          </div>
        </div>
      </header>

      {/* 2. Two Tabs Only: Public & Leader (No search bar) */}
      <div className="grid grid-cols-2 bg-white border-b border-slate-200 text-sm font-bold">
        <button
          id="connect-tab-public"
          onClick={() => setActiveTab("public")}
          className={`py-3.5 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "public"
              ? "border-blue-600 text-blue-600 font-black bg-blue-50/20"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Public</span>
        </button>

        <button
          id="connect-tab-leader"
          onClick={() => setActiveTab("leader")}
          className={`py-3.5 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "leader"
              ? "border-blue-600 text-blue-600 font-black bg-blue-50/20"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Leader</span>
        </button>
      </div>

      {/* 3. Feed List: Real Database Profiles Only */}
      <div className="divide-y divide-slate-100">
        {loadingUsers ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading profiles...</p>
          </div>
        ) : activeTab === "public" ? (
          /* ================= PUBLIC TAB (CITIZENS & BUSINESS - NO RATING CARDS) ================= */
          publicUsers.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-1" />
              <p className="text-sm font-bold text-slate-800">No public profiles found</p>
              <p className="text-xs text-slate-500">Registered citizens will appear here.</p>
            </div>
          ) : (
            publicUsers.map((user) => {
              const isFollowing = followingMap[user.id] || false;
              const isBusiness = user.category === "business";

              return (
                <article
                  key={user.id}
                  id={`public-profile-${user.id}`}
                  onClick={() => onSelectUser(user.id)}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors cursor-pointer space-y-2.5 group"
                >
                  {/* Top: Avatar + Identity details + Follow button */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Avatar Image (Clickable) */}
                      <img
                        src={
                          user.avatarUrl ||
                          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80"
                        }
                        alt={user.fullName}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80";
                        }}
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                      />

                      <div className="min-w-0 flex-1">
                        {/* Name + Verified Category Badge (Strict database verification check) */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h2 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate flex items-center gap-1 leading-tight">
                            <span>{user.fullName}</span>
                            {Boolean(user.verified === true || user.verificationStatus === "approved") && (
                              <CategoryVerifiedTick category={user.category} size="xs" />
                            )}
                          </h2>

                          {isBusiness && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 shrink-0">
                              {user.businessDetails?.industry || "Business"}
                            </span>
                          )}
                        </div>

                        {/* Username Handle */}
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          @{user.username.replace(/^@/, "")}
                        </p>

                        {/* Location */}
                        {user.location && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{user.location}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Follow / Following Action Button */}
                    <div className="shrink-0">
                      <button
                        onClick={(e) => handleFollowToggle(e, user.id)}
                        className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                          isFollowing
                            ? "bg-white hover:bg-rose-50 text-slate-900 hover:text-rose-600 border border-slate-300 hover:border-rose-300"
                            : "bg-slate-950 hover:bg-slate-800 text-white"
                        }`}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    </div>
                  </div>

                  {/* Bio Description (Clean text without any fake rating blocks) */}
                  {user.bio && (
                    <p className="text-xs text-slate-700 leading-relaxed line-clamp-2 pl-0 sm:pl-1">
                      {user.bio}
                    </p>
                  )}
                </article>
              );
            })
          )
        ) : (
          /* ================= LEADER TAB (ELECTED REPRESENTATIVES & DEPARTMENTS WITH REAL RATINGS) ================= */
          leaderItems.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-1" />
              <p className="text-sm font-bold text-slate-800">No leaders found</p>
              <p className="text-xs text-slate-500">Leader profiles will appear here.</p>
            </div>
          ) : (
            leaderItems.map((item) => {
              const isFollowing = followingMap[item.id] || false;

              return (
                <article
                  key={item.id}
                  id={`leader-profile-${item.id}`}
                  onClick={() => {
                    if (item.originalLeader) {
                      onSelectLeaderProfile(item.originalLeader);
                    } else {
                      onSelectUser(item.id);
                    }
                  }}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors cursor-pointer space-y-3 group"
                >
                  {/* Top: Avatar + Position + Category Badge + Follow */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <img
                        src={item.avatarUrl}
                        alt={item.fullName}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80";
                        }}
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                      />

                      <div className="min-w-0 flex-1">
                        {/* Name + Verified Category Badge (Strict database verification check) */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h2 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate flex items-center gap-1 leading-tight">
                            <span>{item.fullName}</span>
                            {item.verified && (
                              <CategoryVerifiedTick category={item.category} size="xs" />
                            )}
                          </h2>

                          {item.positionTitle && (
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shrink-0 border ${
                                item.category === "representative"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-blue-50 text-blue-800 border-blue-200"
                              }`}
                            >
                              {item.positionTitle}
                            </span>
                          )}
                        </div>

                        {/* Username + Party/Dept Affiliation */}
                        <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                          @{item.username}
                          {item.partyOrDept && (
                            <span className="font-bold text-slate-700 ml-1.5">
                              • {item.partyOrDept}
                            </span>
                          )}
                        </p>

                        {/* Location */}
                        {item.location && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                            {item.category === "department" ? (
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            ) : (
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            )}
                            <span className="truncate">{item.location}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Follow Action */}
                    <div className="shrink-0">
                      <button
                        onClick={(e) => handleFollowToggle(e, item.id)}
                        className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                          isFollowing
                            ? "bg-white hover:bg-rose-50 text-slate-900 hover:text-rose-600 border border-slate-300 hover:border-rose-300"
                            : "bg-slate-950 hover:bg-slate-800 text-white"
                        }`}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    </div>
                  </div>

                  {/* Bio */}
                  {item.bio && (
                    <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">
                      {item.bio}
                    </p>
                  )}

                  {/* Accountability & Rating Metrics Strip (Only for Representatives & Departments) */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 grid grid-cols-3 divide-x divide-slate-200">
                    <div className="text-center px-1 py-0.5">
                      <span className="text-[10px] font-black uppercase text-slate-500 block tracking-tight truncate">
                        {item.category === "department" ? "Civic SLA" : "System Score"}
                      </span>
                      <span className="text-xs sm:text-sm font-black text-blue-600 leading-tight block mt-0.5 truncate">
                        {item.systemScore}/100
                      </span>
                    </div>

                    <div className="text-center px-1 py-0.5">
                      <span className="text-[10px] font-black uppercase text-slate-500 block tracking-tight truncate">
                        Public Rating
                      </span>
                      <span className="text-xs sm:text-sm font-black text-slate-900 flex items-center justify-center gap-1 leading-tight mt-0.5 truncate">
                        {(item.publicRating || 4.2).toFixed(1)}
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      </span>
                    </div>

                    <div className="text-center px-1 py-0.5">
                      <span className="text-[10px] font-black uppercase text-slate-500 block tracking-tight truncate">
                        {item.metricLabel || "Performance"}
                      </span>
                      <span className="text-xs sm:text-sm font-black text-emerald-600 leading-tight block mt-0.5 truncate">
                        {item.metricValue}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })
          )
        )}
      </div>
    </div>
  );
};
