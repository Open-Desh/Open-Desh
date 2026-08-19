import React from "react";
import {
  User,
  TrendingUp,
  Building2,
  Bookmark,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
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

  // Exact requested 6 page links
  const navItems = [
    { id: "profile", label: "Profile", icon: User },
    { id: "leader", label: "Leader", icon: TrendingUp },
    { id: "infrastructure", label: "Infrastructure", icon: Building2 },
    { id: "bookmark", label: "Bookmark", icon: Bookmark },
    { id: "settings", label: "Setting & Privacy", icon: Settings },
    { id: "help", label: "Help Center", icon: HelpCircle },
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
          <div className="flex justify-between items-start mb-3">
            <button
              id="sidebar-profile-avatar-btn"
              onClick={() => {
                onNavigate("profile");
                onCloseMobile();
              }}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-blue-600/30 shadow-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer"
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
              className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${role.bg} ${
                isCollapsed ? "hidden" : "block"
              }`}
            >
              {role.label}
            </span>
          </div>

          {!isCollapsed && (
            <div className="mt-1 space-y-1">
              <h2 className="text-lg sm:text-[19px] font-black text-slate-900 leading-tight truncate">
                {userProfile.fullName}
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm truncate">@{userProfile.username}</p>
              <div className="flex gap-4 text-xs sm:text-sm text-slate-600 pt-1.5">
                <span>
                  <strong className="text-slate-900 font-bold">{userProfile.followingCount || 0}</strong> Following
                </span>
                <span>
                  <strong className="text-slate-900 font-bold">{userProfile.followersCount || 0}</strong> Followers
                </span>
              </div>
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
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200/80 mx-4"></div>

        {/* Theme Toggle Button at Bottom */}
        <div className={`p-4 ${isCollapsed ? "flex justify-center p-2" : ""}`}>
          <button
            id="theme-toggle-btn"
            onClick={() => setDarkMode(!darkMode)}
            className="w-full p-2.5 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-3 text-xs sm:text-sm font-bold cursor-pointer"
            title="Toggle Theme"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-amber-500 shrink-0" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600 shrink-0" />
            )}
            {!isCollapsed && <span>{darkMode ? "Light Theme" : "Theme Preference"}</span>}
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
