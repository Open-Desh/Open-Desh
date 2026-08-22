import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  X,
  ShieldCheck,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  Lock,
} from "lucide-react";
import {
  loginWithGoogle,
  loginWithEmail,
  signUpWithEmail,
  FirebaseUser,
  db,
} from "../firebase.ts";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { checkUsernameAvailability } from "../lib/firestoreSync.ts";
import { WheelColumn, MONTHS } from "./DateWheelPicker.tsx";

interface LoginViewProps {
  onSuccess: (user: FirebaseUser) => void;
  onCancel: () => void;
  actionReason?: string | null;
}

type AuthScreen =
  | "welcome"
  | "login"
  | "signup_name"
  | "signup_dob"
  | "signup_username"
  | "signup_email"
  | "signup_password";

export const LoginView: React.FC<LoginViewProps> = ({
  onSuccess,
  onCancel,
  actionReason = null,
}) => {
  const [screen, setScreen] = useState<AuthScreen>("welcome");

  // Form State
  const [loginIdentifier, setLoginIdentifier] = useState(""); // Email or Username
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Signup Multi-step State
  const [signupName, setSignupName] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  // Date of Birth State (mandatory roller picker)
  const [selectedDay, setSelectedDay] = useState<number>(22);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(7); // August
  const [selectedYear, setSelectedYear] = useState<number>(2000);
  const [dobConfirmed, setDobConfirmed] = useState<boolean>(false);

  // Maximum days in chosen month/year
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonthIndex + 1, 0).getDate();
  }, [selectedYear, selectedMonthIndex]);

  const safeDay = Math.min(selectedDay, daysInMonth);

  const formattedDisplay = useMemo(() => {
    const monthShort = MONTHS[selectedMonthIndex]?.short || "Aug";
    const dayStr = safeDay < 10 ? `0${safeDay}` : `${safeDay}`;
    return `${dayStr}-${monthShort}-${selectedYear}`;
  }, [safeDay, selectedMonthIndex, selectedYear]);

  const prevDay = safeDay === 1 ? daysInMonth : safeDay - 1;
  const nextDay = safeDay === daysInMonth ? 1 : safeDay + 1;
  const prevMonthIndex = selectedMonthIndex === 0 ? 11 : selectedMonthIndex - 1;
  const nextMonthIndex = selectedMonthIndex === 11 ? 0 : selectedMonthIndex + 1;
  const prevYear = selectedYear - 1;
  const nextYear = selectedYear + 1;

  const handleStepDay = (delta: number) => {
    let next = safeDay + delta;
    if (next < 1) next = daysInMonth;
    if (next > daysInMonth) next = 1;
    setSelectedDay(next);
  };

  const handleStepMonth = (delta: number) => {
    let next = selectedMonthIndex + delta;
    if (next < 0) next = 11;
    if (next > 11) next = 0;
    setSelectedMonthIndex(next);
  };

  const handleStepYear = (delta: number) => {
    const currentYear = new Date().getFullYear();
    let next = selectedYear + delta;
    if (next < 1920) next = 1920;
    if (next > currentYear) next = currentYear;
    setSelectedYear(next);
  };

  // Status State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [usernameReason, setUsernameReason] = useState<string>("");

  // Legal Modal
  const [legalModal, setLegalModal] = useState<"terms" | "privacy" | "cookies" | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Google Login
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await loginWithGoogle();
      // Ensure joiningDate is preserved if existing, or written if brand new
      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        const nowIso = new Date().toISOString();
        if (!snap.exists()) {
          await setDoc(
            userRef,
            {
              id: user.uid,
              fullName: user.displayName || "Verified Citizen",
              email: user.email || "",
              avatarUrl: user.photoURL || "",
              category: "citizen",
              verified: false,
              verificationStatus: "none",
              joiningDate: nowIso,
              createdAt: nowIso,
              updatedAt: nowIso,
            }
          );
        } else {
          // If joiningDate is missing, add it
          const data = snap.data();
          if (!data.joiningDate) {
            await setDoc(userRef, { joiningDate: data.createdAt || nowIso }, { merge: true });
          }
        }
      } catch (e) {
        console.warn("Notice updating user info on Google sign-in:", e);
      }
      onSuccess(user);
    } catch (err: any) {
      console.warn("Google login notice:", err);
      if (err?.code === "auth/unauthorized-domain") {
        setErrorMsg("Domain authorization notice. Please continue directly with Email/Username below.");
      } else {
        setErrorMsg(err?.message || "Google sign-in could not be completed. Please use Email/Username.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Direct Login (via Email OR Username + Password)
  const handleDirectLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const id = loginIdentifier.trim();
    const pwd = loginPassword.trim();

    if (!id) {
      setErrorMsg("Please enter your email or username.");
      return;
    }
    if (!pwd) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      let targetEmail = id;

      // If user typed a username (doesn't contain @), resolve it from Firestore
      if (!id.includes("@")) {
        const cleanUname = id.replace(/^@+/, "").toLowerCase();
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", cleanUname));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const udata = snap.docs[0].data();
          if (udata.email) {
            targetEmail = udata.email;
          } else {
            throw new Error(`No email linked with @${cleanUname}. Please log in with your email address.`);
          }
        } else {
          // Check leaders collection as well
          const leadersRef = collection(db, "leaders");
          const qL = query(leadersRef, where("username", "==", cleanUname));
          const snapL = await getDocs(qL);

          if (!snapL.empty) {
            const ldata = snapL.docs[0].data();
            if (ldata.email) {
              targetEmail = ldata.email;
            } else {
              throw new Error(`Representative account @${cleanUname} requires email login.`);
            }
          } else {
            throw new Error(`Username @${cleanUname} not found. Please check spelling or sign up.`);
          }
        }
      }

      const user = await loginWithEmail(targetEmail, pwd);
      onSuccess(user);
    } catch (err: any) {
      console.warn("Direct login error:", err);
      if (err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential") {
        setErrorMsg("Incorrect password or credentials. Please try again.");
      } else if (err?.code === "auth/user-not-found") {
        setErrorMsg("No account found with this email/username. Please sign up.");
      } else if (err?.code === "auth/operation-not-allowed") {
        setErrorMsg("Email/Password login is not enabled in Firebase Console.");
      } else {
        setErrorMsg(err.message || "Failed to log in. Please verify your details.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Submit Name -> advance to DOB
  const handleNameNext = () => {
    if (!signupName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    setErrorMsg(null);
    setScreen("signup_dob");
  };

  // Step 2: Confirm DOB -> advance to Username
  const handleDobNext = () => {
    const currentYear = new Date().getFullYear();
    const age = currentYear - selectedYear;
    if (age < 10 || age > 120) {
      setErrorMsg("Please select a valid birth date (minimum 10 years).");
      return;
    }
    setDobConfirmed(true);
    setErrorMsg(null);
    setScreen("signup_username");
  };

  // Step 3: Check username availability -> advance to Email
  const handleUsernameNext = async () => {
    const clean = signupUsername.replace(/^@+/, "").trim().toLowerCase();
    if (clean.length < 3) {
      setErrorMsg("Username must be at least 3 characters.");
      return;
    }

    setUsernameChecking(true);
    setErrorMsg(null);

    try {
      const res = await checkUsernameAvailability(clean, "");
      if (!res.available) {
        setUsernameValid(false);
        setUsernameReason(res.reason || "Username is already taken.");
        setErrorMsg(res.reason || "Username is already taken. Please choose another.");
        return;
      }
      setUsernameValid(true);
      setScreen("signup_email");
    } catch (e: any) {
      setScreen("signup_email");
    } finally {
      setUsernameChecking(false);
    }
  };

  // Step 4: Submit Email -> advance to Password
  const handleEmailNext = () => {
    if (!signupEmail.trim() || !signupEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setErrorMsg(null);
    setScreen("signup_password");
  };

  // Step 5: Complete multi-step signup and save DOB + Joining Date directly to Firestore
  const handleCompleteSignup = async () => {
    if (!signupPassword || signupPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    if (!dobConfirmed) {
      setErrorMsg("Please provide your date of birth before creating account.");
      setScreen("signup_dob");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const cleanUname = (signupUsername || signupName.replace(/\s+/g, "").toLowerCase()).replace(/^@+/, "").toLowerCase();
      const currentYear = new Date().getFullYear();
      const calculatedAge = Math.max(1, currentYear - selectedYear);
      const monthStr = (selectedMonthIndex + 1).toString().padStart(2, "0");
      const dayStr = safeDay.toString().padStart(2, "0");
      const birthDateISO = `${selectedYear}-${monthStr}-${dayStr}`;
      const nowIso = new Date().toISOString();

      const user = await signUpWithEmail(signupEmail.trim(), signupPassword.trim(), signupName.trim());

      // Save complete user profile to Firestore with joiningDate and DOB
      try {
        await setDoc(
          doc(db, "users", user.uid),
          {
            id: user.uid,
            username: cleanUname,
            fullName: signupName.trim() || cleanUname,
            email: signupEmail.trim(),
            age: calculatedAge,
            birthDate: birthDateISO,
            birthDayFormatted: formattedDisplay,
            category: "citizen",
            verified: false,
            verificationStatus: "none",
            joiningDate: nowIso,
            createdAt: nowIso,
            updatedAt: nowIso,
          },
          { merge: true }
        );
      } catch (fsErr) {
        console.warn("Firestore profile save notice:", fsErr);
      }

      onSuccess(user);
    } catch (err: any) {
      console.warn("Signup error:", err);
      if (err?.code === "auth/operation-not-allowed") {
        setErrorMsg("Firebase Console me 'Email/Password' provider Enable karein (Authentication > Sign-in method).");
      } else if (err?.code === "auth/email-already-in-use") {
        setErrorMsg("This email is already registered. Please log in directly.");
      } else {
        setErrorMsg(err.message || "Failed to create account. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getPolicyUrl = () => {
    if (legalModal === "terms") return "https://help.opendesh.com/terms-of-service";
    if (legalModal === "privacy") return "https://help.opendesh.com/privacy-policy";
    return "https://help.opendesh.com/cookie-policy";
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(getPolicyUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="h-dvh max-h-screen overflow-hidden bg-white flex flex-col justify-between max-w-md mx-auto border-x border-slate-200 select-none">
      {/* 1. Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top Header Navigation */}
        <header className="p-4 flex items-center justify-between shrink-0">
          {screen !== "welcome" ? (
            <button
              onClick={() => {
                setErrorMsg(null);
                if (screen === "login") setScreen("welcome");
                else if (screen === "signup_name") setScreen("welcome");
                else if (screen === "signup_dob") setScreen("signup_name");
                else if (screen === "signup_username") setScreen("signup_dob");
                else if (screen === "signup_email") setScreen("signup_username");
                else if (screen === "signup_password") setScreen("signup_email");
              }}
              className="p-2 -ml-2 text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-6 h-6 text-slate-900 stroke-[2.5]" />
            </button>
          ) : (
            <button
              onClick={onCancel}
              className="p-2 -ml-2 text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              aria-label="Close"
            >
              <ArrowLeft className="w-6 h-6 text-slate-900 stroke-[2.5]" />
            </button>
          )}

          {/* Original Brand Logo in Top Right */}
          <div className="flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Open Desh Logo"
              className="h-8 sm:h-9 max-w-[140px] object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith("/assets/logo.svg")) {
                  target.src = "/assets/logo.svg";
                }
              }}
            />
          </div>
        </header>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mx-5 mb-2 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 animate-fadeIn shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold leading-tight">{errorMsg}</p>
          </div>
        )}

        {/* SCREEN 1: WELCOME SCREEN */}
        {screen === "welcome" && (
          <div className="flex-1 flex flex-col justify-between px-5 pb-2 min-h-0">
            {/* Top Prompt Pill Banner */}
            <div className="py-2 px-4 bg-blue-50/90 border border-blue-200/80 rounded-2xl text-blue-700 font-bold text-xs sm:text-sm text-center shadow-2xs shrink-0">
              {actionReason || "Sign in to unlock verified citizen actions."}
            </div>

            {/* Central Brand Identity */}
            <div className="flex flex-col items-center text-center my-auto py-2">
              {/* Centered Original Logo */}
              <div className="flex items-center justify-center py-2">
                <img
                  src="/logo.png"
                  alt="Open Desh Logo"
                  className="h-16 sm:h-20 max-w-[240px] object-contain mx-auto transition-transform hover:scale-105"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.endsWith("/assets/logo.svg")) {
                      target.src = "/assets/logo.svg";
                    }
                  }}
                />
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1">
                Open Desh
              </h1>
              <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mt-1">
                OPEN VOICE, OPEN DESH
              </p>
              <p className="text-xs text-slate-600 font-medium max-w-xs sm:max-w-sm mx-auto mt-2 leading-relaxed px-2">
                Connect your citizen identity to file real-time grievances, evaluate public representatives, and access statutory citizen SLA charters.
              </p>
            </div>

            {/* Action Buttons & Legal Note */}
            <div className="space-y-2.5 shrink-0 mb-3">
              {/* Continue with Google */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-full font-bold text-slate-800 text-sm flex items-center justify-center gap-3 shadow-2xs transition-all cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Create account with Email */}
              <button
                onClick={() => {
                  setErrorMsg(null);
                  setScreen("signup_name");
                }}
                className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-full font-bold text-slate-800 text-sm flex items-center justify-center gap-3 shadow-2xs transition-all cursor-pointer"
              >
                <Mail className="w-5 h-5 text-slate-600" />
                <span>Create account with Email</span>
              </button>

              {/* Interactive Legal Links */}
              <p className="text-[11px] text-slate-500 text-center font-medium leading-relaxed pt-1 px-3">
                By continuing, you agree to our{" "}
                <button
                  onClick={() => setLegalModal("terms")}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Terms of Service
                </button>
                ,{" "}
                <button
                  onClick={() => setLegalModal("privacy")}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Privacy Policy
                </button>{" "}
                and{" "}
                <button
                  onClick={() => setLegalModal("cookies")}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Cookie Use
                </button>
                .
              </p>
            </div>
          </div>
        )}

        {/* SCREEN 2: LOGIN WITH USERNAME & EMAIL */}
        {screen === "login" && (
          <div className="flex-1 flex flex-col justify-between px-6 pt-2 pb-6 min-h-0">
            <form onSubmit={handleDirectLogin} className="flex-1 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950 tracking-tight">
                  Login with username & email
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1 mb-5">
                  Sign in with your verified Open Desh username or registered email address.
                </p>

                <div className="space-y-3.5">
                  <div>
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="Username or email address"
                      className="w-full text-base font-medium text-slate-900 placeholder:text-slate-400 p-3.5 border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      autoFocus
                    />
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full text-base font-medium text-slate-900 placeholder:text-slate-400 p-3.5 pr-12 border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Login Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || !loginIdentifier.trim() || !loginPassword.trim()}
                  className={`w-full py-3.5 rounded-full font-black text-sm tracking-wide transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 ${
                    !loginIdentifier.trim() || !loginPassword.trim() || loading
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Log in"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SIGNUP STEP 1: Full Name */}
        {screen === "signup_name" && (
          <div className="flex-1 flex flex-col justify-between px-6 pt-2 pb-6 min-h-0">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                What's your name?
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1 mb-8">
                Enter your real citizen name as you'd like it to appear on your profile.
              </p>

              <input
                type="text"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="John Smith"
                className="w-full text-xl font-bold text-slate-900 placeholder:text-slate-300 pb-3 border-b-2 border-slate-300 focus:border-blue-600 outline-none transition-all"
                autoFocus
              />
            </div>

            <div>
              <button
                onClick={handleNameNext}
                disabled={!signupName.trim()}
                className={`w-full py-3.5 rounded-full font-black text-sm tracking-wide transition-all shadow-sm cursor-pointer ${
                  !signupName.trim()
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* SIGNUP STEP 2: Date of Birth (Scrollable + Swipeable + Clickable) */}
        {screen === "signup_dob" && (
          <div className="flex-1 flex flex-col justify-between px-6 pt-2 pb-6 min-h-0">
            <div className="shrink-0">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                When's your<br />birthday?
              </h2>
              <p className="text-sm font-medium text-slate-500 mt-2">
                Your birthday won't be shown publicly
              </p>

              {/* Formatted Date Display */}
              <div className="text-3xl sm:text-4xl font-bold text-slate-950 mt-6 sm:mt-8 tracking-tight">
                {formattedDisplay}
              </div>
            </div>

            {/* Three-Column Wheel Roller Date Picker */}
            <div className="mt-auto mb-4 py-2">
              <div className="relative">
                {/* Top Divider Line */}
                <div className="absolute top-[38px] left-0 right-0 border-t border-slate-300 pointer-events-none" />

                {/* Bottom Divider Line */}
                <div className="absolute top-[86px] left-0 right-0 border-b border-slate-300 pointer-events-none" />

                <div className="grid grid-cols-3 text-center items-center select-none py-1">
                  {/* Column 1: Day */}
                  <WheelColumn
                    label="Day"
                    currentValue={safeDay}
                    prevValue={prevDay}
                    nextValue={nextDay}
                    onStep={handleStepDay}
                  />

                  {/* Column 2: Month */}
                  <WheelColumn
                    label="Month"
                    currentValue={MONTHS[selectedMonthIndex].full}
                    prevValue={MONTHS[prevMonthIndex].full}
                    nextValue={MONTHS[nextMonthIndex].full}
                    onStep={handleStepMonth}
                  />

                  {/* Column 3: Year */}
                  <WheelColumn
                    label="Year"
                    currentValue={selectedYear}
                    prevValue={prevYear}
                    nextValue={nextYear <= new Date().getFullYear() ? nextYear : ""}
                    onStep={handleStepYear}
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                onClick={handleDobNext}
                className="w-full py-3.5 rounded-full font-black text-sm tracking-wide transition-all shadow-sm cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* SIGNUP STEP 3: Username */}
        {screen === "signup_username" && (
          <div className="flex-1 flex flex-col justify-between px-6 pt-2 pb-6 min-h-0">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                Give yourself a username
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1 mb-6">
                Your @handle is how other citizens and public representatives will find you.
              </p>

              <div className="flex items-center gap-2 pb-3 border-b-2 border-slate-300 focus-within:border-blue-600 transition-all">
                <span className="text-xl font-bold text-slate-400">@</span>
                <input
                  type="text"
                  value={signupUsername}
                  onChange={(e) => {
                    setSignupUsername(e.target.value);
                    setUsernameValid(null);
                  }}
                  placeholder="OpenDesh"
                  className="w-full text-xl font-bold text-slate-900 placeholder:text-slate-300 outline-none"
                  autoFocus
                />
              </div>

              {usernameChecking && (
                <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Checking username availability...</span>
                </div>
              )}

              {usernameValid === true && (
                <p className="mt-2 text-xs font-semibold text-emerald-600">
                  ✓ @{signupUsername.replace(/^@+/, "")} is available!
                </p>
              )}

              {usernameValid === false && (
                <p className="mt-2 text-xs font-semibold text-rose-600">
                  ✕ {usernameReason}
                </p>
              )}
            </div>

            <button
              onClick={handleUsernameNext}
              disabled={usernameChecking || !signupUsername.trim()}
              className={`w-full py-3.5 rounded-full font-black text-sm tracking-wide transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 ${
                !signupUsername.trim() || usernameChecking
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {usernameChecking ? <Loader2 className="w-5 h-5 animate-spin" /> : "Next"}
            </button>
          </div>
        )}

        {/* SIGNUP STEP 4: Email */}
        {screen === "signup_email" && (
          <div className="flex-1 flex flex-col justify-between px-6 pt-2 pb-6 min-h-0">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                Enter your email address
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1 mb-8">
                Used to securely log in and verify grievance progress notices.
              </p>

              <input
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="citizen@example.com"
                className="w-full text-xl font-bold text-slate-900 placeholder:text-slate-300 pb-3 border-b-2 border-slate-300 focus:border-blue-600 outline-none transition-all"
                autoFocus
              />
            </div>

            <div>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                By continuing, you agree to receive civic notification updates regarding public reports.
              </p>
              <button
                onClick={handleEmailNext}
                disabled={!signupEmail.trim()}
                className={`w-full py-3.5 rounded-full font-black text-sm tracking-wide transition-all shadow-sm cursor-pointer ${
                  !signupEmail.trim()
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* SIGNUP STEP 5: Password */}
        {screen === "signup_password" && (
          <div className="flex-1 flex flex-col justify-between px-6 pt-2 pb-6 min-h-0">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                Choose a password
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1 mb-8">
                Make sure it's at least 6 characters with letters or numbers.
              </p>

              <div className="relative pb-3 border-b-2 border-slate-300 focus-within:border-blue-600 transition-all">
                <input
                  type={showPassword ? "text" : "password"}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full text-xl font-bold text-slate-900 placeholder:text-slate-300 outline-none pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleCompleteSignup}
              disabled={loading || signupPassword.length < 6}
              className={`w-full py-3.5 rounded-full font-black text-sm tracking-wide transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 ${
                signupPassword.length < 6 || loading
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create account"}
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM BAR: @ Login with username & email > */}
      {screen === "welcome" && (
        <button
          onClick={() => {
            setErrorMsg(null);
            setScreen("login");
          }}
          className="w-full bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 border-t border-slate-200 py-4 px-6 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <span className="text-base font-bold text-slate-600">@</span>
          <span className="text-sm sm:text-base font-bold text-slate-700">Login with username & email</span>
          <ChevronRight className="w-4 h-4 text-slate-500 stroke-[2.5]" />
        </button>
      )}

      {/* FULL LEGAL / POLICY READER MODAL */}
      {legalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
            {/* Top Browser / URL Bar Simulation */}
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 truncate select-all">
                  {getPolicyUrl()}
                </span>
                <button
                  onClick={handleCopyLink}
                  title="Copy official policy URL"
                  className="ml-auto p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                onClick={() => setLegalModal(null)}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Title Banner */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2.5 bg-blue-50/50">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-900 capitalize">
                  {legalModal === "terms" && "Open Desh Terms of Service & SLA Charter"}
                  {legalModal === "privacy" && "Citizen Privacy Policy & Data Charter"}
                  {legalModal === "cookies" && "Cookie & Local Storage Policy"}
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold">
                  Official statutory compliance guidelines (Updated 2026)
                </p>
              </div>
            </div>

            {/* Scrollable Policy Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed font-normal">
              {legalModal === "terms" && (
                <>
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-900 text-sm">1. Citizen Identity & Grievance Authenticity</h4>
                    <p>
                      Open Desh provides a civic governance platform connecting citizens with elected representatives and government authorities. By submitting reports or grievances, you affirm that all submitted evidence, descriptions, and geo-coordinates represent authentic public issues.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-900 text-sm">2. Representative Routing & Statutory Charters</h4>
                    <p>
                      Grievances logged on Open Desh are indexed under official citizen SLA timelines aligned with the Right to Information (RTI Act 2005) and CPGRAMS central guidelines. Misuse, abusive language, or deliberate misinformation is strictly prohibited and subject to account suspension.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-900 text-sm">3. 1-Voter-1-Review Policy</h4>
                    <p>
                      Leader performance metrics and reviews adhere to our single-vote integrity protocol to prevent artificial manipulation of public accountability scores.
                    </p>
                  </div>
                </>
              )}

              {legalModal === "privacy" && (
                <>
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-900 text-sm">1. Zero Public Phone/Aadhaar Disclosure</h4>
                    <p>
                      Your private mobile number, date of birth, and email credentials are never displayed publicly on leader scorecards or public report feeds. Only your public citizen display name and chosen @handle are visible.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-900 text-sm">2. Geo-Location & Evidence Transparency</h4>
                    <p>
                      When reporting a civic issue (e.g., potholes, water supply disruptions), GPS coordinates are utilized solely to tag the responsible municipal department desk (e.g. NHAI, Municipal Corporation, Jal Board) and ensure resolution verification.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-900 text-sm">3. Data Retention & Erasure Rights</h4>
                    <p>
                      Citizens maintain full control over their account data and may request profile updates or account closure at any time through our verified help desk.
                    </p>
                  </div>
                </>
              )}

              {legalModal === "cookies" && (
                <>
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-900 text-sm">1. Essential Authentication Storage</h4>
                    <p>
                      We utilize secure local storage and essential session cookies strictly to keep your citizen session authenticated across sessions and preserve your selected language preference.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-900 text-sm">2. No Third-Party Commercial Tracking</h4>
                    <p>
                      Open Desh does NOT sell user behavioral data to third-party ad networks. All cookie mechanisms operate purely for platform security and civic feed delivery.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Modal Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <a
                href={getPolicyUrl()}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Read on help.opendesh.com</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setLegalModal(null)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                I Understand & Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
