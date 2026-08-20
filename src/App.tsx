import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar.tsx";
import { Header } from "./components/Header.tsx";
import { BottomNav } from "./components/BottomNav.tsx";
import { FeedView } from "./components/FeedView.tsx";
import { HelpView } from "./components/HelpView.tsx";
import { LeaderTrackerView } from "./components/LeaderTrackerView.tsx";
import { InfrastructureView } from "./components/InfrastructureView.tsx";
import { ProfileView } from "./components/ProfileView.tsx";
import { BookmarksView } from "./components/BookmarksView.tsx";
import { EnterpriseTelemetryView } from "./components/EnterpriseTelemetryView.tsx";
import { SearchHubView } from "./components/SearchHubView.tsx";
import { ConnectHubView } from "./components/ConnectHubView.tsx";
import { CreateReportModal } from "./components/CreateReportModal.tsx";
import { ComposeGrievanceView } from "./components/ComposeGrievanceView.tsx";
import { SettingsView } from "./components/SettingsView.tsx";
import { LoginView } from "./components/LoginView.tsx";
import { EditProfileView } from "./components/EditProfileView.tsx";
import { BudgetView } from "./components/BudgetView.tsx";
import { LanguageSelectModal } from "./components/LanguageSelectModal.tsx";
import { auth, onAuthStateChanged, logoutUser, FirebaseUser, db } from "./firebase.ts";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  UserProfile,
  ReportIssue,
  Leader,
  InfrastructureProject,
  IssueCategory,
} from "./types.ts";

const defaultGuestProfile: UserProfile = {
  id: "guest_citizen",
  fullName: "Guest Citizen",
  username: "guest_citizen",
  bio: "Explore citizen grievances, leader performance, and infrastructure audits across India.",
  location: "Jharkhand, India",
  avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80",
  category: "citizen",
  followersCount: 0,
  followingCount: 0,
  postsCount: 0,
  systemScore: 80,
  publicRating: 5.0,
  reviewsCount: 0,
  verified: false,
  savedReports: [],
};

