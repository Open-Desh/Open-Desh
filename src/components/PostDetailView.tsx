import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Share2,
  MapPin,
  ShieldCheck,
  Building2,
  AtSign,
  Flame,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  X,
  Send,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  UploadCloud,
  Columns,
  Eye,
} from "lucide-react";
import { ReportIssue, UserProfile, ThreadedReply } from "../types.ts";
import { CategoryVerifiedTick } from "./CategoryBadge.tsx";
import {
  getCleanAuthorUsername,
  isReportAuthorVerified,
  cleanReportText,
  formatReportTimestamp,
} from "../utils/reportUtils.ts";

interface PostDetailViewProps {
  report: ReportIssue;
  userProfile: UserProfile;
  onBack: () => void;
  onLike: (id: string) => Promise<void>;
  onReReport: (id: string) => Promise<void>;
  onBookmark: (id: string) => Promise<void>;
  onReply: (
    id: string,
    text: string,
    parentReplyId?: string,
    replyImage?: string
  ) => Promise<void>;
  onLikeReply?: (reportId: string, replyId: string) => Promise<void>;
  onReReportReply?: (reportId: string, replyId: string) => Promise<void>;
  onUpdateStatus: (
    id: string,
    level: number,
    notes?: string,
    resolvedImageUrl?: string
  ) => Promise<void>;
  onSelectUser?: (userId: string) => void;
  onToggleFollow?: (userId: string) => void;
}

