import React, { useState, useEffect } from "react";
import { Download, X, Smartphone, Sparkles } from "lucide-react";
import { usePwaInstall } from "../hooks/usePwaInstall.ts";

interface PwaInstallBannerProps {
  onOpenModal: () => void;
}

export const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({ onOpenModal }) => {
  const { isInstalled, hasNativePrompt, installApp } = usePwaInstall();
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    try {
      const isDismissed = sessionStorage.getItem("open_desh_pwa_banner_dismissed");
      if (isDismissed) {
        setDismissed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  if (isInstalled || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("open_desh_pwa_banner_dismissed", "true");
    } catch {
      // ignore
    }
  };

  const handleQuickInstall = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasNativePrompt) {
      await installApp();
    } else {
      onOpenModal();
    }
  };

  return (
    <div className="mx-3 my-2.5 sm:mx-4 p-3 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl text-white shadow-md flex items-center justify-between gap-3 border border-blue-500/30 animate-fadeIn relative overflow-hidden">
      {/* Background soft glow */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-white p-1 shrink-0 shadow-xs flex items-center justify-center">
          <img src="/logo.png" alt="Open Desh" className="w-full h-full object-contain" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black truncate">Download Open Desh App</span>
            <span className="px-1.5 py-0.2 bg-white/20 text-[9px] font-black rounded uppercase tracking-wider shrink-0">
              FREE
            </span>
          </div>
          <p className="text-[11px] text-blue-100 truncate font-medium">
            Install from Chrome for instant alerts &amp; offline mode
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleQuickInstall}
          className="px-3.5 py-1.5 bg-white hover:bg-blue-50 active:scale-95 text-blue-700 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Install</span>
        </button>

        <button
          onClick={handleDismiss}
          className="p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
