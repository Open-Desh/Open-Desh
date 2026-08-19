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

  // Render recursive nested reply tree
  const renderThreadedReplies = (
    replies: ThreadedReply[],
    reportId: string,
    depth: number = 0
  ) => {
    return (
      <div className={`space-y-3 ${depth > 0 ? "ml-6 sm:ml-8 border-l-2 border-slate-200 pl-3 pt-2" : ""}`}>
        {replies.map((reply) => {
          const nestedInputKey = `${reportId}_${reply.id}`;
          const isReplyingToThis = activeNestedReplyId === reply.id;

          return (
            <div key={reply.id} className="space-y-1.5 text-xs">
              <div className="flex items-start gap-2.5">
                <img
                  src={reply.authorAvatar}
                  alt={reply.authorName}
                  className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200 cursor-pointer"
                  onClick={() => onSelectUser && onSelectUser(reply.authorId)}
                />
                <div className="flex-1 bg-slate-50 border border-slate-200/90 rounded-2xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        onClick={() => onSelectUser && onSelectUser(reply.authorId)}
                        className="font-extrabold text-slate-900 cursor-pointer hover:underline"
                      >
                        {reply.authorName}
                      </span>
                      {reply.authorBadge && (
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
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

                  <p className="text-slate-800 leading-relaxed font-normal">{reply.text}</p>

                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 font-bold">
                    <button
                      onClick={() =>
                        setActiveNestedReplyId(isReplyingToThis ? null : reply.id)
                      }
                      className="hover:text-blue-600 transition-colors"
                    >
                      Reply
                    </button>
                    {reply.isOfficialIntervention && (
                      <span className="text-amber-700 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Official Dept Note
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Nested Reply Box */}
              {isReplyingToThis && (
                <div className="ml-9 flex items-center gap-2 pt-1 animate-fadeIn">
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
                    placeholder={`Reply to @${reply.authorUsername}...`}
                    className="flex-1 text-xs py-1.5 px-3 bg-white border border-slate-300 rounded-full focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSendReply(reportId, reply.id)}
                    className="bg-blue-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-full hover:bg-blue-700"
                  >
                    Post
                  </button>
                </div>
              )}

              {/* Recursive child replies */}
              {reply.replies && reply.replies.length > 0 && (
                <div className="pt-1">
                  {renderThreadedReplies(reply.replies, reportId, depth + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-xl mx-auto pb-24 md:pb-12 animate-fadeIn bg-white border-x border-slate-200 min-h-screen">
      {/* Top Header Filter Bar (Twitter/X style) */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          id="post-report-header-trigger-btn"
          onClick={onOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-2xs transition-all flex items-center gap-1 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Post
        </button>
      </div>

      {/* Reports Feed Container */}
      <div className="divide-y divide-slate-200">
        {filteredReports.map((report) => {
          const isLiked = report.likedBy?.includes(userProfile.id);
          const isReReported = report.reReportedBy?.includes(userProfile.id);
          const isSaved = userProfile.savedReports?.includes(report.id);
          const isDeptUser = userProfile.category === "department";
          const hasDeptClaimed = Boolean(report.claimedByDept);
          const areRepliesExpanded = expandedRepliesReportId[report.id] || false;

          return (
            <article
              key={report.id}
              id={`report-card-${report.id}`}
              className="p-4 sm:p-5 hover:bg-slate-50/40 transition-colors space-y-3"
            >
              {/* Header: Author + GPS + Status Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <img
                    src={report.authorAvatar}
                    alt={report.authorName}
                    onClick={() => onSelectUser && onSelectUser(report.authorId)}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 cursor-pointer shadow-2xs"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3
                        onClick={() => onSelectUser && onSelectUser(report.authorId)}
                        className="text-sm font-extrabold text-slate-900 cursor-pointer hover:underline leading-none"
                      >
                        {report.authorName}
                      </h3>
                      {report.authorBadge && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-blue-50 text-blue-700">
                          {report.authorBadge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{report.location.city}</span>
                      <span>•</span>
                      <span>{report.timestamp}</span>
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${getStatusPill(
                    report.status
                  )}`}
                >
                  {report.status}
                </span>
              </div>

              {/* Text Description */}
              <p className="text-xs sm:text-sm text-slate-900 leading-relaxed font-normal">
                {report.text}
              </p>

              {/* Edge-to-Edge Media Image (Instagram/Twitter style 4:5 / 16:9 ratio) */}
              {report.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-80 bg-slate-900">
                  <img
                    src={report.imageUrl}
                    alt="Grievance Evidence"
                    className="w-full h-full object-cover max-h-80"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* AI Triage Information Banner */}
              {report.aiTriage && (
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-blue-600" /> AI Triage Routed: {report.aiTriage.departmentTag}
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

              {/* Department Official Claim / Action Lock Banner */}
              {hasDeptClaimed && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600" /> Claimed by {report.claimedByDept}
                    </span>
                    <span className="text-[10px] font-bold text-amber-800">{report.claimedAt}</span>
                  </div>
                  {report.departmentNotes && (
                    <p className="text-[11px] text-amber-900 font-medium">{report.departmentNotes}</p>
                  )}
                </div>
              )}

              {/* Department Official Status Control Bar (If user is department) */}
              {isDeptUser && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-blue-900 uppercase">
                      Department Resolution Control
                    </span>
                    <span className="text-[11px] font-bold text-blue-700">
                      Current: Level {report.departmentStatusLevel}/3
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { level: 0, label: "Open" },
                      { level: 1, label: "Under Review" },
                      { level: 2, label: "In Progress" },
                      { level: 3, label: "Resolved" },
                    ].map((step) => (
                      <button
                        key={step.level}
                        onClick={() =>
                          onUpdateStatus(
                            report.id,
                            step.level,
                            `Updated to ${step.label} by ${userProfile.fullName}`
                          )
                        }
                        className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all ${
                          report.departmentStatusLevel === step.level
                            ? "bg-blue-600 text-white shadow-2xs font-extrabold"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-blue-100/50"
                        }`}
                      >
                        {step.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Engagement Actions Bar (Twitter / X style: Reply, Re-report, Like, Bookmark, Share) */}
              <div className="flex items-center justify-between text-slate-600 text-xs font-semibold pt-1 border-t border-slate-100">
                {/* Reply */}
                <button
                  onClick={() =>
                    setActiveReplyBoxReportId(
                      activeReplyBoxReportId === report.id ? null : report.id
                    )
                  }
                  className="flex items-center gap-1.5 hover:text-blue-600 transition-colors p-1.5 rounded-full hover:bg-blue-50"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{report.repliesCount}</span>
                </button>

                {/* Re-report / Repost (X style) */}
                <button
                  onClick={() => onReReport(report.id)}
                  className={`flex items-center gap-1.5 transition-colors p-1.5 rounded-full hover:bg-emerald-50 ${
                    isReReported ? "text-emerald-600 font-extrabold" : "hover:text-emerald-600"
                  }`}
                >
                  <Repeat2 className="w-4 h-4" />
                  <span>{report.reReportsCount}</span>
                </button>

                {/* Like */}
                <button
                  onClick={() => onLike(report.id)}
                  className={`flex items-center gap-1.5 transition-colors p-1.5 rounded-full hover:bg-rose-50 ${
                    isLiked ? "text-rose-600 font-extrabold" : "hover:text-rose-600"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-600" : ""}`} />
                  <span>{report.likesCount}</span>
                </button>

                {/* Bookmark */}
                <button
                  onClick={() => onBookmark(report.id)}
                  className={`flex items-center gap-1.5 transition-colors p-1.5 rounded-full hover:bg-blue-50 ${
                    isSaved ? "text-blue-600" : "hover:text-blue-600"
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? "fill-blue-600 text-blue-600" : ""}`} />
                </button>

                {/* Share */}
                <button
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(window.location.href);
                      alert("Report share link copied to clipboard!");
                    }
                  }}
                  className="hover:text-slate-900 transition-colors p-1.5 rounded-full hover:bg-slate-100"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* Main Reply Box */}
              {activeReplyBoxReportId === report.id && (
                <div className="flex items-center gap-2 pt-2 animate-fadeIn">
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
                    placeholder={
                      isDeptUser
                        ? "Post official department acknowledgment or update..."
                        : "Post public reply or ground update..."
                    }
                    className="flex-1 text-xs py-2 px-3.5 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-900"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSendReply(report.id)}
                    disabled={!replyInputMap[report.id]?.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xs transition-all"
                  >
                    Reply
                  </button>
                </div>
              )}

              {/* Threaded Nested Replies Tree Container */}
              {report.replies && report.replies.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <button
                    onClick={() =>
                      setExpandedRepliesReportId((prev) => ({
                        ...prev,
                        [report.id]: !prev[report.id],
                      }))
                    }
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {areRepliesExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" /> Hide Conversation Thread (
                        {report.repliesCount})
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" /> View Conversation Thread (
                        {report.repliesCount})
                      </>
                    )}
                  </button>

                  {areRepliesExpanded && renderThreadedReplies(report.replies, report.id)}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};
