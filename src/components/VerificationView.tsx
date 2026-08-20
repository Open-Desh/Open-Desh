import React, { useState } from "react";
import {
  ArrowLeft,
  Upload,
  Check,
  CheckCircle2,
  Lock,
  Clock,
  Building2,
  FileCheck,
  BadgeCheck,
} from "lucide-react";
import { UserProfile, UserCategory } from "../types.ts";
import { getCategoryBadgeConfig, CategoryVerifiedTick } from "./CategoryBadge.tsx";

interface VerificationViewProps {
  userProfile: UserProfile;
  onSave: (updated: Partial<UserProfile>) => Promise<void>;
  onCancel: () => void;
}

export const VerificationView: React.FC<VerificationViewProps> = ({
  userProfile,
  onSave,
  onCancel,
}) => {
  // Lock strictly to the user's profile category
  const activeCategory: UserCategory = userProfile.category || "citizen";

  const [step, setStep] = useState<"form" | "processing" | "success">("form");
  const [processStage, setProcessStage] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 1. Citizen Form State
  const [citizenIdType, setCitizenIdType] = useState("Aadhaar Card");
  const [citizenIdNumber, setCitizenIdNumber] = useState("");
  const [citizenLegalName, setCitizenLegalName] = useState(userProfile.fullName || "");
  const [citizenDocFileName, setCitizenDocFileName] = useState<string | null>(null);

  // 2. Business Form State
  const [companyLegalName, setCompanyLegalName] = useState(
    userProfile.businessDetails?.companyName || userProfile.fullName || ""
  );
  const [businessType, setBusinessType] = useState("Private Limited");
  const [taxIdNumber, setTaxIdNumber] = useState("");
  const [businessDocFileName, setBusinessDocFileName] = useState<string | null>(null);
  const [businessOfficialEmail, setBusinessOfficialEmail] = useState("");

  // 3. Department Form State
  const [deptOfficeName, setDeptOfficeName] = useState(
    userProfile.departmentDetails?.name || ""
  );
  const [deptGovLevel, setDeptGovLevel] = useState(
    userProfile.departmentDetails?.governmentLevel || "State Government"
  );
  const [deptOfficerCode, setDeptOfficerCode] = useState("");
  const [deptOfficialEmail, setDeptOfficialEmail] = useState("");
  const [deptDocFileName, setDeptDocFileName] = useState<string | null>(null);

  // 4. Representative Form State
  const [repDesignation, setRepDesignation] = useState(
    userProfile.representativeDetails?.position || "MLA"
  );
  const [repParty, setRepParty] = useState(
    userProfile.representativeDetails?.party || "BJP"
  );
  const [repConstituency, setRepConstituency] = useState(
    userProfile.representativeDetails?.constituency || userProfile.location || ""
  );
  const [repCertificateNumber, setRepCertificateNumber] = useState("");
  const [repDocFileName, setRepDocFileName] = useState<string | null>(null);

  const currentBadgeConfig = getCategoryBadgeConfig(activeCategory);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: UserCategory
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "citizen") setCitizenDocFileName(file.name);
      else if (type === "business") setBusinessDocFileName(file.name);
      else if (type === "department") setDeptDocFileName(file.name);
      else if (type === "representative") setRepDocFileName(file.name);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStep("processing");

    // Realistic verification pipeline with smooth stage transitions
    setProcessStage(1);
    await new Promise((r) => setTimeout(r, 800));

    setProcessStage(2);
    await new Promise((r) => setTimeout(r, 900));

    setProcessStage(3);
    await new Promise((r) => setTimeout(r, 800));

    // CRITICAL: Automatic verification disabled! Set verified: false and verificationStatus: 'pending'
    const updatedProfilePayload: Partial<UserProfile> = {
      verified: false,
      verificationStatus: "pending",
      verificationSubmittedAt: new Date().toISOString(),
      verificationSubmittedCategory: activeCategory,
      verificationSubmittedDocs:
        activeCategory === "citizen"
          ? citizenDocFileName || "Voter/Govt ID"
          : activeCategory === "business"
          ? businessDocFileName || "GSTIN/Certificate"
          : activeCategory === "department"
          ? deptDocFileName || "Official ID Order"
          : repDocFileName || "Election Commission Certificate",
      category: activeCategory,
    };

    if (activeCategory === "citizen") {
      updatedProfilePayload.fullName = citizenLegalName.trim() || userProfile.fullName;
      updatedProfilePayload.citizenDetails = {
        occupation: userProfile.citizenDetails?.occupation || "Citizen Voter",
        voterConstituency: userProfile.location,
      };
    } else if (activeCategory === "business") {
      updatedProfilePayload.businessDetails = {
        companyName: companyLegalName.trim() || userProfile.fullName,
        industry: userProfile.businessDetails?.industry || "Enterprise & Infrastructure",
        officialWebsite: userProfile.websiteUrl,
        verifiedCompany: false, // Pending admin manual approval
      };
    } else if (activeCategory === "department") {
      updatedProfilePayload.departmentDetails = {
        name: deptOfficeName.trim() || "Government Department Office",
        governmentLevel: deptGovLevel,
        designation: `${deptGovLevel} Office`,
        officialBadge: "Govt Department (Pending Approval)",
        departmentCode: deptOfficerCode.trim() || "GOV-OFFICIAL",
        jurisdictionRegion: userProfile.location || "All India",
      };
    } else if (activeCategory === "representative") {
      updatedProfilePayload.representativeDetails = {
        position: repDesignation.trim() || "Elected Representative",
        party: repParty.trim() || "Independent",
        constituency: repConstituency.trim() || "Constituency Ward",
        termYears: "2024-2029",
      };
    }

    try {
      await onSave(updatedProfilePayload);
      setStep("success");
    } catch (err) {
      console.error("Verification error:", err);
      alert("Verification submission failed. Please try again.");
      setStep("form");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20">
      {/* 1. Main Page Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-5 sm:py-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700 stroke-[2.5]" />
            <span>Back to Profile</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <span>Profile Category:</span>
            <span className="font-black text-slate-900 capitalize flex items-center gap-1">
              <CategoryVerifiedTick category={activeCategory} size="xs" />
              {currentBadgeConfig.categoryTitle}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: FORM VIEW */}
        {/* ========================================================================= */}
        {step === "form" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-5 sm:p-7 space-y-5 animate-fadeIn">
            {/* Under Review Notice if already submitted */}
            {userProfile.verificationStatus === "pending" && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                <div className="text-xs space-y-1">
                  <p className="font-black uppercase tracking-wider text-amber-800">
                    Application Currently Under Review ⏳
                  </p>
                  <p className="text-amber-700 font-medium">
                    Aapka verification application pehle se submission queue mein hai. Agar aap details update karna chahte hain to niche se naya form bharke submit kar sakte hain.
                  </p>
                </div>
              </div>
            )}

            {/* Profile Category Verification Spotlight Card */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${currentBadgeConfig.bgColor} ${currentBadgeConfig.borderColor}`}
            >
              <div className="flex items-center gap-3.5">
                <CategoryVerifiedTick
                  category={activeCategory}
                  size="md"
                  className="shadow-sm"
                />
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight flex items-center gap-2">
                    <span>{currentBadgeConfig.label} Verification</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-800 border border-slate-200 shadow-2xs">
                      {currentBadgeConfig.themeName}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    {currentBadgeConfig.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              {/* ---------------------------------------------------- */}
              {/* 1. CITIZEN FORM (🔵 Blue Tick) */}
              {/* ---------------------------------------------------- */}
              {activeCategory === "citizen" && (
                <div className="space-y-3.5 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border border-slate-200 rounded-2xl px-4 py-2.5 bg-white">
                      <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                        Govt Identity Document Type
                      </label>
                      <select
                        value={citizenIdType}
                        onChange={(e) => setCitizenIdType(e.target.value)}
                        className="w-full text-xs font-semibold text-slate-900 bg-transparent outline-none cursor-pointer"
                      >
                        <option value="Aadhaar Card">Aadhaar Card (UIDAI)</option>
                        <option value="Voter ID Card">Voter ID (Election Commission)</option>
                        <option value="Indian Passport">Indian Passport</option>
                        <option value="Driving Licence">Driving Licence</option>
                      </select>
                    </div>

                    <div className="border border-slate-200 rounded-2xl px-4 py-2.5 bg-white focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600">
                      <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                        {citizenIdType} Number
                      </label>
                      <input
                        type="text"
                        required
                        value={citizenIdNumber}
                        onChange={(e) => setCitizenIdNumber(e.target.value)}
                        placeholder="e.g. XXXX-XXXX-4589"
                        className="w-full text-xs font-semibold text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-2xl px-4 py-2.5 bg-white focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600">
                    <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                      Legal Full Name (as per Govt ID)
                    </label>
                    <input
                      type="text"
                      required
                      value={citizenLegalName}
                      onChange={(e) => setCitizenLegalName(e.target.value)}
                      placeholder="e.g. Ankit Kumar Sharma"
                      className="w-full text-xs font-semibold text-slate-900 outline-none"
                    />
                  </div>

                  {/* Document Upload */}
                  <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-5 text-center bg-slate-50/60 transition-colors">
                    <input
                      id="citizen-doc-upload-page"
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "citizen")}
                    />
                    <label
                      htmlFor="citizen-doc-upload-page"
                      className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-black text-slate-800">
                        {citizenDocFileName ? (
                          <span className="text-blue-600 flex items-center gap-1.5 justify-center">
                            <Check className="w-4 h-4" /> {citizenDocFileName}
                          </span>
                        ) : (
                          "Upload Govt ID Document (Photo/PDF)"
                        )}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        JPG, PNG, or PDF up to 10MB • AES-256 Encrypted
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* 2. BUSINESS FORM (🟡 Yellow Tick) */}
              {/* ---------------------------------------------------- */}
              {activeCategory === "business" && (
                <div className="space-y-3.5 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border border-slate-200 rounded-2xl px-4 py-2.5 bg-white focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500">
                      <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                        Company / Enterprise Legal Name
                      </label>
                      <input
                        type="text"
                        required
                        value={companyLegalName}
                        onChange={(e) => setCompanyLegalName(e.target.value)}
                        placeholder="e.g. Acme InfraTech Solutions Pvt Ltd"
                        className="w-full text-xs font-semibold text-slate-900 outline-none"
                      />
                    </div>

                    <div className="border border-slate-200 rounded-2xl px-4 py-2.5 bg-white">
                      <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                        Entity Structure
                      </label>
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="w-full text-xs font-semibold text-slate-900 bg-transparent outline-none cursor-pointer"
                      >
                        <option value="Private Limited">Private Limited (Pvt Ltd)</option>
                        <option value="Public Limited">Public Limited (Ltd)</option>
                        <option value="LLP">Limited Liability Partnership (LLP)</option>
                        <option value="MSME">Registered MSME / Udyam</option>
                        <option value="Sole Proprietorship">Sole Proprietorship</option>
                        <option value="NGO / Trust">Section 8 / NGO / Trust</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border border-slate-200 rounded-2xl px-4 py-2.5 bg-white focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500">
                      <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                        GSTIN / CIN / Business PAN
                      </label>
                      <input
                        type="text"
                        required
                        value={taxIdNumber}
                        onChange={(e) => setTaxIdNumber(e.target.value)}
                        placeholder="e.g. 20AAACI1234F1Z5"
                        className="w-full text-xs font-semibold text-slate-900 outline-none uppercase"
                      />
                    </div>

                    <div className="border border-slate-200 rounded-2xl px-4 py-2.5 bg-white focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500">
                      <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                        Corporate Work Email
                      </label>
                      <input
                        type="email"
                        required
                        value={businessOfficialEmail}
                        onChange={(e) => setBusinessOfficialEmail(e.target.value)}
                        placeholder="contact@company.com"
                        className="w-full text-xs font-semibold text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  {/* Business Document Upload */}
                  <div className="border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-2xl p-5 text-center bg-amber-50/40 transition-colors">
                    <input
                      id="business-doc-upload-page"
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "business")}
                    />
                    <label
                      htmlFor="business-doc-upload-page"
                      className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                    >
                      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-black text-slate-800">
                        {businessDocFileName ? (
                          <span className="text-amber-800 flex items-center gap-1.5 justify-center">
                            <Check className="w-4 h-4" /> {businessDocFileName}
                          </span>
                        ) : (
                          "Upload GST Certificate / MSME / CIN Document"
                        )}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Required for Corporate Yellow Tick verification
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* 3. DEPARTMENT FORM (🟤 Brown Tick) */}
              {/* ---------------------------------------------------- */}
              {activeCategory === "department" && (
                <div className="space-y-3.5 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border border-slate-200 rounded-2xl px-4 py-2.5 bg-white focus-within:border-[#78350f] focus-within:ring-1 focus-within:ring-[#78350f]">
                      <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                        Official Department / Ministry Name
                      </label>
                      <input
                        type="text"
                        required
                        value={deptOfficeName}
                        onChange={(e) => setDeptOfficeName(e.target.value)}
                        placeholder="e.g. Ranchi Municipal Corporation (RMC)"
                        className="w-full text-xs font-semibold text-slate-900 outline-none"
                      />
                    </div>

                    <div className="border border-slate-200 rounded-2xl px-4 py-2.5 bg-white">
                      <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                        Government Level
                      </label>
                      <select
                        value={deptGovLevel}
                        onChange={(e) => setDeptGovLevel(e.target.value)}
                        className="w-full text-xs font-semibold text-slate-900 bg-transparent outline-none cursor-pointer"
                      >
                        <option value="Central Government">Central Government</option>
                        <option value="State Government">State Government</option>
                        <option value="Local Body / Municipal">Local Body / Municipal</option>
                        <option value="Police & Law Enforcement">Police & Law Enforcement</option>
                        <option value="Autonomous Body / Public Sector">Autonomous Body / PSU</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border border-slate-200 rounded-2xl px-4 py-2.5 bg-white focus-within:border-[#78350f] focus-within:ring-1 focus-within:ring-[#78350f]">
                      <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                        Official Govt Email (.gov.in / .nic.in)
                      </label>
                      <input
                        type="email"
                        required
                        value={deptOfficialEmail}
                        onChange={(e) => setDeptOfficialEmail(e.target.value)}
                        placeholder="nodal.officer@jharkhand.gov.in"
                        className="w-full text-xs font-semibold text-slate-900 outline-none"
                      />
                    </div>

                    <div className="border border-slate-200 rounded-2xl px-4 py-2.5 bg-white focus-within:border-[#78350f] focus-within:ring-1 focus-within:ring-[#78350f]">
                      <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                        Employee Cadre / Officer Code
                      </label>
                      <input
                        type="text"
                        required
                        value={deptOfficerCode}
                        onChange={(e) => setDeptOfficerCode(e.target.value)}
                        placeholder="e.g. GOV-JH-8839"
                        className="w-full text-xs font-semibold text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  {/* Dept Document Upload */}
                  <div className="border-2 border-dashed border-[#b45309]/40 hover:border-[#78350f] rounded-2xl p-5 text-center bg-[#fcf6f0] transition-colors">
                    <input
                      id="dept-doc-upload-page"
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "department")}
                    />
                    <label
                      htmlFor="dept-doc-upload-page"
                      className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                    >
                      <div className="w-12 h-12 rounded-full bg-amber-100 text-[#78350f] flex items-center justify-center shadow-xs">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-black text-slate-800">
                        {deptDocFileName ? (
                          <span className="text-[#78350f] flex items-center gap-1.5 justify-center">
                            <Check className="w-4 h-4" /> {deptDocFileName}
                          </span>
                        ) : (
                          "Upload Official Department Order / Authorization Letter"
                        )}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Required for Sovereign Brown Tick badge authorization
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* 4. REPRESENTATIVE FORM (🟢 Green Tick) */}
              {/* ---------------------------------------------------- */}
              {activeCategory === "representative" && (
                <div className="space-y-3.5 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border border-slate-200 rounded-2xl px-4 py-2.5 bg-white focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600">
                      <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                        Current Designation (Pad)
                      </label>
                      <input
                        type="text"
                        required
                        value={repDesignation}
                        onChange={(e) => setRepDesignation(e.target.value)}
                        placeholder="e.g. MLA, Member of Parliament, Mayor, Minister"
                        className="w-full text-xs font-semibold text-slate-900 outline-none"
                      />
                    </div>

                    <div className="border border-slate-200 rounded-2xl px-4 py-2.5 bg-white focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600">
                      <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                        Political Party Affiliation
                      </label>
                      <input
                        type="text"
                        required
                        value={repParty}
                        onChange={(e) => setRepParty(e.target.value)}
                        placeholder="e.g. BJP / INC / AAP / JMM / Independent"
                        className="w-full text-xs font-semibold text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border border-slate-200 rounded-2xl px-4 py-2.5 bg-white focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600">
                      <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                        Constituency / Ward Name
                      </label>
                      <input
                        type="text"
                        required
                        value={repConstituency}
                        onChange={(e) => setRepConstituency(e.target.value)}
                        placeholder="e.g. Ranchi East / Varanasi"
                        className="w-full text-xs font-semibold text-slate-900 outline-none"
                      />
                    </div>

                    <div className="border border-slate-200 rounded-2xl px-4 py-2.5 bg-white focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600">
                      <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                        Election Commission ID / Certificate No.
                      </label>
                      <input
                        type="text"
                        required
                        value={repCertificateNumber}
                        onChange={(e) => setRepCertificateNumber(e.target.value)}
                        placeholder="e.g. EC-RO-2024-9921"
                        className="w-full text-xs font-semibold text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  {/* Leader Document Upload */}
                  <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl p-5 text-center bg-emerald-50/50 transition-colors">
                    <input
                      id="rep-doc-upload-page"
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "representative")}
                    />
                    <label
                      htmlFor="rep-doc-upload-page"
                      className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                        <BadgeCheck className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-black text-slate-800">
                        {repDocFileName ? (
                          <span className="text-emerald-700 flex items-center gap-1.5 justify-center">
                            <Check className="w-4 h-4" /> {repDocFileName}
                          </span>
                        ) : (
                          "Upload Election Commission Certificate / Gazette Notification"
                        )}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Grants sovereign Green Tick verification for public representatives
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* DPDP Compliance Notice */}
              <div className="p-3.5 bg-slate-50 rounded-2xl flex items-start gap-2.5 text-xs text-slate-500 border border-slate-200">
                <Lock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <span>
                  All submitted documents are verified in compliance with the Digital Personal Data Protection (DPDP) Act. Verified badges are cryptographically signed on Open Nation.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-3.5 rounded-full border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 py-3.5 rounded-full text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-[0.99] ${
                    activeCategory === "citizen"
                      ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"
                      : activeCategory === "business"
                      ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30"
                      : activeCategory === "department"
                      ? "bg-[#78350f] hover:bg-[#582707] shadow-[#78350f]/30"
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    Submit for Manual Admin Review ({currentBadgeConfig.themeName})
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: PROCESSING ANIMATION */}
        {/* ========================================================================= */}
        {step === "processing" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 animate-fadeIn">
            <div className="relative">
              <div
                className={`w-28 h-28 rounded-full flex items-center justify-center animate-pulse ${currentBadgeConfig.bgColor} border-4 ${currentBadgeConfig.borderColor}`}
              >
                <Clock className="w-12 h-12 text-amber-600 stroke-[2.5]" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin border-blue-600" />
            </div>

            <div className="space-y-2.5 max-w-md">
              <h3 className="text-lg font-black text-slate-900">
                Submitting Application to Verification Queue...
              </h3>
              <div className="space-y-2 text-xs sm:text-sm text-slate-600">
                <p
                  className={`flex items-center justify-center gap-2 font-bold ${
                    processStage >= 1 ? "text-blue-600" : "text-slate-400"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>AES-256 Encrypting & Securing Identity Proof</span>
                </p>
                <p
                  className={`flex items-center justify-center gap-2 font-bold ${
                    processStage >= 2 ? "text-blue-600" : "text-slate-400"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Registering Submission on Open Nation Registry</span>
                </p>
                <p
                  className={`flex items-center justify-center gap-2 font-bold ${
                    processStage >= 3 ? "text-amber-600" : "text-slate-400"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enqueuing for Administrative Manual Review</span>
                </p>
              </div>
            </div>

            <div className="w-56 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-700 rounded-full"
                style={{ width: `${processStage * 33.3}%` }}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: SUBMISSION SUCCESS & PENDING CONFIRMATION */}
        {/* ========================================================================= */}
        {step === "success" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 animate-scaleUp">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-amber-50 border-4 border-amber-200 flex items-center justify-center shadow-lg animate-pulse">
                <Clock className="w-12 h-12 text-amber-600 stroke-[2.5]" />
              </div>
              <span className="absolute -top-1 -right-1 text-2xl animate-bounce">
                ⏳
              </span>
            </div>

            <div className="space-y-3 max-w-md">
              <span className="inline-block px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                Application Submitted • Under Admin Review ⏳
              </span>
              <h3 className="text-xl font-black text-slate-900">
                Verification Request Sent!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Aapke documents aur verification details successfully Open Nation administrative queue mein submit ho gaye hain.
              </p>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Applied Category:</span>
                  <span className="font-black text-slate-900 flex items-center gap-1.5">
                    <CategoryVerifiedTick category={activeCategory} size="xs" />
                    <span>{currentBadgeConfig.categoryTitle}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Badge Color:</span>
                  <span className="font-bold text-slate-800">{currentBadgeConfig.themeName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Badge Status:</span>
                  <span className="font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Pending Manual Admin Approval
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 font-medium">
                🔒 <strong>Security Guarantee:</strong> Automatic badge activation band hai. Admin (Aap) documents check karke Firebase Database se verified status <code>true</code> karenge, tabhi badge public profile par dikhai dega.
              </p>
            </div>

            <div className="w-full max-w-xs pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-3.5 rounded-full bg-slate-900 hover:bg-black text-white font-black text-sm shadow-md transition-all cursor-pointer"
              >
                Return to Profile
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
