import React, { useRef } from "react";

export interface MonthItem {
  short: string;
  full: string;
  value: number;
}

export const MONTHS: MonthItem[] = [
  { short: "Jan", full: "January", value: 1 },
  { short: "Feb", full: "February", value: 2 },
  { short: "Mar", full: "March", value: 3 },
  { short: "Apr", full: "April", value: 4 },
  { short: "May", full: "May", value: 5 },
  { short: "Jun", full: "June", value: 6 },
  { short: "Jul", full: "July", value: 7 },
  { short: "Aug", full: "August", value: 8 },
  { short: "Sep", full: "September", value: 9 },
  { short: "Oct", full: "October", value: 10 },
  { short: "Nov", full: "November", value: 11 },
  { short: "Dec", full: "December", value: 12 },
];

interface WheelColumnProps {
  label: string;
  currentValue: string | number;
  prevValue: string | number;
  nextValue: string | number;
  onStep: (delta: number) => void;
}

export const WheelColumn: React.FC<WheelColumnProps> = ({
  currentValue,
  prevValue,
  nextValue,
  onStep,
}) => {
  const touchStartY = useRef<number | null>(null);
  const dragAccumulator = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  // Mouse wheel scroll handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      onStep(1); // Scroll down -> next
    } else if (e.deltaY < 0) {
      onStep(-1); // Scroll up -> prev
    }
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    dragAccumulator.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = touchStartY.current - currentY;

    // Threshold for moving to next/prev item (approx 28px per item)
    if (Math.abs(diff) >= 28) {
      if (diff > 0) {
        onStep(1); // Dragged up -> advance
      } else {
        onStep(-1); // Dragged down -> reverse
      }
      touchStartY.current = currentY;
    }
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
    dragAccumulator.current = 0;
  };

  // Mouse drag handlers for desktop dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    touchStartY.current = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || touchStartY.current === null) return;
    const currentY = e.clientY;
    const diff = touchStartY.current - currentY;

    if (Math.abs(diff) >= 28) {
      if (diff > 0) {
        onStep(1);
      } else {
        onStep(-1);
      }
      touchStartY.current = currentY;
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    touchStartY.current = null;
  };

  return (
    <div
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="flex flex-col items-center justify-center select-none cursor-ns-resize py-1 touch-none group"
    >
      {/* 1. Previous Item (Clickable & Scrollable) */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onStep(-1);
        }}
        className="h-10 flex items-center justify-center text-slate-400 font-medium text-lg sm:text-xl hover:text-slate-700 transition-colors w-full cursor-pointer active:scale-95"
      >
        {prevValue}
      </button>

      {/* 2. Active Center Item (Highlighted) */}
      <div className="h-12 flex items-center justify-center text-slate-950 font-black text-xl sm:text-2xl w-full transition-transform tracking-tight">
        {currentValue}
      </div>

      {/* 3. Next Item (Clickable & Scrollable) */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onStep(1);
        }}
        className="h-10 flex items-center justify-center text-slate-400 font-medium text-lg sm:text-xl hover:text-slate-700 transition-colors w-full cursor-pointer active:scale-95"
      >
        {nextValue}
      </button>
    </div>
  );
};
