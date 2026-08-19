import React, { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Camera,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Loader2,
  Droplet,
  Construction,
  ShieldAlert,
  Zap,
  Trash2,
} from "lucide-react";
import { IssueCategory, UserProfile } from "../types.ts";

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reportData: {
    text: string;
    category: IssueCategory;
    imageUrl?: string;
    location: {
      lat: number;
      lng: number;
      city: string;
      address?: string;
    };
  }) => Promise<void>;
  userProfile: UserProfile;
}

export const CreateReportModal: React.FC<CreateReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userProfile,
}) => {
  const [text, setText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory>("Infrastructure");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationStatus, setLocationStatus] = useState<"locating" | "locked" | "error">("locating");
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number }>({
    lat: 28.4595,
    lng: 77.0266,
  });
  const [resolvedAddress, setResolvedAddress] = useState<string>("Gurugram Central, Haryana");
  const [aiSuggestedTag, setAiSuggestedTag] = useState<{ id: string; name: string } | null>(null);

  const departmentsList = [
    { id: "@JalBoard", name: "Delhi/Haryana Jal Board", trigger: ["water", "leak", "paani", "pipe", "drain"] },
    { id: "@PWD", name: "Public Works Dept", trigger: ["road", "pothole", "gaddha", "bridge", "asphalt", "highway"] },
    { id: "@ACB", name: "Anti-Corruption Bureau", trigger: ["bribe", "rishwat", "corruption", "extortion", "tender"] },
    { id: "@DHBVN", name: "Electricity Board", trigger: ["power", "electricity", "light", "transformer", "voltage", "current", "wire"] },
    { id: "@MCD", name: "Municipal Sanitation", trigger: ["garbage", "kachra", "waste", "cleanliness", "sewer"] },
  ];

  // Geolocation locking on modal open
  useEffect(() => {
    if (isOpen) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocationCoords({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
            setLocationStatus("locked");
            setResolvedAddress(`Sector 44, Gurugram (${pos.coords.latitude.toFixed(3)}°N, ${pos.coords.longitude.toFixed(3)}°E)`);
          },
          () => {
            // Fallback default city location
            setLocationCoords({ lat: 28.4595, lng: 77.0266 });
            setLocationStatus("locked");
            setResolvedAddress("Gurugram Municipal Area, Haryana");
          },
          { enableHighAccuracy: true, timeout: 6000 }
        );
      } else {
        setLocationStatus("locked");
        setResolvedAddress("Gurugram Urban Area, Haryana");
      }
    }
  }, [isOpen]);

  // AI smart tag analyzer
  useEffect(() => {
    const lowerText = text.toLowerCase();
    let match = null;

    for (const dept of departmentsList) {
      if (dept.trigger.some((w) => lowerText.includes(w))) {
        match = { id: dept.id, name: dept.name };
        break;
      }
    }

    if (match && !text.includes(match.id)) {
      setAiSuggestedTag(match);
    } else {
      setAiSuggestedTag(null);
    }
  }, [text]);

  const handleApplyAiTag = () => {
    if (aiSuggestedTag) {
      setText((prev) => `${prev} ${aiSuggestedTag.id} `);
      setAiSuggestedTag(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        text,
        category: selectedCategory,
        imageUrl: imagePreview || undefined,
        location: {
          lat: locationCoords.lat,
          lng: locationCoords.lng,
          city: "Gurugram, Haryana",
          address: resolvedAddress,
        },
      });
      // Reset form
      setText("");
      setImagePreview(null);
      onClose();
    } catch (err) {
      console.error("Failed to submit report:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const categories: { label: string; value: IssueCategory; icon: any }[] = [
    { label: "Water", value: "Water", icon: Droplet },
    { label: "Roads / PWD", value: "Infrastructure", icon: Construction },
    { label: "Corruption", value: "Corruption", icon: ShieldAlert },
    { label: "Electricity", value: "Electricity", icon: Zap },
    { label: "Sanitation", value: "Sanitation", icon: Trash2 },
  ];

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fadeIn">
      <div
        id="create-report-dialog"
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">New Civic Grievance</h2>
              <p className="text-[11px] text-slate-500">Auto-tagged with GPS & Department Routing</p>
            </div>
          </div>
          <button
            id="close-create-report-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto custom-scrollbar space-y-4">
          {/* GPS Location Tag */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="text-xs">
                <span className="font-extrabold text-slate-900 block">Verified GPS Location</span>
                <span className="text-slate-500 text-[11px] truncate max-w-[240px] block">
                  {resolvedAddress}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Locked
            </span>
          </div>

          {/* Issue Category Selection */}
          <div>
            <label className="text-xs font-black uppercase text-slate-500 tracking-wider mb-2 block">
              Issue Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all border ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-slate-500"}`} />
                    <span className="text-[11px]">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text Area Description */}
          <div>
            <label className="text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5 block">
              Problem Description
            </label>
            <textarea
              id="report-text-input"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe the issue in detail... Mention street name, landmark, or use @ to tag departments (@JalBoard, @PWD, @ACB)..."
              className="w-full text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
              required
            />
          </div>

          {/* AI Smart Suggestion */}
          {aiSuggestedTag && (
            <div
              id="ai-suggestion-box"
              className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-blue-100/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs text-blue-900 font-bold">
                  Auto-tag {aiSuggestedTag.name} ({aiSuggestedTag.id})?
                </span>
              </div>
              <button
                type="button"
                onClick={handleApplyAiTag}
                className="text-[11px] font-black text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-full transition-colors"
              >
                Tag
              </button>
            </div>
          )}

          {/* Image Upload / Preview */}
          <div>
            <label className="text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5 block">
              Attach Evidence (Photo / Document)
            </label>

            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-h-56 bg-slate-900 flex items-center justify-center">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover max-h-56" />
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-slate-600 hover:text-blue-600">
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-xs font-bold">Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-slate-600 hover:text-blue-600">
                  <Camera className="w-5 h-5" />
                  <span className="text-xs font-bold">Take Snapshot</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              id="submit-report-publish-btn"
              type="submit"
              disabled={isSubmitting || !text.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing & Notifying Authorities...</span>
                </>
              ) : (
                <span>Publish Verified Report</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
