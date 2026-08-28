import React, { useState } from "react";
import {
  Download,
  X,
  Smartphone,
  Zap,
  Bell,
  WifiOff,
  CheckCircle2,
  Share,
  MoreVertical,
  PlusSquare,
  ShieldCheck,
  Globe,
} from "lucide-react";
import { usePwaInstall } from "../hooks/usePwaInstall.ts";

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstalled, isIOS, installApp, hasNativePrompt } = usePwaInstall();
  const [installStatus, setInstallStatus] = useState<"idle" | "installing" | "success" | "manual">("idle");

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (hasNativePrompt) {
      setInstallStatus("installing");
      const res = await installApp();
      if (res === "accepted") {
        setInstallStatus("success");
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setInstallStatus("idle");
      }
    } else {
      setInstallStatus("manual");
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden relative animate-scaleUp">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 pt-6 pb-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0">
              <img
                src="/logo.png"
                alt="Open Desh Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-lg font-black tracking-tight">Open Desh App</h3>
                <span className="px-1.5 py-0.5 bg-white/20 text-[10px] font-extrabold uppercase rounded tracking-wider">
                  PWA
                </span>
              </div>
              <p className="text-blue-100 text-xs font-medium">
                Open Voice, Open Desh • Fast & Lightweight (&lt; 2 MB)
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Key Advantages */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-800">Instant Launch</h4>
                <p className="text-[11px] text-slate-500 leading-tight">Zero loading delay from home screen</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <WifiOff className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-800">Offline Caching</h4>
                <p className="text-[11px] text-slate-500 leading-tight">View saved grievances without network</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Bell className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-800">Real-Time Alerts</h4>
                <p className="text-[11px] text-slate-500 leading-tight">Direct updates on grievance progress</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-800">100% Safe & Secure</h4>
                <p className="text-[11px] text-slate-500 leading-tight">Verified Google PWA standard</p>
              </div>
            </div>
          </div>

          {/* Installation Status / Instructions */}
          {isInstalled ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1.5">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 mb-1">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-emerald-800">
                Open Desh is already installed on this device!
              </p>
              <p className="text-[11px] text-emerald-600">
                You can launch it directly from your device home screen or app drawer.
              </p>
            </div>
          ) : isIOS ? (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-3">
              <p className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-blue-600" />
                How to install on iPhone / iPad (Safari):
              </p>
              <ol className="text-xs text-blue-800 space-y-2 pl-4 list-decimal font-medium">
                <li>
                  Tap the <strong className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white rounded border border-blue-200 text-blue-700"><Share className="w-3 h-3 inline" /> Share</strong> button at the bottom of Safari.
                </li>
                <li>
                  Scroll down and tap <strong className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white rounded border border-blue-200 text-blue-700"><PlusSquare className="w-3 h-3 inline" /> Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong>Add</strong> at top right to download.
                </li>
              </ol>
            </div>
          ) : !hasNativePrompt || installStatus === "manual" ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-600" />
                How to install in Chrome Browser:
              </p>
              <ol className="text-xs text-slate-700 space-y-2 pl-4 list-decimal font-medium">
                <li>
                  Tap the <strong>3-dots menu (<MoreVertical className="w-3 h-3 inline text-slate-600" />)</strong> at the top right of Chrome.
                </li>
                <li>
                  Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                </li>
                <li>
                  Confirm <strong>Install</strong> to add Open Desh to your device.
                </li>
              </ol>
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            {!isInstalled && (
              <button
                onClick={handleInstallClick}
                disabled={installStatus === "installing"}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {installStatus === "installing" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Opening Install Dialog...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{hasNativePrompt ? "Install App Now (1-Click)" : "Install Open Desh App"}</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              {isInstalled ? "Done" : "Continue in Browser"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
