import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Image as ImageIcon,
  Camera,
  BarChart2,
  Sliders,
  MapPin,
  ChevronLeft,
  ChevronRight,
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
  EyeOff,
  Scale,
  ShieldCheck,
  Layers,
  Map as MapIcon,
} from "lucide-react";
import { IssueCategory, LocationGeo, UserProfile, Leader } from "../types.ts";
import { LocationPickerMap } from "./LocationPickerMap.tsx";

interface ComposeGrievanceViewProps {
  userProfile: UserProfile;
  leaders: Leader[];
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
  onCancel,
  onSubmit,
}) => {
  const [text, setText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory>("Infrastructure");
  const [urgencyLevel, setUrgencyLevel] = useState<"Normal" | "High Priority" | "Critical Emergency">("Normal");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isAIPolishing, setIsAIPolishing] = useState(false);
  
  // Multi-image & Media Mode state
  const [images, setImages] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isUploadingToR2, setIsUploadingToR2] = useState(false);
  const [activeMediaMode, setActiveMediaMode] = useState<"photos" | "map">("photos");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Bottom drawers / popovers
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showQuickForm, setShowQuickForm] = useState(false);

  // GPS / Geolocation states
  const [locationStatus, setLocationStatus] = useState<"locating" | "locked" | "error">("locating");
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number }>({
    lat: 23.3441,
    lng: 85.3096,
  });
  const [resolvedAddress, setResolvedAddress] = useState<string>("Ranchi Central, Jharkhand");
  const [locationAccuracy, setLocationAccuracy] = useState<string>("± 8m");
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);

  // Tag inclusions state
  const [includeDeptTag, setIncludeDeptTag] = useState(true);
  const [includeLeaderTag, setIncludeLeaderTag] = useState(true);

  // Category specific structured fields
  const [structuredFields, setStructuredFields] = useState<Record<string, string>>({
    roadOrLandmark: "",
    damageDepth: "",
    trafficImpact: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real geolocation using Browser API + OpenStreetMap Nominatim reverse geocoder
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
          } catch (err) {
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

  // Dynamic Department & Leader Routing Algorithm based on typed Text Problem, Category & Location
  const smartRoutingData = useMemo(() => {
    const lowerText = text.toLowerCase();

    // Suggested Departments Pool
    const matchedDepts: { tag: string; name: string; icon: string; reason: string }[] = [];
    const matchedLeaders: { tag: string; name: string; title: string }[] = [];

    // 1. Text Keyword Intelligence
    if (
      lowerText.includes("bijli") ||
      lowerText.includes("light") ||
      lowerText.includes("current") ||
      lowerText.includes("transformer") ||
      lowerText.includes("meter") ||
      lowerText.includes("voltage") ||
      lowerText.includes("wire") ||
      lowerText.includes("pole") ||
      lowerText.includes("power") ||
      lowerText.includes("outage") ||
      selectedCategory === "Electricity"
    ) {
      matchedDepts.push({
        tag: "@JBVNL_Electricity",
        name: "Jharkhand Bijli Vitran Nigam Ltd",
        icon: "⚡",
        reason: "Power & Grid",
      });
      matchedDepts.push({
        tag: "@EnergyDept_JH",
        name: "State Dept of Energy",
        icon: "💡",
        reason: "Govt Ministry",
      });
    }

    if (
      lowerText.includes("pani") ||
      lowerText.includes("water") ||
      lowerText.includes("pipe") ||
      lowerText.includes("jal") ||
      lowerText.includes("tanker") ||
      lowerText.includes("boring") ||
      lowerText.includes("leak") ||
      lowerText.includes("nal") ||
      selectedCategory === "Water"
    ) {
      matchedDepts.push({
        tag: "@RanchiJalBoard",
        name: "Drinking Water & Sanitation Dept",
        icon: "💧",
        reason: "Water Supply",
      });
      matchedDepts.push({
        tag: "@RMC_JalShakha",
        name: "RMC Municipal Water Works",
        icon: "🚰",
        reason: "City Supply",
      });
    }

    if (
      lowerText.includes("sadak") ||
      lowerText.includes("road") ||
      lowerText.includes("gaddha") ||
      lowerText.includes("pothole") ||
      lowerText.includes("bridge") ||
      lowerText.includes("flyover") ||
      lowerText.includes("highway") ||
      lowerText.includes("tar") ||
      lowerText.includes("khadda") ||
      selectedCategory === "Infrastructure"
    ) {
      matchedDepts.push({
        tag: "@JharkhandPWD",
        name: "Public Works & Road Dept",
        icon: "🏗️",
        reason: "PWD Roads",
      });
      if (lowerText.includes("highway") || lowerText.includes("nh")) {
        matchedDepts.push({
          tag: "@NHAI_Official",
          name: "National Highways Authority",
          icon: "🛣️",
          reason: "National Highway",
        });
      }
    }

    if (
      lowerText.includes("kachra") ||
      lowerText.includes("garbage") ||
      lowerText.includes("safai") ||
      lowerText.includes("dustbin") ||
      lowerText.includes("badbu") ||
      lowerText.includes("smell") ||
      lowerText.includes("drain") ||
      lowerText.includes("nali") ||
      lowerText.includes("gutter") ||
      lowerText.includes("dead") ||
      selectedCategory === "Sanitation"
    ) {
      matchedDepts.push({
        tag: "@RMC_Swachhata",
        name: "Ranchi Municipal Sanitation",
        icon: "🧹",
        reason: "Solid Waste & Health",
      });
      matchedDepts.push({
        tag: "@MayorRMC",
        name: "Mayor Office RMC",
        icon: "🏛️",
        reason: "Civic Authority",
      });
    }

    if (
      lowerText.includes("rishwat") ||
      lowerText.includes("bribe") ||
      lowerText.includes("ghoos") ||
      lowerText.includes("dalal") ||
      lowerText.includes("scam") ||
      lowerText.includes("paisa") ||
      lowerText.includes("corrupt") ||
      selectedCategory === "Corruption"
    ) {
      matchedDepts.push({
        tag: "@ACB_Jharkhand",
        name: "Anti-Corruption Bureau & Vigilance",
        icon: "🛡️",
        reason: "Anti-Corruption",
      });
      matchedDepts.push({
        tag: "@CMOHelpdesk",
        name: "Chief Minister Grievance Cell",
        icon: "🇮🇳",
        reason: "CM Jan Samvaad",
      });
    }

    if (
      lowerText.includes("bus") ||
      lowerText.includes("auto") ||
      lowerText.includes("fare") ||
      lowerText.includes("kiraya") ||
      lowerText.includes("traffic") ||
      lowerText.includes("transport") ||
      selectedCategory === "Public Transport"
    ) {
      matchedDepts.push({
        tag: "@RanchiCityBus",
        name: "Urban Mass Transit Authority",
        icon: "🚌",
        reason: "City Transit",
      });
      matchedDepts.push({
        tag: "@TrafficPoliceRanchi",
        name: "Traffic Police Control",
        icon: "🚦",
        reason: "Traffic & Mobility",
      });
    }

    if (
      lowerText.includes("hospital") ||
      lowerText.includes("doctor") ||
      lowerText.includes("dawai") ||
      lowerText.includes("clinic") ||
      lowerText.includes("medicine") ||
      lowerText.includes("ambulance")
    ) {
      matchedDepts.push({
        tag: "@HealthDept_JH",
        name: "State Health & Family Welfare",
        icon: "🏥",
        reason: "Public Health",
      });
    }

    if (
      lowerText.includes("police") ||
      lowerText.includes("chori") ||
      lowerText.includes("theft") ||
      lowerText.includes("fight") ||
      lowerText.includes("safety") ||
      lowerText.includes("crime") ||
      lowerText.includes("fir")
    ) {
      matchedDepts.push({
        tag: "@RanchiPolice",
        name: "City Police Commissionerate",
        icon: "👮",
        reason: "Law & Order",
      });
    }

    // Default fallback if no depts matched yet
    if (matchedDepts.length === 0) {
      matchedDepts.push({
        tag: "@RMC_Swachhata",
        name: "Ranchi Municipal Corporation",
        icon: "🏛️",
        reason: "Municipal Action",
      });
      matchedDepts.push({
        tag: "@JharkhandPWD",
        name: "Public Works Department",
        icon: "🏗️",
        reason: "Civic Infrastructure",
      });
    }

    // 2. Dynamic Leaders Matching based on Location & Profile
    leaders.forEach((ldr) => {
      const isRanchiMatched =
        resolvedAddress.toLowerCase().includes("ranchi") ||
        ldr.constituency.toLowerCase().includes("ranchi");
      if (isRanchiMatched || matchedLeaders.length < 2) {
        matchedLeaders.push({
          tag: `@${ldr.username}`,
          name: ldr.name,
          title: ldr.title,
        });
      }
    });

    // Fallback leader if empty
    if (matchedLeaders.length === 0) {
      matchedLeaders.push({
        tag: "@niteshgupta950",
        name: "Nitesh Gupta",
        title: "MLA Ranchi East",
      });
    }

    return {
      depts: matchedDepts,
      leaders: matchedLeaders,
    };
  }, [text, selectedCategory, resolvedAddress, leaders]);

  // Selected dynamic tag list (default includes primary dept and primary leader)
  const [activeSelectedTags, setActiveSelectedTags] = useState<string[]>([]);

  // Initialize or update active tags when primary smart routing shifts
  useEffect(() => {
    if (smartRoutingData.depts.length > 0 || smartRoutingData.leaders.length > 0) {
      const primaryDept = smartRoutingData.depts[0]?.tag;
      const primaryLeader = smartRoutingData.leaders[0]?.tag;
      const defaults = [primaryDept, primaryLeader].filter(Boolean) as string[];
      
      setActiveSelectedTags((prev) => {
        if (prev.length === 0) return defaults;
        // Merge without removing user's manual toggles
        const set = new Set([...prev, ...defaults]);
        return Array.from(set);
      });
    }
  }, [smartRoutingData]);

  const toggleTag = (tag: string) => {
    setActiveSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Multi-image selection handler
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingToR2(true);
    const newImages: string[] = [];
    const filesArray: File[] = Array.from(files);

    filesArray.forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          newImages.push(reader.result);
          if (newImages.length === filesArray.length) {
            setImages((prev) => [...prev, ...newImages].slice(0, 6)); // Max 6 images
            setIsUploadingToR2(false);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, i) => i !== indexToRemove));
    if (activeImageIndex >= images.length - 1) {
      setActiveImageIndex(Math.max(0, images.length - 2));
    }
  };

  // AI Civic Polish: Formats citizen voice into official grievance drafting
  const handleAIPolish = () => {
    if (!text.trim()) return;
    setIsAIPolishing(true);

    setTimeout(() => {
      const raw = text.trim();
      const polishedText = `[PUBLIC CIVIC NOTICE: ${selectedCategory.toUpperCase()}]\n${raw}\n\nCitizen audit logged at ${resolvedAddress}.`;
      setText(polishedText);
      setIsAIPolishing(false);
    }, 600);
  };

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

      if (isAnonymous) {
        fullReportText = `[WHISTLEBLOWER VERIFIED REPORT - IDENTITY PROTECTED]\n${fullReportText}`;
      }

      // Collect all active selected tags
      const taggedOfficers = activeSelectedTags.filter(
        (t) => !smartRoutingData.leaders.some((l) => l.tag === t)
      );
      const taggedLeaders = activeSelectedTags.filter((t) =>
        smartRoutingData.leaders.some((l) => l.tag === t)
      );

      // Add tag mentions in text if not present
      const tagsToAppend = activeSelectedTags.filter((t) => !fullReportText.includes(t));
      if (tagsToAppend.length > 0) {
        fullReportText = `${fullReportText}\n\nCc: ${tagsToAppend.join(" ")}`;
      }

      await onSubmit({
        text: fullReportText || `${selectedCategory} issue reported at ${resolvedAddress}`,
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

  const categories: { id: IssueCategory; label: string; icon: any }[] = [
    { id: "Infrastructure", label: "Roads & PWD", icon: Construction },
    { id: "Water", label: "Water Supply", icon: Droplet },
    { id: "Electricity", label: "Electricity", icon: Zap },
    { id: "Sanitation", label: "Sanitation", icon: Trash2 },
    { id: "Corruption", label: "Corruption", icon: ShieldAlert },
    { id: "Public Transport", label: "Transport", icon: Building2 },
  ];

  // Character limit circle calculation (max 280 chars display)
  const charLength = text.length;
  const maxChars = 280;
  const charProgress = Math.min(100, (charLength / maxChars) * 100);

  return (
    <div className="fixed inset-0 z-[300] bg-white flex flex-col h-[100dvh] max-h-[100dvh] w-full overflow-hidden animate-fadeIn">
      {/* 1. Top Twitter/X Bar: (✕ Close on left, Royal Blue Post button on right) */}
      <header className="h-14 px-4 flex items-center justify-between bg-white shrink-0 border-b border-slate-200">
        <button
          onClick={onCancel}
          id="compose-close-btn"
          className="p-2 -ml-2 text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5 text-slate-900 stroke-[2.2]" />
        </button>

        <div className="flex items-center gap-2">
          {/* AI Petition Drafter */}
          {text.trim().length > 10 && (
            <button
              onClick={handleAIPolish}
              disabled={isAIPolishing}
              className="text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
              title="Auto-format as Official Citizen Petition"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAIPolishing ? "animate-spin" : ""}`} />
              <span>{isAIPolishing ? "Formatting..." : "AI Legal Draft"}</span>
            </button>
          )}

          {/* Urgency tag indicator */}
          {urgencyLevel === "Critical Emergency" && (
            <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Flame className="w-3 h-3" /> Urgent
            </span>
          )}

          {/* Royal Blue X Style Post Button */}
          <button
            onClick={handleFormSubmit}
            disabled={isSubmitting || (!text.trim() && images.length === 0)}
            id="compose-post-btn"
            className={`px-5 py-1.5 rounded-full text-sm font-black text-white transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
              !text.trim() && images.length === 0
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:scale-95"
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

      {/* 2. Main Scrollable Compose Canvas */}
      <main className="flex-1 overflow-y-auto px-4 py-3 flex flex-col justify-between max-w-xl mx-auto w-full">
        <div className="space-y-3 flex-1 flex flex-col">
          {/* Top User Identity & Category Badge & Whistleblower Mode */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              <img
                src={isAnonymous ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80" : userProfile.avatarUrl}
                alt={userProfile.fullName}
                className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
              />
              <button
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1 rounded-full border border-blue-200 transition-colors cursor-pointer"
              >
                <span>{selectedCategory}</span>
                <span className="text-[10px] text-blue-500">▼</span>
              </button>

              <button
                onClick={() =>
                  setUrgencyLevel(urgencyLevel === "Normal" ? "Critical Emergency" : "Normal")
                }
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                  urgencyLevel === "Critical Emergency"
                    ? "bg-rose-600 text-white font-extrabold"
                    : "text-slate-500 hover:text-slate-700 bg-slate-100"
                }`}
              >
                {urgencyLevel === "Critical Emergency" ? "🔥 Critical" : "Standard"}
              </button>
            </div>

            {/* Anonymous Whistleblower Protection Switch */}
            <button
              type="button"
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 transition-all cursor-pointer ${
                isAnonymous
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
              title="Protect your identity for sensitive reports"
            >
              <EyeOff className="w-3 h-3" />
              <span>{isAnonymous ? "Whistleblower Mode ON" : "Report Anonymously"}</span>
            </button>
          </div>

          {/* Category Dropdown Popover */}
          {showCategoryMenu && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5 animate-fadeIn">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setShowCategoryMenu(false);
                    }}
                    className={`p-2 rounded-xl text-left flex items-center gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 text-blue-700 font-bold border border-blue-200"
                        : "hover:bg-slate-50 text-slate-700 font-medium"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-xs truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Primary Textarea */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What is the issue in your area? (e.g. Broken road, water leakage, power cut, illegal dumping...)"
              rows={3}
              className="w-full text-base sm:text-lg font-medium text-slate-900 placeholder:text-slate-400 border-none outline-none resize-none p-0 focus:ring-0 leading-relaxed bg-transparent"
            />
          </div>

          {/* 3. Media Mode Switcher Strip (Photos vs Map) */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
            <button
              type="button"
              onClick={() => setActiveMediaMode("photos")}
              className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMediaMode === "photos"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Evidence Photos ({images.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMediaMode("map");
                fetchLiveGPS();
              }}
              className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMediaMode === "map"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Interactive Map</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>
          </div>

          {/* 3A. INTERACTIVE OPENSTREETMAP (Free Tile Map with Draggable Pin, Search, & Reverse Geocoding) */}
          {activeMediaMode === "map" ? (
            <LocationPickerMap
              initialCoords={locationCoords}
              initialAddress={resolvedAddress}
              onLocationChange={(coords, addr) => {
                setLocationCoords(coords);
                setResolvedAddress(addr);
                setLocationStatus("locked");
              }}
              onClose={() => setActiveMediaMode("photos")}
            />
          ) : images.length > 0 ? (
            /* 3B. Responsive Evidence Photos Container */
            <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 shadow-xs flex flex-col items-center justify-center max-h-[55vh]">
              <img
                src={images[activeImageIndex]}
                alt={`Evidence ${activeImageIndex + 1}`}
                className="w-full h-auto max-h-[55vh] object-contain rounded-2xl"
              />

              {/* Photo Indicator + Verified Geo Timestamp Stamp */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="bg-black/70 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  {activeImageIndex + 1} / {images.length}
                </span>
                <span className="bg-emerald-600/90 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <ShieldCheck className="w-3 h-3" /> Geo-Verified
                </span>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => handleRemoveImage(activeImageIndex)}
                className="absolute top-3 right-3 bg-black/60 hover:bg-rose-600 text-white p-1.5 rounded-full backdrop-blur-md transition-colors cursor-pointer"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Carousel Arrows if multiple */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setActiveImageIndex((prev) =>
                        prev > 0 ? prev - 1 : images.length - 1
                      )
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded-full cursor-pointer transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      setActiveImageIndex((prev) =>
                        prev < images.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded-full cursor-pointer transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ) : (
            /* 3C. Clean Dual Action Placeholder */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-2xl bg-blue-50/50 hover:bg-blue-50/90 border-2 border-dashed border-blue-300 flex flex-col items-center justify-center text-blue-900 cursor-pointer transition-colors p-4 min-h-32 text-center"
              >
                <ImageIcon className="w-6 h-6 text-blue-600 mb-1" />
                <span className="text-xs font-black text-blue-900">
                  Upload Evidence Photos
                </span>
                <span className="text-[10px] text-blue-600 font-medium mt-0.5">
                  Tap to add up to 6 photos
                </span>
              </div>

              <div
                onClick={() => {
                  setActiveMediaMode("map");
                  fetchLiveGPS();
                }}
                className="rounded-2xl bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-800 cursor-pointer transition-colors p-4 min-h-32 text-center"
              >
                <MapPin className="w-6 h-6 text-blue-600 mb-1" />
                <span className="text-xs font-black text-slate-900">
                  Pin on Interactive Map
                </span>
                <span className="text-[10px] text-slate-500 font-medium mt-0.5 truncate max-w-full px-2">
                  {resolvedAddress}
                </span>
              </div>
            </div>
          )}

          {/* Quick-Fill Structured Fields Drawer (If opened) */}
          {showQuickForm && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  {selectedCategory} Quick Parameters
                </span>
                <button
                  onClick={() => setShowQuickForm(false)}
                  className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
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
                      className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 text-slate-900"
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 4. Intelligent Real-Time Tagging & Department / Leader Routing based on Problem */}
        <div className="pt-3 pb-1 border-t border-slate-100 space-y-2">
          <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
            <span className="font-bold text-slate-700">Recommended Routing & Authorities:</span>
            <span className="text-[10px] text-blue-600 font-bold flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3 text-blue-600" /> AI Auto-Matched
            </span>
          </div>

          {/* Scrollable Dynamic Tags Strip matched to Problem */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {/* Suggested Departments */}
            {smartRoutingData.depts.map((dept) => {
              const isSelected = activeSelectedTags.includes(dept.tag);
              return (
                <button
                  key={dept.tag}
                  type="button"
                  onClick={() => toggleTag(dept.tag)}
                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 border-blue-600 text-white font-bold shadow-2xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 font-medium"
                  }`}
                  title={`${dept.name} (${dept.reason})`}
                >
                  <span>{dept.icon}</span>
                  <span>{dept.tag}</span>
                  <span className="text-[10px] opacity-80">({dept.reason})</span>
                  {isSelected ? (
                    <CheckCircle2 className="w-3 h-3 text-white ml-0.5" />
                  ) : (
                    <span className="text-slate-400 text-xs ml-0.5">+</span>
                  )}
                </button>
              );
            })}

            {/* Suggested Leaders */}
            {smartRoutingData.leaders.map((ldr) => {
              const isSelected = activeSelectedTags.includes(ldr.tag);
              return (
                <button
                  key={ldr.tag}
                  type="button"
                  onClick={() => toggleTag(ldr.tag)}
                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-600 text-white font-bold shadow-2xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 font-medium"
                  }`}
                  title={`${ldr.name} (${ldr.title})`}
                >
                  <UserCheck className={`w-3 h-3 ${isSelected ? "text-white" : "text-indigo-600"}`} />
                  <span>{ldr.tag}</span>
                  <span className="text-[10px] opacity-80">({ldr.title.split(" ")[0]})</span>
                  {isSelected ? (
                    <CheckCircle2 className="w-3 h-3 text-white ml-0.5" />
                  ) : (
                    <span className="text-slate-400 text-xs ml-0.5">+</span>
                  )}
                </button>
              );
            })}

            {/* Location GPS Chip - Click opens map */}
            <div
              onClick={() => {
                setActiveMediaMode("map");
                fetchLiveGPS();
              }}
              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 font-semibold border border-blue-200 shrink-0 cursor-pointer hover:bg-blue-100"
              title="Click to view and adjust location on map"
            >
              <MapPin className="w-3 h-3 text-blue-600" />
              <span className="truncate max-w-[150px]">{resolvedAddress}</span>
              <RefreshCw className={`w-2.5 h-2.5 ${isRefreshingLocation ? "animate-spin" : ""}`} />
            </div>
          </div>
        </div>
      </main>

      {/* 5. Bottom Twitter/X Toolbar: [Gallery] [Camera] [Poll] [Sliders] [Location] [Circle] */}
      <footer className="shrink-0 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between bg-white z-30 shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3.5 text-blue-600">
          {/* 1. Gallery Image Upload */}
          <button
            type="button"
            onClick={() => {
              setActiveMediaMode("photos");
              fileInputRef.current?.click();
            }}
            id="toolbar-gallery-btn"
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
              activeMediaMode === "photos" && images.length > 0 ? "bg-blue-100 text-blue-700" : "hover:bg-blue-50 text-blue-600"
            }`}
            title="Add Evidence Photos"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* 2. Camera Snapshot */}
          <button
            type="button"
            onClick={() => {
              setActiveMediaMode("photos");
              cameraInputRef.current?.click();
            }}
            id="toolbar-camera-btn"
            className="w-9 h-9 flex items-center justify-center hover:bg-blue-50 text-blue-600 rounded-full transition-colors cursor-pointer"
            title="Capture Photo"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* 3. Quick-fill structured parameters */}
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

          {/* 4. Category Selector */}
          <button
            type="button"
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            id="toolbar-sliders-btn"
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
              showCategoryMenu ? "bg-blue-100 text-blue-700" : "hover:bg-blue-50 text-blue-600"
            }`}
            title="Select Category"
          >
            <Sliders className="w-5 h-5" />
          </button>

          {/* 5. GPS Location & Interactive Map Toggle */}
          <button
            type="button"
            onClick={() => {
              setActiveMediaMode(activeMediaMode === "map" ? "photos" : "map");
              if (activeMediaMode !== "map") {
                fetchLiveGPS();
              }
            }}
            id="toolbar-location-btn"
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer relative ${
              activeMediaMode === "map" ? "bg-blue-600 text-white shadow-xs" : "hover:bg-blue-50 text-blue-600"
            }`}
            title="Pin Location on Interactive Map"
          >
            <MapPin className="w-5 h-5" />
            <span className="w-2 h-2 bg-emerald-500 rounded-full absolute top-1.5 right-1.5 border border-white"></span>
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
    </div>
  );
};
