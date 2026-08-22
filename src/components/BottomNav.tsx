import React from "react";
import { Home, Search, Plus, Building2, Bell } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.tsx";

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenCreateReport: () => void;
  unreadNotificationsCount?: number;
  visible?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenCreateReport,
  unreadNotificationsCount = 0,
  visible = true,
}) => {
  const { t } = useLanguage();

  return (
    <nav
      id="bottom-nav"
      className={`md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white rounded-t-2xl border-t border-slate-200/80 shadow-[0_-5px_25px_rgba(0,0,0,0.08)] px-2 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
        visible ? "translate-y-0" : "translate-y-[150%] pointer-events-none"
      }`}
    >
      <div className="flex items-center justify-around h-16 relative">
        {/* 1. Home */}
        <button
          id="bottom-nav-home"
          onClick={() => onNavigate("dashboard")}
          className={`flex flex-col items-center justify-center flex-1 transition-colors ${
            currentView === "dashboard" ? "text-blue-600 font-bold" : "text-slate-500 font-medium"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-1">{t("bottom.home", "Home")}</span>
        </button>

        {/* 2. Search */}
        <button
          id="bottom-nav-search"
          onClick={() => onNavigate("search")}
          className={`flex flex-col items-center justify-center flex-1 transition-colors ${
            currentView === "search" ? "text-blue-600 font-bold" : "text-slate-500 font-medium"
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] mt-1">{t("bottom.search", "Search")}</span>
        </button>

        {/* 3. Center Highlighted (+) Create Button */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            id="bottom-nav-create-report-btn"
            onClick={onOpenCreateReport}
            className="flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-600 to-blue-700 text-white rounded-full shadow-[0_6px_20px_rgba(37,99,235,0.45)] border-4 border-white active:scale-95 transition-transform cursor-pointer"
            title="Create New Report"
          >
            <Plus className="w-7 h-7 stroke-[2.8]" />
          </button>
        </div>

        {/* 4. Notifications */}
        <button
          id="bottom-nav-notifications"
          onClick={() => onNavigate("notifications")}
          className={`relative flex flex-col items-center justify-center flex-1 transition-colors ${
            currentView === "notifications" ? "text-blue-600 font-bold" : "text-slate-500 font-medium"
          }`}
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1.5 flex h-3.5 min-w-[14px] px-0.5 items-center justify-center rounded-full bg-rose-500 text-white text-[8px] font-black border border-white">
                {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1">{t("bottom.notifications", "Alerts")}</span>
        </button>

        {/* 5. Infrastructure */}
        <button
          id="bottom-nav-infra"
          onClick={() => onNavigate("infrastructure")}
          className={`flex flex-col items-center justify-center flex-1 transition-colors ${
            currentView === "infrastructure" ? "text-blue-600 font-bold" : "text-slate-500 font-medium"
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-[10px] mt-1">{t("bottom.infra", "Infra")}</span>
        </button>
      </div>
    </nav>
  );
};
