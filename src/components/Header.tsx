import React from "react";
import { UserPlus, Sparkles, Activity } from "lucide-react";
import { UserProfile } from "../types.ts";

interface HeaderProps {
  currentView: string;
  onOpenMobileSidebar: () => void;
  onNavigate: (view: string) => void;
  userProfile: UserProfile;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onOpenMobileSidebar,
  onNavigate,
  userProfile,
}) => {
  return (
    <header
      id="main-header"
      className="sticky top-0 z-40 bg-white/85 backdrop-blur-md h-[54px] md:h-[60px] border-none flex items-center justify-between px-3.5 md:px-6 transition-all duration-200 relative"
    >
      {/* Left: Mobile Profile Avatar or Desktop Quick Nav */}
      <div className="flex items-center gap-3 min-w-0 z-10 flex-1">
        <button
          id="mobile-sidebar-open-btn"
          onClick={onOpenMobileSidebar}
          className="md:hidden w-8 h-8 rounded-full overflow-hidden shadow-xs hover:scale-105 active:scale-95 transition-transform shrink-0 ring-1 ring-slate-200/60"
          title="Open Menu"
        >
          <img
            src={userProfile.avatarUrl}
            alt={userProfile.fullName}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </button>

        {/* Desktop Brand / Breadcrumb */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => onNavigate("dashboard")}
            className="flex items-center gap-2 text-left group"
          >
            <div className="flex flex-col">
              <span className="text-[13px] font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                Omkun Orbit
              </span>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                Civic Workspace
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Center: Custom Logo Image (X / Twitter style centered logo) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10">
        <button
          id="header-center-logo-btn"
          onClick={() => onNavigate("dashboard")}
          className="flex items-center justify-center py-1 px-2 rounded-xl hover:opacity-80 active:scale-95 transition-all cursor-pointer"
          title="Omkun Orbit Home"
        >
          <img
            src="/assets/logo.svg"
            alt="Omkun Orbit Logo"
            className="h-7 md:h-8 max-w-[150px] md:max-w-[180px] object-contain transition-transform duration-200"
            referrerPolicy="no-referrer"
          />
        </button>
      </div>

      {/* Right: Actions, AI Tutor & Profile Pill */}
      <div className="flex items-center gap-2 md:gap-3 z-10 flex-1 justify-end">
        {/* Scale Telemetry Pill (Desktop) */}
        <button
          id="header-scale-pill-btn"
          onClick={() => onNavigate("analytics")}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100/70 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-full transition-colors"
          title="View 100k Scalability Metrics"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-extrabold tracking-tight flex items-center gap-1">
            <Activity className="w-3 h-3 text-blue-600" /> 104.8k
          </span>
        </button>

        {/* AI Tutor Quick Pill */}
        <button
          id="header-ai-tutor-quick-btn"
          onClick={() => onNavigate("aitutor")}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-[11px] font-bold transition-colors"
          title="AI Civic Legal Tutor"
        >
          <Sparkles className="w-3 h-3 text-blue-600" />
          <span className="hidden md:inline">AI Tutor</span>
        </button>

        {/* Connect / Townhall button */}
        <button
          id="header-connect-btn"
          onClick={() => onNavigate("connect")}
          className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-100/80 hover:bg-blue-50 text-slate-700 hover:text-blue-600 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          title="Public Townhall & Connect"
        >
          <UserPlus className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
