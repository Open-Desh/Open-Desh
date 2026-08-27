import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Image as ImageIcon,
  Camera,
  BarChart2,
  Sliders,
  MapPin,
  Check,
  CheckCircle2,
  Loader2,
  Sparkles,
  Building2,
  UserCheck,
  Flame,
  Droplet,
  Construction,
  ShieldAlert,
  Zap,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Plus,
  Compass,
  ChevronRight,
  Info,
  AtSign,
  RotateCcw,
  Bot,
  Search,
  Users,
} from "lucide-react";
import { IssueCategory, LocationGeo, UserProfile, Leader } from "../types.ts";
import { LocationPickerMap } from "./LocationPickerMap.tsx";
import {
  getRegisteredAuthoritiesDirect,
  RegisteredAuthority,
} from "../lib/firestoreSync.ts";
import {
  refineCivicReportTextWithAI,
  determineResponsibleAuthorities,
} from "../lib/aiService.ts";
import { cleanReportText } from "../utils/reportUtils.ts";

interface ComposeGrievanceViewProps {
  userProfile: UserProfile;
  leaders: Leader[];
  initialText?: string;
  initialMention?: string;
  initialCategory?: IssueCategory;
  onCancel: () => void;
  onSubmit: (reportData: {
    text: string;
    category: IssueCategory;
    imageUrl?: string;
    images?: string[];
    structuredDetails?: Record<string, string>;
    taggedOfficers?: string[];
    taggedLeaders?: string[];
    urgencyLevel?: "Normal" | "High Priority" | "Critical Emergency";
    location: LocationGeo;
  }) => Promise<void>;
}

