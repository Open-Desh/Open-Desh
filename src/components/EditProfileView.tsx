import React, { useState } from "react";
import {
  ArrowLeft,
  Camera,
  Upload,
  Check,
  Building,
  User,
  Shield,
  Loader2,
  MapPin,
  Globe,
  FileText,
} from "lucide-react";
import { UserProfile } from "../types.ts";

interface EditProfileViewProps {
  userProfile: UserProfile;
  onSave: (updated: Partial<UserProfile>) => Promise<void>;
  onCancel: () => void;
}

export const EditProfileView: React.FC<EditProfileViewProps> = ({
  userProfile,
  onSave,
  onCancel,
}) => {
  const [fullName, setFullName] = useState(userProfile.fullName || "");
  const [username, setUsername] = useState(userProfile.username || "");
  const [location, setLocation] = useState(userProfile.location || "");
  const [bio, setBio] = useState(userProfile.bio || "");
  const [websiteUrl, setWebsiteUrl] = useState(userProfile.websiteUrl || "");
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl || "");
  const [category, setCategory] = useState<"citizen" | "representative" | "department">(
    userProfile.category || "citizen"
  );

  // Category specific fields
  const [party, setParty] = useState(userProfile.representativeDetails?.party || "");
  const [position, setPosition] = useState(userProfile.representativeDetails?.position || "");
  const [constituency, setConstituency] = useState(
    userProfile.representativeDetails?.constituency || ""
  );
  const [deptName, setDeptName] = useState(userProfile.departmentDetails?.name || "");
  const [deptDesignation, setDeptDesignation] = useState(
    userProfile.departmentDetails?.designation || ""
  );

  // Document verification for Representative & Department
  const [docType, setDocType] = useState<string>("Govt Official Identity Card");
  const [docNumber, setDocNumber] = useState<string>("");
  const [docFileUrl, setDocFileUrl] = useState<string>("");
  const [docFileName, setDocFileName] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);

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

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setDocFileUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isSwitchingToLeadership = category === "representative" || category === "department";
      const isAlreadyVerified = userProfile.verified && userProfile.category === category;

      // If switching to representative or department without pre-existing admin verification,
      // the profile remains in "citizen" category with a pending verification request.
      const assignedCategory = isSwitchingToLeadership && !isAlreadyVerified ? "citizen" : category;

      const updatedData: Partial<UserProfile> = {
        fullName: fullName.trim() || userProfile.fullName,
        username: username.trim().replace(/^@/, "") || userProfile.username,
        location: location.trim(),
        bio: bio.trim(),
        websiteUrl: websiteUrl.trim(),
        avatarUrl: avatarUrl.trim() || userProfile.avatarUrl,
        category: assignedCategory,
      };

      if (category === "representative") {
        updatedData.representativeDetails = {
          party: party.trim() || "Independent",
          position: position.trim() || "Elected Representative",
          constituency: constituency.trim() || location || "Jharkhand",
          termYears: "2024-2029",
          legislativeBody: "State Assembly",
        };
      } else if (category === "department") {
        updatedData.departmentDetails = {
          name: deptName.trim() || "Govt Civic Department",
          designation: deptDesignation.trim() || "Executive Officer",
          departmentCode: "JH-CIVIC-01",
          jurisdictionRegion: location || "Statewide",
          officialBadge: "Govt Verified Officer",
        };
      }

      await onSave(updatedData);

      if (isSwitchingToLeadership && !isAlreadyVerified) {
        alert(
          `Document credentials submitted for verification. Your profile category will remain as 'Citizen' with 'Under Review' status until Open Desh administrators audit and approve your credentials.`
        );
      }

      onCancel();
    } catch (err) {
      console.error("Save profile error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      id="edit-profile-page"
      className="min-h-screen bg-slate-50 flex flex-col max-w-xl mx-auto border-x border-slate-200 shadow-sm"
    >
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="edit-profile-back-btn"
            onClick={onCancel}
            className="p-2 -ml-1 text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Cancel"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Edit Public Profile
            </h1>
            <span className="text-[11px] text-slate-500 font-bold">
              Update citizen credentials & bio
            </span>
          </div>
        </div>

        <button
          id="edit-profile-save-header-btn"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-full bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Save</span>
            </>
          )}
        </button>
      </header>

      {/* Main Form */}
      <form onSubmit={handleSave} className="flex-1 p-4 sm:p-6 space-y-6 pb-24">
        {/* Avatar Upload Section */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col items-center text-center space-y-3 shadow-2xs">
          <div className="relative group cursor-pointer">
            <img
              src={
                avatarUrl ||
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80"
              }
              alt="Avatar Preview"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-md group-hover:opacity-80 transition-opacity"
              referrerPolicy="no-referrer"
            />
            <label
              htmlFor="avatar-file-input"
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
              title="Upload New Photo"
            >
              <Camera className="w-7 h-7" />
            </label>
            <input
              id="avatar-file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <label
              htmlFor="avatar-file-input"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full cursor-pointer transition-colors"
            >
              Upload Device Photo
            </label>
            <button
              type="button"
              onClick={() => setShowImageUrlInput(!showImageUrlInput)}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-full cursor-pointer transition-colors"
            >
              Paste Image URL
            </button>
          </div>

          {showImageUrlInput && (
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 outline-none mt-2"
            />
          )}
        </div>

        {/* Basic Information */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Personal Information
          </h2>

          {/* Full Name */}
          <div className="relative rounded-2xl border border-slate-300 focus-within:border-slate-950 focus-within:ring-2 focus-within:ring-blue-600/20 transition-all bg-slate-50/50">
            <label className="absolute -top-2.5 left-4 bg-white px-1.5 text-[11px] font-bold text-slate-800 rounded">
              Full Name
            </label>
            <input
              id="edit-fullname-input"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full legal or public name"
              className="w-full h-13 px-4 pt-1 text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none bg-transparent"
            />
          </div>

          {/* Username Handle */}
          <div className="relative rounded-2xl border border-slate-300 focus-within:border-slate-950 focus-within:ring-2 focus-within:ring-blue-600/20 transition-all bg-slate-50/50 flex items-center">
            <span className="pl-4 pr-1 text-sm font-bold text-slate-400">@</span>
            <input
              id="edit-username-input"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              placeholder="username_handle"
              className="w-full h-13 pr-4 pt-1 text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none bg-transparent"
            />
          </div>

          {/* City / Location */}
          <div className="relative rounded-2xl border border-slate-300 focus-within:border-slate-950 focus-within:ring-2 focus-within:ring-blue-600/20 transition-all bg-slate-50/50">
            <label className="absolute -top-2.5 left-4 bg-white px-1.5 text-[11px] font-bold text-slate-800 rounded">
              City / State Location
            </label>
            <input
              id="edit-location-input"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Ranchi East, Jharkhand, India"
              className="w-full h-13 px-4 pt-1 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none bg-transparent"
            />
          </div>

          {/* Website Link */}
          <div className="relative rounded-2xl border border-slate-300 focus-within:border-slate-950 focus-within:ring-2 focus-within:ring-blue-600/20 transition-all bg-slate-50/50">
            <label className="absolute -top-2.5 left-4 bg-white px-1.5 text-[11px] font-bold text-slate-800 rounded">
              Website / Social Link
            </label>
            <input
              id="edit-website-input"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://instagram.com/..."
              className="w-full h-13 px-4 pt-1 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none bg-transparent"
            />
          </div>

          {/* Bio */}
          <div className="relative rounded-2xl border border-slate-300 focus-within:border-slate-950 focus-within:ring-2 focus-within:ring-blue-600/20 transition-all bg-slate-50/50 pt-2">
            <label className="absolute -top-2.5 left-4 bg-white px-1.5 text-[11px] font-bold text-slate-800 rounded">
              Bio / Citizen Mission
            </label>
            <textarea
              id="edit-bio-input"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write a brief intro about your civic focus or governance role..."
              className="w-full p-4 pt-1 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none bg-transparent resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Citizen Role & RBAC Details */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Governance Account Type
          </h2>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setCategory("citizen")}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                category === "citizen"
                  ? "border-blue-600 bg-blue-50 text-blue-900 font-black shadow-xs"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
              }`}
            >
              <User className="w-5 h-5 mx-auto mb-1 text-blue-600" />
              <span className="text-xs block">Citizen</span>
            </button>

            <button
              type="button"
              onClick={() => setCategory("representative")}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                category === "representative"
                  ? "border-purple-600 bg-purple-50 text-purple-900 font-black shadow-xs"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
              }`}
            >
              <Shield className="w-5 h-5 mx-auto mb-1 text-purple-600" />
              <span className="text-xs block">Representative</span>
            </button>

            <button
              type="button"
              onClick={() => setCategory("department")}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                category === "department"
                  ? "border-amber-600 bg-amber-50 text-amber-900 font-black shadow-xs"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
              }`}
            >
              <Building className="w-5 h-5 mx-auto mb-1 text-amber-600" />
              <span className="text-xs block">Department</span>
            </button>
          </div>

          {/* Representative specific fields */}
          {category === "representative" && (
            <div className="space-y-3 pt-2">
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Position / Title (e.g. MLA, MP, Ward Councillor)"
                className="w-full h-12 px-4 rounded-xl border border-slate-300 focus:border-slate-900 text-sm font-medium outline-none"
              />
              <input
                type="text"
                value={party}
                onChange={(e) => setParty(e.target.value)}
                placeholder="Political Party Name"
                className="w-full h-12 px-4 rounded-xl border border-slate-300 focus:border-slate-900 text-sm font-medium outline-none"
              />
              <input
                type="text"
                value={constituency}
                onChange={(e) => setConstituency(e.target.value)}
                placeholder="Constituency / Ward Area"
                className="w-full h-12 px-4 rounded-xl border border-slate-300 focus:border-slate-900 text-sm font-medium outline-none"
              />
            </div>
          )}

          {/* Department specific fields */}
          {category === "department" && (
            <div className="space-y-3 pt-2">
              <input
                type="text"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                placeholder="Department Name (e.g. Municipal Corporation, PWD)"
                className="w-full h-12 px-4 rounded-xl border border-slate-300 focus:border-slate-900 text-sm font-medium outline-none"
              />
              <input
                type="text"
                value={deptDesignation}
                onChange={(e) => setDeptDesignation(e.target.value)}
                placeholder="Official Designation / Officer Title"
                className="w-full h-12 px-4 rounded-xl border border-slate-300 focus:border-slate-900 text-sm font-medium outline-none"
              />
            </div>
          )}
          {/* Document Verification Upload Requirement (For Representative & Department) */}
          {(category === "representative" || category === "department") && (
            <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 space-y-3 pt-3">
              <div className="flex items-center gap-2 text-amber-900">
                <FileText className="w-4 h-4 text-amber-700 shrink-0" />
                <h3 className="text-xs font-black uppercase tracking-wider">
                  Mandatory Official Verification Document
                </h3>
              </div>

              <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                To receive the official <strong>{category.toUpperCase()}</strong> badge, please upload a
                valid Govt ID, Gazette notification, or Departmental authorization letter. Your
                profile will remain <strong>Citizen (Under Audit)</strong> until verified by Open Desh.
              </p>

              <div className="space-y-2.5">
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-amber-300 bg-white text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="Govt Official Identity Card">Govt Official Identity Card</option>
                  <option value="Official Gazette / Election Certificate">Official Gazette / Election Certificate</option>
                  <option value="Departmental Authorization Letter">Departmental Authorization Letter</option>
                  <option value="Public Office ID Order">Public Office ID Order</option>
                </select>

                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="Document Reference / ID Number (e.g. JH-GOV-8942)"
                  className="w-full h-11 px-3 rounded-xl border border-amber-300 bg-white text-xs font-medium text-slate-900 outline-none"
                />

                {/* Upload File Button */}
                <div className="flex items-center gap-2">
                  <label className="flex-1 h-11 px-4 rounded-xl border-2 border-dashed border-amber-400 hover:border-amber-600 bg-amber-100/50 hover:bg-amber-100 flex items-center justify-center gap-2 cursor-pointer transition-colors text-amber-900 font-bold text-xs">
                    <Upload className="w-4 h-4 text-amber-700" />
                    <span>{docFileName ? `Attached: ${docFileName}` : "Upload Document / ID Proof"}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleDocUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {docFileUrl && (
                  <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Document successfully attached & encrypted for verification</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Save Button */}
        <div className="pt-2">
          <button
            id="edit-profile-submit-btn"
            type="submit"
            disabled={saving}
            className="w-full h-13 rounded-full bg-slate-950 hover:bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : "Save Profile Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};
