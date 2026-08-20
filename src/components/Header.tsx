import React, { useState, useEffect } from "react";
import { UserPlus, HelpCircle, Activity, Search, X, LogIn } from "lucide-react";
import { UserProfile } from "../types.ts";

interface HeaderProps {
  currentView: string;
  onOpenMobileSidebar: () => void;
  onNavigate: (view: string) => void;
  userProfile: UserProfile;
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
  bookmarkedCount?: number;
  isLoggedIn?: boolean;
  onOpenLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onOpenMobileSidebar,
  onNavigate,
  userProfile,
  searchQuery = "",
  onSearchQueryChange,
  bookmarkedCount = 0,
  isLoggedIn = false,
  onOpenLogin,
}) => {
  const isBookmarkView = currentView === "bookmark" || currentView === "bookmarks";
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          // When near the top, always show header
          if (currentY < 15) {
            setIsVisible(true);
          } else if (currentY > lastY + 5 && currentY > 60) {
            // Scrolling down (feed moves up) -> hide header
            setIsVisible(false);
          } else if (currentY < lastY - 5) {
            // Scrolling up (feed moves down) -> show header
            setIsVisible(true);
          }
          lastY = currentY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      id="main-header"
      className={`sticky top-0 z-40 bg-white h-[60px] md:h-[66px] flex items-center justify-between px-3 md:px-6 transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      {/* Left Item: Avatar on Mobile, Brand on Desktop */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          id="mobile-sidebar-open-btn"
          onClick={onOpenMobileSidebar}
          className="md:hidden w-[37px] h-[37px] rounded-full overflow-hidden shadow-2xs hover:scale-105 active:scale-95 transition-transform shrink-0 relative cursor-pointer"
          title="Open Menu"
        >
          <img
            src={userProfile.avatarUrl}
            alt={userProfile.fullName}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {isLoggedIn && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"></span>
          )}
        </button>

        {/* Desktop Brand */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => onNavigate("dashboard")}
            className="flex items-center gap-2 text-left group cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="text-[15px] font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                Open Desh
              </span>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                {isBookmarkView ? "Saved Feed" : "Civic Workspace"}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Center: Search Bar on Bookmark View OR Centered Larger Logo on Other Views */}
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
            className="flex items-center justify-center py-1 px-2 rounded-xl hover:opacity-85 active:scale-95 transition-all cursor-pointer"
            title="Open Desh Home"
          >
            <img
              src="/logo.png"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith("/assets/logo.svg")) {
                  target.src = "/assets/logo.svg";
                }
              }}
              alt="Open Desh Logo"
              className="h-9 md:h-11 max-w-[185px] md:max-w-[230px] object-contain transition-transform duration-200"
              referrerPolicy="no-referrer"
            />
          </button>
        </div>
      )}

      {/* Right: Clean Actions without border with slightly larger icons */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {!isLoggedIn ? (
          <button
            id="header-signin-btn"
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-blue-600 text-white rounded-full text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Sign In with Firebase"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        ) : (
          <button
            id="header-profile-quick-btn"
            onClick={() => onNavigate("profile")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-full text-xs font-bold transition-colors cursor-pointer"
            title="Verified Citizen Account"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Online</span>
          </button>
        )}

        {/* Scale Telemetry Pill (Desktop) */}
        <button
          id="header-scale-pill-btn"
          onClick={() => onNavigate("analytics")}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-full transition-colors cursor-pointer"
          title="View 100k Scalability Metrics"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-extrabold tracking-tight flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-blue-600" /> 104.8k
          </span>
        </button>

        {/* Help Center Quick Pill */}
        <button
          id="header-help-quick-btn"
          onClick={() => onNavigate("help")}
          className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-xs font-bold transition-colors cursor-pointer"
          title="Civic Rights & Help Center"
        >
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span className="hidden md:inline">Help</span>
        </button>

        {/* Connect & Discover People button matching DP size */}
        <button
          id="header-connect-btn"
          onClick={() => onNavigate("connect")}
          className="w-10 h-10 rounded-full text-slate-800 hover:text-blue-600 hover:bg-blue-50/80 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Connect & Discover People"
        >
          <UserPlus className="w-6 h-6 stroke-[2.2]" />
        </button>
      </div>
    </header>
  );
};


