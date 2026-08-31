import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Camera,
  Building2,
  User,
  Shield,
  Loader2,
  Briefcase,
  ChevronDown,
  Sparkles,
  Plus,
  Trash2,
  Network,
  HelpCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AtSign,
} from "lucide-react";
import { UserProfile, UserCategory, CivicService } from "../types.ts";
import { getSmartDefaultServices } from "../utils/serviceTemplates.ts";
import { checkUsernameAvailability } from "../lib/firestoreSync.ts";
import { compressAvatarImage, uploadAvatarToR2 } from "../utils/imageCompressor.ts";

interface EditProfileViewProps {
  userProfile: UserProfile;
  onSave: (updated: Partial<UserProfile>) => Promise<void>;
  onCancel: () => void;
}

// 1. Representative Constants
const REPRESENTATIVE_LEVELS = [
  "National Level",
  "State Level",
  "Local/Municipal Level",
  "Party Official/Worker",
] as const;

type RepresentativeLevel = (typeof REPRESENTATIVE_LEVELS)[number];

const DESIGNATIONS_BY_LEVEL: Record<RepresentativeLevel, string[]> = {
  "National Level": ["PM", "Cabinet Minister", "MP"],
  "State Level": ["CM", "State Minister", "MLA", "MLC"],
  "Local/Municipal Level": [
    "Mayor",
    "MCD Councillor",
    "Zila Panchayat Adhyaksh",
    "Sarpanch (Gram Pradhan)",
  ],
  "Party Official/Worker": [
    "Party Adhyaksh",
    "National Spokesperson",
    "State Adhyaksh",
    "District Adhyaksh",
    "General Worker",
  ],
};

const STANDARD_PARTIES = ["BJP", "INC", "AAP", "SP", "BSP", "TMC", "Others"];

// 2. Department Constants
const GOVERNMENT_LEVELS = [
  "Central Government",
  "State Government",
  "Local Body / Municipal",
  "Police & Law Enforcement",
  "Autonomous Body / Public Sector",
] as const;

type GovernmentLevel = (typeof GOVERNMENT_LEVELS)[number];

const INDIAN_STATES_AND_UTS = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const SERVICE_CATEGORY_OPTIONS: CivicService["category"][] = [
  "Civic Infrastructure",
  "Sanitation & Waste",
  "Water & Utilities",
  "Public Redressal",
  "Legislative Help",
  "Welfare & Funds",
];

