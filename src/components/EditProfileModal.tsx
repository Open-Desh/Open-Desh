import React, { useState, useRef } from "react";
import {
  X,
  User,
  Building2,
  Briefcase,
  Shield,
  Loader2,
  Upload,
  Camera,
  ChevronDown,
} from "lucide-react";
import { UserProfile, UserCategory } from "../types.ts";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSave: (updated: Partial<UserProfile>) => Promise<void>;
}

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

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSave,
}) => {
  const [fullName, setFullName] = useState(userProfile.fullName);
  const [location, setLocation] = useState(userProfile.location);
  const [bio, setBio] = useState(userProfile.bio);
  const [websiteUrl, setWebsiteUrl] = useState(userProfile.websiteUrl || "");
  const [category, setCategory] = useState<UserCategory>(userProfile.category);
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl);

  // Business / Company
  const [companyName, setCompanyName] = useState(
    userProfile.businessDetails?.companyName || ""
  );
  const [industry, setIndustry] = useState(
    userProfile.businessDetails?.industry || ""
  );

  // Citizen
  const [occupation, setOccupation] = useState(
    userProfile.citizenDetails?.occupation || ""
  );

  // Representative
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

  // Department
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleRepLevelChange = (newLevel: RepresentativeLevel) => {
    setRepLevel(newLevel);
    const available = DESIGNATIONS_BY_LEVEL[newLevel];
    if (available && !available.includes(repDesignation)) {
      setRepDesignation(available[0] || "");
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updatedData: Partial<UserProfile> = {
        fullName,
        username: userProfile.username, // Preserved without input box
        location,
        bio,
        websiteUrl,
        category,
        avatarUrl,
      };

      if (category === "citizen") {
        updatedData.citizenDetails = { occupation };
      } else if (category === "business") {
        updatedData.businessDetails = {
          companyName: companyName || fullName || "Corporate Enterprise",
          industry: industry || "Civic & Infrastructure Services",
          officialWebsite: websiteUrl || undefined,
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
          constituency: constituency.trim() || location || "Constituency Area",
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
      onClose();
    } catch (err) {
      console.error("Save profile error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const isStateDropdownActive =
    govLevel === "State Government" || govLevel === "Police & Law Enforcement";

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fadeIn">
      <div
        id="edit-profile-dialog"
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900">
            Edit profile
          </h2>
          <button
            id="close-edit-profile-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleFormSubmit}
          className="p-5 overflow-y-auto custom-scrollbar space-y-3.5"
        >
          {/* Avatar Picture with Direct File Upload / Camera */}
          <div className="flex flex-col items-center mb-2">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-600/40 shadow-sm bg-white">
                <img
                  src={avatarUrl || userProfile.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-xs font-extrabold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Change Profile Picture</span>
            </button>
          </div>

          {/* Full Name */}
          <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-blue-600 transition-colors bg-white">
            <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
              Name
            </label>
            <input
              id="edit-fullname-input"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full text-sm text-slate-900 bg-transparent focus:outline-none font-semibold"
              required
            />
          </div>

          {/* Location */}
          <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-blue-600 transition-colors bg-white">
            <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
              Location
            </label>
            <input
              id="edit-location-input"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full text-sm text-slate-900 bg-transparent focus:outline-none font-semibold"
            />
          </div>

          {/* Website Link */}
          <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-blue-600 transition-colors bg-white">
            <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
              Website
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full text-sm text-slate-900 bg-transparent focus:outline-none font-medium"
            />
          </div>

          {/* Bio */}
          <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-blue-600 transition-colors bg-white">
            <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
              Bio
            </label>
            <textarea
              id="edit-bio-input"
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full text-xs text-slate-900 bg-transparent focus:outline-none resize-none font-medium leading-relaxed"
            />
          </div>

          <div className="border-t border-slate-100 my-3"></div>

          {/* Account Category Switcher with 4 options */}
          <div>
            <label className="text-xs font-black uppercase text-slate-800 tracking-wide block mb-2">
              Account Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setCategory("citizen")}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  category === "citizen"
                    ? "bg-blue-600 text-white border-blue-600 font-bold shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 text-xs font-medium"
                }`}
              >
                <User className="w-4 h-4 mx-auto mb-1" />
                <span className="text-[11px] block leading-tight">Citizen</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory("business")}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  category === "business"
                    ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 text-xs font-medium"
                }`}
              >
                <Briefcase className="w-4 h-4 mx-auto mb-1" />
                <span className="text-[11px] block leading-tight">
                  Business
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCategory("representative")}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  category === "representative"
                    ? "bg-purple-600 text-white border-purple-600 font-bold shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 text-xs font-medium"
                }`}
              >
                <Shield className="w-4 h-4 mx-auto mb-1" />
                <span className="text-[11px] block leading-tight">Leader</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory("department")}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  category === "department"
                    ? "bg-amber-600 text-white border-amber-600 font-bold shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 text-xs font-medium"
                }`}
              >
                <Building2 className="w-4 h-4 mx-auto mb-1" />
                <span className="text-[11px] block leading-tight">Govt Dept</span>
              </button>
            </div>
          </div>

          {/* Citizen Extra Fields */}
          {category === "citizen" && (
            <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-blue-600 transition-colors bg-white animate-fadeIn">
              <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                Occupation / Vocation
              </label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Student, Tech Architect, Advocate"
                className="w-full text-sm text-slate-900 bg-transparent focus:outline-none font-semibold"
              />
            </div>
          )}

          {/* Business / Company extra fields (Simple like Citizen) */}
          {category === "business" && (
            <div className="space-y-2.5 animate-fadeIn">
              <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-indigo-600 transition-colors bg-white">
                <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Infra Pvt Ltd"
                  className="w-full text-sm text-slate-900 bg-transparent focus:outline-none font-semibold"
                />
              </div>

              <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-indigo-600 transition-colors bg-white">
                <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                  Industry / Sector
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Infrastructure, Real Estate, Solar"
                  className="w-full text-sm text-slate-900 bg-transparent focus:outline-none font-semibold"
                />
              </div>
            </div>
          )}

          {/* Representative Extra Fields */}
          {category === "representative" && (
            <div className="space-y-2.5 animate-fadeIn">
              {/* Dropdown 1 */}
              <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-purple-600 transition-colors bg-white relative">
                <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                  Pad ka Level
                </label>
                <div className="relative">
                  <select
                    value={repLevel}
                    onChange={(e) =>
                      handleRepLevelChange(
                        e.target.value as RepresentativeLevel
                      )
                    }
                    className="w-full text-sm font-semibold text-slate-900 bg-transparent outline-none pr-8 appearance-none cursor-pointer"
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

              {/* Dropdown 2 */}
              <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-purple-600 transition-colors bg-white relative">
                <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                  Current Designation (Pad)
                </label>
                <div className="relative">
                  <select
                    value={repDesignation}
                    onChange={(e) => setRepDesignation(e.target.value)}
                    className="w-full text-sm font-semibold text-slate-900 bg-transparent outline-none pr-8 appearance-none cursor-pointer"
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

              {/* Dropdown 3 */}
              <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-purple-600 transition-colors bg-white relative">
                <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                  Political Party
                </label>
                <div className="relative">
                  <select
                    value={selectedParty}
                    onChange={(e) => setSelectedParty(e.target.value)}
                    className="w-full text-sm font-semibold text-slate-900 bg-transparent outline-none pr-8 appearance-none cursor-pointer"
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

              {selectedParty === "Others" && (
                <div className="border border-purple-200 bg-purple-50/50 rounded-xl px-3.5 py-2 focus-within:border-purple-600 transition-colors">
                  <label className="text-[11px] font-bold text-purple-700 block mb-0.5">
                    Type Your Party Name
                  </label>
                  <input
                    type="text"
                    required={selectedParty === "Others"}
                    value={customParty}
                    onChange={(e) => setCustomParty(e.target.value)}
                    placeholder="e.g. JMM / DMK / NCP / Independent"
                    className="w-full text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none bg-transparent"
                  />
                </div>
              )}

              {/* Constituency Input */}
              <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-purple-600 transition-colors bg-white">
                <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                  Constituency / Ward Name
                </label>
                <input
                  type="text"
                  value={constituency}
                  onChange={(e) => setConstituency(e.target.value)}
                  placeholder="e.g. Varanasi, New Delhi, Ward Number 45"
                  className="w-full text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none bg-transparent"
                />
              </div>
            </div>
          )}

          {/* Department Extra Fields */}
          {category === "department" && (
            <div className="space-y-2.5 animate-fadeIn">
              {/* Dropdown 1 */}
              <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-amber-600 transition-colors bg-white relative">
                <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                  Government Level
                </label>
                <div className="relative">
                  <select
                    value={govLevel}
                    onChange={(e) =>
                      setGovLevel(e.target.value as GovernmentLevel)
                    }
                    className="w-full text-sm font-semibold text-slate-900 bg-transparent outline-none pr-8 appearance-none cursor-pointer"
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

              {/* Dropdown 2 (State) */}
              {isStateDropdownActive && (
                <div className="border border-amber-200 bg-amber-50/40 rounded-xl px-3.5 py-2 focus-within:border-amber-600 transition-colors relative animate-fadeIn">
                  <label className="text-[11px] font-bold text-amber-800 block mb-0.5">
                    Select State / Union Territory
                  </label>
                  <div className="relative">
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="w-full text-sm font-semibold text-slate-900 bg-transparent outline-none pr-8 appearance-none cursor-pointer"
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

              {/* Department Name Input */}
              <div className="border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-amber-600 transition-colors bg-white">
                <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                  Department Name
                </label>
                <input
                  type="text"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Delhi Municipal Corporation (MCD), Uttar Pradesh Police"
                  className="w-full text-sm text-slate-900 bg-transparent focus:outline-none font-semibold"
                />
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-2">
            <button
              id="save-profile-btn"
              type="submit"
              disabled={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm py-3 rounded-full shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
