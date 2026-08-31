import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Settings2,
  X,
  MapPin,
  Building2,
  Users,
  ShieldCheck,
  Star,
  CheckCircle2,
  Heart,
  Repeat2,
  MessageCircle,
  Send,
  Sparkles,
  Award,
  Filter,
  Check,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  Flame,
  FileText,
  Briefcase,
  AlertTriangle,
  MoreVertical,
} from "lucide-react";
import {
  ReportIssue,
  Leader,
  InfrastructureProject,
  UserProfile,
  UserCategory,
} from "../types.ts";
import { db } from "../firebase.ts";
import { collection, getDocs, query as firestoreQuery, limit } from "firebase/firestore";
import { CategoryVerifiedTick } from "./CategoryBadge.tsx";
import { PostActionSheet } from "./PostActionSheet.tsx";
import { MediaBeforeAfterViewer } from "./MediaBeforeAfterViewer.tsx";
import { AnimatedLikeButton } from "./AnimatedLikeButton.tsx";
import {
  getCleanAuthorUsername,
  isReportAuthorVerified,
  getReportAuthorVerifiedCategory,
  cleanReportText,
  formatReportTimestamp,
} from "../utils/reportUtils.ts";

interface SearchHubViewProps {
  reports: ReportIssue[];
  leaders: Leader[];
  projects: InfrastructureProject[];
  userProfile: UserProfile;
  onNavigate: (view: string) => void;
  onSelectUser?: (userId: string) => void;
  onSelectLeaderProfile?: (leader: Leader) => void;
  onSelectPost?: (reportId: string) => void;
  onLikeReport?: (reportId: string) => Promise<void>;
  onReReport?: (reportId: string) => Promise<void>;
  onBookmark?: (reportId: string) => Promise<void>;
  onReply?: (reportId: string, text: string, parentReplyId?: string) => Promise<void>;
  onDeleteReport?: (reportId: string) => Promise<void>;
  onTogglePinReport?: (reportId: string, isCurrentlyPinned?: boolean) => Promise<void>;
  onMuteUser?: (authorUsername: string, authorId?: string) => void;
  mutedUsers?: string[];
  onOpenMobileSidebar?: () => void;
}

type SearchTab = "all" | "departments" | "leaders" | "reports" | "public";

