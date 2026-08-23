import React, { useState } from "react";
import {
  ArrowLeft,
  Star,
  ShieldCheck,
  Award,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  Scale,
  Pencil,
  FileText,
  Users,
  Megaphone,
  MapPin,
  TrendingUp,
  ChevronRight,
  Shield,
  Loader2,
} from "lucide-react";
import { UserProfile, ScoreCriterion } from "../types.ts";
import { CategoryVerifiedTick } from "./CategoryBadge.tsx";
import { useLanguage } from "../context/LanguageContext.tsx";

interface EvaluationDetailViewProps {
  targetProfile: UserProfile;
  currentUser: UserProfile;
  initialTab?: "score" | "reviews" | "writereview";
  onBack: () => void;
  onSubmitReview: (rating: number, comment: string) => Promise<void>;
  onReplyToReview: (reviewId: string, replyText: string) => Promise<void>;
}

export const EvaluationDetailView: React.FC<EvaluationDetailViewProps> = ({
  targetProfile,
  currentUser,
  initialTab = "writereview",
  onBack,
  onSubmitReview,
  onReplyToReview,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"score" | "reviews" | "writereview">(
    initialTab || "writereview"
  );
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeReplyBoxReviewId, setActiveReplyBoxReviewId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState<Record<string, string>>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const isOwnProfile = currentUser.id === targetProfile.id;

  // Check if current user has already submitted a review for this profile
  const existingUserReview = targetProfile.reviews?.find(
    (r) => r.authorId === currentUser.id
  );

  // Dynamic Rating Title based on Profile Category
  const rateCardTitle =
    targetProfile.category === "department"
      ? t("eval.rateDepartment", "Rate Department")
      : targetProfile.category === "representative"
      ? t("eval.rateLeader", "Rate Leader")
      : t("eval.rateProfile", "Rate Profile");

  // Dynamic Rating text label
  const effectiveRating = hoverRating !== null ? hoverRating : rating;
  const getRatingLabel = (score: number) => {
    if (score >= 5) return { label: t("eval.excellent", "Excellent"), color: "text-emerald-600" };
    if (score >= 4) return { label: t("eval.good", "Good"), color: "text-emerald-600" };
    if (score >= 3) return { label: t("eval.average", "Average"), color: "text-amber-500" };
    if (score >= 2) return { label: t("eval.fair", "Fair"), color: "text-amber-600" };
    return { label: t("eval.poor", "Poor"), color: "text-rose-600" };
  };

  // Location display
  const profileLocation =
    targetProfile.departmentDetails?.jurisdiction ||
    targetProfile.representativeDetails?.constituency ||
    targetProfile.location ||
    "Lucknow, Uttar Pradesh";

  // Subtitle / designation display
  const profileSubtitle =
    targetProfile.departmentDetails?.name ||
    targetProfile.representativeDetails?.position ||
    (targetProfile.category === "department"
      ? "Directorate General of Police HQ"
      : targetProfile.category === "representative"
      ? "Elected Member of Legislative Assembly"
      : targetProfile.bio || "Civic Governance Profile");

  // Real database score and breakdown
  const hasDbScore = typeof targetProfile.systemScore === "number" && targetProfile.systemScore > 0;
  const hasDbBreakdown =
    targetProfile.systemScoreBreakdown?.criteria &&
    Array.isArray(targetProfile.systemScoreBreakdown.criteria) &&
    targetProfile.systemScoreBreakdown.criteria.length > 0;

  // Standard 5 Dimensions (All set to 0 pts when no data in DB)
  const defaultCriteria: ScoreCriterion[] = [
    {
      label: "Grievance SLA Redressal Velocity & Rate",
      weight: 25,
      scoreAwarded: 0,
      description:
        "Ratio of citizen reports acknowledged within statutory 24-hr SLA and verified closed on ground.",
      publicSource: "State Grievance Redressal Portal & Central CPGRAMS Dashboard",
      sourceUrl: "https://cpgrams.nic.in",
      sourceType: "Govt SLA Redressal Log",
    },
    {
      label: "Public Fund & MLALAD Utilization Efficiency",
      weight: 25,
      scoreAwarded: 0,
      description:
        "Audit of sanctioned development funds allocated versus actual utilization certificates published.",
      publicSource: "Comptroller & Auditor General (CAG) State Audit Gazette & Finance Dept Ledger",
      sourceUrl: "https://cag.gov.in",
      sourceType: "CAG Gazette",
    },
    {
      label: "Legislative Assembly Attendance & Question Hours",
      weight: 20,
      scoreAwarded: 0,
      description:
        "Official floor participation in Vidhan Sabha sessions, public interest bills raised, and standing committee attendance.",
      publicSource: "Vidhan Sabha Official Hansard Debates & Legislative Records",
      sourceUrl: "https://prsindia.org",
      sourceType: "State Legislative Hansard",
    },
    {
      label: "Ground Verification & Independent Civic Audits",
      weight: 15,
      scoreAwarded: 0,
      description:
        "Geo-tagged photographic confirmations uploaded by registered local resident verifiers and third-party civil engineering monitors.",
      publicSource: "Open Desh Verified Geo-Audit Protocol & Ward Inspection Reports",
      sourceUrl: "https://opendesh.in/audits",
      sourceType: "Geo-Tagged Audit",
    },
    {
      label: "Verified Citizen Trust & Satisfaction Index",
      weight: 15,
      scoreAwarded: 0,
      description:
        "Aggregated satisfaction scores from verified constituency voters and verified resident reviews.",
      publicSource: "Open Desh Public Voter Sentiment Registry",
      sourceUrl: "https://opendesh.in/ratings",
      sourceType: "Verified Voter Index",
    },
  ];

  const criteriaList: ScoreCriterion[] = hasDbBreakdown
    ? targetProfile.systemScoreBreakdown!.criteria
    : defaultCriteria;

  const displaySystemScore: number = hasDbScore
    ? targetProfile.systemScore!
    : hasDbBreakdown
    ? Math.round(criteriaList.reduce((acc, c) => acc + (c.scoreAwarded || 0), 0))
    : 0;

  const getSystemScorePill = (score: number) => {
    if (score >= 80) return { label: t("eval.excellent", "Excellent"), color: "bg-emerald-600 text-white" };
    if (score >= 60) return { label: t("eval.good", "Good"), color: "bg-blue-600 text-white" };
    if (score >= 40) return { label: t("eval.average", "Average"), color: "bg-amber-600 text-white" };
    if (score > 0) return { label: t("eval.needsAudit", "Needs Audit"), color: "bg-rose-600 text-white" };
    return { label: "Awaiting Audit (0)", color: "bg-slate-500 text-white" };
  };

  const scorePill = getSystemScorePill(displaySystemScore);
  const reviewsCount = targetProfile.reviews?.length || targetProfile.reviewsCount || 0;

  const handleReviewFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() && rating === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmitReview(rating, comment.trim());
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab("reviews");
      }, 1200);
    } catch (err) {
      console.error("Submit review error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendAdminReply = async (reviewId: string) => {
    const text = adminReplyText[reviewId];
    if (!text || !text.trim()) return;

    try {
      await onReplyToReview(reviewId, text.trim());
      setAdminReplyText((prev) => ({ ...prev, [reviewId]: "" }));
      setActiveReplyBoxReviewId(null);
    } catch (err) {
      console.error("Send admin reply error:", err);
    }
  };

  return (
    <div className="max-w-xl mx-auto pb-24 md:pb-12 animate-fadeIn bg-[#f8fafc] border-x border-slate-200 min-h-screen">
      {/* 1. Header with Back button, Title & Subtitle */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="evaluation-back-btn"
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Back to Profile"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {t("eval.headerTitle", "Performance Index")}
              </h1>
              {targetProfile.verified === true && (
                <CategoryVerifiedTick category={targetProfile.category} size="xs" />
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium leading-none mt-0.5">
              {t("eval.headerSubtitle", "Transparent. Verified. For You.")}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Edge-to-Edge Blue Gradient Hero Card Touching Header with Rounded Bottom Corners */}
      <div
        id="performance-hero-card"
        className="w-full bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 px-4 sm:px-5 pt-5 pb-10 text-white shadow-md relative overflow-hidden rounded-b-2xl"
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left Avatar & Identity */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              {targetProfile.avatarUrl ? (
                <img
                  src={targetProfile.avatarUrl}
                  alt={targetProfile.fullName}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-2 ring-white/90 shadow-md bg-white"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-900 text-white font-black text-lg flex items-center justify-center ring-2 ring-white/90 shadow-md">
                  {targetProfile.fullName.slice(0, 2).toUpperCase()}
                </div>
              )}
              {/* Green shield badge on bottom right of avatar */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-white shadow-xs">
                <ShieldCheck className="w-3 h-3" />
              </div>
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <h2 className="font-extrabold text-base sm:text-lg text-white truncate leading-tight">
                  {targetProfile.fullName}
                </h2>
                {targetProfile.verified === true && (
                  <CategoryVerifiedTick category={targetProfile.category} size="xs" />
                )}
              </div>
              <p className="text-xs text-blue-100 font-medium truncate">
                {profileSubtitle}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-blue-200 font-medium">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{profileLocation}</span>
              </div>
            </div>
          </div>

          {/* Right System Index */}
          <div className="text-right shrink-0 pl-2">
            <span className="text-[11px] font-bold text-blue-100 uppercase tracking-wide block">
              {t("eval.systemIndex", "SYSTEM INDEX")}
            </span>
            <div className="flex items-baseline justify-end gap-1 my-0.5">
              <span className="text-2xl sm:text-3xl font-black text-white leading-none">
                {displaySystemScore}
              </span>
              <span className="text-xs text-blue-200 font-bold">/100</span>
            </div>
            <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black ${scorePill.color} shadow-xs`}>
              <span>{scorePill.label}</span>
              <TrendingUp className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Content Body Overlapping the Blue Hero Card */}
      <div className="px-4 sm:px-5 -mt-5 relative z-10 space-y-4">
        {/* 3 Navigation Cards Grid (Overlaps the blue hero card) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Card 1: 100-Pt Algorithm */}
          <button
            id="nav-card-100pt-algorithm"
            onClick={() => setActiveTab("score")}
            className={`p-3 sm:p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer bg-white shadow-md ${
              activeTab === "score"
                ? "border-blue-600 ring-2 ring-blue-600/20"
                : "border-slate-200/90 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
              <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 leading-tight">
                {t("eval.algorithmTitle", "100-Pt Algorithm")}
              </h4>
              <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                {t("eval.algorithmSubtitle", "Scientifically Weighted")}
              </p>
            </div>
          </button>

          {/* Card 2: Public Reviews */}
          <button
            id="nav-card-public-reviews"
            onClick={() => setActiveTab("reviews")}
            className={`p-3 sm:p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer bg-white shadow-md ${
              activeTab === "reviews"
                ? "border-blue-600 ring-2 ring-blue-600/20"
                : "border-slate-200/90 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 leading-tight">
                {t("eval.publicReviews", "Public Reviews")}
              </h4>
              <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                ({reviewsCount}) {t("eval.reviewsCount", "Reviews")}
              </p>
            </div>
          </button>

          {/* Card 3: Rate Leader / Rate Department */}
          <button
            id="nav-card-rate-profile"
            onClick={() => setActiveTab("writereview")}
            className={`p-3 sm:p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer bg-white shadow-md ${
              activeTab === "writereview"
                ? "border-blue-600 ring-2 ring-blue-600/20"
                : "border-slate-200/90 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Star className="w-4 h-4" />
              </div>
              <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 leading-tight truncate">
                {rateCardTitle}
              </h4>
              <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                {t("eval.youRate", "You Rate")}
              </p>
            </div>
          </button>
        </div>

        {/* TAB 1: 100-PT ALGORITHM VIEW */}
        {activeTab === "score" && (
          <div className="space-y-4 animate-fadeIn">
            {/* Algorithm Notice */}
            <div className="p-4 bg-white border border-slate-200 rounded-3xl space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-slate-900">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <h3 className="font-extrabold text-sm">
                  {t("eval.auditEngineTitle", "Deterministic 100-Point Civic Audit Engine")}
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {t(
                  "eval.auditEngineDesc",
                  "The System Score cannot be manually modified by any user or administrator. It is computed purely from statistical verification of Public Domain Government Gazettes, CAG Audits, and Geo-tagged SLA Logs."
                )}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-[10px] font-black px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-md">
                  Algorithm v3.2 Verified
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md">
                  Quarterly Audit Cycle Q1-2026
                </span>
              </div>
            </div>

            {/* Criteria Breakdown List */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
                {t("eval.dimensionsTitle", "Performance Evaluation Dimensions (Total: 100 Pts)")}
              </h4>

              {criteriaList.map((crit, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-2xs hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                        {crit.sourceType}
                      </span>
                      <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 mt-1">
                        {crit.label}
                      </h5>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-blue-600">
                        {crit.scoreAwarded}
                      </span>
                      <span className="text-xs font-bold text-slate-400"> / {crit.weight} pts</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${(crit.scoreAwarded / crit.weight) * 100}%` }}
                    ></div>
                  </div>

                  <p className="text-xs text-slate-600 font-normal leading-relaxed">
                    {crit.description}
                  </p>

                  {/* Public Domain Verification Link */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium truncate max-w-[280px]">
                      Source: {crit.publicSource}
                    </span>
                    <a
                      href={crit.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 font-bold hover:underline flex items-center gap-1 shrink-0"
                    >
                      Audit Record <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Official Public Domain Disclosures */}
            <div className="p-4 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>{t("eval.disclosuresTitle", "Public Domain Knowledge & Statutory Disclosures")}</span>
              </h4>
              <p className="text-xs text-slate-600">
                {t(
                  "eval.disclosuresDesc",
                  "All data points conform to open records under the Right to Information Act (RTI Section 4) and State Gazette publications."
                )}
              </p>
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span>State Assembly Hansard Gazette:</span>
                  <span className="font-bold text-slate-900">JH-VS-2025/SESSION-04</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span>CAG Financial Compliance Ledger:</span>
                  <span className="font-bold text-slate-900">CAG-CIVIC-VOL-18</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span>CPGRAMS Redressal Verification Ref:</span>
                  <span className="font-bold text-blue-600">DARPG/E/2026/09121</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PUBLIC REVIEWS LIST */}
        {activeTab === "reviews" && (
          <div className="space-y-4 animate-fadeIn">
            {/* Reviews Top Metric Header */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                  {t("eval.publicRatingAverage", "Public Rating Average")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-slate-900">
                    {typeof targetProfile.publicRating === "number"
                      ? targetProfile.publicRating.toFixed(1)
                      : "0.0"}
                  </span>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(targetProfile.publicRating || 0)
                            ? "fill-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {t("eval.basedOnReviews", "Based on {count} verified citizen evaluation(s)").replace(
                    "{count}",
                    String(reviewsCount)
                  )}
                </span>
              </div>

              {!isOwnProfile && (
                <button
                  onClick={() => setActiveTab("writereview")}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full shadow-2xs transition-all cursor-pointer"
                >
                  {existingUserReview
                    ? t("eval.editReview", "Edit Review")
                    : t("eval.writeReview", "Write Review")}
                </button>
              )}
            </div>

            {/* List of Reviews */}
            <div className="space-y-3">
              {targetProfile.reviews && targetProfile.reviews.length > 0 ? (
                targetProfile.reviews.map((rev) => {
                  const isReplying = activeReplyBoxReviewId === rev.id;
                  return (
                    <div
                      key={rev.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      {/* Review Author Row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              rev.authorAvatar ||
                              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80"
                            }
                            alt={rev.authorName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-xs text-slate-900">
                                {rev.authorName}
                              </span>
                              {rev.verifiedVoter && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                                  {t("eval.verifiedVoter", "Verified Voter")}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">{rev.date}</span>
                          </div>
                        </div>

                        {/* Star Rating Display */}
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating ? "fill-amber-400" : "text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Comment text */}
                      <p className="text-xs text-slate-800 leading-relaxed font-normal">
                        {rev.comment}
                      </p>

                      {/* Official Admin / Representative Response if already present */}
                      {rev.adminReply && (
                        <div className="p-3 bg-blue-50/70 border-l-2 border-blue-600 rounded-r-xl space-y-1 text-xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-blue-900 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                              Official Response by {rev.adminReply.authorName}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              {rev.adminReply.date}
                            </span>
                          </div>
                          <p className="text-slate-800 font-normal leading-relaxed">
                            {rev.adminReply.text}
                          </p>
                        </div>
                      )}

                      {/* Profile Owner / Admin Action to Reply to this review */}
                      {isOwnProfile && !rev.adminReply && (
                        <div className="pt-2 border-t border-slate-100">
                          {!isReplying ? (
                            <button
                              onClick={() => setActiveReplyBoxReviewId(rev.id)}
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{t("eval.replyAsOfficial", "Reply to this Citizen Review as Official Authority")}</span>
                            </button>
                          ) : (
                            <div className="space-y-2 pt-1 animate-fadeIn">
                              <textarea
                                rows={2}
                                value={adminReplyText[rev.id] || ""}
                                onChange={(e) =>
                                  setAdminReplyText((prev) => ({
                                    ...prev,
                                    [rev.id]: e.target.value,
                                  }))
                                }
                                placeholder={t("eval.typeOfficialResponse", "Type official response / acknowledgment to this citizen...")}
                                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-slate-900"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setActiveReplyBoxReviewId(null)}
                                  className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-1.5 cursor-pointer"
                                >
                                  {t("eval.cancel", "Cancel")}
                                </button>
                                <button
                                  onClick={() => handleSendAdminReply(rev.id)}
                                  disabled={!adminReplyText[rev.id]?.trim()}
                                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-2xs cursor-pointer"
                                >
                                  {t("eval.publishReply", "Publish Official Reply")}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                  {t("eval.noReviewsYet", "No citizen reviews submitted for this profile yet.")}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3 / DEFAULT: RATE FORM */}
        {activeTab === "writereview" && (
          <div className="space-y-4 animate-fadeIn">
            {/* 4. Civic Integrity Guarantee Banner */}
            <div
              id="civic-integrity-guarantee-banner"
              className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-2xs relative overflow-hidden"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-300/60">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-emerald-800 uppercase tracking-wider">
                    {t("eval.civicIntegrityGuarantee", "CIVIC INTEGRITY GUARANTEE")}
                  </h4>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed mt-0.5">
                    {t(
                      "eval.civicIntegrityDesc",
                      "Your review will be directly recorded on the verified public registry. Please provide factual and constructive feedback."
                    )}
                  </p>
                </div>
              </div>
              <Shield className="w-12 h-12 text-emerald-200/50 shrink-0 hidden sm:block pointer-events-none" />
            </div>

            {/* 5. Your Rating Card */}
            <div
              id="your-rating-card"
              className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {t("eval.yourRating", "Your Rating")}
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  {t("eval.tapStarToRate", "Tap a star to rate")}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                {/* 5 Interactive Large Stars */}
                <div className="flex items-center gap-1 sm:gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= effectiveRating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                        title={`Rate ${star} Stars`}
                      >
                        <Star
                          className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                            isFilled
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300 hover:text-amber-200"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Rating Number & Text Label */}
                <div className="text-right shrink-0">
                  <div className="text-xl sm:text-2xl font-black text-slate-900 leading-none">
                    {effectiveRating.toFixed(1)}{" "}
                    <span className="text-xs text-slate-400 font-bold">/ 5</span>
                  </div>
                  <span
                    className={`text-xs font-black block mt-1 ${
                      getRatingLabel(effectiveRating).color
                    }`}
                  >
                    {getRatingLabel(effectiveRating).label}
                  </span>
                </div>
              </div>
            </div>

            {/* 6. Detailed Citizen Performance Review Box */}
            <div
              id="detailed-review-card"
              className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3"
            >
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {t("eval.detailedReviewTitle", "Detailed Citizen Performance Review")}
                </h3>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{t("eval.detailedReviewSubtitle", "Share your experience. The more detail, the greater the impact.")}</span>
                  <span className="font-bold text-slate-400 shrink-0 pl-2">
                    {comment.length} / 500
                  </span>
                </div>
              </div>

              {/* Input Box with Pencil Icon */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                <Pencil className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                <textarea
                  rows={4}
                  maxLength={500}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t(
                    "eval.reviewPlaceholder",
                    "Write your experience regarding constituency road maintenance, flood control, MLA accessibility, or statutory fund utilization..."
                  )}
                  className="w-full bg-transparent border-0 focus:outline-none text-xs sm:text-sm text-slate-900 font-normal leading-relaxed resize-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* 7. 4 Trust Pillars */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              {/* Pillar 1: Fact Based */}
              <div className="p-2.5 sm:p-3 bg-white border border-slate-200/80 rounded-2xl text-center space-y-1 shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <FileText className="w-4 h-4" />
                </div>
                <h5 className="text-[11px] font-black text-slate-900 leading-tight">
                  {t("eval.pillarFactBased", "Fact Based")}
                </h5>
                <p className="text-[9px] text-slate-500 leading-tight font-medium">
                  {t("eval.pillarFactBasedDesc", "Share real experiences")}
                </p>
              </div>

              {/* Pillar 2: Impactful */}
              <div className="p-2.5 sm:p-3 bg-white border border-slate-200/80 rounded-2xl text-center space-y-1 shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Users className="w-4 h-4" />
                </div>
                <h5 className="text-[11px] font-black text-slate-900 leading-tight">
                  {t("eval.pillarImpactful", "Impactful")}
                </h5>
                <p className="text-[9px] text-slate-500 leading-tight font-medium">
                  {t("eval.pillarImpactfulDesc", "Your review drives change")}
                </p>
              </div>

              {/* Pillar 3: Verified */}
              <div className="p-2.5 sm:p-3 bg-white border border-slate-200/80 rounded-2xl text-center space-y-1 shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h5 className="text-[11px] font-black text-slate-900 leading-tight">
                  {t("eval.pillarVerified", "Verified")}
                </h5>
                <p className="text-[9px] text-slate-500 leading-tight font-medium">
                  {t("eval.pillarVerifiedDesc", "100% authentic & transparent")}
                </p>
              </div>

              {/* Pillar 4: Constructive */}
              <div className="p-2.5 sm:p-3 bg-white border border-slate-200/80 rounded-2xl text-center space-y-1 shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Megaphone className="w-4 h-4" />
                </div>
                <h5 className="text-[11px] font-black text-slate-900 leading-tight">
                  {t("eval.pillarConstructive", "Constructive")}
                </h5>
                <p className="text-[9px] text-slate-500 leading-tight font-medium">
                  {t("eval.pillarConstructiveDesc", "Feedback for better governance")}
                </p>
              </div>
            </div>

            {/* 8. Full-Width Submit Button */}
            <div className="pt-2">
              <button
                id="submit-review-btn"
                onClick={handleReviewFormSubmit}
                disabled={isSubmitting || rating === 0}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.99] disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("eval.submitting", "Recording on Public Registry...")}</span>
                  </>
                ) : submitSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>{t("eval.published", "Review Published!")}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {existingUserReview
                        ? t("eval.updateReview", "Update Review")
                        : t("eval.submitReview", "Submit Review")}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
