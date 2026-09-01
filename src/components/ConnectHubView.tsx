import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Star,
  Users,
  MapPin,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { Leader, UserProfile, UserCategory, ReportIssue } from "../types.ts";
import { db } from "../firebase.ts";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { CategoryVerifiedTick } from "./CategoryBadge.tsx";

interface ConnectHubViewProps {
  userProfile: UserProfile;
  leaders: Leader[];
  reports?: ReportIssue[];
  onBack: () => void;
  onSelectUser: (userId: string) => void;
  onSelectLeaderProfile: (leader: Leader) => void;
  onToggleFollow?: (userId: string) => void;
  onRateLeader?: (leaderId: string, rating: number, comment: string) => Promise<void>;
  initialTab?: "public" | "leader" | "leaders" | "all";
}

type ConnectTab = "leader" | "public";

export const ConnectHubView: React.FC<ConnectHubViewProps> = ({
  userProfile,
  leaders,
  reports = [],
  onBack,
  onSelectUser,
  onSelectLeaderProfile,
  onToggleFollow,
  initialTab = "leaders",
}) => {
  const [activeTab, setActiveTab] = useState<ConnectTab>(
    initialTab === "public" ? "public" : "leader"
  );
  const [dbUsers, setDbUsers] = useState<UserProfile[]>([]);
  const [dbLeaders, setDbLeaders] = useState<Leader[]>(leaders || []);
  const [dbReports, setDbReports] = useState<ReportIssue[]>(reports || []);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [visibleLeadersCount, setVisibleLeadersCount] = useState<number>(12);
  const [visiblePublicCount, setVisiblePublicCount] = useState<number>(12);
  const leaderSentinelRef = React.useRef<HTMLDivElement | null>(null);
  const publicSentinelRef = React.useRef<HTMLDivElement | null>(null);

  // 1. Enterprise Scale: Fetch ONLY real registered profiles & reports from Firestore database
  useEffect(() => {
    let isMounted = true;

    async function loadPureFirestoreProfiles() {
      setLoading(true);
      const userMap = new Map<string, UserProfile>();
      const leaderMap = new Map<string, Leader>();
      const fetchedReports: ReportIssue[] = [];

      // 1. Load Firestore "users" collection (Strict Real DB with query limit)
      try {
        const qUsers = query(collection(db, "users"), limit(80));
        const usersSnap = await getDocs(qUsers);
        usersSnap.forEach((docSnap) => {
          const data = docSnap.data() as UserProfile;
          if (data) {
            const uid = (data.id || docSnap.id).trim();
            if (uid) {
              userMap.set(uid.toLowerCase(), {
                ...data,
                id: uid,
              });
            }
          }
        });
      } catch (err) {
        console.warn("Firestore users query notice:", err);
      }

      // 2. Load Firestore "leaders" collection (Strict Real DB with query limit)
      try {
        const qLeaders = query(collection(db, "leaders"), limit(80));
        const leadersSnap = await getDocs(qLeaders);
        leadersSnap.forEach((docSnap) => {
          const lData = docSnap.data() as Leader;
          if (lData) {
            const lid = (lData.id || docSnap.id).trim();
            if (lid) {
              leaderMap.set(lid.toLowerCase(), {
                ...lData,
                id: lid,
              });
            }
          }
        });
      } catch (err) {
        console.warn("Firestore leaders query notice:", err);
      }

      // 3. Load Firestore "reports" collection (with query limit)
      try {
        const qReports = query(collection(db, "reports"), limit(80));
        const reportsSnap = await getDocs(qReports);
        reportsSnap.forEach((docSnap) => {
          const rData = docSnap.data() as ReportIssue;
          if (rData) {
            fetchedReports.push({
              ...rData,
              id: docSnap.id,
            });
          }
        });
      } catch (err) {
        console.warn("Firestore reports query notice:", err);
      }

      // Merge any live leaders passed in props if not present
      if (leaders && leaders.length > 0) {
        leaders.forEach((l) => {
          if (l.id && !leaderMap.has(l.id.toLowerCase())) {
            leaderMap.set(l.id.toLowerCase(), l);
          }
        });
      }

      if (isMounted) {
        // Exclude current logged-in user from connect suggestions
        const cleanCurrentId = (userProfile.id || "").toLowerCase();
        const cleanCurrentUsername = (userProfile.username || "").replace(/^@/, "").toLowerCase();
        const cleanCurrentEmail = (userProfile.email || "").toLowerCase();

        const finalUsers = Array.from(userMap.values()).filter((u) => {
          const uId = (u.id || "").toLowerCase();
          const uName = (u.username || "").replace(/^@/, "").toLowerCase();
          const uEmail = (u.email || "").toLowerCase();
          return (
            uId !== cleanCurrentId &&
            uName !== cleanCurrentUsername &&
            (!cleanCurrentEmail || uEmail !== cleanCurrentEmail)
          );
        });

        const finalLeaders = Array.from(leaderMap.values()).filter((l) => {
          const lId = (l.id || "").toLowerCase();
          const lUserId = (l.userId || "").toLowerCase();
          const lName = (l.username || "").replace(/^@/, "").toLowerCase();
          return (
            lId !== cleanCurrentId &&
            lUserId !== cleanCurrentId &&
            lName !== cleanCurrentUsername
          );
        });

        setDbUsers(finalUsers);
        setDbLeaders(finalLeaders);
        if (fetchedReports.length > 0) {
          setDbReports(fetchedReports);
        }

        // Follow state map
        const initialFollowMap: Record<string, boolean> = {};
        finalUsers.forEach((u) => {
          if (u.isFollowing) initialFollowMap[u.id] = true;
        });
        setFollowingMap(initialFollowMap);
        setLoading(false);
      }
    }

    loadPureFirestoreProfiles();

    return () => {
      isMounted = false;
    };
  }, [userProfile.id, leaders]);

  // Keep dbReports in sync with props
  useEffect(() => {
    if (reports && reports.length > 0) {
      setDbReports(reports);
    }
  }, [reports]);

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

  // Helper: Strictly calculate REAL resolved problem count from database reports
  const getRealSolvedCount = (id: string, username: string, fullName: string) => {
    const normId = (id || "").toLowerCase();
    const normUser = (username || "").toLowerCase().replace(/^@+/, "");
    const normName = (fullName || "").toLowerCase();

    return dbReports.filter((r) => {
      const status = (r.status || "").toLowerCase();
      const auditLvl = (r.auditLevel || "").toLowerCase();
      const isResolved =
        status === "resolved" ||
        auditLvl.includes("resolved") ||
        auditLvl.includes("verified closed") ||
        Boolean(r.resolvedImageUrl);

      if (!isResolved) return false;

      // Check if tagged / assigned / authored / claimed
      const isAuthor =
        (r.authorId && r.authorId.toLowerCase() === normId) ||
        (r.authorUsername &&
          r.authorUsername.toLowerCase().replace(/^@+/, "") === normUser);

      const isTagged =
        Array.isArray(r.taggedAuthorities) &&
        r.taggedAuthorities.some((ta) => {
          const cleanTa = ta.toLowerCase().replace(/^@+/, "");
          return (
            cleanTa === normUser ||
            cleanTa === normId ||
            (normUser && (cleanTa.includes(normUser) || normUser.includes(cleanTa)))
          );
        });

      const isClaimedDept =
        r.claimedByDept &&
        (normName.includes(r.claimedByDept.toLowerCase()) ||
          r.claimedByDept.toLowerCase().includes(normName));

      const isClaimedOfficer =
        r.claimedByOfficer &&
        (normName.includes(r.claimedByOfficer.toLowerCase()) ||
          r.claimedByOfficer.toLowerCase().includes(normName));

      return isAuthor || isTagged || isClaimedDept || isClaimedOfficer;
    }).length;
  };

  // Enterprise Deduplication: Public profiles (Real Citizen & Business only)
  const publicUsers = useMemo(() => {
    return dbUsers
      .filter((u) => {
        const cat = u.category || "citizen";
        const isGuest = u.id === "guest_citizen";
        return (cat === "citizen" || cat === "business") && !isGuest;
      });
  }, [dbUsers]);

  // Enterprise Deduplication: Verified Police Departments & Real Leaders strictly from Firestore
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

    const seenIdentifiers = new Set<string>();

    // 1. Representatives from Firestore `leaders` collection
    dbLeaders.forEach((l) => {
      const normId = l.id.toLowerCase();
      const normUser = (l.username || "").toLowerCase().replace(/^@+/, "");
      if (!seenIdentifiers.has(normId) && (!normUser || !seenIdentifiers.has(normUser))) {
        seenIdentifiers.add(normId);
        if (normUser) seenIdentifiers.add(normUser);

        // Strict DB verification check
        const isVerified = Boolean(l.verified !== false);

        const hasBreakdown = Boolean(
          l.systemScoreBreakdown?.criteria &&
          Array.isArray(l.systemScoreBreakdown.criteria) &&
          l.systemScoreBreakdown.criteria.length > 0
        );
        const validatedSystemScore = hasBreakdown && typeof l.systemScore === "number" ? l.systemScore : 0;
        const realSolvedCount = getRealSolvedCount(l.id, normUser, l.name);

        list.push({
          id: l.id,
          fullName: l.name,
          username: normUser,
          avatarUrl:
            l.image ||
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80",
          bio:
            l.bio ||
            `Elected ${l.title || "Representative"} representing ${
              l.constituency || l.location || "Constituency"
            }.`,
          location: l.constituency || l.location,
          category: "representative",
          verified: isVerified,
          positionTitle: l.title || "Elected Representative",
          partyOrDept: l.party,
          systemScore: validatedSystemScore,
          publicRating: typeof l.publicRating === "number" ? l.publicRating : 0,
          metricLabel: "SLA Solved",
          metricValue: `${realSolvedCount}`,
          originalLeader: l,
        });
      }
    });

    // 2. Official Police Departments & Real Representatives from Firestore `users` collection
    dbUsers.forEach((u) => {
      const uId = u.id.toLowerCase();
      const uName = (u.username || "").toLowerCase().replace(/^@+/, "");
      const isDept = u.category === "department";
      const isRep = u.category === "representative";

      if ((isDept || isRep) && !seenIdentifiers.has(uId) && (!uName || !seenIdentifiers.has(uName))) {
        seenIdentifiers.add(uId);
        if (uName) seenIdentifiers.add(uName);

        const isUserVerified = Boolean(
          u.verified === true || u.verificationStatus === "approved"
        );

        const hasBreakdown = Boolean(
          u.systemScoreBreakdown?.criteria &&
          Array.isArray(u.systemScoreBreakdown.criteria) &&
          u.systemScoreBreakdown.criteria.length > 0
        );
        const validatedSystemScore = hasBreakdown && typeof u.systemScore === "number" ? u.systemScore : 0;
        const realSolvedCount = getRealSolvedCount(u.id, uName, u.fullName);

        list.push({
          id: u.id,
          fullName: u.fullName,
          username: uName,
          avatarUrl:
            u.avatarUrl ||
            (isDept
              ? "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400&auto=format&fit=crop&q=80"
              : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80"),
          bio:
            u.bio ||
            (isDept ? "Official Government Department" : "Elected Representative"),
          location:
            (isDept
              ? u.departmentDetails?.jurisdictionRegion
              : u.representativeDetails?.constituency) ||
              u.location,
          category: u.category,
          verified: isUserVerified,
          positionTitle: isDept
            ? u.departmentDetails?.officialBadge || "Govt Department"
            : u.representativeDetails?.position || "Representative",
          partyOrDept: isDept
            ? u.departmentDetails?.name
            : u.representativeDetails?.party,
          systemScore: validatedSystemScore,
          publicRating: typeof u.publicRating === "number" ? u.publicRating : 0,
          metricLabel: "SLA Solved",
          metricValue: `${realSolvedCount}`,
        });
      }
    });

    return list;
  }, [dbLeaders, dbUsers, dbReports]);

  // Auto infinite scroll for leaders
  React.useEffect(() => {
    const sentinel = leaderSentinelRef.current;
    if (!sentinel || activeTab !== "leader") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          setVisibleLeadersCount((p) => p + 12);
        }
      },
      { rootMargin: "300px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab, leaderItems.length, visibleLeadersCount]);

  // Auto infinite scroll for public citizens
  React.useEffect(() => {
    const sentinel = publicSentinelRef.current;
    if (!sentinel || activeTab !== "public") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          setVisiblePublicCount((p) => p + 12);
        }
      },
      { rootMargin: "300px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab, publicUsers.length, visiblePublicCount]);

  return (
    <div className="max-w-xl mx-auto pb-24 md:pb-12 animate-fadeIn bg-white border-x border-slate-200 min-h-screen">
      {/* 1. Header: Clean Back Button + Brand Icon + Title */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 h-14 flex items-center justify-between">
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

      {/* 2. Two Clean Tabs: Leader & Public */}
      <div className="grid grid-cols-2 bg-white border-b border-slate-200 text-sm font-bold">
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
          <span>Leader ({leaderItems.length})</span>
        </button>

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
          <span>Public ({publicUsers.length})</span>
        </button>
      </div>

      {/* 3. Feed List: Real Database Profiles Only */}
      <div className="divide-y divide-slate-100">
        {loading ? (
          <div className="divide-y divide-slate-100 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 sm:p-5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0" />
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-4 bg-slate-200 rounded" />
                      <div className="w-14 h-4 bg-slate-100 rounded-full" />
                    </div>
                    <div className="w-24 h-3 bg-slate-100 rounded" />
                    <div className="w-[80%] h-3 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="w-20 h-8 bg-slate-200 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        ) : activeTab === "leader" ? (
          /* ================= LEADER TAB (REPRESENTATIVES & DEPARTMENTS) ================= */
          leaderItems.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-sm font-black text-slate-800">
                No Leaders Registered Yet
              </p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Verified representatives and official departments from Firestore will be listed here.
              </p>
            </div>
          ) : (
            <>
              {leaderItems.slice(0, visibleLeadersCount).map((item) => {
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
                  {/* Top Row: Avatar + Name + Verified Badge + Position Tag + Follow Button */}
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
                        {/* Name + Strict DB Verified Category Badge */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h2 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate flex items-center gap-1 leading-tight">
                            <span>{item.fullName}</span>
                            {item.verified && (
                              <CategoryVerifiedTick category={item.category} size="xs" />
                            )}
                          </h2>
                        </div>

                        {/* Official Badge / Position Title */}
                        {item.positionTitle && (
                          <div className="mt-1">
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded shrink-0 border inline-block ${
                                item.category === "representative"
                                  ? "bg-amber-50 text-amber-900 border-amber-200"
                                  : "bg-blue-50 text-blue-900 border-blue-200"
                              }`}
                            >
                              {item.positionTitle}
                            </span>
                          </div>
                        )}

                        {/* Affiliation & Location (NO redundant @username) */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mt-1 flex-wrap">
                          {item.partyOrDept && (
                            <span className="text-slate-700 font-bold">
                              {item.partyOrDept}
                            </span>
                          )}
                          {item.partyOrDept && item.location && (
                            <span className="text-slate-300">•</span>
                          )}
                          {item.location && (
                            <span className="text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </span>
                          )}
                        </div>
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

                  {/* Bio Description */}
                  {item.bio && (
                    <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">
                      {item.bio}
                    </p>
                  )}

                  {/* Accountability & Rating Metrics Strip */}
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
                        {(typeof item.publicRating === "number" ? item.publicRating : 0).toFixed(1)}
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      </span>
                    </div>

                    <div className="text-center px-1 py-0.5">
                      <span className="text-[10px] font-black uppercase text-slate-500 block tracking-tight truncate">
                        {item.metricLabel || "Active Term"}
                      </span>
                      <span className="text-xs sm:text-sm font-black text-emerald-600 leading-tight block mt-0.5 truncate">
                        {item.metricValue}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}

            {/* Leader Infinite Scroll Sentinel */}
            {leaderItems.length > visibleLeadersCount && (
              <div ref={leaderSentinelRef} className="h-8 w-full flex items-center justify-center py-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin opacity-40" />
              </div>
            )}
          </>
        )
      ) : (
          /* ================= PUBLIC TAB (CITIZENS & BUSINESS) ================= */
          publicUsers.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-black text-slate-800">
                No Public Profiles Yet
              </p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Registered citizens on Open Desh will be displayed here.
              </p>
            </div>
          ) : (
            <>
              {publicUsers.slice(0, visiblePublicCount).map((user) => {
                const isFollowing = followingMap[user.id] || false;
              const isBusiness = user.category === "business";
              const isVerified = Boolean(
                user.verified === true || user.verificationStatus === "approved"
              );
              const isRawUid = (str?: string) => Boolean(str && /^[a-zA-Z0-9_-]{20,}$/.test(str.replace(/^@/, "")));
              const displayFullName = (user.fullName && !isRawUid(user.fullName))
                ? user.fullName
                : (user.username && !isRawUid(user.username) ? user.username.replace(/^@/, "") : `Citizen (${user.id.slice(0, 6)})`);

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
                      <img
                        src={
                          user.avatarUrl ||
                          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80"
                        }
                        alt={displayFullName}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80";
                        }}
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                      />

                      <div className="min-w-0 flex-1">
                        {/* Name */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h2 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate leading-tight">
                            {displayFullName}
                          </h2>

                          {isBusiness && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 shrink-0">
                              {user.businessDetails?.industry || "Business"}
                            </span>
                          )}
                        </div>

                        {/* Username & Verified Badge */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold truncate mt-0.5">
                          <span>@{user.username ? user.username.replace(/^@+/, "") : displayFullName.toLowerCase().replace(/\s+/g, "_")}</span>
                          {isVerified && (
                            <CategoryVerifiedTick
                              category={
                                user.verifiedCategory ||
                                (user.verified ? user.category : undefined) ||
                                "citizen"
                              }
                              size="xs"
                            />
                          )}
                        </div>

                        {/* Location Details (NO redundant @username) */}
                        {user.location && (
                          <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-1 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{user.location}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Follow Action Button */}
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

                  {/* Bio Description */}
                  {user.bio && (
                    <p className="text-xs text-slate-700 leading-relaxed line-clamp-2 pl-0 sm:pl-1">
                      {user.bio}
                    </p>
                  )}
                </article>
              );
            })}

            {/* Public Citizens Infinite Scroll Sentinel */}
            {publicUsers.length > visiblePublicCount && (
              <div ref={publicSentinelRef} className="h-8 w-full flex items-center justify-center py-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin opacity-40" />
              </div>
            )}
          </>
        )
      )}
      </div>
    </div>
  );
};
