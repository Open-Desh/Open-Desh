import React, { useState } from "react";
import { Calendar, Shield, Loader2, ArrowRight } from "lucide-react";
import { db } from "../firebase.ts";
import { doc, setDoc } from "firebase/firestore";

interface AgePromptModalProps {
  isOpen: boolean;
  userId: string;
  onSaveAge: (age: number) => void;
}

export const AgePromptModal: React.FC<AgePromptModalProps> = ({
  isOpen,
  userId,
  onSaveAge,
}) => {
  const [age, setAge] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 10 || parsedAge > 120) {
      setErrorMsg("Please enter a valid age between 10 and 120.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      if (userId) {
        await setDoc(
          doc(db, "users", userId),
          {
            age: parsedAge,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
      onSaveAge(parsedAge);
    } catch (err) {
      console.warn("Error saving age to Firestore:", err);
      onSaveAge(parsedAge);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-scaleUp">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900">
            Enter Your Age (उम्र दर्ज करें)
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            To complete your verified citizen profile, please provide your age. It will be securely stored in the database.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20 bg-white">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-slate-700">
              Age in Years
            </label>
            <input
              type="number"
              min={10}
              max={120}
              required
              autoFocus
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 25"
              className="w-full h-12 px-4 text-center text-lg font-bold text-slate-900 placeholder-slate-400 outline-none bg-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !age.trim()}
            className="w-full h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <span>Save to Database</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium pt-1">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span>Stored in Firestore `users` Database</span>
        </div>
      </div>
    </div>
  );
};
