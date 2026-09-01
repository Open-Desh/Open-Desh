import React, { useState } from "react";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Share2,
  MapPin,
  ShieldCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
  Flame,
  AtSign,
  Share,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Plus,
  MoreVertical,
} from "lucide-react";
import { ReportIssue, UserProfile, IssueCategory } from "../types.ts";
import { CategoryVerifiedTick } from "./CategoryBadge.tsx";
import { MediaBeforeAfterViewer } from "./MediaBeforeAfterViewer.tsx";
import { PostActionSheet } from "./PostActionSheet.tsx";
import { AnimatedLikeButton } from "./AnimatedLikeButton.tsx";
import { ExpandablePostText } from "./ExpandablePostText.tsx";
import {
  getCleanAuthorUsername,
  isReportAuthorVerified,
  getReportAuthorVerifiedCategory,
  getReportAuthorAvatar,
  cleanReportText,
  formatReportTimestamp,
} from "../utils/reportUtils.ts";

interface FeedViewProps {
  reports: ReportIssue[];
  userProfile: UserProfile;
  onLike: (id: string) => Promise<void>;
  onReReport: (id: string) => Promise<void>;
  onBookmark: (id: string) => Promise<void>;
  onReply?: (id: string, text: string, parentReplyId?: string) => Promise<void>;
  onUpdateStatus: (id: string, level: number, notes?: string) => Promise<void>;
  onOpenCreateModal: () => void;
  onSelectUser?: (userId: string) => void;
  onSelectPost: (reportId: string) => void;
  onDeleteReport?: (reportId: string) => Promise<void>;
  onTogglePinReport?: (reportId: string, isCurrentlyPinned?: boolean) => Promise<void>;
  onMuteUser?: (authorUsername: string, authorId?: string) => void;
  mutedUsers?: string[];
  loading?: boolean;
  isNavVisible?: boolean;
  selectedCategory?: string;
  onOpenInstallModal?: () => void;
}

