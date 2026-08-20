import React, { useState } from "react";
import {
  ArrowLeft,
  Camera,
  Building2,
  User,
  Shield,
  Loader2,
  Briefcase,
  ChevronDown,
} from "lucide-react";
import { UserProfile, UserCategory } from "../types.ts";

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

export const EditProfileView: React.FC<EditProfileViewProps> = ({
  userProfile,
  onSave,
  onCancel,
}) => {
  // Basic Profile Info
  const [fullName, setFullName] = useState(userProfile.fullName || "");
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

  // Citizen Specific Field
  const [occupation, setOccupation] = useState(
    userProfile.citizenDetails?.occupation || ""
  );

  // Business Specific Fields (Simple like Citizen)
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

  const [saving, setSaving] = useState(false);
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);

  // Level change handler for representative to auto sync designation
  const handleRepLevelChange = (newLevel: RepresentativeLevel) => {
    setRepLevel(newLevel);
    const availableDesignations = DESIGNATIONS_BY_LEVEL[newLevel];
    if (
      availableDesignations &&
      !availableDesignations.includes(repDesignation)
    ) {
      setRepDesignation(availableDesignations[0] || "");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedData: Partial<UserProfile> = {
        fullName: fullName.trim() || userProfile.fullName,
        username: userProfile.username, // Username is preserved, no input box
        location: location.trim(),
        age: age.trim() ? parseInt(age, 10) : undefined,
        bio: bio.trim(),
        websiteUrl: websiteUrl.trim(),
        avatarUrl: avatarUrl.trim() || userProfile.avatarUrl,
        category: category,
      };

      if (category === "citizen") {
        updatedData.citizenDetails = {
          occupation: occupation.trim() || "Citizen Resident",
          voterConstituency: location.trim() || undefined,
        };
      } else if (category === "business") {
        updatedData.businessDetails = {
          companyName:
            companyName.trim() || fullName.trim() || "Corporate Enterprise",
          industry: industry.trim() || "Civic & Infrastructure Services",
          officialWebsite: websiteUrl.trim() || undefined,
          verifiedCompany: userProfile.verified || false,
        };
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
          officialBadge: "Verified Govt Department",
        };
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
          disabled={saving}
          className="px-5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <span>Save</span>
          )}
        </button>
      </header>

      {/* 2. Avatar / Profile Picture (Only DP Image, No Banner) */}
      <div className="px-4 sm:px-6 pt-5 pb-3 flex flex-col items-center">
        <div className="relative group">
          <img
            src={
              avatarUrl ||
              userProfile.avatarUrl ||
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80"
            }
            alt="Avatar Preview"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-slate-200 shadow-sm bg-white"
            referrerPolicy="no-referrer"
          />
          <label
            htmlFor="avatar-file-input"
            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer text-white opacity-0 group-hover:opacity-100 transition-opacity"
            title="Upload photo"
          >
            <Camera className="w-6 h-6" />
          </label>
          <input
            id="avatar-file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        <div className="flex items-center gap-2 mt-3">
          <label
            htmlFor="avatar-file-input"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-full cursor-pointer transition-colors"
          >
            Upload Photo
          </label>
          <button
            type="button"
            onClick={() => setShowImageUrlInput(!showImageUrlInput)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 px-3.5 py-1.5 rounded-full cursor-pointer transition-colors"
          >
            Image URL
          </button>
        </div>

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

      {/* 3. Edge-to-Edge Form Body */}
      <form
        onSubmit={handleSave}
        className="flex-1 px-4 sm:px-6 py-2 space-y-4 pb-24"
      >
        {/* Full Name */}
        <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all bg-white">
          <label className="text-[11px] font-bold text-slate-500 block">
            {category === "department"
              ? "Official Name / Department Head"
              : category === "business"
              ? "Full Name / Representative Name"
              : "Name"}
          </label>
          <input
            id="edit-fullname-input"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={
              category === "department"
                ? "e.g. Officer in Charge"
                : category === "business"
                ? "Your Name / Executive Name"
                : "Your full name"
            }
            className="w-full text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none bg-transparent pt-0.5"
          />
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

        {/* Citizen Age (Optional) */}
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

        {/* Section Divider */}
        <div className="pt-2 pb-1 border-t border-slate-100">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
            Account Type
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            Choose your account role to configure your public badge and governance capabilities.
          </p>

          {/* 4-Option Grid Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1. Citizen */}
            <button
              type="button"
              onClick={() => setCategory("citizen")}
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
              onClick={() => setCategory("business")}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                category === "business"
                  ? "border-indigo-600 bg-indigo-50/80 text-indigo-950 font-black shadow-xs ring-1 ring-indigo-600"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
              }`}
            >
              <Briefcase className="w-5 h-5 mb-1 text-indigo-600" />
              <span className="text-xs block leading-tight">Business / Co.</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Enterprise
              </span>
            </button>

            {/* 3. Representative */}
            <button
              type="button"
              onClick={() => setCategory("representative")}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                category === "representative"
                  ? "border-purple-600 bg-purple-50/80 text-purple-950 font-black shadow-xs ring-1 ring-purple-600"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
              }`}
            >
              <Shield className="w-5 h-5 mb-1 text-purple-600" />
              <span className="text-xs block">Representative</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Politics & Leader
              </span>
            </button>

            {/* 4. Department */}
            <button
              type="button"
              onClick={() => setCategory("department")}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                category === "department"
                  ? "border-amber-600 bg-amber-50/80 text-amber-950 font-black shadow-xs ring-1 ring-amber-600"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
              }`}
            >
              <Building2 className="w-5 h-5 mb-1 text-amber-600" />
              <span className="text-xs block">Govt Dept</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Public Agency
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Category Specific Inputs */}

        {/* ========================================================= */}
        {/* A. Citizen Category (Simple) */}
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
        {/* B. Business / Company Category (Simple like Citizen) */}
        {/* ========================================================= */}
        {category === "business" && (
          <div className="space-y-3 pt-2 animate-fadeIn">
            <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 transition-all bg-white">
              <label className="text-[11px] font-bold text-slate-500 block">
                Company / Organization Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Tata Infra Ltd / GreenWave Solutions"
                className="w-full text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none bg-transparent pt-0.5"
              />
            </div>

            <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 transition-all bg-white">
              <label className="text-[11px] font-bold text-slate-500 block">
                Industry / Sector
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Civic Infrastructure, Real Estate, Waste Management, Technology"
                className="w-full text-sm font-medium text-slate-900 placeholder-slate-400 outline-none bg-transparent pt-0.5"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* C. 1. Representative Category (Politics & Leaders) */}
        {/* ========================================================= */}
        {category === "representative" && (
          <div className="space-y-3 pt-2 animate-fadeIn">
            {/* Dropdown 1: Pad ka Level */}
            <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-purple-600 focus-within:ring-1 focus-within:ring-purple-600 transition-all bg-white relative">
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

            {/* Dropdown 2: Current Designation (Depends on Dropdown 1) */}
            <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-purple-600 focus-within:ring-1 focus-within:ring-purple-600 transition-all bg-white relative">
              <label className="text-[11px] font-bold text-slate-500 block">
                Current Designation (Pad)
              </label>
              <div className="relative">
                <select
                  value={repDesignation}
                  onChange={(e) => setRepDesignation(e.target.value)}
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
            <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-purple-600 focus-within:ring-1 focus-within:ring-purple-600 transition-all bg-white relative">
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

            {/* If "Others" is selected in Party, show Input Box: Type Your Party */}
            {selectedParty === "Others" && (
              <div className="border border-purple-200 bg-purple-50/50 rounded-xl px-3.5 py-2 focus-within:border-purple-600 focus-within:ring-1 focus-within:ring-purple-600 transition-all">
                <label className="text-[11px] font-bold text-purple-700 block">
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

            {/* Input Box: Constituency/Ward */}
            <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-purple-600 focus-within:ring-1 focus-within:ring-purple-600 transition-all bg-white">
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
        {/* D. 2. Government Department Category */}
        {/* ========================================================= */}
        {category === "department" && (
          <div className="space-y-3 pt-2 animate-fadeIn">
            {/* Dropdown 1: Government Level */}
            <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-amber-600 focus-within:ring-1 focus-within:ring-amber-600 transition-all bg-white relative">
              <label className="text-[11px] font-bold text-slate-500 block">
                Government Level
              </label>
              <div className="relative">
                <select
                  value={govLevel}
                  onChange={(e) =>
                    setGovLevel(e.target.value as GovernmentLevel)
                  }
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

            {/* Dropdown 2: State (Active only when State Government or Police & Law Enforcement is selected) */}
            {isStateDropdownActive && (
              <div className="border border-amber-200 bg-amber-50/40 rounded-xl px-3.5 py-2 focus-within:border-amber-600 focus-within:ring-1 focus-within:ring-amber-600 transition-all relative animate-fadeIn">
                <label className="text-[11px] font-bold text-amber-800 block">
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
                  <ChevronDown className="w-4 h-4 text-amber-600 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Input Box: Department Name */}
            <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-amber-600 focus-within:ring-1 focus-within:ring-amber-600 transition-all bg-white">
              <label className="text-[11px] font-bold text-slate-500 block">
                Department Name
              </label>
              <input
                type="text"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                placeholder="e.g. Delhi Municipal Corporation (MCD), Uttar Pradesh Police, Ministry of Health, Delhi Jal Board"
                className="w-full text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none bg-transparent pt-0.5"
              />
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
