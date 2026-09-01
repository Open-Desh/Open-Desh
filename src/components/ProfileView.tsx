import React, { useState } from "react";
import {
  ArrowLeft,
  MoreVertical,
  MapPin,
  Link as LinkIcon,
  Calendar,
  Star,
  Sparkles,
  Edit3,
  Share2,
  CheckCircle2,
  MessageCircle,
  Repeat2,
  Heart,
  Award,
  ExternalLink,
  ShieldCheck,
  Check,
  TrendingUp,
  Activity,
  Copy,
  RefreshCw,
  Sliders,
  Scale,
  Pin,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Flame,
  Building2,
  AtSign,
  Bookmark,
  AlertTriangle,
  Lock,
  Mail,
  Key,
  ShieldAlert,
  UserCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { UserProfile, ReportIssue } from "../types.ts";
import { ServicesMindMap } from "./ServicesMindMap.tsx";
import { AnimatedLikeButton } from "./AnimatedLikeButton.tsx";
import { EvaluationDetailView } from "./EvaluationDetailView.tsx";
import { PostActionSheet } from "./PostActionSheet.tsx";
import { MediaBeforeAfterViewer } from "./MediaBeforeAfterViewer.tsx";
import { ExpandablePostText } from "./ExpandablePostText.tsx";
import {
  cleanReportText,
  getCleanAuthorUsername,
  isReportAuthorVerified,
  getReportAuthorVerifiedCategory,
  getReportAuthorAvatar,
  formatReportTimestamp,
} from "../utils/reportUtils.ts";
import {
  CategoryBadge,
  CategoryVerifiedTick,
  CategoryGetVerifiedButton,
} from "./CategoryBadge.tsx";
import { claimOfficialProfileInFirestore } from "../lib/firestoreSync.ts";

interface ProfileViewProps {
  userProfile: UserProfile;
  activeUser: UserProfile;
  userReports: ReportIssue[];
  allReports?: ReportIssue[];
  isLoggedIn?: boolean;
  onBack?: () => void;
  onNavigateToEditProfile?: () => void;
  onNavigateToVerification?: () => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  onRateUser?: (rating: number, comment: string) => Promise<void>;
  onReplyToReview?: (reviewId: string, replyText: string) => Promise<void>;
  onToggleFollow?: (targetUserId: string) => Promise<void>;
  onMentionUser?: (userProfile: UserProfile) => void;
  onNavigateToPost?: (reportId: string) => void;
  onLikeReport?: (reportId: string) => void;
  onReReport?: (reportId: string) => void;
  onBookmark?: (reportId: string) => void;
  onReply?: (reportId: string, replyText: string) => void;
  onDeleteReport?: (reportId: string) => Promise<void>;
  onTogglePinReport?: (reportId: string, isCurrentlyPinned?: boolean) => Promise<void>;
  onMuteUser?: (authorUsername: string, authorId?: string) => void;
  mutedUsers?: string[];
  onSelectUser?: (userId: string) => void;
  onClaimProfile?: (
    profileId: string,
    credentials: {
      email: string;
      password?: string;
      officerName: string;
      designation: string;
      departmentCode?: string;
    }
  ) => Promise<void>;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  activeUser,
  userReports,
  allReports = [],
  isLoggedIn = false,
  onBack,
  onNavigateToEditProfile,
  onNavigateToVerification,
  onUpdateProfile,
  onRateUser,
  onReplyToReview,
  onToggleFollow,
  onMentionUser,
  onNavigateToPost,
  onLikeReport,
  onReReport,
  onBookmark,
  onReply,
  onDeleteReport,
  onTogglePinReport,
  onMuteUser,
  mutedUsers = [],
  onSelectUser,
  onClaimProfile,
}) => {
  const [activeTab, setActiveTab] = useState<
    "Report" | "Services" | "Performance" | "Replies" | "Rereport"
  >("Report");
  const [evaluationViewTab, setEvaluationViewTab] = useState<"score" | "reviews" | "writereview" | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isFollowSubmitting, setIsFollowSubmitting] = useState(false);

  // Active slide index for multi-image evidence carousels
  const [activeImageSlideIndex, setActiveImageSlideIndex] = useState<
    Record<string, number>
  >({});

  // Slide-up action sheet state for 3-dot report options
  const [selectedReportForActions, setSelectedReportForActions] =
    useState<ReportIssue | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setActionToast(message);
    setTimeout(() => {
      setActionToast((prev) => (prev === message ? null : prev));
    }, 3000);
  };

  // Normalize profile identifiers
  const cleanProfileId = userProfile.id?.replace(/^@/, "").trim().toLowerCase();
  const cleanProfileUsername = userProfile.username?.replace(/^@/, "").trim().toLowerCase();

  // Derive isFollowing accurately from logged-in activeUser state
  const isActivelyFollowing = React.useMemo(() => {
    if (!activeUser) return Boolean(userProfile.isFollowing);
    const followingList = (activeUser.following || []).map((f) =>
      f.replace(/^@/, "").trim().toLowerCase()
    );

    const isIdInFollowing = cleanProfileId ? followingList.includes(cleanProfileId) : false;
    const isUsernameInFollowing = cleanProfileUsername
      ? followingList.includes(cleanProfileUsername)
      : false;
    const isUserInFollowers =
      Array.isArray(userProfile.followers) && activeUser.id
        ? userProfile.followers.some((f) => {
            const cleanF = f.replace(/^@/, "").trim().toLowerCase();
            return (
              cleanF === activeUser.id.toLowerCase() ||
              (activeUser.username && cleanF === activeUser.username.replace(/^@/, "").trim().toLowerCase())
            );
          })
        : false;

    return isIdInFollowing || isUsernameInFollowing || isUserInFollowers || Boolean(userProfile.isFollowing);
  }, [activeUser?.following, activeUser?.id, activeUser?.username, cleanProfileId, cleanProfileUsername, userProfile.followers, userProfile.isFollowing]);

  const [localFollowing, setLocalFollowing] = useState<boolean>(isActivelyFollowing);
  const [visibleReportsCount, setVisibleReportsCount] = useState<number>(10);
  const profileReportsSentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setLocalFollowing(isActivelyFollowing);
  }, [isActivelyFollowing]);

  const baseFollowersCount =
    typeof userProfile.followersCount === "number"
      ? userProfile.followersCount
      : Array.isArray(userProfile.followers)
      ? userProfile.followers.length
      : 0;

  const effectiveFollowersCount = React.useMemo(() => {
    let count = baseFollowersCount;
    if (localFollowing) {
      if (!isActivelyFollowing) {
        count += 1;
      } else if (count === 0) {
        count = 1;
      }
    } else {
      if (isActivelyFollowing) {
        count = Math.max(0, count - 1);
      }
    }
    return count;
  }, [baseFollowersCount, localFollowing, isActivelyFollowing]);

  // Effective list of reports authored by or routed to this user
  const effectiveAuthoredReports = React.useMemo(() => {
    const source = allReports && allReports.length > 0 ? allReports : userReports;
    const filtered = (source || []).filter((r) => {
      const rAuthorId = r.authorId?.trim().toLowerCase();
      const rAuthorUsername = r.authorUsername?.replace(/^@/, "").trim().toLowerCase();

      const isAuthor =
        (cleanProfileId && rAuthorId === cleanProfileId) ||
        (cleanProfileUsername && rAuthorUsername === cleanProfileUsername);

      const isTaggedOrRouted =
        cleanProfileUsername &&
        (r.taggedOfficials?.some(
          (t) => t.replace(/^@/, "").trim().toLowerCase() === cleanProfileUsername
        ) ||
          r.routedDepartment?.toLowerCase().includes(cleanProfileUsername));

      return (
        isAuthor ||
        (userProfile.category === "department" && isTaggedOrRouted) ||
        (userProfile.category === "representative" && isTaggedOrRouted)
      );
    });

    const list = filtered;
    // Sort pinned reports first
    return [...list].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }, [allReports, userReports, cleanProfileId, cleanProfileUsername, userProfile.category]);

  // Auto infinite scroll for profile reports
  React.useEffect(() => {
    const sentinel = profileReportsSentinelRef.current;
    if (!sentinel || activeTab !== "Report") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          setVisibleReportsCount((p) => p + 10);
        }
      },
      { rootMargin: "300px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab, effectiveAuthoredReports.length, visibleReportsCount]);

  const effectivePostsCount = effectiveAuthoredReports.length;

  // Collect all real replies made by this userProfile across all reports
  const userReplies = React.useMemo(() => {
    const list: { report: ReportIssue; reply: any }[] = [];
    const source = allReports && allReports.length > 0 ? allReports : userReports;

    const searchReplies = (report: ReportIssue, replies?: any[]) => {
      if (!replies) return;
      for (const rep of replies) {
        if (
          rep.authorId === userProfile.id ||
          (userProfile.username &&
            rep.authorUsername?.toLowerCase() === userProfile.username.toLowerCase())
        ) {
          list.push({ report, reply: rep });
        }
        if (rep.replies && rep.replies.length > 0) {
          searchReplies(report, rep.replies);
        }
      }
    };

    for (const report of source) {
      searchReplies(report, report.replies);
    }
    return list;
  }, [allReports, userReports, userProfile.id, userProfile.username]);

  // Collect all real re-reports (both post re-reports and reply/comment re-reports) made by this userProfile
  const userRereports = React.useMemo(() => {
    type RereportItem =
      | { type: "report"; report: ReportIssue }
      | { type: "reply"; report: ReportIssue; reply: any };

    const list: RereportItem[] = [];
    const source = allReports && allReports.length > 0 ? allReports : userReports;

    for (const r of source) {
      // 1. Post itself re-reported by user
      if (
        r.reReportedBy?.includes(userProfile.id) ||
        (userProfile.username && r.reReportedBy?.includes(userProfile.username))
      ) {
        list.push({ type: "report", report: r });
      }

      // 2. Comments/Replies re-reported by user
      const searchReplyRereports = (replies?: any[]) => {
        if (!replies) return;
        for (const rep of replies) {
          if (
            rep.reReportedBy?.includes(userProfile.id) ||
            (userProfile.username && rep.reReportedBy?.includes(userProfile.username))
          ) {
            list.push({ type: "reply", report: r, reply: rep });
          }
          if (rep.replies && rep.replies.length > 0) {
            searchReplyRereports(rep.replies);
          }
        }
      };

      searchReplyRereports(r.replies);
    }

    return list;
  }, [allReports, userReports, userProfile.id, userProfile.username]);

  const isOwnProfile = Boolean(
    isLoggedIn &&
    activeUser &&
    (
      (userProfile.id && activeUser.id && userProfile.id.toLowerCase() === activeUser.id.toLowerCase()) ||
      (userProfile.username && activeUser.username && userProfile.username.replace(/^@/, "").toLowerCase() === activeUser.username.replace(/^@/, "").toLowerCase()) ||
      (userProfile.email && activeUser.email && userProfile.email.toLowerCase() === activeUser.email.toLowerCase()) ||
      (userProfile.userId && activeUser.id && userProfile.userId.toLowerCase() === activeUser.id.toLowerCase()) ||
      (userProfile.id && activeUser.username && userProfile.id.replace(/^@/, "").toLowerCase() === activeUser.username.replace(/^@/, "").toLowerCase()) ||
      (userProfile.username && activeUser.id && userProfile.username.replace(/^@/, "").toLowerCase() === activeUser.id.toLowerCase())
    )
  );

  const isLeadershipOrDept =
    userProfile.category === "representative" ||
    userProfile.category === "department" ||
    userProfile.category === "business";

  // Claim official profile states
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimEmail, setClaimEmail] = useState(userProfile.email || "");
  const [claimPassword, setClaimPassword] = useState("");
  const [claimOfficerName, setClaimOfficerName] = useState(userProfile.claimedByOfficerName || "");
  const [claimDesignation, setClaimDesignation] = useState(
    userProfile.departmentDetails?.designation || "Nodal Police Officer"
  );
  const [claimDeptCode, setClaimDeptCode] = useState(
    userProfile.departmentDetails?.departmentCode || ""
  );
  const [isClaimSubmitting, setIsClaimSubmitting] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);

  // Effective profile claim status
  const isProfileActuallyClaimed = Boolean(
    userProfile.isClaimed ||
    userProfile.claimedAt ||
    userProfile.claimedByOfficerName ||
    userProfile.claimedByEmail ||
    isOwnProfile
  );

  // Check if this profile is an official/system profile eligible for claim
  const isClaimableProfile = Boolean(
    !isOwnProfile &&
    !isProfileActuallyClaimed &&
    (userProfile.isClaimable !== false) &&
    (userProfile.category === "department" ||
      userProfile.category === "representative" ||
      userProfile.id?.startsWith("user_") ||
      userProfile.id?.startsWith("dept_") ||
      userProfile.id?.startsWith("rep_"))
  );

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimEmail.trim()) {
      setClaimError("Please enter your official government/department email.");
      return;
    }
    if (!claimPassword || claimPassword.length < 6) {
      setClaimError("Password must be at least 6 characters long.");
      return;
    }
    if (!claimOfficerName.trim()) {
      setClaimError("Please enter the authorized officer / nodal person name.");
      return;
    }

    setIsClaimSubmitting(true);
    setClaimError(null);

    try {
      if (onClaimProfile) {
        await onClaimProfile(userProfile.id, {
          email: claimEmail.trim(),
          password: claimPassword,
          officerName: claimOfficerName.trim(),
          designation: claimDesignation.trim() || "Nodal Officer / Police Administrator",
          departmentCode: claimDeptCode.trim() || userProfile.departmentDetails?.departmentCode || "",
        });
      } else {
        await claimOfficialProfileInFirestore(userProfile.id, {
          email: claimEmail.trim(),
          officerName: claimOfficerName.trim(),
          designation: claimDesignation.trim() || "Nodal Officer / Police Administrator",
          departmentCode: claimDeptCode.trim() || userProfile.departmentDetails?.departmentCode || "",
        });
      }

      setClaimSuccess(true);
      showToast("Profile successfully claimed! You are now the official administrator.");
      setTimeout(() => {
        setShowClaimModal(false);
        setClaimSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error("Claim error:", err);
      setClaimError(err.message || "Failed to claim profile. Please try again.");
    } finally {
      setIsClaimSubmitting(false);
    }
  };

  const availableTabs = isLeadershipOrDept
    ? ([
        { id: "Report", label: "Reports" },
        { id: "Services", label: "Service" },
        { id: "Performance", label: "Performance & Impact" },
        { id: "Replies", label: "Replies" },
        { id: "Rereport", label: "Rereports" },
      ] as const)
    : ([
        { id: "Report", label: "Reports" },
        { id: "Replies", label: "Replies" },
        { id: "Rereport", label: "Rereports" },
      ] as const);

  const currentActiveTab =
    !isLeadershipOrDept && (activeTab === "Services" || activeTab === "Performance")
      ? "Report"
      : activeTab;

  const handleToggleFollowAction = async () => {
    if (isFollowSubmitting) return;
    setIsFollowSubmitting(true);
    const nextState = !localFollowing;
    setLocalFollowing(nextState);
    try {
      if (onToggleFollow) {
        await onToggleFollow(userProfile.id || userProfile.username);
      }
    } catch (err) {
      console.warn("Follow toggle failed:", err);
      setLocalFollowing(!nextState);
    } finally {
      setIsFollowSubmitting(false);
    }
  };

  const getBadges = () => {
    switch (userProfile.category) {
      case "department":
        return {
          primary: "DEPARTMENT",
          primaryColor: "bg-amber-600 text-white",
          secondary: isOwnProfile ? "GOVT VERIFIED" : "RATE DEPT",
          secondaryColor: isOwnProfile ? "bg-slate-900 text-white" : "bg-blue-600 text-white",
          roleTitle: userProfile.departmentDetails
            ? `${userProfile.departmentDetails.designation} • ${userProfile.departmentDetails.name}`
            : "Govt Verified Department Officer",
        };
      case "representative":
        return {
          primary: "REPRESENTATIVE",
          primaryColor: "bg-blue-600 text-white",
          secondary: isOwnProfile ? "ELECTED MEMBER" : "RATE LEADER",
          secondaryColor: isOwnProfile ? "bg-slate-900 text-white" : "bg-blue-600 text-white",
          roleTitle: userProfile.representativeDetails
            ? `${userProfile.representativeDetails.position} • ${userProfile.representativeDetails.party}`
            : "Elected Public Representative",
        };
      case "business":
        return {
          primary: "BUSINESS / COMPANY",
          primaryColor: "bg-indigo-600 text-white",
          secondary: isOwnProfile ? "ENTERPRISE" : "VERIFIED ORG",
          secondaryColor: "bg-slate-900 text-white",
          roleTitle: userProfile.businessDetails
            ? `${userProfile.businessDetails.industry || "Enterprise"} • ${userProfile.businessDetails.companyName || userProfile.fullName}`
            : "Registered Business & Corporate Entity",
        };
      default:
        return {
          primary: "CITIZEN",
          primaryColor: "bg-blue-600 text-white",
          secondary: "VERIFIED RESIDENT",
          secondaryColor: "bg-emerald-600 text-white",
          roleTitle: userProfile.citizenDetails?.occupation || "Civic Citizen Contributor",
        };
    }
  };

  const badgeInfo = getBadges();

  // Helper to check if a string looks like an unformatted raw Firebase Auth UID
  const isRawUid = (str?: string) => Boolean(str && /^[a-zA-Z0-9_-]{20,}$/.test(str.replace(/^@/, "")));

  // 1. Top Bar: Clean username ONLY without '@' and WITHOUT verified tick (Instagram layout)
  const headerUsername = (() => {
    const rawUname = userProfile.username ? userProfile.username.replace(/^@+/, "") : "";
    if (rawUname && !isRawUid(rawUname)) {
      return rawUname;
    }
    if (userProfile.fullName && !isRawUid(userProfile.fullName)) {
      return userProfile.fullName.toLowerCase().replace(/[^a-zA-Z0-9_]/g, "_");
    }
    return `citizen_${(userProfile.id || "resident").slice(0, 6)}`;
  })();

  // 2. Profile Card: Real Full Name WITH verified tick
  const profileFullName = (() => {
    if (userProfile.fullName && userProfile.fullName.trim() !== "" && !isRawUid(userProfile.fullName)) {
      return userProfile.fullName;
    }
    if (userProfile.username && !isRawUid(userProfile.username)) {
      return userProfile.username.replace(/^@+/, "");
    }
    return `Citizen (${(userProfile.id || "resident").slice(0, 6)})`;
  })();

  const handleCopyProfileLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const handleResetCache = () => {
    localStorage.removeItem("open_desh_profile_cache");
    localStorage.removeItem("open_nation_profile_cache");
    alert("Profile local state cache cleared successfully.");
    setIsMenuOpen(false);
  };

  const handlePinAction = async () => {
    if (!selectedReportForActions) return;
    const targetReport = selectedReportForActions;
    const isPinned = Boolean(targetReport.isPinned);
    setSelectedReportForActions(null);
    if (onTogglePinReport) {
      await onTogglePinReport(targetReport.id, isPinned);
      showToast(
        isPinned ? "Report unpinned from profile" : "Report pinned to top of profile"
      );
    }
  };

  const handleDeleteAction = async () => {
    if (!selectedReportForActions) return;
    const targetReport = selectedReportForActions;
    setSelectedReportForActions(null);
    setShowDeleteConfirm(false);
    if (onDeleteReport) {
      await onDeleteReport(targetReport.id);
      showToast("Report deleted successfully");
    }
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case "Resolved":
        return "bg-emerald-50 text-emerald-800 border border-emerald-200";
      case "In Progress":
        return "bg-blue-50 text-blue-800 border border-blue-200";
      case "Under Dept Review":
        return "bg-amber-50 text-amber-800 border border-amber-200";
      default:
        return "bg-rose-50 text-rose-800 border border-rose-200";
    }
  };

  // If user clicked System Score, Public Rating, or Reviews, render the dedicated EvaluationDetailView page
  if (evaluationViewTab) {
    return (
      <EvaluationDetailView
        targetProfile={userProfile}
        currentUser={activeUser}
        initialTab={evaluationViewTab}
        onBack={() => setEvaluationViewTab(null)}
        onSubmitReview={async (rating, comment) => {
          if (onRateUser) {
            await onRateUser(rating, comment);
          }
        }}
        onReplyToReview={async (reviewId, replyText) => {
          if (onReplyToReview) {
            await onReplyToReview(reviewId, replyText);
          }
        }}
      />
    );
  }

  return (
    <div className="max-w-xl mx-auto pb-12 animate-fadeIn bg-white border-x border-slate-200 min-h-screen">
      {/* 1. Seamless Fixed Top Header (Without bottom border to mix directly with profile card) */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-1 text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Top Bar: Clean Username WITH Verified Badge (+2px larger username: 18px, +1px badge: 17px) */}
            <h1 className="text-[18px] font-extrabold text-slate-900 leading-none truncate">
              {headerUsername}
            </h1>
            {userProfile.verified && (
              <span className="shrink-0">
                <CategoryVerifiedTick
                  category={userProfile.verifiedCategory || (userProfile.verified ? userProfile.category : undefined) || "citizen"}
                  size="xs"
                  className="!w-[17px] !h-[17px]"
                />
              </span>
            )}
          </div>
        </div>

        {/* 3-Dots Action Button (Opens Modern Bottom Action Sheet) */}
        <div>
          <button
            id="profile-action-sheet-trigger"
            onClick={() => setIsMenuOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Profile Options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Main Profile Card */}
      <div className="p-4 sm:p-5 pt-2 space-y-4">
        {/* DP & Top Metrics Row */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Avatar Picture */}
          <div className="shrink-0">
            {userProfile.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt={profileFullName}
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-full object-cover border border-slate-200 shadow-xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-blue-100 text-blue-900 font-black text-xl flex items-center justify-center border border-blue-200">
                DP
              </div>
            )}
          </div>

          {/* Right Info: Real Full Name & Counters (No verified badge on full name) */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-sm sm:text-base md:text-lg font-extrabold text-slate-900 leading-snug line-clamp-2 break-words">
                {profileFullName}
              </h2>
            </div>

            {/* 3 Stats Counters */}
            <div className="flex items-center gap-4 sm:gap-6 mt-2.5 text-slate-900">
              <div>
                <span className="font-black text-sm sm:text-base block leading-none">
                  {effectivePostsCount.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-medium">posts</span>
              </div>
              <div>
                <span className="font-black text-sm sm:text-base block leading-none">
                  {effectiveFollowersCount >= 1000
                    ? `${(effectiveFollowersCount / 1000).toFixed(0)}K`
                    : effectiveFollowersCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">followers</span>
              </div>
              <div>
                <span className="font-black text-sm sm:text-base block leading-none">
                  {userProfile.followingCount || 0}
                </span>
                <span className="text-xs text-slate-500 font-medium">following</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Category Verification Badge Area */}
        <div className="flex items-center gap-2 flex-wrap">
          {(() => {
            const verifiedApprovedCategory =
              userProfile.verifiedCategory ||
              (userProfile.verified ? userProfile.category : undefined) ||
              "citizen";
            const effectiveCategoryForBadge = userProfile.verified
              ? verifiedApprovedCategory
              : userProfile.category;

            const isPendingNewCategory = Boolean(
              userProfile.verified &&
              userProfile.category &&
              userProfile.category !== verifiedApprovedCategory
            );

            return (
              <>
                {/* 1. Official Approved/Active Category Badge */}
                <CategoryBadge
                  category={effectiveCategoryForBadge}
                  verified={Boolean(userProfile.verified)}
                  verifiedCategory={verifiedApprovedCategory}
                  size="sm"
                />

                {/* 2. "Get verified" / "Under Review" Button:
                    Visible to own profile when:
                    a) User is unverified (!userProfile.verified)
                    OR
                    b) User has selected a new category in edit profile that requires verification documents (isPendingNewCategory) */}
                {isOwnProfile && (!userProfile.verified || isPendingNewCategory) && (
                  <CategoryGetVerifiedButton
                    category={userProfile.category}
                    status={
                      userProfile.verificationSubmittedCategory === userProfile.category &&
                      userProfile.verificationStatus === "pending"
                        ? "pending"
                        : (!userProfile.verified ? userProfile.verificationStatus : "none")
                    }
                    onClick={() => {
                      if (onNavigateToVerification) {
                        onNavigateToVerification();
                      } else if (onNavigateToEditProfile) {
                        onNavigateToEditProfile();
                      }
                    }}
                  />
                )}
              </>
            );
          })()}

          {/* Secondary Rate Action (ONLY visible when profile is claimed or verified to prevent unverified evaluation) */}
          {!isOwnProfile &&
            isProfileActuallyClaimed &&
            (userProfile.category === "representative" ||
              userProfile.category === "department" ||
              userProfile.category === "business") && (
              <button
                onClick={() => setEvaluationViewTab("writereview")}
                className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide shadow-2xs hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>
                  {userProfile.category === "representative"
                    ? "RATE LEADER"
                    : userProfile.category === "department"
                    ? "RATE DEPT"
                    : "RATE BUSINESS"}
                </span>
              </button>
            )}

          {/* Claim Profile Action Button (When profile is unverified / unclaimed) */}
          {isClaimableProfile && (
            <button
              onClick={() => {
                setClaimError(null);
                setClaimSuccess(false);
                setShowClaimModal(true);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide shadow-2xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Claim Handle</span>
            </button>
          )}
        </div>

        {/* Unclaimed & Unofficial Statutory Disclaimer Banner */}
        {isClaimableProfile && (
          <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3 sm:p-3.5 flex items-start gap-3 text-amber-900 shadow-2xs animate-fadeIn">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-amber-800">
                  Unclaimed Official Directory Index
                </span>
                <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-md">
                  Awaiting Verification
                </span>
              </div>
              <p className="text-xs text-amber-800/90 font-medium leading-relaxed">
                This handle is an indexing entry created for civic grievance tagging and is not yet managed by the authorized nodal officer. Citizen ratings and audits will activate once claimed.
              </p>
              <div className="pt-1">
                <button
                  onClick={() => {
                    setClaimError(null);
                    setClaimSuccess(false);
                    setShowClaimModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-amber-900 hover:text-amber-950 underline underline-offset-2 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Are you the official authority? Claim & verify this handle →</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bio & Details Section */}
        <div className="space-y-1.5">
          <p className="text-[16px] sm:text-[18px] text-slate-800 font-normal leading-relaxed">
            {userProfile.bio ||
              (userProfile.category === "representative"
                ? "Public Representative & Civic Tech Advocate working for urban transparency and infrastructural acceleration in Jharkhand."
                : userProfile.category === "department"
                ? "Official government authority desk handling citizen grievances and SLA resolution."
                : userProfile.category === "business"
                ? "Registered enterprise and civic partner organization."
                : "Active citizen contributor in Open Desh civic governance.")}
          </p>

          {/* Location & External Link & Joined Date */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium pt-1">
            <span className="flex items-center gap-1 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{userProfile.location || "Jharkhand, India"}</span>
            </span>

            {userProfile.websiteUrl && (
              <a
                href={userProfile.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:underline truncate max-w-[260px]"
              >
                <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{userProfile.websiteUrl.replace(/^https?:\/\//, "")}</span>
              </a>
            )}

            <span className="flex items-center gap-1 text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Joined{" "}
                {userProfile.joiningDate
                  ? new Date(userProfile.joiningDate).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })
                  : "August 2026"}
              </span>
            </span>
          </div>
        </div>

        {/* 3. Performance Scorecard Card (Rendered for Representative & Department ONLY when claimed) */}
        {isLeadershipOrDept && isProfileActuallyClaimed && (
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 sm:p-4 grid grid-cols-3 divide-x divide-slate-200 shadow-2xs">
            {/* System Score */}
            {(() => {
              const hasBreakdown =
                userProfile.systemScoreBreakdown?.criteria &&
                Array.isArray(userProfile.systemScoreBreakdown.criteria) &&
                userProfile.systemScoreBreakdown.criteria.length > 0;
              const displayScore = hasBreakdown && typeof userProfile.systemScore === "number"
                ? userProfile.systemScore
                : 0;

              return (
                <div
                  onClick={() => setEvaluationViewTab("score")}
                  className="px-2 text-center cursor-pointer hover:bg-slate-100/70 rounded-xl transition-colors py-1 group"
                  title="View 100-Pt Algorithm Breakdown"
                >
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5 group-hover:text-blue-600 transition-colors">
                    SYSTEM SCORE
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-blue-600 block leading-tight">
                    {displayScore}
                  </span>
                </div>
              );
            })()}

            {/* Public Rating */}
            <div
              onClick={() => setEvaluationViewTab("reviews")}
              className="px-2 text-center cursor-pointer hover:bg-slate-100/70 rounded-xl transition-colors py-1 group"
              title="View Verified Citizen Ratings"
            >
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5 group-hover:text-amber-600 transition-colors">
                PUBLIC RATING
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 flex items-center justify-center gap-1 leading-tight">
                {typeof userProfile.publicRating === "number" ? userProfile.publicRating.toFixed(1) : "0.0"}
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </span>
            </div>

            {/* Reviews */}
            <div
              onClick={() => setEvaluationViewTab("reviews")}
              className="px-2 text-center cursor-pointer hover:bg-slate-100/70 rounded-xl transition-colors py-1 group"
              title="View All Reviews"
            >
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5 group-hover:text-slate-900 transition-colors">
                REVIEWS
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 block leading-tight">
                {userProfile.reviewsCount
                  ? userProfile.reviewsCount >= 1000
                    ? `${(userProfile.reviewsCount / 1000).toFixed(1)}K`
                    : userProfile.reviewsCount
                  : 0}
              </span>
            </div>
          </div>
        )}

        {/* 4. Dynamic Action Buttons (Self: Edit & Share vs Other: Mention & Follow) */}
        {isOwnProfile ? (
          <div className="flex gap-2.5 pt-1">
            <button
              id="edit-my-profile-btn"
              onClick={() => {
                if (onNavigateToEditProfile) {
                  onNavigateToEditProfile();
                }
              }}
              className="flex-1 py-2.5 px-4 rounded-full border border-slate-300 text-slate-900 text-xs sm:text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-slate-600" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={handleCopyProfileLink}
              className="py-2.5 px-5 rounded-full border border-slate-300 text-slate-900 text-xs sm:text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-slate-600" />
              <span>Share</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              id="mention-profile-btn"
              onClick={() => {
                if (onMentionUser) {
                  onMentionUser(userProfile);
                }
              }}
              className="py-2.5 px-4 rounded-full border border-slate-300 text-slate-900 text-xs sm:text-sm font-extrabold hover:bg-slate-50 transition-all text-center shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Mention</span>
            </button>
            <button
              id="follow-profile-btn"
              onClick={handleToggleFollowAction}
              disabled={isFollowSubmitting}
              className={`py-2.5 px-4 rounded-full text-xs sm:text-sm font-extrabold transition-all text-center shadow-xs cursor-pointer disabled:opacity-60 ${
                localFollowing
                  ? "bg-slate-100 text-slate-800 border border-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  : "bg-slate-900 text-white hover:bg-black"
              }`}
            >
              {localFollowing ? "Following" : "Follow"}
            </button>
          </div>
        )}
      </div>

      {/* 5. Sub-Navigation Tabs */}
      <div className="border-b border-slate-200 bg-white sticky top-[53px] z-20 shadow-2xs">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar px-3 sm:px-5">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 px-3 sm:px-4 text-sm sm:text-base font-extrabold transition-all border-b-2 whitespace-nowrap cursor-pointer shrink-0 ${
                currentActiveTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 6. Tab Content Display */}
      <div className="divide-y divide-slate-100">
        {/* TAB 1: REPORTS (Full Home Feed Layout + 3-Dot Options) */}
        {activeTab === "Report" && (
          <div className="divide-y divide-slate-100">
            {effectiveAuthoredReports.length > 0 ? (
              <>
                {effectiveAuthoredReports
                  .slice(0, visibleReportsCount)
                  .map((report) => {
                    const imageList =
                  Array.isArray(report.images) && report.images.length > 0
                    ? report.images
                    : report.imageUrl
                    ? [report.imageUrl]
                    : [];
                const currentSlide = activeImageSlideIndex[report.id] || 0;
                const hasDeptClaimed = Boolean(
                  report.claimedByDept ||
                    report.claimedByOfficer ||
                    (report.departmentStatusLevel &&
                      report.departmentStatusLevel > 0)
                );
                const currentDeptLevel =
                  report.departmentStatusLevel ?? (hasDeptClaimed ? 1 : 0);
                const isLiked =
                  report.likedBy?.includes(activeUser?.id) || false;
                const isReReported =
                  report.reReportedBy?.includes(activeUser?.id) || false;
                const isBookmarked =
                  activeUser?.savedReports?.includes(report.id) || false;

                return (
                  <article
                    key={report.id}
                    id={`profile-report-card-${report.id}`}
                    onClick={() =>
                      onNavigateToPost && onNavigateToPost(report.id)
                    }
                    className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors space-y-3 cursor-pointer select-none group/card"
                  >
                    {/* Pinned Report Banner (if pinned) */}
                    {report.isPinned && (
                      <div className="flex items-center gap-1.5 text-[11px] font-black text-blue-600 pb-0.5">
                        <Pin className="w-3.5 h-3.5 rotate-45 text-blue-600 fill-blue-600" />
                        <span>Pinned Report</span>
                      </div>
                    )}

                    {/* Header: Author + GPS + Status Badge + 3-Dot Button */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img
                          src={getReportAuthorAvatar(report, activeUser || userProfile)}
                          alt={report.authorName}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectUser) onSelectUser(report.authorId);
                          }}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 cursor-pointer shadow-2xs shrink-0 hover:opacity-85"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {(() => {
                              const cleanUsername = getCleanAuthorUsername(
                                report.authorUsername,
                                report.authorName
                              );
                              const isVerified = isReportAuthorVerified(report, userProfile);
                              const effectiveVerifiedCategory = getReportAuthorVerifiedCategory(
                                report,
                                userProfile
                              );

                              return (
                                <div className="flex items-center gap-1 min-w-0 max-w-[180px] sm:max-w-[260px] md:max-w-[340px]">
                                  <h3
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onSelectUser)
                                        onSelectUser(report.authorId);
                                    }}
                                    className="text-[16px] font-extrabold text-slate-900 cursor-pointer hover:underline truncate whitespace-nowrap"
                                    title={cleanUsername}
                                  >
                                    {cleanUsername}
                                  </h3>
                                  {isVerified && (
                                    <CategoryVerifiedTick
                                      category={effectiveVerifiedCategory}
                                      size="xs"
                                    />
                                  )}
                                </div>
                              );
                            })()}

                            {report.authorBadge &&
                              isReportAuthorVerified(report) && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 shrink-0">
                                  {report.authorBadge}
                                </span>
                              )}

                            {report.urgencyLevel === "Critical Emergency" && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 flex items-center gap-0.5 shrink-0">
                                <Flame className="w-2.5 h-2.5" /> Urgent
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 min-w-0">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[150px] sm:max-w-[220px]">
                              {report.location?.city || "Jharkhand, India"}
                            </span>
                            <span>•</span>
                            <span className="shrink-0">
                              {formatReportTimestamp(report.createdAt || report.timestamp)}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Status Pill + 3-Dot Action Button */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${getStatusPill(
                            report.status
                          )}`}
                        >
                          {report.status}
                        </span>

                        {/* 3-Dot Action Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReportForActions(report);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                          title="Report Options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Text Description with 3-line Clamp & Read More */}
                    <ExpandablePostText text={report.text} />

                    {/* Structured Parameters Quick Badge Bar */}
                    {report.structuredDetails &&
                      Object.keys(report.structuredDetails).length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {Object.entries(report.structuredDetails).map(
                            ([key, val]) => {
                              if (!val) return null;
                              const label = key
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (s) => s.toUpperCase());
                              return (
                                <span
                                  key={key}
                                  className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200/80 px-2 py-0.5 rounded-md font-semibold"
                                >
                                  <strong className="text-slate-900">
                                    {label}:
                                  </strong>{" "}
                                  {val}
                                </span>
                              );
                            }
                          )}
                        </div>
                      )}

                    {/* Media Section: Cloudflare R2 Multi-Image Carousel or Before/After/Compare Viewer */}
                    {(imageList.length > 0 || report.resolvedImageUrl) && (
                      <MediaBeforeAfterViewer
                        beforeImages={imageList}
                        afterImage={report.resolvedImageUrl}
                        reportId={report.id}
                        isCompact={true}
                        actionCardSlot={
                          <div className="flex items-center justify-between text-slate-300 text-xs w-full">
                            {/* Reply Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectPost) onSelectPost(report.id);
                              }}
                              className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
                            >
                              <MessageCircle className="w-4 h-4 text-blue-400" />
                              <span className="font-bold text-white">
                                {report.replies?.length || report.repliesCount || 0} Reply
                              </span>
                            </button>

                            {/* Re-Report / Amplify */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onReReport) onReReport(report.id);
                              }}
                              className={`flex items-center gap-2 transition-colors cursor-pointer ${
                                isReReported ? "text-emerald-400 font-extrabold" : "hover:text-white"
                              }`}
                            >
                              <Repeat2 className="w-4 h-4" />
                              <span className="font-bold">{report.reReportsCount || 0}</span>
                            </button>

                            {/* Like / Endorse */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onLike) onLike(report.id);
                              }}
                              className={`flex items-center gap-2 transition-colors cursor-pointer ${
                                isLiked ? "text-rose-500 font-extrabold" : "hover:text-white"
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                              <span className="font-bold">{report.likesCount || 0}</span>
                            </button>

                            {/* Bookmark */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onBookmark) onBookmark(report.id);
                              }}
                              className={`flex items-center gap-2 transition-colors cursor-pointer hover:text-white ${
                                isSaved ? "text-blue-400 font-extrabold" : ""
                              }`}
                            >
                              <Bookmark
                                className={`w-4 h-4 ${isSaved ? "fill-blue-400 text-blue-400" : ""}`}
                              />
                            </button>

                            {/* Share */}
                            <button
                              onClick={(e) => handleShare(e, report)}
                              className="flex items-center gap-1.5 transition-colors cursor-pointer hover:text-white"
                              title="Share"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>
                        }
                      />
                    )}

                    {/* Tagged Authorities Routing Chips */}
                    {(() => {
                      const officers = (report.taggedOfficers || []).map((t) =>
                        t.replace(/^@+/, "")
                      );
                      const leaders = (report.taggedLeaders || []).map((t) =>
                        t.replace(/^@+/, "")
                      );
                      const uniqueOfficers = Array.from(
                        new Set(officers)
                      ).filter(Boolean);
                      const uniqueLeaders = Array.from(
                        new Set(leaders)
                      ).filter(Boolean);

                      if (
                        uniqueOfficers.length === 0 &&
                        uniqueLeaders.length === 0
                      )
                        return null;

                      return (
                        <div className="flex items-center gap-1.5 flex-wrap text-[11px] pt-0.5">
                          {uniqueOfficers.map((tag) => (
                            <span
                              key={tag}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectUser) onSelectUser(tag);
                              }}
                              className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:underline border border-blue-200/70 px-2.5 py-0.5 rounded-full cursor-pointer transition-colors"
                            >
                              <Building2 className="w-3 h-3 text-blue-600" />
                              @{tag}
                            </span>
                          ))}
                          {uniqueLeaders.map((tag) => (
                            <span
                              key={tag}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectUser) onSelectUser(tag);
                              }}
                              className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:underline border border-indigo-200/70 px-2.5 py-0.5 rounded-full cursor-pointer transition-colors"
                            >
                              <AtSign className="w-3 h-3 text-indigo-600" />
                              @{tag}
                            </span>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Statutory Triage Information Banner */}
                    {report.aiTriage && (
                      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-blue-600" />{" "}
                            Statutory Triage: {report.aiTriage.departmentTag}
                          </span>
                          <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                            Urgency Score: {report.aiTriage.urgencyScore}/10
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-normal">
                          {report.aiTriage.sentimentSummary}
                        </p>
                      </div>
                    )}

                    {/* Official Department Action Progress Card - 100% Edge to Edge */}
                    <div className="-mx-4 sm:-mx-5 px-4 sm:px-5 py-3 bg-slate-50/90 border-y border-blue-200/80 rounded-none space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                            <span>
                              Official Action
                              {hasDeptClaimed &&
                              (report.claimedByOfficer || report.claimedByDept)
                                ? ":"
                                : ""}
                            </span>
                            {hasDeptClaimed &&
                            (report.claimedByOfficer ||
                              report.claimedByDept) ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const target =
                                    report.claimedByOfficer ||
                                    report.claimedByDept ||
                                    "";
                                  const clean = getCleanAuthorUsername(target);
                                  if (onSelectUser && clean) onSelectUser(clean);
                                }}
                                className="text-blue-600 hover:underline inline-flex items-center gap-0.5 font-extrabold cursor-pointer normal-case"
                              >
                                <span>
                                  @
                                  {getCleanAuthorUsername(
                                    report.claimedByOfficer ||
                                      report.claimedByDept ||
                                      ""
                                  )}
                                </span>
                                <ExternalLink className="w-3 h-3 text-blue-600" />
                              </button>
                            ) : null}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            hasDeptClaimed
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {hasDeptClaimed
                            ? `Stage ${currentDeptLevel}/3: ${report.status}`
                            : "Waiting"}
                        </span>
                      </div>

                      {/* 4-Stage Progress Timeline */}
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        {[
                          { level: 0, label: "Triaged" },
                          { level: 1, label: "Inspection" },
                          { level: 2, label: "Field Work" },
                          { level: 3, label: "Resolved" },
                        ].map((step) => {
                          const isComplete =
                            currentDeptLevel >= step.level && hasDeptClaimed;
                          const isCurrent =
                            currentDeptLevel === step.level && hasDeptClaimed;
                          return (
                            <div
                              key={step.level}
                              className={`flex flex-col items-center text-center p-1.5 rounded-xl border transition-all ${
                                isCurrent
                                  ? "bg-blue-600 text-white border-blue-600 shadow-2xs font-black"
                                  : isComplete
                                  ? "bg-blue-50 text-blue-900 border-blue-200 font-bold"
                                  : "bg-white text-slate-400 border-slate-200 font-medium"
                              }`}
                            >
                              <span className="text-[10px] uppercase tracking-tighter block leading-tight">
                                {step.label}
                              </span>
                              <span className="text-[9px] mt-0.5">
                                {isComplete ? "✓" : `Step ${step.level + 1}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Buttons Row (Twitter/X style) */}
                    <div className="flex items-center justify-between !mt-1.5 pt-0.5 text-slate-500 text-xs">
                      {/* Reply Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onNavigateToPost) onNavigateToPost(report.id);
                        }}
                        className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer group"
                      >
                        <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="font-bold">
                          {report.replies?.length || report.repliesCount || 0}
                        </span>
                      </button>

                      {/* Re-Report / Amplify */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onReReport) onReReport(report.id);
                        }}
                        className={`flex items-center gap-1.5 transition-colors cursor-pointer group ${
                          isReReported
                            ? "text-emerald-600 font-extrabold"
                            : "hover:text-emerald-600"
                        }`}
                      >
                        <Repeat2 className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                        <span className="font-bold">
                          {report.reReportsCount || 0}
                        </span>
                      </button>

                      {/* Like Button with Twitter/YouTube Flying Heart FX */}
                      <AnimatedLikeButton
                        isLiked={Boolean(isLiked)}
                        likesCount={report.likesCount || 0}
                        onLike={() => {
                          if (onLikeReport) onLikeReport(report.id);
                        }}
                        size="md"
                      />

                      {/* Bookmark Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onBookmark) onBookmark(report.id);
                        }}
                        className={`flex items-center gap-1.5 transition-colors cursor-pointer group ${
                          isBookmarked
                            ? "text-blue-600 font-extrabold"
                            : "hover:text-blue-600"
                        }`}
                      >
                        <Bookmark
                          className={`w-4 h-4 group-hover:scale-110 transition-transform ${
                            isBookmarked ? "fill-blue-600 text-blue-600" : ""
                          }`}
                        />
                      </button>

                      {/* Share Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = `${window.location.origin}/post/${report.id}`;
                          navigator.clipboard?.writeText(url);
                          showToast("Post link copied to clipboard!");
                        }}
                        className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer group"
                      >
                        <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </article>
                );
              })}

              {/* Profile Reports Infinite Scroll Sentinel */}
              {effectiveAuthoredReports.length > visibleReportsCount && (
                <div ref={profileReportsSentinelRef} className="h-8 w-full flex items-center justify-center py-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin opacity-40" />
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No reports published by this user yet.
            </div>
          )}
        </div>
      )}

        {/* TAB 2: SERVICES (MIND MAP) */}
        {activeTab === "Services" && (
          <ServicesMindMap
            userProfile={userProfile}
            services={userProfile.services}
          />
        )}

        {/* TAB 3: PERFORMANCE & IMPACT */}
        {activeTab === "Performance" && (
          <div className="p-4 sm:p-5 space-y-4 animate-fadeIn">
            {/* Scorecard Banner */}
            {(() => {
              const hasBreakdown =
                userProfile.systemScoreBreakdown?.criteria &&
                Array.isArray(userProfile.systemScoreBreakdown.criteria) &&
                userProfile.systemScoreBreakdown.criteria.length > 0;
              const displayScore = hasBreakdown && typeof userProfile.systemScore === "number"
                ? userProfile.systemScore
                : 0;

              return (
                <div
                  onClick={() => setEvaluationViewTab("score")}
                  className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl cursor-pointer hover:shadow-lg transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-100">
                      Civic Performance Score
                    </span>
                    <span className="text-2xl font-black">{displayScore}/100</span>
                  </div>
                  <p className="text-xs text-blue-100 font-normal">
                    {hasBreakdown
                      ? "Verified 100-point algorithm and CAG audits loaded from database."
                      : "Awaiting audit log records in database. Click to view 100-point audit framework."}
                  </p>
                </div>
              );
            })()}

            {/* Performance Indicators */}
            {userProfile.systemScoreBreakdown?.criteria &&
            Array.isArray(userProfile.systemScoreBreakdown.criteria) &&
            userProfile.systemScoreBreakdown.criteria.length > 0 ? (
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200/90 space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  Constituency Delivery Matrix (Audit Verified)
                </h4>
                {userProfile.systemScoreBreakdown.criteria.map((crit, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">{crit.label}</span>
                      <span className="font-black text-blue-600">
                        {crit.scoreAwarded} / {crit.weight} pts
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{
                          width: `${Math.min(100, (crit.scoreAwarded / (crit.weight || 1)) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/90 text-center space-y-2">
                <Award className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-black text-slate-800">
                  Audit Records Awaiting Filing
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Official statutory SLA logs, CAG financial audit records, and Hansard floor attendance will be listed here once recorded.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REPLIES */}
        {activeTab === "Replies" && (
          <div className="divide-y divide-slate-100">
            {userReplies.length > 0 ? (
              userReplies.map(({ report, reply }, i) => (
                <div
                  key={reply.id || i}
                  onClick={() => onNavigateToPost && onNavigateToPost(report.id)}
                  className="p-4 hover:bg-slate-50/70 transition-colors cursor-pointer space-y-2.5"
                >
                  {/* Context of which report was replied to */}
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                    <MessageCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Replied to</span>
                    <span className="font-bold text-slate-800">@{report.authorUsername || report.authorName}'s</span>
                    <span>report:</span>
                    <span className="font-semibold text-slate-600 truncate max-w-[200px]">
                      "{report.text}"
                    </span>
                  </div>

                  {/* The reply card */}
                  <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <img
                          src={reply.authorAvatar || userProfile.avatarUrl}
                          alt={reply.authorName}
                          className="w-6 h-6 rounded-full object-cover border border-slate-200"
                        />
                        <span className="font-bold text-slate-900">{reply.authorName}</span>
                        <span className="text-slate-400 font-medium text-[11px]">
                          @{reply.authorUsername}
                        </span>
                      </div>
                      <span className="text-slate-400 text-[11px] font-medium">
                        {formatReportTimestamp(reply.createdAt || reply.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                      {reply.text}
                    </p>

                    {reply.imageUrl && (
                      <div className="rounded-xl overflow-hidden bg-white border border-slate-200 max-h-48 flex items-center justify-center">
                        <img
                          src={reply.imageUrl}
                          alt="Reply attachment"
                          className="w-full h-auto max-h-48 object-contain"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Heart className={`w-3.5 h-3.5 ${reply.likesCount > 0 ? "text-rose-500 fill-rose-500" : "text-slate-400"}`} />
                        <span>{reply.likesCount || 0}</span>
                      </span>
                      <span className="text-blue-600 font-bold hover:underline ml-auto text-[11px]">
                        View Full Thread →
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No replies or comments posted by this user yet.
              </div>
            )}
          </div>
        )}

        {/* TAB 5: REREPORTS */}
        {activeTab === "Rereport" && (
          <div className="divide-y divide-slate-100">
            {userRereports.length > 0 ? (
              userRereports.map((item, idx) => {
                if (item.type === "report") {
                  const report = item.report;
                  return (
                    <div
                      key={`rereport_post_${report.id}_${idx}`}
                      onClick={() => onNavigateToPost && onNavigateToPost(report.id)}
                      className="p-4 hover:bg-slate-50/70 transition-colors cursor-pointer space-y-2"
                    >
                      {/* Re-reported header indicator */}
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-extrabold pb-0.5">
                        <Repeat2 className="w-4 h-4" />
                        <span>You re-reported this post</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {report.category}
                        </span>
                        <span className="text-slate-400 font-medium">{formatReportTimestamp(report.createdAt || report.timestamp)}</span>
                      </div>

                      <ExpandablePostText text={report.text} />

                      {/* Media Section: 4:5 Aspect Ratio */}
                      {(report.imageUrl || (report.images && report.images.length > 0) || report.resolvedImageUrl) && (
                        <MediaBeforeAfterViewer
                          beforeImages={report.images && report.images.length > 0 ? report.images : report.imageUrl ? [report.imageUrl] : []}
                          afterImage={report.resolvedImageUrl}
                          reportId={report.id}
                          isCompact={true}
                        />
                      )}

                      <div className="flex items-center justify-between pt-2 text-xs text-slate-500 font-semibold">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />{" "}
                          {report.likesCount}
                        </span>
                        <span className="flex items-center gap-1 text-emerald-600 font-bold">
                          <Repeat2 className="w-4 h-4 text-emerald-600" /> {report.reReportsCount}
                        </span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <MessageCircle className="w-4 h-4 text-blue-500" />{" "}
                          {report.repliesCount}
                        </span>
                        <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {report.status}
                        </span>
                      </div>
                    </div>
                  );
                }

                // If it's a re-reported reply / comment
                const { report, reply } = item;
                return (
                  <div
                    key={`rereport_reply_${reply.id}_${idx}`}
                    onClick={() => onNavigateToPost && onNavigateToPost(report.id)}
                    className="p-4 hover:bg-slate-50/70 transition-colors cursor-pointer space-y-2.5"
                  >
                    {/* Re-reported reply header indicator */}
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-extrabold pb-0.5">
                      <Repeat2 className="w-4 h-4" />
                      <span>You re-reported a reply in @{report.authorUsername || report.authorName}'s post</span>
                    </div>

                    {/* The re-reported comment card */}
                    <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <img
                            src={reply.authorAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
                            alt={reply.authorName}
                            className="w-6 h-6 rounded-full object-cover border border-slate-200"
                          />
                          <span className="font-bold text-slate-900">{reply.authorName}</span>
                          <span className="text-slate-400 font-medium text-[11px]">
                            @{reply.authorUsername}
                          </span>
                        </div>
                        <span className="text-slate-400 text-[11px] font-medium">
                          {formatReportTimestamp(reply.createdAt || reply.timestamp)}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                        {reply.text}
                      </p>

                      {reply.imageUrl && (
                        <div className="rounded-xl overflow-hidden bg-white border border-slate-200 max-h-48 flex items-center justify-center">
                          <img
                            src={reply.imageUrl}
                            alt="Reply attachment"
                            className="w-full h-auto max-h-48 object-contain"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Heart className={`w-3.5 h-3.5 ${reply.likesCount > 0 ? "text-rose-500 fill-rose-500" : "text-slate-400"}`} />
                          <span>{reply.likesCount || 0}</span>
                        </span>
                        <span className="flex items-center gap-1 text-emerald-600 font-bold">
                          <Repeat2 className="w-3.5 h-3.5" />
                          <span>{reply.reReportsCount || 0}</span>
                        </span>
                        <span className="text-blue-600 font-bold hover:underline ml-auto text-[11px]">
                          View Full Post →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No re-reports shared by this user yet.
              </div>
            )}
          </div>
        )}
        {/* Toast Feedback Notification */}
        {actionToast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-full shadow-xl animate-fadeIn flex items-center gap-2 border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionToast}</span>
          </div>
        )}

        {/* 7. Modern Slide-Up Action Sheet for Report (Pin / Delete / Report Violation Options) */}
        <PostActionSheet
          isOpen={Boolean(selectedReportForActions)}
          onClose={() => setSelectedReportForActions(null)}
          report={selectedReportForActions}
          userProfile={activeUser || userProfile}
          isProfileView={isOwnProfile}
          onDeleteReport={onDeleteReport}
          onTogglePinReport={onTogglePinReport}
          onMuteUser={onMuteUser}
          isAuthorMuted={
            selectedReportForActions
              ? mutedUsers.includes(
                  (selectedReportForActions.authorUsername || selectedReportForActions.authorName || "")
                    .replace(/^@/, "")
                    .toLowerCase()
                    .trim()
                )
              : false
          }
        />

        {/* ========================================================================= */}
        {/* 3-DOTS MODERN ACTION SHEET (BOTTOM SLIDE-UP SHEET)                        */}
        {/* ========================================================================= */}
        {isMenuOpen && (
          <div
            id="profile-action-sheet-backdrop"
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex flex-col justify-end animate-fadeIn"
          >
            <div
              id="profile-action-sheet-content"
              onClick={(e) => e.stopPropagation()}
              className="bg-white border-t border-slate-200 rounded-t-3xl p-5 pb-8 shadow-2xl max-w-lg mx-auto w-full space-y-4 animate-slideUp"
            >
              {/* Drag indicator */}
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto" />

              {/* Profile summary header */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                {userProfile.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={profileFullName}
                    className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-900 font-black text-sm flex items-center justify-center border border-blue-200 shrink-0">
                    DP
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-extrabold text-slate-900 truncate">
                    {profileFullName}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-slate-500 font-medium truncate">
                      @{headerUsername}
                    </p>
                    {userProfile.verified && (
                      <CategoryVerifiedTick category={userProfile.category} size="xs" />
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action List */}
              <div className="space-y-2">
                {/* 1. Copy Profile Link */}
                <button
                  id="action-sheet-copy-link"
                  onClick={() => {
                    handleCopyProfileLink();
                    setTimeout(() => setIsMenuOpen(false), 900);
                  }}
                  className="w-full p-3.5 bg-slate-50 hover:bg-blue-50/80 rounded-2xl flex items-center gap-3.5 transition-all text-left group cursor-pointer border border-slate-200/80 hover:border-blue-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {copyFeedback ? (
                      <Check className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors flex items-center gap-2">
                      <span>{copyFeedback ? "Profile Link Copied!" : "Copy Profile Link"}</span>
                      {copyFeedback && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          Copied
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium truncate">
                      {window.location.origin}/?user={cleanProfileUsername || cleanProfileId}
                    </p>
                  </div>
                </button>

                {/* 2. Claim Official Profile (If eligible system profile) */}
                {isClaimableProfile && (
                  <button
                    id="action-sheet-claim-profile"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setShowClaimModal(true);
                    }}
                    className="w-full p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100/70 hover:to-orange-100/70 rounded-2xl flex items-center gap-3.5 transition-all text-left group cursor-pointer border border-amber-200/80"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                      <Key className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-amber-950">
                          Claim Official Profile
                        </h4>
                        <span className="text-[9px] bg-amber-600 text-white font-black px-1.5 py-0.5 rounded-full uppercase">
                          Official
                        </span>
                      </div>
                      <p className="text-xs text-amber-800/80 font-medium">
                        Are you an authorized representative? Set email & password to manage.
                      </p>
                    </div>
                  </button>
                )}

                {/* 3. 100-Pt Algorithm Breakdown */}
                {isLeadershipOrDept && (
                  <button
                    id="action-sheet-score-breakdown"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setEvaluationViewTab("score");
                    }}
                    className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center gap-3.5 transition-all text-left group cursor-pointer border border-slate-200/80"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-700 transition-colors">
                        100-Pt Algorithm Breakdown
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        View grievance resolution, SLA delivery & transparency metrics
                      </p>
                    </div>
                  </button>
                )}

                {/* 4. Clear Profile Cache */}
                <button
                  id="action-sheet-clear-cache"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleResetCache();
                  }}
                  className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center gap-3.5 transition-all text-left group cursor-pointer border border-slate-200/80"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-extrabold text-slate-900">
                      Refresh & Clear Profile Cache
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Reload latest official data, reviews, and sync records
                    </p>
                  </div>
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-full py-3 text-center text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors cursor-pointer"
              >
                Close Menu
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CLAIM OFFICIAL PROFILE MODAL (OFFICIAL EMAIL & PASSWORD SETUP)            */}
        {/* ========================================================================= */}
        {showClaimModal && (
          <div
            id="claim-profile-modal-backdrop"
            onClick={() => !isClaimSubmitting && setShowClaimModal(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
          >
            <div
              id="claim-profile-modal-content"
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xl max-w-md w-full space-y-4 animate-scaleUp max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      Claim Official Profile
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Official Department: {headerUsername}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !isClaimSubmitting && setShowClaimModal(false)}
                  disabled={isClaimSubmitting}
                  className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Explanatory Banner */}
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-1">
                <p className="font-extrabold flex items-center gap-1.5 text-blue-800">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>State Department Governance Handle</span>
                </p>
                <p className="text-blue-700 leading-relaxed font-normal">
                  This profile was created by the Open Desh governance system. Provide your official email and establish your master login password to claim administrative control.
                </p>
              </div>

              {/* Error Alert */}
              {claimError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800 font-bold animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{claimError}</span>
                </div>
              )}

              {/* Success Notification */}
              {claimSuccess ? (
                <div className="py-6 text-center space-y-2">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-black text-slate-900">
                    Official Profile Claimed!
                  </h4>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto">
                    You have successfully established administrative ownership of {headerUsername}.
                  </p>
                </div>
              ) : (
                /* Claim Form */
                <form onSubmit={handleClaimSubmit} className="space-y-3.5 text-xs">
                  {/* Field 1: Official Department Email */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>Official Email Address *</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. nodal.police@jharkhand.gov.in"
                      value={claimEmail}
                      onChange={(e) => setClaimEmail(e.target.value)}
                      disabled={isClaimSubmitting}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                  </div>

                  {/* Field 2: Password */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Set Account Password (min 6 characters) *</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Enter secure password"
                      value={claimPassword}
                      onChange={(e) => setClaimPassword(e.target.value)}
                      disabled={isClaimSubmitting}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                  </div>

                  {/* Field 3: Authorized Officer / Nodal Person Name */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Authorized Officer / Nodal Person Name *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Er. Rajesh K. Varma / SP Cyber"
                      value={claimOfficerName}
                      onChange={(e) => setClaimOfficerName(e.target.value)}
                      disabled={isClaimSubmitting}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                  </div>

                  {/* Field 4: Official Designation */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Official Designation</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Superintendent of Police / Executive Engineer"
                      value={claimDesignation}
                      onChange={(e) => setClaimDesignation(e.target.value)}
                      disabled={isClaimSubmitting}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                  </div>

                  {/* Field 5: Department Code */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Department Authority Code (Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. JHP-RNC-01"
                      value={claimDeptCode}
                      onChange={(e) => setClaimDeptCode(e.target.value)}
                      disabled={isClaimSubmitting}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowClaimModal(false)}
                      disabled={isClaimSubmitting}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isClaimSubmitting}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isClaimSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Claiming...</span>
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          <span>Claim & Verify</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