export const PostDetailView: React.FC<PostDetailViewProps> = ({
  report,
  userProfile,
  onBack,
  onLike,
  onReReport,
  onBookmark,
  onReply,
  onLikeReply,
  onReReportReply,
  onUpdateStatus,
  onSelectUser,
  onToggleFollow,
}) => {
  const [replyText, setReplyText] = useState("");
  const [replyImage, setReplyImage] = useState<string | null>(null);
  const [focusedReplyIdStack, setFocusedReplyIdStack] = useState<string[]>([]);
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [statusUpdateNotes, setStatusUpdateNotes] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonSliderPos, setComparisonSliderPos] = useState(50);
  const [mediaTab, setMediaTab] = useState<"before" | "after" | "compare">("before");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const proofFileInputRef = useRef<HTMLInputElement>(null);
  const repliesBottomRef = useRef<HTMLDivElement>(null);
  const replyCapsuleRef = useRef<HTMLDivElement>(null);

  const isLiked = report.likedBy?.includes(userProfile.id);
  const isReReported = report.reReportedBy?.includes(userProfile.id);
  const isSaved = userProfile.savedReports?.includes(report.id);
  const isDeptUser = userProfile.category === "department";
  const hasDeptClaimed = Boolean(
    report.claimedByDept ||
    report.claimedByOfficer ||
    (typeof report.departmentStatusLevel === "number" && report.departmentStatusLevel > 0)
  );
  const hasTaggedDept = Boolean(report.taggedOfficers && report.taggedOfficers.length > 0);

  // Check if current user is tagged in the report's taggedOfficers or is the claiming authority
  const isTaggedDepartmentOfficer = (() => {
    if (!isDeptUser) return false;
    const userHandle = userProfile.username?.toLowerCase();
    const userFullName = userProfile.fullName?.toLowerCase();
    const userDeptName = userProfile.departmentDetails?.name?.toLowerCase();

    // Check if user is already the claimed authority
    if (report.claimedByDept && (
      report.claimedByDept.toLowerCase().includes(userHandle || "") ||
      report.claimedByDept.toLowerCase().includes(userFullName || "") ||
      (userDeptName && report.claimedByDept.toLowerCase().includes(userDeptName))
    )) {
      return true;
    }

    // Check if user's @handle or name is in taggedOfficers
    if (report.taggedOfficers && report.taggedOfficers.length > 0) {
      return report.taggedOfficers.some((tag) => {
        const cleanTag = tag.replace(/^@/, "").toLowerCase();
        return (
          cleanTag === userHandle ||
          (userFullName && cleanTag.includes(userFullName)) ||
          (userDeptName && cleanTag.includes(userDeptName)) ||
          (userHandle && userHandle.includes(cleanTag))
        );
      });
    }

    return false;
  })();

  const primaryDeptTag =
    report.taggedOfficers?.[0] || report.claimedByDept || "";
  const currentDeptLevel = report.departmentStatusLevel ?? (hasDeptClaimed ? 1 : 0);

  const imageList =
    report.images && report.images.length > 0
      ? report.images
      : report.imageUrl
      ? [report.imageUrl]
      : [];

  const originalBeforeImage = imageList[0] || "";
  const resolvedAfterImage = report.resolvedImageUrl || "";
  const canCompare = Boolean(originalBeforeImage && resolvedAfterImage);

  // Helper to recursively find a reply in the thread
  const findReplyById = (
    replies: ThreadedReply[] | undefined,
    id: string
  ): ThreadedReply | null => {
    if (!replies) return null;
    for (const r of replies) {
      if (r.id === id) return r;
      if (r.replies && r.replies.length > 0) {
        const found = findReplyById(r.replies, id);
        if (found) return found;
      }
    }
    return null;
  };

  const currentFocusedReplyId =
    focusedReplyIdStack.length > 0
      ? focusedReplyIdStack[focusedReplyIdStack.length - 1]
      : null;

  const currentFocusedReply = currentFocusedReplyId
    ? findReplyById(report.replies, currentFocusedReplyId)
    : null;

  // Get parent chain for the focused reply
  const getParentChain = (replyId: string): ThreadedReply[] => {
    const chain: ThreadedReply[] = [];
    let curId: string | null = replyId;
    while (curId) {
      const cur = findReplyById(report.replies, curId);
      if (cur && cur.parentReplyId) {
        const parent = findReplyById(report.replies, cur.parentReplyId);
        if (parent) {
          chain.unshift(parent);
          curId = parent.parentReplyId || null;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    return chain;
  };

  // Sub-replies for a target reply
  const getSubReplies = (targetReplyId: string): ThreadedReply[] => {
    const target = findReplyById(report.replies, targetReplyId);
    const fromTree = target?.replies || [];
    const fromFlat = (report.replies || []).filter(
      (r) => r.parentReplyId === targetReplyId
    );

    const map = new Map<string, ThreadedReply>();
    fromTree.forEach((r) => map.set(r.id, r));
    fromFlat.forEach((r) => map.set(r.id, r));
    return Array.from(map.values());
  };

  // Top level comments (replies directly to root post)
  const topLevelReplies = (report.replies || []).filter((r) => !r.parentReplyId);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [report.id, currentFocusedReplyId]);

  // Click outside to collapse if empty
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        replyCapsuleRef.current &&
        !replyCapsuleRef.current.contains(e.target as Node)
      ) {
        if (!replyText.trim() && !replyImage) {
          setIsInputExpanded(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [replyText, replyImage]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReplyImage(reader.result as string);
        setIsInputExpanded(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendReply = async () => {
    if ((!replyText || !replyText.trim()) && !replyImage) return;

    try {
      setIsSubmitting(true);
      const targetParentId = currentFocusedReply?.id;
      await onReply(
        report.id,
        replyText.trim(),
        targetParentId,
        replyImage || undefined
      );
      setReplyText("");
      setReplyImage(null);
      setIsInputExpanded(false);

      setTimeout(() => {
        repliesBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } catch (err) {
      console.error("Failed to post reply:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Open Desh - Grievance #${report.id}`,
          text: report.text,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    navigator.clipboard?.writeText(shareUrl);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const handleHeaderBack = () => {
    if (focusedReplyIdStack.length > 0) {
      setFocusedReplyIdStack((prev) => prev.slice(0, -1));
    } else {
      onBack();
    }
  };

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

  // Render a list of comment cards (clicking card or reply button navigates deeper into thread)
  const renderCommentCards = (
    repliesList: ThreadedReply[],
    parentUsername?: string
  ) => {
    if (!repliesList || repliesList.length === 0) return null;

    return (
      <div className="space-y-0 divide-y divide-slate-100">
        {repliesList.map((reply) => {
          const isReplyLiked = reply.likedBy?.includes(userProfile.id) || false;
          const isReplyReReported =
            reply.reReportedBy?.includes(userProfile.id) || false;
          const childCount = getSubReplies(reply.id).length;
          const targetUsername = reply.replyToUsername || parentUsername;

          return (
            <div
              key={reply.id}
              onClick={() => {
                setFocusedReplyIdStack((prev) => [...prev, reply.id]);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="relative group/reply py-4 hover:bg-slate-50/70 transition-colors cursor-pointer -mx-4 sm:-mx-5 px-4 sm:px-5"
            >
              <div className="flex items-start gap-3">
                <img
                  src={reply.authorAvatar}
                  alt={reply.authorName}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectUser && onSelectUser(reply.authorId);
                  }}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 cursor-pointer hover:opacity-90 shadow-2xs shrink-0 z-10 bg-white"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectUser && onSelectUser(reply.authorId);
                        }}
                        className="font-extrabold text-sm text-slate-900 cursor-pointer hover:underline truncate flex items-center gap-1"
                      >
                        <span>{getCleanAuthorUsername(reply.authorUsername, reply.authorName)}</span>
                        {isReportAuthorVerified(reply) && (
                          <CategoryVerifiedTick
                            category={reply.authorCategory}
                            size="xs"
                          />
                        )}
                      </span>
                      {reply.authorBadge && isReportAuthorVerified(reply) && (
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${
                            reply.isOfficialIntervention
                              ? "bg-amber-100 text-amber-900 border border-amber-200"
                              : "bg-blue-50 text-blue-700 border border-blue-100"
                          }`}
                        >
                          {reply.authorBadge}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 truncate">
                        @{reply.authorUsername || "citizen"}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-400 shrink-0">
                        {formatReportTimestamp(reply.createdAt || reply.timestamp)}
                      </span>
                    </div>
                  </div>

                  {targetUsername && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      Replying to{" "}
                      <span className="text-blue-600 font-bold hover:underline">
                        @{targetUsername}
                      </span>
                    </div>
                  )}

                  {/* Reply text */}
                  <p className="text-sm text-slate-900 mt-1.5 leading-relaxed whitespace-pre-line font-normal">
                    {reply.text}
                  </p>

                  {/* Reply attached image (if any) */}
                  {reply.imageUrl && (
                    <div className="mt-2.5 rounded-2xl overflow-hidden border border-slate-200 max-w-sm">
                      <img
                        src={reply.imageUrl}
                        alt="Reply evidence"
                        className="max-h-64 w-full object-cover rounded-2xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Reply Action Icons Bar */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-between mt-3 pt-1 text-slate-400 text-xs font-semibold max-w-sm"
                  >
                    {/* Reply button (Opens thread view for this comment) */}
                    <button
                      onClick={() => {
                        setFocusedReplyIdStack((prev) => [...prev, reply.id]);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer group py-1"
                      title="Reply"
                    >
                      <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>{childCount > 0 ? childCount : "Reply"}</span>
                    </button>

                    {/* Re-Report / Repost comment */}
                    <button
                      onClick={() =>
                        onReReportReply && onReReportReply(report.id, reply.id)
                      }
                      className={`flex items-center gap-1.5 transition-colors cursor-pointer group py-1 ${
                        isReplyReReported
                          ? "text-emerald-600 font-bold"
                          : "hover:text-emerald-600"
                      }`}
                      title="Re-report"
                    >
                      <Repeat2 className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                      <span>{reply.reReportsCount || 0}</span>
                    </button>

                    {/* Like comment */}
                    <button
                      onClick={() =>
                        onLikeReply && onLikeReply(report.id, reply.id)
                      }
                      className={`flex items-center gap-1.5 transition-colors cursor-pointer group py-1 ${
                        isReplyLiked
                          ? "text-rose-600 font-bold"
                          : "hover:text-rose-600"
                      }`}
                      title="Like"
                    >
                      <Heart
                        className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                          isReplyLiked ? "fill-rose-600 text-rose-600" : ""
                        }`}
                      />
                      <span>{reply.likesCount || 0}</span>
                    </button>

                    {/* Share comment */}
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer py-1"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-xl mx-auto pb-36 animate-fadeIn bg-white border-x border-slate-200 min-h-screen relative shadow-2xs">
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleHeaderBack}
            className="p-1.5 -ml-1 text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title={focusedReplyIdStack.length > 0 ? "Back to previous post" : "Back to Feed"}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Report</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Top Comparison Button (Displayed if resolved image exists) */}
          {canCompare && (
            <button
              onClick={() => setShowComparisonModal(true)}
              className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
              title="Compare Before & After resolution"
            >
              <Columns className="w-3.5 h-3.5 text-blue-600" />
              <span>Compare Work</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Share Post"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Copied to clipboard Toast */}
      {copiedToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Link copied to clipboard!</span>
        </div>
      )}

      {/* Before & After Interactive Comparison Modal */}
      {showComparisonModal && canCompare && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowComparisonModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Columns className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Resolution Comparison
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Compare original grievance vs. completed work
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Interactive Image Split View */}
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-slate-900 select-none shadow-inner border border-slate-200">
                {/* After / Resolved Image (Full base) */}
                <img
                  src={resolvedAfterImage}
                  alt="After Resolution"
                  className="absolute inset-0 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />

                {/* Before / Grievance Image (Clipped overlay) */}
                <div
                  className="absolute inset-0 overflow-hidden border-r-2 border-white shadow-2xl"
                  style={{ width: `${comparisonSliderPos}%` }}
                >
                  <img
                    src={originalBeforeImage}
                    alt="Before Resolution"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      width: "100%",
                      maxWidth: "none",
                      minWidth: "100%",
                    }}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-rose-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md">
                    Before (Reported)
                  </div>
                </div>

                <div className="absolute top-3 right-3 bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md">
                  After (Resolved)
                </div>

                {/* Vertical Divider Handle */}
                <div
                  className="absolute top-0 bottom-0 -ml-3 flex items-center justify-center pointer-events-none"
                  style={{ left: `${comparisonSliderPos}%` }}
                >
                  <div className="w-7 h-7 bg-white text-slate-800 rounded-full shadow-xl flex items-center justify-center border-2 border-blue-600">
                    <Columns className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Slider Controller */}
              <div className="space-y-1.5 px-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="text-rose-600">◀ Original Grievance</span>
                  <span className="text-xs text-slate-400 font-medium">Slide to compare</span>
                  <span className="text-emerald-600">Completed Work ▶</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={comparisonSliderPos}
                  onChange={(e) => setComparisonSliderPos(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Resolution Details */}
              {report.departmentNotes && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Official Completion Note
                  </span>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {report.departmentNotes}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setShowComparisonModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Single Post Card (Matching Home Feed Layout & High Craft) */}
      <article className="p-4 sm:p-5 border-b border-slate-200 space-y-3">
        {/* Author Details Header with Location & Timestamp at top - EXACT HOME FEED DESIGN */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <img
              src={report.authorAvatar}
              alt={report.authorName}
              onClick={() => onSelectUser && onSelectUser(report.authorId)}
              className="w-10 h-10 rounded-full object-cover border border-slate-200 cursor-pointer shadow-2xs shrink-0 hover:opacity-85"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                {(() => {
                  const cleanUsername = getCleanAuthorUsername(
                    report.authorUsername,
                    report.authorName
                  );
                  const isVerified = isReportAuthorVerified(report);

                  return (
                    <h3
                      onClick={() => onSelectUser && onSelectUser(report.authorId)}
                      className="text-sm font-extrabold text-slate-900 cursor-pointer hover:underline truncate whitespace-nowrap max-w-[140px] sm:max-w-[220px] md:max-w-[300px] flex items-center gap-1"
                      title={cleanUsername}
                    >
                      <span>{cleanUsername}</span>
                      {isVerified && (
                        <CategoryVerifiedTick
                          category={report.authorCategory}
                          size="xs"
                        />
                      )}
                    </h3>
                  );
                })()}

                {report.authorBadge && isReportAuthorVerified(report) && (
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

              {/* Location & Timestamp - Clean, Single Non-Duplicated String */}
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 min-w-0">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate max-w-[150px] sm:max-w-[220px]">
                  {report.location?.city || report.location?.address || "Jharkhand, India"}
                </span>
                <span>•</span>
                <span className="shrink-0">{formatReportTimestamp(report.createdAt || report.timestamp)}</span>
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 ${getStatusPill(
              report.status
            )}`}
          >
            {report.status}
          </span>
        </div>

        {/* Post Text Description */}
        <p className="text-xs sm:text-sm text-slate-900 leading-relaxed font-normal whitespace-pre-line">
          {cleanReportText(report.text)}
        </p>

        {/* Structured Audit Parameters */}
        {report.structuredDetails &&
          Object.keys(report.structuredDetails).length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {Object.entries(report.structuredDetails).map(([key, val]) => {
                if (!val) return null;
                const label = key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (s) => s.toUpperCase());
                return (
                  <span
                    key={key}
                    className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200/80 px-2 py-0.5 rounded-md font-semibold"
                  >
                    <strong className="text-slate-900 font-bold">
                      {label}:
                    </strong>{" "}
                    {val}
                  </span>
                );
              })}
            </div>
          )}

        {/* Media Section: Interactive Before | After | Compare Tabs */}
        {resolvedAfterImage && imageList.length > 0 ? (
          <div className="space-y-2 pt-1">
            {/* Before vs After Work Tab Bar */}
            <div className="flex items-center justify-between gap-2 flex-wrap bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMediaTab("before")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    mediaTab === "before"
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>Before ({imageList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMediaTab("after")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    mediaTab === "after"
                      ? "bg-white text-emerald-700 shadow-xs border border-emerald-200"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>After (Work Done)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMediaTab("compare")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    mediaTab === "compare"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Split Compare</span>
                </button>
              </div>

              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                Resolution Verified ✓
              </span>
            </div>

            {/* Tab 1: Before Evidence Carousel */}
            {mediaTab === "before" && (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center group my-1">
                <img
                  src={imageList[activeSlide]}
                  alt={`Before Evidence ${activeSlide + 1}`}
                  className="w-full max-h-96 object-contain rounded-2xl"
                  referrerPolicy="no-referrer"
                />

                <div className="absolute top-3 left-3 bg-rose-600/90 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                  Before (Reported)
                  {imageList.length > 1 && ` • ${activeSlide + 1}/${imageList.length}`}
                </div>

                {imageList.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSlide((prev) =>
                          prev > 0 ? prev - 1 : imageList.length - 1
                        );
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded-full cursor-pointer transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSlide((prev) =>
                          prev < imageList.length - 1 ? prev + 1 : 0
                        );
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded-full cursor-pointer transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Tab 2: After Resolved Work Photo */}
            {mediaTab === "after" && (
              <div className="relative rounded-2xl overflow-hidden border border-emerald-200 bg-slate-50 flex items-center justify-center my-1 group">
                <img
                  src={resolvedAfterImage}
                  alt="After Resolution Work"
                  className="w-full max-h-96 object-contain rounded-2xl"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>After Fix (Authority Completed)</span>
                </div>
              </div>
            )}

            {/* Tab 3: Interactive Split-View Comparison Slider directly in post */}
            {mediaTab === "compare" && (
              <div className="space-y-3 pt-1">
                <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-slate-900 select-none shadow-inner border border-slate-200">
                  {/* After Image (Base) */}
                  <img
                    src={resolvedAfterImage}
                    alt="After Fix"
                    className="absolute inset-0 w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />

                  {/* Before Image (Clipped overlay) */}
                  <div
                    className="absolute inset-0 overflow-hidden border-r-2 border-white shadow-2xl"
                    style={{ width: `${comparisonSliderPos}%` }}
                  >
                    <img
                      src={originalBeforeImage}
                      alt="Before Fix"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{
                        width: "100%",
                        maxWidth: "none",
                        minWidth: "100%",
                      }}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-rose-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md">
                      Before (Reported)
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md">
                    After (Resolved)
                  </div>

                  {/* Vertical Divider Handle */}
                  <div
                    className="absolute top-0 bottom-0 -ml-3 flex items-center justify-center pointer-events-none"
                    style={{ left: `${comparisonSliderPos}%` }}
                  >
                    <div className="w-7 h-7 bg-white text-slate-800 rounded-full shadow-xl flex items-center justify-center border-2 border-blue-600">
                      <Columns className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                  </div>
                </div>

                {/* Slider Controller */}
                <div className="space-y-1 px-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="text-rose-600">◀ Original Grievance</span>
                    <span className="text-xs text-slate-400 font-medium">Slide to compare improvement</span>
                    <span className="text-emerald-600">Completed Fix ▶</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={comparisonSliderPos}
                    onChange={(e) => setComparisonSliderPos(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            )}
          </div>
        ) : resolvedAfterImage ? (
          /* Only After Fix photo exists */
          <div className="relative rounded-2xl overflow-hidden border border-emerald-200 bg-slate-50 flex items-center justify-center my-1 group">
            <img
              src={resolvedAfterImage}
              alt="After Resolution Work"
              className="w-full max-h-96 object-contain rounded-2xl"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Official Completion Proof</span>
            </div>
          </div>
        ) : imageList.length > 0 ? (
          /* Standard Multi-Image Carousel (Before work resolved) */
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center group my-1">
            <img
              src={imageList[activeSlide]}
              alt={`Evidence ${activeSlide + 1}`}
              className="w-full max-h-96 object-contain rounded-2xl"
              referrerPolicy="no-referrer"
            />

            {imageList.length > 1 && (
              <>
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  {activeSlide + 1} / {imageList.length} Photos
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSlide((prev) =>
                      prev > 0 ? prev - 1 : imageList.length - 1
                    );
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded-full cursor-pointer transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSlide((prev) =>
                      prev < imageList.length - 1 ? prev + 1 : 0
                    );
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded-full cursor-pointer transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ) : null}

        {/* Tagged Authorities Chips */}
        {(() => {
          const officers = (report.taggedOfficers || []).map((t) => t.replace(/^@+/, ""));
          const leaders = (report.taggedLeaders || []).map((t) => t.replace(/^@+/, ""));
          const uniqueOfficers = Array.from(new Set(officers)).filter(Boolean);
          const uniqueLeaders = Array.from(new Set(leaders)).filter(Boolean);

          if (uniqueOfficers.length === 0 && uniqueLeaders.length === 0) return null;

          return (
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] pt-0.5">
              {uniqueOfficers.map((cleanTag) => (
                <span
                  key={cleanTag}
                  onClick={() => onSelectUser && onSelectUser(cleanTag)}
                  className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:underline border border-blue-200/70 px-2.5 py-0.5 rounded-full cursor-pointer transition-colors"
                >
                  <Building2 className="w-3 h-3 text-blue-600" />
                  @{cleanTag}
                </span>
              ))}
              {uniqueLeaders.map((cleanTag) => (
                <span
                  key={cleanTag}
                  onClick={() => onSelectUser && onSelectUser(cleanTag)}
                  className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:underline border border-indigo-200/70 px-2.5 py-0.5 rounded-full cursor-pointer transition-colors"
                >
                  <AtSign className="w-3 h-3 text-indigo-600" />
                  @{cleanTag}
                </span>
              ))}
            </div>
          );
        })()}

        {/* Statutory Triage Card */}
        {report.aiTriage && (
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-600" /> Statutory
                Triage: {report.aiTriage.departmentTag}
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

        {/* 4-Stage Official Progress Card */}
        <div className="bg-slate-50/90 border border-blue-200/80 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 min-w-0">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                <span>Official Action{hasDeptClaimed && (report.claimedByOfficer || report.claimedByDept) ? ":" : ""}</span>
                {hasDeptClaimed && (report.claimedByOfficer || report.claimedByDept) ? (
                  <button
                    onClick={() => {
                      const targetId = report.claimedByOfficer || report.claimedByDept || "";
                      const cleanId = getCleanAuthorUsername(targetId);
                      onSelectUser && onSelectUser(cleanId);
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
            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
              hasDeptClaimed ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800 border border-amber-200"
            }`}>
              {hasDeptClaimed
                ? `Stage ${currentDeptLevel}/3: ${report.status}`
                : "Waiting"}
            </span>
          </div>

          {/* 4 Steps Indicator */}
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

          {report.departmentNotes && (
            <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 space-y-0.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                <span>OFFICIAL DEPARTMENT REMARKS</span>
                <span>{report.claimedAt || "Verified"}</span>
              </div>
              <p className="text-slate-700">{report.departmentNotes}</p>
            </div>
          )}

          {/* Department Actions: ONLY visible if user is a tagged/assigned department account */}
          {isTaggedDepartmentOfficer ? (
            <div className="pt-1 space-y-2">
              {!hasDeptClaimed ? (
                <button
                  onClick={() =>
                    onUpdateStatus(
                      report.id,
                      1,
                      `Acknowledged by @${userProfile.username || userProfile.fullName}. Official investigation initiated.`
                    )
                  }
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Take Official Action & Acknowledge Grievance</span>
                </button>
              ) : currentDeptLevel >= 3 || report.status === "Resolved" ? (
                /* Completed State: The input box is closed and ended! */
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900 font-bold">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Resolution Completed & Verified (Work Closed)</span>
                  </span>
                  <span className="text-[10px] font-black uppercase bg-emerald-600 text-white px-2 py-0.5 rounded">
                    Completed
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Optional Proof Image Upload for Final Stage (Step 3 -> Step 4 / Complete) */}
                  {currentDeptLevel >= 2 && currentDeptLevel < 3 && (
                    <div className="bg-white border border-dashed border-blue-300 rounded-xl p-2.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                          <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                          Upload Completion Proof (Optional)
                        </span>
                        {proofImage && (
                          <button
                            onClick={() => setProofImage(null)}
                            className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {proofImage ? (
                        <div className="relative rounded-lg overflow-hidden border border-slate-200">
                          <img
                            src={proofImage}
                            alt="Proof preview"
                            className="w-full h-28 object-cover"
                          />
                          <span className="absolute bottom-1 right-1 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                            Proof Attached
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => proofFileInputRef.current?.click()}
                          className="w-full py-2 bg-slate-50 hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <ImageIcon className="w-4 h-4" />
                          <span>Select After-Fix Photo</span>
                        </button>
                      )}

                      <input
                        ref={proofFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setProofImage(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Progress Update Note and Next Stage / Complete button */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add official progress update note..."
                      value={statusUpdateNotes}
                      onChange={(e) => setStatusUpdateNotes(e.target.value)}
                      className="flex-1 min-w-0 text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const nextLevel = Math.min(3, currentDeptLevel + 1);
                        onUpdateStatus(
                          report.id,
                          nextLevel,
                          statusUpdateNotes ||
                            (nextLevel === 3
                              ? `Grievance successfully resolved and verified by @${userProfile.username || userProfile.fullName}.`
                              : `Progress updated to stage ${nextLevel}.`),
                          proofImage || undefined
                        );
                        setStatusUpdateNotes("");
                        setProofImage(null);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shrink-0 cursor-pointer whitespace-nowrap shadow-xs"
                    >
                      {currentDeptLevel >= 2 ? "Complete ✓" : "Next Stage →"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            !hasDeptClaimed && (
              <div className="text-[11px] text-slate-500 bg-white/80 border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Awaiting official response from {primaryDeptTag || "assigned authority"}
                </span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  SLA Active
                </span>
              </div>
            )
          )}
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between pt-2 text-slate-500 text-xs border-t border-slate-100">
          {/* Reply Button (Focuses reply capsule) */}
          <button
            onClick={() => {
              if (currentFocusedReply) {
                setFocusedReplyIdStack([]);
              }
              setIsInputExpanded(true);
              setTimeout(() => textareaRef.current?.focus(), 50);
            }}
            className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer group py-1"
            title="Reply"
          >
            <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="font-bold">
              {topLevelReplies.length}
            </span>
          </button>

          {/* Re-Report / Repost */}
          <button
            onClick={() => onReReport(report.id)}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer group py-1 ${
              isReReported
                ? "text-emerald-600 font-extrabold"
                : "hover:text-emerald-600"
            }`}
            title="Re-report"
          >
            <Repeat2 className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
            <span className="font-bold">{report.reReportsCount || 0}</span>
          </button>

          {/* Like / Endorse */}
          <button
            onClick={() => onLike(report.id)}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer group py-1 ${
              isLiked
                ? "text-rose-600 font-extrabold"
                : "hover:text-rose-600"
            }`}
            title="Like"
          >
            <Heart
              className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                isLiked ? "fill-rose-600 text-rose-600" : ""
              }`}
            />
            <span className="font-bold">{report.likesCount || 0}</span>
          </button>

          {/* Bookmark */}
          <button
            onClick={() => onBookmark(report.id)}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer hover:text-blue-600 py-1 ${
              isSaved ? "text-blue-600 font-extrabold" : ""
            }`}
            title="Bookmark"
          >
            <Bookmark
              className={`w-4 h-4 ${
                isSaved ? "fill-blue-600 text-blue-600" : ""
              }`}
            />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 transition-colors cursor-pointer hover:text-blue-600 py-1"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </article>

      {/* ========================================================================= */}
      {/* COMMENTS / REPLIES SECTION */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5">
        {currentFocusedReply ? (
          /* --- THREAD VIEW: Specific Comment + Its Nested Replies --- */
          <div className="space-y-4 animate-fadeIn">
            {/* Thread Back Banner */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <button
                onClick={() => {
                  if (focusedReplyIdStack.length > 1) {
                    setFocusedReplyIdStack((prev) => prev.slice(0, -1));
                  } else {
                    setFocusedReplyIdStack([]);
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50/80 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>
                  {focusedReplyIdStack.length > 1
                    ? "Back to previous reply"
                    : `View all ${topLevelReplies.length} comments`}
                </span>
              </button>

              <span className="text-[11px] font-semibold text-slate-400">
                Replying to @{currentFocusedReply.authorUsername || "user"}
              </span>
            </div>

            {/* Focused Comment Card (Formatted like a post card) */}
            <article className="py-4 border-b border-slate-200 space-y-3">
              <div className="flex items-start gap-3">
                <img
                  src={currentFocusedReply.authorAvatar}
                  alt={currentFocusedReply.authorName}
                  onClick={() =>
                    onSelectUser && onSelectUser(currentFocusedReply.authorId)
                  }
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 cursor-pointer hover:opacity-90 shadow-2xs shrink-0 bg-white"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span
                        onClick={() =>
                          onSelectUser &&
                          onSelectUser(currentFocusedReply.authorId)
                        }
                        className="font-extrabold text-sm text-slate-900 cursor-pointer hover:underline truncate"
                      >
                        {currentFocusedReply.authorName}
                      </span>
                      {currentFocusedReply.authorBadge && (
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${
                            currentFocusedReply.isOfficialIntervention
                              ? "bg-amber-100 text-amber-900 border border-amber-200"
                              : "bg-blue-50 text-blue-700 border border-blue-100"
                          }`}
                        >
                          {currentFocusedReply.authorBadge}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 truncate">
                        @{currentFocusedReply.authorUsername || "citizen"}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-400 shrink-0">
                        {formatReportTimestamp(currentFocusedReply.createdAt || currentFocusedReply.timestamp)}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-900 mt-1.5 leading-relaxed whitespace-pre-line font-normal">
                    {currentFocusedReply.text}
                  </p>

                  {currentFocusedReply.imageUrl && (
                    <div className="mt-2.5 rounded-2xl overflow-hidden border border-slate-200 max-w-sm">
                      <img
                        src={currentFocusedReply.imageUrl}
                        alt="Evidence"
                        className="max-h-64 w-full object-cover rounded-2xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Action Icons for the focused comment */}
                  <div className="flex items-center justify-between mt-3 pt-1 text-slate-400 text-xs font-semibold max-w-sm">
                    <button
                      onClick={() => {
                        setIsInputExpanded(true);
                        setTimeout(() => textareaRef.current?.focus(), 50);
                      }}
                      className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer group py-1"
                      title="Reply"
                    >
                      <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>{getSubReplies(currentFocusedReply.id).length || "Reply"}</span>
                    </button>

                    <button
                      onClick={() =>
                        onReReportReply &&
                        onReReportReply(report.id, currentFocusedReply.id)
                      }
                      className={`flex items-center gap-1.5 transition-colors cursor-pointer group py-1 ${
                        currentFocusedReply.reReportedBy?.includes(userProfile.id)
                          ? "text-emerald-600 font-bold"
                          : "hover:text-emerald-600"
                      }`}
                      title="Re-report"
                    >
                      <Repeat2 className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                      <span>{currentFocusedReply.reReportsCount || 0}</span>
                    </button>

                    <button
                      onClick={() =>
                        onLikeReply &&
                        onLikeReply(report.id, currentFocusedReply.id)
                      }
                      className={`flex items-center gap-1.5 transition-colors cursor-pointer group py-1 ${
                        currentFocusedReply.likedBy?.includes(userProfile.id)
                          ? "text-rose-600 font-bold"
                          : "hover:text-rose-600"
                      }`}
                      title="Like"
                    >
                      <Heart
                        className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                          currentFocusedReply.likedBy?.includes(userProfile.id)
                            ? "fill-rose-600 text-rose-600"
                            : ""
                        }`}
                      />
                      <span>{currentFocusedReply.likesCount || 0}</span>
                    </button>

                    <button
                      onClick={handleShare}
                      className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer py-1"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </article>

            {/* Sub-replies to this comment */}
            <div className="space-y-1 pt-1">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                Replies ({getSubReplies(currentFocusedReply.id).length})
              </h4>

              {getSubReplies(currentFocusedReply.id).length > 0 ? (
                renderCommentCards(
                  getSubReplies(currentFocusedReply.id),
                  currentFocusedReply.authorUsername
                )
              ) : (
                <div className="py-6 text-center text-slate-400 space-y-1">
                  <p className="text-xs font-semibold text-slate-600">
                    No replies to this comment yet
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Post a reply below to respond to @
                    {currentFocusedReply.authorUsername ||
                      currentFocusedReply.authorName}
                    .
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* --- ALL TOP-LEVEL COMMENTS VIEW --- */
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center justify-between">
              <span>Replies ({topLevelReplies.length})</span>
            </h3>

            {topLevelReplies.length > 0 ? (
              renderCommentCards(topLevelReplies, report.authorUsername)
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <MessageCircle className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-sm font-semibold text-slate-700">
                  No replies yet
                </p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Be the first to reply, add evidence, or provide an official nodal update.
                </p>
              </div>
            )}
          </div>
        )}

        <div ref={repliesBottomRef} />
      </div>

      {/* Hidden File Input for Image Upload in Reply */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Sticky Bottom Reply Bar (Twitter/X Butter-Smooth Morphing Capsule) */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-3 py-2.5 sm:px-4 sm:py-3 transition-all">
        <div className="max-w-xl mx-auto">
          {/* Continuous Morphing Rounded Capsule */}
          <div
            ref={replyCapsuleRef}
            onClick={() => {
              if (!isInputExpanded) {
                setIsInputExpanded(true);
                setTimeout(() => textareaRef.current?.focus(), 50);
              }
            }}
            className={`w-full bg-[#eff3f4] border transition-all duration-300 ease-out cursor-text ${
              isInputExpanded
                ? "bg-white border-slate-300 rounded-2xl p-3 shadow-md ring-2 ring-blue-50"
                : "border-slate-200 hover:bg-[#e8ecef] rounded-full px-3.5 py-2 shadow-2xs"
            }`}
          >
            {/* Main Input Row: User Avatar + Textarea + (Gallery Icon when collapsed) */}
            <div className="flex items-start gap-2.5">
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.fullName}
                className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
              />

              <div className="flex-1 min-w-0">
                <textarea
                  ref={textareaRef}
                  rows={isInputExpanded ? 2 : 1}
                  value={replyText}
                  onFocus={() => setIsInputExpanded(true)}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  placeholder={
                    currentFocusedReply
                      ? `Reply to @${
                          currentFocusedReply.authorUsername ||
                          currentFocusedReply.authorName
                        }`
                      : "Post your reply"
                  }
                  className={`w-full text-sm text-slate-900 placeholder:text-slate-500 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none leading-tight p-0 transition-all duration-200 overflow-hidden ${
                    isInputExpanded
                      ? "min-h-[44px] pt-1"
                      : "min-h-[22px] pt-1 cursor-text"
                  }`}
                />

                {/* Attached Image Thumbnail (Expanded only) */}
                {replyImage && isInputExpanded && (
                  <div className="relative inline-block mt-2 rounded-xl overflow-hidden border border-slate-200 max-h-28 animate-fadeIn">
                    <img
                      src={replyImage}
                      alt="Reply attachment"
                      className="h-24 w-auto object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReplyImage(null);
                      }}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white p-1 rounded-full cursor-pointer transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Gallery Icon visible directly on the right ONLY when collapsed */}
              {!isInputExpanded && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="p-1 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer shrink-0"
                  title="Add photo"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Bottom Toolbar: Gallery Icon + Character Count Ring + Blue Reply Button (Expanded State with smooth slide-fade) */}
            {isInputExpanded && (
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 transition-all duration-300 ease-out animate-fadeIn">
                <div className="flex items-center gap-1 text-slate-500">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                    title="Add photo"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Twitter-style Circular Character Ring */}
                  {replyText.length > 0 && (
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <svg className="w-5 h-5 -rotate-90" viewBox="0 0 24 24">
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          className="stroke-slate-300"
                          strokeWidth="2.5"
                          fill="none"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          className={`${
                            replyText.length > 250
                              ? "stroke-amber-500"
                              : replyText.length > 280
                              ? "stroke-rose-500"
                              : "stroke-blue-600"
                          }`}
                          strokeWidth="2.5"
                          strokeDasharray={56.5}
                          strokeDashoffset={Math.max(
                            0,
                            56.5 -
                              (56.5 * Math.min(replyText.length, 280)) / 280
                          )}
                          strokeLinecap="round"
                          fill="none"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Blue Pill Reply Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendReply();
                    }}
                    disabled={
                      (!replyText.trim() && !replyImage) || isSubmitting
                    }
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-black text-xs rounded-full shadow-xs transition-all flex items-center gap-1 cursor-pointer tracking-tight active:scale-95"
                  >
                    {isSubmitting ? "Posting..." : "Reply"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
