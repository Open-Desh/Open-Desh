import React, { useState } from "react";
import {
  X,
  MoreVertical,
  Pin,
  Trash2,
  AlertTriangle,
  Copy,
  Check,
  Share2,
  ShieldAlert,
  VolumeX,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Send,
  Flag,
  FileQuestion,
  UserX,
  DollarSign,
  MapPinOff,
  MessageSquareWarning,
  Ban,
  Megaphone,
  EyeOff,
  Flame,
  Copyright,
  FileText,
  Volume2,
} from "lucide-react";
import { ReportIssue, UserProfile } from "../types.ts";
import { cleanReportText, getCleanAuthorUsername } from "../utils/reportUtils.ts";
import { submitContentFlagInFirestore } from "../lib/firestoreSync.ts";

export interface PostActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReportIssue | null;
  userProfile: UserProfile;
  isProfileView?: boolean;
  onDeleteReport?: (reportId: string) => Promise<void>;
  onTogglePinReport?: (reportId: string, isCurrentlyPinned?: boolean) => Promise<void>;
  onMuteUser?: (authorUsername: string, authorId?: string) => void;
  isAuthorMuted?: boolean;
}

export type ModerationCategoryKey =
  | "false_grievance"
  | "defamation"
  | "blackmail"
  | "wrong_location"
  | "harassment"
  | "hate_speech"
  | "spam"
  | "nudity"
  | "violence"
  | "ip_violation"
  | "something_else";

interface CategoryOption {
  key: ModerationCategoryKey;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  subCategories?: string[];
  isCustomText?: boolean;
}

const MODERATION_CATEGORIES: CategoryOption[] = [
  {
    key: "false_grievance",
    title: "False or Outdated Grievance",
    subtitle: "Fabricated issues, fake complaints, or recycled old photos/videos",
    icon: FileQuestion,
    subCategories: [
      "This incident never happened",
      "Old photo/video used for a current issue",
    ],
  },
  {
    key: "defamation",
    title: "Defamation or Personal Vendetta",
    subtitle: "Targeting public officials, officers, or private citizens unjustly",
    icon: UserX,
    subCategories: [
      "Targeting a public servant or officer",
      "Targeting a private individual",
    ],
  },
  {
    key: "blackmail",
    title: "Blackmail or Extortion",
    subtitle: "Demanding money or coercive pressure to take down grievance post",
    icon: DollarSign,
    subCategories: [
      "Demanding money to take down post",
      "Threatening or forcing someone",
    ],
  },
  {
    key: "wrong_location",
    title: "Wrong or Misleading Location",
    subtitle: "Event from another jurisdiction, false city, or incorrect GPS tag",
    icon: MapPinOff,
    subCategories: [
      "Event is from another city/state",
      "Incorrect GPS/Map tag",
    ],
  },
  {
    key: "harassment",
    title: "Abusive Language or Harassment",
    subtitle: "Direct harassment, hostile slurs, bullying, or intimidation",
    icon: MessageSquareWarning,
    subCategories: [
      "It's harassing me",
      "It's harassing someone else",
    ],
  },
  {
    key: "hate_speech",
    title: "Hate Speech",
    subtitle: "Caste, religious, gender, or communal discrimination",
    icon: Ban,
    subCategories: [
      "Caste or community discrimination",
      "Religious hate speech",
    ],
  },
  {
    key: "spam",
    title: "Spam or Promotional Content",
    subtitle: "Commercial advertisement, promotional links, fraud, or fake scams",
    icon: Megaphone,
    subCategories: [
      "Irrelevant commercial advertisement",
      "Scam, fraud, or fake links",
    ],
  },
  {
    key: "nudity",
    title: "Nudity or Sexual Content",
    subtitle: "Inappropriate sexual imagery, nudity, or sexual exploitation",
    icon: EyeOff,
    subCategories: [
      "Nudity or pornography",
      "Sexual violence or exploitation",
    ],
  },
  {
    key: "violence",
    title: "Violence or Graphic Content",
    subtitle: "Bloodshed, extreme physical violence, or animal cruelty",
    icon: Flame,
    subCategories: [
      "Graphic violence or blood",
      "Animal cruelty",
    ],
  },
  {
    key: "ip_violation",
    title: "Intellectual Property Violation",
    subtitle: "Copyright violation or stolen personal media used without permission",
    icon: Copyright,
    subCategories: [
      "Copyright violation (My content used without permission)",
    ],
  },
  {
    key: "something_else",
    title: "Something Else (Write Details)",
    subtitle: "Describe other policy or legal issues not covered above",
    icon: FileText,
    isCustomText: true,
  },
];

