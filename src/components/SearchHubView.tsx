import React, { useState } from "react";
import {
  Search,
  Settings2,
  X,
  MapPin,
  TrendingUp,
  Building2,
  FileText,
  Sparkles,
  Heart,
  Repeat2,
  MessageCircle,
  Share2,
  Bookmark,
  CheckCircle2,
  ShieldCheck,
  Star,
  Users,
  Sliders,
  Check,
  Send,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Clock,
} from "lucide-react";
import {
  ReportIssue,
  Leader,
  InfrastructureProject,
  UserProfile,
  ThreadedReply,
} from "../types.ts";

interface SearchHubViewProps {
  reports: ReportIssue[];
  leaders: Leader[];
  projects: InfrastructureProject[];
  userProfile: UserProfile;
  onNavigate: (view: string) => void;
  onSelectUser?: (userId: string) => void;
  onSelectLeaderProfile?: (leader: Leader) => void;
  onSelectPost?: (reportId: string) => void;
  onLikeReport?: (reportId: string) => Promise<void>;
  onReReport?: (reportId: string) => Promise<void>;
  onBookmark?: (reportId: string) => Promise<void>;
  onReply?: (reportId: string, text: string, parentReplyId?: string) => Promise<void>;
  onOpenMobileSidebar?: () => void;
}

