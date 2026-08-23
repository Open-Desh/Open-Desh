import React, { useState } from "react";
import {
  Clock,
  ShieldCheck,
  Building,
  Zap,
  Droplets,
  FileText,
  HeartHandshake,
  ChevronRight,
  ChevronDown,
  Phone,
  ArrowRight,
  Sparkles,
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
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);

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
            description: "Direct service delivery, escalation management, and SLA tracking under statutory public charters.",
            sla: "24-48 Hours",
            citizenEntitlement: "Time-bound public response under Right to Service Charter.",
            nodalContact: "Official Citizen Support Desk",
            status: "Active" as const,
          },
        ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Civic Infrastructure":
        return <Building className="w-3.5 h-3.5 text-blue-600" />;
      case "Sanitation & Waste":
        return <Droplets className="w-3.5 h-3.5 text-emerald-600" />;
      case "Water & Utilities":
        return <Zap className="w-3.5 h-3.5 text-amber-600" />;
      case "Legislative Help":
        return <FileText className="w-3.5 h-3.5 text-purple-600" />;
      case "Welfare & Funds":
        return <HeartHandshake className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />;
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedServiceId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="divide-y divide-slate-100 animate-fadeIn">
      {currentServices.map((service) => {
        const isExpanded = expandedServiceId === service.id;
        return (
          <div
            key={service.id}
            id={`service-item-${service.id}`}
            onClick={() => toggleExpand(service.id)}
            className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors cursor-pointer space-y-2.5"
          >
            {/* Top Bar: Category & SLA */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                {getCategoryIcon(service.category)}
                <span>{service.category}</span>
              </div>
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                  service.status === "Active"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                    : service.status === "High Demand"
                    ? "bg-amber-50 text-amber-700 border border-amber-200/80"
                    : "bg-blue-50 text-blue-700 border border-blue-200/80"
                }`}
              >
                {service.sla}
              </span>
            </div>

            {/* Title */}
            <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
              {service.title}
            </h4>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
              {service.description}
            </p>

            {/* Statutory Details / Citizen Entitlement */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">
                  {service.citizenEntitlement || "Right to Service Charter Entitlement"}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {service.nodalContact && (
                  <span className="text-[11px] text-slate-400 font-semibold truncate hidden sm:inline">
                    Desk: {service.nodalContact}
                  </span>
                )}
                <span className="text-xs font-bold text-blue-600 flex items-center gap-0.5 group-hover:underline">
                  {isExpanded ? (
                    <>
                      <span>Less</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Expanded Detailed Specifications */}
            {isExpanded && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="mt-3 pt-3 border-t border-slate-100 space-y-3 animate-fadeIn text-xs"
              >
                {/* Entitlement Box */}
                {service.citizenEntitlement && (
                  <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1">
                    <span className="text-[10px] font-black uppercase text-blue-800 tracking-wide block">
                      Citizen Statutory Entitlement (Right to Public Service)
                    </span>
                    <p className="text-blue-950 font-medium leading-relaxed">
                      {service.citizenEntitlement}
                    </p>
                  </div>
                )}

                {/* Grid for SLA & Nodal Escalation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                      Statutory SLA
                    </span>
                    <span className="font-extrabold text-emerald-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      {service.sla}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                      Nodal Escalation Desk
                    </span>
                    <span className="font-bold text-slate-800 truncate block">
                      {service.nodalContact || "Constituency Civic Support Desk"}
                    </span>
                  </div>
                </div>

                {/* Request / Grievance Action */}
                {onOpenServiceRequest && (
                  <button
                    onClick={() => onOpenServiceRequest(service)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <span>Request This Service / File Related Grievance</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {currentServices.length === 0 && (
        <div className="py-12 text-center text-xs text-slate-400 font-medium">
          No civic services listed for this profile yet.
        </div>
      )}
    </div>
  );
};
