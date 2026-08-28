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
  AlertCircle,
  ShieldCheck,
  FileText,
  X,
  RefreshCw,
  Info,
  Calendar,
  Hash,
  Mail,
  ExternalLink,
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
  // Lock strictly to the user's current profile category
  const activeCategory: UserCategory = userProfile.category || "citizen";

  // Check if there is an active pending review for the currently active category
  const isAlreadyPending =
    userProfile.verificationStatus === "pending" &&
    (userProfile.verificationSubmittedCategory === activeCategory ||
      (!userProfile.verificationSubmittedCategory && !userProfile.verified));

  const [step, setStep] = useState<"form" | "processing" | "under_review">(
    isAlreadyPending ? "under_review" : "form"
  );
  const [processStage, setProcessStage] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);

  // 1. Citizen Form State
  const [citizenIdType, setCitizenIdType] = useState<
    "Aadhaar Card" | "Voter ID Card" | "PAN Card" | "Indian Passport" | "Driving Licence"
  >("Aadhaar Card");
  const [citizenIdNumber, setCitizenIdNumber] = useState(
    userProfile.verificationDocNumber || ""
  );
  const [citizenLegalName, setCitizenLegalName] = useState(
    userProfile.fullName || ""
  );
  const [citizenDocFileName, setCitizenDocFileName] = useState<string | null>(
    userProfile.verificationSubmittedDocs || null
  );
  const [citizenDocFileSize, setCitizenDocFileSize] = useState<string | null>(null);
  const [citizenDocPreview, setCitizenDocPreview] = useState<string | null>(
    userProfile.verificationDocUrl || null
  );

  // 2. Business Form State
  const [companyLegalName, setCompanyLegalName] = useState(
    userProfile.businessDetails?.companyName || userProfile.fullName || ""
  );
  const [businessDocType, setBusinessDocType] = useState<
    "GSTIN Certificate" | "Corporate CIN" | "Udyam / MSME Registration" | "Company PAN"
  >("GSTIN Certificate");
  const [businessType, setBusinessType] = useState(
    "Private Limited"
  );
  const [businessTaxId, setBusinessTaxId] = useState(
    userProfile.businessDetails?.gstinOrPan || userProfile.verificationDocNumber || ""
  );
  const [businessOfficialEmail, setBusinessOfficialEmail] = useState(
    userProfile.businessDetails?.contactEmail || userProfile.email || ""
  );
  const [businessDocFileName, setBusinessDocFileName] = useState<string | null>(
    userProfile.verificationSubmittedDocs || null
  );
  const [businessDocFileSize, setBusinessDocFileSize] = useState<string | null>(null);
  const [businessDocPreview, setBusinessDocPreview] = useState<string | null>(
    userProfile.verificationDocUrl || null
  );

  // 3. Department Form State
  const [deptOfficeName, setDeptOfficeName] = useState(
    userProfile.departmentDetails?.name || userProfile.fullName || ""
  );
  const [deptGovLevel, setDeptGovLevel] = useState(
    userProfile.departmentDetails?.governmentLevel || "State Government"
  );
  const [deptOfficerCode, setDeptOfficerCode] = useState(
    userProfile.departmentDetails?.departmentCode || userProfile.verificationDocNumber || ""
  );
  const [deptOfficialEmail, setDeptOfficialEmail] = useState(
    userProfile.email || ""
  );
  const [deptOrderDispatchNo, setDeptOrderDispatchNo] = useState(
    userProfile.verificationDocNumber || ""
  );
  const [deptDocFileName, setDeptDocFileName] = useState<string | null>(
    userProfile.verificationSubmittedDocs || null
  );
  const [deptDocFileSize, setDeptDocFileSize] = useState<string | null>(null);
  const [deptDocPreview, setDeptDocPreview] = useState<string | null>(
    userProfile.verificationDocUrl || null
  );

  // 4. Representative Form State
  const [repDesignation, setRepDesignation] = useState(
    userProfile.representativeDetails?.position || "MLA (Member of Legislative Assembly)"
  );
  const [repParty, setRepParty] = useState(
    userProfile.representativeDetails?.party || ""
  );
  const [repConstituency, setRepConstituency] = useState(
    userProfile.representativeDetails?.constituency || userProfile.location || ""
  );
  const [repEciNumber, setRepEciNumber] = useState(
    userProfile.verificationDocNumber || ""
  );
  const [repDocFileName, setRepDocFileName] = useState<string | null>(
    userProfile.verificationSubmittedDocs || null
  );
  const [repDocFileSize, setRepDocFileSize] = useState<string | null>(null);
  const [repDocPreview, setRepDocPreview] = useState<string | null>(
    userProfile.verificationDocUrl || null
  );

  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploadingToR2, setIsUploadingToR2] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const currentBadgeConfig = getCategoryBadgeConfig(activeCategory);

  // Formatting & Validation Rules
  const validateDocumentNumber = (): { isValid: boolean; message?: string } => {
    if (activeCategory === "citizen") {
      const cleanNum = citizenIdNumber.replace(/[\s-]/g, "").toUpperCase();
      if (!cleanNum) {
        return { isValid: false, message: `Please enter your ${citizenIdType} number.` };
      }

      if (citizenIdType === "Aadhaar Card") {
        if (!/^\d{12}$/.test(cleanNum)) {
          return {
            isValid: false,
            message: "Aadhaar number must contain exactly 12 numeric digits (e.g. 2345 6789 0123).",
          };
        }
      } else if (citizenIdType === "Voter ID Card") {
        if (cleanNum.length < 10) {
          return {
            isValid: false,
            message: "Voter ID (EPIC) must be at least 10 characters (e.g. ABC1234567).",
          };
        }
      } else if (citizenIdType === "PAN Card") {
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanNum)) {
          return {
            isValid: false,
            message: "PAN Card must be 10 characters in standard format (e.g. ABCDE1234F).",
          };
        }
      } else if (citizenIdType === "Indian Passport") {
        if (!/^[A-Z]{1}[0-9]{7}$/.test(cleanNum) && cleanNum.length !== 8) {
          return {
            isValid: false,
            message: "Passport number must be 8 characters (1 letter followed by 7 digits, e.g. M1234567).",
          };
        }
      } else if (citizenIdType === "Driving Licence") {
        if (cleanNum.length < 10 || cleanNum.length > 18) {
          return {
            isValid: false,
            message: "Driving Licence must be between 10 to 18 characters (e.g. DL-1420110012345).",
          };
        }
      }
      return { isValid: true };
    }

    if (activeCategory === "business") {
      const cleanTax = businessTaxId.replace(/[\s-]/g, "").toUpperCase();
      if (!cleanTax) {
        return { isValid: false, message: `Please enter your ${businessDocType} number.` };
      }

      if (businessDocType === "GSTIN Certificate") {
        if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(cleanTax)) {
          return {
            isValid: false,
            message: "GSTIN must be in standard 15-character format (e.g. 20AAACI1234F1Z5).",
          };
        }
      } else if (businessDocType === "Corporate CIN") {
        if (cleanTax.length !== 21) {
          return {
            isValid: false,
            message: "CIN (Corporate Identification Number) must be exactly 21 characters (e.g. U74999DL2018PTC123456).",
          };
        }
      } else if (businessDocType === "Company PAN") {
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanTax)) {
          return {
            isValid: false,
            message: "Corporate PAN must be 10 characters (e.g. AAACA1234C).",
          };
        }
      }

      if (!businessOfficialEmail || !/\S+@\S+\.\S+/.test(businessOfficialEmail)) {
        return { isValid: false, message: "Please provide a valid corporate work email address." };
      }

      return { isValid: true };
    }

    if (activeCategory === "department") {
      const cleanCode = deptOfficerCode.trim();
      if (!cleanCode || cleanCode.length < 4) {
        return { isValid: false, message: "Officer / Cadre code must be at least 4 characters (e.g. GOV-JH-8839)." };
      }

      if (!deptOfficialEmail || !/\S+@\S+\.\S+/.test(deptOfficialEmail)) {
        return { isValid: false, message: "Please provide a valid official government email address." };
      }

      // Check government domain suffix
      const emailLower = deptOfficialEmail.toLowerCase();
      const isGovDomain =
        emailLower.endsWith(".gov.in") ||
        emailLower.endsWith(".nic.in") ||
        emailLower.endsWith(".gov") ||
        emailLower.endsWith(".ac.in") ||
        emailLower.endsWith(".org.in") ||
        emailLower.endsWith(".in");

      if (!isGovDomain) {
        return {
          isValid: false,
          message: "Official verification requires a valid institutional/government email domain (e.g. @jharkhand.gov.in, @nic.in).",
        };
      }

      return { isValid: true };
    }

    if (activeCategory === "representative") {
      const cleanEci = repEciNumber.trim();
      if (!cleanEci || cleanEci.length < 4) {
        return {
          isValid: false,
          message: "Please enter a valid Election Commission Candidate / Gazetted Reference number.",
        };
      }
      if (!repParty.trim()) {
        return { isValid: false, message: "Please state your political party affiliation or Independent." };
      }
      if (!repConstituency.trim()) {
        return { isValid: false, message: "Please specify your representing constituency or ward." };
      }
      return { isValid: true };
    }

    return { isValid: true };
  };

  // Mask sensitive document ID for preview display
  const maskDocumentId = (num: string): string => {
    const clean = num.replace(/\s+/g, "");
    if (clean.length <= 4) return clean;
    const last4 = clean.slice(-4);
    const maskedPrefix = "•".repeat(Math.min(clean.length - 4, 8));
    return `${maskedPrefix} ${last4}`;
  };

  // File Upload with Cloudflare R2 Simulation & Data URL Processing
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: UserCategory
  ) => {
    setValidationError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10 MB max)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setValidationError("File size exceeds 10MB limit. Please upload a smaller document image or PDF.");
      return;
    }

    // Format file size string (e.g. 2.4 MB)
    const formattedSize =
      file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    setIsUploadingToR2(true);
    setUploadProgress(15);

    const reader = new FileReader();
    reader.onprogress = (pe) => {
      if (pe.lengthComputable) {
        const p = Math.round((pe.loaded / pe.total) * 80);
        setUploadProgress(p);
      }
    };

    reader.onload = () => {
      setTimeout(() => {
        setUploadProgress(100);
        const resultStr = typeof reader.result === "string" ? reader.result : null;

        if (type === "citizen") {
          setCitizenDocFileName(file.name);
          setCitizenDocFileSize(formattedSize);
          setCitizenDocPreview(resultStr);
        } else if (type === "business") {
          setBusinessDocFileName(file.name);
          setBusinessDocFileSize(formattedSize);
          setBusinessDocPreview(resultStr);
        } else if (type === "department") {
          setDeptDocFileName(file.name);
          setDeptDocFileSize(formattedSize);
          setDeptDocPreview(resultStr);
        } else if (type === "representative") {
          setRepDocFileName(file.name);
          setRepDocFileSize(formattedSize);
          setRepDocPreview(resultStr);
        }
        setIsUploadingToR2(false);
      }, 500);
    };

    reader.onerror = () => {
      setIsUploadingToR2(false);
      setValidationError("Failed to read the document file. Please select a valid image or PDF.");
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveUploadedDoc = (type: UserCategory) => {
    if (type === "citizen") {
      setCitizenDocFileName(null);
      setCitizenDocFileSize(null);
      setCitizenDocPreview(null);
    } else if (type === "business") {
      setBusinessDocFileName(null);
      setBusinessDocFileSize(null);
      setBusinessDocPreview(null);
    } else if (type === "department") {
      setDeptDocFileName(null);
      setDeptDocFileSize(null);
      setDeptDocPreview(null);
    } else if (type === "representative") {
      setRepDocFileName(null);
      setRepDocFileSize(null);
      setRepDocPreview(null);
    }
  };

  // Submit Handler
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // 1. Check Document File Attached
    let attachedDocFileName: string | null = null;
    let attachedDocPreview: string | null = null;
    let attachedDocNumber: string = "";
    let attachedDocType: string = "";

    if (activeCategory === "citizen") {
      attachedDocFileName = citizenDocFileName;
      attachedDocPreview = citizenDocPreview;
      attachedDocNumber = citizenIdNumber.trim();
      attachedDocType = citizenIdType;
    } else if (activeCategory === "business") {
      attachedDocFileName = businessDocFileName;
      attachedDocPreview = businessDocPreview;
      attachedDocNumber = businessTaxId.trim();
      attachedDocType = businessDocType;
    } else if (activeCategory === "department") {
      attachedDocFileName = deptDocFileName;
      attachedDocPreview = deptDocPreview;
      attachedDocNumber = deptOfficerCode.trim() || deptOrderDispatchNo.trim();
      attachedDocType = "Govt Official Authorization Order";
    } else if (activeCategory === "representative") {
      attachedDocFileName = repDocFileName;
      attachedDocPreview = repDocPreview;
      attachedDocNumber = repEciNumber.trim();
      attachedDocType = "Election Commission Notification";
    }

    if (!attachedDocFileName) {
      setValidationError(
        "Mandatory Document Missing: Please upload a clear photo or PDF scan of your identity verification document."
      );
      return;
    }

    // 2. Validate Document Number
    const valResult = validateDocumentNumber();
    if (!valResult.isValid) {
      setValidationError(valResult.message || "Invalid document details. Please check the entered number.");
      return;
    }

    setSubmitting(true);
    setStep("processing");

    // Enterprise pipeline animation stages
    setProcessStage(1);
    await new Promise((r) => setTimeout(r, 650));

    setProcessStage(2);
    await new Promise((r) => setTimeout(r, 750));

    setProcessStage(3);
    await new Promise((r) => setTimeout(r, 700));

    const generatedAppId = `OD-VER-${new Date().getFullYear()}-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    const originalVerifiedCategory =
      userProfile.verifiedCategory ||
      (userProfile.verified ? userProfile.category : undefined);

    const updatedProfilePayload: Partial<UserProfile> = {
      // Keep verified true and existing verifiedCategory intact so public badge remains active during review
      verified: Boolean(userProfile.verified),
      verifiedCategory: originalVerifiedCategory,
      verificationStatus: "pending",
      verificationSubmittedAt: new Date().toISOString(),
      verificationSubmittedCategory: activeCategory,
      verificationSubmittedDocs: attachedDocFileName,
      verificationDocNumber: attachedDocNumber,
      verificationDocType: attachedDocType,
      verificationApplicationId: generatedAppId,
      verificationDocUrl: attachedDocPreview || undefined,
      category: activeCategory,
    };

    if (activeCategory === "citizen") {
      updatedProfilePayload.fullName = citizenLegalName.trim() || userProfile.fullName;
      updatedProfilePayload.citizenDetails = {
        occupation: userProfile.citizenDetails?.occupation || "Citizen Contributor",
        voterConstituency: userProfile.location || "All India",
      };
    } else if (activeCategory === "business") {
      updatedProfilePayload.businessDetails = {
        companyName: companyLegalName.trim() || userProfile.fullName,
        industry: userProfile.businessDetails?.industry || "Enterprise & Civic Services",
        gstinOrPan: businessTaxId.trim().toUpperCase(),
        contactEmail: businessOfficialEmail.trim(),
        officialWebsite: userProfile.websiteUrl,
        verifiedCompany: false,
      };
    } else if (activeCategory === "department") {
      updatedProfilePayload.departmentDetails = {
        name: deptOfficeName.trim() || "Government Department Office",
        governmentLevel: deptGovLevel,
        designation: `${deptGovLevel} Authority`,
        officialBadge: "Govt Department (Pending Verification)",
        departmentCode: deptOfficerCode.trim().toUpperCase() || "GOV-OFFICIAL",
        jurisdictionRegion: userProfile.location || "All India",
      };
    } else if (activeCategory === "representative") {
      updatedProfilePayload.representativeDetails = {
        position: repDesignation.trim() || "Public Representative",
        party: repParty.trim() || "Independent",
        constituency: repConstituency.trim() || "Electoral Constituency",
        termYears: "2024-2029",
      };
    }

    try {
      await onSave(updatedProfilePayload);
      setStep("under_review");
    } catch (err) {
      console.error("Verification error:", err);
      setValidationError("Verification submission encountered a network issue. Please try again.");
      setStep("form");
    } finally {
      setSubmitting(false);
    }
  };

  // Withdraw / Cancel application and reset state
  const handleCancelApplication = async () => {
    setShowCancelModal(false);
    setSubmitting(true);
    try {
      const originalVerifiedCategory =
        userProfile.verifiedCategory ||
        (userProfile.verified ? userProfile.category : undefined);

      await onSave({
        verificationStatus: userProfile.verified ? "approved" : "none",
        verificationSubmittedAt: undefined,
        verificationSubmittedCategory: undefined,
        verificationSubmittedDocs: undefined,
        verificationDocNumber: undefined,
        verificationDocType: undefined,
        verificationApplicationId: undefined,
        verificationDocUrl: undefined,
        verified: Boolean(userProfile.verified),
        verifiedCategory: originalVerifiedCategory,
      });
      setStep("form");
    } catch (err) {
      console.error("Cancel verification error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto pb-24 md:pb-12 animate-fadeIn bg-white border-x border-slate-200 min-h-screen">
      {/* 1. Dedicated Header Bar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            title="Back to Profile"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate leading-tight">
              {step === "under_review" ? "Application Status" : "Identity Verification"}
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Open Desh Sovereign Registry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 shrink-0 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
          <CategoryVerifiedTick category={activeCategory} size="xs" />
          <span className="font-extrabold text-slate-900 capitalize">
            {currentBadgeConfig.categoryTitle}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: VERIFICATION FORM (Only visible when status is NOT pending) */}
      {/* ========================================================================= */}
      {step === "form" && (
        <div className="divide-y divide-slate-100 animate-fadeIn">
          {/* Header Overview Card */}
          <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-50 to-white flex items-start gap-3.5 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
              <CategoryVerifiedTick category={activeCategory} size="md" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-slate-900">
                  {currentBadgeConfig.label} Verification
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  {currentBadgeConfig.themeName}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                Submit authentic government or organizational credentials to authenticate your official civic badge on Open Desh.
              </p>
            </div>
          </div>

          {/* Validation Error Alert Banner */}
          {validationError && (
            <div className="p-3.5 mx-4 sm:mx-5 my-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{validationError}</div>
              <button
                type="button"
                onClick={() => setValidationError(null)}
                className="text-red-500 hover:text-red-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Verification Form */}
          <form onSubmit={handleVerifySubmit} className="p-4 sm:p-5 space-y-5">
            {/* 1. CITIZEN FORM (🔵 Blue Tick) */}
            {activeCategory === "citizen" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Identity Document Type</span>
                    <span className="text-[10px] text-blue-600 font-semibold">UIDAI / ECI / Govt Approved</span>
                  </label>
                  <div className="border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/40 focus-within:bg-white focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all">
                    <select
                      value={citizenIdType}
                      onChange={(e) => {
                        setCitizenIdType(e.target.value as any);
                        setCitizenIdNumber("");
                        setValidationError(null);
                      }}
                      className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
                    >
                      <option value="Aadhaar Card">Aadhaar Card (UIDAI 12-Digit)</option>
                      <option value="Voter ID Card">Voter ID Card (Election Commission EPIC)</option>
                      <option value="PAN Card">Permanent Account Number (PAN Card)</option>
                      <option value="Indian Passport">Indian Passport (Ministry of External Affairs)</option>
                      <option value="Driving Licence">State Driving Licence (MoRTH / Sarathi)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>{citizenIdType} Number</span>
                    {citizenIdNumber && (
                      <span
                        className={`text-[10px] font-bold flex items-center gap-1 ${
                          validateDocumentNumber().isValid ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {validateDocumentNumber().isValid ? (
                          <>
                            <Check className="w-3 h-3" /> Valid Format
                          </>
                        ) : (
                          "Check Format"
                        )}
                      </span>
                    )}
                  </label>
                  <div className="border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/40 focus-within:bg-white focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all">
                    <input
                      type="text"
                      required
                      value={citizenIdNumber}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (citizenIdType === "Aadhaar Card") {
                          // Allow digits only and format with spaces every 4 digits
                          const digits = val.replace(/\D/g, "").slice(0, 12);
                          val = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
                        } else if (citizenIdType === "PAN Card") {
                          val = val.toUpperCase().slice(0, 10);
                        } else {
                          val = val.toUpperCase();
                        }
                        setCitizenIdNumber(val);
                        setValidationError(null);
                      }}
                      placeholder={
                        citizenIdType === "Aadhaar Card"
                          ? "e.g. 5489 1234 5678"
                          : citizenIdType === "PAN Card"
                          ? "e.g. ABCDE1234F"
                          : citizenIdType === "Voter ID Card"
                          ? "e.g. ABC1234567"
                          : citizenIdType === "Indian Passport"
                          ? "e.g. M1234567"
                          : "e.g. DL-1420110012345"
                      }
                      className="w-full text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 uppercase font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {citizenIdType === "Aadhaar Card" && "Enter 12 digits UIDAI Aadhaar number."}
                    {citizenIdType === "Voter ID Card" && "Enter 10-character EPIC voter ID number."}
                    {citizenIdType === "PAN Card" && "Enter 10-character alphanumeric PAN."}
                    {citizenIdType === "Indian Passport" && "Enter 8-character Passport number (1 letter + 7 digits)."}
                    {citizenIdType === "Driving Licence" && "Enter state driving licence registration code."}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Legal Full Name (Matching Official ID)
                  </label>
                  <div className="border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/40 focus-within:bg-white focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all">
                    <input
                      type="text"
                      required
                      value={citizenLegalName}
                      onChange={(e) => setCitizenLegalName(e.target.value)}
                      placeholder="e.g. Ankit Kumar"
                      className="w-full text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Cloudflare R2 Document Upload Zone */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Upload Government ID Proof (Photo or PDF)</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Cloudflare R2 Bucket Encrypted</span>
                  </label>

                  {!citizenDocFileName ? (
                    <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50/60 transition-all group">
                      <input
                        id="citizen-doc-upload-file"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "citizen")}
                      />
                      <label
                        htmlFor="citizen-doc-upload-file"
                        className="cursor-pointer flex flex-col items-center justify-center space-y-2.5"
                      >
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                          {isUploadingToR2 ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs sm:text-sm font-black text-slate-800 block">
                            {isUploadingToR2
                              ? `Uploading to Cloudflare R2 (${uploadProgress}%)...`
                              : "Click to upload ID proof or drag & drop"}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium block">
                            Supported: JPG, PNG, WEBP, or PDF (Max 10MB)
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                          <Lock className="w-3 h-3" /> End-to-End AES-256 GCM Storage
                        </span>
                      </label>
                    </div>
                  ) : (
                    /* Uploaded Document Card */
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {citizenDocPreview && citizenDocPreview.startsWith("data:image") ? (
                          <img
                            src={citizenDocPreview}
                            alt="ID Preview"
                            className="w-10 h-10 object-cover rounded-lg border border-blue-300 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-blue-200 text-blue-800 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {citizenDocFileName}
                            </p>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            {citizenDocFileSize || "Verified File"} • Cloudflare R2 Upload Complete
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveUploadedDoc("citizen")}
                        className="w-8 h-8 rounded-full hover:bg-blue-100 flex items-center justify-center text-slate-500 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                        title="Remove Document"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. BUSINESS FORM (🟡 Yellow Tick) */}
            {activeCategory === "business" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Company / Enterprise Registered Name
                  </label>
                  <div className="border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/40 focus-within:bg-white focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all">
                    <input
                      type="text"
                      required
                      value={companyLegalName}
                      onChange={(e) => setCompanyLegalName(e.target.value)}
                      placeholder="e.g. OmSan Tech Innovations Pvt Ltd"
                      className="w-full text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Entity Legal Structure
                    </label>
                    <div className="border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/40 focus-within:bg-white focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all">
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
                      >
                        <option value="Private Limited">Private Limited (Pvt Ltd)</option>
                        <option value="Public Limited">Public Limited (Ltd)</option>
                        <option value="Limited Liability Partnership">LLP (Partnership)</option>
                        <option value="MSME Registered">Registered MSME / Udyam</option>
                        <option value="Sole Proprietorship">Sole Proprietorship</option>
                        <option value="Non-Profit / Section 8">Section 8 / NGO / Trust</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Tax / Registration Document Type
                    </label>
                    <div className="border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/40 focus-within:bg-white focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all">
                      <select
                        value={businessDocType}
                        onChange={(e) => {
                          setBusinessDocType(e.target.value as any);
                          setBusinessTaxId("");
                          setValidationError(null);
                        }}
                        className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
                      >
                        <option value="GSTIN Certificate">GSTIN Certificate (15 Chars)</option>
                        <option value="Corporate CIN">Corporate CIN (21 Chars)</option>
                        <option value="Udyam / MSME Registration">Udyam Registration No.</option>
                        <option value="Company PAN">Corporate PAN Card</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>{businessDocType} Number</span>
                    {businessTaxId && (
                      <span
                        className={`text-[10px] font-bold flex items-center gap-1 ${
                          validateDocumentNumber().isValid ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {validateDocumentNumber().isValid ? (
                          <>
                            <Check className="w-3 h-3" /> Valid Format
                          </>
                        ) : (
                          "Check Format"
                        )}
                      </span>
                    )}
                  </label>
                  <div className="border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/40 focus-within:bg-white focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all">
                    <input
                      type="text"
                      required
                      value={businessTaxId}
                      onChange={(e) => {
                        setBusinessTaxId(e.target.value.toUpperCase());
                        setValidationError(null);
                      }}
                      placeholder={
                        businessDocType === "GSTIN Certificate"
                          ? "e.g. 20AAACI1234F1Z5"
                          : businessDocType === "Corporate CIN"
                          ? "e.g. U74999DL2018PTC123456"
                          : "e.g. UDYAM-JH-00-1234567"
                      }
                      className="w-full text-xs font-semibold text-slate-900 outline-none uppercase font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {businessDocType === "GSTIN Certificate" && "15-character official Goods and Services Tax number."}
                    {businessDocType === "Corporate CIN" && "21-character MCA corporate identification number."}
                    {businessDocType === "Udyam / MSME Registration" && "Ministry of MSME official registration certificate ID."}
                    {businessDocType === "Company PAN" && "10-character corporate income tax PAN."}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Corporate Official Email Address
                  </label>
                  <div className="border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/40 focus-within:bg-white focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all">
                    <input
                      type="email"
                      required
                      value={businessOfficialEmail}
                      onChange={(e) => setBusinessOfficialEmail(e.target.value)}
                      placeholder="compliance@yourcompany.com"
                      className="w-full text-xs font-semibold text-slate-900 outline-none"
                    />
                  </div>
                </div>

                {/* Cloudflare R2 Upload for Business */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Upload GST / CIN Certificate PDF or Image</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Cloudflare R2 Bucket</span>
                  </label>

                  {!businessDocFileName ? (
                    <div className="border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-2xl p-6 text-center bg-amber-50/30 transition-all group">
                      <input
                        id="business-doc-upload-file"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "business")}
                      />
                      <label
                        htmlFor="business-doc-upload-file"
                        className="cursor-pointer flex flex-col items-center justify-center space-y-2.5"
                      >
                        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                          {isUploadingToR2 ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                          ) : (
                            <Building2 className="w-5 h-5" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs sm:text-sm font-black text-slate-800 block">
                            {isUploadingToR2
                              ? `Uploading to Cloudflare R2 (${uploadProgress}%)...`
                              : "Upload GST Registration or Incorporation Proof"}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium block">
                            PDF, PNG, or JPG up to 10MB
                          </span>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {businessDocPreview && businessDocPreview.startsWith("data:image") ? (
                          <img
                            src={businessDocPreview}
                            alt="Business Doc Preview"
                            className="w-10 h-10 object-cover rounded-lg border border-amber-300 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                            <FileCheck className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {businessDocFileName}
                            </p>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            {businessDocFileSize || "Verified File"} • Cloudflare R2 Upload Complete
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveUploadedDoc("business")}
                        className="w-8 h-8 rounded-full hover:bg-amber-100 flex items-center justify-center text-slate-500 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. DEPARTMENT FORM (🟤 Brown Tick) */}
            {activeCategory === "department" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Government Department / Ministry Name
                  </label>
                  <div className="border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/40 focus-within:bg-white focus-within:border-[#78350f] focus-within:ring-1 focus-within:ring-[#78350f] transition-all">
                    <input
                      type="text"
                      required
                      value={deptOfficeName}
                      onChange={(e) => setDeptOfficeName(e.target.value)}
                      placeholder="e.g. Ranchi Municipal Corporation (RMC)"
                      className="w-full text-xs font-semibold text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Government Administrative Level
                  </label>
                  <div className="border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/40 focus-within:bg-white focus-within:border-[#78350f] focus-within:ring-1 focus-within:ring-[#78350f] transition-all">
                    <select
                      value={deptGovLevel}
                      onChange={(e) => setDeptGovLevel(e.target.value)}
                      className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
                    >
                      <option value="Central Government">Central Government Ministry</option>
                      <option value="State Government">State Government Department</option>
                      <option value="Local Body / Municipal">Municipal Corporation / Nagar Nigam</option>
                      <option value="Police & Law Enforcement">Police & Law Enforcement Cadre</option>
                      <option value="Autonomous Body / Public Sector">PSU / Autonomous Statutory Body</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Official Institutional Email (.gov.in / .nic.in)</span>
                    <span className="text-[10px] text-[#78350f] font-bold">Mandatory Official Domain</span>
                  </label>
                  <div className="border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/40 focus-within:bg-white focus-within:border-[#78350f] focus-within:ring-1 focus-within:ring-[#78350f] transition-all">
                    <input
                      type="email"
                      required
                      value={deptOfficialEmail}
                      onChange={(e) => {
                        setDeptOfficialEmail(e.target.value);
                        setValidationError(null);
                      }}
                      placeholder="nodal.officer@jharkhand.gov.in"
                      className="w-full text-xs font-semibold text-slate-900 outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Official sovereign verification mandates authentic gov domains (e.g. .gov.in, .nic.in).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Designated Nodal Officer / Cadre Employee Code
                  </label>
                  <div className="border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/40 focus-within:bg-white focus-within:border-[#78350f] focus-within:ring-1 focus-within:ring-[#78350f] transition-all">
                    <input
                      type="text"
                      required
                      value={deptOfficerCode}
                      onChange={(e) => setDeptOfficerCode(e.target.value.toUpperCase())}
                      placeholder="e.g. GOV-JH-8839"
                      className="w-full text-xs font-semibold text-slate-900 outline-none uppercase font-mono"
                    />
                  </div>
                </div>

                {/* Cloudflare R2 Upload for Department */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Upload Department Order / Gazette Authorization Document
                  </label>

                  {!deptDocFileName ? (
                    <div className="border-2 border-dashed border-[#78350f]/30 hover:border-[#78350f] rounded-2xl p-6 text-center bg-[#fdf8f4] transition-all group">
                      <input
                        id="dept-doc-upload-file"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "department")}
                      />
                      <label
                        htmlFor="dept-doc-upload-file"
                        className="cursor-pointer flex flex-col items-center justify-center space-y-2.5"
                      >
                        <div className="w-12 h-12 rounded-full bg-amber-100 text-[#78350f] flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                          {isUploadingToR2 ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                          ) : (
                            <FileCheck className="w-5 h-5" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs sm:text-sm font-black text-slate-800 block">
                            {isUploadingToR2
                              ? `Uploading to Cloudflare R2 (${uploadProgress}%)...`
                              : "Upload Official Gazetted Department Order"}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium block">
                            Signed official letterhead or Gazette PDF (Max 10MB)
                          </span>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-amber-50/80 border border-[#78350f]/20 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {deptDocPreview && deptDocPreview.startsWith("data:image") ? (
                          <img
                            src={deptDocPreview}
                            alt="Dept Doc Preview"
                            className="w-10 h-10 object-cover rounded-lg border border-[#78350f]/30 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-amber-200 text-[#78350f] flex items-center justify-center shrink-0">
                            <FileCheck className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#78350f] shrink-0" />
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {deptDocFileName}
                            </p>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            {deptDocFileSize || "Verified File"} • Cloudflare R2 Upload Complete
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveUploadedDoc("department")}
                        className="w-8 h-8 rounded-full hover:bg-amber-100 flex items-center justify-center text-slate-500 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. REPRESENTATIVE FORM (🟢 Green Tick) */}
            {activeCategory === "representative" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Public Elected Office / Designation
                  </label>
                  <div className="border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/40 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 transition-all">
                    <input
                      type="text"
                      required
                      value={repDesignation}
                      onChange={(e) => setRepDesignation(e.target.value)}
                      placeholder="e.g. Member of Legislative Assembly (MLA) / MP / Mayor"
                      className="w-full text-xs font-semibold text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Political Party Affiliation
                    </label>
                    <div className="border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/40 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 transition-all">
                      <input
                        type="text"
                        required
                        value={repParty}
                        onChange={(e) => setRepParty(e.target.value)}
                        placeholder="e.g. BJP / INC / JMM / Independent"
                        className="w-full text-xs font-semibold text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Constituency / Ward
                    </label>
                    <div className="border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/40 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 transition-all">
                      <input
                        type="text"
                        required
                        value={repConstituency}
                        onChange={(e) => setRepConstituency(e.target.value)}
                        placeholder="e.g. Ranchi East"
                        className="w-full text-xs font-semibold text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Election Commission of India (ECI) Certificate / Reference ID</span>
                  </label>
                  <div className="border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/40 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 transition-all">
                    <input
                      type="text"
                      required
                      value={repEciNumber}
                      onChange={(e) => setRepEciNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. ECI-RO-2024-9921"
                      className="w-full text-xs font-semibold text-slate-900 outline-none uppercase font-mono"
                    />
                  </div>
                </div>

                {/* Cloudflare R2 Upload for Representative */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Upload Election Certificate / Gazette Notification Document
                  </label>

                  {!repDocFileName ? (
                    <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl p-6 text-center bg-emerald-50/40 transition-all group">
                      <input
                        id="rep-doc-upload-file"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "representative")}
                      />
                      <label
                        htmlFor="rep-doc-upload-file"
                        className="cursor-pointer flex flex-col items-center justify-center space-y-2.5"
                      >
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                          {isUploadingToR2 ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                          ) : (
                            <BadgeCheck className="w-5 h-5" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs sm:text-sm font-black text-slate-800 block">
                            {isUploadingToR2
                              ? `Uploading to Cloudflare R2 (${uploadProgress}%)...`
                              : "Upload Official Election Certificate"}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium block">
                            PDF, PNG, or JPG up to 10MB
                          </span>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {repDocPreview && repDocPreview.startsWith("data:image") ? (
                          <img
                            src={repDocPreview}
                            alt="Representative Doc Preview"
                            className="w-10 h-10 object-cover rounded-lg border border-emerald-300 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                            <BadgeCheck className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {repDocFileName}
                            </p>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            {repDocFileSize || "Verified File"} • Cloudflare R2 Upload Complete
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveUploadedDoc("representative")}
                        className="w-8 h-8 rounded-full hover:bg-emerald-100 flex items-center justify-center text-slate-500 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DPDP Compliance & Privacy Info */}
            <div className="p-3.5 bg-slate-50 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-500 border border-slate-100">
              <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5 leading-relaxed">
                <span className="font-bold text-slate-700 block">
                  Digital Personal Data Protection (DPDP) Act Compliance:
                </span>
                <span>
                  All submitted identity documents are encrypted via AES-256 GCM in secured Cloudflare R2 storage. Documents are utilized strictly for identity authentication by administrative auditors and never exposed to the public.
                </span>
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || isUploadingToR2}
                className={`w-full py-3.5 rounded-full text-white font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed ${
                  activeCategory === "citizen"
                    ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
                    : activeCategory === "business"
                    ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                    : activeCategory === "department"
                    ? "bg-[#78350f] hover:bg-[#582707] shadow-[#78350f]/20"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                }`}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Transmitting Application...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Submit Application for Administrative Verification</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: PROCESSING ANIMATION */}
      {/* ========================================================================= */}
      {step === "processing" && (
        <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 animate-fadeIn">
          <div className="relative">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center animate-pulse ${currentBadgeConfig.bgColor} border-4 ${currentBadgeConfig.borderColor}`}
            >
              <Clock className="w-10 h-10 text-amber-600 stroke-[2.5]" />
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin border-blue-600" />
          </div>

          <div className="space-y-2.5 max-w-md">
            <h3 className="text-lg font-black text-slate-900">
              Encrypting & Submitting Application...
            </h3>
            <div className="space-y-2 text-xs text-slate-600">
              <p
                className={`flex items-center justify-center gap-2 font-bold ${
                  processStage >= 1 ? "text-blue-600" : "text-slate-400"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Storing document proof in Cloudflare R2 bucket</span>
              </p>
              <p
                className={`flex items-center justify-center gap-2 font-bold ${
                  processStage >= 2 ? "text-blue-600" : "text-slate-400"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Validating document syntax & checksum registry</span>
              </p>
              <p
                className={`flex items-center justify-center gap-2 font-bold ${
                  processStage >= 3 ? "text-amber-600" : "text-slate-400"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Assigning official review token & enqueuing audit SLA</span>
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
      {/* STEP 3 / UNDER REVIEW VIEW (PERSISTENT TRACKING PORTAL) */}
      {/* ========================================================================= */}
      {step === "under_review" && (
        <div className="p-4 sm:p-6 space-y-6 animate-fadeIn">
          {/* Executive Review Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border border-amber-200/80 text-center space-y-4 shadow-2xs">
            <div className="relative inline-block mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center shadow-xs">
                <Clock className="w-8 h-8 text-amber-700 animate-pulse stroke-[2.5]" />
              </div>
              <span className="absolute -top-1 -right-1 text-sm bg-white rounded-full p-0.5 shadow-xs">
                ⏳
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Application Under Active Review</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Document Verification in Progress
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Your verification documents have been securely uploaded to Cloudflare R2 storage and submitted to the Open Desh administrative audit queue.
              </p>
            </div>
          </div>

          {/* Application Tracking Summary Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Application Reference ID
                </span>
              </div>
              <span className="text-xs font-mono font-black text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                {userProfile.verificationApplicationId || `OD-VER-${new Date().getFullYear()}-8829F1`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Applied Category
                </span>
                <div className="flex items-center gap-1.5 font-black text-slate-900">
                  <CategoryVerifiedTick category={userProfile.verificationSubmittedCategory || activeCategory} size="xs" />
                  <span className="capitalize">
                    {getCategoryBadgeConfig(userProfile.verificationSubmittedCategory || activeCategory).categoryTitle} ({getCategoryBadgeConfig(userProfile.verificationSubmittedCategory || activeCategory).themeName})
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Submission Date & SLA
                </span>
                <div className="flex items-center gap-1.5 font-black text-slate-900">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {userProfile.verificationSubmittedAt
                      ? new Date(userProfile.verificationSubmittedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Today"} • 24–48 Hrs SLA
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Submitted Document Type
                </span>
                <span className="font-bold text-slate-800">
                  {userProfile.verificationDocType || "Government Identity Proof"}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Document ID Number
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {userProfile.verificationDocNumber
                    ? maskDocumentId(userProfile.verificationDocNumber)
                    : "•••• •••• 4589"}
                </span>
              </div>
            </div>

            {/* Document File Card with Cloudflare R2 Proof */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">
                    {userProfile.verificationSubmittedDocs || "Identity_Document_Proof.pdf"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Storage: Cloudflare R2 Bucket (AES-256 Encrypted)
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                Uploaded
              </span>
            </div>
          </div>

          {/* 4-Stage Live Audit Timeline */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-3.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Administrative Verification Timeline
            </h3>

            <div className="space-y-3 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {/* Stage 1: Received */}
              <div className="relative flex items-start gap-3">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    Application Received & R2 Storage Encrypted
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Your verification record and media payload have been safely sealed in our database.
                  </p>
                </div>
              </div>

              {/* Stage 2: Format Validated */}
              <div className="relative flex items-start gap-3">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    Automated Syntax & Checksum Validation
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Document structure and identity parameters passed automated anti-spoofing checks.
                  </p>
                </div>
              </div>

              {/* Stage 3: Active Officer Review */}
              <div className="relative flex items-start gap-3">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center animate-pulse shadow-xs">
                  <span className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-900 leading-tight flex items-center gap-1.5">
                    <span>Officer Manual Verification & Cross-Match</span>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                      In Progress
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Open Desh Administrative Compliance Officers are reviewing the document against official gazettes/registers.
                  </p>
                </div>
              </div>

              {/* Stage 4: Badge Activation */}
              <div className="relative flex items-start gap-3 opacity-60">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-slate-300 text-slate-500 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 leading-tight">
                    Official Badge Issuance & Public Registry Activation
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Your profile will receive the official verified tick and badge across feed and search.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-3 rounded-full bg-slate-900 hover:bg-black text-white font-black text-sm shadow-sm transition-all cursor-pointer"
            >
              Return to Profile
            </button>

            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="w-full py-2.5 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer"
            >
              Withdraw Application & Resubmit New Documents
            </button>
          </div>

          {/* Cancel/Withdraw Confirmation Modal */}
          {showCancelModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl animate-scaleUp">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="text-center space-y-1">
                  <h4 className="text-base font-black text-slate-900">
                    Withdraw Verification Application?
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Withdrawing will remove your application from the administrative review queue and allow you to upload fresh documents.
                  </p>
                </div>
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 py-2.5 rounded-full border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Keep Under Review
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelApplication}
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-sm cursor-pointer"
                  >
                    {submitting ? "Cancelling..." : "Yes, Withdraw"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