export const EditProfileView: React.FC<EditProfileViewProps> = ({
  userProfile,
  onSave,
  onCancel,
}) => {
  // Basic Profile Info
  const [fullName, setFullName] = useState(userProfile.fullName || "");
  const [username, setUsername] = useState(userProfile.username || "");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameSuccess, setUsernameSuccess] = useState<boolean>(false);
  const checkTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [location, setLocation] = useState(userProfile.location || "");
  const [age, setAge] = useState<string>(
    userProfile.age ? String(userProfile.age) : ""
  );
  const [bio, setBio] = useState(userProfile.bio || "");
  const [websiteUrl, setWebsiteUrl] = useState(userProfile.websiteUrl || "");
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl || "");
  const [category, setCategory] = useState<UserCategory>(
    userProfile.category || "citizen"
  );

  // Debounced live username availability check (Max 15 characters)
  const handleUsernameChange = (val: string) => {
    const rawVal = val.replace(/^@/, "").toLowerCase().trim();
    // Allow typing only lowercase alphanumeric and underscore, capped at 15 characters
    const sanitizedVal = rawVal.replace(/[^a-z0-9_]/g, "").slice(0, 15);
    setUsername(sanitizedVal);
    setUsernameSuccess(false);

    if (checkTimerRef.current) {
      clearTimeout(checkTimerRef.current);
    }

    if (!sanitizedVal) {
      setUsernameError("Username cannot be empty.");
      return;
    }

    if (sanitizedVal.length < 3) {
      setUsernameError("Username must be at least 3 characters.");
      return;
    }

    if (sanitizedVal.length > 15) {
      setUsernameError("Username cannot exceed 15 characters.");
      return;
    }

    // If matches user's existing username
    if (sanitizedVal === userProfile.username?.toLowerCase()) {
      setUsernameError(null);
      setUsernameSuccess(false);
      return;
    }

    setUsernameError(null);
    setIsCheckingUsername(true);

    checkTimerRef.current = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability(
          sanitizedVal,
          userProfile.id,
          userProfile.username
        );
        if (!result.available) {
          setUsernameError(result.reason || `@${sanitizedVal} is already taken.`);
          setUsernameSuccess(false);
        } else {
          setUsernameError(null);
          setUsernameSuccess(true);
        }
      } catch {
        setUsernameError(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 400);
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (checkTimerRef.current) {
        clearTimeout(checkTimerRef.current);
      }
    };
  }, []);

  // Citizen Specific Field
  const [occupation, setOccupation] = useState(
    userProfile.citizenDetails?.occupation || ""
  );

  // Business Specific Fields
  const [companyName, setCompanyName] = useState(
    userProfile.businessDetails?.companyName || ""
  );
  const [industry, setIndustry] = useState(
    userProfile.businessDetails?.industry || ""
  );

  // Representative Specific Fields
  const initialRepLevel: RepresentativeLevel =
    (userProfile.representativeDetails?.level as RepresentativeLevel) ||
    "State Level";
  const [repLevel, setRepLevel] = useState<RepresentativeLevel>(initialRepLevel);

  const initialRepDesignation =
    userProfile.representativeDetails?.position ||
    DESIGNATIONS_BY_LEVEL[initialRepLevel][0] ||
    "MLA";
  const [repDesignation, setRepDesignation] =
    useState<string>(initialRepDesignation);

  const rawParty = userProfile.representativeDetails?.party || "BJP";
  const isPartyInList = STANDARD_PARTIES.slice(0, 6).includes(rawParty);
  const [selectedParty, setSelectedParty] = useState<string>(
    isPartyInList ? rawParty : rawParty ? "Others" : "BJP"
  );
  const [customParty, setCustomParty] = useState<string>(
    !isPartyInList && rawParty ? rawParty : ""
  );

  const [constituency, setConstituency] = useState(
    userProfile.representativeDetails?.constituency || ""
  );

  // Department Specific Fields
  const initialGovLevel: GovernmentLevel =
    (userProfile.departmentDetails?.governmentLevel as GovernmentLevel) ||
    "State Government";
  const [govLevel, setGovLevel] = useState<GovernmentLevel>(initialGovLevel);

  const [selectedState, setSelectedState] = useState<string>(
    userProfile.departmentDetails?.state || "Delhi"
  );
  const [deptName, setDeptName] = useState(
    userProfile.departmentDetails?.name || ""
  );

  // =========================================================================
  // SERVICES (MIND MAP & DIRECTORY) STATE FOR BUSINESS, REPRESENTATIVE & DEPT
  // =========================================================================
  const [servicesList, setServicesList] = useState<CivicService[]>(() => {
    if (userProfile.services && userProfile.services.length > 0) {
      return userProfile.services;
    }
    const initialRole =
      userProfile.category === "representative"
        ? userProfile.representativeDetails?.position || "MLA"
        : userProfile.category === "department"
        ? userProfile.departmentDetails?.name || "Municipal Office"
        : userProfile.businessDetails?.companyName || "Enterprise";
    const initialSub =
      userProfile.category === "representative"
        ? userProfile.representativeDetails?.level || ""
        : userProfile.category === "department"
        ? userProfile.departmentDetails?.governmentLevel || ""
        : userProfile.businessDetails?.industry || "";
    return getSmartDefaultServices(userProfile.category, initialRole, initialSub);
  });

  const [saving, setSaving] = useState(false);
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUploadStatus, setAvatarUploadStatus] = useState<{
    originalSizeKb?: number;
    compressedSizeKb?: number;
    compressionRatio?: string;
    isR2?: boolean;
    error?: string;
  } | null>(null);

  // Level change handler for representative to auto sync designation
  const handleRepLevelChange = (newLevel: RepresentativeLevel) => {
    setRepLevel(newLevel);
    const availableDesignations = DESIGNATIONS_BY_LEVEL[newLevel];
    if (
      availableDesignations &&
      !availableDesignations.includes(repDesignation)
    ) {
      const nextDesig = availableDesignations[0] || "";
      setRepDesignation(nextDesig);
      // Auto-refresh smart services if list is default
      refreshSmartServices(category, nextDesig, newLevel);
    }
  };

  // Helper to refresh services based on role/industry
  const refreshSmartServices = (
    cat: UserCategory,
    roleStr: string,
    subStr: string
  ) => {
    const templates = getSmartDefaultServices(cat, roleStr, subStr);
    if (templates.length > 0) {
      setServicesList(templates);
    }
  };

  // Category switch handler
  const handleCategorySwitch = (newCat: UserCategory) => {
    setCategory(newCat);
    if (newCat !== "citizen") {
      const targetRole =
        newCat === "representative"
          ? repDesignation
          : newCat === "department"
          ? deptName || govLevel
          : companyName || industry || "Enterprise";
      const targetSub =
        newCat === "representative"
          ? repLevel
          : newCat === "department"
          ? govLevel
          : industry;
      refreshSmartServices(newCat, targetRole, targetSub);
    }
  };

  // Service management handlers
  const handleAddService = () => {
    const newService: CivicService = {
      id: `srv_${Date.now()}`,
      title: "",
      category:
        category === "business"
          ? "Civic Infrastructure"
          : category === "representative"
          ? "Legislative Help"
          : "Public Redressal",
      description: "",
      sla: "24-48 Hours",
      citizenEntitlement: "Guaranteed citizen redressal under public charter.",
      nodalContact: fullName || "Service Desk",
      status: "Active",
    };
    setServicesList((prev) => [newService, ...prev]);
  };

  const handleUpdateService = (
    index: number,
    field: keyof CivicService,
    val: string
  ) => {
    setServicesList((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], [field]: val };
      }
      return copy;
    });
  };

  const handleRemoveService = (index: number) => {
    setServicesList((prev) => prev.filter((_, i) => i !== index));
  };

  // Keep form fields synchronized when userProfile is loaded or updated
  useEffect(() => {
    if (userProfile.fullName) setFullName(userProfile.fullName);
    if (userProfile.username) setUsername(userProfile.username);
    if (userProfile.location !== undefined) setLocation(userProfile.location);
    if (userProfile.age !== undefined) setAge(userProfile.age ? String(userProfile.age) : "");
    if (userProfile.bio !== undefined) setBio(userProfile.bio);
    if (userProfile.websiteUrl !== undefined) setWebsiteUrl(userProfile.websiteUrl);
    if (userProfile.avatarUrl) setAvatarUrl(userProfile.avatarUrl);
    if (userProfile.category) setCategory(userProfile.category);
    if (userProfile.citizenDetails?.occupation) setOccupation(userProfile.citizenDetails.occupation);
    if (userProfile.businessDetails?.companyName) setCompanyName(userProfile.businessDetails.companyName);
    if (userProfile.businessDetails?.industry) setIndustry(userProfile.businessDetails.industry);
    if (userProfile.representativeDetails?.position) setRepDesignation(userProfile.representativeDetails.position);
    if (userProfile.representativeDetails?.constituency) setConstituency(userProfile.representativeDetails.constituency);
    if (userProfile.departmentDetails?.name) setDeptName(userProfile.departmentDetails.name);
    if (userProfile.departmentDetails?.state) setSelectedState(userProfile.departmentDetails.state);
    if (userProfile.services && userProfile.services.length > 0) setServicesList(userProfile.services);
  }, [userProfile.id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      setAvatarUploadStatus(null);

      // Step 1: Compress image on client-side (Square 1:1, max 512x512, adaptive WebP/JPEG)
      const compressed = await compressAvatarImage(file, 512, 0.85);

      // Step 2: Upload to Cloudflare R2 bucket `profile-dp`
      const uploadResult = await uploadAvatarToR2(
        compressed.dataUrl,
        file.name || "avatar.webp",
        userProfile.id || "user"
      );

      setAvatarUrl(uploadResult.url);
      setAvatarUploadStatus({
        originalSizeKb: compressed.originalSizeKb,
        compressedSizeKb: compressed.compressedSizeKb,
        compressionRatio: compressed.compressionRatio,
        isR2: uploadResult.success && !uploadResult.error,
        error: uploadResult.error,
      });
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      setAvatarUploadStatus({
        error: err.message || "Upload failed. Please try again.",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameError || isCheckingUsername) return;

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, "").replace(/[^a-z0-9_]/g, "").slice(0, 15);
    if (!cleanUsername || cleanUsername.length < 3) {
      setUsernameError("Username must be between 3 and 15 characters.");
      return;
    }

    setSaving(true);
    try {
      const originalVerifiedCategory =
        userProfile.verifiedCategory ||
        (userProfile.verified ? userProfile.category : undefined);

      const updatedData: Partial<UserProfile> = {
        fullName: fullName.trim() || userProfile.fullName || "Citizen Resident",
        username: cleanUsername,
        location: location.trim(),
        age: age.trim() ? parseInt(age, 10) : undefined,
        bio: bio.trim(),
        websiteUrl: websiteUrl.trim(),
        avatarUrl: avatarUrl.trim() || userProfile.avatarUrl,
        category: category,
        verified: Boolean(userProfile.verified),
        // Crucial: Keep the original verified category approved by document verification
        verifiedCategory: originalVerifiedCategory,
      };

      if (category === "citizen") {
        updatedData.citizenDetails = {
          occupation: occupation.trim() || "Citizen Resident",
          voterConstituency: location.trim() || undefined,
        };
        updatedData.services = undefined;
      } else if (category === "business") {
        updatedData.businessDetails = {
          companyName:
            companyName.trim() || fullName.trim() || "Corporate Enterprise",
          industry: industry.trim() || "Civic & Infrastructure Services",
          officialWebsite: websiteUrl.trim() || undefined,
          verifiedCompany: originalVerifiedCategory === "business",
        };
        // Clean and filter valid services
        updatedData.services = servicesList.filter((s) => s.title.trim() !== "");
      } else if (category === "representative") {
        const finalParty =
          selectedParty === "Others"
            ? customParty.trim() || "Independent / Other"
            : selectedParty;

        updatedData.representativeDetails = {
          level: repLevel,
          position: repDesignation.trim() || "Elected Representative",
          party: finalParty,
          constituency:
            constituency.trim() || location.trim() || "Constituency Area",
          termYears: "2024-2029",
          legislativeBody:
            repLevel === "National Level"
              ? "Parliament of India"
              : repLevel === "State Level"
              ? "State Legislative Assembly"
              : "Local Municipal Governance",
        };
        updatedData.services = servicesList.filter((s) => s.title.trim() !== "");
      } else if (category === "department") {
        const isStateOrPolice =
          govLevel === "State Government" ||
          govLevel === "Police & Law Enforcement";

        updatedData.departmentDetails = {
          governmentLevel: govLevel,
          state: isStateOrPolice ? selectedState : undefined,
          name: deptName.trim() || "Government Department Office",
          designation: `${govLevel} Office`,
          departmentCode: "GOV-DEPT",
          jurisdictionRegion: isStateOrPolice
            ? selectedState
            : location || "All India",
          officialBadge:
            originalVerifiedCategory === "department"
              ? "Verified Govt Department"
              : "Govt Department",
        };
        updatedData.services = servicesList.filter((s) => s.title.trim() !== "");
      }

      await onSave(updatedData);
      onCancel();
    } catch (err) {
      console.error("Save profile error:", err);
    } finally {
      setSaving(false);
    }
  };

  const isStateDropdownActive =
    govLevel === "State Government" || govLevel === "Police & Law Enforcement";

  return (
    <div
      id="edit-profile-page"
      className="min-h-screen bg-white flex flex-col max-w-xl mx-auto border-x border-slate-200"
    >
      {/* 1. X/Twitter-Style Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <button
            id="edit-profile-back-btn"
            onClick={onCancel}
            className="p-2 -ml-1.5 text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer shrink-0"
            title="Cancel"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate">
              Edit profile
            </h1>
            <span className="text-xs text-slate-500 font-medium truncate block">
              @{userProfile.username}
            </span>
          </div>
        </div>

        <button
          id="edit-profile-save-header-btn"
          onClick={handleSave}
          disabled={saving || Boolean(usernameError) || isCheckingUsername}
          className="px-5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <span>Save</span>
          )}
        </button>
      </header>

      {/* 2. Avatar / Profile Picture */}
      <div className="px-4 sm:px-6 pt-5 pb-3 flex flex-col items-center">
        <div className="relative group">
          <img
            src={
              avatarUrl ||
              userProfile.avatarUrl ||
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80"
            }
            alt="Avatar Preview"
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 shadow-sm bg-white transition-all ${
              isUploadingAvatar ? "opacity-50 blur-[1px] border-blue-400" : "border-slate-200"
            }`}
            referrerPolicy="no-referrer"
          />

          {isUploadingAvatar ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-full text-white p-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              <span className="text-[9px] font-bold text-center mt-1 leading-tight">Optimizing & Uploading...</span>
            </div>
          ) : (
            <label
              htmlFor="avatar-file-input"
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer text-white opacity-0 group-hover:opacity-100 transition-opacity"
              title="Upload photo to Cloudflare R2"
            >
              <Camera className="w-6 h-6" />
            </label>
          )}

          <input
            id="avatar-file-input"
            type="file"
            accept="image/*"
            disabled={isUploadingAvatar}
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        <div className="flex items-center gap-2 mt-3">
          <label
            htmlFor="avatar-file-input"
            className={`text-xs font-bold text-blue-600 bg-blue-50 px-3.5 py-1.5 rounded-full cursor-pointer transition-colors flex items-center gap-1.5 ${
              isUploadingAvatar ? "opacity-60 pointer-events-none" : "hover:bg-blue-100 hover:text-blue-700"
            }`}
          >
            {isUploadingAvatar ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Compressing...</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
              </>
            )}
          </label>
          <button
            type="button"
            onClick={() => setShowImageUrlInput(!showImageUrlInput)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 px-3.5 py-1.5 rounded-full cursor-pointer transition-colors"
          >
            Image URL
          </button>
        </div>

        {/* Compression & Cloudflare R2 Status Badge */}
        {avatarUploadStatus && (
          <div
            className={`mt-2.5 px-3 py-1.5 rounded-xl text-[11px] font-medium max-w-sm text-center transition-all ${
              avatarUploadStatus.error
                ? "bg-amber-50 text-amber-800 border border-amber-200"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            }`}
          >
            {avatarUploadStatus.error ? (
              <span>⚠️ {avatarUploadStatus.error}</span>
            ) : (
              <div className="space-y-0.5">
                <p className="font-bold flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Cloudflare R2 Optimized</span>
                </p>
                <p className="text-[10px] text-emerald-700">
                  {avatarUploadStatus.originalSizeKb}KB ➔ {avatarUploadStatus.compressedSizeKb}KB ({avatarUploadStatus.compressionRatio} saved) • Fast multi-device WebP
                </p>
              </div>
            )}
          </div>
        )}

        {showImageUrlInput && (
          <div className="w-full max-w-sm mt-3">
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="Paste direct image link (https://...)"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
            />
          </div>
        )}
      </div>

      {/* 3. Form Body */}
      <form
        onSubmit={handleSave}
        className="flex-1 px-4 sm:px-6 py-2 space-y-4 pb-24"
      >
        {/* Full Name (Max 15 Characters) */}
        <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all bg-white">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-500 block">
              {category === "department"
                ? "Official Name / Department Head"
                : category === "business"
                ? "Full Name / Executive Name"
                : "Name"}
            </label>
            <span className="text-[10px] font-semibold text-slate-400">
              {fullName.length}/15
            </span>
          </div>
          <input
            id="edit-fullname-input"
            type="text"
            required
            maxLength={15}
            value={fullName}
            onChange={(e) => setFullName(e.target.value.slice(0, 15))}
            placeholder={
              category === "department"
                ? "e.g. Officer in Charge"
                : category === "business"
                ? "Your Name / Executive Name"
                : "Your name"
            }
            className="w-full text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none bg-transparent pt-0.5"
          />
        </div>

        {/* Username / Handle (Max 15 Characters & Live Uniqueness Check) */}
        <div
          className={`border rounded-xl px-3.5 py-2 transition-all bg-white ${
            usernameError
              ? "border-rose-300 focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500 bg-rose-50/20"
              : usernameSuccess
              ? "border-emerald-300 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 bg-emerald-50/20"
              : "border-slate-200 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          }`}
        >
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <span>User name</span>
            </label>
            <span
              className={`text-[10px] font-semibold ${
                username.length >= 15 ? "text-amber-600 font-bold" : "text-slate-400"
              }`}
            >
              {username.length}/15
            </span>
          </div>

          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-sm font-bold text-slate-400 select-none">@</span>
            <input
              id="edit-username-input"
              type="text"
              required
              maxLength={15}
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="username"
              className="w-full text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none bg-transparent lowercase"
            />
            {isCheckingUsername && (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
            )}
            {usernameSuccess && !isCheckingUsername && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            {usernameError && !isCheckingUsername && (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
          </div>

          {/* Helper / Error Feedback Text */}
          {usernameError ? (
            <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1 leading-tight">
              <span>{usernameError}</span>
            </p>
          ) : usernameSuccess ? (
            <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1 leading-tight">
              <span>@{username} is available!</span>
            </p>
          ) : null}
        </div>

        {/* Bio */}
        <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all bg-white">
          <label className="text-[11px] font-bold text-slate-500 block">
            Bio
          </label>
          <textarea
            id="edit-bio-input"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Write a brief intro about your civic mission or organization..."
            className="w-full text-sm font-medium text-slate-900 placeholder-slate-400 outline-none bg-transparent pt-0.5 resize-none leading-relaxed"
          />
        </div>

        {/* Location */}
        <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all bg-white">
          <label className="text-[11px] font-bold text-slate-500 block">
            Location
          </label>
          <input
            id="edit-location-input"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, State, Country"
            className="w-full text-sm font-medium text-slate-900 placeholder-slate-400 outline-none bg-transparent pt-0.5"
          />
        </div>

        {/* Website / Social Link */}
        <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all bg-white">
          <label className="text-[11px] font-bold text-slate-500 block">
            Website / Link
          </label>
          <input
            id="edit-website-input"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://yourwebsite.com"
            className="w-full text-sm font-medium text-slate-900 placeholder-slate-400 outline-none bg-transparent pt-0.5"
          />
        </div>

        {/* Citizen Age */}
        {category === "citizen" && (
          <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all bg-white">
            <label className="text-[11px] font-bold text-slate-500 block">
              Age
            </label>
            <input
              id="edit-age-input"
              type="number"
              min={10}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 28"
              className="w-full text-sm font-medium text-slate-900 placeholder-slate-400 outline-none bg-transparent pt-0.5"
            />
          </div>
        )}

        {/* Section Divider: Account Type */}
        <div className="pt-2 pb-1 border-t border-slate-100">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
            Account Type
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            Choose your account role to configure your public badge, category details, and services mind map.
          </p>

          {/* 4-Option Grid Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1. Citizen */}
            <button
              type="button"
              onClick={() => handleCategorySwitch("citizen")}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                category === "citizen"
                  ? "border-blue-600 bg-blue-50/80 text-blue-900 font-black shadow-xs ring-1 ring-blue-600"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
              }`}
            >
              <User className="w-5 h-5 mb-1 text-blue-600" />
              <span className="text-xs block">Citizen</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Resident
              </span>
            </button>

            {/* 2. Business / Company */}
            <button
              type="button"
              onClick={() => handleCategorySwitch("business")}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                category === "business"
                  ? "border-amber-500 bg-amber-50/80 text-amber-950 font-black shadow-xs ring-1 ring-amber-500"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
              }`}
            >
              <Briefcase className="w-5 h-5 mb-1 text-amber-600" />
              <span className="text-xs block leading-tight">Business / Co.</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Enterprise
              </span>
            </button>

            {/* 3. Representative */}
            <button
              type="button"
              onClick={() => handleCategorySwitch("representative")}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                category === "representative"
                  ? "border-emerald-600 bg-emerald-50/80 text-emerald-950 font-black shadow-xs ring-1 ring-emerald-600"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
              }`}
            >
              <Shield className="w-5 h-5 mb-1 text-emerald-600" />
              <span className="text-xs block">Representative</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Politics & Leader
              </span>
            </button>

            {/* 4. Department */}
            <button
              type="button"
              onClick={() => handleCategorySwitch("department")}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                category === "department"
                  ? "border-[#78350f] bg-[#fcf6f0] text-[#78350f] font-black shadow-xs ring-1 ring-[#78350f]"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
              }`}
            >
              <Building2 className="w-5 h-5 mb-1 text-[#78350f]" />
              <span className="text-xs block">Govt Dept</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Public Agency
              </span>
            </button>
          </div>

          {/* Verification Badge Category Notice */}
          {(() => {
            const originalVerifiedCategory =
              userProfile.verifiedCategory ||
              (userProfile.verified ? userProfile.category : undefined);
            if (
              userProfile.verified &&
              originalVerifiedCategory &&
              category !== originalVerifiedCategory
            ) {
              return (
                <div className="mt-3 p-3.5 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-start gap-2.5 text-xs text-amber-950 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-extrabold text-amber-900 flex items-center gap-1.5">
                      <span>Document Verification Protection</span>
                      <span className="text-[10px] bg-amber-200/70 text-amber-900 px-1.5 py-0.2 rounded font-black uppercase">
                        {originalVerifiedCategory}
                      </span>
                    </p>
                    <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                      Aapka verified badge statutory document verification ke anusaar <strong>{originalVerifiedCategory.toUpperCase()}</strong> par approved hai. Category badalne par aapka verified badge <strong>{originalVerifiedCategory.toUpperCase()}</strong> hi rahega, aur new <strong>{category.toUpperCase()}</strong> badge ke liye administrative document verification ki aavashyakta hogi.
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>

        {/* Dynamic Category Specific Inputs */}

        {/* ========================================================= */}
        {/* A. Citizen Category */}
        {/* ========================================================= */}
        {category === "citizen" && (
          <div className="space-y-3 pt-2 animate-fadeIn">
            <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all bg-white">
              <label className="text-[11px] font-bold text-slate-500 block">
                Occupation / Profession
              </label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Software Engineer, Student, Teacher, Advocate, Business Person"
                className="w-full text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none bg-transparent pt-0.5"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* B. Business / Company Category */}
        {/* ========================================================= */}
        {category === "business" && (
          <div className="space-y-3 pt-2 animate-fadeIn">
            <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all bg-white">
              <label className="text-[11px] font-bold text-slate-500 block">
                Company / Organization Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                }}
                placeholder="e.g. Tata Infra Ltd / GreenWave Waste Solutions"
                className="w-full text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none bg-transparent pt-0.5"
              />
            </div>

            <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all bg-white">
              <label className="text-[11px] font-bold text-slate-500 block">
                Industry / Sector
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => {
                  setIndustry(e.target.value);
                }}
                placeholder="e.g. Civic Infrastructure, Real Estate, Waste Management, Solar Energy"
                className="w-full text-sm font-medium text-slate-900 placeholder-slate-400 outline-none bg-transparent pt-0.5"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* C. Representative Category */}
        {/* ========================================================= */}
        {category === "representative" && (
          <div className="space-y-3 pt-2 animate-fadeIn">
            {/* Dropdown 1: Pad ka Level */}
            <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 transition-all bg-white relative">
              <label className="text-[11px] font-bold text-slate-500 block">
                Pad ka Level (Level of Office)
              </label>
              <div className="relative">
                <select
                  value={repLevel}
                  onChange={(e) =>
                    handleRepLevelChange(e.target.value as RepresentativeLevel)
                  }
                  className="w-full text-sm font-semibold text-slate-900 bg-transparent outline-none pt-0.5 pr-8 appearance-none cursor-pointer"
                >
                  {REPRESENTATIVE_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Dropdown 2: Current Designation */}
            <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 transition-all bg-white relative">
              <label className="text-[11px] font-bold text-slate-500 block">
                Current Designation (Pad)
              </label>
              <div className="relative">
                <select
                  value={repDesignation}
                  onChange={(e) => {
                    setRepDesignation(e.target.value);
                    refreshSmartServices(category, e.target.value, repLevel);
                  }}
                  className="w-full text-sm font-semibold text-slate-900 bg-transparent outline-none pt-0.5 pr-8 appearance-none cursor-pointer"
                >
                  {(DESIGNATIONS_BY_LEVEL[repLevel] || []).map((desig) => (
                    <option key={desig} value={desig}>
                      {desig}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Dropdown 3: Political Party */}
            <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 transition-all bg-white relative">
              <label className="text-[11px] font-bold text-slate-500 block">
                Political Party
              </label>
              <div className="relative">
                <select
                  value={selectedParty}
                  onChange={(e) => setSelectedParty(e.target.value)}
                  className="w-full text-sm font-semibold text-slate-900 bg-transparent outline-none pt-0.5 pr-8 appearance-none cursor-pointer"
                >
                  {STANDARD_PARTIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* If "Others" is selected in Party */}
            {selectedParty === "Others" && (
              <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl px-3.5 py-2 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 transition-all">
                <label className="text-[11px] font-bold text-emerald-800 block">
                  Type Your Party Name
                </label>
                <input
                  type="text"
                  required={selectedParty === "Others"}
                  value={customParty}
                  onChange={(e) => setCustomParty(e.target.value)}
                  placeholder="e.g. JMM / DMK / AIADMK / NCP / Independent"
                  className="w-full text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none bg-transparent pt-0.5"
                />
              </div>
            )}

            {/* Constituency/Ward */}
            <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 transition-all bg-white">
              <label className="text-[11px] font-bold text-slate-500 block">
                Constituency / Ward Name
              </label>
              <input
                type="text"
                value={constituency}
                onChange={(e) => setConstituency(e.target.value)}
                placeholder="e.g. Varanasi, New Delhi, Ward Number 45"
                className="w-full text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none bg-transparent pt-0.5"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* D. Government Department Category */}
        {/* ========================================================= */}
        {category === "department" && (
          <div className="space-y-3 pt-2 animate-fadeIn">
            {/* Dropdown 1: Government Level */}
            <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-[#78350f] focus-within:ring-1 focus-within:ring-[#78350f] transition-all bg-white relative">
              <label className="text-[11px] font-bold text-slate-500 block">
                Government Level
              </label>
              <div className="relative">
                <select
                  value={govLevel}
                  onChange={(e) => {
                    const nextLvl = e.target.value as GovernmentLevel;
                    setGovLevel(nextLvl);
                    refreshSmartServices(category, deptName || nextLvl, nextLvl);
                  }}
                  className="w-full text-sm font-semibold text-slate-900 bg-transparent outline-none pt-0.5 pr-8 appearance-none cursor-pointer"
                >
                  {GOVERNMENT_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Dropdown 2: State */}
            {isStateDropdownActive && (
              <div className="border border-amber-200 bg-amber-50/40 rounded-xl px-3.5 py-2 focus-within:border-[#78350f] focus-within:ring-1 focus-within:ring-[#78350f] transition-all relative animate-fadeIn">
                <label className="text-[11px] font-bold text-[#78350f] block">
                  Select State / Union Territory
                </label>
                <div className="relative">
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full text-sm font-semibold text-slate-900 bg-transparent outline-none pt-0.5 pr-8 appearance-none cursor-pointer"
                  >
                    {INDIAN_STATES_AND_UTS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#78350f] absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Department Name */}
            <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-[#78350f] focus-within:ring-1 focus-within:ring-[#78350f] transition-all bg-white">
              <label className="text-[11px] font-bold text-slate-500 block">
                Department Name
              </label>
              <input
                type="text"
                value={deptName}
                onChange={(e) => {
                  setDeptName(e.target.value);
                }}
                onBlur={() => {
                  if (deptName.trim()) {
                    refreshSmartServices(category, deptName, govLevel);
                  }
                }}
                placeholder="e.g. Municipal Corporation of Delhi (MCD), Uttar Pradesh Police, Delhi Jal Board"
                className="w-full text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none bg-transparent pt-0.5"
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. DEDICATED "SERVICE" OPTION */}
        {/* Shown for Business, Representative, and Department Categories */}
        {/* ========================================================================= */}
        {category !== "citizen" && (
          <div className="pt-3 pb-2 border-t border-slate-200/80 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Network className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight flex items-center gap-1.5">
                    <span>Public Services & Deliverables</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-200">
                      {servicesList.length} Active
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium leading-snug">
                    {category === "business"
                      ? "Add products/services provided to citizens and clients with SLA and warranty."
                      : category === "representative"
                      ? "Add constituency assistance, funds, recommendations & legislative help."
                      : "Add citizen entitlements, municipal duties, emergency dispatch & SLAs."}
                  </p>
                </div>
              </div>
            </div>

            {/* List of Configurable Services */}
            <div className="space-y-3">
              {servicesList.map((service, idx) => (
                <div
                  key={service.id || idx}
                  className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3 relative group"
                >
                  {/* Service Header Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      Service #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveService(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete this service"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 1. Service Title */}
                  <div className="border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all bg-white">
                    <label className="text-[10px] font-bold text-slate-500 block">
                      Service Name / Title
                    </label>
                    <input
                      type="text"
                      required
                      value={service.title}
                      onChange={(e) =>
                        handleUpdateService(idx, "title", e.target.value)
                      }
                      placeholder={
                        category === "business"
                          ? "e.g. Bituminous Road Resurfacing / 24x7 Waste Logistics"
                          : category === "representative"
                          ? "e.g. MLALAD Fund Sanctions / Medical Emergency Grant"
                          : "e.g. Pothole Repair / Choked Sewer Clearance"
                      }
                      className="w-full text-xs sm:text-sm font-bold text-slate-900 outline-none bg-transparent pt-0.5 placeholder-slate-400"
                    />
                  </div>

                  {/* 2. Category & SLA in Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Category Selector */}
                    <div className="border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all bg-white relative">
                      <label className="text-[10px] font-bold text-slate-500 block">
                        Service Category
                      </label>
                      <select
                        value={service.category}
                        onChange={(e) =>
                          handleUpdateService(
                            idx,
                            "category",
                            e.target.value as CivicService["category"]
                          )
                        }
                        className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none pt-0.5 pr-6 cursor-pointer"
                      >
                        {SERVICE_CATEGORY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* SLA / Turnaround Time */}
                    <div className="border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all bg-white">
                      <label className="text-[10px] font-bold text-slate-500 block">
                        Service Level SLA / Turnaround
                      </label>
                      <input
                        type="text"
                        value={service.sla}
                        onChange={(e) =>
                          handleUpdateService(idx, "sla", e.target.value)
                        }
                        placeholder="e.g. 24 Hours SLA / 48 Hours Action"
                        className="w-full text-xs font-bold text-emerald-700 outline-none bg-transparent pt-0.5 placeholder-slate-400"
                      />
                    </div>
                  </div>

                  {/* 3. Description */}
                  <div className="border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all bg-white">
                    <label className="text-[10px] font-bold text-slate-500 block">
                      Description & Scope of Work
                    </label>
                    <textarea
                      rows={2}
                      value={service.description}
                      onChange={(e) =>
                        handleUpdateService(idx, "description", e.target.value)
                      }
                      placeholder="Explain what is covered, response teams, or technical machinery deployed..."
                      className="w-full text-xs font-medium text-slate-900 outline-none bg-transparent pt-0.5 placeholder-slate-400 resize-none leading-relaxed"
                    />
                  </div>

                  {/* 4. Citizen Entitlement / Guarantee */}
                  <div className="border border-blue-200 bg-blue-50/50 rounded-xl px-3 py-1.5 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all">
                    <label className="text-[10px] font-black uppercase tracking-wide text-blue-700 block">
                      Citizen Right / Entitlement Guarantee
                    </label>
                    <input
                      type="text"
                      value={service.citizenEntitlement}
                      onChange={(e) =>
                        handleUpdateService(
                          idx,
                          "citizenEntitlement",
                          e.target.value
                        )
                      }
                      placeholder="e.g. Zero administrative fee; Guaranteed photo-proof resolution"
                      className="w-full text-xs font-semibold text-blue-950 outline-none bg-transparent pt-0.5 placeholder-blue-300"
                    />
                  </div>
                </div>
              ))}

              {/* Add New Service Button */}
              <button
                type="button"
                onClick={handleAddService}
                className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 rounded-2xl text-xs font-black text-slate-700 hover:text-blue-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Service / Deliverable</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom Save Action Button */}
        <div className="pt-4">
          <button
            id="edit-profile-submit-btn"
            type="submit"
            disabled={saving}
            className="w-full h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <span>Save Profile Changes</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
