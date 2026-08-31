import React, { useState } from "react";
import { cleanReportText } from "../utils/reportUtils.ts";

interface ExpandablePostTextProps {
  text?: string;
  className?: string;
  readMoreLabel?: string;
  showLessLabel?: string;
  charLimit?: number;
}

export const ExpandablePostText: React.FC<ExpandablePostTextProps> = ({
  text = "",
  className = "text-sm sm:text-base text-slate-900 leading-relaxed font-normal whitespace-pre-line",
  readMoreLabel = "read more",
  showLessLabel = "show less",
  charLimit = 72,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const cleaned = cleanReportText(text);
  if (!cleaned) return null;

  // Check if text exceeds ~2 lines or has 2+ newlines
  const lines = cleaned.split("\n");
  const hasMultipleLineBreaks = lines.length > 2;
  const isLong = cleaned.length > (charLimit + 12) || hasMultipleLineBreaks;

  if (!isLong) {
    return <p className={className}>{cleaned}</p>;
  }

  // Calculate 2-line truncated snippet with guaranteed space for inline "read more"
  let truncatedSnippet = cleaned;
  if (!isExpanded) {
    if (hasMultipleLineBreaks && lines[0].length < charLimit) {
      truncatedSnippet = lines[0].trim();
    } else {
      // Cut around charLimit and back off to nearest word boundary
      const rawSlice = cleaned.slice(0, charLimit);
      const lastSpaceIdx = rawSlice.lastIndexOf(" ");
      const cutIdx = lastSpaceIdx > 40 ? lastSpaceIdx : charLimit;
      truncatedSnippet = rawSlice.slice(0, cutIdx).trim().replace(/[,.:;!?-]+$/, "");
    }
  }

  return (
    <p className={className}>
      <span>{isExpanded ? cleaned : `${truncatedSnippet}...`}</span>
      {" "}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded((prev) => !prev);
        }}
        className="inline font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors focus:outline-none select-none whitespace-nowrap"
      >
        {isExpanded ? showLessLabel : readMoreLabel}
      </button>
    </p>
  );
};