export const ComposeGrievanceView: React.FC<ComposeGrievanceViewProps> = ({
  userProfile,
  leaders,
  initialText = "",
  initialMention,
  initialCategory,
  onCancel,
  onSubmit,
}) => {
  const [text, setText] = useState(() => {
    if (initialText) return initialText;
    if (initialMention) {
      const cleanTag = initialMention.startsWith("@") ? initialMention : `@${initialMention}`;
      return `${cleanTag} `;
    }
    return "";
  });
  const [originalRawText, setOriginalRawText] = useState<string | null>(null);
  const [aiRefinedDraft, setAiRefinedDraft] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory>(initialCategory || "Infrastructure");
  const [urgencyLevel, setUrgencyLevel] = useState<"Normal" | "High Priority" | "Critical Emergency">("Normal");
  const [isAIPolishing, setIsAIPolishing] = useState(false);
  const [aiRefinedSuccess, setAiRefinedSuccess] = useState(false);

  // Multi-image state
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Modals & Bottom Slider States
  const [showCategorySlider, setShowCategorySlider] = useState(false);
  const [showLocationMapModal, setShowLocationMapModal] = useState(false);
  const [showAuthorityDirectoryModal, setShowAuthorityDirectoryModal] = useState(false);
  const [showQuickForm, setShowQuickForm] = useState(false);

  // Authority Directory Modal Search & Filter States
  const [directorySearch, setDirectorySearch] = useState("");
  const [directoryFilter, setDirectoryFilter] = useState<"all" | "department" | "representative">("all");

  // GPS / Geolocation states
  const [locationStatus, setLocationStatus] = useState<"locating" | "locked" | "error">("locating");
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number }>({
    lat: 23.3441,
    lng: 85.3096,
  });
  const [resolvedAddress, setResolvedAddress] = useState<string>("Ranchi Central, Jharkhand");
  const [locationAccuracy, setLocationAccuracy] = useState<string>("± 8m");
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);

  // Database Registered Authorities (Fetched from Firestore)
  const [dbAuthorities, setDbAuthorities] = useState<RegisteredAuthority[]>([]);
  const [activeSelectedTags, setActiveSelectedTags] = useState<string[]>(() => {
    if (initialMention) {
      const cleanTag = initialMention.startsWith("@") ? initialMention : `@${initialMention}`;
      return [cleanTag];
    }
    return [];
  });

  // Manual @ mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState<number>(0);

  // Category specific structured fields
  const [structuredFields, setStructuredFields] = useState<Record<string, string>>({
    roadOrLandmark: "",
    damageDepth: "",
    trafficImpact: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch live registered authorities from Firebase Firestore
  useEffect(() => {
    let isMounted = true;
    getRegisteredAuthoritiesDirect().then((auths) => {
      if (isMounted) {
        setDbAuthorities(auths);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch live GPS on mount
  const fetchLiveGPS = () => {
    setIsRefreshingLocation(true);
    setLocationStatus("locating");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocationCoords({ lat, lng });
          setLocationAccuracy(`± ${Math.round(position.coords.accuracy || 10)}m`);

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
              {
                headers: {
                  "Accept-Language": "en",
                },
              }
            );
            if (res.ok) {
              const data = await res.json();
              const addr = data.address || {};
              const road = addr.road || addr.suburb || addr.neighbourhood || addr.residential || "";
              const ward = addr.suburb || addr.city_district || addr.quarter || "";
              const city = addr.city || addr.town || addr.state_district || "Ranchi";
              const state = addr.state || "Jharkhand";

              const fullFormatted = [road, ward, city, state].filter(Boolean).join(", ");
              setResolvedAddress(fullFormatted || `Sector 4, Ranchi (${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E)`);
            } else {
              setResolvedAddress(`Sector 4, Ranchi East, Jharkhand (${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E)`);
            }
          } catch {
            setResolvedAddress(`Ranchi East Municipal Ward (${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E)`);
          } finally {
            setLocationStatus("locked");
            setIsRefreshingLocation(false);
          }
        },
        () => {
          setLocationCoords({ lat: 23.3441, lng: 85.3096 });
          setResolvedAddress("Ranchi East Municipal Division, Jharkhand");
          setLocationStatus("locked");
          setIsRefreshingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setLocationCoords({ lat: 23.3441, lng: 85.3096 });
      setResolvedAddress("Ranchi Central, Jharkhand");
      setLocationStatus("locked");
      setIsRefreshingLocation(false);
    }
  };

  useEffect(() => {
    fetchLiveGPS();
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Update structured fields template on category change
  useEffect(() => {
    switch (selectedCategory) {
      case "Infrastructure":
        setStructuredFields({
          roadOrLandmark: "",
          damageDepth: "",
          trafficImpact: "",
        });
        break;
      case "Water":
        setStructuredFields({
          disruptionHours: "",
          contaminationType: "",
          pipelineLeakPoint: "",
        });
        break;
      case "Electricity":
        setStructuredFields({
          transformerOrPoleNo: "",
          outageDuration: "",
          voltageOrSparkRisk: "",
        });
        break;
      case "Sanitation":
        setStructuredFields({
          garbageDumpDays: "",
          drainBlockageStatus: "",
          vectorBreedingRisk: "",
        });
        break;
      case "Corruption":
        setStructuredFields({
          govtOfficeAndDesk: "",
          bribeAmountDemanded: "",
          tokenOrAppNo: "",
        });
        break;
      default:
        setStructuredFields({
          landmark: "",
          specificProblem: "",
          impactEstimate: "",
        });
    }
  }, [selectedCategory]);

  // 3. AI Automatic Responsible Department Decider:
  // Evaluates text (ONLY when >= 75 chars), category, and location against authentic registered profiles in the DB
  const isEligibleForAIRouting = text.trim().length >= 75;

  const aiDeterminedAuthorities = useMemo(() => {
    if (!isEligibleForAIRouting) {
      return [];
    }
    return determineResponsibleAuthorities(text, selectedCategory, dbAuthorities, resolvedAddress);
  }, [text, selectedCategory, dbAuthorities, resolvedAddress, isEligibleForAIRouting]);

  // Auto-synchronize AI responsible department tags when post is >= 75 chars
  useEffect(() => {
    if (isEligibleForAIRouting && aiDeterminedAuthorities.length > 0) {
      const aiTags = aiDeterminedAuthorities.map((a) => `@${a.username}`);
      setActiveSelectedTags((prev) => {
        // Keep existing manual tags, merge in AI decided tags
        return Array.from(new Set([...prev, ...aiTags]));
      });
    }
  }, [aiDeterminedAuthorities, isEligibleForAIRouting]);

  // Handle @ mention detection in textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart || 0;
    setText(val);
    setCursorPosition(pos);

    // Look back from cursor to see if user is typing an @ mention
    const textBeforeCursor = val.slice(0, pos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // If there are no spaces after @, user is actively typing a handle
      if (!/\s/.test(textAfterAt)) {
        setMentionQuery(textAfterAt.toLowerCase());
        return;
      }
    }
    setMentionQuery(null);
  };

  // Select an authority from manual @ dropdown
  const handleSelectMention = (auth: RegisteredAuthority) => {
    const textBeforeCursor = text.slice(0, cursorPosition);
    const textAfterCursor = text.slice(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const beforeAt = text.slice(0, lastAtIndex).trimEnd();
      const tag = `@${auth.username}`;
      if (!activeSelectedTags.includes(tag)) {
        setActiveSelectedTags((prev) => [...prev, tag]);
      }
      const newText = beforeAt ? `${beforeAt} ${textAfterCursor.trimStart()}` : textAfterCursor.trimStart();
      setText(newText.trim());
      setMentionQuery(null);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  // Filtered mention list from verified database profiles for inline autocomplete
  const matchingMentions = useMemo(() => {
    if (mentionQuery === null) return [];
    return dbAuthorities.filter(
      (a) =>
        a.username.toLowerCase().includes(mentionQuery) ||
        a.fullName.toLowerCase().includes(mentionQuery) ||
        (a.badge && a.badge.toLowerCase().includes(mentionQuery))
    ).slice(0, 5);
  }, [mentionQuery, dbAuthorities]);

  // Filtered list for the full Authority Directory modal
  const allFilteredAuthorities = useMemo(() => {
    return dbAuthorities.filter((auth) => {
      if (directoryFilter !== "all" && auth.category !== directoryFilter) {
        return false;
      }
      if (!directorySearch.trim()) return true;
      const q = directorySearch.toLowerCase();
      return (
        auth.username.toLowerCase().includes(q) ||
        auth.fullName.toLowerCase().includes(q) ||
        (auth.role && auth.role.toLowerCase().includes(q)) ||
        (auth.location && auth.location.toLowerCase().includes(q)) ||
        (auth.constituency && auth.constituency.toLowerCase().includes(q)) ||
        (auth.badge && auth.badge.toLowerCase().includes(q))
      );
    });
  }, [dbAuthorities, directorySearch, directoryFilter]);

  const toggleTag = (tag: string) => {
    setActiveSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Image upload handling
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newImages: string[] = [];
    const filesArray: File[] = Array.from(files);

    filesArray.forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          newImages.push(reader.result);
          if (newImages.length === filesArray.length) {
            setImages((prev) => [...prev, ...newImages].slice(0, 6)); // Max 6 images
            setIsUploading(false);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  // 4. AI Refine & Civic Structuring: Synthesizes user text + category + location
  const handleAIRefine = async () => {
    if (!text.trim() || isAIPolishing) return;
    setIsAIPolishing(true);

    try {
      if (!originalRawText) {
        setOriginalRawText(text);
      }
      const refined = await refineCivicReportTextWithAI(
        text,
        selectedCategory,
        resolvedAddress
      );
      if (refined && refined.trim()) {
        setAiRefinedDraft(refined.trim());
      }
    } catch (err) {
      console.warn("AI refine notice:", err);
    } finally {
      setIsAIPolishing(false);
    }
  };

  const handleApplyAIDraft = () => {
    if (aiRefinedDraft) {
      if (!originalRawText) {
        setOriginalRawText(text);
      }
      setText(aiRefinedDraft);
      setAiRefinedDraft(null);
      setAiRefinedSuccess(true);
      setTimeout(() => setAiRefinedSuccess(false), 4000);
    }
  };

  const handleDismissAIDraft = () => {
    setAiRefinedDraft(null);
  };

  // Revert back to original raw text
  const handleRevertText = () => {
    if (originalRawText) {
      setText(originalRawText);
      setOriginalRawText(null);
      setAiRefinedSuccess(false);
    }
  };

  // 5. Submit Form with Real Verified DB Routing
  const handleFormSubmit = async () => {
    if (!text.trim() && Object.values(structuredFields).every((v) => !String(v).trim()) && images.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      let fullReportText = text.trim();

      const structuredItems = Object.entries(structuredFields)
        .filter(([_, val]) => String(val).trim() !== "")
        .map(([key, val]) => {
          const readableKey = key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase());
          return `[${readableKey}: ${String(val).trim()}]`;
        });

      if (structuredItems.length > 0 && !fullReportText.includes("[")) {
        fullReportText = fullReportText ? `${fullReportText}\n\n${structuredItems.join(" • ")}` : structuredItems.join(" • ");
      }

      // Collect all tagged mentions from both activeSelectedTags and manual @ tags in text
      const extractedManualMentions = (fullReportText.match(/@+([a-zA-Z0-9_]+)/g) || []);
      const allMentionedTags = Array.from(
        new Set([...activeSelectedTags, ...extractedManualMentions])
      );

      // Verify every tag strictly against registered database profiles (dbAuthorities and leaders)
      const taggedOfficers: string[] = [];
      const taggedLeaders: string[] = [];

      allMentionedTags.forEach((tag) => {
        const cleanH = tag.replace(/^@+/, "").toLowerCase();
        // 1. Check registered departments / authorities in database
        const matchedDept = dbAuthorities.find(
          (a) => a.username.replace(/^@+/, "").toLowerCase() === cleanH
        );
        // 2. Check elected leaders / representatives in database
        const matchedLeader = leaders.find(
          (l) => l.username.replace(/^@+/, "").toLowerCase() === cleanH
        );

        if (matchedDept) {
          const normalizedHandle = `@${matchedDept.username.replace(/^@+/, "")}`;
          if (matchedDept.category === "department") {
            if (!taggedOfficers.includes(normalizedHandle)) taggedOfficers.push(normalizedHandle);
          } else {
            if (!taggedLeaders.includes(normalizedHandle)) taggedLeaders.push(normalizedHandle);
          }
        } else if (matchedLeader) {
          const normalizedHandle = `@${matchedLeader.username.replace(/^@+/, "")}`;
          if (!taggedLeaders.includes(normalizedHandle)) taggedLeaders.push(normalizedHandle);
        }
      });

      // Clean all manual @tags from the text so they live cleanly as structured verified pills
      let cleanContentText = cleanReportText(fullReportText);

      await onSubmit({
        text: cleanContentText || `${selectedCategory} issue reported at ${resolvedAddress}`,
        category: selectedCategory,
        imageUrl: images[0] || undefined,
        images: images,
        structuredDetails: structuredFields,
        taggedOfficers: taggedOfficers,
        taggedLeaders: taggedLeaders,
        urgencyLevel: urgencyLevel,
        location: {
          lat: locationCoords.lat,
          lng: locationCoords.lng,
          city: resolvedAddress,
          address: resolvedAddress,
        },
      });
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modern Categories Definition
  const categories: {
    id: IssueCategory;
    label: string;
    description: string;
    icon: any;
    colorClass: string;
    bgClass: string;
  }[] = [
    {
      id: "Infrastructure",
      label: "Roads & Bridges",
      description: "Potholes, broken asphalt, flyovers, cave-ins, and road safety hazards",
      icon: Construction,
      colorClass: "text-amber-600",
      bgClass: "bg-amber-50 border-amber-200",
    },
    {
      id: "Water",
      label: "Water & Drainage",
      description: "Pipeline bursts, contaminated water, dirty supply, storm drainage blockage",
      icon: Droplet,
      colorClass: "text-blue-600",
      bgClass: "bg-blue-50 border-blue-200",
    },
    {
      id: "Electricity",
      label: "Electricity & Power",
      description: "Transformer blast, broken wires, voltage instability, prolonged blackout",
      icon: Zap,
      colorClass: "text-amber-500",
      bgClass: "bg-amber-50 border-amber-200",
    },
    {
      id: "Sanitation",
      label: "Sanitation & Waste",
      description: "Uncollected garbage dump, overflowing bin, open drains, public health risk",
      icon: Building2,
      colorClass: "text-emerald-600",
      bgClass: "bg-emerald-50 border-emerald-200",
    },
    {
      id: "Corruption",
      label: "Bribe & Corruption",
      description: "Demands for illicit money, extortion, ghost contractor billing, delay extortion",
      icon: ShieldAlert,
      colorClass: "text-rose-600",
      bgClass: "bg-rose-50 border-rose-200",
    },
    {
      id: "Public Transport",
      label: "Public Transport",
      description: "Bus terminal safety, broken transit fleet, traffic lights, commuter rights",
      icon: Compass,
      colorClass: "text-purple-600",
      bgClass: "bg-purple-50 border-purple-200",
    },
    {
      id: "Health",
      label: "Hospital & Health",
      description: "Ambulance delay, missing doctors, expired drugs, clinic hygiene",
      icon: ShieldCheck,
      colorClass: "text-teal-600",
      bgClass: "bg-teal-50 border-teal-200",
    },
    {
      id: "Other",
      label: "General Civic Matter",
      description: "Other civic issues, park maintenance, encroachment, public grievance",
      icon: Info,
      colorClass: "text-slate-600",
      bgClass: "bg-slate-50 border-slate-200",
    },
  ];

  // Character limit calculation
  const charLength = text.length;
  const maxChars = 280;
  const charProgress = Math.min(100, (charLength / maxChars) * 100);

  const selectedCategoryMeta = categories.find((c) => c.id === selectedCategory) || categories[0];
  const CategoryIcon = selectedCategoryMeta.icon;

  return (
    <div className="fixed inset-0 z-[300] bg-white flex flex-col h-[100dvh] max-h-[100dvh] w-full overflow-hidden animate-fade-in font-sans">
      {/* 1. Header Toolbar: Close (left), AI Polish, Urgency, Post (right) */}
      <header className="h-14 px-4 flex items-center justify-between bg-white shrink-0 border-b border-slate-200">
        <button
          onClick={onCancel}
          id="compose-close-btn"
          className="p-2 -ml-2 text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          title="Cancel and close"
        >
          <X className="w-5 h-5 text-slate-800 stroke-[2.2]" />
        </button>

        <div className="flex items-center gap-2">
          {/* Urgency tag indicator */}
          {urgencyLevel === "Critical Emergency" && (
            <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Flame className="w-3 h-3 fill-rose-600" /> Urgent
            </span>
          )}

          {/* Royal Blue Post Button */}
          <button
            onClick={handleFormSubmit}
            disabled={isSubmitting || (!text.trim() && images.length === 0)}
            id="compose-post-btn"
            className={`px-5 py-1.5 rounded-full text-sm font-bold text-white transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
              !text.trim() && images.length === 0
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-600/20"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <span>Post</span>
            )}
          </button>
        </div>
      </header>

      {/* Hidden File / Camera Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        multiple
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* 2. Main Compose Body */}
      <main className="flex-1 overflow-y-auto px-4 py-3 flex flex-col justify-between max-w-xl mx-auto w-full relative">
        <div className="space-y-3 flex-1 flex flex-col">
          {/* Top Control Section: Avatar on left, Controls aligned on right */}
          <div className="flex items-start gap-2.5 pb-1">
            {/* User DP / Avatar */}
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.fullName}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
            />

            {/* Right side aligned content */}
            <div className="flex-1 min-w-0 space-y-1.5">
              {/* Row 1: Category pill & Urgency badge */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Category Slider Trigger Pill */}
                <button
                  type="button"
                  onClick={() => setShowCategorySlider(true)}
                  id="compose-category-slider-trigger"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200 transition-all cursor-pointer shadow-2xs"
                  title="Select category for municipal routing"
                >
                  <CategoryIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>{selectedCategoryMeta.label}</span>
                  <span className="text-[10px] text-blue-500 ml-0.5">▼</span>
                </button>

                {/* Urgent/Critical Active Indicator Badge */}
                {urgencyLevel === "Critical Emergency" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full animate-pulse">
                    <Flame className="w-3 h-3 text-rose-600 fill-rose-500" />
                    URGENT
                  </span>
                )}
              </div>

              {/* Row 2: Location Text */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setShowLocationMapModal(true)}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-blue-600 font-medium cursor-pointer transition-colors max-w-full truncate py-0.5"
                  title="Click to view and adjust location on map"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">{resolvedAddress}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Clean Main Text Input Container */}
          <div className="flex-1 min-h-[140px] flex flex-col relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              placeholder="What civic issue would you like to report? Describe the problem, location details, and citizen impact..."
              rows={4}
              className="w-full text-base sm:text-lg font-medium text-slate-900 placeholder:text-slate-400 border-none outline-none resize-none p-0 focus:ring-0 leading-relaxed bg-transparent flex-1"
            />

            {/* Real-time @ mention autocomplete dropdown */}
            {matchingMentions.length > 0 && (
              <div className="absolute left-0 right-0 top-16 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 animate-fade-in max-h-48 overflow-y-auto">
                <div className="text-[10px] font-bold text-slate-500 px-2 py-1 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <AtSign className="w-3 h-3 text-blue-600" /> Civic Authority Directory
                  </span>
                  <span className="text-[9px] text-slate-400 font-normal">Verified Profiles</span>
                </div>
                {matchingMentions.map((auth) => (
                  <button
                    key={auth.id}
                    type="button"
                    onClick={() => handleSelectMention(auth)}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-blue-50 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={auth.avatarUrl}
                        alt={auth.fullName}
                        className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          @{auth.username}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {auth.fullName} • {auth.role}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full shrink-0 ml-2">
                      {auth.badge || "Verified"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* AI Assistant Section: Triggers when user writes >= 75 characters */}
            {isEligibleForAIRouting ? (
              <div className="pt-2.5 space-y-2 animate-fade-in">
                {/* AI Action Bar */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAIRefine}
                      disabled={isAIPolishing}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs hover:shadow-sm hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer active:scale-95"
                      title="AI will synthesize your text, category & location into an articulate official civic complaint"
                    >
                      {isAIPolishing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                          <span>Generating AI Draft...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                          <span>✨ AI Enhance & Draft</span>
                        </>
                      )}
                    </button>

                    {/* Undo Button if user applied AI text and wants original back */}
                    {originalRawText && (
                      <button
                        type="button"
                        onClick={handleRevertText}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                        title="Revert to your original text"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Undo</span>
                      </button>
                    )}
                  </div>

                  {aiRefinedSuccess && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 animate-fade-in">
                      <Check className="w-3 h-3" /> AI Draft Applied
                    </span>
                  )}
                </div>

                {/* AI Draft Comparison Preview Box (If generated) */}
                {aiRefinedDraft && (
                  <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5 space-y-2.5 animate-fade-in shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        AI Structured Civic Draft
                      </span>
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-full">
                        Synthesized from Text + {selectedCategoryMeta.label} + Location
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                      {aiRefinedDraft}
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={handleDismissAIDraft}
                        className="px-3 py-1 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 transition-colors cursor-pointer"
                      >
                        Keep My Original
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyAIDraft}
                        className="px-4 py-1 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Apply AI Draft
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Helpful writing hint for user before reaching 75 chars */
              charLength > 0 && charLength < 75 && (
                <div className="pt-2 flex items-center gap-1.5 text-[11px] text-slate-400 animate-fade-in">
                  <Info className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>Write {75 - charLength} more characters for AI smart routing & professional draft synthesis.</span>
                </div>
              )
            )}
          </div>

          {/* Attached Photos Preview Grid */}
          {images.length > 0 && (
            <div className="space-y-1.5 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-0.5">
                <span className="flex items-center gap-1 text-slate-700">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" /> Attached Evidence ({images.length}/6)
                </span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" /> Geo-Stamped Proof
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {images.map((imgSrc, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group shadow-2xs"
                  >
                    <img
                      src={imgSrc}
                      alt={`Evidence ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-rose-600 text-white p-1 rounded-full backdrop-blur-xs transition-colors cursor-pointer shadow-xs"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                      #{idx + 1}
                    </div>
                  </div>
                ))}

                {images.length < 6 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-500 hover:bg-blue-50/50 flex flex-col items-center justify-center text-blue-600 transition-colors cursor-pointer"
                  >
                    <Plus className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px] font-bold">Add Photo</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quick-Fill Structured Fields Drawer (If opened via toolbar) */}
          {showQuickForm && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2 animate-fade-in shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  {selectedCategoryMeta.label} Quick Parameters
                </span>
                <button
                  onClick={() => setShowQuickForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {Object.keys(structuredFields).map((fieldKey) => {
                  const label = fieldKey
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (s) => s.toUpperCase());
                  return (
                    <input
                      key={fieldKey}
                      type="text"
                      value={structuredFields[fieldKey]}
                      onChange={(e) =>
                        setStructuredFields((prev) => ({
                          ...prev,
                          [fieldKey]: e.target.value,
                        }))
                      }
                      placeholder={label}
                      className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 text-slate-900 font-medium"
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. Responsible Civic Authorities & Authority Directory Section */}
        <div className="pt-3 pb-1 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Assigned Responsible Authorities:
              </span>
              {activeSelectedTags.length > 0 && (
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  {activeSelectedTags.length} Active
                </span>
              )}
            </div>

            {/* Find Authorities Directory Button */}
            <button
              type="button"
              onClick={() => setShowAuthorityDirectoryModal(true)}
              className="text-blue-600 hover:text-blue-700 font-bold text-[11px] flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Search className="w-3 h-3" />
              <span>Find Authorities</span>
            </button>
          </div>

          {/* Tag Pills Display */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {activeSelectedTags.length > 0 ? (
              activeSelectedTags.map((tag) => {
                const cleanH = tag.replace(/^@+/, "").toLowerCase();
                const matchedAuth = dbAuthorities.find(
                  (a) => a.username.replace(/^@+/, "").toLowerCase() === cleanH
                );
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-blue-600 border border-blue-600 text-white font-bold shrink-0 transition-all cursor-pointer shadow-xs"
                    title={matchedAuth ? `${matchedAuth.fullName} (${matchedAuth.role})` : tag}
                  >
                    {matchedAuth?.avatarUrl && (
                      <img
                        src={matchedAuth.avatarUrl}
                        alt={tag}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    )}
                    <span>{tag}</span>
                    {matchedAuth?.badge && (
                      <span className="text-[10px] text-blue-100 font-normal">
                        ({matchedAuth.badge})
                      </span>
                    )}
                    <X className="w-3 h-3 text-white ml-0.5 hover:scale-125 transition-transform" />
                  </button>
                );
              })
            ) : isEligibleForAIRouting ? (
              <div className="text-[11px] text-slate-500 py-1 px-2.5 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center gap-1.5 w-full">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>No matching local department registered in directory for this area. Tag manually using the directory.</span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 py-1 px-2.5 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl flex items-center gap-1.5 w-full">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Type 75+ characters for AI auto-routing or click "Find Authorities" to select manually.</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 4. Bottom Twitter/X Toolbar */}
      <footer className="shrink-0 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between bg-white z-30 shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 sm:gap-3 text-blue-600">
          {/* 1. Gallery Image Upload */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            id="toolbar-gallery-btn"
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
              images.length > 0 ? "bg-blue-100 text-blue-700" : "hover:bg-blue-50 text-blue-600"
            }`}
            title="Add Evidence Photos from Gallery"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* 2. Camera Snapshot */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            id="toolbar-camera-btn"
            className="w-9 h-9 flex items-center justify-center hover:bg-blue-50 text-blue-600 rounded-full transition-colors cursor-pointer"
            title="Take Evidence Photo with Camera"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* 3. Category Bottom Sheet Slider Trigger */}
          <button
            type="button"
            onClick={() => setShowCategorySlider(true)}
            id="toolbar-sliders-btn"
            className="w-9 h-9 flex items-center justify-center hover:bg-blue-50 text-blue-600 rounded-full transition-colors cursor-pointer"
            title="Select Category from Modern Slider"
          >
            <Sliders className="w-5 h-5" />
          </button>

          {/* 4. Find & Tag Authorities Directory Trigger */}
          <button
            type="button"
            onClick={() => setShowAuthorityDirectoryModal(true)}
            id="toolbar-directory-btn"
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
              activeSelectedTags.length > 0 ? "bg-blue-100 text-blue-700" : "hover:bg-blue-50 text-blue-600"
            }`}
            title="Find & Tag Responsible Authorities"
          >
            <Users className="w-5 h-5" />
          </button>

          {/* 5. Quick-fill structured parameters */}
          <button
            type="button"
            onClick={() => setShowQuickForm(!showQuickForm)}
            id="toolbar-poll-btn"
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
              showQuickForm ? "bg-blue-100 text-blue-700" : "hover:bg-blue-50 text-blue-600"
            }`}
            title="Quick Audit Parameters"
          >
            <BarChart2 className="w-5 h-5" />
          </button>

          {/* 6. Interactive Location Map Trigger */}
          <button
            type="button"
            onClick={() => {
              setShowLocationMapModal(true);
              fetchLiveGPS();
            }}
            id="toolbar-location-btn"
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer relative hover:bg-blue-50 text-blue-600"
            title="Open Interactive Map to Pin Exact Location"
          >
            <MapPin className="w-5 h-5" />
            <span className="w-2 h-2 bg-emerald-500 rounded-full absolute top-1.5 right-1.5 border border-white"></span>
          </button>

          {/* 7. Urgent / Critical Emergency Tag Button */}
          <button
            type="button"
            onClick={() =>
              setUrgencyLevel(urgencyLevel === "Normal" ? "Critical Emergency" : "Normal")
            }
            id="toolbar-urgent-btn"
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-all cursor-pointer ${
              urgencyLevel === "Critical Emergency"
                ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-300"
                : "hover:bg-rose-50 text-slate-500 hover:text-rose-600"
            }`}
            title={
              urgencyLevel === "Critical Emergency"
                ? "Urgent Critical Tag Active"
                : "Mark as Urgent / Critical Emergency"
            }
          >
            <Flame className={`w-5 h-5 ${urgencyLevel === "Critical Emergency" ? "fill-white" : ""}`} />
          </button>
        </div>

        {/* Right side: Character limit circle */}
        <div className="flex items-center gap-3">
          <div className="relative w-5 h-5 flex items-center justify-center">
            <svg className="w-5 h-5 transform -rotate-90">
              <circle
                cx="10"
                cy="10"
                r="8"
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                className="text-slate-200"
              />
              <circle
                cx="10"
                cy="10"
                r="8"
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                strokeDasharray={50.26}
                strokeDashoffset={50.26 - (50.26 * charProgress) / 100}
                className={charLength > 240 ? "text-rose-500" : "text-blue-600"}
              />
            </svg>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 5. MODERN CATEGORY BOTTOM SHEET SLIDER */}
      {/* ========================================================================= */}
      {showCategorySlider && (
        <div className="fixed inset-0 z-[400] flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setShowCategorySlider(false)}
          />

          <div className="relative z-10 w-full max-w-xl mx-auto bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-5 max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Select Issue Category</h3>
                <p className="text-xs text-slate-500">
                  Select the municipal service for targeted department routing
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCategorySlider(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setShowCategorySlider(false);
                    }}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/80 border-blue-600 ring-2 ring-blue-600/20 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${cat.bgClass} ${cat.colorClass}`}
                    >
                      <Icon className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-sm font-bold truncate ${
                            isSelected ? "text-blue-900" : "text-slate-900"
                          }`}
                        >
                          {cat.label}
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                        {cat.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. CIVIC AUTHORITY DIRECTORY MODAL (Search & Tag Authorities) */}
      {/* ========================================================================= */}
      {showAuthorityDirectoryModal && (
        <div className="fixed inset-0 z-[450] bg-white flex flex-col h-[100dvh] max-h-[100dvh] w-full overflow-hidden animate-fade-in font-sans">
          <header className="h-14 px-4 flex items-center justify-between border-b border-slate-200 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAuthorityDirectoryModal(false)}
                className="p-2 -ml-2 text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-800" />
              </button>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Civic Authority Directory</h3>
                <p className="text-[10px] text-slate-500">
                  Search & tag verified departments or elected leaders
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAuthorityDirectoryModal(false)}
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-xs"
            >
              Done ({activeSelectedTags.length})
            </button>
          </header>

          <div className="p-3 border-b border-slate-100 bg-slate-50 space-y-2.5">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                placeholder="Search department, leader, role, or city..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 font-medium"
              />
              {directorySearch && (
                <button
                  type="button"
                  onClick={() => setDirectorySearch("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDirectoryFilter("all")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  directoryFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                All ({dbAuthorities.length})
              </button>
              <button
                type="button"
                onClick={() => setDirectoryFilter("department")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  directoryFilter === "department"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Departments
              </button>
              <button
                type="button"
                onClick={() => setDirectoryFilter("representative")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  directoryFilter === "representative"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Elected Leaders
              </button>
            </div>
          </div>

          {/* Directory List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-w-xl mx-auto w-full">
            {allFilteredAuthorities.length > 0 ? (
              allFilteredAuthorities.map((auth) => {
                const tag = `@${auth.username}`;
                const isSelected = activeSelectedTags.includes(tag);
                return (
                  <button
                    key={auth.id}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`w-full text-left p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/80 border-blue-600 ring-1 ring-blue-600/30"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={auth.avatarUrl}
                        alt={auth.fullName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {auth.fullName}
                          </p>
                          <span className="text-[10px] text-blue-600 font-bold">
                            @{auth.username}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {auth.role} {auth.constituency ? `• ${auth.constituency}` : ""}
                        </p>
                        {auth.location && (
                          <p className="text-[10px] text-slate-400 truncate">
                            📍 {auth.location}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        {auth.badge || "Verified"}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                          isSelected
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Building2 className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-medium">No matching authorities found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. INTERACTIVE MAP SLIDE-UP MODAL */}
      {/* ========================================================================= */}
      {showLocationMapModal && (
        <div className="fixed inset-0 z-[400] bg-white flex flex-col h-[100dvh] max-h-[100dvh] w-full overflow-hidden animate-fade-in">
          <header className="h-14 px-4 flex items-center justify-between border-b border-slate-200 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLocationMapModal(false)}
                className="p-2 -ml-2 text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Pin Location on Map</h3>
                <p className="text-[10px] text-slate-500">Drag map or marker to set location</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowLocationMapModal(false)}
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-xs"
            >
              Confirm Location
            </button>
          </header>

          <div className="flex-1 relative w-full h-full min-h-0 flex flex-col overflow-hidden">
            <LocationPickerMap
              initialCoords={locationCoords}
              initialAddress={resolvedAddress}
              onLocationChange={(coords, addr) => {
                setLocationCoords(coords);
                setResolvedAddress(addr);
                setLocationStatus("locked");
              }}
              onClose={() => setShowLocationMapModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