export const SearchHubView: React.FC<SearchHubViewProps> = ({
  reports,
  leaders,
  projects,
  userProfile,
  onNavigate,
  onSelectUser,
  onSelectLeaderProfile,
  onSelectPost,
  onLikeReport,
  onReReport,
  onBookmark,
  onReply,
  onOpenMobileSidebar,
}) => {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"foryou" | "trending" | "reports" | "leaders" | "projects">("foryou");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Settings State
  const [isNearMeOnly, setIsNearMeOnly] = useState(true);
  const [showPersonalizedTrends, setShowPersonalizedTrends] = useState(true);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("All");

  // Interaction State for Reports
  const [replyInputMap, setReplyInputMap] = useState<Record<string, string>>({});
  const [activeReplyBoxReportId, setActiveReplyBoxReportId] = useState<string | null>(null);
  const [expandedRepliesReportId, setExpandedRepliesReportId] = useState<Record<string, boolean>>({});

  const userCity = userProfile.location || "Jharkhand, India";
  const userCityKeyword = userCity.split(",")[0].trim().toLowerCase();

  // Filter based on query and location
  const filterByLocationAndQuery = (itemText: string, itemLocation: string) => {
    const matchesQuery =
      !query.trim() ||
      itemText.toLowerCase().includes(query.toLowerCase()) ||
      itemLocation.toLowerCase().includes(query.toLowerCase());

    if (!matchesQuery) return false;

    if (isNearMeOnly) {
      return (
        itemLocation.toLowerCase().includes(userCityKeyword) ||
        itemLocation.toLowerCase().includes("jharkhand") ||
        itemLocation.toLowerCase().includes("ranchi")
      );
    }
    return true;
  };

  const filteredReports = reports.filter((r) =>
    filterByLocationAndQuery(
      `${r.text} ${r.category} ${r.authorName} @${r.authorUsername}`,
      `${r.location.city} ${r.location.address || ""}`
    )
  );

  const filteredLeaders = leaders.filter((l) =>
    filterByLocationAndQuery(
      `${l.name} ${l.party} ${l.title} @${l.username} ${l.bio}`,
      `${l.location} ${l.constituency}`
    )
  );

  const filteredProjects = projects.filter((p) =>
    filterByLocationAndQuery(
      `${p.name} ${p.category} ${p.contractor} ${p.supervisingDept}`,
      p.region
    )
  );

  const trendingTopics = [
    {
      tag: "#RanchiRingRoad",
      category: "Civic Infrastructure",
      postsCount: "14.2K",
      description: "Pothole resurfacing and flyover girder construction progress",
    },
    {
      tag: "#StreetlightDarkness",
      category: "Water & Utilities",
      postsCount: "8.9K",
      description: "Ward 12 LED replacement drive by Municipal Corp",
    },
    {
      tag: "#SubarnarekhaWater",
      category: "Sanitation & Water",
      postsCount: "6.4K",
      description: "Automated pipeline grid and water turbidity monitoring",
    },
    {
      tag: "#MLALADFundAudit",
      category: "Governance & Transparency",
      postsCount: "12.8K",
      description: "Open Nation 100-pt algorithm public audit verification",
    },
    {
      tag: "#KankeChowkFlyover",
      category: "Roads & Transit",
      postsCount: "5.1K",
      description: "Traffic diversion schedule and pier concrete curing",
    },
  ];

  const handleSendReply = async (reportId: string) => {
    const text = replyInputMap[reportId];
    if (!text || !text.trim()) return;

    if (onReply) {
      await onReply(reportId, text.trim());
    }
    setReplyInputMap((prev) => ({ ...prev, [reportId]: "" }));
    setActiveReplyBoxReportId(null);
    setExpandedRepliesReportId((prev) => ({ ...prev, [reportId]: true }));
  };

  return (
    <div className="max-w-xl mx-auto pb-24 md:pb-12 animate-fadeIn bg-white border-x border-slate-200 min-h-screen">
      {/* 1. X/Twitter-Style Transforming Search Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-3.5 py-2.5 border-b border-slate-200 flex items-center gap-2.5">
        {/* Left: User Avatar (clickable) */}
        <button
          onClick={() => {
            if (onOpenMobileSidebar) {
              onOpenMobileSidebar();
            } else {
              onNavigate("profile");
            }
          }}
          className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200 hover:scale-105 transition-transform cursor-pointer"
          title="Open Profile"
        >
          <img
            src={userProfile.avatarUrl}
            alt={userProfile.fullName}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </button>

        {/* Center: Search Input Bar Pill */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            id="explore-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Open Nation, leaders, issues..."
            className="w-full pl-9 pr-8 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded-full text-xs sm:text-sm font-medium text-slate-900 focus:outline-none transition-all placeholder:text-slate-500"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              title="Clear Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Settings Icon */}
        <button
          id="explore-settings-btn"
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer shrink-0"
          title="Explore & Location Settings"
        >
          <Settings2 className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Sub-Tabs below Search Header (like X Explore) */}
      <div className="border-b border-slate-200 bg-white sticky top-[53px] z-20">
        <div className="flex justify-between overflow-x-auto no-scrollbar px-2 sm:px-4">
          {(
            [
              { id: "foryou", label: "For You" },
              { id: "trending", label: "Trending" },
              { id: "reports", label: "Reports" },
              { id: "leaders", label: "Leaders" },
              { id: "projects", label: "Projects" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3 text-xs sm:text-sm font-extrabold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "border-blue-600 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Location Filter Active Pill Banner */}
      {isNearMeOnly && (
        <div className="px-4 py-2 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900 animate-fadeIn">
          <div className="flex items-center gap-1.5 font-semibold truncate">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">Showing content near {userCity}</span>
          </div>
          <button
            onClick={() => setIsNearMeOnly(false)}
            className="text-blue-700 font-extrabold hover:underline shrink-0 ml-2 text-[11px]"
          >
            Show Nationwide
          </button>
        </div>
      )}

      {/* 4. Tab Content Feeds (X-Style) */}
      <div>
        {/* TAB: FOR YOU (Personalized Mix) */}
        {activeTab === "foryou" && (
          <div className="divide-y divide-slate-100">
            {/* Top Trending Snippet Box */}
            <div className="p-4 bg-slate-50/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  <span>Trending in {isNearMeOnly ? userCity : "India"}</span>
                </span>
                <button
                  onClick={() => setActiveTab("trending")}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Show more
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {trendingTopics.slice(0, 4).map((topic, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setQuery(topic.tag);
                      setActiveTab("reports");
                    }}
                    className="p-3 bg-white border border-slate-200/80 rounded-2xl cursor-pointer hover:border-blue-300 transition-colors space-y-0.5 shadow-2xs"
                  >
                    <span className="text-[10px] font-bold text-slate-400 block">
                      {topic.category} • Trending
                    </span>
                    <h4 className="font-extrabold text-xs text-slate-900">{topic.tag}</h4>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      {topic.postsCount} reports & discussions
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Leaders Strip */}
            {filteredLeaders.length > 0 && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Who to follow & hold accountable</span>
                  </span>
                  <button
                    onClick={() => setActiveTab("leaders")}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    View all
                  </button>
                </div>

                <div className="space-y-2.5">
                  {filteredLeaders.slice(0, 3).map((leader) => (
                    <div
                      key={leader.id}
                      className="p-3 bg-white border border-slate-200/90 rounded-2xl flex items-center justify-between gap-3 hover:border-blue-300 transition-colors shadow-2xs"
                    >
                      <div
                        onClick={() => {
                          if (onSelectLeaderProfile) onSelectLeaderProfile(leader);
                          else onNavigate("leader");
                        }}
                        className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                      >
                        <img
                          src={leader.image}
                          alt={leader.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                            {leader.name}
                          </h4>
                          <span className="text-[11px] text-slate-500 truncate block">
                            @{leader.username} • {leader.party}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full block mb-1">
                          Score: {leader.systemScore}/100
                        </span>
                        <button
                          onClick={() => {
                            if (onSelectLeaderProfile) onSelectLeaderProfile(leader);
                            else onNavigate("leader");
                          }}
                          className="text-[11px] font-bold px-3 py-1 bg-slate-900 text-white rounded-full hover:bg-black transition-colors"
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Reports Feed underneath */}
            <div className="divide-y divide-slate-100">
              <div className="px-4 py-2.5 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Latest Civic Reports & Grievances
              </div>

              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 hover:bg-slate-50/60 transition-colors space-y-2.5"
                  >
                    {/* Author Row */}
                    <div className="flex items-center justify-between text-xs">
                      <div
                        onClick={() => onSelectUser && onSelectUser(report.authorId)}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <img
                          src={
                            report.authorAvatar ||
                            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80"
                          }
                          alt={report.authorName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {report.authorName}
                            </span>
                            <span className="text-slate-400 font-normal">
                              @{report.authorUsername}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {report.timestamp} • {report.location.city}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                        {report.category}
                      </span>
                    </div>

                    {/* Report Text */}
                    <p className="text-xs sm:text-sm text-slate-900 font-normal leading-relaxed">
                      {report.text}
                    </p>

                    {/* Report Image */}
                    {report.imageUrl && (
                      <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-72 bg-slate-900">
                        <img
                          src={report.imageUrl}
                          alt="Civic Evidence"
                          className="w-full h-full object-cover max-h-72"
                        />
                      </div>
                    )}

                    {/* Interactive Action Bar (Like, Re-report, Reply) */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => onLikeReport && onLikeReport(report.id)}
                        className="flex items-center gap-1.5 hover:text-rose-600 transition-colors cursor-pointer py-1 px-1.5"
                      >
                        <Heart className="w-4 h-4 text-rose-500" />
                        <span>{report.likesCount}</span>
                      </button>

                      <button
                        onClick={() => onReReport && onReReport(report.id)}
                        className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors cursor-pointer py-1 px-1.5"
                      >
                        <Repeat2 className="w-4 h-4 text-emerald-600" />
                        <span>{report.reReportsCount}</span>
                      </button>

                      <button
                        onClick={() => {
                          if (onSelectPost) {
                            onSelectPost(report.id);
                          } else {
                            setActiveReplyBoxReportId(
                              activeReplyBoxReportId === report.id ? null : report.id
                            );
                          }
                        }}
                        className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer py-1 px-1.5"
                      >
                        <MessageCircle className="w-4 h-4 text-blue-500" />
                        <span>{report.repliesCount}</span>
                      </button>

                      <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                        {report.status}
                      </span>
                    </div>

                    {/* Inline Reply Input */}
                    {activeReplyBoxReportId === report.id && (
                      <div className="pt-2 flex items-center gap-2 animate-fadeIn">
                        <input
                          type="text"
                          value={replyInputMap[report.id] || ""}
                          onChange={(e) =>
                            setReplyInputMap((prev) => ({
                              ...prev,
                              [report.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSendReply(report.id);
                          }}
                          placeholder="Post your reply or citizen observation..."
                          className="flex-1 text-xs px-3 py-2 bg-slate-100 border border-slate-200 rounded-full focus:outline-none focus:bg-white focus:border-blue-500"
                        />
                        <button
                          onClick={() => handleSendReply(report.id)}
                          disabled={!replyInputMap[report.id]?.trim()}
                          className="p-2 bg-blue-600 text-white rounded-full disabled:opacity-40 hover:bg-blue-700 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                  <p>No matching reports found for your search query.</p>
                  {isNearMeOnly && (
                    <button
                      onClick={() => setIsNearMeOnly(false)}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Search nationwide instead
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: TRENDING */}
        {activeTab === "trending" && (
          <div className="divide-y divide-slate-100 animate-fadeIn">
            {trendingTopics.map((topic, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setQuery(topic.tag);
                  setActiveTab("reports");
                }}
                className="p-4 hover:bg-slate-50 cursor-pointer transition-colors space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold">
                    {idx + 1} • {topic.category} • Trending
                  </span>
                  <span className="text-[11px] font-black text-blue-600">
                    {topic.postsCount} reports
                  </span>
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  {topic.tag}
                </h3>
                <p className="text-xs text-slate-600">{topic.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* TAB: REPORTS */}
        {activeTab === "reports" && (
          <div className="divide-y divide-slate-100 animate-fadeIn">
            {filteredReports.map((report) => (
              <div key={report.id} className="p-4 hover:bg-slate-50/60 transition-colors space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div
                    onClick={() => onSelectUser && onSelectUser(report.authorId)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <img
                      src={report.authorAvatar}
                      alt={report.authorName}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">{report.authorName}</span>
                      <span className="text-[10px] text-slate-400">@{report.authorUsername}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                    {report.category}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-900">{report.text}</p>
                {report.imageUrl && (
                  <div className="rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center">
                    <img
                      src={report.imageUrl}
                      alt="Civic Issue"
                      className="w-full h-auto object-contain rounded-2xl"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <button
                    onClick={() => onLikeReport && onLikeReport(report.id)}
                    className="flex items-center gap-1 text-rose-500"
                  >
                    <Heart className="w-3.5 h-3.5 fill-rose-500" /> {report.likesCount}
                  </button>
                  <button
                    onClick={() => onReReport && onReReport(report.id)}
                    className="flex items-center gap-1 text-emerald-600"
                  >
                    <Repeat2 className="w-3.5 h-3.5" /> {report.reReportsCount}
                  </button>
                  <span className="text-blue-600 font-bold">{report.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: LEADERS */}
        {activeTab === "leaders" && (
          <div className="p-4 space-y-3 animate-fadeIn">
            {filteredLeaders.map((leader) => (
              <div
                key={leader.id}
                onClick={() => {
                  if (onSelectLeaderProfile) onSelectLeaderProfile(leader);
                  else onNavigate("leader");
                }}
                className="p-4 bg-white border border-slate-200/90 rounded-2xl flex items-center justify-between gap-3 hover:border-blue-300 transition-colors shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={leader.image}
                    alt={leader.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <h4 className="font-extrabold text-sm text-slate-900 truncate">
                        {leader.name}
                      </h4>
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {leader.party} • {leader.constituency}
                    </p>
                    <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{leader.bio}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full block mb-1">
                    Score: {leader.systemScore}
                  </span>
                  <div className="flex items-center justify-end text-xs text-amber-500 font-bold">
                    <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                    <span>{leader.publicRating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: PROJECTS */}
        {activeTab === "projects" && (
          <div className="p-4 space-y-3 animate-fadeIn">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => onNavigate("infrastructure")}
                className="p-4 bg-white border border-slate-200/90 rounded-2xl hover:border-blue-300 transition-colors shadow-2xs cursor-pointer space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                      {project.category}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900 mt-1">
                      {project.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {project.region} • Supervised by {project.supervisingOfficer}
                    </p>
                  </div>
                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full shrink-0">
                    {project.progressPercent}% Completed
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${project.progressPercent}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Explore / Search Settings Modal (Location Toggle & Civic Preferences) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-extrabold text-slate-900">
                  Explore & Location Settings
                </h2>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
              {/* Location Toggle (Near You vs Everywhere) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>Show Content in Your Location</span>
                  </div>
                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => setIsNearMeOnly(!isNearMeOnly)}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      isNearMeOnly ? "bg-blue-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 bg-white rounded-full shadow-sm transition-transform absolute top-0.5 ${
                        isNearMeOnly ? "left-6.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-slate-600 font-normal leading-relaxed">
                  When enabled, Explore and Search results will strictly prioritize grievances,
                  leaders, and projects in <strong>{userCity}</strong>. Turn off to see posts from
                  everywhere across India.
                </p>
              </div>

              {/* Personalized Trends Toggle */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Trends for you</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPersonalizedTrends(!showPersonalizedTrends)}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      showPersonalizedTrends ? "bg-blue-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 bg-white rounded-full shadow-sm transition-transform absolute top-0.5 ${
                        showPersonalizedTrends ? "left-6.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-slate-600 font-normal leading-relaxed">
                  Personalize the trending topics based on your civic activity and followed
                  departments.
                </p>
              </div>

              {/* Department Filter Pills */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-600 tracking-wide block">
                  Filter by Civic Department Scope
                </label>
                <div className="flex flex-wrap gap-2">
                  {["All", "PWD Roads", "Jal Board Water", "Electricity (DHBVN)", "MCD Municipal", "Anti-Corruption"].map(
                    (dept) => (
                      <button
                        key={dept}
                        onClick={() => setSelectedDeptFilter(dept)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          selectedDeptFilter === dept
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {dept}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Save & Apply Button */}
              <div className="pt-2">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm py-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Explore Preferences</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
