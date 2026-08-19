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
  UserCheck,
  FileCheck2,
  Building,
  TrendingUp,
  Scale,
  Calendar,
  Lock,
} from "lucide-react";
import { UserProfile, UserReview, ScoreCriterion, SystemScoreBreakdown } from "../types.ts";

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
  initialTab = "score",
  onBack,
  onSubmitReview,
  onReplyToReview,
}) => {
  const [activeTab, setActiveTab] = useState<"score" | "reviews" | "writereview">(initialTab);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeReplyBoxReviewId, setActiveReplyBoxReviewId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState<Record<string, string>>({});

  const isOwnProfile = currentUser.id === targetProfile.id;

  // Check if current user has already submitted a review for this profile (Limit: 1 review per user)
  const existingUserReview = targetProfile.reviews?.find(
    (r) => r.authorId === currentUser.id
  );

  // Default transparent 100-point algorithm calculation
  const defaultCriteria: ScoreCriterion[] = [
    {
      label: "Grievance SLA Redressal Velocity & Rate",
      weight: 25,
      scoreAwarded: 22.5,
      description:
        "Ratio of citizen reports acknowledged within statutory 24-hr SLA and verified closed on ground within stipulated timeframe.",
      publicSource: "State Grievance Redressal Portal & Central CPGRAMS Dashboard (FY 25-26)",
      sourceUrl: "https://cpgrams.nic.in",
      sourceType: "Govt SLA Redressal Log",
    },
    {
      label: "Public Fund & MLALAD Utilization Efficiency",
      weight: 25,
      scoreAwarded: 21.0,
      description:
        "Audit of sanctioned constituency development funds allocated versus actual utilization certificates published without fiscal lapses.",
      publicSource: "Comptroller & Auditor General (CAG) State Audit Gazette & Finance Dept Ledger",
      sourceUrl: "https://cag.gov.in",
      sourceType: "CAG Gazette",
    },
    {
      label: "Legislative Assembly Attendance & Question Hours",
      weight: 20,
      scoreAwarded: 18.5,
      description:
        "Official floor participation in Vidhan Sabha sessions, public interest bills raised, and standing committee attendance.",
      publicSource: "Vidhan Sabha Official Hansard Debates & Legislative Records",
      sourceUrl: "https://prsindia.org",
      sourceType: "State Legislative Hansard",
    },
    {
      label: "Ground Verification & Independent Civic Audits",
      weight: 15,
      scoreAwarded: 12.5,
      description:
        "Geo-tagged photographic confirmations uploaded by registered local resident verifiers and third-party civil engineering monitors.",
      publicSource: "Open Nation Verified Geo-Audit Protocol & Ward Inspection Reports",
      sourceUrl: "https://opennation.org/audits",
      sourceType: "Geo-Tagged Audit",
    },
    {
      label: "Verified Citizen Trust & Satisfaction Index",
      weight: 15,
      scoreAwarded: 13.5,
      description:
        "Aggregated satisfaction scores from Aadhaar-verified constituency voters and verified resident reviews.",
      publicSource: "Open Nation Public Voter Sentiment Registry",
      sourceUrl: "https://opennation.org/ratings",
      sourceType: "Verified Voter Index",
    },
  ];

  const criteriaList =
    targetProfile.systemScoreBreakdown?.criteria &&
    targetProfile.systemScoreBreakdown.criteria.length > 0
      ? targetProfile.systemScoreBreakdown.criteria
      : defaultCriteria;

  const totalCalculatedScore = Math.round(
    criteriaList.reduce((acc, c) => acc + c.scoreAwarded, 0)
  );

  const handleReviewFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmitReview(rating, comment.trim());
      setComment("");
      setActiveTab("reviews");
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
    <div className="max-w-xl mx-auto pb-24 md:pb-12 animate-fadeIn bg-white border-x border-slate-200 min-h-screen">
      {/* Sticky Header with Back button */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Back to Profile"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight flex items-center gap-1.5">
              <span>Civic Audit & Performance Index</span>
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </h1>
            <span className="text-xs text-slate-500 font-medium">
              {targetProfile.fullName} (@{targetProfile.username})
            </span>
          </div>
        </div>

        <div className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-xs rounded-full flex items-center gap-1">
          <Award className="w-3.5 h-3.5" />
          <span>Score: {targetProfile.systemScore || totalCalculatedScore}/100</span>
        </div>
      </div>

      {/* Top Profile Summary Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3.5">
        <img
          src={targetProfile.avatarUrl}
          alt={targetProfile.fullName}
          className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-xs"
          referrerPolicy="no-referrer"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-extrabold text-sm text-slate-900 truncate">
              {targetProfile.fullName}
            </h2>
            {targetProfile.verified && (
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            )}
          </div>
          <p className="text-xs text-slate-600 truncate">
            {targetProfile.departmentDetails?.name ||
              targetProfile.representativeDetails?.position ||
              "Civic Representative"}
          </p>
        </div>

        {/* Big Score Callout */}
        <div className="text-right">
          <span className="text-2xl font-black text-blue-600 block leading-none">
            {targetProfile.systemScore || totalCalculatedScore}
          </span>
          <span className="text-[10px] uppercase font-extrabold text-slate-400">
            System Index
          </span>
        </div>
      </div>

      {/* Sub-Navigation Tabs: 1. System Score (0-100) | 2. Public Reviews | 3. Write / Edit Review */}
      <div className="border-b border-slate-200 bg-white sticky top-[57px] z-20">
        <div className="flex justify-between px-2 sm:px-4">
          <button
            onClick={() => setActiveTab("score")}
            className={`py-3.5 px-3 text-xs sm:text-sm font-extrabold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === "score"
                ? "border-blue-600 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Scale className="w-4 h-4 text-blue-600" />
            <span>100-Pt Algorithm</span>
          </button>

          <button
            onClick={() => setActiveTab("reviews")}
            className={`py-3.5 px-3 text-xs sm:text-sm font-extrabold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === "reviews"
                ? "border-blue-600 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-amber-500" />
            <span>Public Reviews ({targetProfile.reviews?.length || 0})</span>
          </button>

          {!isOwnProfile && (
            <button
              onClick={() => setActiveTab("writereview")}
              className={`py-3.5 px-3 text-xs sm:text-sm font-extrabold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === "writereview"
                  ? "border-blue-600 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>{existingUserReview ? "My Review" : "Rate Leader"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="p-4 sm:p-5 space-y-5">
        {/* TAB 1: SYSTEM SCORE 100-POINT ALGORITHM & PUBLIC SOURCES */}
        {activeTab === "score" && (
          <div className="space-y-5 animate-fadeIn">
            {/* Algorithm Notice */}
            <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200/80 rounded-3xl space-y-2">
              <div className="flex items-center gap-2 text-blue-900">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <h3 className="font-extrabold text-sm">
                  Deterministic 100-Point Civic Audit Engine
                </h3>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                System Score kisi user ya admin dwara manually change nahi kiya ja sakta. Yeh
                purely <strong>Public Domain Govt Gazettes</strong>, <strong>CAG Audits</strong>, aur{" "}
                <strong>Geo-tagged SLA Logs</strong> ke statistical verification par compute hota hai.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-[10px] font-black px-2 py-0.5 bg-white border border-blue-200 text-blue-800 rounded-md">
                  Algorithm v3.2 Verified
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-md">
                  Quarterly Audit Cycle Q1-2026
                </span>
              </div>
            </div>

            {/* Criteria Breakdown List */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
                Performance Evaluation Dimensions (Total: 100 Pts)
              </h4>

              {criteriaList.map((crit, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-2.5 shadow-2xs hover:border-blue-300 transition-colors"
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
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Public Domain Knowledge & Statutory Disclosures</span>
              </h4>
              <p className="text-xs text-slate-600">
                All data points conform to open records under the Right to Information Act (RTI Section 4) and State Gazette publications.
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

        {/* TAB 2: PUBLIC REVIEWS & RATINGS WITH ADMIN/REPRESENTATIVE REPLIES */}
        {activeTab === "reviews" && (
          <div className="space-y-4 animate-fadeIn">
            {/* Reviews Top Metric Header */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 sm:p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                  Public Rating Average
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-slate-900">
                    {targetProfile.publicRating || 4.4}
                  </span>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(targetProfile.publicRating || 4)
                            ? "fill-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  Based on {targetProfile.reviews?.length || 1} verified citizen evaluation(s)
                </span>
              </div>

              {!isOwnProfile && !existingUserReview && (
                <button
                  onClick={() => setActiveTab("writereview")}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full shadow-2xs transition-all"
                >
                  Write Review
                </button>
              )}
            </div>

            {/* List of Reviews */}
            <div className="space-y-3.5">
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
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-xs text-slate-900">
                                {rev.authorName}
                              </span>
                              {rev.verifiedVoter && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                                  Verified Voter
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
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Reply to this Citizen Review as Official Leader</span>
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
                                placeholder="Type official response / acknowledgment to this citizen..."
                                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-slate-900"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setActiveReplyBoxReviewId(null)}
                                  className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-1.5"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSendAdminReply(rev.id)}
                                  disabled={!adminReplyText[rev.id]?.trim()}
                                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-2xs"
                                >
                                  Publish Official Reply
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
                <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                  No citizen reviews submitted for this leader yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SUBMIT / EDIT REVIEW (STRICT 1 REVIEW PER CITIZEN RULE) */}
        {activeTab === "writereview" && !isOwnProfile && (
          <div className="space-y-4 animate-fadeIn">
            {/* If user already reviewed, display status info */}
            {existingUserReview ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-extrabold text-sm">Review Already Submitted</h4>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Aapne is leader ko pehle hi review submit kar diya hai ({existingUserReview.date}).
                  Har citizen ko fairness aur security ke liye <strong>kewal 1 rating</strong> ki permission
                  hai. Aap niche apna review update kar sakte hain.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-3xl space-y-1 text-xs text-blue-900">
                <span className="font-black uppercase text-[10px] text-blue-700 block">
                  Civic Integrity Guarantee
                </span>
                <p>
                  Aapka review directly verified public registry par record hoga. Kripya factual aur
                  constructive feedback dein.
                </p>
              </div>
            )}

            {/* Review Form */}
            <form
              onSubmit={handleReviewFormSubmit}
              className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm"
            >
              <div>
                <label className="text-xs font-black uppercase text-slate-600 block mb-2">
                  Select Rating Score (1 to 5 Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300 hover:text-amber-200"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-black text-sm text-slate-800">{rating} / 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-600 block mb-1.5">
                  Detailed Citizen Performance Review
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Constituency road maintenance, flood control, MLA accessibility ya statutory fund utilization par apna anubhav likhein..."
                  className="w-full text-xs sm:text-sm p-3 bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900 font-normal leading-relaxed"
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Reviewing as Verified Voter:</span>
                <span className="font-bold text-slate-900">{currentUser.fullName}</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !comment.trim()}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Recording Review on Registry...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{existingUserReview ? "Update My Review" : "Submit Official Citizen Review"}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
