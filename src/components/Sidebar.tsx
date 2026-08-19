import React from "react";
import {
  Home,
  User,
  TrendingUp,
  Building2,
  Bookmark,
  Bot,
  Activity,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Users,
} from "lucide-react";
import { UserProfile } from "../types.ts";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  userProfile: UserProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  userProfile,
}) => {
  const [darkMode, setDarkMode] = React.useState(false);

  const primaryNav = [
    { id: "dashboard", label: "Home Feed", icon: Home },
    { id: "aitutor", label: "AI Civic Tutor", icon: Bot, badge: "Gemini" },
    { id: "leader", label: "Leader Tracker", icon: TrendingUp },
    { id: "infrastructure", label: "Infrastructure", icon: Building2 },
    { id: "bookmark", label: "Bookmarks", icon: Bookmark },
    { id: "analytics", label: "100k Cloud Scale", icon: Activity, badge: "Live" },
    { id: "profile", label: "My Profile", icon: User },
    { id: "connect", label: "Public Townhall", icon: Users },
  ];

  const secondaryNav = [
    { id: "settings", label: "Settings & Category", icon: Settings },
    { id: "help", label: "Civic Help Centre", icon: HelpCircle },
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
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] md:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        id="sidebar"
        className={`fixed inset-y-0 left-0 bg-white border-r border-slate-200 z-[200] flex flex-col h-screen shadow-2xl md:shadow-none transition-all duration-300 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${isCollapsed ? "md:w-20" : "md:w-[260px]"} w-[260px]`}
      >
        {/* Profile Card Header */}
        <div className="px-5 pt-5 pb-3 shrink-0">
          <div className="flex justify-between items-start mb-2">
            <button
              id="sidebar-profile-avatar-btn"
              onClick={() => {
                onNavigate("profile");
                onCloseMobile();
              }}
              className="w-11 h-11 rounded-full overflow-hidden border-2 border-blue-600/30 shadow-sm hover:scale-105 transition-transform"
              title="Open Profile"
            >
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.fullName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </button>
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${role.bg} ${
                isCollapsed ? "hidden" : "block"
              }`}
            >
              {role.label}
            </span>
          </div>

          {!isCollapsed && (
            <div className="mt-1 transition-opacity duration-200">
              <h2 className="text-[17px] font-bold text-slate-900 leading-tight truncate">
                {userProfile.fullName}
              </h2>
              <p className="text-slate-500 text-xs mb-2 truncate">@{userProfile.username}</p>
              <div className="flex gap-3 text-xs text-slate-600">
                <span>
                  <strong className="text-slate-900 font-bold">{userProfile.followingCount}</strong> Following
                </span>
                <span>
                  <strong className="text-slate-900 font-bold">{userProfile.followersCount}</strong> Followers
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200/70 my-1"></div>

        {/* Navigation Menu */}
        <nav id="sidebar-menu" className="flex-1 overflow-y-auto no-scrollbar py-2 space-y-0.5">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center px-4 py-3 text-[15px] font-bold transition-colors group relative ${
                  isActive
                    ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 border-l-4 border-transparent"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? "text-blue-600" : "text-slate-600"
                  } ${!isCollapsed ? "mr-3" : ""}`}
                />
                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span
                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      item.badge === "Gemini"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                        : "bg-emerald-100 text-emerald-700 animate-pulse"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="border-t border-slate-200/70 my-2"></div>

          {secondaryNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center px-4 py-2.5 text-[14px] font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-4 border-transparent"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-blue-600" : "text-slate-500"
                  } ${!isCollapsed ? "mr-3" : ""}`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}

          {/* Dark / Light Mode Toggle Button */}
          <div className={`px-4 py-2 mt-2 ${isCollapsed ? "flex justify-center px-0" : ""}`}>
            <button
              id="theme-toggle-btn"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors flex items-center gap-2 text-xs font-semibold"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
              {!isCollapsed && <span>{darkMode ? "Light Theme" : "Theme Preference"}</span>}
            </button>
          </div>
        </nav>

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
