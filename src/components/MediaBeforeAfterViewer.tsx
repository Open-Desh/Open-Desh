import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface MediaBeforeAfterViewerProps {
  beforeImages: string[];
  afterImage?: string;
  reportId?: string;
  isCompact?: boolean;
  actionCardSlot?: React.ReactNode;
}

export const MediaBeforeAfterViewer: React.FC<MediaBeforeAfterViewerProps> = ({
  beforeImages = [],
  afterImage,
  reportId,
  isCompact = false,
  actionCardSlot,
}) => {
  const [activeTab, setActiveTab] = useState<"before" | "after">("before");
  const [activeSlide, setActiveSlide] = useState(0);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});
  const touchStartX = useRef<number | null>(null);
  const modalTouchStartX = useRef<number | null>(null);

  const cleanBeforeList = beforeImages.filter(Boolean);
  const hasMultipleBefore = cleanBeforeList.length > 1;

  // Active full images list for the active tab
  const activeMediaList = activeTab === "before" ? cleanBeforeList : afterImage ? [afterImage] : [];
  const currentActiveImage =
    activeTab === "before"
      ? cleanBeforeList[activeSlide] ||
        cleanBeforeList[0] ||
        "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80"
      : afterImage || "";

  // Pre-load natural image dimensions for zero-layout-shift adaptive aspect ratios
  useEffect(() => {
    const urls = [...cleanBeforeList, afterImage].filter(Boolean) as string[];
    urls.forEach((url) => {
      if (!aspectRatios[url]) {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          if (img.naturalWidth && img.naturalHeight) {
            const ratio = img.naturalWidth / img.naturalHeight;
            setAspectRatios((prev) => ({
              ...prev,
              [url]: ratio,
            }));
          }
        };
      }
    });
  }, [cleanBeforeList.join(","), afterImage]);

  const handleImageLoad = (
    url: string,
    e: React.SyntheticEvent<HTMLImageElement>
  ) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      const ratio = naturalWidth / naturalHeight;
      setAspectRatios((prev) => {
        if (prev[url] === ratio) return prev;
        return { ...prev, [url]: ratio };
      });
    }
  };

  // Helper to compute adaptive aspect ratio
  const getContainerStyle = (imgUrl: string): React.CSSProperties => {
    const ratio = aspectRatios[imgUrl];
    if (ratio) {
      if (ratio < 0.8) {
        // Taller than 4:5 -> Cap at 4:5 portrait
        return { aspectRatio: "4 / 5", maxHeight: "560px" };
      }
      // Shorter/wider than 4:5 -> Keep natural aspect ratio & original height
      return { aspectRatio: `${ratio}`, maxHeight: "560px" };
    }
    // Fallback while loading
    return { minHeight: "180px", maxHeight: "560px" };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 40 && hasMultipleBefore && activeTab === "before") {
      if (diff > 0) {
        // Swiped left -> next image
        setActiveSlide((prev) => (prev < cleanBeforeList.length - 1 ? prev + 1 : 0));
      } else {
        // Swiped right -> previous image
        setActiveSlide((prev) => (prev > 0 ? prev - 1 : cleanBeforeList.length - 1));
      }
    }
    touchStartX.current = null;
  };

  // Touch swipe support in Fullscreen modal
  const handleModalTouchStart = (e: React.TouchEvent) => {
    modalTouchStartX.current = e.touches[0].clientX;
  };

  const handleModalTouchEnd = (e: React.TouchEvent) => {
    if (modalTouchStartX.current === null || fullscreenIndex === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = modalTouchStartX.current - touchEndX;

    if (Math.abs(diff) > 40 && activeMediaList.length > 1) {
      if (diff > 0) {
        // Swiped left -> next image
        const nextIdx = (fullscreenIndex + 1) % activeMediaList.length;
        setFullscreenIndex(nextIdx);
        if (activeTab === "before") setActiveSlide(nextIdx);
      } else {
        // Swiped right -> previous image
        const prevIdx = (fullscreenIndex - 1 + activeMediaList.length) % activeMediaList.length;
        setFullscreenIndex(prevIdx);
        if (activeTab === "before") setActiveSlide(prevIdx);
      }
    }
    modalTouchStartX.current = null;
  };

  // Keyboard navigation for fullscreen lightbox (Arrow keys + Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (fullscreenIndex === null) return;
      if (e.key === "Escape") {
        setFullscreenIndex(null);
      } else if (e.key === "ArrowRight" && activeMediaList.length > 1) {
        const nextIdx = (fullscreenIndex + 1) % activeMediaList.length;
        setFullscreenIndex(nextIdx);
        if (activeTab === "before") setActiveSlide(nextIdx);
      } else if (e.key === "ArrowLeft" && activeMediaList.length > 1) {
        const prevIdx = (fullscreenIndex - 1 + activeMediaList.length) % activeMediaList.length;
        setFullscreenIndex(prevIdx);
        if (activeTab === "before") setActiveSlide(prevIdx);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenIndex, activeMediaList.length, activeTab]);

  // Lock body scroll when fullscreen modal is open
  useEffect(() => {
    if (fullscreenIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [fullscreenIndex]);

  // If no images are available
  if (cleanBeforeList.length === 0 && !afterImage) return null;

  return (
    <div
      className="space-y-2 pt-0.5 my-1 select-none -mx-2 sm:-mx-3 w-[calc(100%+1rem)] sm:w-[calc(100%+1.5rem)]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Before / After Toggle Bar - Centered */}
      {afterImage && cleanBeforeList.length > 0 && (
        <div className="flex items-center justify-center w-full pb-1 px-2 sm:px-3">
          <div className="inline-flex items-center justify-center gap-1.5 p-1 bg-slate-100/95 rounded-full border border-slate-200 shadow-2xs">
            {/* Before Tab */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab("before");
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "before"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
              title="View reported grievance photos"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
              <span>
                Before{cleanBeforeList.length > 1 ? ` (${cleanBeforeList.length})` : ""}
              </span>
            </button>

            {/* After Tab */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab("after");
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "after"
                  ? "bg-white text-emerald-700 shadow-xs border border-emerald-200 ring-1 ring-emerald-600/10"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
              title="View resolved work photo"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span>After</span>
            </button>
          </div>
        </div>
      )}

      {/* Adaptive Aspect Ratio Feed Card */}
      {activeTab === "before" || !afterImage ? (
        /* BEFORE VIEW / CAROUSEL */
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={getContainerStyle(currentActiveImage)}
          className="relative isolate w-full rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100/60 shadow-xs group flex items-center justify-center border-0 ring-0 transition-all duration-200"
        >
          {/* Normal Click to open original size view (no overlay icon) */}
          <img
            src={currentActiveImage}
            alt={`Reported Evidence ${activeSlide + 1}`}
            onLoad={(e) => handleImageLoad(currentActiveImage, e)}
            onClick={(e) => {
              e.stopPropagation();
              setFullscreenIndex(activeSlide);
            }}
            className="w-full h-full object-cover cursor-pointer active:scale-[0.99] transition-transform duration-200"
            referrerPolicy="no-referrer"
          />

          {/* Top Left: Minimalist Before Badge (Clean Glass) */}
          <div className="absolute top-3 left-3 z-[2] bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-black tracking-wide px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1.5 border border-slate-200/80 pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>Before</span>
          </div>

          {/* Top Right: Count Indicator (e.g. 1/3) */}
          {hasMultipleBefore && (
            <div className="absolute top-3 right-3 z-[2] bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs border border-slate-200/80 pointer-events-none">
              {activeSlide + 1}/{cleanBeforeList.length}
            </div>
          )}

          {/* Left / Right Carousel Arrow Buttons */}
          {hasMultipleBefore && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSlide((prev) =>
                    prev > 0 ? prev - 1 : cleanBeforeList.length - 1
                  );
                }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 z-[2] bg-white/90 hover:bg-white text-slate-800 p-2 rounded-full shadow-md border border-slate-200/80 cursor-pointer transition-all opacity-90 group-hover:opacity-100 backdrop-blur-sm active:scale-95"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-4 h-4 text-slate-800" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSlide((prev) =>
                    prev < cleanBeforeList.length - 1 ? prev + 1 : 0
                  );
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 z-[2] bg-white/90 hover:bg-white text-slate-800 p-2 rounded-full shadow-md border border-slate-200/80 cursor-pointer transition-all opacity-90 group-hover:opacity-100 backdrop-blur-sm active:scale-95"
                aria-label="Next photo"
              >
                <ChevronRight className="w-4 h-4 text-slate-800" />
              </button>
            </>
          )}

          {/* Bottom Center: Pagination Dots */}
          {hasMultipleBefore && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[2] flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xs">
              {cleanBeforeList.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSlide(idx);
                  }}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    activeSlide === idx
                      ? "w-4 h-1.5 bg-blue-600 shadow-xs"
                      : "w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400"
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* AFTER RESOLUTION PHOTO */
        <div
          style={getContainerStyle(afterImage || "")}
          className="relative isolate w-full rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100/60 shadow-xs group flex items-center justify-center border-0 ring-0 transition-all duration-200"
        >
          {/* Normal Click to open original size view (no overlay icon) */}
          <img
            src={afterImage}
            alt="After Resolution Work"
            onLoad={(e) => afterImage && handleImageLoad(afterImage, e)}
            onClick={(e) => {
              e.stopPropagation();
              setFullscreenIndex(0);
            }}
            className="w-full h-full object-cover cursor-pointer active:scale-[0.99] transition-transform duration-200"
            referrerPolicy="no-referrer"
          />

          {/* Top Left: Minimalist After Badge */}
          <div className="absolute top-3 left-3 z-[2] bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-black tracking-wide px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1.5 border border-emerald-400/30 pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-200"></span>
            <span>After (Resolved)</span>
          </div>
        </div>
      )}

      {/* Full-Screen HD Lightbox Modal with Carousel and Bottom Interaction Card */}
      {fullscreenIndex !== null && (
        <div
          className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-5 select-none animate-fadeIn"
          onClick={() => setFullscreenIndex(null)}
          onTouchStart={handleModalTouchStart}
          onTouchEnd={handleModalTouchEnd}
        >
          {/* Top Bar with Counter & Close Button (No 'Original High-Resolution View' text) */}
          <div
            className="w-full flex items-center justify-between pointer-events-auto z-[100001]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Counter or Tag */}
            <div>
              {activeMediaList.length > 1 ? (
                <span className="text-white/90 text-xs font-black bg-white/15 px-3.5 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
                  {fullscreenIndex + 1} / {activeMediaList.length}
                </span>
              ) : (
                <span className="text-white/90 text-xs font-black bg-white/15 px-3.5 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
                  {activeTab === "before" ? "Evidence Photo" : "After Resolution"}
                </span>
              )}
            </div>

            {/* Right Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenIndex(null);
              }}
              className="p-2.5 bg-white/15 hover:bg-white/25 text-white rounded-full transition-all cursor-pointer border border-white/20 active:scale-95 shadow-xl"
              title="Close Full Screen"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Central Image View with Left/Right Navigation */}
          <div
            className="relative flex-1 w-full flex items-center justify-center min-h-0 py-2 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous Arrow in Fullscreen */}
            {activeMediaList.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const prevIdx =
                    (fullscreenIndex - 1 + activeMediaList.length) %
                    activeMediaList.length;
                  setFullscreenIndex(prevIdx);
                  if (activeTab === "before") setActiveSlide(prevIdx);
                }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-[100002] p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer active:scale-90 shadow-2xl"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* High-Resolution Image */}
            <img
              key={activeMediaList[fullscreenIndex] || "fs-img"}
              src={
                activeMediaList[fullscreenIndex] ||
                cleanBeforeList[0] ||
                afterImage ||
                ""
              }
              alt={`Full size view ${fullscreenIndex + 1}`}
              className="max-w-full max-h-[70vh] sm:max-h-[74vh] object-contain rounded-2xl shadow-2xl transition-all duration-200 animate-fadeIn"
              referrerPolicy="no-referrer"
            />

            {/* Next Arrow in Fullscreen */}
            {activeMediaList.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const nextIdx = (fullscreenIndex + 1) % activeMediaList.length;
                  setFullscreenIndex(nextIdx);
                  if (activeTab === "before") setActiveSlide(nextIdx);
                }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-[100002] p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer active:scale-90 shadow-2xl"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Card: Like, Share, Reply and Action Slot */}
          {actionCardSlot && (
            <div
              className="w-full max-w-xl mx-auto bg-slate-900/90 text-white border border-white/15 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md pointer-events-auto z-[100001] animate-slideUp"
              onClick={(e) => e.stopPropagation()}
            >
              {actionCardSlot}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
