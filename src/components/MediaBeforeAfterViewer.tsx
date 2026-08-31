import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";

interface MediaBeforeAfterViewerProps {
  beforeImages: string[];
  afterImage?: string;
  reportId?: string;
  isCompact?: boolean;
}

export const MediaBeforeAfterViewer: React.FC<MediaBeforeAfterViewerProps> = ({
  beforeImages = [],
  afterImage,
  reportId,
  isCompact = false,
}) => {
  const [activeTab, setActiveTab] = useState<"before" | "after">("before");
  const [activeSlide, setActiveSlide] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);

  const cleanBeforeList = beforeImages.filter(Boolean);
  const hasMultipleBefore = cleanBeforeList.length > 1;

  const currentBeforeImage =
    cleanBeforeList[activeSlide] ||
    cleanBeforeList[0] ||
    "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80";

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

  // Lock body scroll when fullscreen is open
  useEffect(() => {
    if (fullscreenImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [fullscreenImage]);

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

      {/* 4:5 Fixed Aspect Ratio Feed Card (Instagram Portrait Layout) - Completely Borderless & Light Neutral Background */}
      {activeTab === "before" || !afterImage ? (
        /* BEFORE VIEW / CAROUSEL */
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative isolate w-full aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100/60 shadow-xs group flex items-center justify-center border-0 ring-0"
        >
          {/* Main 4:5 Portrait Cropped Image */}
          <img
            src={currentBeforeImage}
            alt={`Reported Evidence ${activeSlide + 1}`}
            onClick={() => setFullscreenImage(currentBeforeImage)}
            className="w-full h-full object-cover cursor-pointer active:scale-[0.99] transition-transform duration-200"
            referrerPolicy="no-referrer"
          />

          {/* Top Left: Minimalist Before Badge (Clean Glass) */}
          <div className="absolute top-3 left-3 z-[2] bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-black tracking-wide px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1.5 border border-slate-200/80 pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>Before</span>
          </div>

          {/* Top Right: Count Indicator (e.g. 1/3) & Fullscreen button (Clean Glass) */}
          <div className="absolute top-3 right-3 z-[2] flex items-center gap-1.5">
            {hasMultipleBefore && (
              <div className="bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs border border-slate-200/80">
                {activeSlide + 1}/{cleanBeforeList.length}
              </div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenImage(currentBeforeImage);
              }}
              className="bg-white/90 hover:bg-white backdrop-blur-md text-slate-700 p-2 rounded-full shadow-xs border border-slate-200/80 cursor-pointer transition-transform active:scale-95 flex items-center justify-center"
              title="View full original image"
              aria-label="View full original image"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Left / Right Carousel Arrow Buttons (Clean Glass) */}
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

          {/* Bottom Center: Pagination Dots (Clean Glass) */}
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
        /* AFTER RESOLUTION PHOTO - 4:5 Aspect Ratio Borderless Light */
        <div className="relative isolate w-full aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100/60 shadow-xs group flex items-center justify-center border-0 ring-0">
          <img
            src={afterImage}
            alt="After Resolution Work"
            onClick={() => setFullscreenImage(afterImage)}
            className="w-full h-full object-cover cursor-pointer active:scale-[0.99] transition-transform duration-200"
            referrerPolicy="no-referrer"
          />

          {/* Top Left: Minimalist After Badge */}
          <div className="absolute top-3 left-3 z-[2] bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-black tracking-wide px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1.5 border border-emerald-400/30 pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-200"></span>
            <span>After (Resolved)</span>
          </div>

          {/* Top Right: Fullscreen expand button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFullscreenImage(afterImage);
            }}
            className="absolute top-3 right-3 z-[2] bg-white/90 hover:bg-white backdrop-blur-md text-slate-700 p-2 rounded-full shadow-xs border border-slate-200/80 cursor-pointer transition-transform active:scale-95 flex items-center justify-center"
            title="View full original image"
            aria-label="View full original image"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Full-Screen HD Lightbox Modal (Covers entire screen with z-[99999] so bottom nav is completely hidden) */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-fadeIn"
          onClick={() => setFullscreenImage(null)}
        >
          {/* Top Bar with Title & Close Icon */}
          <div className="absolute top-4 left-4 right-4 z-[100000] flex items-center justify-between pointer-events-auto">
            <span className="text-white/80 text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
              Original High-Resolution View
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenImage(null);
              }}
              className="p-2.5 bg-white/15 hover:bg-white/25 text-white rounded-full transition-all cursor-pointer border border-white/20 active:scale-95 shadow-xl"
              title="Close Full Screen"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Full Original Image (No Cropping in Full Screen View) */}
          <div
            className="relative max-w-full max-h-[88vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={fullscreenImage}
              alt="Full Original Resolution"
              className="max-w-full max-h-[88vh] object-contain rounded-2xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
