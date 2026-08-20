import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Bell,
  Heart,
  Repeat2,
  MessageCircle,
  Bookmark,
  Share2,
  MapPin,
  ShieldCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
  Flame,
  AtSign,
  CheckCircle2,
  CheckCheck,
  Trash2,
} from "lucide-react";
import { AppNotification, ReportIssue, UserProfile } from "../types.ts";
import { CategoryVerifiedTick } from "./CategoryBadge.tsx";

interface NotificationsViewProps {
  notifications: AppNotification[];
  reports?: ReportIssue[];
  userProfile: UserProfile;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectPost?: (postId: string) => void;
  onSelectUser?: (userId: string) => void;
  onLikeReport?: (id: string) => Promise<void>;
  onReReport?: (id: string) => Promise<void>;
  onBookmark?: (id: string) => Promise<void>;
  onBack?: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  reports = [],
  userProfile,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSelectPost,
  onSelectUser,
  onLikeReport,
  onReReport,
  onBookmark,
  onBack,
}) => {
  // 1-2 second initial highlight effect when the notification page opens
  const [isInitialHighlight, setIsInitialHighlight] = useState(true);
  const [activeImageSlideIndex, setActiveImageSlideIndex] = useState<Record<string, number>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialHighlight(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

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
      navigator
        .share({
          title: `Open Desh - Grievance #${report.id}`,
          text: report.text,
          url: shareUrl,
        })
        .catch(() => {});
      return;
    }
    navigator.clipboard?.writeText(shareUrl);
    setCopiedId(report.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Find corresponding Report object
  const findTargetReport = (notif: AppNotification): ReportIssue => {
    const found = reports.find((r) => r.id === notif.targetReportId);
    if (found) return found;

    // Fallback constructed report item matching user's own report format
    return {
      id: notif.targetReportId || notif.id,
      authorId: userProfile.id,
      authorName: userProfile.fullName,
      authorUsername: userProfile.username,
      authorAvatar: userProfile.avatarUrl,
      authorCategory: userProfile.category,
      category: (notif.metadata?.category as any) || "Infrastructure",
      text: notif.title || notif.message || "Civic Report Issue",
      location: {
        city: "Jharkhand, India",
        lat: 23.3441,
        lng: 85.3096,
      },
      status: "Open",
      departmentStatusLevel: 0,
      timestamp: notif.timestamp || "Recent",
      likesCount: 1,
      reReportsCount: 0,
      repliesCount: 0,
    };
  };

  return (
    <div className="max-w-xl mx-auto pb-24 md:pb-12 animate-fadeIn bg-white border-x border-slate-200 min-h-screen">
      {/* 1. Header: Back button + Icon + Title (Same as Connect page) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="alerts-back-btn"
            onClick={onBack}
            className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h1 className="text-base font-black text-slate-900 tracking-tight leading-none">
              Alerts
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
              title="Mark all read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mark all read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Clear all alerts"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* 2. Notifications Feed - EXACT Same Report Card Layout as Home Feed */}
      <div className="divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6 stroke-[1.5]" />
            </div>
            <p className="text-sm font-bold text-slate-800">No alerts yet</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Reports that get liked, re-reported, or replied to will appear here in the live feed.
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const report = findTargetReport(notif);
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

            const primaryDeptTag =
              report.taggedOfficers?.[0] || report.aiTriage?.departmentTag || "@MunicipalCorp";
            const currentDeptLevel = report.departmentStatusLevel ?? (hasDeptClaimed ? 1 : 0);

            // Interaction context pill text (e.g. Liked by, Re-reported by, Replied by)
            const interactionType = notif.type;
            const isLikeType = interactionType === "like";
            const isReReportType = interactionType === "rereport";

            return (
              <article
                key={notif.id}
                id={`notification-report-${notif.id}`}
                onClick={() => {
                  if (!notif.read) onMarkAsRead(notif.id);
                  if (onSelectPost) onSelectPost(report.id);
                }}
                className={`p-4 sm:p-5 transition-all duration-300 space-y-3 cursor-pointer select-none group/card relative ${
                  isInitialHighlight
                    ? "bg-blue-50/70 ring-1 ring-blue-300/60 shadow-xs"
                    : !notif.read
                    ? "bg-blue-50/20 hover:bg-slate-50/80"
                    : "hover:bg-slate-50/70"
                }`}
              >
                {/* Unread Indicator Bar */}
                {!notif.read && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r" />
                )}

                {/* Header: Author + Location/Time + Status Badge (Identical to Home Feed) */}
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

                {/* Structured Details Badge Bar */}
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

                {/* Multi-Image Carousel */}
                {imageList.length > 0 && (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center group my-1">
                    <img
                      src={imageList[currentSlide]}
                      alt={`Evidence ${currentSlide + 1}`}
                      className="w-full max-h-96 object-contain rounded-2xl"
                      referrerPolicy="no-referrer"
                    />

                    {imageList.length > 1 && (
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                        {currentSlide + 1} / {imageList.length} Evidence
                      </div>
                    )}

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

                {/* Action Buttons Row (Identical to Home Feed) */}
                <div className="flex items-center justify-between pt-1 text-slate-500 text-xs border-t border-slate-100">
                  {/* Reply Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectPost) onSelectPost(report.id);
                    }}
                    className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer group"
                  >
                    <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="font-bold">{report.replies?.length || report.repliesCount || 0}</span>
                  </button>

                  {/* Re-Report */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onReReport) onReReport(report.id);
                    }}
                    className={`flex items-center gap-1.5 transition-colors cursor-pointer group ${
                      isReReported ? "text-emerald-600 font-extrabold" : "hover:text-emerald-600"
                    }`}
                  >
                    <Repeat2 className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                    <span className="font-bold">{report.reReportsCount || 0}</span>
                  </button>

                  {/* Like */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onLikeReport) onLikeReport(report.id);
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
                      if (onBookmark) onBookmark(report.id);
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
          })
        )}
      </div>
    </div>
  );
};
