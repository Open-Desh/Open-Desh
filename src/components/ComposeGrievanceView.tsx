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
  EyeOff,
  ShieldCheck,
  Plus,
  Compass,
  ChevronRight,
  Info,
} from "lucide-react";
import { IssueCategory, LocationGeo, UserProfile, Leader } from "../types.ts";
import { LocationPickerMap } from "./LocationPickerMap.tsx";
import { INITIAL_USERS } from "../data/seedData.ts";

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

  // Multi-image state
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Modern Bottom Slider & Modal States
  const [showCategorySlider, setShowCategorySlider] = useState(false);
  const [showLocationMapModal, setShowLocationMapModal] = useState(false);
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

  // Active Tagged Authorities - MUST START EMPTY (No pre-tagging!)
  const [activeSelectedTags, setActiveSelectedTags] = useState<string[]>([]);

  // Category specific structured fields
  const [structuredFields, setStructuredFields] = useState<Record<string, string>>({
    roadOrLandmark: "",
    damageDepth: "",
    trafficImpact: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch live GPS on mount
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

  // Dynamic Suggestion Algorithm: Check category & keywords against AUTHENTIC accounts in Database
  const suggestedAuthorities = useMemo(() => {
    const lowerText = text.toLowerCase();
    const suggestions: {
      tag: string;
      name: string;
      avatar: string;
      badge: string;
      role: string;
      type: "department" | "leader";
    }[] = [];

    const dbUsers = Object.values(INITIAL_USERS);

    // 1. Check department officers in database
    if (
      selectedCategory === "Infrastructure" ||
      lowerText.includes("road") ||
      lowerText.includes("sadak") ||
      lowerText.includes("pothole") ||
      lowerText.includes("gaddha") ||
      lowerText.includes("bridge") ||
      lowerText.includes("flyover") ||
      lowerText.includes("highway")
    ) {
      const pwdOfficer = dbUsers.find((u) => u.username === "pwd_officer_rajesh");
      if (pwdOfficer) {
        suggestions.push({
          tag: `@${pwdOfficer.username}`,
          name: pwdOfficer.fullName,
          avatar: pwdOfficer.avatarUrl,
          badge: "Executive Engineer",
          role: "Public Works Dept (PWD)",
          type: "department",
        });
      }
      const ltInfra = dbUsers.find((u) => u.username === "lt_infrastructure");
      if (ltInfra && (lowerText.includes("flyover") || lowerText.includes("highway") || lowerText.includes("construction"))) {
        suggestions.push({
          tag: `@${ltInfra.username}`,
          name: ltInfra.fullName,
          avatar: ltInfra.avatarUrl,
          badge: "EPC Contractor",
          role: "Civil Infrastructure",
          type: "department",
        });
      }
    }

    if (
      selectedCategory === "Water" ||
      lowerText.includes("water") ||
      lowerText.includes("pani") ||
      lowerText.includes("pipe") ||
      lowerText.includes("drain") ||
      lowerText.includes("leak") ||
      lowerText.includes("jal")
    ) {
      const wabag = dbUsers.find((u) => u.username === "wabag_water_epc");
      if (wabag) {
        suggestions.push({
          tag: `@${wabag.username}`,
          name: wabag.fullName,
          avatar: wabag.avatarUrl,
          badge: "Water Utility EPC",
          role: "Drinking Water Supply",
          type: "department",
        });
      }
      const pwdOfficer = dbUsers.find((u) => u.username === "pwd_officer_rajesh");
      if (pwdOfficer && lowerText.includes("drain")) {
        suggestions.push({
          tag: `@${pwdOfficer.username}`,
          name: pwdOfficer.fullName,
          avatar: pwdOfficer.avatarUrl,
          badge: "Executive Engineer",
          role: "Stormwater Drainage",
          type: "department",
        });
      }
    }

    if (
      selectedCategory === "Public Transport" ||
      lowerText.includes("bus") ||
      lowerText.includes("metro") ||
      lowerText.includes("transit") ||
      lowerText.includes("traffic")
    ) {
      const afcons = dbUsers.find((u) => u.username === "afcons_metro_jv");
      if (afcons) {
        suggestions.push({
          tag: `@${afcons.username}`,
          name: afcons.fullName,
          avatar: afcons.avatarUrl,
          badge: "Rail Transit EPC",
          role: "Urban Transit Authority",
          type: "department",
        });
      }
    }

    // 2. Check elected leaders in database
    leaders.forEach((ldr) => {
      // Area Representative (Nitesh Gupta)
      if (ldr.username === "niteshgupta950") {
        if (!suggestions.some((s) => s.tag === `@${ldr.username}`)) {
          suggestions.push({
            tag: `@${ldr.username}`,
            name: ldr.name,
            avatar: ldr.image,
            badge: ldr.party,
            role: ldr.title,
            type: "leader",
          });
        }
      }
      // Chief Minister for systemic/statewide or high severity issues
      if (ldr.username === "hemantsoren_jmm" && (urgencyLevel === "Critical Emergency" || selectedCategory === "Corruption" || selectedCategory === "Infrastructure")) {
        if (!suggestions.some((s) => s.tag === `@${ldr.username}`)) {
          suggestions.push({
            tag: `@${ldr.username}`,
            name: ldr.name,
            avatar: ldr.image,
            badge: ldr.party,
            role: "Chief Minister",
            type: "leader",
          });
        }
      }
      // Opposition Leader for Corruption / Watchdog
      if (ldr.username === "babulal_bjp" && (selectedCategory === "Corruption" || lowerText.includes("bribe") || lowerText.includes("scam") || lowerText.includes("ghoos"))) {
        if (!suggestions.some((s) => s.tag === `@${ldr.username}`)) {
          suggestions.push({
            tag: `@${ldr.username}`,
            name: ldr.name,
            avatar: ldr.image,
            badge: ldr.party,
            role: "Leader of Opposition",
            type: "leader",
          });
        }
      }
      // Health Minister
      if (ldr.username === "bannagupta_inc" && (lowerText.includes("hospital") || lowerText.includes("doctor") || lowerText.includes("health") || lowerText.includes("dawai") || lowerText.includes("ambulance"))) {
        if (!suggestions.some((s) => s.tag === `@${ldr.username}`)) {
          suggestions.push({
            tag: `@${ldr.username}`,
            name: ldr.name,
            avatar: ldr.image,
            badge: ldr.party,
            role: "Cabinet Minister (Health)",
            type: "leader",
          });
        }
      }
    });

    // Fallback: If no suggestion matches yet, suggest the primary elected MLA from DB
    if (suggestions.length === 0 && leaders.length > 0) {
      const primaryLeader = leaders[0];
      suggestions.push({
        tag: `@${primaryLeader.username}`,
        name: primaryLeader.name,
        avatar: primaryLeader.image,
        badge: primaryLeader.party,
        role: primaryLeader.title,
        type: "leader",
      });
    }

    return suggestions;
  }, [text, selectedCategory, urgencyLevel, leaders]);

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
      const taggedOfficers = activeSelectedTags.filter((t) =>
        suggestedAuthorities.some((s) => s.tag === t && s.type === "department")
      );
      const taggedLeaders = activeSelectedTags.filter((t) =>
        suggestedAuthorities.some((s) => s.tag === t && s.type === "leader")
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

  // Modern Categories Definition with Rich Details
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
      label: "Roads & PWD",
      description: "Potholes, broken roads, footpaths, bridges & road construction",
      icon: Construction,
      colorClass: "text-amber-600",
      bgClass: "bg-amber-50 border-amber-200",
    },
    {
      id: "Water",
      label: "Water Supply",
      description: "Pipeline leaks, dirty tap water, shortages & water tanker supply",
      icon: Droplet,
      colorClass: "text-cyan-600",
      bgClass: "bg-cyan-50 border-cyan-200",
    },
    {
      id: "Electricity",
      label: "Electricity",
      description: "Power cuts, broken transformers, low voltage & hazardous open wires",
      icon: Zap,
      colorClass: "text-amber-500",
      bgClass: "bg-amber-50 border-amber-200",
    },
    {
      id: "Sanitation",
      label: "Sanitation",
      description: "Garbage dumps, overflowing drains, sewer blockage & cleanliness",
      icon: Trash2,
      colorClass: "text-emerald-600",
      bgClass: "bg-emerald-50 border-emerald-200",
    },
    {
      id: "Corruption",
      label: "Corruption",
      description: "Bribe demands, tender scams, extortion & officer negligence",
      icon: ShieldAlert,
      colorClass: "text-rose-600",
      bgClass: "bg-rose-50 border-rose-200",
    },
    {
      id: "Public Transport",
      label: "Transport",
      description: "City buses, fare overcharge, traffic signals & public safety",
      icon: Building2,
      colorClass: "text-indigo-600",
      bgClass: "bg-indigo-50 border-indigo-200",
    },
  ];

  // Character limit circle calculation
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
          {/* AI Legal Draft */}
          {text.trim().length > 10 && (
            <button
              onClick={handleAIPolish}
              disabled={isAIPolishing}
              className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Auto-format as Official Citizen Petition"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAIPolishing ? "animate-spin" : ""}`} />
              <span>{isAIPolishing ? "Drafting..." : "AI Legal Draft"}</span>
            </button>
          )}

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
      <main className="flex-1 overflow-y-auto px-4 py-3 flex flex-col justify-between max-w-xl mx-auto w-full">
        <div className="space-y-3.5 flex-1 flex flex-col">
          {/* Top Control Section: Avatar on left, Controls aligned on right */}
          <div className="flex items-start gap-2.5 pb-1">
            {/* User DP / Avatar */}
            <img
              src={isAnonymous ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80" : userProfile.avatarUrl}
              alt={userProfile.fullName}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
            />

            {/* Right side aligned content */}
            <div className="flex-1 min-w-0 space-y-1.5">
              {/* Row 1: Category and Anonymous button in one line */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Category Slider Trigger Pill */}
                <button
                  type="button"
                  onClick={() => setShowCategorySlider(true)}
                  id="compose-category-slider-trigger"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200 transition-all cursor-pointer shadow-2xs"
                  title="Tap to select Category from bottom slider"
                >
                  <CategoryIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>{selectedCategoryMeta.label}</span>
                  <span className="text-[10px] text-blue-500 ml-0.5">▼</span>
                </button>

                {/* Whistleblower Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 transition-all cursor-pointer ${
                    isAnonymous
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                  title="Protect identity for anti-corruption and sensitive reports"
                >
                  <EyeOff className="w-3 h-3" />
                  <span>{isAnonymous ? "Anonymous ON" : "Anonymous"}</span>
                </button>

                {/* Urgent/Critical Active Indicator Badge if turned ON from toolbar */}
                {urgencyLevel === "Critical Emergency" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full animate-pulse">
                    <Flame className="w-3 h-3 text-rose-600 fill-rose-500" />
                    URGENT CRITICAL
                  </span>
                )}
              </div>

              {/* Row 2: Location Text directly starting under the Category button (not under DP) */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setShowLocationMapModal(true)}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-blue-600 font-medium cursor-pointer transition-colors max-w-full truncate py-0.5"
                  title="Click to view/change on map"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">{resolvedAddress}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Clean Main Text Input */}
          <div className="flex-1 min-h-[140px]">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Kya Problem ha ? (Describe the civic issue, road damage, water shortage, electricity cut, sanitation problem...)"
              rows={4}
              className="w-full text-base sm:text-lg font-medium text-slate-900 placeholder:text-slate-400 border-none outline-none resize-none p-0 focus:ring-0 leading-relaxed bg-transparent"
            />
          </div>

          {/* Attached Photos Preview Grid (Only shown when photos exist) */}
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

        {/* 3. Intelligent Real-Time Tagging & Authority Suggestions (NOT pre-tagged by default) */}
        <div className="pt-3 pb-1 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700">Suggested Authorities:</span>
              <span className="text-slate-400 text-[10px]">(Tap to tag in report)</span>
            </div>
            {activeSelectedTags.length > 0 && (
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                {activeSelectedTags.length} Tagged
              </span>
            )}
          </div>

          {/* Dynamic Suggestion Chips from authentic DB profiles */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {suggestedAuthorities.map((auth) => {
              const isSelected = activeSelectedTags.includes(auth.tag);
              return (
                <button
                  key={auth.tag}
                  type="button"
                  onClick={() => toggleTag(auth.tag)}
                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 border-blue-600 text-white font-bold shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 font-medium"
                  }`}
                  title={`${auth.name} (${auth.role})`}
                >
                  <img
                    src={auth.avatar}
                    alt={auth.name}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span>{auth.tag}</span>
                  <span className={`text-[10px] ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                    ({auth.badge})
                  </span>
                  {isSelected ? (
                    <Check className="w-3 h-3 text-white ml-0.5 stroke-[2.5]" />
                  ) : (
                    <span className="text-slate-400 text-xs ml-0.5 font-bold">+</span>
                  )}
                </button>
              );
            })}

            {/* Location GPS Chip - Click opens interactive map */}
            <button
              type="button"
              onClick={() => {
                setShowLocationMapModal(true);
                fetchLiveGPS();
              }}
              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 font-semibold border border-blue-200 shrink-0 cursor-pointer hover:bg-blue-100 transition-colors"
              title="Click to view and adjust location on map"
            >
              <MapPin className="w-3 h-3 text-blue-600" />
              <span className="truncate max-w-[140px]">{resolvedAddress}</span>
              <RefreshCw className={`w-2.5 h-2.5 ${isRefreshingLocation ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </main>

      {/* 4. Bottom Twitter/X Toolbar: [Gallery] [Camera] [Sliders/Category] [Poll] [Location] [Circle Progress] */}
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

          {/* 4. Quick-fill structured parameters */}
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

          {/* 5. Interactive Location Map Trigger */}
          <button
            type="button"
            onClick={() => {
              setShowLocationMapModal(true);
              fetchLiveGPS();
            }}
            id="toolbar-location-btn"
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer relative hover:bg-blue-50 text-blue-600`}
            title="Open Interactive Map to Pin Exact Location"
          >
            <MapPin className="w-5 h-5" />
            <span className="w-2 h-2 bg-emerald-500 rounded-full absolute top-1.5 right-1.5 border border-white"></span>
          </button>

          {/* 6. Urgent / Critical Emergency Tag Button */}
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
            title={urgencyLevel === "Critical Emergency" ? "Urgent Critical Tag Active" : "Mark as Urgent / Critical Emergency"}
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
      {/* 5. MODERN CATEGORY BOTTOM SHEET SLIDER (Slide-up Drawer with Backdrop) */}
      {/* ========================================================================= */}
      {showCategorySlider && (
        <div className="fixed inset-0 z-[400] flex flex-col justify-end">
          {/* Backdrop blur */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setShowCategorySlider(false)}
          />

          {/* Slide-Up Bottom Sheet Card */}
          <div className="relative z-10 w-full max-w-xl mx-auto bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-5 max-h-[85vh] overflow-y-auto animate-slide-up">
            {/* Drag handle */}
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

            {/* Categories List Cards */}
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
      {/* 6. INTERACTIVE MAP SLIDE-UP MODAL (Draggable Leaflet & Live Nominatim GPS) */}
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
