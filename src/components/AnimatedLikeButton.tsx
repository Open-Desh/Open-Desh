import React, { useState, useRef, useEffect } from "react";
import { Heart } from "lucide-react";

interface AnimatedLikeButtonProps {
  isLiked: boolean;
  likesCount?: number;
  onLike: (e: React.MouseEvent) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  showCount?: boolean;
  title?: string;
}

interface FloatingHeartItem {
  id: number;
  animationClass: string;
  sizePx: number;
  colorClass: string;
}

export const AnimatedLikeButton: React.FC<AnimatedLikeButtonProps> = ({
  isLiked,
  likesCount = 0,
  onLike,
  size = "md",
  className = "",
  showCount = true,
  title = "Like",
}) => {
  const [animating, setAnimating] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeartItem[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // If currently unliked and user clicks, trigger the rich X/Twitter + YouTube heart burst
    if (!isLiked) {
      setAnimating(true);
      const newKey = Date.now();
      setBurstKey(newKey);

      // Create 3-4 distinct floating hearts with varied trajectories
      setFloatingHearts([
        {
          id: newKey + 1,
          animationClass: "animate-float-heart-left",
          sizePx: 14,
          colorClass: "fill-rose-500 text-rose-500",
        },
        {
          id: newKey + 2,
          animationClass: "animate-float-heart-center",
          sizePx: 17,
          colorClass: "fill-pink-500 text-pink-500",
        },
        {
          id: newKey + 3,
          animationClass: "animate-float-heart-right",
          sizePx: 13,
          colorClass: "fill-red-500 text-red-500",
        },
        {
          id: newKey + 4,
          animationClass: "animate-float-heart-tiny",
          sizePx: 11,
          colorClass: "fill-rose-400 text-rose-400",
        },
      ]);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setAnimating(false);
        setFloatingHearts([]);
      }, 1000);
    } else {
      setAnimating(false);
      setFloatingHearts([]);
    }

    onLike(e);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title}
      className={`relative inline-flex items-center gap-1.5 transition-colors cursor-pointer group select-none ${
        isLiked ? "text-rose-600 font-extrabold" : "text-slate-500 hover:text-rose-600"
      } ${className}`}
    >
      {/* Container for Heart Icon & Overlaid Particle FX */}
      <div className="relative flex items-center justify-center">
        {/* Expanding Ring Burst (Twitter/X style) */}
        {animating && (
          <span
            key={`ring-${burstKey}`}
            className="absolute -inset-1 rounded-full border-rose-500 bg-rose-500/10 pointer-events-none animate-like-ring-burst z-10"
          />
        )}

        {/* 6 Particle Sparkles */}
        {animating && (
          <div key={`sparks-${burstKey}`} className="absolute inset-0 pointer-events-none z-10">
            <span className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-pink-500 animate-spark-1" />
            <span className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-rose-500 animate-spark-2" />
            <span className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-amber-400 animate-spark-3" />
            <span className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-red-500 animate-spark-4" />
            <span className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-rose-400 animate-spark-5" />
            <span className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-pink-400 animate-spark-6" />
          </div>
        )}

        {/* 2-4 Floating Flying Hearts (Udte hue dil) */}
        {floatingHearts.map((heart) => (
          <span
            key={heart.id}
            className={`absolute pointer-events-none z-30 drop-shadow-sm ${heart.animationClass}`}
            style={{
              width: `${heart.sizePx}px`,
              height: `${heart.sizePx}px`,
              bottom: "4px",
              left: "2px",
            }}
          >
            <Heart
              className={`w-full h-full ${heart.colorClass}`}
              strokeWidth={1.5}
            />
          </span>
        ))}

        {/* Main Interactive Heart Icon */}
        <Heart
          className={`${iconSizes[size]} transition-all duration-200 ${
            animating
              ? "animate-like-heart-pop fill-rose-600 text-rose-600 scale-125"
              : isLiked
              ? "fill-rose-600 text-rose-600 scale-100"
              : "text-slate-400 group-hover:text-rose-600 group-hover:scale-110"
          }`}
        />
      </div>

      {/* Like Counter with smooth font scaling */}
      {showCount && (
        <span
          className={`transition-all duration-200 text-xs sm:text-sm ${
            isLiked ? "font-black text-rose-600" : "font-bold text-slate-600 group-hover:text-rose-600"
          }`}
        >
          {likesCount}
        </span>
      )}
    </button>
  );
};
