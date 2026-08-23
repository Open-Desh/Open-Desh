import React from "react";
import {
  User,
  IndianRupee,
  TrendingUp,
  Building2,
  Bookmark,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogIn,
  LogOut,
  Languages,
  Bell,
  Users,
} from "lucide-react";
import { UserProfile } from "../types.ts";
import { useLanguage } from "../context/LanguageContext.tsx";
import { CategoryVerifiedTick } from "./CategoryBadge.tsx";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  userProfile: UserProfile;
  unreadNotificationsCount?: number;
  isLoggedIn?: boolean;
  onOpenLogin?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  userProfile,
  unreadNotificationsCount = 0,
  isLoggedIn = false,
  onOpenLogin,
  onLogout,
}) => {
  const [darkMode, setDarkMode] = React.useState(() => {
    try {
      const saved = localStorage.getItem("open_desh_theme");
      if (saved) return saved === "dark";
      return document.documentElement.classList.contains("dark");
    } catch {
      return false;
    }
  });

  const { t, currentLanguageInfo, openLanguageModal } = useLanguage();

  // Sync dark mode class on <html> document element and save in localStorage
  React.useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("open_desh_theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("open_desh_theme", "light");
      }
    } catch (e) {
      console.warn("Theme storage error:", e);
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  // Navigation links with Budget below Profile and Language below Setting & Privacy
  const navItems = [
    { id: "profile", label: t("nav.profile", "Profile"), icon: User },
    { id: "budget", label: t("nav.budget", "Budget"), icon: IndianRupee },
    { id: "infrastructure", label: t("nav.infrastructure", "Infrastructure"), icon: Building2 },
    { id: "bookmark", label: t("nav.bookmark", "Bookmark"), icon: Bookmark },
    { id: "settings", label: t("nav.settings", "Setting & Privacy"), icon: Settings },
    {
      id: "language",
      label: `${t("nav.language", "Language")} (${currentLanguageInfo.nativeName})`,
      icon: Languages,
      isAction: true,
      badge: currentLanguageInfo.nativeName,
    },
    { id: "help", label: t("nav.help", "Help Center"), icon: HelpCircle },
  ];

  const getRoleBadge = (category: string) => {
    switch (category) {
      case "department":
        return { label: "Department", bg: "bg-amber-100 text-amber-800" };
      case "representative":
        return { label: "Representative", bg: "bg-purple-100 text-purple-800" };
      default:
        return { label: "Citizen", bg: "bg-blue-100 text-blue-800" };
    }
  };

  const role = getRoleBadge(userProfile.category);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          id="sidebar-overlay"
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[150] md:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Aside (80% width on mobile) */}
      <aside
        id="sidebar"
        className={`fixed inset-y-0 left-0 bg-white border-r border-slate-200 z-[200] flex flex-col h-screen shadow-2xl md:shadow-none transition-all duration-300 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${isCollapsed ? "md:w-20" : "md:w-[260px]"} w-[80vw] sm:w-[80%] max-w-[340px]`}
      >
        {/* Profile Card Header */}
        <div className="px-5 pt-6 pb-4 shrink-0">
          {isLoggedIn ? (
            <>
              <div className="flex justify-between items-start mb-3">
                <button
                  id="sidebar-profile-avatar-btn"
                  onClick={() => {
                    onNavigate("profile");
                    onCloseMobile();
                  }}
                  className="w-13 h-13 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-blue-600/30 shadow-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer relative"
                  title="Open Profile"
                >
                  <img
                    src={
                      userProfile.avatarUrl ||
                      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80"
                    }
                    alt={userProfile.fullName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span
                    className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white"
                    title="Signed In"
                  ></span>
                </button>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${role.bg} ${
                      isCollapsed ? "hidden" : "block"
                    }`}
                  >
                    {role.label}
                  </span>
                </div>
              </div>

              {!isCollapsed && (
                <div className="mt-1 space-y-1">
                  <h2 className="text-lg sm:text-[19px] font-black text-slate-900 leading-tight truncate flex items-center gap-1.5">
                    <span>
                      {userProfile.fullName ||
                        (userProfile.username ? userProfile.username.replace(/^@+/, "") : "Citizen")}
                    </span>
                    {userProfile.verified && (
                      <CategoryVerifiedTick category={userProfile.category} size="xs" />
                    )}
                  </h2>
                  <div className="flex gap-4 text-xs sm:text-sm text-slate-600 pt-1.5">
                    <span>
                      <strong className="text-slate-900 font-bold">
                        {userProfile.followingCount || 0}
                      </strong>{" "}
                      {t("nav.following", "Following")}
                    </span>
                    <span>
                      <strong className="text-slate-900 font-bold">
                        {userProfile.followersCount || 0}
                      </strong>{" "}
                      {t("nav.followers", "Followers")}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Guest / Unauthenticated State */
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                  <User className="w-6 h-6" />
                </div>
                {!isCollapsed && (
                  <div className="min-w-0">
                    <h2 className="text-sm font-black text-slate-900 truncate">
                      {t("nav.guest", "Guest Citizen")}
                    </h2>
                    <p className="text-[11px] text-slate-500 truncate">Not signed in</p>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {t("nav.signInPrompt", "Sign in to track your grievances and access your verified profile.")}
                  </p>
                  <button
                    id="sidebar-signin-header-btn"
                    onClick={() => {
                      onOpenLogin && onOpenLogin();
                      onCloseMobile();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{t("nav.signInBtn", "Sign In to Account")}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200/80 mx-4"></div>

        {/* Navigation Menu (Larger Icons & Text) */}
        <nav id="sidebar-menu" className="flex-1 overflow-y-auto no-scrollbar py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => {
                  if (item.id === "language") {
                    openLanguageModal();
                    onCloseMobile();
                    return;
                  }
                  if (item.id === "profile" && !isLoggedIn) {
                    if (onOpenLogin) onOpenLogin();
                    onCloseMobile();
                    return;
                  }
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center px-5 py-3.5 sm:py-4 text-[16px] sm:text-[17px] font-bold transition-all group relative cursor-pointer ${
                  isActive
                    ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600 font-extrabold"
                    : "text-slate-800 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-6 h-6 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? "text-blue-600 stroke-[2.4]" : "text-slate-600 stroke-[2]"
                  } ${!isCollapsed ? "mr-4" : ""}`}
                />
                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0 pr-1">
                    <span className="truncate text-left">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 shrink-0 border border-sky-200">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200/80 mx-4"></div>

        {/* Bottom Auth & Theme Bar */}
        <div className={`p-4 space-y-1.5 ${isCollapsed ? "flex flex-col items-center p-2" : ""}`}>
          {isLoggedIn ? (
            <button
              id="sidebar-logout-btn"
              onClick={onLogout}
              className="w-full p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-3 text-xs sm:text-sm font-bold cursor-pointer"
              title={t("nav.signOut", "Sign Out")}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>{t("nav.signOut", "Sign Out")}</span>}
            </button>
          ) : (
            <button
              id="sidebar-login-bottom-btn"
              onClick={() => {
                onOpenLogin && onOpenLogin();
                onCloseMobile();
              }}
              className="w-full p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors flex items-center gap-3 text-xs sm:text-sm font-bold cursor-pointer"
              title={t("nav.signIn", "Sign In")}
            >
              <LogIn className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>{t("nav.signIn", "Sign In")}</span>}
            </button>
          )}

          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className="w-full p-2.5 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-3 text-xs sm:text-sm font-bold cursor-pointer"
            title="Toggle Theme"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-amber-500 shrink-0" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600 shrink-0" />
            )}
            {!isCollapsed && <span>{darkMode ? "Light Theme" : t("nav.theme", "Theme Preference")}</span>}
          </button>
        </div>

        {/* Desktop Collapse Toggle Button */}
        <button
          id="desktop-toggle-sidebar-btn"
          onClick={onToggleCollapse}
          className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-3.5 w-7 h-7 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-500 hover:text-blue-600 shadow-md cursor-pointer z-[250] transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </aside>
    </>
  );
};

