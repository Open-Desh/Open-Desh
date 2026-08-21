import React, { useState } from "react";
import {
  ArrowLeft,
  MoreVertical,
  MapPin,
  Link as LinkIcon,
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
} from "lucide-react";
import { UserProfile, ReportIssue } from "../types.ts";
import { ServicesMindMap } from "./ServicesMindMap.tsx";
import { EvaluationDetailView } from "./EvaluationDetailView.tsx";
import { cleanReportText } from "../utils/reportUtils.ts";
import {
  CategoryBadge,
  CategoryVerifiedTick,
  CategoryGetVerifiedButton,
} from "./CategoryBadge.tsx";

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
}) => {
  const [activeTab, setActiveTab] = useState<
    "Report" | "Services" | "Performance" | "Replies" | "Rereport"
  >("Report");
  const [evaluationViewTab, setEvaluationViewTab] = useState<"score" | "reviews" | "writereview" | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isFollowSubmitting, setIsFollowSubmitting] = useState(false);

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
    if (localFollowing && !isActivelyFollowing) {
      count += 1;
    } else if (!localFollowing && isActivelyFollowing) {
      count = Math.max(0, count - 1);
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

    if (filtered.length > 0) return filtered;
    return userReports || [];
  }, [allReports, userReports, cleanProfileId, cleanProfileUsername, userProfile.category]);

  const effectivePostsCount = Math.max(
    effectiveAuthoredReports.length,
    typeof userProfile.postsCount === "number" ? userProfile.postsCount : 0
  );

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

  const isOwnProfile = Boolean(isLoggedIn && activeUser && userProfile.id === activeUser.id);

  const isLeadershipOrDept =
    userProfile.category === "representative" ||
    userProfile.category === "department" ||
    userProfile.category === "business";

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

  // 1. Top Bar: Clean username ONLY without '@' and WITHOUT verified tick (Instagram layout)
  const headerUsername = userProfile.username
    ? userProfile.username.replace(/^@+/, "")
    : (userProfile.fullName ? userProfile.fullName.toLowerCase().replace(/\s+/g, "_") : "citizen");

  // 2. Profile Card: Real Full Name WITH verified tick
  const profileFullName = userProfile.fullName && userProfile.fullName.trim() !== ""
    ? userProfile.fullName
    : headerUsername;

  const handleCopyProfileLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const handleResetCache = () => {
    localStorage.removeItem("open_nation_profile_cache");
    alert("Profile local state cache cleared successfully.");
    setIsMenuOpen(false);
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
    <div className="max-w-xl mx-auto pb-24 md:pb-12 animate-fadeIn bg-white border-x border-slate-200 min-h-screen">
      {/* 1. X/Twitter-Style Fixed Top Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between">
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
            {/* Top Bar: Clean Username Only (NO verified tick here) */}
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-none truncate">
              {headerUsername}
            </h1>
          </div>
        </div>

        {/* 3-Dots Action Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Profile Options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-11 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-fadeIn text-xs text-slate-800">
              <button
                onClick={handleCopyProfileLink}
                className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2 font-semibold"
              >
                {copyFeedback ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-500" />
                )}
                <span>{copyFeedback ? "Copied Link!" : "Copy Profile Link"}</span>
              </button>

              <button
                onClick={() => setEvaluationViewTab("score")}
                className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2 font-semibold"
              >
                <Scale className="w-4 h-4 text-blue-600" />
                <span>100-Pt Algorithm Breakdown</span>
              </button>

              <button
                onClick={handleResetCache}
                className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2 font-semibold"
              >
                <RefreshCw className="w-4 h-4 text-slate-500" />
                <span>Clear Profile Cache</span>
              </button>

              <div className="border-t border-slate-100 my-1"></div>

              <div className="px-4 py-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Open Nation Governance v3</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Profile Card */}
      <div className="p-4 sm:p-5 space-y-4">
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

          {/* Right Info: Real Full Name & Counters */}
          <div className="flex-1 min-w-0">
            {/* Full Name with Verified Tick - Sized for mobile and multi-word names so it fits cleanly */}
            <h2 className="text-sm sm:text-base md:text-lg font-extrabold text-slate-900 flex items-start gap-1.5 leading-snug line-clamp-2 break-words">
              <span>{profileFullName}</span>
              {userProfile.verified && (
                <span className="shrink-0 mt-0.5">
                  <CategoryVerifiedTick
                    category={userProfile.category}
                    size="xs"
                  />
                </span>
              )}
            </h2>

            {/* 3 Stats Counters */}
            <div className="flex items-center gap-4 sm:gap-6 mt-2 text-slate-900">
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
          {/* 1. Selected Category Badge (Always visible for all profiles) */}
          <CategoryBadge
            category={userProfile.category}
            verified={userProfile.verified}
            size="sm"
          />

          {/* 2. "Get verified" / "Under Review" Button (ONLY visible to user themselves when unverified) */}
          {!userProfile.verified && isOwnProfile && (
            <CategoryGetVerifiedButton
              category={userProfile.category}
              status={userProfile.verificationStatus}
              onClick={() => {
                if (onNavigateToVerification) {
                  onNavigateToVerification();
                } else if (onNavigateToEditProfile) {
                  onNavigateToEditProfile();
                }
              }}
            />
          )}

          {/* Secondary Rate Action (Representative, Department or Business) */}
          {!isOwnProfile &&
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
        </div>

        {/* Bio & Details Section */}
        <div className="space-y-1.5">
          <p className="text-xs sm:text-sm text-slate-800 font-normal leading-relaxed">
            {userProfile.bio ||
              "Public Representative & Civic Tech Advocate working for urban transparency and infrastructural acceleration in Jharkhand."}
          </p>

          {/* Location & External Link */}
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
          </div>
        </div>

        {/* 3. Performance Scorecard Card (Rendered for Representative & Department only) */}
        {isLeadershipOrDept && (
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 sm:p-4 grid grid-cols-3 divide-x divide-slate-200 shadow-2xs">
            {/* System Score */}
            <div
              onClick={() => setEvaluationViewTab("score")}
              className="px-2 text-center cursor-pointer hover:bg-slate-100/70 rounded-xl transition-colors py-1 group"
              title="View 100-Pt Algorithm Breakdown"
            >
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5 group-hover:text-blue-600 transition-colors">
                SYSTEM SCORE
              </span>
              <span className="text-xl sm:text-2xl font-black text-blue-600 block leading-tight">
                {userProfile.systemScore || 84}
              </span>
            </div>

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
                {userProfile.publicRating || 4.4}
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
                  ? `${(userProfile.reviewsCount / 1000).toFixed(1)}K`
                  : "142.8K"}
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
        {/* TAB 1: REPORTS */}
        {activeTab === "Report" && (
          <div className="divide-y divide-slate-100">
            {effectiveAuthoredReports.length > 0 ? (
              effectiveAuthoredReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => onNavigateToPost && onNavigateToPost(report.id)}
                  className="p-4 hover:bg-slate-50/70 transition-colors cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {report.category}
                    </span>
                    <span className="text-slate-400 font-medium">{report.timestamp}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-900 leading-relaxed font-normal">
                    {cleanReportText(report.text)}
                  </p>

                  {report.imageUrl && (
                    <div className="rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center">
                      <img
                        src={report.imageUrl}
                        alt="Evidence"
                        className="w-full h-auto object-contain rounded-2xl"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 text-xs text-slate-500 font-semibold">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />{" "}
                      {report.likesCount}
                    </span>
                    <span className="flex items-center gap-1 text-slate-600">
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
              ))
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
            <div
              onClick={() => setEvaluationViewTab("score")}
              className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl cursor-pointer hover:shadow-lg transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-blue-100">
                  Civic Performance Score
                </span>
                <span className="text-2xl font-black">{userProfile.systemScore || 84}/100</span>
              </div>
              <p className="text-xs text-blue-100 font-normal">
                Click here to view transparent 100-point algorithm, CAG audits, and legislative floor attendance.
              </p>
            </div>

            {/* Performance Indicators */}
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200/90 space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                Constituency Delivery Matrix (FY 2025-2026)
              </h4>

              {/* Metric 1 */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">
                    Legislative Attendance (Vidhan Sabha Hansard)
                  </span>
                  <span className="font-black text-blue-600">92%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: "92%" }}
                  ></div>
                </div>
              </div>

              {/* Metric 2 */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">
                    Grievance SLA Compliance (24-hr Turnaround)
                  </span>
                  <span className="font-black text-emerald-600">89.4%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: "89.4%" }}
                  ></div>
                </div>
              </div>

              {/* Metric 3 */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">
                    Constituency Fund (MLALAD) Allocation Utilized
                  </span>
                  <span className="font-black text-indigo-600">₹4.2 Cr / ₹5.0 Cr (84%)</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: "84%" }}
                  ></div>
                </div>
              </div>
            </div>
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
                        {reply.timestamp}
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
                        <span className="text-slate-400 font-medium">{report.timestamp}</span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-900 leading-relaxed font-normal">
                        {cleanReportText(report.text)}
                      </p>

                      {report.imageUrl && (
                        <div className="rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center">
                          <img
                            src={report.imageUrl}
                            alt="Evidence"
                            className="w-full h-auto object-contain rounded-2xl"
                          />
                        </div>
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
                          {reply.timestamp}
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
      </div>
    </div>
  );
};
