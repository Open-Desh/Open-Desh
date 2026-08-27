export type UserCategory = "citizen" | "department" | "representative" | "business";

export interface CitizenDetails {
  occupation: string;
  interests?: string[];
  voterConstituency?: string;
}

export interface BusinessDetails {
  companyName: string;
  industry: string;
  registrationNumber?: string;
  gstinOrPan?: string;
  officialWebsite?: string;
  contactEmail?: string;
  verifiedCompany?: boolean;
}

export interface DepartmentDetails {
  name: string;
  designation?: string;
  jurisdiction?: string;
  jurisdictionRegion?: string;
  departmentCode?: string;
  officialBadge?: string;
  governmentLevel?: string;
  state?: string;
  activeTickets?: number;
  resolvedTickets?: number;
}

export interface RepresentativeDetails {
  party: string;
  position: string; // e.g. "MLA - Ranchi East", "Member of Parliament"
  constituency: string; // e.g. "Varanasi", "New Delhi"
  level?: string; // "National Level" | "State Level" | "Local/Municipal Level" | "Party Official/Worker"
  termYears?: string;
  legislativeBody?: string;
}

export interface UserReview {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername?: string;
  authorAvatar?: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  verifiedVoter: boolean;
  adminReply?: {
    text: string;
    date: string;
    authorName: string;
    authorRole?: string;
  };
}

export interface CivicService {
  id: string;
  title: string;
  category: "Civic Infrastructure" | "Sanitation & Waste" | "Water & Utilities" | "Public Redressal" | "Legislative Help" | "Welfare & Funds";
  description: string;
  sla: string; // e.g. "24 Hours SLA", "48 Hours Action"
  citizenEntitlement: string; // e.g. "Free road pothole repair within ward"
  nodalContact?: string;
  status: "Active" | "High Demand" | "Scheduled";
}

export interface ScoreCriterion {
  label: string;
  weight: number; // e.g. 25
  scoreAwarded: number; // e.g. 22
  description: string;
  publicSource: string;
  sourceUrl: string;
  sourceType: "CAG Gazette" | "State Legislative Hansard" | "Govt SLA Redressal Log" | "Geo-Tagged Audit" | "Verified Voter Index";
}

export interface SystemScoreBreakdown {
  totalScore: number; // 0 to 100
  lastAuditedDate: string;
  auditCycle: string;
  algorithmVersion: string;
  criteria: ScoreCriterion[];
  publicDomainDisclosures: {
    title: string;
    publisher: string;
    gazetteRef: string;
    url: string;
  }[];
}

export interface UserProfile {
  id: string;
  fullName: string;
  name?: string;
  username: string;
  bio: string;
  location: string;
  websiteUrl?: string;
  avatarUrl: string;
  category: UserCategory;
  age?: number;
  citizenDetails?: CitizenDetails;
  departmentDetails?: DepartmentDetails;
  representativeDetails?: RepresentativeDetails;
  businessDetails?: BusinessDetails;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  following?: string[];
  followers?: string[];
  systemScore: number; // 0 to 100
  publicRating: number; // 0 to 5.0
  reviewsCount: number;
  reviews?: UserReview[];
  services?: CivicService[];
  systemScoreBreakdown?: SystemScoreBreakdown;
  verified: boolean;
  verifiedCategory?: UserCategory;
  verificationStatus?: "none" | "pending" | "approved" | "rejected";
  verificationSubmittedAt?: string;
  verificationSubmittedCategory?: UserCategory;
  verificationSubmittedDocs?: string;
  savedReports?: string[];
  isFollowing?: boolean;
  email?: string;
  userId?: string;
  birthDate?: string;
  birthDayFormatted?: string;
  joiningDate?: string;
  isClaimable?: boolean;
  isClaimed?: boolean;
  claimedByEmail?: string;
  claimedAt?: string;
  claimedByOfficerName?: string;
}

export interface ThreadedReply {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  authorCategory: UserCategory;
  authorBadge?: string;
  authorVerified?: boolean;
  authorVerifiedCategory?: UserCategory;
  text: string;
  imageUrl?: string;
  timestamp: string;
  createdAt?: number | string;
  likesCount: number;
  likedBy?: string[];
  reReportsCount?: number;
  reReportedBy?: string[];
  parentReplyId?: string | null;
  replyToUsername?: string;
  replyToName?: string;
  replies?: ThreadedReply[];
  isOfficialIntervention?: boolean;
}

