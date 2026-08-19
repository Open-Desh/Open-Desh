import React, { useState } from "react";
import {
  ArrowLeft,
  User,
  KeyRound,
  Download,
  UserX,
  Shield,
  Eye,
  MapPin,
  Bell,
  VolumeX,
  Languages,
  Palette,
  EyeOff,
  Wifi,
  Scale,
  FileText,
  ShieldAlert,
  Info,
  ChevronRight,
  Check,
  Search,
  Lock,
  Smartphone,
  Mail,
  AlertTriangle,
  ExternalLink,
  Building,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { UserProfile } from "../types.ts";

interface SettingsViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  onNavigate: (view: string) => void;
  onBackToHome: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  onUpdateProfile,
  onNavigate,
  onBackToHome,
}) => {
  // Navigation stack for full-screen drilldown (No popups!)
  const [currentScreen, setCurrentScreen] = useState<string>("main");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Account Settings States
  const [phone, setPhone] = useState<string>("+91 98765 43210");
  const [email, setEmail] = useState<string>("citizen@opendesh.in");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English (India)");
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false);

  // Privacy & Safety Toggles
  const [anonymousWhistleblower, setAnonymousWhistleblower] = useState<boolean>(false);
  const [preciseLocation, setPreciseLocation] = useState<boolean>(true);
  const [allowLeaderDirectMessages, setAllowLeaderDirectMessages] = useState<boolean>(true);
  const [publicGrievanceTimeline, setPublicGrievanceTimeline] = useState<boolean>(true);
  const [allowOfficialTagging, setAllowOfficialTagging] = useState<boolean>(true);

  // Display & Data Toggles
  const [lowDataMode, setLowDataMode] = useState<boolean>(false);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<string>("Medium");

  // Download Archive State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportComplete, setExportComplete] = useState<boolean>(false);

  // Languages list for India
  const indianLanguages = [
    { name: "English (India)", native: "English", code: "en-IN" },
    { name: "Hindi", native: "हिन्दी", code: "hi" },
    { name: "Bengali", native: "বাংলা", code: "bn" },
    { name: "Telugu", native: "తెలుగు", code: "te" },
    { name: "Marathi", native: "मराठी", code: "mr" },
    { name: "Tamil", native: "தமிழ்", code: "ta" },
    { name: "Gujarati", native: "ગુજરાતી", code: "gu" },
    { name: "Kannada", native: "ಕನ್ನಡ", code: "kn" },
    { name: "Odia", native: "ଓଡ଼ିଆ", code: "or" },
    { name: "Punjabi", native: "ਪੰਜਾਬੀ", code: "pa" },
  ];

  const handleDownloadData = () => {
    setIsExporting(true);
    setTimeout(() => {
      const dataToExport = {
        platform: "Open Desh Civic Governance & Accountability Platform",
        exportTimestamp: new Date().toISOString(),
        dpdpComplianceReference: "DPDPA-2023-SEC-6(1)-RIGHT-TO-DATA-ACCESS",
        userProfile: {
          id: userProfile.id,
          name: userProfile.fullName,
          username: userProfile.username,
          category: userProfile.category,
          followingCount: userProfile.followingCount,
          followersCount: userProfile.followersCount,
          systemScore: userProfile.systemScore,
          savedReportsCount: userProfile.savedReports?.length || 0,
        },
        dataProtectionOfficer: {
          officerName: "Shri Rajeshwar Verma (Legal & Grievance Officer)",
          jurisdiction: "New Delhi, Republic of India",
          email: "grievance-officer@opendesh.in",
        },
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `open_desh_civic_archive_${userProfile.username}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
      setExportComplete(true);
    }, 1200);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) return;
    setPasswordSuccess(true);
    setTimeout(() => {
      setPasswordSuccess(false);
      setCurrentScreen("your_account");
    }, 1500);
  };

  // Reusable Page Header with Back Arrow and Subtitle
  const renderHeader = (title: string, subtitle: string, onBack: () => void) => (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center gap-4">
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors active:scale-95 cursor-pointer shrink-0"
        title="Go Back"
      >
        <ArrowLeft className="w-5 h-5 text-slate-800" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate">
          {title}
        </h1>
        <p className="text-xs text-slate-500 truncate">@{userProfile.username} • {subtitle}</p>
      </div>
    </div>
  );

  /* ----------------------------------------------------
   * 1. MAIN SETTINGS & PRIVACY MENU
   * ---------------------------------------------------- */
  if (currentScreen === "main") {
    const sections = [
      {
        id: "your_account",
        title: "Your account",
        description:
          "See information about your account, download an archive of your civic data, or learn about account deactivation.",
        icon: User,
      },
      {
        id: "privacy_safety",
        title: "Privacy and safety",
        description:
          "Manage what information you see and share on Open Desh, location precision, and whistleblower protection.",
        icon: Shield,
      },
      {
        id: "accessibility_display",
        title: "Accessibility, display and languages",
        description:
          "Manage display contrast, regional Indian languages, and low-bandwidth data usage optimizations.",
        icon: Palette,
      },
      {
        id: "legal_notices",
        title: "Legal notices & Indian compliance",
        description:
          "DPDP Act 2023, IT Rules 2021 Grievance Officer, RTI Act 2005 SLAs, and Citizen Charters.",
        icon: Scale,
      },
      {
        id: "about_platform",
        title: "About Open Desh",
        description:
          "Platform version 2.4.0, 100k cloud scale architecture, and representative scoring rubric.",
        icon: Info,
      },
    ];

    return (
      <div className="w-full max-w-2xl mx-auto bg-white min-h-screen pb-24 md:pb-12 animate-fadeIn">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer shrink-0"
              title="Return to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Settings and privacy
              </h1>
              <p className="text-xs text-slate-500">@{userProfile.username}</p>
            </div>
          </div>
        </div>

        {/* Search Settings Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings..."
              className="w-full bg-white text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Sections List */}
        <div className="divide-y divide-slate-100">
          {sections
            .filter(
              (s) =>
                !searchQuery.trim() ||
                s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.description.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setCurrentScreen(section.id)}
                  className="w-full p-4 sm:p-5 flex items-start justify-between gap-3 text-left hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h2 className="text-sm sm:text-[15px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {section.title}
                      </h2>
                      <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 shrink-0 mt-2" />
                </button>
              );
            })}
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------
   * 2. YOUR ACCOUNT SCREEN
   * ---------------------------------------------------- */
  if (currentScreen === "your_account") {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white min-h-screen pb-24 md:pb-12 animate-fadeIn">
        {renderHeader("Your account", "Account Management", () => setCurrentScreen("main"))}

        <div className="p-4 sm:p-5 text-xs sm:text-sm text-slate-500 border-b border-slate-100">
          See information about your citizen profile, security credentials, download an archive of your municipal grievances, or deactivate your account.
        </div>

        <div className="divide-y divide-slate-100">
          {/* Account Information */}
          <button
            onClick={() => setCurrentScreen("account_info")}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <User className="w-5 h-5 text-slate-600 group-hover:text-blue-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">Account information</h3>
                <p className="text-xs text-slate-500">See your phone number, email address, and verification state.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>

          {/* Change Password */}
          <button
            onClick={() => setCurrentScreen("change_password")}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <KeyRound className="w-5 h-5 text-slate-600 group-hover:text-blue-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">Change your password</h3>
                <p className="text-xs text-slate-500">Update your security passkey and cloud sessions.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>

          {/* Download Civic Data Archive */}
          <button
            onClick={() => setCurrentScreen("download_archive")}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <Download className="w-5 h-5 text-slate-600 group-hover:text-blue-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">Download an archive of your data</h3>
                <p className="text-xs text-slate-500">Get insights into all grievances, votes, and reports stored under DPDP Act 2023.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>

          {/* Deactivate Account */}
          <button
            onClick={() => setCurrentScreen("deactivate_account")}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-rose-50/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <UserX className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-rose-600">Deactivate your account</h3>
                <p className="text-xs text-slate-500">Find out how you can deactivate or purge your citizen records.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------
   * 2A. ACCOUNT INFORMATION SCREEN
   * ---------------------------------------------------- */
  if (currentScreen === "account_info") {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white min-h-screen pb-24 md:pb-12 animate-fadeIn">
        {renderHeader("Account information", "Personal Details", () => setCurrentScreen("your_account"))}

        <div className="divide-y divide-slate-100">
          <div className="p-4 sm:p-5 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Username</span>
            <div className="text-sm font-bold text-slate-900">@{userProfile.username}</div>
          </div>

          <div className="p-4 sm:p-5 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">{phone}</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Verified (OTP)</span>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">{email}</span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Primary</span>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Role Category</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold capitalize text-slate-900">{userProfile.category}</span>
              <span className="text-xs font-extrabold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                Constituency: Ranchi Central
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Voter & Aadhaar Verification</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">Digital KYC Verified</span>
              <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> SLA Priority #1
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------
   * 2B. CHANGE PASSWORD SCREEN
   * ---------------------------------------------------- */
  if (currentScreen === "change_password") {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white min-h-screen pb-24 md:pb-12 animate-fadeIn">
        {renderHeader("Change your password", "Security Passkey", () => setCurrentScreen("your_account"))}

        <form onSubmit={handlePasswordChange} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters with 1 number"
              required
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>

          {passwordSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" /> Password updated successfully!
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Update Password
          </button>
        </form>
      </div>
    );
  }

  /* ----------------------------------------------------
   * 2C. DOWNLOAD DATA ARCHIVE SCREEN (DPDP Act 2023)
   * ---------------------------------------------------- */
  if (currentScreen === "download_archive") {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white min-h-screen pb-24 md:pb-12 animate-fadeIn">
        {renderHeader("Download an archive", "Right to Data Portability", () => setCurrentScreen("your_account"))}

        <div className="p-5 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Download className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-slate-900">
              Download your complete Civic & Grievance History
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Under <strong>Section 6(1) of the Digital Personal Data Protection (DPDP) Act 2023</strong>, you have the statutory right to access and download a digital copy of all grievances filed, evidence logs, leader reviews, and account interactions.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
            <div className="font-bold text-slate-900">Archive bundle includes:</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Civic Grievance Reports & Department Progress Logs</li>
              <li>Public Leader Ratings & SLA Audits</li>
              <li>Cloudflare R2 Media Upload Metadata</li>
              <li>Verification Timestamp & Legislative Constituency mapping</li>
            </ul>
          </div>

          {exportComplete && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" /> Archive generated and downloaded to your device!
            </div>
          )}

          <button
            onClick={handleDownloadData}
            disabled={isExporting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isExporting ? (
              <span>Generating Secure Archive (DPDPA Compliant)...</span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Request & Download JSON Archive</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------
   * 2D. DEACTIVATE ACCOUNT SCREEN
   * ---------------------------------------------------- */
  if (currentScreen === "deactivate_account") {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white min-h-screen pb-24 md:pb-12 animate-fadeIn">
        {renderHeader("Deactivate account", "Purge Citizen Account", () => setCurrentScreen("your_account"))}

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-rose-50 text-rose-900 rounded-xl border border-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-xs font-bold">This will permanently purge your civic profile after 30 days.</span>
          </div>

          <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
            <h3 className="text-sm font-bold text-slate-900">What else you should know:</h3>
            <p>
              • Your ongoing public grievances filed under Right to Information or Municipal Charters will be anonymized to maintain constituency resolution tracking records.
            </p>
            <p>
              • Under the DPDP Act 2023, your personal identity credentials (Phone, Email, Aadhaar linkage) will be immediately removed from our active database.
            </p>
          </div>

          <button
            onClick={() => {
              alert("Deactivation request registered. You will be logged out.");
              onNavigate("dashboard");
            }}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer"
          >
            Deactivate @{userProfile.username}
          </button>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------
   * 3. PRIVACY AND SAFETY SCREEN
   * ---------------------------------------------------- */
  if (currentScreen === "privacy_safety") {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white min-h-screen pb-24 md:pb-12 animate-fadeIn">
        {renderHeader("Privacy and safety", "Audience & Data Protection", () => setCurrentScreen("main"))}

        <div className="p-4 sm:p-5 text-xs text-slate-500 border-b border-slate-100">
          Manage what information you share on Open Nation, anonymous whistleblower protections, and location tracking precision.
        </div>

        <div className="divide-y divide-slate-100">
          {/* Whistleblower Mode Toggle */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="space-y-1 pr-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">Anonymous Whistleblower Mode</span>
                <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded">
                  Anti-Corruption
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Automatically mask your name and avatar when reporting bribery or corruption under the <strong>Whistleblowers Protection Act, 2014</strong>.
              </p>
            </div>
            <input
              type="checkbox"
              checked={anonymousWhistleblower}
              onChange={(e) => setAnonymousWhistleblower(e.target.checked)}
              className="w-5 h-5 accent-blue-600 shrink-0 cursor-pointer"
            />
          </div>

          {/* Location GPS Precision */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="space-y-1 pr-2">
              <span className="text-sm font-bold text-slate-900">Precise Municipal GPS Geotagging</span>
              <p className="text-xs text-slate-500 leading-relaxed">
                Include high-accuracy GPS coordinates in grievance reports for rapid PWD/Municipal routing.
              </p>
            </div>
            <input
              type="checkbox"
              checked={preciseLocation}
              onChange={(e) => setPreciseLocation(e.target.checked)}
              className="w-5 h-5 accent-blue-600 shrink-0 cursor-pointer"
            />
          </div>

          {/* Official Tagging & Routing */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="space-y-1 pr-2">
              <span className="text-sm font-bold text-slate-900">Allow Elected Leaders to Respond</span>
              <p className="text-xs text-slate-500 leading-relaxed">
                Allow tagged MLAs, MPs, and Ward Councilors to post verified official interventions on your grievance posts.
              </p>
            </div>
            <input
              type="checkbox"
              checked={allowOfficialTagging}
              onChange={(e) => setAllowOfficialTagging(e.target.checked)}
              className="w-5 h-5 accent-blue-600 shrink-0 cursor-pointer"
            />
          </div>

          {/* Public Grievance Feed Visibility */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="space-y-1 pr-2">
              <span className="text-sm font-bold text-slate-900">Public Citizen Timeline</span>
              <p className="text-xs text-slate-500 leading-relaxed">
                Publish your non-emergency reports to the city-wide public feed to mobilize community upvotes.
              </p>
            </div>
            <input
              type="checkbox"
              checked={publicGrievanceTimeline}
              onChange={(e) => setPublicGrievanceTimeline(e.target.checked)}
              className="w-5 h-5 accent-blue-600 shrink-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------
   * 4. ACCESSIBILITY, DISPLAY & LANGUAGES SCREEN
   * ---------------------------------------------------- */
  if (currentScreen === "accessibility_display") {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white min-h-screen pb-24 md:pb-12 animate-fadeIn">
        {renderHeader("Accessibility, display and languages", "Preferences", () => setCurrentScreen("main"))}

        <div className="divide-y divide-slate-100">
          {/* Languages Selector */}
          <button
            onClick={() => setCurrentScreen("languages_list")}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <Languages className="w-5 h-5 text-slate-600 group-hover:text-blue-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">Regional Indian Languages</h3>
                <p className="text-xs text-slate-500">Currently: {selectedLanguage}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>

          {/* Low-Data Mode for 2G/3G */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-4 pr-2">
              <Wifi className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Low-Bandwidth Data Saver</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Optimize images and reduce network usage for rural 2G/3G connectivity across Indian districts.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={lowDataMode}
              onChange={(e) => setLowDataMode(e.target.checked)}
              className="w-5 h-5 accent-blue-600 shrink-0 cursor-pointer"
            />
          </div>

          {/* High Contrast Mode */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-4 pr-2">
              <Palette className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">High Contrast Mode</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Increase text contrast and border sharpness for outdoor sunlight readability.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={highContrast}
              onChange={(e) => setHighContrast(e.target.checked)}
              className="w-5 h-5 accent-blue-600 shrink-0 cursor-pointer"
            />
          </div>

          {/* Reduce Motion */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-4 pr-2">
              <EyeOff className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Reduce Motion & Transitions</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Minimize UI animation loops and slider effects.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={reduceMotion}
              onChange={(e) => setReduceMotion(e.target.checked)}
              className="w-5 h-5 accent-blue-600 shrink-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------
   * 4A. REGIONAL LANGUAGES SELECTION SCREEN
   * ---------------------------------------------------- */
  if (currentScreen === "languages_list") {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white min-h-screen pb-24 md:pb-12 animate-fadeIn">
        {renderHeader("Languages of India", "Select App Language", () => setCurrentScreen("accessibility_display"))}

        <div className="divide-y divide-slate-100">
          {indianLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setSelectedLanguage(lang.name);
                setCurrentScreen("accessibility_display");
              }}
              className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div>
                <div className="text-sm font-bold text-slate-900">{lang.name}</div>
                <div className="text-xs text-slate-500">{lang.native}</div>
              </div>
              {selectedLanguage === lang.name && (
                <Check className="w-5 h-5 text-blue-600 stroke-[2.5]" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------
   * 5. LEGAL NOTICES & INDIAN COMPLIANCE SCREEN
   * ---------------------------------------------------- */
  if (currentScreen === "legal_notices") {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white min-h-screen pb-24 md:pb-12 animate-fadeIn">
        {renderHeader("Legal notices & compliance", "Indian Statutory Framework", () => setCurrentScreen("main"))}

        <div className="p-4 sm:p-5 text-xs text-slate-500 border-b border-slate-100">
          Open Desh operates strictly under the legal frameworks of the Republic of India to ensure citizen rights and data privacy.
        </div>

        <div className="divide-y divide-slate-100">
          {/* DPDP Act 2023 */}
          <button
            onClick={() => setCurrentScreen("dpdp_act_policy")}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">
                  Digital Personal Data Protection (DPDP) Act, 2023
                </h3>
                <p className="text-xs text-slate-500">Citizen consent, data fiduciary obligations, and right to erase.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>

          {/* IT Rules 2021 & Grievance Officer */}
          <button
            onClick={() => setCurrentScreen("it_rules_grievance")}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <Scale className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">
                  IT Rules, 2021 & Grievance Officer
                </h3>
                <p className="text-xs text-slate-500">Resident Grievance Officer contact details and nodal escalation.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>

          {/* RTI Act 2005 & Citizen SLA Charter */}
          <button
            onClick={() => setCurrentScreen("rti_sla_charter")}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <FileText className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">
                  RTI Act, 2005 & Citizen SLA Charters
                </h3>
                <p className="text-xs text-slate-500">Right to Information timelines, municipal turnaround, and CPGRAMS.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------
   * 5A. DPDP ACT 2023 FULL POLICY PAGE
   * ---------------------------------------------------- */
  if (currentScreen === "dpdp_act_policy") {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white min-h-screen pb-24 md:pb-12 animate-fadeIn">
        {renderHeader("DPDP Act, 2023 Compliance", "Statutory Data Notice", () => setCurrentScreen("legal_notices"))}

        <div className="p-5 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <div className="p-3.5 bg-blue-50 text-blue-900 font-bold rounded-xl border border-blue-200">
            Official Compliance Statement under Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023).
          </div>

          <h3 className="text-base font-extrabold text-slate-900 pt-2">1. Data Fiduciary Obligations</h3>
          <p>
            Open Desh acts as a registered Data Fiduciary for Indian citizens. Personal information (Phone numbers, GPS Geotags, Identification records) is collected strictly under informed digital consent for the sole purpose of civic grievance redressal and legislative representative accountability.
          </p>

          <h3 className="text-base font-extrabold text-slate-900 pt-2">2. Rights of Data Principals (Citizens)</h3>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Right to Access Summary:</strong> You can download a structured summary of all data processed using the "Download Data Archive" setting.</li>
            <li><strong>Right to Correction and Erasure:</strong> You can request complete erasure of your personal data upon account deactivation.</li>
            <li><strong>Right of Grievance Redressal:</strong> Citizens can escalate privacy violations directly to our Data Protection Officer.</li>
          </ul>

          <h3 className="text-base font-extrabold text-slate-900 pt-2">3. Storage & Sovereign Data Localization</h3>
          <p>
            All citizen data is stored securely in India-region cloud infrastructure adhering to CERT-In cybersecurity directives.
          </p>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------
   * 5B. IT RULES 2021 & GRIEVANCE OFFICER FULL PAGE
   * ---------------------------------------------------- */
  if (currentScreen === "it_rules_grievance") {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white min-h-screen pb-24 md:pb-12 animate-fadeIn">
        {renderHeader("IT Rules, 2021 Compliance", "Grievance Redressal", () => setCurrentScreen("legal_notices"))}

        <div className="p-5 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <p>
            In accordance with the <strong>Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>, the contact details of the Resident Grievance Officer are provided below:
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="text-sm font-extrabold text-slate-900">Resident Grievance Officer (India)</div>
            <div><strong>Name:</strong> Shri Rajeshwar Verma</div>
            <div><strong>Designation:</strong> Chief Legal & Compliance Officer</div>
            <div><strong>Email:</strong> grievance-officer@opendesh.in</div>
            <div><strong>Address:</strong> Open Desh Civic Secretariat, Connaught Place, New Delhi - 110001</div>
            <div><strong>Acknowledgment SLA:</strong> Within 24 hours of ticket receipt</div>
            <div><strong>Resolution SLA:</strong> Within 15 calendar days as mandated by Rule 3(2)</div>
          </div>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------
   * 5C. RTI ACT & CITIZEN SLA CHARTER FULL PAGE
   * ---------------------------------------------------- */
  if (currentScreen === "rti_sla_charter") {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white min-h-screen pb-24 md:pb-12 animate-fadeIn">
        {renderHeader("RTI Act & Citizen SLA Charters", "Timelines & SLAs", () => setCurrentScreen("legal_notices"))}

        <div className="p-5 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <h3 className="text-base font-extrabold text-slate-900">Citizen Service Level Agreement (SLA) Matrix</h3>
          <p>
            Grievances filed on Open Desh are automatically synchronized with municipal departments (PWD, Electricity Board, Water Board, Municipal Corporation) adhering to the following statutory escalation timelines:
          </p>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-xs">
            <div className="p-3 bg-slate-100 font-bold grid grid-cols-2 text-slate-900">
              <span>Department Category</span>
              <span>Mandatory Resolution SLA</span>
            </div>
            <div className="p-3 grid grid-cols-2 bg-white">
              <span className="font-bold">Sanitation & Garbage</span>
              <span className="text-emerald-700 font-extrabold">24 - 48 Hours</span>
            </div>
            <div className="p-3 grid grid-cols-2 bg-slate-50">
              <span className="font-bold">Transformer & Power Failure</span>
              <span className="text-emerald-700 font-extrabold">24 - 72 Hours</span>
            </div>
            <div className="p-3 grid grid-cols-2 bg-white">
              <span className="font-bold">Water Pipeline Leakage</span>
              <span className="text-emerald-700 font-extrabold">48 Hours</span>
            </div>
            <div className="p-3 grid grid-cols-2 bg-slate-50">
              <span className="font-bold">Potholes & PWD Road Subsidence</span>
              <span className="text-emerald-700 font-extrabold">7 - 14 Days</span>
            </div>
            <div className="p-3 grid grid-cols-2 bg-white">
              <span className="font-bold">Anti-Corruption (ACB/Lokpal)</span>
              <span className="text-emerald-700 font-extrabold">Immediate Triage</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------
   * 6. ABOUT PLATFORM FULL PAGE
   * ---------------------------------------------------- */
  if (currentScreen === "about_platform") {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white min-h-screen pb-24 md:pb-12 animate-fadeIn">
        {renderHeader("About Open Desh", "Architecture & Mission", () => setCurrentScreen("main"))}

        <div className="p-5 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <img
              src="/assets/logo.svg"
              alt="Open Desh Logo"
              className="h-9 object-contain"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="text-sm font-black text-slate-900">Open Desh Civic Platform</div>
              <div className="text-xs text-blue-700 font-bold">Version 2.4.0 (Enterprise Cloud Edition)</div>
            </div>
          </div>

          <p>
            Open Desh is an enterprise civic governance, elected leader accountability, and real-time grievance redressal ecosystem engineered for 100,000+ Indian citizens and public representatives.
          </p>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="font-bold text-slate-900">System Architecture Highlights:</div>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Database Layer:</strong> Cloud Firestore with Zero-Trust ABAC Security Rules.</li>
              <li><strong>Media Storage:</strong> Cloudflare R2 multi-image distributed bucket storage.</li>
              <li><strong>Statutory Triage:</strong> Automated departmental SLA and statutory routing engine.</li>
              <li><strong>Leader Scoring:</strong> 5-Pillar Public Performance Index (Max 100 pts).</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
