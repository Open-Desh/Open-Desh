import React from "react";
import { Clock } from "lucide-react";
import { UserCategory } from "../types.ts";

export interface CategoryBadgeProps {
  category?: UserCategory | string;
  verified?: boolean;
  verifiedCategory?: UserCategory | string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  className?: string;
  onClick?: () => void;
}

// 4 Official Color Specifications with modern Meta / Facebook style Scalloped Rosette:
// 1. Citizen: 🔵 Sky/Royal Blue Rosette (#1d9bf0 / #2563eb)
// 2. Business: 🟡 Golden Amber Rosette (#f59e0b / #d97706)
// 3. Department: 🟤 Brown / Bronze Rosette (#78350f / #92400e)
// 4. Representative: 🟢 Emerald Green Rosette (#10b981 / #059669)

export const getCategoryBadgeConfig = (category?: UserCategory | string) => {
  const cat = typeof category === "string" ? category.toLowerCase() : category;
  switch (cat) {
    case "business":
      return {
        label: "Verified Business",
        shortLabel: "Business",
        categoryTitle: "BUSINESS / COMPANY",
        gradientFrom: "#fbbf24", // Amber 400
        gradientTo: "#d97706",   // Amber 600
        shadowColor: "rgba(217, 119, 6, 0.4)",
        textColor: "text-amber-900",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-300",
        ringColor: "ring-amber-500/30",
        glowColor: "shadow-amber-500/20",
        buttonStyle: "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-400/80 shadow-amber-500/10",
        hexColor: "#f59e0b",
        symbolEmoji: "🟡",
        themeName: "Gold Badge",
        description: "Corporate, Enterprise & MSME verified organization",
      };
    case "department":
      return {
        label: "Verified Govt Dept",
        shortLabel: "Govt Dept",
        categoryTitle: "DEPARTMENT",
        gradientFrom: "#92400e", // Bronze / Amber 800
        gradientTo: "#78350f",   // Deep Brown 900
        shadowColor: "rgba(120, 53, 15, 0.4)",
        textColor: "text-[#582707]",
        bgColor: "bg-[#fcf6f0]",
        borderColor: "border-[#b45309]/30",
        ringColor: "ring-[#78350f]/30",
        glowColor: "shadow-[#78350f]/20",
        buttonStyle: "bg-[#fcf6f0] hover:bg-[#f5e9dc] text-[#78350f] border-[#b45309]/50 shadow-[#78350f]/10",
        hexColor: "#78350f",
        symbolEmoji: "🟤",
        themeName: "Bronze Badge",
        description: "Official government department, municipal board or nodal agency",
      };
    case "representative":
      return {
        label: "Verified Leader",
        shortLabel: "Representative",
        categoryTitle: "REPRESENTATIVE",
        gradientFrom: "#10b981", // Emerald 500
        gradientTo: "#047857",   // Emerald 700
        shadowColor: "rgba(5, 150, 105, 0.4)",
        textColor: "text-emerald-900",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-300",
        ringColor: "ring-emerald-600/30",
        glowColor: "shadow-emerald-600/20",
        buttonStyle: "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-400/80 shadow-emerald-600/10",
        hexColor: "#16a34a",
        symbolEmoji: "🟢",
        themeName: "Green Badge",
        description: "Elected public representative, MP, MLA, Minister, or Councillor",
      };
    case "citizen":
    default:
      return {
        label: "Verified Citizen",
        shortLabel: "Citizen",
        categoryTitle: "CITIZEN",
        gradientFrom: "#2563eb", // Brand Royal Blue (Blue 600 - matching center + button)
        gradientTo: "#1d4ed8",   // Brand Deep Royal Blue (Blue 700)
        shadowColor: "rgba(37, 99, 235, 0.4)",
        textColor: "text-blue-900",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-300",
        ringColor: "ring-blue-600/30",
        glowColor: "shadow-blue-600/20",
        buttonStyle: "bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-400/80 shadow-blue-600/10",
        hexColor: "#2563eb",
        symbolEmoji: "🔵",
        themeName: "Brand Royal Blue Badge",
        description: "Authenticated Indian citizen voter and civic contributor",
      };
  }
};

/**
 * Modern Meta / Instagram / Facebook Scalloped 16-point Rosette Verified Badge
 */
export const CategoryVerifiedTick: React.FC<{
  category?: UserCategory | string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  animate?: boolean;
}> = ({ category = "citizen", size = "sm", className = "", animate = false }) => {
  const config = getCategoryBadgeConfig(category);
  const gradId = `meta-badge-${category}-${size}`;

  const sizeClasses = {
    xs: "w-4 h-4",
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7",
    xl: "w-9 h-9",
  };

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 align-middle ${sizeClasses[size]} ${
        animate ? "animate-pulse" : ""
      } ${className}`}
      title={`${config.label} (${config.themeName})`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs transition-transform hover:scale-110"
        style={{
          filter: `drop-shadow(0 1px 2px ${config.shadowColor})`,
        }}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={config.gradientFrom} />
            <stop offset="100%" stopColor={config.gradientTo} />
          </linearGradient>
        </defs>

        {/* 12-point Scalloped Star Badge from reference image */}
        <path
          d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91c-1.31.67-2.19 1.91-2.19 3.34s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
          fill={`url(#${gradId})`}
        />

        {/* Crisp Checkmark */}
        <path
          d="M7.75 12.25l2.75 2.75 5.75-5.75"
          stroke="#ffffff"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
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
  verifiedCategory,
  size = "sm",
  showLabel = true,
  className = "",
  onClick,
}) => {
  const config = getCategoryBadgeConfig(category);
  const badgeTickCategory = verifiedCategory || category;

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border shadow-2xs transition-all ${
        config.bgColor
      } ${config.textColor} ${config.borderColor} ${
        onClick ? "cursor-pointer hover:opacity-90 active:scale-95" : "cursor-default"
      } ${className}`}
      title={`${config.categoryTitle} ${verified ? `(Verified ${badgeTickCategory})` : ""}`}
    >
      {verified && <CategoryVerifiedTick category={badgeTickCategory} size={size === "lg" ? "md" : "xs"} />}
      {showLabel && <span>{config.categoryTitle}</span>}
    </div>
  );
};
