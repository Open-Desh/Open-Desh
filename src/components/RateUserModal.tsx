import React, { useState } from "react";
import { X, Star, Send, Loader2, Award, CheckCircle } from "lucide-react";
import { UserReview } from "../types.ts";

interface RateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetName: string;
  targetId: string;
  existingReviews?: UserReview[];
  onSubmitReview: (rating: number, comment: string) => Promise<void>;
}

export const RateUserModal: React.FC<RateUserModalProps> = ({
  isOpen,
  onClose,
  targetName,
  targetId,
  existingReviews = [],
  onSubmitReview,
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmitReview(rating, comment);
      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        setComment("");
        onClose();
      }, 1200);
    } catch (err) {
      console.error("Failed to submit review:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[350] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div
        id="rate-user-modal"
        className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                Rate & Review {targetName}
              </h2>
              <p className="text-[11px] text-slate-500">Public Constituent Performance Feedback</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {submittedSuccess ? (
            <div className="py-8 text-center space-y-2 animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Review Published!</h3>
              <p className="text-xs text-slate-500">
                Your verified rating has been logged to the transparency ledger.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Rating Picker */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 text-center space-y-2">
                <span className="text-xs font-bold text-slate-600 block">Select Rating Score</span>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1.5 hover:scale-115 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300 stroke-[1.5]"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-black text-slate-900 block">
                  {rating === 5
                    ? "⭐⭐⭐⭐⭐ Outstanding Performance"
                    : rating === 4
                    ? "⭐⭐⭐⭐ Good & Responsive"
                    : rating === 3
                    ? "⭐⭐⭐ Average / Delayed Work"
                    : rating === 2
                    ? "⭐⭐ Needs Urgent Improvement"
                    : "⭐ Poor Performance / Unfulfilled Promises"}
                </span>
              </div>

              {/* Comment */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                  Detailed Voter Experience / Work Review
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details regarding local constituency works, responsiveness, grievance resolution, or promise delivery..."
                  className="w-full text-xs sm:text-sm p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white resize-none font-medium text-slate-900"
                  required
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !comment.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing Review...</span>
                  </>
                ) : (
                  <span>Post Public Review</span>
                )}
              </button>
            </form>
          )}

          {/* Past Reviews List */}
          {existingReviews.length > 0 && (
            <div className="pt-3 border-t border-slate-200 space-y-2.5">
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Recent Public Reviews ({existingReviews.length})
              </h4>
              <div className="space-y-2">
                {existingReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{rev.authorName}</span>
                      <div className="flex text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-700">{rev.comment}</p>
                    <span className="text-[10px] text-slate-400">{rev.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