export const SearchHubView: React.FC<SearchHubViewProps> = ({
  reports,
  leaders,
  projects,
  userProfile,
  onNavigate,
  onSelectUser,
  onSelectLeaderProfile,
  onSelectPost,
  onLikeReport,
  onReReport,
  onBookmark,
  onReply,
  onDeleteReport,
  onTogglePinReport,
  onMuteUser,
  mutedUsers = [],
  onOpenMobileSidebar,
}) => {
  const [activeActionReport, setActiveActionReport] = useState<ReportIssue | null>(null);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Filter settings
  const [isNearMeOnly, setIsNearMeOnly] = useState(true);
  const [selectedDeptCategory, setSelectedDeptCategory] = useState("All");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Live Database States
  const [dbUsers, setDbUsers] = useState<UserProfile[]>([]);
  const [dbLeaders, setDbLeaders] = useState<Leader[]>(leaders || []);
  const [dbReports, setDbReports] = useState<ReportIssue[]>(reports || []);
  const [loading, setLoading] = useState(true);

  // Interaction State for Reports
  const [replyInputMap, setReplyInputMap] = useState<Record<string, string>>({});
  const [activeReplyBoxReportId, setActiveReplyBoxReportId] = useState<string | null>(null);

  // Location Parsing for Priority Ranking
  const rawUserLocation = (userProfile.location || "Jharkhand, India").trim();
  const locationTokens = useMemo(() => {
    return rawUserLocation
      .toLowerCase()
      .split(/[,–\-\/]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 2);
  }, [rawUserLocation]);

  const primaryCityOrState = locationTokens[0] || "Jharkhand";

  // 1. Enterprise Scale: Load directly from Firestore database
  useEffect(() => {
    let isMounted = true;

    async function loadPureFirestoreData() {
      setLoading(true);
      const userMap = new Map<string, UserProfile>();
      const leaderMap = new Map<string, Leader>();
      const reportMap = new Map<string, ReportIssue>();

      // Fetch users from Firestore
      try {
        const qUsers = firestoreQuery(collection(db, "users"), limit(80));
        const snap = await getDocs(qUsers);
        snap.forEach((d) => {
          const uData = d.data() as UserProfile;
          if (uData) {
            const uid = (uData.id || d.id).trim();
            if (uid) {
              userMap.set(uid.toLowerCase(), { ...uData, id: uid });
            }
          }
        });
      } catch (err) {
        console.warn("Firestore users query notice in search:", err);
      }

      // Fetch leaders from Firestore
      try {
        const qLeaders = firestoreQuery(collection(db, "leaders"), limit(80));
        const snap = await getDocs(qLeaders);
        snap.forEach((d) => {
          const lData = d.data() as Leader;
          if (lData) {
            const lid = (lData.id || d.id).trim();
            if (lid) {
              leaderMap.set(lid.toLowerCase(), { ...lData, id: lid });
            }
          }
        });
      } catch (err) {
        console.warn("Firestore leaders query notice in search:", err);
      }

      // Fetch reports from Firestore
      try {
        const qReports = firestoreQuery(collection(db, "reports"), limit(80));
        const snap = await getDocs(qReports);
        snap.forEach((d) => {
          const rData = d.data() as ReportIssue;
          if (rData) {
            const rid = (rData.id || d.id).trim();
            if (rid) {
              reportMap.set(rid.toLowerCase(), { ...rData, id: rid });
            }
          }
        });
      } catch (err) {
        console.warn("Firestore reports query notice in search:", err);
      }

      // Merge props reports if any
      if (reports && reports.length > 0) {
        reports.forEach((r) => {
          if (r.id && !reportMap.has(r.id.toLowerCase())) {
            reportMap.set(r.id.toLowerCase(), r);
          }
        });
      }

      // Merge props leaders if any
      if (leaders && leaders.length > 0) {
        leaders.forEach((l) => {
          if (l.id && !leaderMap.has(l.id.toLowerCase())) {
            leaderMap.set(l.id.toLowerCase(), l);
          }
        });
      }

      if (isMounted) {
        // Exclude current user from suggestions
        const cleanCurrentId = (userProfile.id || "").toLowerCase();
        const cleanCurrentUsername = (userProfile.username || "").replace(/^@/, "").toLowerCase();

        const finalUsers = Array.from(userMap.values()).filter((u) => {
          const uId = (u.id || "").toLowerCase();
          const uName = (u.username || "").replace(/^@/, "").toLowerCase();
          return uId !== cleanCurrentId && uName !== cleanCurrentUsername;
        });

        const finalLeaders = Array.from(leaderMap.values()).filter((l) => {
          const lId = (l.id || "").toLowerCase();
          const lUserId = (l.userId || "").toLowerCase();
          return lId !== cleanCurrentId && lUserId !== cleanCurrentId;
        });

        const finalReports = Array.from(reportMap.values()).sort((a, b) => {
          const tA = new Date(a.createdAt || a.timestamp || 0).getTime();
          const tB = new Date(b.createdAt || b.timestamp || 0).getTime();
          return tB - tA;
        });

        setDbUsers(finalUsers);
        setDbLeaders(finalLeaders);
        setDbReports(finalReports);
        setLoading(false);
      }
    }

    loadPureFirestoreData();

    return () => {
      isMounted = false;
    };
  }, [userProfile.id, reports, leaders]);

  // Proximity Scoring Algorithm: Higher score = more relevant to user's area
  const calculateProximityScore = (targetLocation: string = "", targetJurisdiction: string = "") => {
    const locText = `${targetLocation} ${targetJurisdiction}`.toLowerCase();
    if (!locText.trim()) return 1;

    let score = 1;
    for (const token of locationTokens) {
      if (locText.includes(token)) {
        score += 10;
      }
    }
    return score;
  };

  // 2. Department Profiles (Area-Prioritized & Categorized Police Departments)
  const departmentProfiles = useMemo(() => {
    const q = query.toLowerCase().trim();
    const list: Array<{
      id: string;
      fullName: string;
      username: string;
      avatarUrl: string;
      category: UserCategory;
      verified: boolean;
      positionTitle: string;
      departmentName: string;
      jurisdiction: string;
      slaSolvedCount?: number;
      systemScore: number;
      publicRating: number;
      bio?: string;
      proximityScore: number;
      phone?: string;
      email?: string;
    }> = [];

    const seenIds = new Set<string>();

    dbUsers.forEach((u) => {
      if (u.category === "department") {
        const uId = u.id.toLowerCase();
        if (!seenIds.has(uId)) {
          seenIds.add(uId);

          const deptDetails = u.departmentDetails;
          const jurisdiction = deptDetails?.jurisdictionRegion || u.location || "Jurisdiction Area";
          const deptName = deptDetails?.name || u.fullName;
          const title = deptDetails?.officialBadge || deptDetails?.designation || "Govt Department";
          const isVerified = Boolean(u.verified === true || u.verificationStatus === "approved");

          if (verifiedOnly && !isVerified) return;

          if (selectedDeptCategory !== "All") {
            const matchesCategory =
              deptName.toLowerCase().includes(selectedDeptCategory.toLowerCase()) ||
              title.toLowerCase().includes(selectedDeptCategory.toLowerCase()) ||
              (u.bio && u.bio.toLowerCase().includes(selectedDeptCategory.toLowerCase()));
            if (!matchesCategory) return;
          }

          const proximityScore = calculateProximityScore(u.location, jurisdiction);

          // Query matching
          if (q) {
            const matchesQuery =
              u.fullName.toLowerCase().includes(q) ||
              deptName.toLowerCase().includes(q) ||
              title.toLowerCase().includes(q) ||
              jurisdiction.toLowerCase().includes(q) ||
              (u.bio && u.bio.toLowerCase().includes(q));
            if (!matchesQuery) return;
          }

          const hasBreakdown = Boolean(
            u.systemScoreBreakdown?.criteria &&
            Array.isArray(u.systemScoreBreakdown.criteria) &&
            u.systemScoreBreakdown.criteria.length > 0
          );
          const validatedSystemScore = hasBreakdown && typeof u.systemScore === "number" ? u.systemScore : 0;

          // Calculate real solved count strictly from database reports
          const normUId = u.id.toLowerCase();
          const normUName = (u.username || "").toLowerCase().replace(/^@+/, "");
          const normUFullName = u.fullName.toLowerCase();

          const realSolvedCount = (reports || []).filter((r) => {
            const status = (r.status || "").toLowerCase();
            const auditLvl = (r.auditLevel || "").toLowerCase();
            const isResolved =
              status === "resolved" ||
              auditLvl.includes("resolved") ||
              auditLvl.includes("verified closed") ||
              Boolean(r.resolvedImageUrl);
            if (!isResolved) return false;

            const isAuthor = (r.authorId && r.authorId.toLowerCase() === normUId) ||
              (r.authorUsername && r.authorUsername.toLowerCase().replace(/^@+/, "") === normUName);
            const isTagged = Array.isArray(r.taggedAuthorities) && r.taggedAuthorities.some((ta) => {
              const cleanTa = ta.toLowerCase().replace(/^@+/, "");
              return cleanTa === normUName || cleanTa === normUId || (normUName && cleanTa.includes(normUName));
            });
            const isClaimedDept = r.claimedByDept && (normUFullName.includes(r.claimedByDept.toLowerCase()) || r.claimedByDept.toLowerCase().includes(normUFullName));
            const isClaimedOfficer = r.claimedByOfficer && (normUFullName.includes(r.claimedByOfficer.toLowerCase()) || r.claimedByOfficer.toLowerCase().includes(normUFullName));

            return isAuthor || isTagged || isClaimedDept || isClaimedOfficer;
          }).length;

          list.push({
            id: u.id,
            fullName: u.fullName,
            username: (u.username || "").replace(/^@/, ""),
            avatarUrl:
              u.avatarUrl ||
              "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400&auto=format&fit=crop&q=80",
            category: "department",
            verified: isVerified,
            positionTitle: title,
            departmentName: deptName,
            jurisdiction: jurisdiction,
            slaSolvedCount: realSolvedCount,
            systemScore: validatedSystemScore,
            publicRating: typeof u.publicRating === "number" ? u.publicRating : 0,
            bio: u.bio,
            proximityScore: proximityScore,
          });
        }
      }
    });

    // Sort by proximity score descending, then by SLA/rating
    return list.sort((a, b) => b.proximityScore - a.proximityScore || b.systemScore - a.systemScore);
  }, [dbUsers, reports, query, isNearMeOnly, selectedDeptCategory, verifiedOnly, locationTokens]);

  // 3. Leader Profiles (Elected Representatives & Real Officials)
  const leaderProfiles = useMemo(() => {
    const q = query.toLowerCase().trim();
    const list: Array<{
      id: string;
      fullName: string;
      username: string;
      avatarUrl: string;
      category: UserCategory;
      verified: boolean;
      positionTitle: string;
      party: string;
      constituency: string;
      systemScore: number;
      publicRating: number;
      bio?: string;
      proximityScore: number;
      originalLeader?: Leader;
    }> = [];

    const seenIds = new Set<string>();

    // From Leaders Collection
    dbLeaders.forEach((l) => {
      const lid = l.id.toLowerCase();
      if (!seenIds.has(lid)) {
        seenIds.add(lid);

        const isVerified = Boolean(l.verified !== false);
        if (verifiedOnly && !isVerified) return;

        const proximityScore = calculateProximityScore(l.location, l.constituency);

        if (q) {
          const matchesQuery =
            l.name.toLowerCase().includes(q) ||
            (l.party && l.party.toLowerCase().includes(q)) ||
            (l.title && l.title.toLowerCase().includes(q)) ||
            (l.constituency && l.constituency.toLowerCase().includes(q)) ||
            (l.location && l.location.toLowerCase().includes(q)) ||
            (l.bio && l.bio.toLowerCase().includes(q));
          if (!matchesQuery) return;
        }

        const hasBreakdown = Boolean(
          l.systemScoreBreakdown?.criteria &&
          Array.isArray(l.systemScoreBreakdown.criteria) &&
          l.systemScoreBreakdown.criteria.length > 0
        );
        const validatedSystemScore = hasBreakdown && typeof l.systemScore === "number" ? l.systemScore : 0;

        list.push({
          id: l.id,
          fullName: l.name,
          username: (l.username || "").replace(/^@/, ""),
          avatarUrl:
            l.image ||
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80",
          category: "representative",
          verified: isVerified,
          positionTitle: l.title || "Elected Representative",
          party: l.party || "Public Official",
          constituency: l.constituency || l.location || "Constituency",
          systemScore: validatedSystemScore,
          publicRating: typeof l.publicRating === "number" ? l.publicRating : 0,
          bio: l.bio,
          proximityScore: proximityScore,
          originalLeader: l,
        });
      }
    });

    // From Users with representative category
    dbUsers.forEach((u) => {
      if (u.category === "representative") {
        const uid = u.id.toLowerCase();
        if (!seenIds.has(uid)) {
          seenIds.add(uid);

          const repDetails = u.representativeDetails;
          const isVerified = Boolean(u.verified === true || u.verificationStatus === "approved");
          if (verifiedOnly && !isVerified) return;

          const constituency = repDetails?.constituency || u.location || "Constituency";
          const proximityScore = calculateProximityScore(u.location, constituency);

          if (q) {
            const matchesQuery =
              u.fullName.toLowerCase().includes(q) ||
              (repDetails?.party && repDetails.party.toLowerCase().includes(q)) ||
              (repDetails?.position && repDetails.position.toLowerCase().includes(q)) ||
              constituency.toLowerCase().includes(q) ||
              (u.bio && u.bio.toLowerCase().includes(q));
            if (!matchesQuery) return;
          }

          const hasBreakdown = Boolean(
            u.systemScoreBreakdown?.criteria &&
            Array.isArray(u.systemScoreBreakdown.criteria) &&
            u.systemScoreBreakdown.criteria.length > 0
          );
          const validatedSystemScore = hasBreakdown && typeof u.systemScore === "number" ? u.systemScore : 0;

          list.push({
            id: u.id,
            fullName: u.fullName,
            username: (u.username || "").replace(/^@/, ""),
            avatarUrl:
              u.avatarUrl ||
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80",
            category: "representative",
            verified: isVerified,
            positionTitle: repDetails?.position || "Elected Representative",
            party: repDetails?.party || "Official",
            constituency: constituency,
            systemScore: validatedSystemScore,
            publicRating: typeof u.publicRating === "number" ? u.publicRating : 0,
            bio: u.bio,
            proximityScore: proximityScore,
          });
        }
      }
    });

    return list.sort((a, b) => b.proximityScore - a.proximityScore || b.systemScore - a.systemScore);
  }, [dbLeaders, dbUsers, query, verifiedOnly, locationTokens]);

  // 4. Public Profiles (Real Citizens & Verified Businesses)
  const publicProfiles = useMemo(() => {
    const q = query.toLowerCase().trim();
    return dbUsers
      .filter((u) => {
        const cat = u.category || "citizen";
        const isGuest = u.id === "guest_citizen";
        return (cat === "citizen" || cat === "business") && !isGuest;
      })
      .filter((u) => {
        const isVerified = Boolean(u.verified === true || u.verificationStatus === "approved");
        if (verifiedOnly && !isVerified) return false;

        if (!q) return true;
        return (
          u.fullName.toLowerCase().includes(q) ||
          (u.location && u.location.toLowerCase().includes(q)) ||
          (u.bio && u.bio.toLowerCase().includes(q)) ||
          (u.businessDetails?.companyName && u.businessDetails.companyName.toLowerCase().includes(q)) ||
          (u.businessDetails?.industry && u.businessDetails.industry.toLowerCase().includes(q))
        );
      })
      .map((u) => ({
        ...u,
        proximityScore: calculateProximityScore(u.location),
      }))
      .sort((a, b) => b.proximityScore - a.proximityScore);
  }, [dbUsers, query, verifiedOnly, locationTokens]);

  // 5. Reports Grievances
  const filteredReports = useMemo(() => {
    const q = query.toLowerCase().trim();
    return dbReports.filter((r) => {
      const locString = `${r.location?.city || ""} ${r.location?.address || ""}`.toLowerCase();
      const textString = `${r.text || ""} ${r.category || ""} ${r.authorName || ""}`.toLowerCase();

      if (q) {
        if (!locString.includes(q) && !textString.includes(q)) return false;
      }

      if (isNearMeOnly && !q) {
        // Match proximity
        const isNear = locationTokens.some((t) => locString.includes(t));
        return isNear || locString.includes("jharkhand") || locString.includes("ranchi");
      }

      return true;
    });
  }, [dbReports, query, isNearMeOnly, locationTokens]);

  const handleSendReply = async (reportId: string) => {
    const text = replyInputMap[reportId];
    if (!text || !text.trim()) return;

    if (onReply) {
      await onReply(reportId, text.trim());
    }
    setReplyInputMap((prev) => ({ ...prev, [reportId]: "" }));
    setActiveReplyBoxReportId(null);
  };

  const clearSearch = () => {
    setQuery("");
  };

  return (
    <div className="max-w-xl mx-auto pb-24 md:pb-12 animate-fadeIn bg-white border-x border-slate-200 min-h-screen">
      {/* 1. Header: User Avatar + Search Input + Settings */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-3.5 py-2.5 border-b border-slate-200 flex items-center gap-2.5">
        {/* Left: User Avatar (Profile trigger) */}
        <button
          onClick={() => {
            if (onOpenMobileSidebar) {
              onOpenMobileSidebar();
            } else {
              onNavigate("profile");
            }
          }}
          className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200 hover:scale-105 transition-transform cursor-pointer"
          title="Open Profile"
        >
          <img
            src={
              userProfile.avatarUrl ||
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80"
            }
            alt={userProfile.fullName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80";
            }}
          />
        </button>

        {/* Center: Search Input Bar Pill */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            id="explore-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search departments, leaders, grievances..."
            className="w-full pl-9 pr-8 py-2 bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-full text-xs sm:text-sm font-medium text-slate-900 focus:outline-none transition-all placeholder:text-slate-500"
            autoFocus
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              title="Clear Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Filter & Location Settings */}
        <button
          id="explore-settings-btn"
          onClick={() => setIsSettingsOpen(true)}
          className={`p-2 rounded-full transition-colors cursor-pointer shrink-0 ${
            isSettingsOpen || !isNearMeOnly || selectedDeptCategory !== "All"
              ? "bg-blue-50 text-blue-600 border border-blue-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
          title="Explore & Location Settings"
        >
          <Settings2 className="w-5 h-5" />
        </button>
      </header>

      {/* 2. Sub-Tabs: Clean X-Style Navigation */}
      <nav className="border-b border-slate-200 bg-white sticky top-[53px] z-20">
        <div className="flex justify-between overflow-x-auto no-scrollbar px-2 sm:px-4">
          {(
            [
              { id: "all", label: "Top / All" },
              { id: "departments", label: `Departments (${departmentProfiles.length})` },
              { id: "leaders", label: `Leaders (${leaderProfiles.length})` },
              { id: "reports", label: `Grievances (${filteredReports.length})` },
              { id: "public", label: `Public (${publicProfiles.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3 text-xs sm:text-sm font-extrabold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* 3. Location Priority Banner */}
      {isNearMeOnly && (
        <div className="px-4 py-2 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900 animate-fadeIn">
          <div className="flex items-center gap-1.5 font-semibold truncate">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">Prioritizing departments & leaders near {rawUserLocation}</span>
          </div>
          <button
            onClick={() => setIsNearMeOnly(false)}
            className="text-blue-700 font-extrabold hover:underline shrink-0 ml-2 text-[11px] cursor-pointer"
          >
            Show Nationwide
          </button>
        </div>
      )}

      {/* 4. Active Department Filter Chip (if selected in settings) */}
      {selectedDeptCategory !== "All" && (
        <div className="px-4 py-1.5 bg-amber-50 border-b border-amber-100 flex items-center justify-between text-xs text-amber-900">
          <span className="font-bold flex items-center gap-1">
            <Filter className="w-3 h-3 text-amber-600" />
            <span>Filtered by: {selectedDeptCategory}</span>
          </span>
          <button
            onClick={() => setSelectedDeptCategory("All")}
            className="text-amber-700 font-extrabold hover:underline text-[11px] cursor-pointer"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* 5. Main Search Results & Dynamic Feeds */}
      <div>
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">
              Indexing verified database records...
            </p>
          </div>
        ) : activeTab === "all" ? (
          /* ================= TAB 1: ALL / TOP (AREA-PRIORITIZED DEPARTMENTS & LEADERS) ================= */
          <div className="divide-y divide-slate-100">
            {/* A. Top Nearby Government Departments Strip (PRIMARY FOCUS) */}
            <div className="p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Area Government Departments</span>
                </span>
                <button
                  onClick={() => setActiveTab("departments")}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  View All ({departmentProfiles.length})
                </button>
              </div>

              {departmentProfiles.length === 0 ? (
                <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                  No verified departments registered in this area yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {departmentProfiles.slice(0, 3).map((dept) => (
                    <article
                      key={dept.id}
                      onClick={() => onSelectUser && onSelectUser(dept.id)}
                      className="p-3.5 bg-white border border-slate-200/90 rounded-2xl hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <img
                            src={dept.avatarUrl}
                            alt={dept.fullName}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=400&auto=format&fit=crop&q=80";
                            }}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                {dept.fullName}
                              </h3>
                              {dept.verified && (
                                <CategoryVerifiedTick category="department" size="xs" />
                              )}
                            </div>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 inline-block mt-0.5">
                              {dept.positionTitle}
                            </span>
                            <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-1 truncate">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{dept.jurisdiction}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full block mb-1">
                            SLA {dept.systemScore}%
                          </span>
                          <span className="text-[11px] text-emerald-600 font-black block">
                            {dept.slaSolvedCount}+ Solved
                          </span>
                        </div>
                      </div>

                      {dept.bio && (
                        <p className="text-xs text-slate-600 line-clamp-1 pl-0.5">
                          {dept.bio}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* B. Nearby Elected Representatives & Leaders */}
            {leaderProfiles.length > 0 && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Elected Leaders & Representatives</span>
                  </span>
                  <button
                    onClick={() => setActiveTab("leaders")}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    View All ({leaderProfiles.length})
                  </button>
                </div>

                <div className="space-y-2">
                  {leaderProfiles.slice(0, 2).map((leader) => (
                    <article
                      key={leader.id}
                      onClick={() => {
                        if (leader.originalLeader && onSelectLeaderProfile) {
                          onSelectLeaderProfile(leader.originalLeader);
                        } else if (onSelectUser) {
                          onSelectUser(leader.id);
                        }
                      }}
                      className="p-3 bg-white border border-slate-200/90 rounded-2xl flex items-center justify-between gap-3 hover:border-blue-400 transition-all shadow-2xs cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img
                          src={leader.avatarUrl}
                          alt={leader.fullName}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80";
                          }}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 group-hover:scale-105 transition-transform"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 truncate">
                              {leader.fullName}
                            </h4>
                            {leader.verified && (
                              <CategoryVerifiedTick category="representative" size="xs" />
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 truncate block">
                            {leader.party} • {leader.constituency}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full block mb-0.5">
                          Score: {leader.systemScore}/100
                        </span>
                        <div className="flex items-center justify-end text-xs text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                          <span>{leader.publicRating.toFixed(1)}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* C. Suggested Citizen & Public Profiles Discovery */}
            {publicProfiles.length > 0 && (
              <div className="p-4 bg-slate-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Suggested Citizens & Local Businesses</span>
                  </span>
                  <button
                    onClick={() => setActiveTab("public")}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    View More
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {publicProfiles.slice(0, 4).map((user) => {
                    const isRawUid = (str?: string) => Boolean(str && /^[a-zA-Z0-9_-]{20,}$/.test(str.replace(/^@/, "")));
                    const displayFullName = (user.fullName && !isRawUid(user.fullName))
                      ? user.fullName
                      : (user.username && !isRawUid(user.username) ? user.username.replace(/^@/, "") : `Citizen (${user.id.slice(0, 6)})`);

                    return (
                      <div
                        key={user.id}
                        onClick={() => onSelectUser && onSelectUser(user.id)}
                        className="p-3 bg-white border border-slate-200/80 rounded-xl hover:border-blue-300 transition-colors cursor-pointer flex items-center gap-2.5 shadow-2xs"
                      >
                        <img
                          src={
                            user.avatarUrl ||
                            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80"
                          }
                          alt={displayFullName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-xs text-slate-900 truncate">
                            {displayFullName}
                          </h4>
                          <p className="text-[10px] text-slate-500 truncate">
                            {user.location || "Citizen"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* D. Recent Civic Grievances Feed */}
            <div className="divide-y divide-slate-100">
              <div className="px-4 py-2.5 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Recent Grievances in Area</span>
                <button
                  onClick={() => setActiveTab("reports")}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              {filteredReports.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No active civic reports found for this area.
                </div>
              ) : (
                filteredReports.slice(0, 5).map((report) => (
                  <article
                    key={report.id}
                    className="p-4 hover:bg-slate-50/60 transition-colors space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div
                        onClick={() => onSelectUser && onSelectUser(report.authorId)}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <img
                          src={
                            report.authorAvatar ||
                            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80"
                          }
                          alt={report.authorName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <span className="font-extrabold text-[16px] text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                            <span>{getCleanAuthorUsername(report.authorUsername, report.authorName)}</span>
                            {isReportAuthorVerified(report, userProfile) && (
                              <CategoryVerifiedTick category={getReportAuthorVerifiedCategory(report, userProfile)} size="xs" />
                            )}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatReportTimestamp(report.createdAt || report.timestamp)} • {report.location.city}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                        {report.category}
                      </span>
                    </div>

                    <p className="text-sm sm:text-base text-slate-900 font-normal leading-relaxed">
                      {cleanReportText(report.text)}
                    </p>

                    {/* Media Section: 4:5 Aspect Ratio */}
                    {(report.imageUrl || (report.images && report.images.length > 0) || report.resolvedImageUrl) && (
                      <MediaBeforeAfterViewer
                        beforeImages={report.images && report.images.length > 0 ? report.images : report.imageUrl ? [report.imageUrl] : []}
                        afterImage={report.resolvedImageUrl}
                        reportId={report.id}
                        isCompact={true}
                      />
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                      <AnimatedLikeButton
                        isLiked={Boolean(report.likedBy?.includes(userProfile.id))}
                        likesCount={report.likesCount || 0}
                        onLike={() => onLikeReport && onLikeReport(report.id)}
                        size="sm"
                        className="py-1 px-1.5"
                      />

                      <button
                        onClick={() => onReReport && onReReport(report.id)}
                        className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors cursor-pointer py-1 px-1.5"
                      >
                        <Repeat2 className="w-4 h-4 text-emerald-600" />
                        <span>{report.reReportsCount}</span>
                      </button>

                      <button
                        onClick={() => {
                          if (onSelectPost) {
                            onSelectPost(report.id);
                          } else {
                            setActiveReplyBoxReportId(
                              activeReplyBoxReportId === report.id ? null : report.id
                            );
                          }
                        }}
                        className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer py-1 px-1.5"
                      >
                        <MessageCircle className="w-4 h-4 text-blue-500" />
                        <span>{report.repliesCount}</span>
                      </button>

                      <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                        {report.status}
                      </span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        ) : activeTab === "departments" ? (
          /* ================= TAB 2: DEPARTMENTS ONLY ================= */
          <div className="p-4 space-y-3 animate-fadeIn">
            {departmentProfiles.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-black text-slate-800">No matching departments found</p>
                <p className="text-xs text-slate-500">
                  Try adjusting your search query or enabling nationwide search in settings.
                </p>
              </div>
            ) : (
              departmentProfiles.map((dept) => (
                <article
                  key={dept.id}
                  onClick={() => onSelectUser && onSelectUser(dept.id)}
                  className="p-4 bg-white border border-slate-200/90 rounded-2xl hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer space-y-3 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <img
                        src={dept.avatarUrl}
                        alt={dept.fullName}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=400&auto=format&fit=crop&q=80";
                        }}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-black text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                            {dept.fullName}
                          </h3>
                          {dept.verified && (
                            <CategoryVerifiedTick category="department" size="xs" />
                          )}
                        </div>

                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 inline-block mt-0.5">
                          {dept.positionTitle}
                        </span>

                        <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{dept.jurisdiction}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full block mb-1">
                        Score {dept.systemScore}
                      </span>
                      <span className="text-[11px] text-emerald-600 font-black block">
                        {dept.slaSolvedCount}+ Solved
                      </span>
                    </div>
                  </div>

                  {dept.bio && (
                    <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">
                      {dept.bio}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
                    <span className="text-blue-600 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Govt Verified Authority</span>
                    </span>
                    <span className="flex items-center gap-1 text-slate-700 group-hover:text-blue-600">
                      <span>View Desk</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : activeTab === "leaders" ? (
          /* ================= TAB 3: LEADERS ONLY ================= */
          <div className="p-4 space-y-3 animate-fadeIn">
            {leaderProfiles.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <Users className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-black text-slate-800">No leaders found</p>
                <p className="text-xs text-slate-500">Try adjusting your search criteria.</p>
              </div>
            ) : (
              leaderProfiles.map((leader) => (
                <article
                  key={leader.id}
                  onClick={() => {
                    if (leader.originalLeader && onSelectLeaderProfile) {
                      onSelectLeaderProfile(leader.originalLeader);
                    } else if (onSelectUser) {
                      onSelectUser(leader.id);
                    }
                  }}
                  className="p-4 bg-white border border-slate-200/90 rounded-2xl flex items-center justify-between gap-3 hover:border-blue-400 transition-all shadow-2xs cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={leader.avatarUrl}
                      alt={leader.fullName}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80";
                      }}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 truncate">
                          {leader.fullName}
                        </h4>
                        {leader.verified && (
                          <CategoryVerifiedTick category="representative" size="xs" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {leader.party} • {leader.constituency}
                      </p>
                      {leader.bio && (
                        <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                          {leader.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full block mb-1">
                      Score: {leader.systemScore}/100
                    </span>
                    <div className="flex items-center justify-end text-xs text-amber-500 font-bold">
                      <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                      <span>{leader.publicRating.toFixed(1)}</span>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : activeTab === "reports" ? (
          /* ================= TAB 4: GRIEVANCES ONLY ================= */
          <div className="divide-y divide-slate-100 animate-fadeIn">
            {filteredReports.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-black text-slate-800">No grievances found</p>
                <p className="text-xs text-slate-500">
                  Try searching for a different issue, area, or category.
                </p>
              </div>
            ) : (
              filteredReports.map((report) => (
                <article
                  key={report.id}
                  className="p-4 hover:bg-slate-50/60 transition-colors space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div
                      onClick={() => onSelectUser && onSelectUser(report.authorId)}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <img
                        src={
                          report.authorAvatar ||
                          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80"
                        }
                        alt={report.authorName}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <span className="font-extrabold text-[16px] text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                          <span>{getCleanAuthorUsername(report.authorUsername, report.authorName)}</span>
                          {isReportAuthorVerified(report, userProfile) && (
                            <CategoryVerifiedTick category={getReportAuthorVerifiedCategory(report, userProfile)} size="xs" />
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatReportTimestamp(report.createdAt || report.timestamp)} • {report.location.city}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                        {report.category}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveActionReport(report);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                        title="More Options"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm sm:text-base text-slate-900 font-normal leading-relaxed">
                    {cleanReportText(report.text)}
                  </p>

                  {/* Media Section: 4:5 Aspect Ratio */}
                  {(report.imageUrl || (report.images && report.images.length > 0) || report.resolvedImageUrl) && (
                    <MediaBeforeAfterViewer
                      beforeImages={report.images && report.images.length > 0 ? report.images : report.imageUrl ? [report.imageUrl] : []}
                      afterImage={report.resolvedImageUrl}
                      reportId={report.id}
                      isCompact={true}
                    />
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <AnimatedLikeButton
                      isLiked={Boolean(report.likedBy?.includes(userProfile.id))}
                      likesCount={report.likesCount || 0}
                      onLike={() => onLikeReport && onLikeReport(report.id)}
                      size="sm"
                      className="py-1 px-1.5"
                    />

                    <button
                      onClick={() => onReReport && onReReport(report.id)}
                      className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors cursor-pointer py-1 px-1.5"
                    >
                      <Repeat2 className="w-4 h-4 text-emerald-600" />
                      <span>{report.reReportsCount}</span>
                    </button>

                    <button
                      onClick={() => onSelectPost && onSelectPost(report.id)}
                      className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer py-1 px-1.5"
                    >
                      <MessageCircle className="w-4 h-4 text-blue-500" />
                      <span>{report.repliesCount}</span>
                    </button>

                    <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                      {report.status}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : (
          /* ================= TAB 5: PUBLIC ONLY ================= */
          <div className="p-4 space-y-3 animate-fadeIn">
            {publicProfiles.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <Users className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-black text-slate-800">No public profiles found</p>
                <p className="text-xs text-slate-500">Registered citizens will appear here.</p>
              </div>
            ) : (
              publicProfiles.map((user) => {
                const isRawUid = (str?: string) => Boolean(str && /^[a-zA-Z0-9_-]{20,}$/.test(str.replace(/^@/, "")));
                const displayFullName = (user.fullName && !isRawUid(user.fullName))
                  ? user.fullName
                  : (user.username && !isRawUid(user.username) ? user.username.replace(/^@/, "") : `Citizen (${user.id.slice(0, 6)})`);

                return (
                  <article
                    key={user.id}
                    onClick={() => onSelectUser && onSelectUser(user.id)}
                    className="p-4 bg-white border border-slate-200/90 rounded-2xl flex items-center justify-between gap-3 hover:border-blue-400 transition-all shadow-2xs cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={
                          user.avatarUrl ||
                          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80"
                        }
                        alt={displayFullName}
                        className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-sm text-slate-900 group-hover:text-blue-600 truncate">
                          {displayFullName}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold truncate">
                          <span>@{user.username ? user.username.replace(/^@+/, "") : displayFullName.toLowerCase().replace(/\s+/g, "_")}</span>
                          {(user.verified || user.verificationStatus === "approved") && (
                            <CategoryVerifiedTick
                              category={
                                user.verifiedCategory ||
                                (user.verified ? user.category : undefined) ||
                                "citizen"
                              }
                              size="xs"
                            />
                          )}
                          {user.category === "business" && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 shrink-0">
                              {user.businessDetails?.industry || "Business"}
                            </span>
                          )}
                        </div>
                      {user.location && (
                        <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{user.location}</span>
                        </p>
                      )}
                      {user.bio && (
                        <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectUser) onSelectUser(user.id);
                      }}
                      className="text-xs font-bold px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full transition-all cursor-pointer shadow-2xs"
                    >
                      View
                    </button>
                  </div>
                </article>
              );
            })
            )}
          </div>
        )}
      </div>

      {/* 6. Location & Civic Department Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-extrabold text-slate-900">
                  Search & Location Preferences
                </h2>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
              {/* Location Toggle */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>Prioritize Your Area ({primaryCityOrState})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNearMeOnly(!isNearMeOnly)}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      isNearMeOnly ? "bg-blue-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 bg-white rounded-full shadow-sm transition-transform absolute top-0.5 ${
                        isNearMeOnly ? "left-6.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-slate-600 font-normal leading-relaxed">
                  When enabled, search prioritizes government departments, representatives, and issues located in <strong>{rawUserLocation}</strong>.
                </p>
              </div>

              {/* Verified Authority Filter Toggle */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Verified Profiles Only</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVerifiedOnly(!verifiedOnly)}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      verifiedOnly ? "bg-emerald-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 bg-white rounded-full shadow-sm transition-transform absolute top-0.5 ${
                        verifiedOnly ? "left-6.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-slate-600 font-normal leading-relaxed">
                  Only show verified administrative departments and elected leaders.
                </p>
              </div>

              {/* Department Category Filter */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-600 tracking-wide block">
                  Filter by Department Authority
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "All",
                    "Public Works (PWD)",
                    "Water & Sanitation (Jal Board)",
                    "Electricity & Power",
                    "Municipal Corporation",
                    "Police & Traffic",
                    "Anti-Corruption Bureau",
                  ].map((dept) => (
                    <button
                      key={dept}
                      onClick={() => setSelectedDeptCategory(dept === "All" ? "All" : dept.split("(")[0].trim())}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        selectedDeptCategory === (dept === "All" ? "All" : dept.split("(")[0].trim())
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply Button */}
              <div className="pt-2">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm py-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Search Preferences</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-Up Post Action & Moderation Sheet */}
      {activeActionReport && (
        <PostActionSheet
          report={activeActionReport}
          userProfile={userProfile}
          isOpen={!!activeActionReport}
          onClose={() => setActiveActionReport(null)}
          onDeleteReport={onDeleteReport}
          onTogglePinReport={onTogglePinReport}
          onMuteUser={onMuteUser}
          isAuthorMuted={
            mutedUsers.includes(
              (activeActionReport.authorUsername || "").replace(/^@/, "").toLowerCase()
            ) ||
            (activeActionReport.authorId ? mutedUsers.includes(activeActionReport.authorId.toLowerCase()) : false)
          }
        />
      )}
    </div>
  );
};
