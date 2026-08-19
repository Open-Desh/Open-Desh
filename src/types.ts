export type UserCategory = "citizen" | "department" | "representative";

export interface CitizenDetails {
  occupation: string;
  interests?: string[];
  voterConstituency?: string;
}

export interface DepartmentDetails {
  name: string;
  designation: string;
  jurisdictionRegion: string;
  departmentCode: string;
  officialBadge: string;
  activeTickets?: number;
  resolvedTickets?: number;
}

export interface RepresentativeDetails {
  party: string;
  position: string; // e.g. "MLA - Ranchi East", "Member of Parliament"
  constituency: string; // e.g. "Jharkhand"
  termYears: string;
  legislativeBody: string;
}

export interface UserReview {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  verifiedVoter: boolean;
}

export interface UserProfile {
  id: string;
  fullName: string;
  username: string;
  bio: string;
  location: string;
  websiteUrl?: string;
  avatarUrl: string;
  category: UserCategory;
  citizenDetails?: CitizenDetails;
  departmentDetails?: DepartmentDetails;
  representativeDetails?: RepresentativeDetails;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  systemScore: number; // 0 to 100
  publicRating: number; // 0 to 5.0
  reviewsCount: number;
  reviews?: UserReview[];
  verified: boolean;
  savedReports?: string[];
  isFollowing?: boolean;
}

export interface ThreadedReply {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  authorCategory: UserCategory;
  authorBadge?: string;
  text: string;
  timestamp: string;
  likesCount: number;
  likedBy?: string[];
  parentReplyId?: string | null;
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
  | "Public Transport";

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
  category: IssueCategory;
  text: string;
  imageUrl?: string;
  location: LocationGeo;
  timestamp: string;
  status: "Open" | "Under Dept Review" | "In Progress" | "Resolved";
  departmentStatusLevel: 0 | 1 | 2 | 3;
  claimedByDept?: string;
  claimedByOfficer?: string;
  claimedAt?: string;
  departmentNotes?: string;
  aiTriage?: AiTriageMeta;
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
  contractorLicense: string;
  supervisingOfficer: string;
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
  regionalNodes: {
    region: string;
    status: "healthy" | "degraded" | "offline";
    latencyMs: number;
    loadPercent: number;
  }[];
}

