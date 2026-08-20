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

interface ProfileViewProps {
  userProfile: UserProfile;
  activeUser: UserProfile;
  userReports: ReportIssue[];
  isLoggedIn?: boolean;
  onBack?: () => void;
  onNavigateToEditProfile?: () => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  onRateUser?: (rating: number, comment: string) => Promise<void>;
  onReplyToReview?: (reviewId: string, replyText: string) => Promise<void>;
  onToggleFollow?: (targetUserId: string) => Promise<void>;
  onNavigateToPost?: (reportId: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  activeUser,
  userReports,
  isLoggedIn = false,
  onBack,
  onNavigateToEditProfile,
  onUpdateProfile,
  onRateUser,
  onReplyToReview,
  onToggleFollow,
  onNavigateToPost,
}) => {
  const [activeTab, setActiveTab] = useState<
    "Report" | "Services" | "Performance" | "Replies" | "Rereport"
  >("Report");
  const [evaluationViewTab, setEvaluationViewTab] = useState<"score" | "reviews" | "writereview" | null>(null);
  const [isFollowing, setIsFollowing] = useState(userProfile.isFollowing || false);
  const [followersCount, setFollowersCount] = useState(userProfile.followersCount);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const isOwnProfile = Boolean(isLoggedIn && activeUser && userProfile.id === activeUser.id);

  const isLeadershipOrDept =
    userProfile.category === "representative" || userProfile.category === "department";

  const availableTabs = isLeadershipOrDept
    ? ([
        { id: "Report", label: "Reports" },
        { id: "Services", label: "Services (Mind Map)" },
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
    const nextFollowingState = !isFollowing;
    setIsFollowing(nextFollowingState);
    setFollowersCount((prev) => (nextFollowingState ? prev + 1 : Math.max(0, prev - 1)));

    if (onToggleFollow) {
      await onToggleFollow(userProfile.id);
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
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-none">
              {userProfile.fullName}
            </h1>
            <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
              {userProfile.postsCount?.toLocaleString() || userReports.length} posts
            </span>
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
          <div className="relative shrink-0">
            {userProfile.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.fullName}
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-full object-cover border border-slate-200 shadow-xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-blue-100 text-blue-900 font-black text-xl flex items-center justify-center border border-blue-200">
                DP
              </div>
            )}
            {userProfile.verified && (
              <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full border-2 border-white shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          {/* Right Info: Name, Username & Counters */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 truncate flex items-center gap-1.5">
              <span>{userProfile.fullName}</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium block">
              @{userProfile.username}
            </span>

            {/* 3 Stats Counters */}
            <div className="flex items-center gap-4 sm:gap-6 mt-2.5 text-slate-900">
              <div>
                <span className="font-black text-sm sm:text-base block leading-none">
                  {userProfile.postsCount?.toLocaleString() || userReports.length}
                </span>
                <span className="text-xs text-slate-500 font-medium">posts</span>
              </div>
              <div>
                <span className="font-black text-sm sm:text-base block leading-none">
                  {followersCount >= 1000
                    ? `${(followersCount / 1000).toFixed(0)}K`
                    : followersCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">followers</span>
              </div>
              <div>
                <span className="font-black text-sm sm:text-base block leading-none">
                  {userProfile.followingCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">following</span>
              </div>
            </div>
          </div>
        </div>

        {/* Role Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`${badgeInfo.primaryColor} px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide shadow-2xs`}
          >
            {badgeInfo.primary}
          </span>

          {/* Secondary Badge / Rate Action (Hidden from own profile) */}
          {!isOwnProfile && userProfile.category === "representative" ? (
            <button
              onClick={() => setEvaluationViewTab("writereview")}
              className={`${badgeInfo.secondaryColor} px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide shadow-2xs hover:opacity-90 active:scale-95 transition-all flex items-center gap-1 cursor-pointer`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{badgeInfo.secondary}</span>
            </button>
          ) : (
            <span
              className={`${badgeInfo.secondaryColor} px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide shadow-2xs`}
            >
              {badgeInfo.secondary}
            </span>
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

        {/* 3. Performance Scorecard Card (Rendered for Representative & Department only) OR Citizen Civic Summary */}
        {isLeadershipOrDept ? (
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
        ) : (
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 sm:p-4 grid grid-cols-3 divide-x divide-slate-200 shadow-2xs">
            <div className="px-2 text-center py-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
                GRIEVANCES FILED
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 block leading-tight">
                {userReports.length}
              </span>
            </div>

            <div className="px-2 text-center py-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
                RESOLVED CASES
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 block leading-tight">
                {userReports.filter((r) => r.status === "Resolved").length}
              </span>
            </div>

            <div className="px-2 text-center py-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
                CIVIC IMPACT
              </span>
              <span className="text-xl sm:text-2xl font-black text-blue-600 block leading-tight">
                {Math.max(12, (userReports.length * 10) + (userProfile.postsCount || 0))} pts
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
              onClick={() => {
                alert(`Mention @${userProfile.username} has been attached to your next report draft.`);
              }}
              className="py-2.5 px-4 rounded-full border border-slate-300 text-slate-900 text-xs sm:text-sm font-extrabold hover:bg-slate-50 transition-all text-center shadow-2xs cursor-pointer"
            >
              Mention
            </button>
            <button
              onClick={handleToggleFollowAction}
              className={`py-2.5 px-4 rounded-full text-xs sm:text-sm font-extrabold transition-all text-center shadow-xs cursor-pointer ${
                isFollowing
                  ? "bg-slate-100 text-slate-800 border border-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  : "bg-slate-900 text-white hover:bg-black"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          </div>
        )}
      </div>

      {/* 5. Sub-Navigation Tabs */}
      <div className="border-b border-slate-200 bg-white sticky top-[53px] z-20">
        <div className="flex justify-between overflow-x-auto no-scrollbar px-2 sm:px-4">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-2 sm:px-3 text-xs sm:text-sm font-extrabold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                currentActiveTab === tab.id
                  ? "border-blue-600 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-800"
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
            {userReports.length > 0 ? (
              userReports.map((report) => (
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
                    {report.text}
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
          <div className="p-4 space-y-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-900">
                  Official Acknowledgment on Report #REP-001
                </span>
                <span className="text-slate-400 text-[11px]">1 hour ago</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                "Official PWD Team has acknowledged ticket #PWD-JH-9921. Road resurfacing contractor has been summoned on site."
              </p>
              <span className="text-[10px] font-black text-blue-600 uppercase">
                Verified Civic Department Action
              </span>
            </div>
          </div>
        )}

        {/* TAB 5: REREPORTS */}
        {activeTab === "Rereport" && (
          <div className="p-4 space-y-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                <Repeat2 className="w-4 h-4" /> Re-reported into Jharkhand Constituency Feed
              </div>
              <p className="text-xs text-slate-800">
                "Deep 3-foot asphalt crater on Main Road near Kanke Chowk. @PWD urgent repair required!"
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