export default function App() {
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Authentication States
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authActionReason, setAuthActionReason] = useState<string | null>(null);

  // Active viewing profile for dynamic profile inspection (Leader or Citizen or Dept)
  const [selectedViewingProfile, setSelectedViewingProfile] = useState<UserProfile | null>(null);
  const [bookmarkSearchQuery, setBookmarkSearchQuery] = useState("");

  // Core Data States - defaults to guest citizen initially
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultGuestProfile);

  const [reports, setReports] = useState<ReportIssue[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [infrastructure, setInfrastructure] = useState<InfrastructureProject[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Clean Path route synchronization (no '#' in URLs)
  useEffect(() => {
    const parseCurrentPath = () => {
      const fullPath = window.location.pathname.replace(/^\/+/, "");
      if (fullPath === "profile/edit") {
        setCurrentView("profile_edit");
        return;
      }

      const path = fullPath.split("/")[0];
      if (window.location.hash) {
        const hashView = window.location.hash.replace("#", "").replace(/^\/+/, "");
        window.history.replaceState(null, "", hashView ? `/${hashView}` : "/");
        if (hashView === "profile/edit") {
          setCurrentView("profile_edit");
          return;
        }
        if (hashView) {
          setCurrentView(hashView);
          return;
        }
      }

      if (path && path !== "") {
        setCurrentView(path);
      } else {
        setCurrentView("dashboard");
      }
    };

    parseCurrentPath();

    const handlePopState = () => {
      parseCurrentPath();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Sync / Load User Profile from Firestore on Auth Change
  const syncUserProfileFromFirestore = async (firebaseUser: FirebaseUser) => {
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const savedData = userDocSnap.data() as Partial<UserProfile>;
        setUserProfile((prev) => ({
          ...defaultGuestProfile,
          ...prev,
          ...savedData,
          id: firebaseUser.uid,
          fullName: savedData.fullName || firebaseUser.displayName || prev.fullName,
          username: savedData.username || (firebaseUser.email ? firebaseUser.email.split("@")[0] : `citizen_${firebaseUser.uid.slice(0, 6)}`),
          avatarUrl: savedData.avatarUrl || firebaseUser.photoURL || prev.avatarUrl,
          verified: true,
        }));
      } else {
        // Automatic New User Profile Generation & Firestore Provisioning
        const displayName =
          firebaseUser.displayName ||
          (firebaseUser.email ? firebaseUser.email.split("@")[0] : "Verified Citizen");
        const username = firebaseUser.email
          ? firebaseUser.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "")
          : `citizen_${firebaseUser.uid.slice(0, 6)}`;

        const newProfile: UserProfile = {
          id: firebaseUser.uid,
          fullName: displayName,
          username: username,
          bio: "Active citizen contributor in Open Desh civic governance.",
          location: "Jharkhand, India",
          websiteUrl: "",
          avatarUrl:
            firebaseUser.photoURL ||
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80",
          category: "citizen",
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          systemScore: 80,
          publicRating: 5.0,
          reviewsCount: 0,
          verified: true,
          savedReports: [],
        };

        setUserProfile(newProfile);

        await setDoc(userDocRef, {
          ...newProfile,
          email: firebaseUser.email || "",
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn("User Firestore load notice:", err);
      // Fallback local creation
      const displayName =
        firebaseUser.displayName ||
        (firebaseUser.email ? firebaseUser.email.split("@")[0] : "Verified Citizen");
      const username = firebaseUser.email
        ? firebaseUser.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "")
        : `citizen_${firebaseUser.uid.slice(0, 6)}`;

      setUserProfile((prev) => ({
        ...prev,
        id: firebaseUser.uid,
        fullName: displayName,
        username: username,
        avatarUrl: firebaseUser.photoURL || prev.avatarUrl,
        verified: true,
      }));
    }
  };

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        setIsLoggedIn(true);
        await syncUserProfileFromFirestore(firebaseUser);
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
        setUserProfile(defaultGuestProfile);
      }
    });

    return () => unsubscribe();
  }, []);

  const navigateTo = (view: string, resetProfile = true) => {
    let targetView = view;
    let newPath = `/${view}`;

    if (view === "dashboard") {
      newPath = "/";
    } else if (view === "profile_edit") {
      newPath = "/profile/edit";
    }

    // Protection: If unauthenticated guest tries to visit own profile or edit profile, redirect to login
    if (!isLoggedIn && (view === "profile" || view === "profile_edit" || view === "settings") && resetProfile) {
      setAuthActionReason("Sign in to access your personal verified profile and settings.");
      targetView = "login";
      newPath = "/login";
    }

    setCurrentView(targetView);
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, "", newPath);
    }
    if (view === "profile" && resetProfile) {
      setSelectedViewingProfile(null);
    }
  };

  // Auth Guard Helper for interactive actions - Redirects to dedicated Login Page
  const requireAuth = (callback: () => void | Promise<void>, actionName: string) => {
    if (isLoggedIn || currentUser) {
      callback();
    } else {
      setAuthActionReason(`Please sign in to ${actionName}.`);
      navigateTo("login");
    }
  };

  // Handle Login Success
  const handleLoginSuccess = async (user: FirebaseUser) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setAuthActionReason(null);
    await syncUserProfileFromFirestore(user);
    navigateTo("dashboard");
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      setIsLoggedIn(false);
      setCurrentUser(null);
      setUserProfile(defaultGuestProfile);
      setSelectedViewingProfile(null);
      navigateTo("dashboard");
    } catch (err) {
      console.error("Logout error:", err);
      setIsLoggedIn(false);
      setCurrentUser(null);
      setUserProfile(defaultGuestProfile);
      navigateTo("dashboard");
    }
  };

  // Fetch initial feed & civic data
  const fetchData = async () => {
    try {
      // 1. Reports
      setLoadingReports(true);
      const repRes = await fetch("/api/reports");
      if (repRes.ok) {
        const repData = await repRes.json();
        setReports(repData);
      }

      // 2. Leaders
      const leadRes = await fetch("/api/leaders");
      if (leadRes.ok) {
        const leadData = await leadRes.json();
        setLeaders(leadData);
      }

      // 3. Infra
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
    images?: string[];
    structuredDetails?: Record<string, string>;
    taggedOfficers?: string[];
    taggedLeaders?: string[];
    urgencyLevel?: "Normal" | "High Priority" | "Critical Emergency";
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

        // Sync report directly to Firebase Firestore
        try {
          await setDoc(doc(db, "reports", savedReport.id), {
            id: savedReport.id,
            authorId: currentUser?.uid || savedReport.authorId,
            authorName: userProfile.fullName || savedReport.authorName,
            authorUsername: userProfile.username || savedReport.authorUsername,
            category: savedReport.category,
            text: savedReport.text,
            imageUrl: savedReport.imageUrl || "",
            images: savedReport.images || [],
            taggedOfficers: savedReport.taggedOfficers || [],
            taggedLeaders: savedReport.taggedLeaders || [],
            urgencyLevel: savedReport.urgencyLevel || "Normal",
            location: savedReport.location || {},
            timestamp: savedReport.timestamp,
            status: savedReport.status,
            likesCount: savedReport.likesCount || 0,
            likedBy: savedReport.likedBy || [],
            reReportsCount: savedReport.reReportsCount || 0,
            reReportedBy: savedReport.reReportedBy || [],
          });
        } catch (fsErr) {
          console.warn("Firestore sync background notice:", fsErr);
        }
      }
    } catch (err) {
      console.error("Error creating report:", err);
    }
  };

  const handleLikeReport = async (id: string) => {
    requireAuth(async () => {
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
    }, "like civic reports");
  };

  const handleReReport = async (id: string) => {
    requireAuth(async () => {
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
    }, "re-report this grievance");
  };

  const handleBookmark = async (id: string) => {
    requireAuth(async () => {
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
    }, "save bookmarks");
  };

  const handleReply = async (id: string, text: string, parentReplyId?: string) => {
    requireAuth(async () => {
      try {
        const res = await fetch(`/api/reports/${id}/reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, parentReplyId }),
        });
        if (res.ok) {
          const data = await res.json();
          setReports((prev) =>
            prev.map((r) => (r.id === id ? data.report : r))
          );
        }
      } catch (err) {
        console.error("Reply API error:", err);
      }
    }, "reply and comment on reports");
  };

  const handleUpdateStatus = async (id: string, level: number, notes?: string) => {
    requireAuth(async () => {
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
    }, "update grievance status");
  };

  const handleUpdateProfile = async (updated: Partial<UserProfile>) => {
    if (!isLoggedIn) {
      navigateTo("login");
      return;
    }

    const updatedProfile: UserProfile = {
      ...userProfile,
      ...updated,
    };
    setUserProfile(updatedProfile);

    // Sync to backend and Firestore
    try {
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      const uid = currentUser?.uid || userProfile.id;
      await setDoc(
        doc(db, "users", uid),
        {
          ...updatedProfile,
          id: uid,
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("Profile Firestore sync notice:", err);
    }
  };

  const handleRateUser = async (userId: string, rating: number, comment: string) => {
    requireAuth(async () => {
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
    }, "submit a leader rating");
  };

  const handleReplyToReview = async (reviewId: string, replyText: string) => {
    requireAuth(async () => {
      const targetUserId = selectedViewingProfile ? selectedViewingProfile.id : userProfile.id;
      try {
        const res = await fetch(`/api/users/${targetUserId}/review/${reviewId}/reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ replyText }),
        });
        if (res.ok) {
          fetchData();
        }
      } catch (err) {
        console.error("Reply to review error:", err);
      }
    }, "reply to reviews");
  };

  const handleToggleFollow = async (targetUserId: string) => {
    requireAuth(async () => {
      try {
        await fetch(`/api/users/${targetUserId}/follow`, {
          method: "POST",
        });
        fetchData();
      } catch (err) {
        console.error("Follow error:", err);
      }
    }, "follow users and representatives");
  };

  // Inspect any user's profile dynamically
  const handleSelectUserProfile = async (userId: string) => {
    if (isLoggedIn && userId === userProfile.id) {
      setSelectedViewingProfile(null);
      navigateTo("profile", true);
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`);
      if (res.ok) {
        const targetProfile: UserProfile = await res.json();
        setSelectedViewingProfile(targetProfile);
        navigateTo("profile", false);
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
      followersCount: leader.category === "ruling" ? 380000 : 210000,
      followingCount: 18,
      postsCount: 8235,
      systemScore: leader.systemScore,
      publicRating: leader.publicRating,
      reviewsCount: leader.reviewsCount || 14000,
      reviews: leader.reviews || [],
      verified: true,
      isFollowing: false,
    };
    setSelectedViewingProfile(leaderProfile);
    navigateTo("profile", false);
  };

  const handleOpenCompose = () => {
    requireAuth(() => navigateTo("compose"), "file and report a civic grievance");
  };

  const bookmarkedReports = reports.filter((r) =>
    userProfile.savedReports?.includes(r.id)
  );

  const activeProfileToRender = selectedViewingProfile || userProfile;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Sidebar (Hidden on Login View & Full Compose) */}
      {currentView !== "login" && (
        <Sidebar
          currentView={currentView}
          onNavigate={navigateTo}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          userProfile={userProfile}
          isLoggedIn={isLoggedIn}
          onOpenLogin={() => {
            setAuthActionReason("Sign in to unlock verified citizen actions.");
            navigateTo("login");
          }}
          onLogout={handleLogout}
        />
      )}

      {/* Main Content Area */}
      <div
        id="main-content"
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          currentView === "login"
            ? "w-full"
            : isCollapsed
            ? "md:ml-20"
            : "md:ml-[260px]"
        }`}
      >
        {/* Navigation Header - Rendered on dashboard/aitutor etc., but Profile, Settings, Search, Compose, Login, Connect, Budget, Leader, Infrastructure & Edit Profile use their own custom X-style header */}
        {currentView !== "profile" &&
          currentView !== "profile_edit" &&
          currentView !== "login" &&
          currentView !== "settings" &&
          currentView !== "search" &&
          currentView !== "compose" &&
          currentView !== "connect" &&
          currentView !== "budget" &&
          currentView !== "leader" &&
          currentView !== "infrastructure" && (
            <Header
              currentView={currentView}
              onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
              onNavigate={navigateTo}
              userProfile={userProfile}
              searchQuery={bookmarkSearchQuery}
              onSearchQueryChange={setBookmarkSearchQuery}
              bookmarkedCount={bookmarkedReports.length}
              isLoggedIn={isLoggedIn}
              onOpenLogin={() => {
                setAuthActionReason("Sign in to your Open Desh account.");
                navigateTo("login");
              }}
            />
          )}

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
              onOpenCreateModal={handleOpenCompose}
              onSelectUser={handleSelectUserProfile}
              loading={loadingReports}
            />
          )}

          {/* DEDICATED LOGIN PAGE (No Modal) */}
          {currentView === "login" && (
            <LoginView
              onSuccess={handleLoginSuccess}
              onCancel={() => navigateTo("dashboard")}
              actionReason={authActionReason}
            />
          )}

          {/* DEDICATED EDIT PROFILE PAGE (No Modal) */}
          {currentView === "profile_edit" && (
            <EditProfileView
              userProfile={userProfile}
              onSave={handleUpdateProfile}
              onCancel={() => navigateTo("profile")}
            />
          )}

          {currentView === "compose" && (
            <ComposeGrievanceView
              userProfile={userProfile}
              leaders={leaders}
              onCancel={() => navigateTo("dashboard")}
              onSubmit={async (data) => {
                await handleCreateReport(data);
                navigateTo("dashboard");
              }}
            />
          )}

          {currentView === "aitutor" && <HelpView />}

          {currentView === "leader" && (
            <LeaderTrackerView
              leaders={leaders}
              activeUser={userProfile}
              onBack={() => navigateTo("dashboard")}
              onSelectLeaderProfile={handleSelectLeaderProfile}
              onRateLeader={async (leaderId, rating, comment) => {
                await handleRateUser(leaderId, rating, comment);
              }}
            />
          )}

          {currentView === "infrastructure" && (
            <InfrastructureView
              projects={infrastructure}
              reports={reports}
              onBack={() => navigateTo("dashboard")}
              onSelectUser={handleSelectUserProfile}
            />
          )}

          {currentView === "bookmark" && (
            <BookmarksView
              bookmarkedReports={bookmarkedReports}
              userProfile={userProfile}
              onLike={handleLikeReport}
              onReReport={handleReReport}
              onBookmark={handleBookmark}
              onReply={handleReply}
              onUpdateStatus={handleUpdateStatus}
              onNavigate={navigateTo}
              onSelectUser={handleSelectUserProfile}
              searchQuery={bookmarkSearchQuery}
              onSearchQueryChange={setBookmarkSearchQuery}
            />
          )}

          {currentView === "analytics" && <EnterpriseTelemetryView />}

          {currentView === "profile" && (
            <ProfileView
              key={activeProfileToRender.id}
              userProfile={activeProfileToRender}
              activeUser={userProfile}
              isLoggedIn={isLoggedIn}
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
              onNavigateToEditProfile={() => navigateTo("profile_edit")}
              onUpdateProfile={handleUpdateProfile}
              onRateUser={async (rating, comment) => {
                await handleRateUser(activeProfileToRender.id, rating, comment);
              }}
              onReplyToReview={handleReplyToReview}
              onToggleFollow={handleToggleFollow}
              onNavigateToPost={(reportId) => {
                navigateTo("dashboard");
              }}
            />
          )}

          {currentView === "settings" && (
            <SettingsView
              userProfile={userProfile}
              onUpdateProfile={handleUpdateProfile}
              onNavigate={navigateTo}
              onBackToHome={() => navigateTo("dashboard")}
            />
          )}

          {currentView === "search" && (
            <SearchHubView
              reports={reports}
              leaders={leaders}
              projects={infrastructure}
              userProfile={userProfile}
              onNavigate={navigateTo}
              onSelectUser={handleSelectUserProfile}
              onSelectLeaderProfile={handleSelectLeaderProfile}
              onLikeReport={handleLikeReport}
              onReReport={handleReReport}
              onBookmark={handleBookmark}
              onReply={handleReply}
              onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            />
          )}

          {currentView === "connect" && (
            <ConnectHubView
              userProfile={userProfile}
              onBack={() => navigateTo("dashboard")}
              onSelectUser={handleSelectUserProfile}
              onToggleFollow={handleToggleFollow}
            />
          )}

          {currentView === "budget" && (
            <BudgetView onBack={() => navigateTo("dashboard")} />
          )}

          {currentView === "help" && <HelpView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Hidden during full-screen Compose and Login) */}
      {currentView !== "compose" && currentView !== "login" && currentView !== "profile_edit" && (
        <BottomNav
          currentView={currentView}
          onNavigate={navigateTo}
          onOpenCreateReport={handleOpenCompose}
        />
      )}

      {/* Create Grievance Report Modal */}
      <CreateReportModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateReport}
        userProfile={userProfile}
      />

      {/* Global Indian Language Selection Modal */}
      <LanguageSelectModal />
    </div>
  );
}


