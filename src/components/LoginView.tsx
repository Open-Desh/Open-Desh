import React, { useState } from "react";
import {
  ArrowLeft,
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

interface LoginViewProps {
  onSuccess: (user: FirebaseUser) => void;
  onCancel: () => void;
  actionReason?: string | null;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onSuccess,
  onCancel,
  actionReason = null,
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await loginWithGoogle();
      onSuccess(user);
    } catch (err: any) {
      console.warn("Google login notice:", err);
      if (err?.code === "auth/popup-blocked") {
        setErrorMsg("Browser popup was blocked. Please enable popups or log in via Email.");
      } else if (err?.code === "auth/popup-closed-by-user") {
        setErrorMsg("Google sign-in window was closed. Please try again.");
      } else {
        setErrorMsg("Google authentication service notice. You can log in directly with Email below!");
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
        // Save age directly to Firestore Database
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
    } catch (err: any) {
      console.warn("Email auth error:", err);
      if (err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential") {
        setErrorMsg("Incorrect credentials. Please verify email and password.");
      } else if (err?.code === "auth/email-already-in-use") {
        setErrorMsg("Email already registered. Please log in or reset password.");
      } else if (err?.code === "auth/invalid-email") {
        setErrorMsg("Please enter a valid email address format.");
      } else {
        setErrorMsg(err?.message || "Authentication failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="login-view-page"
      className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-lg mx-auto border-x border-slate-200 shadow-sm"
    >
      {/* Top Header Bar with Back Navigation */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="login-back-btn"
            onClick={onCancel}
            className="p-2 -ml-1 text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight">
              {screen === "welcome"
                ? "Sign In to Open Desh"
                : isSignUpMode
                ? "Create Citizen Account"
                : "Email Sign In"}
            </h1>
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              Open Voice, Open Desh
            </span>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="text-xs font-bold text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </header>

      {/* Action Reason Banner */}
      {actionReason && (
        <div className="bg-blue-50 border-b border-blue-100 px-5 py-3 flex items-center gap-2 text-blue-950 text-xs font-bold">
          <Shield className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{actionReason}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-center px-6 py-8 sm:px-10">
        {/* ========================================================================= */}
        {/* SCREEN 1: WELCOME SCREEN                                                  */}
        {/* ========================================================================= */}
        {screen === "welcome" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Centered Brand & Logo */}
            <div className="text-center space-y-3">
              {!imgError ? (
                <img
                  src="/logo.jpg"
                  alt="Open Desh Logo"
                  onError={() => setImgError(true)}
                  className="w-18 h-18 rounded-2xl object-cover shadow-sm mx-auto border border-slate-200"
                />
              ) : (
                <div className="w-18 h-18 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-sm mx-auto">
                  OD
                </div>
              )}
              <div className="space-y-1 pt-1">
                <h2 className="text-3xl font-black text-slate-950 tracking-tight">
                  Open Desh
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Open Voice, Open Desh
                </p>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-[320px] mx-auto leading-relaxed">
                Connect your citizen identity to file real-time grievances, evaluate public representatives, and access statutory citizen SLA charters.
              </p>
            </div>

            {/* Error Notification */}
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="flex-1">{errorMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              {/* Google Login */}
              <button
                id="login-btn-google"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-[52px] rounded-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm flex items-center justify-center gap-3 shadow-sm active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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

              {/* Email Sign In / Sign Up */}
              <button
                id="login-btn-email"
                onClick={() => {
                  setErrorMsg(null);
                  setScreen("email");
                }}
                disabled={loading}
                className="w-full h-[52px] rounded-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
              >
                <Mail className="w-4 h-4 text-slate-600" />
                <span>Continue with Email</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 2: EMAIL SIGN IN / SIGN UP                                         */}
        {/* ========================================================================= */}
        {screen === "email" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Centered Logo */}
            <div className="text-center space-y-2">
              {!imgError ? (
                <img
                  src="/logo.jpg"
                  alt="Open Desh Logo"
                  onError={() => setImgError(true)}
                  className="w-14 h-14 rounded-2xl object-cover shadow-sm mx-auto border border-slate-200"
                />
              ) : (
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-sm mx-auto">
                  OD
                </div>
              )}
              <h2 className="text-2xl font-black text-slate-950 tracking-tight pt-1">
                {isSignUpMode ? "Create Citizen Account" : "Log In to Open Desh"}
              </h2>
              <p className="text-xs text-slate-500 max-w-[300px] mx-auto leading-relaxed">
                {isSignUpMode
                  ? "Enter your details including age to verify your citizen profile."
                  : "Enter your registered email and password to log in."}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {isSignUpMode && (
                <>
                  {/* Full Name */}
                  <div className="relative rounded-xl border border-slate-900 focus-within:ring-2 focus-within:ring-blue-600/30 transition-all bg-white">
                    <label className="absolute -top-2.5 left-3 bg-white px-1 text-[11px] font-bold text-slate-900 flex items-center gap-1">
                      <UserIcon className="w-3 h-3 text-slate-700" /> Full Name
                    </label>
                    <input
                      id="login-name-input"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full h-13 px-4 pt-1 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none bg-transparent"
                    />
                  </div>

                  {/* Age Field */}
                  <div className="relative rounded-xl border border-slate-900 focus-within:ring-2 focus-within:ring-blue-600/30 transition-all bg-white">
                    <label className="absolute -top-2.5 left-3 bg-white px-1 text-[11px] font-bold text-slate-900 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-700" /> Age (उम्र)
                    </label>
                    <input
                      id="login-age-input"
                      type="number"
                      min={10}
                      max={120}
                      required
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 24"
                      className="w-full h-13 px-4 pt-1 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none bg-transparent"
                    />
                  </div>
                </>
              )}

              {/* Floating Email Field */}
              <div className="relative rounded-xl border border-slate-900 focus-within:ring-2 focus-within:ring-blue-600/30 transition-all bg-white">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-[11px] font-bold text-slate-900 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-700" /> Email Address
                </label>
                <input
                  id="login-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full h-13 px-4 pt-1 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none bg-transparent"
                />
              </div>

              {/* Password Field */}
              <div className="relative rounded-xl border border-slate-300 focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-blue-600/30 transition-all bg-white">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500" /> Password
                </label>
                <input
                  id="login-password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="w-full h-13 px-4 pt-1 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none bg-transparent"
                />
              </div>

              <button
                id="login-submit-email-btn"
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className={`w-full h-[50px] rounded-full font-bold text-sm flex items-center justify-center transition-all cursor-pointer ${
                  email.trim() && password.trim()
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-[0.99]"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : isSignUpMode ? (
                  "Create Account & Save Profile"
                ) : (
                  "Log In"
                )}
              </button>
            </form>

            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setIsSignUpMode(!isSignUpMode);
                }}
                className="hover:text-blue-700 text-blue-600 cursor-pointer font-bold"
              >
                {isSignUpMode ? "Already have an account? Log In" : "New to Open Desh? Sign Up"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setScreen("welcome");
                }}
                className="hover:text-slate-900 cursor-pointer text-slate-500"
              >
                ← Back
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="p-6 text-center text-[11px] text-slate-500 font-medium border-t border-slate-200/80 bg-white">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span>Encrypted Citizen Identity & Secure Database</span>
        </div>
        <p className="text-slate-400">
          By signing in, you agree to Open Desh Terms of Service & Privacy Policy.
        </p>
      </footer>
    </div>
  );
};
