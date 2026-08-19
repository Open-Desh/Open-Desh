import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Image as ImageIcon,
  Camera,
  BarChart2,
  Smile,
  Sliders,
  MapPin,
  Plus,
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
  Layers,
  RefreshCw,
  AtSign,
} from "lucide-react";
import { IssueCategory, LocationGeo, UserProfile, Leader } from "../types.ts";

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
  
  // Multi-image state
  const [images, setImages] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isUploadingToR2, setIsUploadingToR2] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Bottom drawers / popovers
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

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
            // Free OpenStreetMap Nominatim API for reverse geocoding
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
          // Fallback location
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

  // Dynamic Department & Leader Routing Algorithm based on Category & Location
  const getSmartRoutingSuggestions = () => {
    let dept = {
      tag: "@JharkhandPWD",
      name: "Public Works & State Road Dept",
    };
    let leader = {
      tag: "@niteshgupta950",
      name: "Nitesh Gupta (MLA)",
      title: "MLA Ranchi East",
    };

    if (selectedCategory === "Water") {
      dept = {
        tag: "@RanchiJalBoard",
        name: "Drinking Water & Sanitation Division (DWSD)",
      };
    } else if (selectedCategory === "Electricity") {
      dept = {
        tag: "@JBVNL_Electricity",
        name: "Jharkhand Bijli Vitran Nigam Ltd",
      };
    } else if (selectedCategory === "Sanitation") {
      dept = {
        tag: "@RMC_Swachhata",
        name: "Ranchi Municipal Corporation (Sanitation)",
      };
    } else if (selectedCategory === "Corruption") {
      dept = {
        tag: "@ACB_Jharkhand",
        name: "Anti-Corruption Bureau & Vigilance",
      };
    } else if (selectedCategory === "Public Transport") {
      dept = {
        tag: "@RanchiCityBus",
        name: "Urban Mass Transit Authority",
      };
    }

    // Match leader from active database if matching location
    const matchedLeader = leaders.find((l) =>
      resolvedAddress.toLowerCase().includes("ranchi")
        ? l.category === "ruling" || l.constituency.toLowerCase().includes("ranchi")
        : true
    ) || leaders[0];

    if (matchedLeader) {
      leader = {
        tag: `@${matchedLeader.username}`,
        name: matchedLeader.name,
        title: matchedLeader.title,
      };
    }

    return { dept, leader };
  };

  const smartRouting = getSmartRoutingSuggestions();

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

      // Add auto-tags if enabled and not already written
      const taggedOfficers: string[] = [];
      const taggedLeaders: string[] = [];

      if (includeDeptTag && !fullReportText.includes(smartRouting.dept.tag)) {
        taggedOfficers.push(smartRouting.dept.tag);
      }
      if (includeLeaderTag && !fullReportText.includes(smartRouting.leader.tag)) {
        taggedLeaders.push(smartRouting.leader.tag);
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
    <div className="fixed inset-0 z-[300] bg-white flex flex-col h-screen overflow-hidden animate-fadeIn">
      {/* 1. Top Twitter/X Bar: (✕ Close on left, Sky-Blue Post button on right) */}
      <header className="h-14 px-4 flex items-center justify-between bg-white shrink-0 border-b border-slate-100">
        <button
          onClick={onCancel}
          id="compose-close-btn"
          className="p-2 -ml-2 text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5 text-slate-900 stroke-[2.2]" />
        </button>

        <div className="flex items-center gap-2">
          {/* Urgency tag indicator */}
          {urgencyLevel === "Critical Emergency" && (
            <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Flame className="w-3 h-3" /> Urgent
            </span>
          )}

          {/* Sky-Blue X Style Post Button */}
          <button
            onClick={handleFormSubmit}
            disabled={isSubmitting || (!text.trim() && images.length === 0)}
            id="compose-post-btn"
            className={`px-5 py-1.5 rounded-full text-sm font-bold text-white transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
              !text.trim() && images.length === 0
                ? "bg-sky-300 cursor-not-allowed"
                : "bg-sky-500 hover:bg-sky-600 active:scale-95"
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
          {/* Top User Identity & Category Badge */}
          <div className="flex items-center gap-2.5">
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.fullName}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
            />
            <button
              onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100/80 px-2.5 py-1 rounded-full border border-sky-200/70 transition-colors cursor-pointer"
            >
              <span>{selectedCategory}</span>
              <span className="text-[10px] text-sky-400">▼</span>
            </button>

            <button
              onClick={() =>
                setUrgencyLevel(urgencyLevel === "Normal" ? "Critical Emergency" : "Normal")
              }
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                urgencyLevel === "Critical Emergency"
                  ? "bg-rose-600 text-white font-extrabold"
                  : "text-slate-400 hover:text-slate-700 bg-slate-100"
              }`}
            >
              {urgencyLevel === "Critical Emergency" ? "🔥 Urgent" : "Normal"}
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
                        ? "bg-sky-50 text-sky-700 font-bold border border-sky-200"
                        : "hover:bg-slate-50 text-slate-700 font-medium"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-sky-600 shrink-0" />
                    <span className="text-xs truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Primary Textarea ("Kya Problem ha ?") */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Kya Problem ha ?"
              rows={4}
              className="w-full text-lg sm:text-xl font-medium text-slate-900 placeholder:text-slate-400 border-none outline-none resize-none p-0 focus:ring-0 leading-relaxed bg-transparent"
            />
          </div>

          {/* 3. Image Area ("is area me image aa jayegi") */}
          {images.length > 0 ? (
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center group shadow-sm border border-slate-200">
              <img
                src={images[activeImageIndex]}
                alt={`Evidence ${activeImageIndex + 1}`}
                className="w-full h-full object-contain"
              />

              {/* Photo Indicator */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                {activeImageIndex + 1} / {images.length}
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
            /* Clean visual preview zone matching user drawing */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-44 rounded-2xl bg-sky-100/50 hover:bg-sky-100/80 border-2 border-dashed border-sky-300 flex flex-col items-center justify-center text-sky-800 cursor-pointer transition-colors p-4"
            >
              <ImageIcon className="w-8 h-8 text-sky-500 mb-1" />
              <span className="text-sm font-bold text-sky-900">
                is area me image aa jayegi
              </span>
              <span className="text-[11px] text-sky-600 mt-0.5">
                Click here or tap gallery icon below to add photos
              </span>
            </div>
          )}

          {/* Quick-Fill Structured Fields Drawer (If opened) */}
          {showQuickForm && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-sky-600" />
                  {selectedCategory} Quick Parameters
                </span>
                <button
                  onClick={() => setShowQuickForm(false)}
                  className="text-[11px] text-slate-400 hover:text-slate-600"
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
                      className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 text-slate-900"
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 4. Tagging / People / Department Routing Row above bottom bar */}
        <div className="pt-3 pb-1 border-t border-slate-100 space-y-1.5">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>Tag & Authority Routing:</span>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" /> Auto-synced with {selectedCategory}
            </span>
          </div>

          {/* Scrollable Dynamic Tags Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {/* Dept Tag Chip */}
            <button
              onClick={() => setIncludeDeptTag(!includeDeptTag)}
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border shrink-0 transition-all cursor-pointer ${
                includeDeptTag
                  ? "bg-sky-50 border-sky-300 text-sky-800 font-bold"
                  : "bg-slate-50 border-slate-200 text-slate-400 line-through"
              }`}
            >
              <Building2 className="w-3 h-3 text-sky-600" />
              <span>{smartRouting.dept.tag}</span>
            </button>

            {/* Leader Tag Chip */}
            <button
              onClick={() => setIncludeLeaderTag(!includeLeaderTag)}
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border shrink-0 transition-all cursor-pointer ${
                includeLeaderTag
                  ? "bg-indigo-50 border-indigo-300 text-indigo-800 font-bold"
                  : "bg-slate-50 border-slate-200 text-slate-400 line-through"
              }`}
            >
              <UserCheck className="w-3 h-3 text-indigo-600" />
              <span>{smartRouting.leader.tag}</span>
            </button>

            {/* Location GPS Chip */}
            <div
              onClick={fetchLiveGPS}
              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200 shrink-0 cursor-pointer hover:bg-slate-200"
              title="Click to refresh GPS location"
            >
              <MapPin className="w-3 h-3 text-emerald-600" />
              <span className="truncate max-w-[150px]">{resolvedAddress}</span>
              <RefreshCw className={`w-2.5 h-2.5 ${isRefreshingLocation ? "animate-spin" : ""}`} />
            </div>
          </div>
        </div>
      </main>

      {/* 5. Bottom Twitter/X Toolbar: [Gallery] [Camera] [Poll] [GIF] [Fields] [Location] [Circle] [+] */}
      <footer className="h-13 border-t border-slate-200 px-4 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-4 text-sky-500">
          {/* 1. Gallery Image Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            id="toolbar-gallery-btn"
            className="p-1.5 hover:bg-sky-50 rounded-full transition-colors cursor-pointer"
            title="Add Images"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* 2. Camera Snapshot */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            id="toolbar-camera-btn"
            className="p-1.5 hover:bg-sky-50 rounded-full transition-colors cursor-pointer"
            title="Take Photo"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* 3. Quick-fill structured parameters */}
          <button
            onClick={() => setShowQuickForm(!showQuickForm)}
            id="toolbar-poll-btn"
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              showQuickForm ? "bg-sky-100 text-sky-700" : "hover:bg-sky-50"
            }`}
            title="Quick-Fill Parameters"
          >
            <BarChart2 className="w-5 h-5" />
          </button>

          {/* 4. GIF */}
          <button
            onClick={() => setText((prev) => prev + " #CivicAlert")}
            id="toolbar-gif-btn"
            className="p-1 text-xs font-black border border-sky-500 rounded px-1.5 hover:bg-sky-50 transition-colors cursor-pointer"
            title="Civic Tag"
          >
            GIF
          </button>

          {/* 5. Category Selector */}
          <button
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            id="toolbar-sliders-btn"
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              showCategoryMenu ? "bg-sky-100 text-sky-700" : "hover:bg-sky-50"
            }`}
            title="Category Switcher"
          >
            <Sliders className="w-5 h-5" />
          </button>

          {/* 6. GPS Location */}
          <button
            onClick={fetchLiveGPS}
            id="toolbar-location-btn"
            className="p-1.5 hover:bg-sky-50 rounded-full transition-colors cursor-pointer relative"
            title="Live GPS Location"
          >
            <MapPin className="w-5 h-5" />
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full absolute top-1 right-1"></span>
          </button>
        </div>

        {/* Right side: Character limit circle + Add (+) */}
        <div className="flex items-center gap-3">
          {/* Circular Progress Ring */}
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
                className={charLength > 240 ? "text-rose-500" : "text-sky-500"}
              />
            </svg>
          </div>

          <div className="w-[1px] h-4 bg-slate-200"></div>

          {/* Plus button */}
          <button
            onClick={() => setShowQuickForm(!showQuickForm)}
            className="p-1 text-sky-500 hover:bg-sky-50 rounded-full transition-colors cursor-pointer"
            title="Add Details"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
};
