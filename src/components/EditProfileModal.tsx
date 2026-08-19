import React, { useState, useRef } from "react";
import { X, User, Briefcase, Building, Vote, Check, Loader2, Upload, Camera } from "lucide-react";
import { UserProfile, UserCategory } from "../types.ts";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSave: (updated: Partial<UserProfile>) => Promise<void>;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSave,
}) => {
  const [fullName, setFullName] = useState(userProfile.fullName);
  const [username, setUsername] = useState(userProfile.username);
  const [location, setLocation] = useState(userProfile.location);
  const [bio, setBio] = useState(userProfile.bio);
  const [category, setCategory] = useState<UserCategory>(userProfile.category);
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl);

  // Citizen
  const [occupation, setOccupation] = useState(userProfile.citizenDetails?.occupation || "");

  // Department
  const [deptName, setDeptName] = useState(userProfile.departmentDetails?.name || "");
  const [designation, setDesignation] = useState(userProfile.departmentDetails?.designation || "");

  // Representative
  const [party, setParty] = useState(userProfile.representativeDetails?.party || "");
  const [position, setPosition] = useState(userProfile.representativeDetails?.position || "");
  const [constituency, setConstituency] = useState(userProfile.representativeDetails?.constituency || "");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

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
        username,
        location,
        bio,
        category,
        avatarUrl,
      };

      if (category === "citizen") {
        updatedData.citizenDetails = { occupation };
      } else if (category === "department") {
        updatedData.departmentDetails = {
          name: deptName || "Municipal Corporation Division",
          designation: designation || "Executive Engineer",
          jurisdictionRegion: location || "State Jurisdiction",
          departmentCode: "GOV-882",
          officialBadge: "Govt Verified Officer",
        };
      } else if (category === "representative") {
        updatedData.representativeDetails = {
          party: party || "Independent",
          position: position || "Member of Legislative Assembly (MLA)",
          constituency: constituency || location || "Urban Constituency",
          termYears: "2024-2029",
          legislativeBody: "State Assembly",
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

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fadeIn">
      <div
        id="edit-profile-dialog"
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900">Edit Public Profile</h2>
          <button
            id="close-edit-profile-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-5 overflow-y-auto custom-scrollbar space-y-3.5">
          {/* Avatar Picture with Direct File Upload / Camera */}
          <div className="flex flex-col items-center mb-3">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-600/40 shadow-sm">
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
              className="mt-2 text-xs font-extrabold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Change Profile Picture (Upload / CDN)</span>
            </button>
          </div>

          {/* Full Name */}
          <div className="border border-slate-200 rounded-2xl p-2.5 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 transition-colors">
            <label className="text-[11px] font-bold text-slate-500 block mb-0.5">Full Name</label>
            <input
              id="edit-fullname-input"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full text-sm text-slate-900 bg-transparent focus:outline-none font-semibold"
              required
            />
          </div>

          {/* Username */}
          <div className="border border-slate-200 rounded-2xl p-2.5 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 transition-colors">
            <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
              Username handle (@handle)
            </label>
            <input
              id="edit-username-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full text-sm text-slate-900 bg-transparent focus:outline-none font-semibold"
              required
            />
          </div>

          {/* Location */}
          <div className="border border-slate-200 rounded-2xl p-2.5 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 transition-colors">
            <label className="text-[11px] font-bold text-slate-500 block mb-0.5">City / Location</label>
            <input
              id="edit-location-input"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full text-sm text-slate-900 bg-transparent focus:outline-none font-semibold"
            />
          </div>

          {/* Bio */}
          <div className="border border-slate-200 rounded-2xl p-2.5 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 transition-colors">
            <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
              Bio / Constituency Vision
            </label>
            <textarea
              id="edit-bio-input"
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full text-xs text-slate-900 bg-transparent focus:outline-none resize-none font-medium"
            />
          </div>

          <div className="border-t border-slate-200 my-4"></div>

          {/* Account Category Switcher */}
          <div>
            <label className="text-xs font-black uppercase text-slate-700 tracking-wide block mb-2">
              Account Category Setup (RBAC)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory("citizen")}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  category === "citizen"
                    ? "bg-blue-600 text-white border-blue-600 font-bold shadow-md"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 text-xs font-medium"
                }`}
              >
                <User className="w-4 h-4 mx-auto mb-1" />
                <span className="text-xs">Citizen</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory("department")}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  category === "department"
                    ? "bg-blue-600 text-white border-blue-600 font-bold shadow-md"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 text-xs font-medium"
                }`}
              >
                <Building className="w-4 h-4 mx-auto mb-1" />
                <span className="text-xs">Department</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory("representative")}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  category === "representative"
                    ? "bg-blue-600 text-white border-blue-600 font-bold shadow-md"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 text-xs font-medium"
                }`}
              >
                <Vote className="w-4 h-4 mx-auto mb-1" />
                <span className="text-xs">Leader</span>
              </button>
            </div>
          </div>

          {/* Dynamic Category Extra Fields */}
          {category === "citizen" && (
            <div className="border border-slate-200 rounded-2xl p-2.5 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 transition-colors animate-fadeIn">
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

          {category === "department" && (
            <div className="space-y-3 animate-fadeIn">
              <div className="border border-slate-200 rounded-2xl p-2.5 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 transition-colors">
                <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                  Department Name
                </label>
                <input
                  type="text"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Public Works Department / Jal Board"
                  className="w-full text-sm text-slate-900 bg-transparent focus:outline-none font-semibold"
                />
              </div>

              <div className="border border-slate-200 rounded-2xl p-2.5 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 transition-colors">
                <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                  Designation (Padh)
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Executive Engineer, Nodal Officer"
                  className="w-full text-sm text-slate-900 bg-transparent focus:outline-none font-semibold"
                />
              </div>
            </div>
          )}

          {category === "representative" && (
            <div className="space-y-3 animate-fadeIn">
              <div className="border border-slate-200 rounded-2xl p-2.5 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 transition-colors">
                <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                  Political Party Name
                </label>
                <input
                  type="text"
                  value={party}
                  onChange={(e) => setParty(e.target.value)}
                  placeholder="e.g. BJP / INC / AAP / Independent"
                  className="w-full text-sm text-slate-900 bg-transparent focus:outline-none font-semibold"
                />
              </div>

              <div className="border border-slate-200 rounded-2xl p-2.5 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 transition-colors">
                <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                  Position (Padh)
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Member of Legislative Assembly (MLA)"
                  className="w-full text-sm text-slate-900 bg-transparent focus:outline-none font-semibold"
                />
              </div>

              <div className="border border-slate-200 rounded-2xl p-2.5 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 transition-colors">
                <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                  Constituency (Kshetr)
                </label>
                <input
                  type="text"
                  value={constituency}
                  onChange={(e) => setConstituency(e.target.value)}
                  placeholder="e.g. Gurugram, Ranchi East, New Delhi"
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Profile Configuration...</span>
                </>
              ) : (
                <span>Save Profile Configuration</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
