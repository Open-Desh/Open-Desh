import React, { useState } from "react";
import {
  X,
  Star,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  Send,
  Award,
} from "lucide-react";
import { Leader } from "../types.ts";

interface LeaderProfileModalProps {
  leader: Leader;
  onClose: () => void;
  onAddReview: (rating: number, comment: string) => Promise<void>;
}

export const LeaderProfileModal: React.FC<LeaderProfileModalProps> = ({
  leader,
  onClose,
  onAddReview,
}) => {
  const [activeTab, setActiveTab] = useState<"performance" | "promises" | "reviews">("performance");
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const promisePercentage = Math.round(
    (leader.promisesFulfilled / leader.promisesTotal) * 100
  );

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userComment.trim()) return;
    setIsSubmittingReview(true);
    try {
      await onAddReview(userRating, userComment);
      setUserComment("");
      setShowReviewForm(false);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fadeIn">
      <div
        id="leader-profile-dialog"
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Sticky Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm md:text-base font-extrabold text-slate-900 leading-tight">
                {leader.name}
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">
                Official Parliamentary & Governance Profile
              </span>
            </div>
          </div>
          <button
            id="close-leader-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto custom-scrollbar">
          {/* Cover & Profile Avatar */}
          <div className="relative">
            <div className="h-36 w-full bg-slate-800 overflow-hidden">
              <img
                src={leader.coverImage}
                alt="Cover"
                className="w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="px-5 flex justify-between items-end -mt-12 relative z-10">
              <div className="p-1.5 bg-white rounded-full shadow-md">
                <img
                  src={leader.image}
                  alt={leader.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-100"
                  referrerPolicy="no-referrer"
                />
              </div>
              <button
                id="rate-leader-trigger-btn"
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                <span>Rate & Review</span>
              </button>
            </div>
          </div>

          {/* Leader Info */}
          <div className="px-5 pt-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">{leader.name}</h2>
              <span
                className={`${leader.partyColor} text-[10px] font-black px-2 py-0.5 rounded shadow-xs`}
              >
                {leader.party}
              </span>
            </div>
            <p className="text-xs text-slate-700 font-semibold mt-0.5">{leader.title}</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{leader.constituency}</span>
            </p>
            <p className="text-xs text-slate-700 mt-2.5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              {leader.bio}
            </p>
          </div>

          {/* Stats Badges Bar */}
          <div className="px-5 my-4">
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">AI Index Score</p>
                <p className="text-lg font-black text-blue-600">{leader.systemScore}/100</p>
              </div>
              <div className="border-x border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Public Rating</p>
                <p className="text-lg font-black text-slate-900 flex items-center justify-center gap-1">
                  {leader.publicRating} <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Verified Votes</p>
                <p className="text-lg font-black text-slate-900">{leader.totalVotes}</p>
              </div>
            </div>
          </div>

          {/* Review Submission Accordion */}
          {showReviewForm && (
            <form
              onSubmit={handleSubmitReview}
              className="mx-5 mb-4 p-4 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-3 animate-fadeIn"
            >
              <h3 className="text-xs font-black uppercase text-blue-900">
                Submit Public Voter Review
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Rating:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= userRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows={2}
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder="Share your verified experience regarding local constituency works, responsiveness or promises..."
                className="w-full text-xs p-3 bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview || !userComment.trim()}
                  className="px-4 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmittingReview ? "Submitting..." : "Post Review"}
                </button>
              </div>
            </form>
          )}

          {/* Sub-Tabs */}
          <div className="px-5 border-b border-slate-200 flex gap-4">
            <button
              onClick={() => setActiveTab("performance")}
              className={`pb-2.5 text-xs font-bold border-b-2 transition-colors ${
                activeTab === "performance"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Promises & Scorecard
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-2.5 text-xs font-bold border-b-2 transition-colors ${
                activeTab === "reviews"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Public Reviews ({leader.reviews?.length || 0})
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-5">
            {activeTab === "performance" ? (
              <div className="space-y-5">
                {/* Fulfillment Bar */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-bold text-slate-700">
                      Total Promises Tracked: {leader.promisesTotal}
                    </span>
                    <span className="font-extrabold text-blue-600">{promisePercentage}% Complete</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${promisePercentage}%` }}
                      title="Fulfilled"
                    ></div>
                    <div
                      className="bg-amber-400 h-full"
                      style={{
                        width: `${(leader.promisesInProgress / leader.promisesTotal) * 100}%`,
                      }}
                      title="In Progress"
                    ></div>
                    <div
                      className="bg-red-400 h-full"
                      style={{
                        width: `${(leader.promisesUnfulfilled / leader.promisesTotal) * 100}%`,
                      }}
                      title="Unfulfilled"
                    ></div>
                  </div>
                  <div className="flex gap-4 mt-3 text-[10px] font-bold uppercase text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                      Fulfilled ({leader.promisesFulfilled})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                      In Progress ({leader.promisesInProgress})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                      Unfulfilled ({leader.promisesUnfulfilled})
                    </span>
                  </div>
                </div>

                {/* Promises Ledger */}
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  Documented Key Commitments
                </h3>
                <div className="space-y-2.5">
                  {leader.recentPromises.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-colors space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{p.title}</h4>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            p.status === "Fulfilled"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : p.status === "In Progress"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{p.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span>Timeline: {p.date}</span>
                        {p.budget && <span className="font-semibold text-slate-600">Budget: {p.budget}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {leader.reviews && leader.reviews.length > 0 ? (
                  leader.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">{rev.authorName}</span>
                          {rev.verifiedVoter && (
                            <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">
                              Verified Voter
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-700">{rev.comment}</p>
                      <span className="text-[10px] text-slate-400 block">{rev.date}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No voter reviews submitted yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
