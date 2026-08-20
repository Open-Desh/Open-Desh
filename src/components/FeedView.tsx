import React, { useState } from "react";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Share2,
  MapPin,
  Sparkles,
  ShieldCheck,
  Send,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Plus,
  Building2,
  User,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Flame,
  AtSign,
} from "lucide-react";
import { ReportIssue, UserProfile, ThreadedReply, IssueCategory } from "../types.ts";

interface FeedViewProps {
  reports: ReportIssue[];
  userProfile: UserProfile;
  onLike: (id: string) => Promise<void>;
  onReReport: (id: string) => Promise<void>;
  onBookmark: (id: string) => Promise<void>;
  onReply: (id: string, text: string, parentReplyId?: string) => Promise<void>;
  onUpdateStatus: (id: string, level: number, notes?: string) => Promise<void>;
  onOpenCreateModal: () => void;
  onSelectUser?: (userId: string) => void;
  loading?: boolean;
}

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
  loading = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [replyInputMap, setReplyInputMap] = useState<Record<string, string>>({});
  const [activeReplyBoxReportId, setActiveReplyBoxReportId] = useState<string | null>(null);
  const [activeNestedReplyId, setActiveNestedReplyId] = useState<string | null>(null);
  const [expandedRepliesReportId, setExpandedRepliesReportId] = useState<Record<string, boolean>>({
    rep_001: true,
  });
  const [statusUpdateNotes, setStatusUpdateNotes] = useState<Record<string, string>>({});
  const [activeImageSlideIndex, setActiveImageSlideIndex] = useState<Record<string, number>>({});

  const categories = [
    "All",
    "Infrastructure",
    "Water",
    "Electricity",
    "Sanitation",
    "Corruption",
  ];

  const filteredReports = reports.filter(
    (r) => selectedCategory === "All" || r.category === selectedCategory
  );

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

  // Render recursive nested reply tree with max 2 indentation levels
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
                        className="font-extrabold text-slate-900 cursor-pointer hover:underline"
                      >
                        {reply.authorName}
                      </span>
                      {reply.authorBadge && (
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
                    <span className="text-[10px] text-slate-400">{reply.timestamp}</span>
                  </div>

                  {targetUsername && (
                    <span className="text-[11px] font-extrabold text-blue-600 inline-block mr-1">
                      @{targetUsername}
                    </span>
                  )}
                  <p className="text-slate-800 leading-relaxed font-normal">{reply.text}</p>

                  <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-500 font-bold">
                    <button
                      onClick={() =>
                        setActiveNestedReplyId(isReplyingToThis ? null : reply.id)
                      }
                      className="hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>

              {isReplyingToThis && (
                <div className="ml-8 sm:ml-9 flex items-center gap-2 pt-1 animate-fadeIn">
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
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply(reportId, reply.id);
                      }
                    }}
                    placeholder={`Reply to @${reply.authorUsername || reply.authorName}...`}
                    className="flex-1 text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-full focus:outline-none focus:border-blue-500 text-slate-900"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSendReply(reportId, reply.id)}
                    className="p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

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
    <div className="max-w-xl mx-auto pb-24 md:pb-12 animate-fadeIn bg-white border-x border-slate-200 min-h-screen">
      {/* Category Horizontal Filter Pills - Edge-to-Edge Fluid Scrolling */}
      <div className="w-full bg-white border-b border-slate-100/90 overflow-hidden">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-3.5 sm:px-4 py-2.5 scroll-smooth overscroll-x-contain">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black shrink-0 transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              {cat}
            </button>
          ))}
          {/* Spacer so last item has proper breathing room at the right edge */}
          <div className="shrink-0 w-2 h-1" aria-hidden="true" />
        </div>
      </div>

      {/* Reports Feed Container */}
      <div className="divide-y divide-slate-100">
        {filteredReports.map((report) => {
          const isLiked = report.likedBy?.includes(userProfile.id);
          const isReReported = report.reReportedBy?.includes(userProfile.id);
          const isSaved = userProfile.savedReports?.includes(report.id);
          const isDeptUser = userProfile.category === "department";
          const hasDeptClaimed = Boolean(report.claimedByDept);
          const areRepliesExpanded = expandedRepliesReportId[report.id] || false;

          // Multi-image list
          const imageList = report.images && report.images.length > 0 ? report.images : report.imageUrl ? [report.imageUrl] : [];
          const currentSlide = activeImageSlideIndex[report.id] || 0;

          // Tagged departments list
          const primaryDeptTag = report.taggedOfficers?.[0] || report.aiTriage?.departmentTag || "@MunicipalCorp";
          const currentDeptLevel = report.departmentStatusLevel ?? (hasDeptClaimed ? 1 : 0);

          return (
            <article
              key={report.id}
              id={`report-card-${report.id}`}
              className="p-4 sm:p-5 hover:bg-slate-50/40 transition-colors space-y-3"
            >
              {/* Header: Author + GPS + Status Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={report.authorAvatar}
                    alt={report.authorName}
                    onClick={() => onSelectUser && onSelectUser(report.authorId)}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 cursor-pointer shadow-2xs shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3
                        onClick={() => onSelectUser && onSelectUser(report.authorId)}
                        className="text-sm font-extrabold text-slate-900 cursor-pointer hover:underline truncate whitespace-nowrap max-w-[140px] sm:max-w-[220px] md:max-w-[300px]"
                        title={report.authorName}
                      >
                        {report.authorName}
                      </h3>
                      {report.authorBadge && (
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
                      <span className="shrink-0">{report.timestamp}</span>
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

              {/* Text Description */}
              <p className="text-xs sm:text-sm text-slate-900 leading-relaxed font-normal whitespace-pre-line">
                {report.text}
              </p>

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

              {/* Cloudflare R2 Multi-Image Carousel / Natural Size Display */}
              {imageList.length > 0 && (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center group">
                  <img
                    src={imageList[currentSlide]}
                    alt={`Evidence ${currentSlide + 1}`}
                    className="w-full h-auto object-contain rounded-2xl"
                    referrerPolicy="no-referrer"
                  />

                  {/* Multi-photo indicator badge */}
                  {imageList.length > 1 && (
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      {currentSlide + 1} / {imageList.length} Evidence
                    </div>
                  )}

                  {/* Carousel Controls */}
                  {imageList.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageSlideIndex((prev) => ({
                            ...prev,
                            [report.id]: currentSlide > 0 ? currentSlide - 1 : imageList.length - 1,
                          }));
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded-full cursor-pointer transition-all opacity-90 group-hover:opacity-100"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageSlideIndex((prev) => ({
                            ...prev,
                            [report.id]: currentSlide < imageList.length - 1 ? currentSlide + 1 : 0,
                          }));
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded-full cursor-pointer transition-all opacity-90 group-hover:opacity-100"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Tagged Authorities Routing Chips */}
              {(report.taggedOfficers?.length || report.taggedLeaders?.length) ? (
                <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                  {report.taggedOfficers?.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 font-extrabold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full"
                    >
                      <Building2 className="w-3 h-3 text-blue-600" />
                      {tag}
                    </span>
                  ))}
                  {report.taggedLeaders?.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full"
                    >
                      <AtSign className="w-3 h-3 text-indigo-600" />
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

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

              {/* Official Department Action & Multi-Stage Progress Card */}
              {(hasDeptClaimed || report.taggedOfficers?.length || isDeptUser) && (
                <div className="bg-slate-50/90 border border-blue-200/80 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
                        Official Action Card: {report.claimedByDept || primaryDeptTag}
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {hasDeptClaimed ? `Stage ${currentDeptLevel}/3: ${report.status}` : "Pending Dept Action"}
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

                  {/* Department Notes / Status Remarks */}
                  {report.departmentNotes ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                        <span>OFFICIAL DEPARTMENT REMARKS</span>
                        <span>{report.claimedAt || "Verified SLA"}</span>
                      </div>
                      <p className="text-slate-700 font-normal leading-relaxed">{report.departmentNotes}</p>
                    </div>
                  ) : hasDeptClaimed ? (
                    <p className="text-[11px] text-slate-500 italic">
                      Action initiated by nodal desk. Field team is deployed on site.
                    </p>
                  ) : null}

                  {/* Department User Controls: Claim or Advance Progress */}
                  {(isDeptUser || !hasDeptClaimed) && (
                    <div className="pt-1 flex items-center gap-2 flex-wrap">
                      {!hasDeptClaimed ? (
                        <button
                          onClick={() =>
                            onUpdateStatus(
                              report.id,
                              1,
                              `Acknowledged by ${userProfile.departmentDetails?.name || primaryDeptTag}. Action initiated.`
                            )
                          }
                          className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Take Official Action & Acknowledge Grievance</span>
                        </button>
                      ) : (
                        <div className="w-full flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="Add official progress update note..."
                            value={statusUpdateNotes[report.id] || ""}
                            onChange={(e) =>
                              setStatusUpdateNotes((prev) => ({
                                ...prev,
                                [report.id]: e.target.value,
                              }))
                            }
                            className="flex-1 text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              const nextLevel = Math.min(3, currentDeptLevel + 1);
                              onUpdateStatus(
                                report.id,
                                nextLevel,
                                statusUpdateNotes[report.id] || `Progress updated to stage ${nextLevel}.`
                              );
                              setStatusUpdateNotes((prev) => ({ ...prev, [report.id]: "" }));
                            }}
                            disabled={currentDeptLevel >= 3}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs shrink-0 cursor-pointer"
                          >
                            Advance Stage →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons Row (Twitter/X style) */}
              <div className="flex items-center justify-between pt-1 text-slate-500 text-xs border-t border-slate-100">
                {/* Reply */}
                <button
                  onClick={() =>
                    setActiveReplyBoxReportId(
                      activeReplyBoxReportId === report.id ? null : report.id
                    )
                  }
                  className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer group"
                >
                  <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="font-bold">{report.repliesCount || 0}</span>
                </button>

                {/* Re-Report / Amplify */}
                <button
                  onClick={() => onReReport(report.id)}
                  className={`flex items-center gap-1.5 transition-colors cursor-pointer group ${
                    isReReported ? "text-emerald-600 font-extrabold" : "hover:text-emerald-600"
                  }`}
                >
                  <Repeat2 className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                  <span className="font-bold">{report.reReportsCount || 0}</span>
                </button>

                {/* Like / Endorse */}
                <button
                  onClick={() => onLike(report.id)}
                  className={`flex items-center gap-1.5 transition-colors cursor-pointer group ${
                    isLiked ? "text-rose-600 font-extrabold" : "hover:text-rose-600"
                  }`}
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
                  className={`flex items-center gap-1.5 transition-colors cursor-pointer hover:text-blue-600 ${
                    isSaved ? "text-blue-600 font-extrabold" : ""
                  }`}
                >
                  <Bookmark
                    className={`w-4 h-4 ${isSaved ? "fill-blue-600 text-blue-600" : ""}`}
                  />
                </button>
              </div>

              {/* Top-Level Reply Input Box */}
              {activeReplyBoxReportId === report.id && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 animate-fadeIn">
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
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply(report.id);
                      }
                    }}
                    placeholder="Write a public comment or official response..."
                    className="flex-1 text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900"
                  />
                  <button
                    onClick={() => handleSendReply(report.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-extrabold transition-colors cursor-pointer"
                  >
                    Reply
                  </button>
                </div>
              )}

              {/* Threaded Replies Section */}
              {report.replies && report.replies.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={() =>
                      setExpandedRepliesReportId((prev) => ({
                        ...prev,
                        [report.id]: !areRepliesExpanded,
                      }))
                    }
                    className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1 cursor-pointer mb-2"
                  >
                    {areRepliesExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>Hide conversation ({report.replies.length})</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>Show conversation ({report.replies.length})</span>
                      </>
                    )}
                  </button>

                  {areRepliesExpanded && renderThreadedReplies(report.replies, report.id, 0)}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};