export type IssueCategory =
  | "Water"
  | "Infrastructure"
  | "Corruption"
  | "Electricity"
  | "Sanitation"
  | "Environment"
  | "Public Transport"
  | "Health"
  | "Other";

export interface LocationGeo {
  lat: number;
  lng: number;
  city: string;
  address?: string;
}

export interface AiTriageMeta {
  departmentTag: string;
  urgencyScore: number; // 1 to 10
  sentimentSummary: string;
  relevantStatute: string;
  confidenceScore: number;
}

export interface ReportIssue {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  authorCategory: UserCategory;
  authorBadge?: string;
  authorVerified?: boolean;
  authorVerifiedCategory?: UserCategory;
  category: IssueCategory;
  text: string;
  imageUrl?: string;
  images?: string[]; // Multiple photos / Cloudflare R2 evidence array
  structuredDetails?: Record<string, string>; // Category-specific structured inputs
  taggedOfficers?: string[];
  taggedOfficials?: string[];
  taggedAuthorities?: string[];
  taggedLeaders?: string[];
  routedDepartment?: string;
  auditLevel?: string;
  urgencyLevel?: "Normal" | "High Priority" | "Critical Emergency";
  location: LocationGeo;
  timestamp: string;
  createdAt?: number | string;
  status: "Open" | "Under Dept Review" | "In Progress" | "Resolved";
  departmentStatusLevel: 0 | 1 | 2 | 3;
  claimedByDept?: string;
  claimedByOfficer?: string;
  claimedAt?: string;
  departmentNotes?: string;
  resolvedImageUrl?: string;
  resolutionProof?: string;
  aiTriage?: AiTriageMeta;
  isPinned?: boolean;
  likesCount: number;
  likedBy?: string[];
  reReportsCount: number;
  reReportedBy?: string[];
  repliesCount: number;
  replies?: ThreadedReply[];
  linkedProjectId?: string;
}

export interface PromiseItem {
  id: string;
  title: string;
  description: string;
  status: "Fulfilled" | "In Progress" | "Unfulfilled";
  date: string;
  budget?: string;
}

export interface Leader {
  id: string;
  userId?: string;
  name: string;
  username: string;
  title: string;
  party: string;
  partyColor: string;
  constituency: string;
  location: string;
  websiteUrl?: string;
  image: string;
  coverImage?: string;
  bio: string;
  category: "ruling" | "myarea" | "opposition";
  systemScore: number;
  publicRating: number;
  totalVotes: string;
  reviewsCount: number;
  promisesFulfilled: number;
  promisesInProgress: number;
  promisesUnfulfilled: number;
  promisesTotal: number;
  keyFocus: string[];
  recentPromises: PromiseItem[];
  reviews: UserReview[];
  systemScoreBreakdown?: SystemScoreBreakdown;
  verified?: boolean;
  isFollowing?: boolean;
  followersCount?: number;
  followers?: string[];
}

export interface InfrastructureProject {
  id: string;
  name: string;
  region: string;
  category: "Roads & Bridges" | "Water Supply" | "Public Transit" | "Clean Sanitation & Energy";
  progressPercent: number;
  budgetAllocated: string;
  budgetSpent: string;
  contractor: string;
  contractorId?: string;
  contractorUsername?: string;
  contractorAvatar?: string;
  contractorLicense: string;
  contractorRating?: number;
  contractorSystemScore?: number;
  contractorProjectsCompleted?: number;
  supervisingOfficer: string;
  supervisingOfficerId?: string;
  supervisingDept: string;
  status: "Planning" | "Active" | "Delayed" | "Completed";
  deadline: string;
  healthIndex: number; // 0 to 100
  reportedIssuesCount: number;
  penaltiesImposed?: string;
  liveSensors?: {
    label: string;
    value: string;
    status: "normal" | "warning" | "alert";
  }[];
}

export interface EnterpriseScaleMetrics {
  totalActiveUsers: number;
  requestsPerSecond: number;
  p95LatencyMs: number;
  cacheHitRatio: number;
  databaseConnections: number;
  queueBacklog: number;
  geminiAiAuditLatencyMs: number;
  triageLatencyMs?: number;
  regionalNodes: {
    region: string;
    status: "healthy" | "degraded" | "offline";
    latencyMs: number;
    loadPercent: number;
  }[];
}

export type BudgetLevel = "national" | "state" | "district" | "village";

