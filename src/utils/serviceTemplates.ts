import { CivicService, UserCategory } from "../types.ts";

/**
 * Smart template generator for Services Mind Map & Directory
 * Automatically provides tailored civic/commercial service templates
 * based on category, role designation, department name, or business sector.
 */
export function getSmartDefaultServices(
  category: UserCategory,
  roleOrName: string = "",
  subCategoryOrLevel: string = ""
): CivicService[] {
  const normalizedRole = roleOrName.toLowerCase();
  const normalizedSub = subCategoryOrLevel.toLowerCase();

  // =========================================================================
  // 1. BUSINESS / COMPANY CATEGORY (Commercial & Civic Enterprise Services)
  // =========================================================================
  if (category === "business") {
    if (normalizedSub.includes("infra") || normalizedRole.includes("infra") || normalizedRole.includes("build") || normalizedRole.includes("construct")) {
      return [
        {
          id: "biz_srv_1",
          title: "Civic Road Construction & Asphalt Resurfacing",
          category: "Civic Infrastructure",
          description: "High-grade Bituminous Concrete (BC) & Dense Bituminous Macadam (DBM) road construction conforming to IRC & MoRTH standards.",
          sla: "Contractual SLA Guarantee",
          citizenEntitlement: "5-Year Defect Liability Period (DLP) with zero-cost municipal pothole maintenance warranty.",
          nodalContact: "Corporate Project Office • project@infraenterprise.com",
          status: "Active",
        },
        {
          id: "biz_srv_2",
          title: "Precast Concrete Drainage & Culvert Laying",
          category: "Civic Infrastructure",
          description: "Rapid installation of stormwater precast box culverts and high-capacity storm drain networks for flood mitigation.",
          sla: "Rapid Deployment (7 Days)",
          citizenEntitlement: "Pre-monsoon blockage-free hydraulic guarantee.",
          nodalContact: "Civil Works Desk • +91 800-INFRA-99",
          status: "Active",
        },
        {
          id: "biz_srv_3",
          title: "24x7 Emergency Utility & Heavy Equipment Support",
          category: "Water & Utilities",
          description: "Deployment of JCB excavators, mobile de-watering pumps, and crane lifting for civic breakdowns.",
          sla: "2 Hours Emergency Dispatch",
          citizenEntitlement: "Priority dispatch for municipal flash flood or roadway tree collapses.",
          nodalContact: "Operations Control Center • 1800-419-7700",
          status: "Active",
        },
      ];
    }

    if (normalizedSub.includes("waste") || normalizedSub.includes("sanitat") || normalizedRole.includes("clean") || normalizedRole.includes("green")) {
      return [
        {
          id: "biz_srv_4",
          title: "Door-to-Door Municipal Solid Waste Segregation & Collection",
          category: "Sanitation & Waste",
          description: "Automated GPS-tracked tipper fleet collecting wet, dry, and domestic hazardous waste across residential wards.",
          sla: "Daily Morning 6 AM - 11 AM",
          citizenEntitlement: "Zero-overflow door pickup with real-time route tracking on Open Desh.",
          nodalContact: "Fleet Control Manager • clean@wastegreen.com",
          status: "Active",
        },
        {
          id: "biz_srv_5",
          title: "Bio-Methanation & Organic Compost Processing",
          category: "Sanitation & Waste",
          description: "Conversion of market vegetable waste into clean compressed biogas (CBG) and organic agricultural fertilizer.",
          sla: "Continuous 24-hr Processing",
          citizenEntitlement: "Free community compost distribution for registered ward resident welfare associations.",
          nodalContact: "Green Facility Desk • 080-2983719",
          status: "Active",
        },
      ];
    }

    // Generic Business Default
    return [
      {
        id: "biz_srv_def_1",
        title: "Enterprise Product Delivery & Service Fulfillment",
        category: "Civic Infrastructure",
        description: "Standard commercial service agreements, institutional supplies, and quality-controlled project execution.",
        sla: "48 Hours Support SLA",
        citizenEntitlement: "Consumer Protection Act compliance & transparent billing warranty.",
        nodalContact: "Customer Success Cell • support@company.com",
        status: "Active",
      },
      {
        id: "biz_srv_def_2",
        title: "Warranty, Maintenance & Field Service Support",
        category: "Public Redressal",
        description: "On-site inspection, scheduled preventative maintenance, and rapid spare-part replacement.",
        sla: "24-48 Hours Field Visit",
        citizenEntitlement: "Official SLA tracking with digital job-sheet verification.",
        nodalContact: "Technical Service Desk • 1800-102-8822",
        status: "Active",
      },
      {
        id: "biz_srv_def_3",
        title: "Corporate Social Responsibility (CSR) Civic Programs",
        category: "Welfare & Funds",
        description: "Direct community benefit projects including school solar installations, drinking water RO kiosks, and public parks.",
        sla: "Quarterly Milestone Audits",
        citizenEntitlement: "100% free community access with public utility ledger.",
        nodalContact: "CSR Program Director • csr@company.com",
        status: "Active",
      },
    ];
  }

  // =========================================================================
  // 2. GOVERNMENT DEPARTMENT CATEGORY (Tailored by Municipal / Police / Power / Water / State)
  // =========================================================================
  if (category === "department") {
    // 2a. Municipal Corporation / Local Body / MCD / Nagar Nigam
    if (normalizedRole.includes("mcd") || normalizedRole.includes("municip") || normalizedRole.includes("nigam") || normalizedRole.includes("rmc") || normalizedRole.includes("corporation") || normalizedSub.includes("local")) {
      return [
        {
          id: "dept_mcd_1",
          title: "Pothole Resurfacing & Ward Road Repairs",
          category: "Civic Infrastructure",
          description: "Mechanized cold-mix patch filling and bitumen leveling on all ward municipal roads and interior colony lanes.",
          sla: "24 Hours SLA",
          citizenEntitlement: "Free repair guarantee under Citizens' SLA Charter with photo proof upon closing.",
          nodalContact: "Municipal Works Engineer • 155304",
          status: "Active",
        },
        {
          id: "dept_mcd_2",
          title: "Daily Door-to-Door Garbage Collection & Bin Clearance",
          category: "Sanitation & Waste",
          description: "Primary municipal vehicle collection from households and clearance of secondary community dhalos/dumpsters.",
          sla: "Daily 7:00 AM - 12:00 PM",
          citizenEntitlement: "Clean street entitlement; emergency missed-bin clearance within 4 hours of report.",
          nodalContact: "Chief Sanitation Inspector • Toll-Free 1916",
          status: "Active",
        },
        {
          id: "dept_mcd_3",
          title: "Property Tax Assessment, Mutation & Trade Licensing",
          category: "Public Redressal",
          description: "Online self-assessment, property tax payment receipts, and instant trade renewal certificates.",
          sla: "3 Working Days Fast-Track",
          citizenEntitlement: "Instant digital receipt and zero-harassment online scrutiny under Right to Service Act.",
          nodalContact: "Revenue & Assessment Dept • Room 102, Civic Centre",
          status: "Active",
        },
        {
          id: "dept_mcd_4",
          title: "Mosquito Fogging & Anti-Larval Vector Control",
          category: "Sanitation & Waste",
          description: "Colony-wide thermal smoke fogging and anti-larval chemical spray during Dengue/Malaria transmission season.",
          sla: "24 Hours on Colony Request",
          citizenEntitlement: "Free spray across entire colony block upon 1 resident ticket.",
          nodalContact: "Municipal Health Officer • 011-2322521",
          status: "Active",
        },
      ];
    }

    // 2b. Police & Law Enforcement
    if (normalizedRole.includes("police") || normalizedSub.includes("police") || normalizedRole.includes("traffic") || normalizedRole.includes("security")) {
      return [
        {
          id: "dept_pol_1",
          title: "Emergency 112 Dispatch & Rapid PCR Patrol Response",
          category: "Public Redressal",
          description: "Live GPS-coordinated dispatch of closest Emergency Response Support Vehicle (ERSV) for safety and distress.",
          sla: "Under 8 Minutes Urban / 15 Minutes Rural",
          citizenEntitlement: "Immediate on-scene intervention with recorded audio dispatch log.",
          nodalContact: "Integrated 112 Control Room",
          status: "Active",
        },
        {
          id: "dept_pol_2",
          title: "Online e-FIR & Lost Property Registration",
          category: "Public Redressal",
          description: "Instant filing of digital complaints for stolen mobile phones, lost official IDs, and vehicle thefts.",
          sla: "Instant Digitally Signed Certificate",
          citizenEntitlement: "Court & insurance admissible digitally signed acknowledgement with Zero FIR guarantee.",
          nodalContact: "Cyber & e-Beat Nodal Officer",
          status: "Active",
        },
        {
          id: "dept_pol_3",
          title: "Citizen Verification (Tenant / Servant / Passport)",
          category: "Public Redressal",
          description: "Expedited background and character verification for job applicants, passport renewals, and tenant profiles.",
          sla: "7 Working Days",
          citizenEntitlement: "Online status tracking with transparent clearance certificate.",
          nodalContact: "Special Branch Verification Cell",
          status: "Active",
        },
      ];
    }

    // 2c. Power / Electricity Board (JBVNL, BESCOM, Tata Power, etc.)
    if (normalizedRole.includes("power") || normalizedRole.includes("electr") || normalizedRole.includes("jbvnl") || normalizedRole.includes("grid")) {
      return [
        {
          id: "dept_pwr_1",
          title: "Distribution Transformer (DTR) Breakdown Replacement",
          category: "Water & Utilities",
          description: "Replacement of burnt transformers and high-tension (HT) line fuse breakdown restoration.",
          sla: "24 Hours Urban / 48 Hours Rural",
          citizenEntitlement: "Mandatory replacement under Electricity Regulatory Commission (SERC) standards.",
          nodalContact: "Subdivision Assistant Electrical Engineer • 1912",
          status: "Active",
        },
        {
          id: "dept_pwr_2",
          title: "Rooftop Solar Net-Metering Installation & Grid Sync",
          category: "Water & Utilities",
          description: "Technical feasibility audit, bi-directional smart meter installation, and central subsidy credit.",
          sla: "15 Days End-to-End SLA",
          citizenEntitlement: "PM Surya Ghar subsidy release directly into Aadhaar-linked bank account.",
          nodalContact: "Renewable Energy Cell • solar@powercorp.gov.in",
          status: "Active",
        },
      ];
    }

    // 2d. Water Board / Jal Board / Public Works
    if (normalizedRole.includes("water") || normalizedRole.includes("jal") || normalizedRole.includes("sewer") || normalizedRole.includes("pwd")) {
      return [
        {
          id: "dept_wat_1",
          title: "Emergency Potable Water Tanker Deployment",
          category: "Water & Utilities",
          description: "Free emergency drinking water tanker delivery in wards with burst pipeline or severe underground depletion.",
          sla: "4 Hours from Request",
          citizenEntitlement: "Zero-cost municipal emergency quota for affected residential societies.",
          nodalContact: "Jal Board Emergency Cell • 1916 / 011-23525555",
          status: "Active",
        },
        {
          id: "dept_wat_2",
          title: "Underground Sewer Jetting & Heavy Suction Clearance",
          category: "Sanitation & Waste",
          description: "High-pressure super sucker machine de-silting for choked trunk sewer mains and manholes.",
          sla: "24 Hours SLA",
          citizenEntitlement: "Machine-based sewer desilting with strict ban on manual scavenging.",
          nodalContact: "Drainage Division Executive Engineer",
          status: "Active",
        },
      ];
    }

    // Generic Department Default
    return [
      {
        id: "dept_gen_1",
        title: "Statutory Citizen Service Charter Delivery",
        category: "Public Redressal",
        description: "Official administrative assistance, public hearings (Janata Darbar), and RTI Act compliance.",
        sla: "As per Citizens' Charter (3-7 Days)",
        citizenEntitlement: "Guaranteed time-bound disposal under Right to Public Service Legislation.",
        nodalContact: "Nodal Officer / Grievance Redressal Cell",
        status: "Active",
      },
      {
        id: "dept_gen_2",
        title: "Public Grievance Escalation & CPGRAMS Resolution",
        category: "Public Redressal",
        description: "Direct monitoring of escalated public petitions with designated departmental tracking numbers.",
        sla: "48 Hours Action Taken Report (ATR)",
        citizenEntitlement: "Mandatory written ATR signed by designated Competent Authority.",
        nodalContact: "Directorate Secretariat Desk",
        status: "Active",
      },
    ];
  }

  // =========================================================================
  // 3. REPRESENTATIVE CATEGORY (PM, CM, Cabinet Minister, MP, MLA, Mayor, etc.)
  // =========================================================================
  if (category === "representative") {
    // 3a. Prime Minister / Union Cabinet Minister / MP (National Level)
    if (normalizedRole === "pm" || normalizedRole.includes("prime") || normalizedRole.includes("cabinet") || normalizedRole === "mp" || normalizedSub.includes("national")) {
      return [
        {
          id: "rep_pm_1",
          title: "PMNRF / Ayushman Bharat Emergency Medical Aid Sanction",
          category: "Welfare & Funds",
          description: "Direct fast-track financial assistance for critical cardiac, oncology, and transplant treatments via PM National Relief Fund.",
          sla: "24 Hours Fast-Track Approval",
          citizenEntitlement: "Full entitlement for BPL / Ayushman non-covered emergency surgeries.",
          nodalContact: "PMO / Parliamentary Welfare Cell • welfare@sansad.nic.in",
          status: "Active",
        },
        {
          id: "rep_pm_2",
          title: "Central Infrastructure & Highway Modernization Push",
          category: "Civic Infrastructure",
          description: "Direct intervention in National Highway corridors, railway station revamps (Amrit Bharat), and airport connectivity.",
          sla: "Quarterly Milestone Review",
          citizenEntitlement: "Public domain progress dashboard with satellite geo-tracking on Open Desh.",
          nodalContact: "Union Project Monitoring Unit (PMU)",
          status: "Active",
        },
        {
          id: "rep_pm_3",
          title: "Sansad Adarsh Gram Yojana & MPLAD Fund Sanctions",
          category: "Welfare & Funds",
          description: "Sanctioning of community solar grids, digital smart classrooms, and rural drinking piped water.",
          sla: "100% Open Expenditure Audit",
          citizenEntitlement: "Constituency open audit ledger with CAG certification.",
          nodalContact: "District Planning Officer / MPLADS Cell",
          status: "Active",
        },
        {
          id: "rep_pm_4",
          title: "National Policy Public Consultation & Petitions",
          category: "Legislative Help",
          description: "Direct citizen submissions of legislative bills, law amendments, and budget recommendation memoranda.",
          sla: "Formal Parliamentary Hansard Filing",
          citizenEntitlement: "Right to table vetted citizen petitions in Lok Sabha / Rajya Sabha Committee.",
          nodalContact: "Parliamentary Research Desk",
          status: "Active",
        },
      ];
    }

    // 3b. Chief Minister (CM) / State Minister
    if (normalizedRole === "cm" || normalizedRole.includes("chief") || normalizedRole.includes("state minister")) {
      return [
        {
          id: "rep_cm_1",
          title: "CM Relief Fund & Critical Healthcare Assistance",
          category: "Welfare & Funds",
          description: "Direct emergency treasury disbursement for disaster victims, medical distress, and higher education scholarships.",
          sla: "12-24 Hours Emergency Sanction",
          citizenEntitlement: "Direct Aadhaar DBT transfer without administrative intermediaries.",
          nodalContact: "CM Secretariat Grievance Cell • cm-relief@state.gov.in",
          status: "Active",
        },
        {
          id: "rep_cm_2",
          title: "Statewide Jan Sunwai & Anti-Corruption Task Force",
          category: "Public Redressal",
          description: "Direct Chief Minister intervention in unaddressed district complaints and anti-extortion raids.",
          sla: "48 Hours Action Taken Order",
          citizenEntitlement: "Protected whistleblower status with direct CMO review.",
          nodalContact: "CM Special Task Force (STF)",
          status: "Active",
        },
        {
          id: "rep_cm_3",
          title: "State Highway & Rapid Urban Transit Sanctions",
          category: "Civic Infrastructure",
          description: "Fast-tracking bypass corridors, flyover projects, and metro rail expansion across key cities.",
          sla: "High Priority Cabinet Approval",
          citizenEntitlement: "Zero-land grab and fair compensation oversight for affected residents.",
          nodalContact: "Urban Development & Housing Directorate",
          status: "Active",
        },
      ];
    }

    // 3c. MLA / MLC (State Level)
    if (normalizedRole === "mla" || normalizedRole === "mlc" || normalizedSub.includes("state")) {
      return [
        {
          id: "rep_mla_1",
          title: "MLALAD Local Constituency Development Sanctions",
          category: "Welfare & Funds",
          description: "Sanction of community boring wells, high-mast LED junctions, paver block lane paving, and community centers.",
          sla: "7 Days Project Clearance",
          citizenEntitlement: "Open public domain tender publication and citizen audit committee oversight.",
          nodalContact: "Constituency MLA Office In-charge",
          status: "Active",
        },
        {
          id: "rep_mla_2",
          title: "Legislative Floor Questions & Zero-Hour Issues",
          category: "Legislative Help",
          description: "Raising local ward civic issues, electricity tariffs, and hospital shortages in Vidhan Sabha Hansard.",
          sla: "Next Legislative Session",
          citizenEntitlement: "Constituency citizens get official government answers signed by State Minister.",
          nodalContact: "Legislative Affairs Desk",
          status: "Active",
        },
        {
          id: "rep_mla_3",
          title: "Weekly Public Janata Darbar & Direct Redressal",
          category: "Public Redressal",
          description: "In-person constituency hearing with designated executive engineers and administrative magistrates present.",
          sla: "Every Saturday 10 AM - 2 PM",
          citizenEntitlement: "Immediate on-spot written endorsement and officer SLA assignment.",
          nodalContact: "MLA Camp Office",
          status: "Active",
        },
      ];
    }

    // 3d. Mayor / MCD Councillor / Sarpanch (Local / Municipal Level)
    return [
      {
        id: "rep_loc_1",
        title: "Ward Councillor Priority Development Fund (CCDF)",
        category: "Civic Infrastructure",
        description: "Direct allocation of ward budget for lane resurfacing, drain covers, park benches, and LED streetlamps.",
        sla: "3 Working Days Sanction",
        citizenEntitlement: "Colony RWA prioritized project execution with transparent bill of quantities.",
        nodalContact: "Ward Councillor Secretariat",
        status: "Active",
      },
      {
        id: "rep_loc_2",
        title: "Emergency Water Pipeline & Choked Manhole Redressal",
        category: "Water & Utilities",
        description: "Direct coordination with municipal JE to restore clean pipeline water and unblock colony sewer backups.",
        sla: "6-12 Hours Response",
        citizenEntitlement: "Guaranteed municipal engineering visit with zero personal payment.",
        nodalContact: "Ward Public Liaison Officer",
        status: "Active",
      },
      {
        id: "rep_loc_3",
        title: "Public Ration Card, Pension & Aadhaar Camps",
        category: "Welfare & Funds",
        description: "Doorstep weekend camps for old-age pensions, widow pensions, and Ayushman golden card generation.",
        sla: "Bi-Weekly Local Camps",
        citizenEntitlement: "Zero-bribe doorstep documentation assistance for senior citizens and low-income families.",
        nodalContact: "Ward Citizen Help Desk",
        status: "Active",
      },
    ];
  }

  return [];
}
