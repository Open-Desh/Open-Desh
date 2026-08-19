import React from "react";
import { Briefcase, UserPlus, Sparkles, Activity } from "lucide-react";
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
  const getTitle = () => {
    switch (currentView) {
      case "dashboard":
        return "Civic Feed & Reports";
      case "aitutor":
        return "AI Civic Legal Tutor";
      case "leader":
        return "Leader Performance Tracker";
      case "infrastructure":
        return "Infrastructure Projects";
      case "bookmark":
        return "Saved Civic Issues";
      case "analytics":
        return "100k User Scale & Telemetry";
      case "profile":
        return "Account & Role Dashboard";
      case "settings":
        return "Category & Preferences";
      case "connect":
        return "Public Townhall";
      case "search":
        return "Universal Governance Search";
      default:
        return "Omkun Orbit Workspace";
    }
  };

  return (
    <header
      id="main-header"
      className="sticky top-0 z-40 bg-white/90 backdrop-blur-md h-[62px] border-b border-slate-200/80 flex items-center justify-between px-4 md:px-8 transition-transform duration-300 relative shadow-sm"
    >
      {/* Left: Mobile Profile Icon & Desktop Title */}
      <div className="flex items-center gap-3.5 min-w-0 z-10 flex-1 md:flex-none">
        <button
          id="mobile-sidebar-open-btn"
          onClick={onOpenMobileSidebar}
          className="md:hidden w-9 h-9 rounded-full overflow-hidden border border-slate-200 shadow-sm hover:scale-105 active:scale-95 transition-transform shrink-0"
          title="Open Menu"
        >
          <img
            src={userProfile.avatarUrl}
            alt={userProfile.fullName}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </button>

        <div className="hidden md:flex flex-col">
          <h1 id="header-title" className="text-[15px] font-black text-slate-900 tracking-tight leading-none mb-1">
            {getTitle()}
          </h1>
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-3 h-3 text-blue-600" />
            <span
              id="header-workspace-name"
              className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest truncate max-w-[200px]"
            >
              Omkun Orbit Governance Grid
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Center Title */}
      <div className="md:hidden flex items-center justify-center pointer-events-none z-0">
        <span className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5 pointer-events-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
          Omkun Orbit
        </span>
      </div>

      {/* Right: Scale Indicator, AI Status & Profile Action */}
      <div className="flex items-center gap-3 md:gap-4 z-10 flex-1 md:flex-none justify-end">
        {/* Scale Telemetry Pill */}
        <button
          id="header-scale-pill-btn"
          onClick={() => onNavigate("analytics")}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 rounded-full transition-colors"
          title="View 100k Scalability Metrics"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-bold text-blue-900 tracking-tight flex items-center gap-1">
            <Activity className="w-3 h-3 text-blue-600" /> 104.8k Users Active
          </span>
        </button>

        {/* AI Tutor Pill */}
        <button
          id="header-ai-tutor-quick-btn"
          onClick={() => onNavigate("aitutor")}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-[11px] font-bold shadow-sm hover:opacity-95 transition-opacity"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Civic Tutor</span>
        </button>

        {/* User Role Tag & Avatar Button */}
        <div className="flex items-center gap-2.5">
          <div className="hidden lg:flex flex-col items-end">
            <span id="header-user-name" className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
              {userProfile.fullName}
            </span>
            <span
              id="header-user-role"
              className="text-[9px] font-black text-blue-700 uppercase tracking-wider bg-blue-50 px-1.5 py-0.5 rounded"
            >
              {userProfile.category}
            </span>
          </div>

          <button
            id="header-connect-btn"
            onClick={() => onNavigate("connect")}
            className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-600 flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-slate-200/80 shadow-sm"
            title="Public Townhall & Connect"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