export interface BudgetLineItem {
  id: string;
  name: string;
  shortName: string;
  category: string;
  allocatedAmountCr: number; // in Crores INR
  utilizedAmountCr?: number; // in Crores INR
  percentage: number;
  color?: string;
  growthYoY?: string;
  description?: string;
  nodalMinistryOrDept?: string;
  keySchemes?: string[];
  perCapitaShareInr?: number;
  status?: "Allocated" | "Disbursed" | "Under Audit" | "Utilized";
  utilizationRate?: number; // 0 to 100%
  beneficiariesCount?: string;
  fiscalYear?: string;
}

export type BudgetType =
  | "national_budget"
  | "state_budget"
  | "legislature_ut_budget"
  | "union_budget_ut_allocation"
  | string;

export interface BudgetHierarchyNode {
  id: string;
  level: BudgetLevel;
  name: string;
  hindiName?: string;
  code: string;
  parentState?: string | null;
  parentDistrict?: string | null;
  parentBlock?: string | null;
  budgetType?: BudgetType;
  totalBudgetCr: number; // in Crores INR
  totalRevenueCr: number;
  totalExpenditureCr: number;
  capexCr: number;
  revenueExpCr: number;
  grossExpenditureCr?: number;
  netExpenditureCr?: number | null;
  revenueReceiptsCr?: number | null;
  revenueExpenditureCr?: number | null;
  capitalOutlayCr?: number | null;
  debtRepaymentCr?: number | null;
  taxRevenueNetToCentreCr?: number;
  nonTaxRevenueCr?: number;
  capitalReceiptsCr?: number;
  recoveryOfLoansCr?: number;
  otherReceiptsCr?: number;
  borrowingsAndOtherLiabilitiesCr?: number;
  interestPaymentsCr?: number;
  grantsForCapitalAssetCreationCr?: number;
  effectiveCapitalExpenditureCr?: number;
  revenueDeficitCr?: number;
  effectiveRevenueDeficitCr?: number;
  fiscalDeficitCr?: number;
  primaryDeficitCr?: number;
  gdpCr?: number;
  resourcesTransferredToStatesCr?: number;
  fiscalYear: string;
  population?: number;
  populationYear?: number;
  areaSqKm?: string | number;
  perCapitaBudgetInr?: number;
  perCapitaNetBudgetInr?: number | null;
  panchayatType?: string;
  releasedCr?: number;
  spentCr?: number;
  workValueCr?: number;
  completedWorks?: number;
  inProgressWorks?: number;
  delayedWorks?: number;
  totalWorks?: number;
  ruralBeneficiaries?: string;
  citizenBeneficiaries?: string;
  inflows?: BudgetLineItem[];
  outflows?: BudgetLineItem[];
  keySchemes?: {
    name: string;
    allocatedCr: number;
    utilizedCr: number;
    description: string;
    beneficiaryTarget: string;
    icon?: string;
    approvedDisplay?: string;
    spentDisplay?: string;
  }[];
  historicalTrends?: {
    year: string;
    totalBudgetCr: number;
    capexCr: number;
  }[];
  auditNotes: string;
  image?: string;
  emblemIcon?: string;
  capitalOrHQ?: string;
  tagline?: string;
  districtCount?: number;
  panchayatCount?: number | null;
  officialSource: string;
  officialGazetteRef?: string;
  lastUpdated: string;
}

export type HelpCategoryId =
  | "getting_started"
  | "reports_and_complaints"
  | "government_and_officials"
  | "ratings_and_reviews"
  | "public_budget"
  | "account_and_privacy"
  | "safety_and_policies"
  | string;

export interface HelpCategoryInfo {
  id: HelpCategoryId;
  label: string;
  hindiLabel: string;
  description: string;
  descriptionHindi?: string;
  icon: string;
  color: string;
  badgeBg: string;
}

export interface HelpFaqItem {
  question: string;
  answer: string;
  englishQuestion?: string;
  englishAnswer?: string;
}

export interface HelpArticle {
  id: string;
  slug: string;
  category: HelpCategoryId;
  categoryLabel: string;
  categoryHindi: string;
  title: string;
  englishTitle?: string;
  summary: string;
  englishSummary?: string;
  keyPoints: string[];
  englishKeyPoints?: string[];
  fullContent: string[];
  englishFullContent?: string[];
  faqQuestions?: HelpFaqItem[];
  tags: string[];
  englishTags?: string[];
  readTimeMinutes: number;
  sourceUrl: string;
  lastUpdated: string;
  iconName?: string;
  relatedArticleIds?: string[];
}

export * from "./types/notification.ts";

