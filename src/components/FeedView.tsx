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
} from "lucide-react";
import { ReportIssue, UserProfile, IssueCategory } from "../types.ts";
import { CategoryVerifiedTick } from "./CategoryBadge.tsx";

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
  loading?: boolean;
}

export const FeedView: React.FC<FeedViewProps> = ({
  reports,
  userProfile,
  onLike,
  onReReport,
  onBookmark,
  onUpdateStatus,
  onOpenCreateModal,
  onSelectUser,
  onSelectPost,
  loading = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeImageSlideIndex, setActiveImageSlideIndex] = useState<Record<string, number>>({});
  const [statusUpdateNotes, setStatusUpdateNotes] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      {/* Category Horizontal Filter Pills - Edge-to-Edge Fluid Scrolling */}
      <div className="w-full bg-white border-b border-slate-100/90 sticky top-0 z-10 backdrop-blur-md bg-white/95">
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
                    src={report.authorAvatar}
                    alt={report.authorName}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectUser) onSelectUser(report.authorId);
                    }}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 cursor-pointer shadow-2xs shrink-0 hover:opacity-85"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectUser) onSelectUser(report.authorId);
                        }}
                        className="text-sm font-extrabold text-slate-900 cursor-pointer hover:underline truncate whitespace-nowrap max-w-[140px] sm:max-w-[220px] md:max-w-[300px] flex items-center gap-1"
                        title={report.authorName}
                      >
                        <span>{report.authorName}</span>
                        {(report.authorBadge || report.authorCategory) && (
                          <CategoryVerifiedTick
                            category={report.authorCategory}
                            size="xs"
                          />
                        )}
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

              {/* Cloudflare R2 Multi-Image Carousel */}
              {imageList.length > 0 && (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center group my-1">
                  <img
                    src={imageList[currentSlide]}
                    alt={`Evidence ${currentSlide + 1}`}
                    className="w-full max-h-96 object-contain rounded-2xl"
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

              {/* Official Department Action Progress Card */}
              {(hasDeptClaimed || isDeptUser) && (
                <div className="bg-slate-50/90 border border-blue-200/80 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
                        Action Card: {report.claimedByDept || primaryDeptTag}
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
                </div>
              )}

              {/* Action Buttons Row (Twitter/X style) */}
              <div className="flex items-center justify-between pt-1 text-slate-500 text-xs border-t border-slate-100">
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

                {/* Like / Endorse */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike(report.id);
                  }}
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
        })}
      </div>
    </div>
  );
};
