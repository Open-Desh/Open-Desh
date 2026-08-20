import React, { useState } from "react";
import {
  Network,
  Clock,
  ShieldCheck,
  Phone,
  ArrowRight,
  Sparkles,
  Layers,
  CheckCircle,
  FileText,
  Building,
  Zap,
  Droplets,
  AlertTriangle,
  HeartHandshake,
  HelpCircle,
  ChevronRight,
  Info,
} from "lucide-react";
import { CivicService, UserProfile } from "../types.ts";
import { getSmartDefaultServices } from "../utils/serviceTemplates.ts";

interface ServicesMindMapProps {
  userProfile: UserProfile;
  services?: CivicService[];
  onOpenServiceRequest?: (service: CivicService) => void;
}

export const ServicesMindMap: React.FC<ServicesMindMapProps> = ({
  userProfile,
  services,
  onOpenServiceRequest,
}) => {
  const [selectedService, setSelectedService] = useState<CivicService | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"mindmap" | "grid">("mindmap");

  // Determine smart contextual default services based on role, designation, and department/business name
  const roleOrName =
    userProfile.category === "representative"
      ? userProfile.representativeDetails?.position || userProfile.fullName
      : userProfile.category === "department"
      ? userProfile.departmentDetails?.name || userProfile.fullName
      : userProfile.businessDetails?.companyName || userProfile.fullName;

  const subCategoryOrLevel =
    userProfile.category === "representative"
      ? userProfile.representativeDetails?.level || ""
      : userProfile.category === "department"
      ? userProfile.departmentDetails?.governmentLevel || ""
      : userProfile.businessDetails?.industry || "";

  const smartServices = getSmartDefaultServices(userProfile.category, roleOrName, subCategoryOrLevel);

  const currentServices =
    services && services.length > 0
      ? services
      : smartServices.length > 0
      ? smartServices
      : [
          {
            id: "srv_fallback_1",
            title: "Citizen Redressal & Direct Service Desk",
            category: "Public Redressal" as const,
            description: "Direct service delivery, escalation management, and SLA tracking.",
            sla: "24-48 Hours",
            citizenEntitlement: "Time-bound public response under Right to Service Charter.",
            nodalContact: "Official Citizen Support Desk",
            status: "Active" as const,
          },
        ];

  const categories = [
    "All",
    "Civic Infrastructure",
    "Sanitation & Waste",
    "Water & Utilities",
    "Legislative Help",
    "Welfare & Funds",
    "Public Redressal",
  ];

  const filteredServices = currentServices.filter(
    (s) => activeCategory === "All" || s.category === activeCategory
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Civic Infrastructure":
        return <Building className="w-4 h-4 text-blue-600" />;
      case "Sanitation & Waste":
        return <Droplets className="w-4 h-4 text-emerald-600" />;
      case "Water & Utilities":
        return <Zap className="w-4 h-4 text-amber-600" />;
      case "Legislative Help":
        return <FileText className="w-4 h-4 text-purple-600" />;
      case "Welfare & Funds":
        return <HeartHandshake className="w-4 h-4 text-rose-600" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="p-4 sm:p-5 space-y-4 animate-fadeIn">
      {/* Mind Map Header & View Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-xl">
              <Network className="w-4 h-4" />
            </span>
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              Civic Services Mind Map & Citizen Entitlements
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Interactive map of municipal mandates, SLAs, and direct citizen rights.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setViewMode("mindmap")}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === "mindmap"
                ? "bg-white text-blue-600 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Mind Map
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === "grid"
                ? "bg-white text-blue-600 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Matrix
          </button>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? "bg-blue-600 text-white shadow-2xs"
                : "bg-slate-100 hover:bg-slate-200/70 text-slate-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Mind Map Interactive Diagram View */}
      {viewMode === "mindmap" && (
        <div className="relative bg-gradient-to-b from-slate-50 to-blue-50/30 border border-slate-200/90 rounded-3xl p-4 sm:p-6 overflow-hidden">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

          {/* Central Authority Hub Node */}
          <div className="relative z-10 flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white border-2 border-blue-600 shadow-lg p-1.5 flex items-center justify-center relative group">
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.fullName}
                className="w-full h-full rounded-2xl object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-2 px-2.5 py-0.5 bg-blue-600 text-white text-[9px] font-black uppercase rounded-full tracking-wider shadow-xs">
                Root Authority
              </span>
            </div>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 mt-3">
              {userProfile.fullName}
            </h4>
            <span className="text-[11px] text-slate-500 font-semibold max-w-xs">
              {userProfile.departmentDetails?.name ||
                userProfile.representativeDetails?.position ||
                "Civic Command Centre"}
            </span>

            {/* Connecting Stem Line */}
            <div className="w-0.5 h-6 bg-blue-300 mt-2"></div>
          </div>

          {/* Branch Nodes Grid with visual connectors */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {filteredServices.map((service, idx) => {
              const isSelected = selectedService?.id === service.id;
              return (
                <div
                  key={service.id}
                  onClick={() => setSelectedService(isSelected ? null : service)}
                  className={`group relative bg-white/95 backdrop-blur-xs border rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected
                      ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40"
                      : "border-slate-200/90 hover:border-blue-300"
                  }`}
                >
                  {/* Branch Tag & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      {getCategoryIcon(service.category)}
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-600">
                        {service.category}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        service.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : service.status === "High Demand"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {service.sla}
                    </span>
                  </div>

                  {/* Service Title */}
                  <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                    {service.title}
                  </h5>

                  {/* Summary */}
                  <p className="text-[11px] text-slate-600 font-normal line-clamp-2 mt-1.5 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Citizen Entitlement Pill */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate max-w-[180px]">Citizen Entitlement</span>
                    </span>
                    <span className="font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Details <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Matrix / Structured View */}
      {viewMode === "grid" && (
        <div className="space-y-3">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              onClick={() => setSelectedService(service)}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-100 rounded-xl">
                    {getCategoryIcon(service.category)}
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs sm:text-sm text-slate-900">
                      {service.title}
                    </h5>
                    <span className="text-[10px] font-bold text-slate-500">
                      {service.category}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full shrink-0">
                  {service.sla}
                </span>
              </div>
              <p className="text-xs text-slate-700">{service.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Selected Service Detail Bottom Card / Modal */}
      {selectedService && (
        <div className="p-4 sm:p-5 bg-white border-2 border-blue-600 rounded-3xl shadow-xl space-y-3 animate-fadeIn">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                {selectedService.category}
              </span>
              <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
                {selectedService.title}
              </h4>
            </div>
            <button
              onClick={() => setSelectedService(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-700 px-2 py-1 bg-slate-100 rounded-full"
            >
              Close
            </button>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-normal">
            {selectedService.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                Statutory Service Level (SLA)
              </span>
              <span className="font-extrabold text-emerald-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                {selectedService.sla}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                Nodal Escalation Desk
              </span>
              <span className="font-bold text-slate-800 truncate block">
                {selectedService.nodalContact || "Constituency Civic Cell"}
              </span>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs space-y-1">
            <span className="text-[10px] font-black uppercase text-blue-800 block">
              Citizen Statutory Entitlement (Right to Public Service)
            </span>
            <p className="text-blue-900 font-medium leading-relaxed">
              {selectedService.citizenEntitlement}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