export const PostActionSheet: React.FC<PostActionSheetProps> = ({
  isOpen,
  onClose,
  report,
  userProfile,
  isProfileView = false,
  onDeleteReport,
  onTogglePinReport,
  onMuteUser,
  isAuthorMuted = false,
}) => {
  // Navigation states: 'main' | 'confirm_delete' | 'report_page1' | 'report_page2' | 'report_page3'
  const [currentStep, setCurrentStep] = useState<
    "main" | "confirm_delete" | "report_page1" | "report_page2" | "report_page3"
  >("main");
  const [selectedCategory, setSelectedCategory] = useState<CategoryOption | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [customDetailText, setCustomDetailText] = useState<string>("");
  const [isSubmittingFlag, setIsSubmittingFlag] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [mutedLocally, setMutedLocally] = useState(isAuthorMuted);

  if (!isOpen || !report) return null;

  // Check if current user is the owner/author of the report
  const rawAuthorId = report.authorId?.trim().toLowerCase() || "";
  const rawAuthorUsername = report.authorUsername?.replace(/^@/, "").trim().toLowerCase() || "";
  const currentUserId = userProfile.id?.trim().toLowerCase() || "";
  const currentUsername = userProfile.username?.replace(/^@/, "").trim().toLowerCase() || "";
  const currentFullName = userProfile.fullName?.trim().toLowerCase() || "";

  const isOwner =
    (currentUserId && (rawAuthorId === currentUserId || rawAuthorId === `user_${currentUserId}`)) ||
    (currentUsername && rawAuthorUsername === currentUsername) ||
    (currentFullName && report.authorName && report.authorName.toLowerCase() === currentFullName);

  const cleanAuthorHandle = getCleanAuthorUsername(report.authorUsername, report.authorName);

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/post/${report.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(postUrl);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/post/${report.id}`;
    if (navigator.share) {
      navigator.share({
        title: `Open Desh Grievance #${report.id}`,
        text: cleanReportText(report.text),
        url: postUrl,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  const handleSelectPage1Category = (category: CategoryOption) => {
    setSelectedCategory(category);
    setSelectedSubCategory("");
    setCustomDetailText("");
    setCurrentStep("report_page2");
  };

  const handleSelectSubCategory = async (subCategoryText: string) => {
    if (!selectedCategory) return;
    setSelectedSubCategory(subCategoryText);
    setIsSubmittingFlag(true);

    const flagData = {
      reportId: report.id,
      reportText: report.text,
      authorId: report.authorId,
      authorUsername: report.authorUsername || report.authorName,
      reportedByUserId: userProfile.id,
      reportedByUsername: userProfile.username || userProfile.fullName,
      categoryKey: selectedCategory.key,
      categoryTitle: selectedCategory.title,
      subCategory: subCategoryText,
      customDetails: "",
      createdAt: new Date().toISOString(),
    };

    try {
      await submitContentFlagInFirestore(flagData);
    } catch (e) {
      console.warn("Flag sync notice:", e);
    } finally {
      setIsSubmittingFlag(false);
      setCurrentStep("report_page3");
    }
  };

  const handleCustomDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDetailText.trim() || !selectedCategory) return;
    setIsSubmittingFlag(true);

    const flagData = {
      reportId: report.id,
      reportText: report.text,
      authorId: report.authorId,
      authorUsername: report.authorUsername || report.authorName,
      reportedByUserId: userProfile.id,
      reportedByUsername: userProfile.username || userProfile.fullName,
      categoryKey: selectedCategory.key,
      categoryTitle: selectedCategory.title,
      subCategory: "Custom Details Provided",
      customDetails: customDetailText.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      await submitContentFlagInFirestore(flagData);
    } catch (e) {
      console.warn("Flag sync notice:", e);
    } finally {
      setIsSubmittingFlag(false);
      setCurrentStep("report_page3");
    }
  };

  const handleMuteAction = () => {
    if (onMuteUser) {
      onMuteUser(cleanAuthorHandle, report.authorId);
      setMutedLocally(!mutedLocally);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!onDeleteReport) return;
    setIsDeleting(true);
    try {
      await onDeleteReport(report.id);
      onClose();
    } catch (e) {
      console.error("Delete error:", e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePinAction = async () => {
    if (!onTogglePinReport) return;
    try {
      await onTogglePinReport(report.id, report.isPinned);
      onClose();
    } catch (e) {
      console.error("Pin toggle error:", e);
    }
  };

  return (
    <div
      id="post-action-sheet-backdrop"
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex flex-col justify-end animate-fade-in"
    >
      <div
        id="post-action-sheet-container"
        onClick={(e) => e.stopPropagation()}
        className="bg-white border-t border-slate-200 rounded-t-3xl sm:rounded-t-3xl shadow-2xl p-4 sm:p-6 max-w-lg w-full mx-auto max-h-[88vh] flex flex-col animate-slide-up overflow-hidden"
      >
        {/* Top Drag Handle Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto -mt-1 mb-3 shrink-0" />

        {/* ========================================================================= */}
        {/* 1. ROOT VIEW (OPTIONS LIST)                                               */}
        {/* ========================================================================= */}
        {currentStep === "main" && (
          <div className="space-y-3.5 flex-1 overflow-y-auto">
            {/* Post Summary Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                    {report.category}
                  </span>
                  <span className="text-xs text-slate-400 font-medium truncate">
                    by @{cleanAuthorHandle}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium line-clamp-2 leading-relaxed">
                  "{cleanReportText(report.text)}"
                </p>
              </div>

              <button
                id="post-action-sheet-close-btn"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions List */}
            <div className="space-y-2 pt-1">
              {/* OWNER ACTIONS: Pin & Delete */}
              {isOwner ? (
                <>
                  {/* Pin / Unpin (Shown on Profile View) */}
                  {isProfileView && onTogglePinReport && (
                    <button
                      id="action-pin-report-btn"
                      onClick={handleTogglePinAction}
                      className="w-full p-3.5 bg-slate-50 hover:bg-blue-50/80 rounded-2xl flex items-center gap-3.5 transition-all text-left group cursor-pointer border border-slate-200/80 hover:border-blue-200"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Pin
                          className={`w-5 h-5 ${
                            report.isPinned ? "fill-blue-600 rotate-0" : "rotate-45"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {report.isPinned
                            ? "Unpin Report from Profile"
                            : "Pin Report to Profile"}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">
                          {report.isPinned
                            ? "Remove this report from top position"
                            : "Feature this grievance at the very top of your profile"}
                        </p>
                      </div>
                    </button>
                  )}

                  {/* Delete Report */}
                  {onDeleteReport && (
                    <button
                      id="action-delete-report-btn"
                      onClick={() => setCurrentStep("confirm_delete")}
                      className="w-full p-3.5 bg-slate-50 hover:bg-rose-50/80 rounded-2xl flex items-center gap-3.5 transition-all text-left group cursor-pointer border border-slate-200/80 hover:border-rose-200"
                    >
                      <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-extrabold text-rose-600">
                          Delete Post
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">
                          Permanently remove this grievance and all official updates
                        </p>
                      </div>
                    </button>
                  )}
                </>
              ) : (
                /* NON-OWNER ACTIONS: Report Violation & Mute */
                <>
                  {/* Report Violation / Flag Content Button */}
                  <button
                    id="action-report-violation-btn"
                    onClick={() => setCurrentStep("report_page1")}
                    className="w-full p-3.5 bg-rose-50/70 hover:bg-rose-100/70 rounded-2xl flex items-center gap-3.5 transition-all text-left group cursor-pointer border border-rose-200/80 hover:border-rose-300"
                  >
                    <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-rose-950">
                          Report Violation
                        </h4>
                        <span className="text-[9px] bg-rose-600 text-white font-black px-1.5 py-0.2 rounded uppercase">
                          Moderation
                        </span>
                      </div>
                      <p className="text-xs text-rose-800/80 font-medium">
                        Flag false complaints, hate speech, defamation, or scams
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-rose-400 group-hover:text-rose-700 transition-colors shrink-0" />
                  </button>

                  {/* Mute User Button */}
                  {onMuteUser && (
                    <button
                      id="action-mute-user-btn"
                      onClick={handleMuteAction}
                      className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center gap-3.5 transition-all text-left group cursor-pointer border border-slate-200/80"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        {mutedLocally ? (
                          <Volume2 className="w-5 h-5 text-blue-600" />
                        ) : (
                          <VolumeX className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-extrabold text-slate-900">
                          {mutedLocally ? `Unmute @${cleanAuthorHandle}` : `Mute @${cleanAuthorHandle}`}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">
                          {mutedLocally
                            ? "Allow posts from this citizen in your feed"
                            : "Hide all future posts and grievances from this author"}
                        </p>
                      </div>
                    </button>
                  )}
                </>
              )}

              {/* Common Actions: Copy Link & Share */}
              <button
                id="action-copy-link-btn"
                onClick={handleCopyLink}
                className="w-full p-3.5 bg-slate-50 hover:bg-blue-50/80 rounded-2xl flex items-center gap-3.5 transition-all text-left group cursor-pointer border border-slate-200/80 hover:border-blue-200"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {copiedLink ? (
                    <Check className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors flex items-center gap-2">
                    <span>{copiedLink ? "Link Copied to Clipboard!" : "Copy Post Link"}</span>
                    {copiedLink && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Copied
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium truncate">
                    {window.location.origin}/post/{report.id}
                  </p>
                </div>
              </button>

              <button
                id="action-share-apps-btn"
                onClick={handleShare}
                className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center gap-3.5 transition-all text-left group cursor-pointer border border-slate-200/80"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Share2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Share Post
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Share to WhatsApp, Twitter/X, Telegram or other apps
                  </p>
                </div>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full py-3 text-center text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors cursor-pointer mt-2"
            >
              Close
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. CONFIRM PERMANENT DELETE                                               */}
        {/* ========================================================================= */}
        {currentStep === "confirm_delete" && (
          <div className="space-y-4 p-2 animate-fade-in flex-1 overflow-y-auto">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Confirm Permanent Deletion?
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1.5 leading-relaxed font-medium">
              <p>
                Are you sure you want to delete this grievance post? All comments,
                official status updates, and public endorsements will be erased permanently from the system.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep("main")}
                disabled={isDeleting}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                disabled={isDeleting}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete Post"}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. PAGE 1: MAIN REPORT VIOLATION MENU (11 CATEGORIES)                     */}
        {/* ========================================================================= */}
        {currentStep === "report_page1" && (
          <div className="space-y-3 flex-1 flex flex-col overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStep("main")}
                  className="p-1 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Report Violation
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Why are you reporting this post?
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Options List */}
            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
              {MODERATION_CATEGORIES.map((cat, idx) => {
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.key}
                    id={`mod-cat-option-${idx + 1}`}
                    onClick={() => handleSelectPage1Category(cat)}
                    className="w-full p-3 bg-slate-50 hover:bg-blue-50/80 rounded-2xl flex items-center gap-3 transition-all text-left group cursor-pointer border border-slate-200/70 hover:border-blue-200"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {cat.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium truncate">
                        {cat.subtitle}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. PAGE 2: SUB-CATEGORIES OR CUSTOM DETAIL INPUT                         */}
        {/* ========================================================================= */}
        {currentStep === "report_page2" && selectedCategory && (
          <div className="space-y-3.5 flex-1 flex flex-col overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStep("report_page1")}
                  className="p-1 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                    {selectedCategory.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Select a specific reason to help us investigate:
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content: Sub-category buttons or Custom text box */}
            <div className="flex-1 overflow-y-auto space-y-2.5">
              {selectedCategory.isCustomText ? (
                /* OPTION 11: Text Input Box */
                <form onSubmit={handleCustomDetailsSubmit} className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-700">
                      Describe the violation in detail *
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={customDetailText}
                      onChange={(e) => setCustomDetailText(e.target.value)}
                      placeholder="Please describe the issue in detail..."
                      className="w-full p-3 rounded-2xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium resize-none leading-relaxed"
                    />
                    <p className="text-[11px] text-slate-400 text-right">
                      {customDetailText.length}/500 characters
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={!customDetailText.trim() || isSubmittingFlag}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingFlag ? (
                      <span>Submitting Report...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Violation Report</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* OPTIONS 1 TO 10: Sub-category option items */
                <div className="space-y-2 pt-1">
                  {selectedCategory.subCategories?.map((sub, sIdx) => (
                    <button
                      key={sIdx}
                      id={`mod-subcat-option-${sIdx + 1}`}
                      onClick={() => handleSelectSubCategory(sub)}
                      disabled={isSubmittingFlag}
                      className="w-full p-4 bg-slate-50 hover:bg-blue-50/90 rounded-2xl flex items-center justify-between gap-3 text-left group cursor-pointer border border-slate-200 hover:border-blue-300 transition-all"
                    >
                      <div className="flex-1">
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                          {sub}
                        </h4>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. PAGE 3: FINAL CONFIRMATION SCREEN                                      */}
        {/* ========================================================================= */}
        {currentStep === "report_page3" && (
          <div className="space-y-4 py-2 animate-fade-in flex-1 overflow-y-auto text-center">
            {/* Success Tick */}
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Thank you for letting us know
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                Our moderation team will review this post shortly to keep the community transparent and safe.
              </p>
            </div>

            {/* Report Summary Pill */}
            {selectedCategory && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-1 max-w-sm mx-auto">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-700">Flagged Reason:</span>
                  <span className="font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px] uppercase">
                    {selectedCategory.title}
                  </span>
                </div>
                {selectedSubCategory && (
                  <p className="text-slate-600 font-medium text-[11px]">
                    "{selectedSubCategory}"
                  </p>
                )}
                {customDetailText && (
                  <p className="text-slate-600 font-medium text-[11px] line-clamp-2">
                    "{customDetailText}"
                  </p>
                )}
              </div>
            )}

            {/* Bottom Actions: Mute User & Done */}
            <div className="space-y-2 pt-2 max-w-sm mx-auto">
              <button
                id="mod-done-mute-user-btn"
                onClick={handleMuteAction}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-black rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {mutedLocally ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Muted @{cleanAuthorHandle} ✓</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-slate-600" />
                    <span>Mute this User</span>
                  </>
                )}
              </button>

              <button
                id="mod-done-finish-btn"
                onClick={onClose}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
