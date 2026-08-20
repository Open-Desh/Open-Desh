import React from "react";
import { Check, Clock, AlertCircle } from "lucide-react";
import { UserCategory } from "../types.ts";

export interface CategoryBadgeProps {
  category?: UserCategory | string;
  verified?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  onClick?: () => void;
}

// 4 Official Color Specifications:
// Citizen: 🔵 Royal Blue (#2563eb / blue-600)
// Business: 🟡 Golden Yellow (#eab308 / #f59e0b / amber-500)
// Department: 🟤 Brown / Bronze (#78350f / amber-900 / #8B4513)
// Representative: 🟢 Emerald Green (#16a34a / emerald-600)

export const getCategoryBadgeConfig = (category?: UserCategory | string) => {
  const cat = typeof category === "string" ? category.toLowerCase() : category;
  switch (cat) {
    case "business":
      return {
        label: "Verified Business",
        shortLabel: "Business",
        categoryTitle: "BUSINESS / COMPANY",
        tickColor: "bg-amber-500",
        tickBorder: "border-amber-400",
        textColor: "text-amber-900",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-300",
        ringColor: "ring-amber-500/30",
        glowColor: "shadow-amber-500/20",
        buttonStyle: "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-400/80 shadow-amber-500/10",
        hexColor: "#f59e0b",
        symbolEmoji: "🟡",
        themeName: "Yellow Tick",
        description: "Corporate, Enterprise & MSME verified organization",
      };
    case "department":
      return {
        label: "Verified Govt Dept",
        shortLabel: "Govt Dept",
        categoryTitle: "DEPARTMENT",
        tickColor: "bg-[#78350f]",
        tickBorder: "border-amber-800",
        textColor: "text-[#582707]",
        bgColor: "bg-[#fcf6f0]",
        borderColor: "border-[#b45309]/30",
        ringColor: "ring-[#78350f]/30",
        glowColor: "shadow-[#78350f]/20",
        buttonStyle: "bg-[#fcf6f0] hover:bg-[#f5e9dc] text-[#78350f] border-[#b45309]/50 shadow-[#78350f]/10",
        hexColor: "#78350f",
        symbolEmoji: "🟤",
        themeName: "Brown Tick",
        description: "Official government department, municipal board or nodal agency",
      };
    case "representative":
      return {
        label: "Verified Leader",
        shortLabel: "Representative",
        categoryTitle: "REPRESENTATIVE",
        tickColor: "bg-emerald-600",
        tickBorder: "border-emerald-500",
        textColor: "text-emerald-900",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-300",
        ringColor: "ring-emerald-600/30",
        glowColor: "shadow-emerald-600/20",
        buttonStyle: "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-400/80 shadow-emerald-600/10",
        hexColor: "#16a34a",
        symbolEmoji: "🟢",
        themeName: "Green Tick",
        description: "Elected public representative, MP, MLA, Minister, or Councillor",
      };
    case "citizen":
    default:
      return {
        label: "Verified Citizen",
        shortLabel: "Citizen",
        categoryTitle: "CITIZEN",
        tickColor: "bg-blue-600",
        tickBorder: "border-blue-500",
        textColor: "text-blue-900",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-300",
        ringColor: "ring-blue-600/30",
        glowColor: "shadow-blue-600/20",
        buttonStyle: "bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-400/80 shadow-blue-600/10",
        hexColor: "#2563eb",
        symbolEmoji: "🔵",
        themeName: "Blue Tick",
        description: "Authenticated Indian citizen voter and civic contributor",
      };
  }
};

/**
 * Category-colored Verified Tick Icon
 */
export const CategoryVerifiedTick: React.FC<{
  category?: UserCategory | string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  animate?: boolean;
}> = ({ category = "citizen", size = "sm", className = "", animate = false }) => {
  const config = getCategoryBadgeConfig(category);

  const sizeClasses = {
    xs: "w-3.5 h-3.5 p-0.5",
    sm: "w-4 h-4 p-0.5",
    md: "w-5 h-5 p-0.5",
    lg: "w-6 h-6 p-1",
  };

  const iconSizes = {
    xs: "w-2.5 h-2.5",
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full text-white font-black shrink-0 ${
        config.tickColor
      } ${sizeClasses[size]} ${animate ? "animate-pulse" : ""} ${className}`}
      title={`${config.label} (${config.themeName})`}
    >
      <Check className={`${iconSizes[size]} stroke-[3.5]`} />
    </span>
  );
};

/**
 * Category-specific "Get Verified" / "Under Review" Button
 */
export const CategoryGetVerifiedButton: React.FC<{
  category?: UserCategory | string;
  status?: "none" | "pending" | "approved" | "rejected";
  onClick: () => void;
  className?: string;
}> = ({ category = "citizen", status = "none", onClick, className = "" }) => {
  const config = getCategoryBadgeConfig(category);

  if (status === "pending") {
    return (
      <button
        type="button"
        id="profile-verification-pending-btn"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer border shadow-2xs hover:shadow-xs active:scale-95 group bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-amber-500/10 ${className}`}
        title="Verification application is under manual admin review"
      >
        <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center p-0.5 animate-pulse">
          <Clock className="w-2.5 h-2.5 stroke-[3]" />
        </span>
        <span className="font-extrabold text-[11px]">Under Review ⏳</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      id="profile-get-verified-btn"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer border shadow-2xs hover:shadow-xs active:scale-95 group ${config.buttonStyle} ${className}`}
      title={`Apply for official ${config.themeName} verification`}
    >
      <CategoryVerifiedTick category={category} size="xs" animate={false} />
      <span>Get verified</span>
    </button>
  );
};

/**
 * Category Badge Component with optional full label
 */
export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category = "citizen",
  verified = false,
  size = "sm",
  showLabel = true,
  className = "",
  onClick,
}) => {
  const config = getCategoryBadgeConfig(category);

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border shadow-2xs transition-all ${
        config.bgColor
      } ${config.textColor} ${config.borderColor} ${
        onClick ? "cursor-pointer hover:opacity-90 active:scale-95" : "cursor-default"
      } ${className}`}
      title={`${config.categoryTitle} ${verified ? `(${config.themeName})` : ""}`}
    >
      {verified && <CategoryVerifiedTick category={category} size={size === "lg" ? "md" : "xs"} />}
      {showLabel && <span>{config.categoryTitle}</span>}
    </div>
  );
};
