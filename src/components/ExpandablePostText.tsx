import React, { useState, useRef, useEffect } from "react";
import { cleanReportText } from "../utils/reportUtils.ts";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandablePostTextProps {
  text?: string;
  maxLines?: number;
  className?: string;
  readMoreLabel?: string;
  showLessLabel?: string;
  charLimit?: number;
}

export const ExpandablePostText: React.FC<ExpandablePostTextProps> = ({
  text = "",
  maxLines = 3,
  className = "text-sm sm:text-base text-slate-900 leading-relaxed font-normal whitespace-pre-line",
  readMoreLabel = "Read more",
  showLessLabel = "Show less",
  charLimit = 110,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  const cleaned = cleanReportText(text);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    // Line breaks count & length threshold
    const lineBreaks = (cleaned.match(/\n/g) || []).length;
    const hasMultipleLines = lineBreaks >= 2;
    const isTextLong = cleaned.length > charLimit;
    const isOverflowing = el.scrollHeight > el.clientHeight + 2;

    setIsClamped(isOverflowing || hasMultipleLines || isTextLong);
  }, [cleaned, maxLines, charLimit]);

  if (!cleaned) return null;

  return (
    <div className="space-y-1">
      <p
        ref={textRef}
        className={`${className} ${!isExpanded ? "line-clamp-3" : ""}`}
      >
        {cleaned}
      </p>

      {isClamped && (
        <div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded((prev) => !prev);
            }}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer inline-flex items-center gap-1 transition-colors py-0.5 focus:outline-none"
          >
            <span>{isExpanded ? showLessLabel : `... ${readMoreLabel}`}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};
