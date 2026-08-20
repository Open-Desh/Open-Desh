import React, { useState } from "react";
import {
  X,
  AlertCircle,
  Loader2,
  Shield,
  User as UserIcon,
  Mail,
  Lock,
  Calendar,
} from "lucide-react";
import {
  loginWithGoogle,
  loginWithEmail,
  signUpWithEmail,
  FirebaseUser,
  db,
} from "../firebase.ts";
import { doc, setDoc } from "firebase/firestore";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: FirebaseUser) => void;
  actionReason?: string | null;
  allowDismiss?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionReason = null,
  allowDismiss = true,
}) => {
  const [screen, setScreen] = useState<"welcome" | "email">("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState<string>("");
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await loginWithGoogle();
      onSuccess(user);
      onClose();
    } catch (err: any) {
      console.warn("Google login notice:", err);
      if (err?.code === "auth/unauthorized-domain") {
        setErrorMsg(
          "Current preview domain is not in Firebase OAuth Authorized Domains list. Please log in seamlessly via Email below!"
        );
      } else if (err?.code === "auth/popup-blocked") {
        setErrorMsg("Browser blocked popup. Please use Email login below.");
      } else if (err?.code === "auth/popup-closed-by-user") {
        setErrorMsg("Sign-in cancelled. Please try again.");
      } else {
        setErrorMsg("Google sign-in unavailable. Please use Email login below.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (isSignUpMode && !age.trim()) {
      setErrorMsg("Please enter your age (उम्र).");
      return;
    }

    const parsedAge = parseInt(age, 10);
    if (isSignUpMode && (isNaN(parsedAge) || parsedAge < 10 || parsedAge > 120)) {
      setErrorMsg("Please enter a valid age between 10 and 120.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const pwd = password.trim() || "OpenDesh@2026";
      let user: FirebaseUser;
      if (isSignUpMode) {
        user = await signUpWithEmail(email.trim(), pwd, fullName.trim() || undefined);
        try {
          await setDoc(
            doc(db, "users", user.uid),
            {
              age: parsedAge,
              fullName: fullName.trim() || email.split("@")[0],
              email: email.trim(),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (fsErr) {
          console.warn("Firestore age save notice:", fsErr);
        }
      } else {
        user = await loginWithEmail(email.trim(), pwd);
      }
      onSuccess(user);
      onClose();
    } catch (err: any) {
      console.warn("Firebase Email Auth notice:", err);
      if (err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential") {
        setErrorMsg("Incorrect email or password.");
      } else if (err?.code === "auth/email-already-in-use") {
        setErrorMsg("Email is already registered. Please log in.");
      } else {
        setErrorMsg(err?.message || "Authentication failed. Please check credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {!imgError ? (
              <img
                src="/logo.png"
                alt="Open Desh Logo"
                onError={() => setImgError(true)}
                className="w-7 h-7 rounded-lg object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-black">
                OD
              </div>
            )}
            <span className="text-sm font-black text-slate-900">Open Desh</span>
          </div>
          {allowDismiss && (
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Reason banner */}
        {actionReason && (
          <div className="bg-blue-50 px-6 py-2.5 text-blue-900 text-xs font-semibold flex items-center gap-2 border-b border-blue-100">
            <Shield className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{actionReason}</span>
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-6">
          {screen === "welcome" ? (
            <div className="space-y-6">
              {/* Logo & Headline */}
              <div className="text-center space-y-2">
                {!imgError ? (
                  <img
                    src="/logo.png"
                    alt="Open Desh Logo"
                    onError={() => setImgError(true)}
                    className="w-16 h-16 rounded-2xl object-cover shadow-sm mx-auto border border-slate-200"
                  />
                ) : (
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-sm mx-auto">
                    OD
                  </div>
                )}
                <h3 className="text-xl font-black text-slate-900 pt-1">
                  Citizen Account Sign In
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Log in or sign up to file grievances and participate in civic ratings.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full h-12 rounded-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-xs active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.41 7.36 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.29 2.59 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setErrorMsg(null);
                    setScreen("email");
                  }}
                  className="w-full h-12 rounded-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] transition-all cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-slate-600" />
                  <span>Continue with Email</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-slate-900">
                  {isSignUpMode ? "Create Citizen Account" : "Log in with Email"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isSignUpMode
                    ? "Enter your name, age, and email to register."
                    : "Enter your registered credentials to sign in."}
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                {isSignUpMode && (
                  <>
                    <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20 bg-white">
                      <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-slate-700 flex items-center gap-1">
                        <UserIcon className="w-2.5 h-2.5" /> Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full h-11 px-3.5 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none bg-transparent"
                      />
                    </div>

                    <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20 bg-white">
                      <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-slate-700 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" /> Age (उम्र)
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={120}
                        required
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="e.g. 24"
                        className="w-full h-11 px-3.5 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none bg-transparent"
                      />
                    </div>
                  </>
                )}

                <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20 bg-white">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-slate-700 flex items-center gap-1">
                    <Mail className="w-2.5 h-2.5" /> Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full h-11 px-3.5 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none bg-transparent"
                  />
                </div>

                <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20 bg-white">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-slate-700 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full h-11 px-3.5 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none bg-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim() || !password.trim()}
                  className={`w-full h-11 rounded-full font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                    email.trim() && password.trim()
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-[0.99]"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : isSignUpMode ? (
                    "Create Account"
                  ) : (
                    "Log In"
                  )}
                </button>
              </form>

              <div className="flex items-center justify-between text-xs font-semibold pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setIsSignUpMode(!isSignUpMode);
                  }}
                  className="text-blue-600 hover:text-blue-700 cursor-pointer font-bold"
                >
                  {isSignUpMode ? "Already registered? Log In" : "Need account? Sign Up"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setScreen("welcome");
                  }}
                  className="text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  ← Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
