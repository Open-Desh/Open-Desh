import React from "react";
import { UserCategory } from "../types.ts";

export interface VerifiedBadgeProps {
  type?: UserCategory | "voter" | "official" | "mla_mp" | "journalist" | "leader" | "none";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showTooltip?: boolean;
}

const BADGE_CONFIG = {
  voter: {
    label: "Certified Indian Voter",
    gradientFrom: "#2563eb", // Brand Royal Blue (Blue 600 - matching center + button)
    gradientTo: "#1d4ed8",   // Deep Royal Blue (Blue 700)
    shadowColor: "rgba(37, 99, 235, 0.4)",
    metaColor: "#2563eb",
  },
  official: {
    label: "Verified Civic Department / Official",
    gradientFrom: "#059669", // Emerald
    gradientTo: "#047857",
    shadowColor: "rgba(5, 150, 105, 0.35)",
    metaColor: "#10b981",
  },
  mla_mp: {
    label: "Elected Representative (MLA / MP)",
    gradientFrom: "#d97706", // Gold / Amber
    gradientTo: "#b45309",
    shadowColor: "rgba(217, 119, 6, 0.35)",
    metaColor: "#f59e0b",
  },
  journalist: {
    label: "Accredited Press & Investigative Journalist",
    gradientFrom: "#7c3aed", // Royal Purple
    gradientTo: "#6d28d9",
    shadowColor: "rgba(124, 58, 237, 0.35)",
    metaColor: "#8b5cf6",
  },
  leader: {
    label: "Verified Public Leader",
    gradientFrom: "#2563eb", // Royal Blue
    gradientTo: "#1d4ed8",
    shadowColor: "rgba(37, 99, 235, 0.35)",
    metaColor: "#2563eb",
  },
  none: {
    label: "Verified",
    gradientFrom: "#2563eb",
    gradientTo: "#1d4ed8",
    shadowColor: "rgba(37, 99, 235, 0.4)",
    metaColor: "#2563eb",
  },
};

const SIZE_MAP = {
  xs: "w-4 h-4",
  sm: "w-5 h-5",
  md: "w-6 h-6",
  lg: "w-7 h-7",
  xl: "w-9 h-9",
};

/**
 * Perfectly circular verified badge
 * with crisp white tick, subtle 3D depth gradient, and soft elevation shadow.
 */
export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  type = "voter",
  size = "sm",
  className = "",
  showTooltip = true,
}) => {
  const normalizedType = (type && BADGE_CONFIG[type as keyof typeof BADGE_CONFIG]) ? (type as keyof typeof BADGE_CONFIG) : "voter";
  const config = BADGE_CONFIG[normalizedType] || BADGE_CONFIG.voter;
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.sm;
  const gradientId = `meta-badge-grad-${normalizedType}-${size}`;

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 align-middle ${className}`}
      title={showTooltip ? config.label : undefined}
      aria-label={config.label}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeClass} transition-transform hover:scale-110`}
        style={{
          filter: `drop-shadow(0 1px 2px ${config.shadowColor})`,
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={config.gradientFrom} />
            <stop offset="100%" stopColor={config.gradientTo} />
          </linearGradient>
        </defs>

        {/* 12-point Scalloped Star Badge from reference image */}
        <path
          d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91c-1.31.67-2.19 1.91-2.19 3.34s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
          fill={`url(#${gradientId})`}
        />

        {/* Crisp checkmark with rounded joins */}
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
