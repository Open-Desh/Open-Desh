import React, { useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, Columns } from "lucide-react";

interface MediaBeforeAfterViewerProps {
  beforeImages: string[];
  afterImage?: string;
  reportId?: string;
  isCompact?: boolean;
}

export const MediaBeforeAfterViewer: React.FC<MediaBeforeAfterViewerProps> = ({
  beforeImages,
  afterImage,
  reportId,
  isCompact = false,
}) => {
  const [activeTab, setActiveTab] = useState<"before" | "after" | "compare">("before");
  const [activeSlide, setActiveSlide] = useState(0);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const originalBeforeImage = beforeImages && beforeImages.length > 0
    ? beforeImages[0]
    : "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80";

  const handlePointerMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length > 0) {
      handlePointerMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handlePointerMove(e.clientX);
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handlePointerMove(e.clientX);
  };

  if (!afterImage) {
    // Only standard carousel if no resolution image exists
    if (!beforeImages || beforeImages.length === 0) return null;
    return (
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center group my-1">
        <img
          src={beforeImages[activeSlide] || beforeImages[0]}
          alt={`Evidence ${activeSlide + 1}`}
          className="w-full max-h-96 object-contain rounded-2xl"
          referrerPolicy="no-referrer"
        />
        {beforeImages.length > 1 && (
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
            {activeSlide + 1} / {beforeImages.length} Evidence
          </div>
        )}
        {beforeImages.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveSlide((prev) => (prev > 0 ? prev - 1 : beforeImages.length - 1));
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded-full cursor-pointer transition-all opacity-90 group-hover:opacity-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveSlide((prev) => (prev < beforeImages.length - 1 ? prev + 1 : 0));
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded-full cursor-pointer transition-all opacity-90 group-hover:opacity-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className="space-y-2 pt-1 my-1 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Unified Single Layer Modern Control Bar */}
      <div className="flex items-center justify-between gap-1.5 bg-slate-100/90 p-1 rounded-full border border-slate-200/80 backdrop-blur-xs">
        {/* Left Side: Before / After Rounded Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab("before");
            }}
            className={`px-3 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "before"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
            <span>Before{beforeImages.length > 1 ? ` (${beforeImages.length})` : ""}</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab("after");
            }}
            className={`px-3 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "after"
                ? "bg-white text-emerald-700 shadow-xs border border-emerald-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span>After</span>
          </button>
        </div>

        {/* Center: Resolution Verified Badge */}
        <div className="px-2.5 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 text-[10px] font-black tracking-tight shrink-0 flex items-center gap-1 shadow-2xs">
          <span>Resolution Verified</span>
          <span className="text-[11px] font-extrabold">✓</span>
        </div>

        {/* Right Side: Compare Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveTab("compare");
          }}
          className={`px-3 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
            activeTab === "compare"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
          }`}
        >
          <Columns className="w-3 h-3 shrink-0" />
          <span>Compare</span>
        </button>
      </div>

      {/* Tab 1: Before Evidence Carousel */}
      {activeTab === "before" && (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center group my-1">
          <img
            src={beforeImages[activeSlide] || originalBeforeImage}
            alt={`Before Evidence ${activeSlide + 1}`}
            className="w-full max-h-96 object-contain rounded-2xl"
            referrerPolicy="no-referrer"
          />

          <div className="absolute top-3 left-3 bg-rose-600/90 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
            Before (Reported)
            {beforeImages.length > 1 && ` • ${activeSlide + 1}/${beforeImages.length}`}
          </div>

          {beforeImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSlide((prev) => (prev > 0 ? prev - 1 : beforeImages.length - 1));
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded-full cursor-pointer transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSlide((prev) => (prev < beforeImages.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded-full cursor-pointer transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Tab 2: After Resolved Work Photo */}
      {activeTab === "after" && (
        <div className="relative rounded-2xl overflow-hidden border border-emerald-200 bg-slate-50 flex items-center justify-center my-1 group">
          <img
            src={afterImage}
            alt="After Resolution Work"
            className="w-full max-h-96 object-contain rounded-2xl"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>After Fix (Authority Completed)</span>
          </div>
        </div>
      )}

      {/* Tab 3: Interactive Split-View Comparison Slider with Direct Screen Touch/Drag Support */}
      {activeTab === "compare" && (
        <div className="space-y-2 pt-0.5">
          <div
            ref={containerRef}
            onClick={handleContainerClick}
            onMouseDown={(e) => {
              setIsDragging(true);
              handlePointerMove(e.clientX);
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={handleMouseMove}
            onTouchStart={(e) => {
              setIsDragging(true);
              if (e.touches.length > 0) handlePointerMove(e.touches[0].clientX);
            }}
            onTouchEnd={() => setIsDragging(false)}
            onTouchCancel={() => setIsDragging(false)}
            onTouchMove={handleTouchMove}
            className="relative w-full aspect-4/3 sm:aspect-16/10 rounded-2xl overflow-hidden bg-slate-900 select-none shadow-inner border border-slate-200 cursor-ew-resize touch-none"
          >
            {/* Base Image (After Work Done) */}
            <img
              src={afterImage}
              alt="After Fix"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              referrerPolicy="no-referrer"
            />

            {/* Clipped Top Image (Before) */}
            <div
              className="absolute inset-0 overflow-hidden border-r-2 border-white shadow-2xl pointer-events-none"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={originalBeforeImage}
                alt="Before Fix"
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{
                  width: containerRef.current ? `${containerRef.current.clientWidth}px` : "100%",
                  height: "100%",
                }}
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 bg-rose-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-md">
                Before
              </div>
            </div>

            {/* After Tag on Right */}
            <div className="absolute top-3 right-3 bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-md pointer-events-none">
              After
            </div>

            {/* Vertical Divider Handle */}
            <div
              className="absolute top-0 bottom-0 -ml-3.5 flex items-center justify-center pointer-events-none z-10"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="w-7 h-7 bg-white text-slate-800 rounded-full shadow-2xl flex items-center justify-center border-2 border-blue-600 animate-pulse">
                <Columns className="w-3.5 h-3.5 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Quick Guidance Info & Slider Input */}
          <div className="space-y-1 px-1">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-rose-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                Before Reported
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">Touch or drag anywhere to compare</span>
              <span className="text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                After Resolved
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      )}
    </div>
  );
};