export const FeedSkeletonList: React.FC = () => (
  <div className="divide-y divide-slate-100 animate-pulse">
    {[1, 2, 3, 4].map((item) => (
      <div key={item} className="p-4 sm:p-5 space-y-3">
        {/* Header simulation */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-24 h-3.5 bg-slate-200 rounded" />
                <div className="w-16 h-3 bg-slate-100 rounded" />
              </div>
              <div className="w-28 h-2.5 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="w-14 h-5 bg-slate-100 rounded-full shrink-0" />
        </div>

        {/* Post Text simulation lines */}
        <div className="space-y-2 pt-1">
          <div className="w-full h-3.5 bg-slate-200 rounded" />
          <div className="w-[85%] h-3.5 bg-slate-200 rounded" />
          <div className="w-[60%] h-3.5 bg-slate-100 rounded" />
        </div>

        {/* Media box simulation */}
        {item % 2 !== 0 && (
          <div className="w-full h-48 sm:h-56 bg-slate-200 rounded-xl" />
        )}

        {/* Department SLA tracker simulation */}
        <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-32 h-3 bg-slate-200 rounded" />
            <div className="w-16 h-3 bg-slate-200 rounded" />
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <div className="h-6 bg-slate-200/80 rounded" />
            <div className="h-6 bg-slate-100 rounded" />
            <div className="h-6 bg-slate-100 rounded" />
            <div className="h-6 bg-slate-100 rounded" />
          </div>
        </div>

        {/* Interaction Toolbar simulation */}
        <div className="flex items-center justify-between pt-1 text-slate-200 px-1">
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-slate-100" />
            <div className="w-6 h-2.5 bg-slate-100 rounded" />
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-slate-100" />
            <div className="w-6 h-2.5 bg-slate-100 rounded" />
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-slate-100" />
            <div className="w-6 h-2.5 bg-slate-100 rounded" />
          </div>
          <div className="w-5 h-5 rounded-full bg-slate-100" />
          <div className="w-5 h-5 rounded-full bg-slate-100" />
        </div>
      </div>
    ))}
  </div>
);

export const FeedView: React.FC<FeedViewProps> = ({
  reports,
  userProfile,
  onLike,
  onReReport,
  onBookmark,
  onReply,
  onUpdateStatus,
  onOpenCreateModal,
  onSelectUser,
  onSelectPost,
  onDeleteReport,
  onTogglePinReport,
  onMuteUser,
  mutedUsers = [],
  loading = false,
  isNavVisible = true,
  selectedCategory = "All",
  onOpenInstallModal,
}) => {
  const [activeImageSlideIndex, setActiveImageSlideIndex] = useState<Record<string, number>>({});
  const [statusUpdateNotes, setStatusUpdateNotes] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeActionReport, setActiveActionReport] = useState<ReportIssue | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(15);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const loadMoreSentinelRef = React.useRef<HTMLDivElement | null>(null);

  // Reset pagination when category changes
  React.useEffect(() => {
    setVisibleCount(15);
  }, [selectedCategory]);

  const filteredReports = reports.filter((r) => {
    const isCategoryMatch = selectedCategory === "All" || r.category === selectedCategory;
    const authorUname = (r.authorUsername || r.authorName || "").replace(/^@/, "").toLowerCase().trim();
    const isMuted = mutedUsers.includes(authorUname);
    return isCategoryMatch && !isMuted;
  });

  const displayedReports = filteredReports.slice(0, visibleCount);

  // Smooth background infinite scroll
  React.useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && visibleCount < filteredReports.length) {
          setVisibleCount((prev) => Math.min(prev + 15, filteredReports.length));
        }
      },
      { rootMargin: "400px 0px" }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [visibleCount, filteredReports.length]);

  const getStatusPill = (status: ReportIssue["status"]) => {
    switch (status) {
      case "Resolved":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "In Progress":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "Under Dept Review":
        return "bg-amber-50 text-amber-800 border border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  const handleShare = (e: React.MouseEvent, report: ReportIssue) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/post/${report.id}`;
    if (navigator.share) {
      navigator.share({
        title: `Open Desh - Grievance #${report.id}`,
        text: report.text,
        url: shareUrl,
      }).catch(() => {});
      return;
    }
    navigator.clipboard?.writeText(shareUrl);
    setCopiedId(report.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-xl mx-auto pb-24 md:pb-12 animate-fadeIn bg-white border-x border-slate-200 min-h-screen">
      {/* Reports Feed Container */}
      <div className="divide-y divide-slate-100">
        {loading ? (
          <FeedSkeletonList />
        ) : filteredReports.length === 0 ? (
          <div className="py-24 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">
              {selectedCategory === "All" ? "No Civic Grievances Yet" : `No Reports in ${selectedCategory}`}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mb-5 leading-relaxed font-medium">
              Database is clean. Tap the + button to post the first real citizen grievance report.
            </p>
            <button
              onClick={onOpenCreateModal}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Report an Issue
            </button>
          </div>
        ) : (
          displayedReports.map((report) => {
          const isLiked = report.likedBy?.includes(userProfile.id);
          const isReReported = report.reReportedBy?.includes(userProfile.id);
          const isSaved = userProfile.savedReports?.includes(report.id);
          const isDeptUser = userProfile.category === "department";
          const hasDeptClaimed = Boolean(
            report.claimedByDept ||
            report.claimedByOfficer ||
            (typeof report.departmentStatusLevel === "number" && report.departmentStatusLevel > 0)
          );

          // Multi-image list
          const imageList =
            report.images && report.images.length > 0
              ? report.images
              : report.imageUrl
              ? [report.imageUrl]
              : [];
          const currentSlide = activeImageSlideIndex[report.id] || 0;

          // Tagged departments list
          const primaryDeptTag =
            report.taggedOfficers?.[0] || report.aiTriage?.departmentTag || "@MunicipalCorp";
          const currentDeptLevel = report.departmentStatusLevel ?? (hasDeptClaimed ? 1 : 0);

          return (
            <article
              key={report.id}
              id={`report-card-${report.id}`}
              onClick={() => onSelectPost(report.id)}
              className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors space-y-3 cursor-pointer select-none group/card"
            >
              {/* Header: Author + GPS + Status Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={getReportAuthorAvatar(report, userProfile)}
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
                                if (onSelectUser) onSelectUser(report.authorId);
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
                        !["verified citizen", "citizen", "verified resident"].includes(
                          report.authorBadge.toLowerCase()
                        ) &&
                        isReportAuthorVerified(report, userProfile) && (
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
                      <span className="truncate max-w-[150px] sm:max-w-[220px]">{report.location.city}</span>
                      <span>•</span>
                      <span className="shrink-0">{formatReportTimestamp(report.createdAt || report.timestamp)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 ${getStatusPill(
                      report.status
                    )}`}
                  >
                    {report.status}
                  </span>

                  {/* 3-Dot Options Action Button */}
                  <button
                    id={`report-options-btn-${report.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveActionReport(report);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200/70 rounded-full transition-colors cursor-pointer"
                    title="More Options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Text Description with 3-line Clamp & Read More */}
              <ExpandablePostText text={report.text} />

              {/* Structured Parameters Quick Badge Bar */}
              {report.structuredDetails && Object.keys(report.structuredDetails).length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {Object.entries(report.structuredDetails).map(([key, val]) => {
                    if (!val) return null;
                    const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
                    return (
                      <span
                        key={key}
                        className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200/80 px-2 py-0.5 rounded-md font-semibold"
                      >
                        <strong className="text-slate-900">{label}:</strong> {val}
                      </span>
                    );
                  })}
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
                          onSelectPost(report.id);
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
                          onReReport(report.id);
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
                          onLike(report.id);
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
                          onBookmark(report.id);
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
                        {copiedId === report.id ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  }
                />
              )}

              {/* Tagged Authorities Routing Chips */}
              {(() => {
                const officers = (report.taggedOfficers || []).map((t) => t.replace(/^@+/, ""));
                const leaders = (report.taggedLeaders || []).map((t) => t.replace(/^@+/, ""));
                const uniqueOfficers = Array.from(new Set(officers)).filter(Boolean);
                const uniqueLeaders = Array.from(new Set(leaders)).filter(Boolean);

                if (uniqueOfficers.length === 0 && uniqueLeaders.length === 0) return null;

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
                      <ShieldCheck className="w-3 h-3 text-blue-600" /> Statutory Triage: {report.aiTriage.departmentTag}
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
                      <span>Official Action{hasDeptClaimed && (report.claimedByOfficer || report.claimedByDept) ? ":" : ""}</span>
                      {hasDeptClaimed && (report.claimedByOfficer || report.claimedByDept) ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const target = report.claimedByOfficer || report.claimedByDept || "";
                            const clean = getCleanAuthorUsername(target);
                            if (onSelectUser && clean) onSelectUser(clean);
                          }}
                          className="text-blue-600 hover:underline inline-flex items-center gap-0.5 font-extrabold cursor-pointer normal-case"
                        >
                          <span>
                            @{getCleanAuthorUsername(report.claimedByOfficer || report.claimedByDept || "")}
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
                    const isComplete = currentDeptLevel >= step.level && hasDeptClaimed;
                    const isCurrent = currentDeptLevel === step.level && hasDeptClaimed;
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
                {/* Reply Button (Opens dedicated post view) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPost(report.id);
                  }}
                  className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer group"
                >
                  <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="font-bold">{report.replies?.length || report.repliesCount || 0}</span>
                </button>

                {/* Re-Report / Amplify */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReReport(report.id);
                  }}
                  className={`flex items-center gap-1.5 transition-colors cursor-pointer group ${
                    isReReported ? "text-emerald-600 font-extrabold" : "hover:text-emerald-600"
                  }`}
                >
                  <Repeat2 className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                  <span className="font-bold">{report.reReportsCount || 0}</span>
                </button>

                {/* Like / Endorse with Floating Hearts & Pop Animation */}
                <AnimatedLikeButton
                  isLiked={Boolean(isLiked)}
                  likesCount={report.likesCount || 0}
                  onLike={() => onLike(report.id)}
                  size="md"
                />

                {/* Bookmark */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookmark(report.id);
                  }}
                  className={`flex items-center gap-1.5 transition-colors cursor-pointer hover:text-blue-600 ${
                    isSaved ? "text-blue-600 font-extrabold" : ""
                  }`}
                >
                  <Bookmark
                    className={`w-4 h-4 ${isSaved ? "fill-blue-600 text-blue-600" : ""}`}
                  />
                </button>

                {/* Share */}
                <button
                  onClick={(e) => handleShare(e, report)}
                  className="flex items-center gap-1.5 transition-colors cursor-pointer hover:text-blue-600"
                  title="Share"
                >
                  {copiedId === report.id ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </article>
          );
        }))}
      </div>

      {/* Invisible Infinite Scroll Sentinel & Subtle Bottom Status */}
      {!loading && filteredReports.length > 0 && (
        <div className="py-4 px-4 text-center">
          {filteredReports.length > visibleCount ? (
            <div ref={loadMoreSentinelRef} className="h-10 w-full flex items-center justify-center py-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin opacity-50" />
            </div>
          ) : (
            <div className="py-4 flex flex-col items-center justify-center gap-1 text-slate-400 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>You're all caught up!</span>
              </div>
              <p className="text-[11px] text-slate-400">
                All {filteredReports.length} civic grievances in this category are displayed.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Post Action Sheet (3-dot menu & Violation Reporting) */}
      <PostActionSheet
        isOpen={Boolean(activeActionReport)}
        onClose={() => setActiveActionReport(null)}
        report={activeActionReport}
        userProfile={userProfile}
        isProfileView={false}
        onDeleteReport={onDeleteReport}
        onTogglePinReport={onTogglePinReport}
        onMuteUser={onMuteUser}
        isAuthorMuted={
          activeActionReport
            ? mutedUsers.includes(
                (activeActionReport.authorUsername || activeActionReport.authorName || "")
                  .replace(/^@/, "")
                  .toLowerCase()
                  .trim()
              )
            : false
        }
      />
    </div>
  );
};
