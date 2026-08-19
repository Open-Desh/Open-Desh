import React from "react";
import { UserPlus, Sparkles, Activity, Search, X, Bookmark } from "lucide-react";
import { UserProfile } from "../types.ts";

interface HeaderProps {
  currentView: string;
  onOpenMobileSidebar: () => void;
  onNavigate: (view: string) => void;
  userProfile: UserProfile;
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
  bookmarkedCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onOpenMobileSidebar,
  onNavigate,
  userProfile,
  searchQuery = "",
  onSearchQueryChange,
  bookmarkedCount = 0,
}) => {
  const isBookmarkView = currentView === "bookmark" || currentView === "bookmarks";

  return (
    <header
      id="main-header"
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md h-[54px] md:h-[60px] border-b border-slate-200/80 flex items-center justify-between px-3 md:px-6 transition-all duration-200"
    >
      {/* Left Item: Avatar on Mobile, Brand on Desktop */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          id="mobile-sidebar-open-btn"
          onClick={onOpenMobileSidebar}
          className="md:hidden w-8 h-8 rounded-full overflow-hidden shadow-xs hover:scale-105 active:scale-95 transition-transform shrink-0 ring-1 ring-slate-200"
          title="Open Menu"
        >
          <img
            src={userProfile.avatarUrl}
            alt={userProfile.fullName}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </button>

        {/* Desktop Brand */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => onNavigate("dashboard")}
            className="flex items-center gap-2 text-left group cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="text-[13px] font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                Open Nation
              </span>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                {isBookmarkView ? "Saved Feed" : "Civic Workspace"}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Center: Search Bar on Bookmark View OR Centered Logo on Other Views */}
      {isBookmarkView ? (
        <div className="flex-1 mx-2 sm:mx-4 max-w-lg">
          <div
            id="header-bookmark-search-container"
            className="w-full relative transition-all duration-200"
          >
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-blue-600 absolute left-3 pointer-events-none" />
              <input
                id="header-bookmark-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange && onSearchQueryChange(e.target.value)}
                placeholder="Search saved bookmarks..."
                className="w-full bg-slate-100 hover:bg-slate-150 focus:bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm pl-9 pr-8 py-2 rounded-full border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchQueryChange && onSearchQueryChange("")}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center flex-1">
          <button
            id="header-center-logo-btn"
            onClick={() => onNavigate("dashboard")}
            className="flex items-center justify-center py-1 px-2 rounded-xl hover:opacity-80 active:scale-95 transition-all cursor-pointer"
            title="Open Nation Home"
          >
            <img
              src="/assets/logo.svg"
              alt="Open Nation Logo"
              className="h-7 md:h-8 max-w-[150px] md:max-w-[180px] object-contain transition-transform duration-200"
              referrerPolicy="no-referrer"
            />
          </button>
        </div>
      )}

      {/* Right: Actions, AI Tutor & Connect Pill */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Scale Telemetry Pill (Desktop) */}
        <button
          id="header-scale-pill-btn"
          onClick={() => onNavigate("analytics")}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-full transition-colors cursor-pointer"
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
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-[11px] font-bold transition-colors cursor-pointer"
          title="AI Civic Legal Tutor"
        >
          <Sparkles className="w-3 h-3 text-blue-600" />
          <span className="hidden md:inline">AI Tutor</span>
        </button>

        {/* Connect / Townhall button */}
        <button
          id="header-connect-btn"
          onClick={() => onNavigate("connect")}
          className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Public Townhall & Connect"
        >
          <UserPlus className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

