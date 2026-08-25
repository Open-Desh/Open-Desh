import React, { useState } from "react";
import {
  Bookmark,
  Heart,
  MessageCircle,
  Repeat2,
  Share2,
  MapPin,
  Sparkles,
  Send,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Flame,
  MoreVertical,
} from "lucide-react";
import { ReportIssue, UserProfile, ThreadedReply } from "../types.ts";
import { CategoryVerifiedTick } from "./CategoryBadge.tsx";
import { PostActionSheet } from "./PostActionSheet.tsx";
import {
  getCleanAuthorUsername,
  isReportAuthorVerified,
  cleanReportText,
  formatReportTimestamp,
} from "../utils/reportUtils.ts";

interface BookmarksViewProps {
  bookmarkedReports: ReportIssue[];
  userProfile: UserProfile;
  onLike: (id: string) => Promise<void>;
  onReReport: (id: string) => Promise<void>;
  onBookmark: (id: string) => Promise<void>;
  onReply: (id: string, text: string, parentReplyId?: string) => Promise<void>;
  onUpdateStatus: (id: string, level: number, notes?: string) => Promise<void>;
  onNavigate: (view: string) => void;
  onSelectUser?: (userId: string) => void;
  onSelectPost?: (id: string) => void;
  onDeleteReport?: (reportId: string) => Promise<void>;
  onTogglePinReport?: (reportId: string, isCurrentlyPinned?: boolean) => Promise<void>;
  onMuteUser?: (authorUsername: string, authorId?: string) => void;
  mutedUsers?: string[];
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  bookmarkedReports,
  userProfile,
  onLike,
  onReReport,
  onBookmark,
  onReply,
  onUpdateStatus,
  onNavigate,
  onSelectUser,
  onSelectPost,
  onDeleteReport,
  onTogglePinReport,
  onMuteUser,
  mutedUsers = [],
  searchQuery = "",
  onSearchQueryChange,
}) => {
  const [activeActionReport, setActiveActionReport] = useState<ReportIssue | null>(null);
  const [replyInputMap, setReplyInputMap] = useState<Record<string, string>>({});
  const [activeReplyBoxReportId, setActiveReplyBoxReportId] = useState<string | null>(null);
  const [activeNestedReplyId, setActiveNestedReplyId] = useState<string | null>(null);
  const [expandedRepliesReportId, setExpandedRepliesReportId] = useState<Record<string, boolean>>({});
  const [activeImageSlideIndex, setActiveImageSlideIndex] = useState<Record<string, number>>({});

  // Filter bookmarks directly by search query without category clutter
  const filteredBookmarks = bookmarkedReports.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.text.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.authorName.toLowerCase().includes(q) ||
      r.authorUsername.toLowerCase().includes(q) ||
      (r.location?.city && r.location.city.toLowerCase().includes(q)) ||
      (r.aiTriage?.departmentTag && r.aiTriage.departmentTag.toLowerCase().includes(q))
    );
  });

  const handleSendReply = async (reportId: string, parentReplyId?: string) => {
    const key = parentReplyId ? `${reportId}_${parentReplyId}` : reportId;
    const text = replyInputMap[key];
    if (!text || !text.trim()) return;

    await onReply(reportId, text, parentReplyId);
    setReplyInputMap((prev) => ({ ...prev, [key]: "" }));
    setActiveNestedReplyId(null);
    setExpandedRepliesReportId((prev) => ({ ...prev, [reportId]: true }));
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

  // Render recursive nested reply tree
  const renderThreadedReplies = (
    replies: ThreadedReply[],
    reportId: string,
    depth: number = 0,
    parentAuthorUsername?: string
  ) => {
    const containerClasses =
      depth === 0
        ? "space-y-3"
        : depth === 1
        ? "space-y-2.5 ml-4 sm:ml-6 border-l-2 border-slate-200/90 pl-2.5 sm:pl-3 pt-2"
        : "space-y-2.5 ml-0 pl-0 border-none pt-2";

    return (
      <div className={containerClasses}>
        {replies.map((reply) => {
          const nestedInputKey = `${reportId}_${reply.id}`;
          const isReplyingToThis = activeNestedReplyId === reply.id;
          const targetUsername = reply.replyToUsername || parentAuthorUsername;

          return (
            <div key={reply.id} className="space-y-1.5 text-xs">
              <div className="flex items-start gap-2 sm:gap-2.5">
                <img
                  src={reply.authorAvatar}
                  alt={reply.authorName}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover shrink-0 border border-slate-200 cursor-pointer hover:opacity-85"
                  onClick={() => onSelectUser && onSelectUser(reply.authorId)}
                />
                <div className="flex-1 bg-slate-50/90 hover:bg-slate-100/70 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 space-y-1 transition-colors">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        onClick={() => onSelectUser && onSelectUser(reply.authorId)}
                        className="font-extrabold text-slate-900 cursor-pointer hover:underline flex items-center gap-1"
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
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                            reply.isOfficialIntervention
                              ? "bg-amber-100 text-amber-900"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {reply.authorBadge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{formatReportTimestamp(reply.createdAt || reply.timestamp)}</span>
                  </div>

                  {targetUsername && (
                    <div className="text-[11px] text-blue-600 font-semibold flex items-center gap-0.5">
                      <span>Replying to</span>
                      <span className="hover:underline">@{targetUsername}</span>
                    </div>
                  )}

                  <p className="text-slate-800 leading-relaxed break-words">{reply.text}</p>

                  <div className="flex items-center gap-4 pt-1 text-[11px] font-bold text-slate-500">
                    <button
                      onClick={() =>
                        setActiveNestedReplyId(isReplyingToThis ? null : reply.id)
                      }
                      className="hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>

              {/* Nested reply inline input */}
              {isReplyingToThis && (
                <div className="ml-8 sm:ml-10 flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={replyInputMap[nestedInputKey] || ""}
                    onChange={(e) =>
                      setReplyInputMap((prev) => ({
                        ...prev,
                        [nestedInputKey]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendReply(reportId, reply.id);
                    }}
                    placeholder={`Reply to @${reply.authorUsername}...`}
                    className="flex-1 bg-white border border-slate-300 focus:border-blue-500 text-xs px-3 py-1.5 rounded-full outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSendReply(reportId, reply.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Render recursive children */}
              {reply.replies &&
                reply.replies.length > 0 &&
                renderThreadedReplies(reply.replies, reportId, depth + 1, reply.authorUsername)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto pb-28 md:pb-16 animate-fadeIn">
      {/* Main Feed of Saved Posts (No Clutter, Clean Feed) */}
      <div className="divide-y divide-slate-200/80 bg-white shadow-xs">
        {filteredBookmarks.length === 0 ? (
          <div className="p-12 text-center space-y-4 bg-white">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Bookmark className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                {searchQuery ? "No bookmarks match your search" : "No saved reports yet"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                {searchQuery
                  ? `No saved reports match "${searchQuery}".`
                  : `Save reports from your home feed to monitor their resolution progress.`}
              </p>
            </div>
            <button
              onClick={() => {
                if (onSearchQueryChange) onSearchQueryChange("");
                onNavigate("dashboard");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Explore Home Feed
            </button>
          </div>
        ) : (
          filteredBookmarks.map((report) => {
            const isLiked = report.likedBy?.includes(userProfile.id);
            const isReReported = report.reReportedBy?.includes(userProfile.id);
            const isDeptUser = userProfile.category === "department";

            // Multi-image list
            const imageList =
              report.images && report.images.length > 0
                ? report.images
                : report.imageUrl
                ? [report.imageUrl]
                : [];
            const currentImgIndex = activeImageSlideIndex[report.id] || 0;
            const hasMultipleImages = imageList.length > 1;

            const isRepliesExpanded = expandedRepliesReportId[report.id] || false;
            const isReplyBoxOpen = activeReplyBoxReportId === report.id;

            return (
              <article
                key={report.id}
                className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors space-y-3 relative"
              >
                {/* Author Info & Status Ribbon */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={report.authorAvatar}
                      alt={report.authorName}
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200 cursor-pointer hover:opacity-85 shadow-xs"
                      onClick={() => onSelectUser && onSelectUser(report.authorId)}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          onClick={() => onSelectUser && onSelectUser(report.authorId)}
                          className="font-extrabold text-slate-900 text-sm hover:underline cursor-pointer truncate flex items-center gap-1"
                        >
                          <span>{getCleanAuthorUsername(report.authorUsername, report.authorName)}</span>
                          {isReportAuthorVerified(report) && (
                            <CategoryVerifiedTick
                              category={report.authorCategory}
                              size="xs"
                            />
                          )}
                        </span>
                        {report.authorBadge && isReportAuthorVerified(report) && (
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                              report.authorCategory === "department"
                                ? "bg-amber-100 text-amber-900"
                                : report.authorCategory === "representative"
                                ? "bg-blue-100 text-blue-900"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {report.authorBadge}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 truncate">
                          @{getCleanAuthorUsername(report.authorUsername, report.authorName)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mt-0.5">
                        <span>{formatReportTimestamp(report.createdAt || report.timestamp)}</span>
                        <span>•</span>
                        <span className="text-blue-600 font-bold uppercase text-[10px] bg-blue-50 px-1.5 py-0.2 rounded">
                          {report.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge + 3-dot Action Menu */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    {report.urgencyLevel === "Critical Emergency" && (
                      <span className="flex items-center gap-0.5 bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse">
                        <Flame className="w-3 h-3 fill-red-600 text-red-600" />
                        Critical
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-tight ${getStatusPill(
                        report.status
                      )}`}
                    >
                      {report.status}
                    </span>

                    {/* 3-Dot Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveActionReport(report);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                      title="More Options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Grievance Post Content Text */}
                <p className="text-slate-800 text-sm sm:text-[15px] leading-relaxed break-words font-normal">
                  {cleanReportText(report.text)}
                </p>

                {/* Structured Audit Parameters (if present) */}
                {report.structuredDetails && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-xs">
                    {Object.entries(report.structuredDetails).map(([k, v]) => (
                      <div key={k} className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{k}</span>
                        <span className="font-extrabold text-slate-800 truncate">{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Multi-Image Evidence Carousel / Natural Dimensions */}
                {imageList.length > 0 && (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center group shadow-xs">
                    <img
                      src={imageList[currentImgIndex]}
                      alt="Civic Evidence"
                      className="w-full h-auto object-contain rounded-2xl"
                      referrerPolicy="no-referrer"
                    />

                    {/* Image Counter Badge */}
                    <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-white/10 flex items-center gap-1.5">
                      <span>
                        {currentImgIndex + 1} / {imageList.length}
                      </span>
                    </div>

                    {/* Left/Right Carousel Controls */}
                    {hasMultipleImages && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageSlideIndex((prev) => ({
                              ...prev,
                              [report.id]: (currentImgIndex - 1 + imageList.length) % imageList.length,
                            }));
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageSlideIndex((prev) => ({
                              ...prev,
                              [report.id]: (currentImgIndex + 1) % imageList.length,
                            }));
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Location Geo-Tag Pin */}
                {report.location && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50/80 border border-slate-200/60 px-3 py-1.5 rounded-xl font-medium">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{report.location.city}</span>
                    {report.location.address && (
                      <span className="text-slate-400 truncate">• {report.location.address}</span>
                    )}
                  </div>
                )}

                {/* AI Legal & Triage Statutory Insights */}
                {report.aiTriage && (
                  <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between text-blue-900 font-extrabold">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>AI Legal Triage</span>
                      </div>
                      <span className="bg-blue-200/80 text-blue-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {report.aiTriage.departmentTag}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-snug">{report.aiTriage.sentimentSummary}</p>
                    {report.aiTriage.relevantStatute && (
                      <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1 pt-0.5">
                        <span>Statute Reference:</span>
                        <span className="text-blue-700 font-extrabold">{report.aiTriage.relevantStatute}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Department Resolution Progress (Stage 0 to 3) */}
                <div className="pt-2 pb-1 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1.5">
                    <span>Municipal Department SLA Workflow</span>
                    <span className="text-blue-700">Stage {report.departmentStatusLevel || 0} / 3</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex gap-0.5">
                    <div
                      className={`h-full flex-1 rounded-l-full transition-all ${
                        (report.departmentStatusLevel || 0) >= 1 ? "bg-amber-500" : "bg-slate-200"
                      }`}
                    />
                    <div
                      className={`h-full flex-1 transition-all ${
                        (report.departmentStatusLevel || 0) >= 2 ? "bg-blue-500" : "bg-slate-200"
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-r-full transition-all ${
                        (report.departmentStatusLevel || 0) >= 3 ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    />
                  </div>
                </div>

                {/* Interactive Twitter/X Toolbar */}
                <div className="flex items-center justify-between text-slate-500 pt-2 border-t border-slate-100 text-xs font-semibold">
                  {/* Reply Button (Opens dedicated post view) */}
                  <button
                    onClick={() => {
                      if (onSelectPost) {
                        onSelectPost(report.id);
                      } else {
                        setActiveReplyBoxReportId(isReplyBoxOpen ? null : report.id);
                        setExpandedRepliesReportId((prev) => ({ ...prev, [report.id]: true }));
                      }
                    }}
                    className="flex items-center gap-1.5 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-blue-50 group cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>{report.repliesCount || 0}</span>
                  </button>

                  {/* Re-Report (Retweet) */}
                  <button
                    onClick={() => onReReport(report.id)}
                    className={`flex items-center gap-1.5 transition-colors p-1.5 rounded-lg hover:bg-emerald-50 group cursor-pointer ${
                      isReReported ? "text-emerald-600 font-bold" : "hover:text-emerald-600"
                    }`}
                  >
                    <Repeat2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>{report.reReportsCount || 0}</span>
                  </button>

                  {/* Like Button */}
                  <button
                    onClick={() => onLike(report.id)}
                    className={`flex items-center gap-1.5 transition-colors p-1.5 rounded-lg hover:bg-rose-50 group cursor-pointer ${
                      isLiked ? "text-rose-600 font-bold" : "hover:text-rose-600"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 group-hover:scale-110 transition-transform ${
                        isLiked ? "fill-rose-600 text-rose-600" : ""
                      }`}
                    />
                    <span>{report.likesCount || 0}</span>
                  </button>

                  {/* Bookmark Button (Active Blue Ribbon) */}
                  <button
                    onClick={() => onBookmark(report.id)}
                    className="flex items-center gap-1.5 text-blue-600 font-bold p-1.5 rounded-lg hover:bg-blue-50 group cursor-pointer"
                    title="Remove from Bookmarks"
                  >
                    <Bookmark className="w-4 h-4 fill-blue-600 text-blue-600 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline text-[11px]">Saved</span>
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `Open Desh - Grievance #${report.id}`,
                          text: report.text,
                          url: window.location.href,
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                      }
                    }}
                    className="hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-blue-50 cursor-pointer"
                    title="Share Report"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Inline Top-Level Reply Composer */}
                {isReplyBoxOpen && (
                  <div className="pt-2 flex items-center gap-2 animate-fadeIn">
                    <img
                      src={userProfile.avatarUrl}
                      alt={userProfile.fullName}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <input
                      type="text"
                      value={replyInputMap[report.id] || ""}
                      onChange={(e) =>
                        setReplyInputMap((prev) => ({
                          ...prev,
                          [report.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendReply(report.id);
                      }}
                      placeholder={
                        isDeptUser
                          ? "Post official department update or resolution response..."
                          : "Post your citizen feedback or inquiry..."
                      }
                      className="flex-1 bg-slate-50 border border-slate-300 focus:border-blue-500 text-xs sm:text-sm px-3.5 py-2 rounded-full outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSendReply(report.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-xs transition-transform active:scale-95 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Threaded Discussion Tree */}
                {report.replies && report.replies.length > 0 && (
                  <div className="pt-2">
                    <button
                      onClick={() =>
                        setExpandedRepliesReportId((prev) => ({
                          ...prev,
                          [report.id]: !isRepliesExpanded,
                        }))
                      }
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors mb-2 cursor-pointer"
                    >
                      {isRepliesExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Hide {report.replies.length} replies</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>Show {report.replies.length} replies</span>
                        </>
                      )}
                    </button>

                    {isRepliesExpanded && renderThreadedReplies(report.replies, report.id, 0)}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

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
