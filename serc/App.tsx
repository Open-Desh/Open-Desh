import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar.tsx";
import { Header } from "./components/Header.tsx";
import { BottomNav } from "./components/BottomNav.tsx";
import { FeedView } from "./components/FeedView.tsx";
import { AITutorView } from "./components/AITutorView.tsx";
import { LeaderTrackerView } from "./components/LeaderTrackerView.tsx";
import { InfrastructureView } from "./components/InfrastructureView.tsx";
import { ProfileView } from "./components/ProfileView.tsx";
import { BookmarksView } from "./components/BookmarksView.tsx";
import { EnterpriseTelemetryView } from "./components/EnterpriseTelemetryView.tsx";
import { SearchHubView } from "./components/SearchHubView.tsx";
import { ConnectHubView } from "./components/ConnectHubView.tsx";
import { CreateReportModal } from "./components/CreateReportModal.tsx";
import {
  UserProfile,
  ReportIssue,
  Leader,
  InfrastructureProject,
  IssueCategory,
} from "./types.ts";

export default function App() {
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Active viewing profile for dynamic profile inspection (Leader or Citizen or Dept)
  const [selectedViewingProfile, setSelectedViewingProfile] = useState<UserProfile | null>(null);

  // Core Data States
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: "user_nitesh_001",
    fullName: "Nitesh Gupta",
    username: "niteshgupta950",
    bio: "Public Representative & Civic Tech Advocate working for urban transparency and infrastructural acceleration in Jharkhand.",
    location: "Jharkhand, India",
    websiteUrl: "https://instagram.com/niteshgupta950",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    category: "representative",
    representativeDetails: {
      party: "Jharkhand Vikas Morcha",
      position: "Elected Representative",
      constituency: "Ranchi East, Jharkhand",
      termYears: "2024-2029",
      legislativeBody: "State Legislative Assembly",
    },
    followersCount: 255000,
    followingCount: 12,
    postsCount: 8235,
    systemScore: 84,
    publicRating: 4.4,
    reviewsCount: 142800,
    verified: true,
    savedReports: ["rep_001", "rep_002"],
  });

  const [reports, setReports] = useState<ReportIssue[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [infrastructure, setInfrastructure] = useState<InfrastructureProject[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Hash route synchronization
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        setCurrentView(hash);
      }
    };

    if (window.location.hash) {
      handleHashChange();
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigateTo = (view: string) => {
    setCurrentView(view);
    window.location.hash = `#${view}`;
    if (view === "profile") {
      setSelectedViewingProfile(null);
    }
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      // 1. Profile
      const profRes = await fetch("/api/user/profile");
      if (profRes.ok) {
        const profData = await profRes.json();
        setUserProfile(profData);
      }

      // 2. Reports
      setLoadingReports(true);
      const repRes = await fetch("/api/reports");
      if (repRes.ok) {
        const repData = await repRes.json();
        setReports(repData);
      }

      // 3. Leaders
      const leadRes = await fetch("/api/leaders");
      if (leadRes.ok) {
        const leadData = await leadRes.json();
        setLeaders(leadData);
      }

      // 4. Infra
      const infraRes = await fetch("/api/infrastructure");
      if (infraRes.ok) {
        const infraData = await infraRes.json();
        setInfrastructure(infraData);
      }
    } catch (err) {
      console.error("Initial data load error:", err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Action Handlers
  const handleCreateReport = async (newReportData: {
    text: string;
    category: IssueCategory;
    imageUrl?: string;
    location: {
      lat: number;
      lng: number;
      city: string;
      address?: string;
    };
  }) => {
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReportData),
      });
      if (res.ok) {
        const savedReport = await res.json();
        setReports((prev) => [savedReport, ...prev]);
        setUserProfile((prev) => ({
          ...prev,
          postsCount: (prev.postsCount || 0) + 1,
        }));
      }
    } catch (err) {
      console.error("Error creating report:", err);
    }
  };

  const handleLikeReport = async (id: string) => {
    // Optimistic UI update
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const isLiked = r.likedBy?.includes(userProfile.id);
          const newLikedBy = isLiked
            ? r.likedBy.filter((uid) => uid !== userProfile.id)
            : [...(r.likedBy || []), userProfile.id];
          return {
            ...r,
            likedBy: newLikedBy,
            likesCount: isLiked ? Math.max(0, r.likesCount - 1) : r.likesCount + 1,
          };
        }
        return r;
      })
    );

    try {
      await fetch(`/api/reports/${id}/like`, { method: "POST" });
    } catch (err) {
      console.error("Like API error:", err);
    }
  };

  const handleReReport = async (id: string) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const hasReReported = r.reReportedBy?.includes(userProfile.id);
          const newReReportedBy = hasReReported
            ? r.reReportedBy.filter((uid) => uid !== userProfile.id)
            : [...(r.reReportedBy || []), userProfile.id];
          return {
            ...r,
            reReportedBy: newReReportedBy,
            reReportsCount: hasReReported
              ? Math.max(0, (r.reReportsCount || 1) - 1)
              : (r.reReportsCount || 0) + 1,
          };
        }
        return r;
      })
    );

    try {
      await fetch(`/api/reports/${id}/rereport`, { method: "POST" });
    } catch (err) {
      console.error("Re-report API error:", err);
    }
  };

  const handleBookmark = async (id: string) => {
    const isBookmarked = userProfile.savedReports?.includes(id);
    const newSaved = isBookmarked
      ? (userProfile.savedReports || []).filter((rid) => rid !== id)
      : [...(userProfile.savedReports || []), id];

    setUserProfile((prev) => ({ ...prev, savedReports: newSaved }));

    try {
      await fetch(`/api/reports/${id}/bookmark`, { method: "POST" });
    } catch (err) {
      console.error("Bookmark API error:", err);
    }
  };

  const handleReply = async (id: string, text: string, parentReplyId?: string) => {
    try {
      const res = await fetch(`/api/reports/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, parentReplyId }),
      });
      if (res.ok) {
        const data = await res.json();
        // Replace full report to preserve nested tree state & department claimed status
        setReports((prev) =>
          prev.map((r) => (r.id === id ? data.report : r))
        );
      }
    } catch (err) {
      console.error("Reply API error:", err);
    }
  };

  const handleUpdateStatus = async (id: string, level: number, notes?: string) => {
    try {
      const res = await fetch(`/api/reports/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, notes }),
      });
      if (res.ok) {
        const data = await res.json();
        setReports((prev) =>
          prev.map((r) => (r.id === id ? data.report : r))
        );
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const handleUpdateProfile = async (updated: Partial<UserProfile>) => {
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data.profile);
      }
    } catch (err) {
      console.error("Profile update error:", err);
    }
  };

  const handleRateUser = async (userId: string, rating: number, comment: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Rate user error:", err);
    }
  };

  // Inspect any user's profile dynamically
  const handleSelectUserProfile = async (userId: string) => {
    if (userId === userProfile.id) {
      setSelectedViewingProfile(null);
      navigateTo("profile");
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`);
      if (res.ok) {
        const targetProfile: UserProfile = await res.json();
        setSelectedViewingProfile(targetProfile);
        navigateTo("profile");
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
    }
  };

  // When a leader is clicked in LeaderTracker, synchronize their profile
  const handleSelectLeaderProfile = (leader: Leader) => {
    const leaderProfile: UserProfile = {
      id: leader.id,
      fullName: leader.name,
      username: leader.username,
      bio: leader.bio,
      location: leader.location,
      websiteUrl: leader.websiteUrl || `https://instagram.com/${leader.username}`,
      avatarUrl: leader.image,
      category: "representative",
      representativeDetails: {
        party: leader.party,
        position: leader.title,
        constituency: leader.constituency,
        termYears: "2024-2029",
        legislativeBody: "State Assembly",
      },
      followersCount: 255000,
      followingCount: 12,
      postsCount: 8235,
      systemScore: leader.systemScore,
      publicRating: leader.publicRating,
      reviewsCount: leader.reviewsCount,
      reviews: leader.reviews,
      verified: true,
      isFollowing: false,
    };
    setSelectedViewingProfile(leaderProfile);
    navigateTo("profile");
  };

  const bookmarkedReports = reports.filter((r) =>
    userProfile.savedReports?.includes(r.id)
  );

  const activeProfileToRender = selectedViewingProfile || userProfile;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={navigateTo}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        userProfile={userProfile}
      />

      {/* Main Content Area */}
      <div
        id="main-content"
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isCollapsed ? "md:ml-20" : "md:ml-[260px]"
        }`}
      >
        {/* Navigation Header */}
        <Header
          currentView={currentView}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigate={navigateTo}
          userProfile={userProfile}
        />

        {/* View Switcher Routing */}
        <main id="app-root" className="flex-1 w-full bg-slate-100/50 min-h-screen">
          {currentView === "dashboard" && (
            <FeedView
              reports={reports}
              userProfile={userProfile}
              onLike={handleLikeReport}
              onReReport={handleReReport}
              onBookmark={handleBookmark}
              onReply={handleReply}
              onUpdateStatus={handleUpdateStatus}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onSelectUser={handleSelectUserProfile}
              loading={loadingReports}
            />
          )}

          {currentView === "aitutor" && <AITutorView />}

          {currentView === "leader" && (
            <LeaderTrackerView
              leaders={leaders}
              activeUser={userProfile}
              onSelectLeaderProfile={handleSelectLeaderProfile}
              onRateLeader={async (leaderId, rating, comment) => {
                await handleRateUser(leaderId, rating, comment);
              }}
            />
          )}

          {currentView === "infrastructure" && (
            <InfrastructureView projects={infrastructure} reports={reports} />
          )}

          {currentView === "bookmark" && (
            <BookmarksView
              bookmarkedReports={bookmarkedReports}
              onRemoveBookmark={handleBookmark}
              onNavigate={navigateTo}
            />
          )}

          {currentView === "analytics" && <EnterpriseTelemetryView />}

          {currentView === "profile" && (
            <ProfileView
              userProfile={activeProfileToRender}
              activeUser={userProfile}
              userReports={reports.filter(
                (r) =>
                  r.authorId === activeProfileToRender.id ||
                  (activeProfileToRender.category === "representative" &&
                    r.category === "Infrastructure")
              )}
              onBack={() => {
                setSelectedViewingProfile(null);
                navigateTo("dashboard");
              }}
              onUpdateProfile={handleUpdateProfile}
              onRateUser={async (rating, comment) => {
                await handleRateUser(activeProfileToRender.id, rating, comment);
              }}
              onNavigateToPost={(reportId) => {
                navigateTo("dashboard");
              }}
            />
          )}

          {currentView === "settings" && (
            <ProfileView
              userProfile={userProfile}
              activeUser={userProfile}
              userReports={reports.filter((r) => r.authorId === userProfile.id)}
              onUpdateProfile={handleUpdateProfile}
            />
          )}

          {currentView === "search" && (
            <SearchHubView
              reports={reports}
              leaders={leaders}
              projects={infrastructure}
              onNavigate={navigateTo}
            />
          )}

          {currentView === "connect" && (
            <ConnectHubView userProfile={userProfile} />
          )}

          {currentView === "help" && <AITutorView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentView={currentView}
        onNavigate={navigateTo}
        onOpenCreateReport={() => setIsCreateModalOpen(true)}
      />

      {/* Create Grievance Report Modal */}
      <CreateReportModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateReport}
        userProfile={userProfile}
      />
    </div>
  );
}
