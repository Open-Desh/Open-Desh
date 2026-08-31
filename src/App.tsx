import React, { useState, useEffect, useMemo } from "react";
import { Sidebar } from "./components/Sidebar.tsx";
import { Header } from "./components/Header.tsx";
import { BottomNav } from "./components/BottomNav.tsx";
import { FeedView } from "./components/FeedView.tsx";
import { HelpView } from "./components/HelpView.tsx";
import { ProfileView } from "./components/ProfileView.tsx";
import { BookmarksView } from "./components/BookmarksView.tsx";
import { SearchHubView } from "./components/SearchHubView.tsx";
import { ConnectHubView } from "./components/ConnectHubView.tsx";
import { ComposeGrievanceView } from "./components/ComposeGrievanceView.tsx";
import { SettingsView } from "./components/SettingsView.tsx";
import { LoginView } from "./components/LoginView.tsx";
import { EditProfileView } from "./components/EditProfileView.tsx";
import { VerificationView } from "./components/VerificationView.tsx";
import { BudgetView } from "./components/BudgetView.tsx";
import { PostDetailView } from "./components/PostDetailView.tsx";
import { LanguageSelectModal } from "./components/LanguageSelectModal.tsx";
import { NotificationsView } from "./components/NotificationsView.tsx";
import { InstallAppModal } from "./components/InstallAppModal.tsx";
import { auth, onAuthStateChanged, logoutUser, FirebaseUser, db } from "./firebase.ts";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Unsubscribe,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import {
  getReportsDirect,
  getLeadersDirect,
  getInfrastructureDirect,
  saveReportToFirestore,
  saveUserProfileToFirestore,
  toggleLikeInFirestore,
  toggleReReportInFirestore,
  addReplyInFirestore,
  updateReportRepliesInFirestore,
  submitLeaderReviewInFirestore,
  submitUserReviewInFirestore,
  updateReportStatusInFirestore,
  toggleFollowInFirestore,
  deleteReportInFirestore,
  togglePinReportInFirestore,
  claimOfficialProfileInFirestore,
  recordEngagementActionInFirestore,
  syncTrendingStatsInFirestore,
} from "./lib/firestoreSync.ts";
import {
  UserProfile,
  ReportIssue,
  Leader,
  InfrastructureProject,
  IssueCategory,
  UserReview,
  ThreadedReply,
  AppNotification,
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
  systemScore: 0,
  publicRating: 0,
  reviewsCount: 0,
  verified: false,
  savedReports: [],
};

export default function App() {
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Authentication States
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authActionReason, setAuthActionReason] = useState<string | null>(null);

  // Active viewing profile for dynamic profile inspection (Leader or Citizen or Dept)
  const [selectedViewingProfile, setSelectedViewingProfile] = useState<UserProfile | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [bookmarkSearchQuery, setBookmarkSearchQuery] = useState("");
  const [composeInitialMention, setComposeInitialMention] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Core Data States - defaults to guest citizen initially
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultGuestProfile);

  const [reports, setReports] = useState<ReportIssue[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [infrastructure, setInfrastructure] = useState<InfrastructureProject[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Real-time Notifications State (Strictly real user notifications)
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem("open_desh_notifications") || localStorage.getItem("open_nation_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Muted users state (persisted across sessions)
  const [mutedUsers, setMutedUsers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("open_desh_muted_users");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("open_desh_muted_users", JSON.stringify(mutedUsers));
    } catch (e) {
      console.error("Failed to persist muted users:", e);
    }
  }, [mutedUsers]);

  const handleMuteUser = (authorUsername: string, authorId?: string) => {
    const cleanUname = (authorUsername || "").replace(/^@/, "").toLowerCase().trim();
    const cleanId = (authorId || "").replace(/^@/, "").toLowerCase().trim();
    setMutedUsers((prev) => {
      const isMuted = (cleanUname && prev.includes(cleanUname)) || (cleanId && prev.includes(cleanId));
      if (isMuted) {
        return prev.filter((u) => u !== cleanUname && u !== cleanId);
      } else {
        const toAdd = [cleanUname, cleanId].filter(Boolean);
        return [...prev, ...toAdd];
      }
    });
  };

  // Sync notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("open_desh_notifications", JSON.stringify(notifications));
    } catch (e) {
      console.error("Failed to persist notifications:", e);
    }
  }, [notifications]);

  // Helper to add a notification
  const triggerNotification = (notif: Omit<AppNotification, "id" | "createdAt" | "read">) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  // User's filtered notifications: ONLY likes and replies from OTHER users on the current user's reports
  const userNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      // 1. Only 'like' or 'reply' types
      if (notif.type !== "like" && notif.type !== "reply") return false;

      // 2. Action must NOT be performed by the current user themselves
      const isActorSelf =
        notif.actorId === userProfile.id ||
        notif.actorUsername === userProfile.username ||
        (currentUser && notif.actorId === currentUser.uid);
      if (isActorSelf) return false;

      // 3. Notification must be on a report authored by the current user or explicitly sent to current user
      const targetReport = reports.find((r) => r.id === notif.targetReportId);
      const isAuthorSelf = targetReport
        ? targetReport.authorId === userProfile.id ||
          targetReport.authorUsername === userProfile.username ||
          (currentUser && targetReport.authorId === currentUser.uid) ||
          targetReport.authorName === userProfile.fullName
        : false;

      const isDirectRecipient =
        notif.recipientId === userProfile.id ||
        (currentUser && notif.recipientId === currentUser.uid) ||
        notif.recipientId === userProfile.username;

      return isAuthorSelf || isDirectRecipient;
    });
  }, [notifications, userProfile, currentUser, reports]);

  const unreadNotificationsCount = userNotifications.filter((n) => !n.read).length;


  // Clean Path route synchronization (no '#' in URLs)
  useEffect(() => {
    const parseCurrentPath = () => {
      const fullPath = window.location.pathname.replace(/^\/+/, "");
      if (fullPath === "profile/edit") {
        setCurrentView("profile_edit");
        return;
      }
      if (fullPath === "verification" || fullPath === "get-verified" || fullPath === "profile/verify") {
        setCurrentView("verification");
        return;
      }
      if (fullPath.startsWith("post/")) {
        const pid = fullPath.replace("post/", "");
        setSelectedPostId(pid);
        setCurrentView("post_detail");
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
        if (hashView === "verification" || hashView === "get-verified" || hashView === "profile/verify") {
          setCurrentView("verification");
          return;
        }
        if (hashView.startsWith("post/")) {
          const pid = hashView.replace("post/", "");
          setSelectedPostId(pid);
          setCurrentView("post_detail");
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

  // Scroll detection to hide/show top category bar and bottom navigation bar
  const [isNavVisible, setIsNavVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          // Always visible at the very top
          if (currentScrollY <= 15) {
            setIsNavVisible(true);
          } else if (currentScrollY > lastScrollY + 3) {
            // Scrolling down (reading feed) -> hide immediately
            setIsNavVisible(false);
          } else if (currentScrollY < lastScrollY - 3) {
            // Scrolling up (navigating back up) -> show immediately
            setIsNavVisible(true);
          }
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Ref to hold the active Firestore user snapshot unsubscribe function
  const [profileUnsub, setProfileUnsub] = useState<Unsubscribe | null>(null);

  // Sync / Load User Profile from Firestore on Auth Change with Real-Time Listener
  const syncUserProfileFromFirestore = (firebaseUser: FirebaseUser) => {
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);

      // Setup real-time listener so changes in Firestore Console reflect instantly
      const unsubscribe = onSnapshot(
        userDocRef,
        async (userDocSnap) => {
          if (userDocSnap.exists()) {
            const savedData = userDocSnap.data() as Partial<UserProfile>;
            const isVerified =
              typeof savedData.verified === "boolean" ? savedData.verified : false;

            const rawData = userDocSnap.data() as any;
            const existingJoiningDate =
              savedData.joiningDate ||
              rawData?.createdAt ||
              new Date().toISOString();

            setUserProfile((prevProfile) => ({
              ...defaultGuestProfile,
              ...prevProfile,
              ...savedData,
              id: firebaseUser.uid,
              fullName: savedData.fullName || firebaseUser.displayName || prevProfile.fullName,
              username:
                savedData.username ||
                (firebaseUser.email
                  ? firebaseUser.email.split("@")[0]
                  : `citizen_${firebaseUser.uid.slice(0, 6)}`),
              location: savedData.location !== undefined ? savedData.location : (prevProfile.location || "Jharkhand, India"),
              bio: savedData.bio !== undefined ? savedData.bio : prevProfile.bio,
              websiteUrl: savedData.websiteUrl !== undefined ? savedData.websiteUrl : prevProfile.websiteUrl,
              avatarUrl: savedData.avatarUrl || firebaseUser.photoURL || prevProfile.avatarUrl,
              verified: isVerified,
              verificationStatus:
                savedData.verificationStatus || (isVerified ? "approved" : "none"),
              category: savedData.category || prevProfile.category || "citizen",
              age: savedData.age !== undefined ? savedData.age : prevProfile.age,
              birthDate: (savedData as any).birthDate || prevProfile.birthDate,
              citizenDetails: savedData.citizenDetails || prevProfile.citizenDetails,
              representativeDetails: savedData.representativeDetails || prevProfile.representativeDetails,
              departmentDetails: savedData.departmentDetails || prevProfile.departmentDetails,
              businessDetails: savedData.businessDetails || prevProfile.businessDetails,
              services: savedData.services || prevProfile.services,
              joiningDate: existingJoiningDate || prevProfile.joiningDate,
            }));
          } else {
            // Automatic New User Profile Generation & Firestore Provisioning
            const nowIso = new Date().toISOString();
            const displayName =
              firebaseUser.displayName ||
              (firebaseUser.email ? firebaseUser.email.split("@")[0] : "Citizen Resident");
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
              systemScore: 0,
              publicRating: 0,
              reviewsCount: 0,
              verified: false, // Default to false for all new accounts
              verificationStatus: "none",
              savedReports: [],
              joiningDate: nowIso,
            };

            setUserProfile((prevProfile) => ({
              ...newProfile,
              age: prevProfile.age,
              birthDate: prevProfile.birthDate,
            }));

            await setDoc(
              userDocRef,
              {
                ...newProfile,
                email: firebaseUser.email || "",
                joiningDate: nowIso,
                createdAt: nowIso,
                lastLogin: nowIso,
              },
              { merge: true }
            );
          }
        },
        (error) => {
          console.warn("Firestore user snapshot notice:", error);
        }
      );

      setProfileUnsub(() => unsubscribe);
    } catch (err) {
      console.warn("User Firestore load notice:", err);
      const displayName =
        firebaseUser.displayName ||
        (firebaseUser.email ? firebaseUser.email.split("@")[0] : "Citizen Resident");
      const username = firebaseUser.email
        ? firebaseUser.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "")
        : `citizen_${firebaseUser.uid.slice(0, 6)}`;

      setUserProfile((prev) => ({
        ...prev,
        id: firebaseUser.uid,
        fullName: displayName,
        username: username,
        avatarUrl: firebaseUser.photoURL || prev.avatarUrl,
        verified: false,
        verificationStatus: "none",
      }));
    }
  };

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        setIsLoggedIn(true);
        syncUserProfileFromFirestore(firebaseUser);
      } else {
        if (profileUnsub) {
          profileUnsub();
          setProfileUnsub(null);
        }
        setCurrentUser(null);
        setIsLoggedIn(false);
        setUserProfile(defaultGuestProfile);
      }
    });

    return () => {
      unsubscribe();
      if (profileUnsub) {
        profileUnsub();
      }
    };
  }, []);

  const navigateTo = (view: string, resetProfile = true) => {
    let targetView = view;
    let newPath = `/${view}`;

    if (view === "dashboard") {
      newPath = "/";
    } else if (view === "profile_edit") {
      newPath = "/profile/edit";
    } else if (view.startsWith("post/")) {
      const pid = view.replace("post/", "");
      setSelectedPostId(pid);
      targetView = "post_detail";
      newPath = `/${view}`;
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

  const handleSelectPost = (reportId: string) => {
    setSelectedPostId(reportId);
    navigateTo(`post/${reportId}`, false);
    setCurrentView("post_detail");
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

  // Fetch initial feed & civic data directly from Firestore database
  const fetchData = async () => {
    try {
      setLoadingReports(true);

      // 1. Fetch Reports directly from Firestore
      const reportsList = await getReportsDirect();
      setReports(reportsList);

      // Trigger background sync for system_stats/trending (topContent & topics)
      syncTrendingStatsInFirestore(reportsList).catch(() => {});

      // 2. Fetch Leaders directly from Firestore
      const leadersList = await getLeadersDirect();
      setLeaders(leadersList);

      // 3. Fetch Infrastructure directly from Firestore
      const infraList = await getInfrastructureDirect();
      setInfrastructure(infraList);
    } catch (err) {
      console.warn("Firestore fetch error:", err);
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
    const reportId = `rep_${Date.now()}`;
    const newReport: ReportIssue = {
      id: reportId,
      authorId: currentUser?.uid || userProfile.id,
      authorName: userProfile.fullName,
      authorUsername: userProfile.username,
      authorAvatar: userProfile.avatarUrl,
      authorCategory: userProfile.category,
      authorVerified: Boolean(userProfile.verified),
      authorBadge: userProfile.verified ? (userProfile.category === "citizen" ? "Verified Citizen" : undefined) : undefined,
      category: newReportData.category,
      text: newReportData.text,
      imageUrl: newReportData.imageUrl || (newReportData.images && newReportData.images[0]) || "",
      images: newReportData.images || (newReportData.imageUrl ? [newReportData.imageUrl] : []),
      structuredDetails: newReportData.structuredDetails || {},
      taggedOfficers: newReportData.taggedOfficers || [],
      taggedLeaders: newReportData.taggedLeaders || [],
      urgencyLevel: newReportData.urgencyLevel || "Normal",
      location: newReportData.location,
      timestamp: new Date().toISOString(),
      createdAt: Date.now(),
      status: "Open",
      departmentStatusLevel: 0,
      likesCount: 0,
      likedBy: [],
      reReportsCount: 0,
      reReportedBy: [],
      repliesCount: 0,
      replies: [],
    };

    // Optimistic UI update
    setReports((prev) => [newReport, ...prev]);
    setUserProfile((prev) => ({
      ...prev,
      postsCount: (prev.postsCount || 0) + 1,
    }));

    // Save directly to Firestore Database
    await saveReportToFirestore(newReport);
    syncTrendingStatsInFirestore([newReport, ...reports]).catch(() => {});

    // Optional backend proxy call if running
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReportData),
      });
    } catch {
      // Ignore if purely serverless
    }
  };

  const handleLikeReport = async (id: string) => {
    requireAuth(async () => {
      const target = reports.find((r) => r.id === id);
      const isLiked = target?.likedBy?.includes(userProfile.id) || false;

      // Optimistic UI update
      setReports((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            const newLikedBy = isLiked
              ? (r.likedBy || []).filter((uid) => uid !== userProfile.id)
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

      // Firestore Database Sync
      await toggleLikeInFirestore(id, userProfile.id, isLiked, {
        actorName: userProfile.fullName,
        actorUsername: userProfile.username,
        targetTitle: target?.text ? (target.text.length > 50 ? `${target.text.slice(0, 50)}...` : target.text) : "Civic Report",
        targetTrackingId: target?.id?.slice(-6) || id.slice(-6),
      });

      // Trigger live notification on like ONLY if someone else's report is being liked (not user's own)
      const isSelfReport =
        target?.authorId === userProfile.id ||
        target?.authorUsername === userProfile.username ||
        (currentUser && target?.authorId === currentUser.uid);

      if (!isLiked && target && !isSelfReport) {
        triggerNotification({
          recipientId: target.authorId || "citizen_guest",
          type: "like",
          actorId: userProfile.id,
          actorName: userProfile.fullName,
          actorUsername: userProfile.username,
          actorAvatar: userProfile.avatarUrl,
          actorCategory: userProfile.category,
          actorBadge: userProfile.verified ? "Citizen" : undefined,
          title: `${userProfile.fullName} upvoted your report`,
          message: `upvoted your civic report on ${target.category || "Issue"}`,
          targetReportId: id,
          timestamp: new Date().toISOString(),
        });
      }

      try {
        await fetch(`/api/reports/${id}/like`, { method: "POST" });
      } catch {
        // Safe for serverless
      }
    }, "like civic reports");
  };

  const handleReReport = async (id: string) => {
    requireAuth(async () => {
      const target = reports.find((r) => r.id === id);
      const hasReReported = target?.reReportedBy?.includes(userProfile.id) || false;

      // Optimistic UI update
      setReports((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            const newReReportedBy = hasReReported
              ? (r.reReportedBy || []).filter((uid) => uid !== userProfile.id)
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

      // Firestore Database Sync
      await toggleReReportInFirestore(id, userProfile.id, hasReReported, {
        actorName: userProfile.fullName,
        actorUsername: userProfile.username,
        targetTitle: target?.text ? (target.text.length > 50 ? `${target.text.slice(0, 50)}...` : target.text) : "Civic Grievance",
        targetTrackingId: target?.id?.slice(-6) || id.slice(-6),
      });

      try {
        await fetch(`/api/reports/${id}/rereport`, { method: "POST" });
      } catch {
        // Safe for serverless
      }
    }, "re-report this grievance");
  };

  const handleBookmark = async (id: string) => {
    requireAuth(async () => {
      const isBookmarked = userProfile.savedReports?.includes(id);
      const newSaved = isBookmarked
        ? (userProfile.savedReports || []).filter((rid) => rid !== id)
        : [...(userProfile.savedReports || []), id];

      const updatedProfile = { ...userProfile, savedReports: newSaved };
      setUserProfile(updatedProfile);

      // Sync user profile bookmark to Firestore
      try {
        const uid = currentUser?.uid || userProfile.id;
        await setDoc(doc(db, "users", uid), { savedReports: newSaved }, { merge: true });

        // Record real-time bookmark engagement in /analytics and /system_stats
        recordEngagementActionInFirestore(isBookmarked ? "un_bookmark" : "bookmark", {
          actorName: userProfile.fullName || "Citizen",
          actorUsername: userProfile.username?.replace(/^@/, "") || "citizen",
          targetTrackingId: id,
        }).catch(() => {});
      } catch (err) {
        console.warn("Bookmark Firestore notice:", err);
      }

      try {
        await fetch(`/api/reports/${id}/bookmark`, { method: "POST" });
      } catch {
        // Safe for serverless
      }
    }, "save bookmarks");
  };

  // Helper to recursively update nested replies in the thread tree
  const updateReplyTree = (
    replies: ThreadedReply[],
    replyId: string,
    updater: (reply: ThreadedReply) => ThreadedReply
  ): ThreadedReply[] => {
    return replies.map((r) => {
      if (r.id === replyId) {
        return updater(r);
      }
      if (r.replies && r.replies.length > 0) {
        return {
          ...r,
          replies: updateReplyTree(r.replies, replyId, updater),
        };
      }
      return r;
    });
  };

  const handleReply = async (
    id: string,
    text: string,
    parentReplyId?: string,
    replyImage?: string
  ) => {
    requireAuth(async () => {
      let replyToUsername: string | undefined;
      if (parentReplyId) {
        const currentReport = reports.find((r) => r.id === id);
        const findAuthor = (replies?: ThreadedReply[]): ThreadedReply | undefined => {
          if (!replies) return undefined;
          for (const r of replies) {
            if (r.id === parentReplyId) return r;
            if (r.replies && r.replies.length > 0) {
              const f = findAuthor(r.replies);
              if (f) return f;
            }
          }
          return undefined;
        };
        const parentRep = findAuthor(currentReport?.replies);
        replyToUsername = parentRep?.authorUsername || parentRep?.authorName;
      }

      const replyObj: ThreadedReply = {
        id: `reply_${Date.now()}`,
        authorId: currentUser?.uid || userProfile.id,
        authorName: userProfile.fullName,
        authorUsername: userProfile.username,
        authorAvatar: userProfile.avatarUrl,
        authorCategory: userProfile.category,
        authorVerified: Boolean(userProfile.verified),
        authorBadge: userProfile.verified ? (userProfile.category === "citizen" ? "Verified Citizen" : undefined) : undefined,
        text,
        imageUrl: replyImage || undefined,
        timestamp: new Date().toISOString(),
        createdAt: Date.now(),
        likesCount: 0,
        likedBy: [],
        reReportsCount: 0,
        reReportedBy: [],
        parentReplyId: parentReplyId || null,
        replyToUsername: replyToUsername || undefined,
      };

      // Optimistic UI update
      setReports((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            return {
              ...r,
              repliesCount: (r.repliesCount || 0) + 1,
              replies: [...(r.replies || []), replyObj],
            };
          }
          return r;
        })
      );

      // Firestore Direct Sync
      const targetRepForReply = reports.find((r) => r.id === id);
      await addReplyInFirestore(id, replyObj, {
        actorName: userProfile.fullName,
        actorUsername: userProfile.username,
        targetTitle: targetRepForReply?.text ? (targetRepForReply.text.length > 50 ? `${targetRepForReply.text.slice(0, 50)}...` : targetRepForReply.text) : "Civic Grievance",
        targetTrackingId: targetRepForReply?.id?.slice(-6) || id.slice(-6),
      });

      // Trigger live notification ONLY if someone else's report is being replied to (not user's own)
      const targetRep = reports.find((r) => r.id === id);
      const isSelfReport =
        targetRep?.authorId === userProfile.id ||
        targetRep?.authorUsername === userProfile.username ||
        (currentUser && targetRep?.authorId === currentUser.uid);

      if (targetRep && !isSelfReport) {
        triggerNotification({
          recipientId: targetRep.authorId || "citizen_guest",
          type: "reply",
          actorId: userProfile.id,
          actorName: userProfile.fullName,
          actorUsername: userProfile.username,
          actorAvatar: userProfile.avatarUrl,
          actorCategory: userProfile.category,
          actorBadge: userProfile.verified ? "Citizen" : undefined,
          title: `${userProfile.fullName} replied to your post`,
          message: text.length > 100 ? `${text.slice(0, 100)}...` : text,
          targetReportId: id,
          timestamp: new Date().toISOString(),
        });
      }

      try {
        await fetch(`/api/reports/${id}/reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, parentReplyId, imageUrl: replyImage }),
        });
      } catch {
        // Safe for serverless
      }
    }, "reply and comment on reports");
  };

  const handleLikeReply = async (reportId: string, replyId: string) => {
    requireAuth(async () => {
      let updatedReplies: ThreadedReply[] = [];

      setReports((prev) =>
        prev.map((r) => {
          if (r.id === reportId) {
            const currentReplies = r.replies || [];
            updatedReplies = updateReplyTree(currentReplies, replyId, (reply) => {
              const isLiked = reply.likedBy?.includes(userProfile.id) || false;
              const newLikedBy = isLiked
                ? (reply.likedBy || []).filter((uid) => uid !== userProfile.id)
                : [...(reply.likedBy || []), userProfile.id];
              return {
                ...reply,
                likedBy: newLikedBy,
                likesCount: isLiked
                  ? Math.max(0, (reply.likesCount || 1) - 1)
                  : (reply.likesCount || 0) + 1,
              };
            });
            return {
              ...r,
              replies: updatedReplies,
            };
          }
          return r;
        })
      );

      if (updatedReplies.length > 0) {
        await updateReportRepliesInFirestore(reportId, updatedReplies);
      }
    }, "like this reply");
  };

  const handleReReportReply = async (reportId: string, replyId: string) => {
    requireAuth(async () => {
      let updatedReplies: ThreadedReply[] = [];

      setReports((prev) =>
        prev.map((r) => {
          if (r.id === reportId) {
            const currentReplies = r.replies || [];
            updatedReplies = updateReplyTree(currentReplies, replyId, (reply) => {
              const hasReReported = reply.reReportedBy?.includes(userProfile.id) || false;
              const newReReportedBy = hasReReported
                ? (reply.reReportedBy || []).filter((uid) => uid !== userProfile.id)
                : [...(reply.reReportedBy || []), userProfile.id];
              return {
                ...reply,
                reReportedBy: newReReportedBy,
                reReportsCount: hasReReported
                  ? Math.max(0, (reply.reReportsCount || 1) - 1)
                  : (reply.reReportsCount || 0) + 1,
              };
            });
            return {
              ...r,
              replies: updatedReplies,
            };
          }
          return r;
        })
      );

      if (updatedReplies.length > 0) {
        await updateReportRepliesInFirestore(reportId, updatedReplies);
      }
    }, "re-report this reply");
  };

  const handleUpdateStatus = async (
    id: string,
    level: number,
    notes?: string,
    resolvedImageUrl?: string
  ) => {
    requireAuth(async () => {
      const statusLabels: ("Open" | "Under Dept Review" | "In Progress" | "Resolved")[] = [
        "Open",
        "Under Dept Review",
        "In Progress",
        "Resolved",
      ];
      const newStatus = statusLabels[level] || "Under Dept Review";
      const claimingDept =
        userProfile.departmentDetails?.name ||
        (userProfile.category === "department"
          ? (userProfile.username || userProfile.fullName)
          : (userProfile.username || userProfile.fullName || "Municipal Corp / PWD"));
      const claimingOfficer = userProfile.username || userProfile.fullName;

      // 1. Optimistic Local State Update for Instant Visual Feedback
      setReports((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            return {
              ...r,
              departmentStatusLevel: level as 0 | 1 | 2 | 3,
              status: newStatus,
              claimedByDept: r.claimedByDept || claimingDept,
              claimedByOfficer: r.claimedByOfficer || claimingOfficer,
              claimedAt: r.claimedAt || "Just now",
              departmentNotes: notes || r.departmentNotes || `Status updated to ${newStatus} by ${claimingDept}.`,
              resolvedImageUrl: resolvedImageUrl || r.resolvedImageUrl,
            };
          }
          return r;
        })
      );

      // 2. Direct Firestore Database Persistence
      await updateReportStatusInFirestore(
        id,
        level,
        newStatus,
        notes,
        claimingDept,
        claimingOfficer,
        resolvedImageUrl
      );

      // 3. Trigger live notification alert for status update
      const targetRep = reports.find((r) => r.id === id);
      triggerNotification({
        recipientId: targetRep?.authorId || "citizen_guest",
        type: "status_update",
        actorId: userProfile.id,
        actorName: userProfile.fullName,
        actorUsername: userProfile.username,
        actorAvatar: userProfile.avatarUrl,
        actorCategory: userProfile.category,
        actorBadge: userProfile.verified ? "Authority" : undefined,
        title: `Report Status: ${newStatus}`,
        message: `${userProfile.fullName} updated ticket #${id.slice(-6).toUpperCase()} to ${newStatus}.${notes ? ` Note: "${notes}"` : ""}`,
        targetReportId: id,
        timestamp: new Date().toISOString(),
        metadata: {
          newStatus: newStatus,
          category: targetRep?.category,
        },
      });

      // 4. Server Route Proxy (Optional / Non-blocking)
      try {
        await fetch(`/api/reports/${id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ level, notes, claimedByDept: claimingDept, claimedByOfficer: claimingOfficer }),
        });
      } catch (err) {
        // Safe fallback for serverless
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
      await saveUserProfileToFirestore(uid, updatedProfile);
    } catch (err) {
      console.warn("Profile Firestore sync notice:", err);
    }
  };

  const handleRateUser = async (userId: string, rating: number, comment: string) => {
    requireAuth(async () => {
      const reviewObj: UserReview = {
        id: `rev_${Date.now()}`,
        authorId: currentUser?.uid || userProfile.id,
        authorName: userProfile.fullName,
        authorUsername: userProfile.username,
        authorAvatar: userProfile.avatarUrl,
        rating,
        comment,
        date: "Just now",
        verifiedVoter: true,
      };

      // Optimistic update for leaders
      setLeaders((prev) =>
        prev.map((l) => {
          if (l.userId === userId || l.id === userId) {
            return {
              ...l,
              reviewsCount: (l.reviewsCount || 0) + 1,
              reviews: [reviewObj, ...(l.reviews || [])],
            };
          }
          return l;
        })
      );

      // Firestore direct sync
      const matchedLeader = leaders.find((l) => l.userId === userId || l.id === userId);
      if (matchedLeader) {
        await submitLeaderReviewInFirestore(matchedLeader.id, reviewObj);
      }
      // Also sync to user document in Firestore
      await submitUserReviewInFirestore(userId, reviewObj);

      try {
        await fetch(`/api/users/${userId}/rate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating, comment }),
        });
      } catch {
        // Safe for serverless
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
      const cleanTargetId = targetUserId.replace(/^@/, "").trim().toLowerCase();
      const targetUsername = selectedViewingProfile?.username
        ? selectedViewingProfile.username.replace(/^@/, "").trim().toLowerCase()
        : cleanTargetId;
      const targetDocId = selectedViewingProfile?.id
        ? selectedViewingProfile.id.replace(/^@/, "").trim().toLowerCase()
        : cleanTargetId;

      const followingList = userProfile.following || [];
      const followingNormalizedSet = new Set(
        followingList.map((f) => f.replace(/^@/, "").trim().toLowerCase())
      );

      const isCurrentlyFollowing =
        followingNormalizedSet.has(cleanTargetId) ||
        (targetUsername ? followingNormalizedSet.has(targetUsername) : false) ||
        (targetDocId ? followingNormalizedSet.has(targetDocId) : false) ||
        Boolean(selectedViewingProfile?.isFollowing);

      const nextFollowing = !isCurrentlyFollowing;

      // 1. Optimistic UI update for current user profile
      const idsToRemove = new Set([
        cleanTargetId,
        targetUsername,
        targetDocId,
        targetUserId,
        `@${cleanTargetId}`,
        `@${targetUsername}`,
      ]);

      const newFollowing = nextFollowing
        ? Array.from(
            new Set([
              ...followingList,
              cleanTargetId,
              ...(targetUsername ? [targetUsername] : []),
            ])
          )
        : followingList.filter(
            (id) =>
              !idsToRemove.has(id.replace(/^@/, "").trim().toLowerCase()) &&
              !idsToRemove.has(id)
          );

      setUserProfile((prev) => ({
        ...prev,
        following: newFollowing,
        followingCount: nextFollowing
          ? (prev.followingCount || 0) + 1
          : Math.max(0, (prev.followingCount || 1) - 1),
      }));

      // 2. Optimistic UI update for target profile if currently viewing
      setSelectedViewingProfile((prev) => {
        if (!prev) return prev;
        const prevId = prev.id?.replace(/^@/, "").trim().toLowerCase();
        const prevUname = prev.username?.replace(/^@/, "").trim().toLowerCase();
        const matches =
          prevId === cleanTargetId ||
          prevUname === cleanTargetId ||
          prevUname === targetUsername;
        if (!matches) return prev;

        const currentFollowers =
          typeof prev.followersCount === "number" ? prev.followersCount : 0;
        return {
          ...prev,
          isFollowing: nextFollowing,
          followersCount: nextFollowing
            ? currentFollowers + 1
            : Math.max(0, currentFollowers - 1),
        };
      });

      // 3. Optimistic UI update for leaders list
      setLeaders((prev) =>
        prev.map((l) => {
          const lId = l.id?.replace(/^@/, "").trim().toLowerCase();
          const lUname = l.username?.replace(/^@/, "").trim().toLowerCase();
          if (lId === cleanTargetId || lUname === cleanTargetId || lUname === targetUsername) {
            const curCount =
              typeof l.followersCount === "number" ? l.followersCount : 0;
            return {
              ...l,
              isFollowing: nextFollowing,
              followersCount: nextFollowing
                ? curCount + 1
                : Math.max(0, curCount - 1),
            };
          }
          return l;
        })
      );

      // 4. Real-time Firestore Database Persistence
      const currentUid = currentUser?.uid || userProfile.id;
      await toggleFollowInFirestore(currentUid, cleanTargetId, isCurrentlyFollowing);

      // 5. Send Notification if user just followed someone
      if (nextFollowing) {
        triggerNotification({
          recipientId: targetUserId,
          type: "like",
          actorId: userProfile.id,
          actorName: userProfile.fullName,
          actorUsername: userProfile.username,
          actorAvatar: userProfile.avatarUrl,
          actorCategory: userProfile.category,
          actorBadge: userProfile.verified ? "Citizen" : undefined,
          title: `${userProfile.fullName} started following you`,
          message: `is now following your civic updates and reports`,
          timestamp: new Date().toISOString(),
        });
      }

      // 6. Optional backend server proxy
      try {
        await fetch(`/api/users/${cleanTargetId}/follow`, {
          method: "POST",
        });
      } catch {
        // Safe for serverless
      }
    }, "follow users and representatives");
  };

  const handleDeleteReport = async (reportId: string) => {
    // 1. Optimistic removal from state
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    // 2. Delete from Firestore
    await deleteReportInFirestore(reportId);
    // 3. Delete from backend server
    try {
      await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
    } catch (e) {
      console.warn("Delete API notice:", e);
    }
  };

  const handleTogglePinReport = async (reportId: string, isCurrentlyPinned?: boolean) => {
    const nextPinned = !isCurrentlyPinned;
    // 1. Optimistic update in state
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, isPinned: nextPinned } : r))
    );
    // 2. Update Firestore
    await togglePinReportInFirestore(reportId, nextPinned);
    // 3. Update backend server
    try {
      await fetch(`/api/reports/${reportId}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: nextPinned }),
      });
    } catch (e) {
      console.warn("Pin API notice:", e);
    }
  };

  const handleMentionProfile = (targetProfile: UserProfile) => {
    const rawUsername = targetProfile.username
      ? targetProfile.username.replace(/^@+/, "").trim()
      : targetProfile.fullName.toLowerCase().replace(/\s+/g, "_");
    setComposeInitialMention(`@${rawUsername}`);
    navigateTo("compose");
  };

  const handleClaimProfile = async (
    profileId: string,
    credentials: {
      email: string;
      password?: string;
      officerName: string;
      designation: string;
      departmentCode?: string;
    }
  ) => {
    try {
      await claimOfficialProfileInFirestore(profileId, credentials);
      // Update viewing profile
      setSelectedViewingProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          isClaimed: true,
          isClaimable: false,
          verified: true,
          email: credentials.email,
          claimedByOfficerName: credentials.officerName,
          departmentDetails: {
            ...prev.departmentDetails,
            name: prev.departmentDetails?.name || prev.name,
            designation: credentials.designation,
            departmentCode: credentials.departmentCode || prev.departmentDetails?.departmentCode || "",
            jurisdiction: prev.departmentDetails?.jurisdiction || "Jharkhand",
          },
        };
      });
      // Update active user profile
      setUserProfile((prev) => ({
        ...prev,
        isClaimed: true,
        isClaimable: false,
        verified: true,
        email: credentials.email,
        claimedByOfficerName: credentials.officerName,
      }));
      setIsLoggedIn(true);
      triggerNotification({
        recipientId: credentials.email || profileId,
        type: "official_action",
        actorId: profileId,
        actorName: credentials.officerName || "Open Desh Governance",
        actorUsername: "system_admin",
        actorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80",
        title: "Official Profile Claimed",
        message: `Official administrative ownership has been claimed and verified for ${credentials.officerName}.`,
        timestamp: "Just now",
      });
    } catch (err: any) {
      console.error("Error claiming profile:", err);
      throw err;
    }
  };

  // Inspect any user's profile dynamically
  const openExternalProfile = (targetProfile: UserProfile) => {
    setSelectedViewingProfile(targetProfile);
    navigateTo("profile", false);

    // Record real-time profile visit in /analytics/overview_7days and /system_stats/overview
    recordEngagementActionInFirestore("profile_visit", {
      actorName: userProfile.fullName || "Citizen",
      actorUsername: userProfile.username?.replace(/^@/, "") || "citizen",
      targetTitle: targetProfile.fullName || targetProfile.username,
      category: targetProfile.category || "user",
    }).catch(() => {});
  };

  const handleSelectUserProfile = async (userId: string) => {
    const cleanId = (userId || "").trim();
    const cleanUsername = cleanId.replace(/^@/, "").toLowerCase();

    // If viewing own profile (check all possible identity matchers)
    const isSelf =
      isLoggedIn &&
      (
        cleanId.toLowerCase() === userProfile.id?.toLowerCase() ||
        (currentUser?.uid && cleanId.toLowerCase() === currentUser.uid.toLowerCase()) ||
        (userProfile.username && cleanUsername === userProfile.username.replace(/^@/, "").toLowerCase()) ||
        (userProfile.email && cleanId.toLowerCase() === userProfile.email.toLowerCase())
      );

    if (isSelf) {
      setSelectedViewingProfile(null);
      navigateTo("profile", true);
      return;
    }

    const followingNormalizedSet = new Set(
      (userProfile.following || []).map((f) =>
        f.replace(/^@/, "").trim().toLowerCase()
      )
    );

    // 1. Check if it's a leader in the leader list
    const matchedLeader = leaders.find(
      (l) =>
        l.id === cleanId ||
        l.username.replace(/^@/, "").toLowerCase() === cleanUsername
    );
    if (matchedLeader) {
      handleSelectLeaderProfile(matchedLeader);
      return;
    }

    // 2. Try Firestore Direct ID query
    try {
      const userDocRef = doc(db, "users", cleanId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        const followers = Array.isArray(data.followers) ? data.followers : [];
        const isFollowed =
          followingNormalizedSet.has(userDocSnap.id.toLowerCase()) ||
          (data.username &&
            followingNormalizedSet.has(
              data.username.replace(/^@/, "").toLowerCase()
            )) ||
          followers.some(
            (f: string) =>
              f.replace(/^@/, "").toLowerCase() === userProfile.id.toLowerCase() ||
              (userProfile.username &&
                f.replace(/^@/, "").toLowerCase() ===
                  userProfile.username.replace(/^@/, "").toLowerCase())
          );

        const authoredReports = reports.filter((r) => {
          const rAuthorId = r.authorId?.toLowerCase();
          const rAuthorUsername = r.authorUsername?.replace(/^@/, "").toLowerCase();
          return (
            rAuthorId === userDocSnap.id.toLowerCase() ||
            (data.username &&
              rAuthorUsername === data.username.replace(/^@/, "").toLowerCase())
          );
        });

        const matchingReport = reports.find(
          (r) => r.authorId?.toLowerCase() === userDocSnap.id.toLowerCase()
        );
        const isRawUidString = (str?: string) => Boolean(str && /^[a-zA-Z0-9_-]{20,}$/.test(str.replace(/^@/, "")));

        const resolvedFullName =
          (data.fullName && !isRawUidString(data.fullName))
            ? data.fullName
            : matchingReport?.authorName || (data.username && !isRawUidString(data.username) ? data.username : `Citizen (${userDocSnap.id.slice(0, 6)})`);
            
        const resolvedUsername =
          (data.username && !isRawUidString(data.username))
            ? data.username.replace(/^@/, "")
            : matchingReport?.authorUsername?.replace(/^@/, "") || `citizen_${userDocSnap.id.slice(0, 6)}`;
            
        const resolvedAvatar =
          data.avatarUrl || matchingReport?.authorAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80";

        const targetProfile: UserProfile = {
          id: userDocSnap.id,
          fullName: resolvedFullName,
          username: resolvedUsername,
          avatarUrl: resolvedAvatar,
          ...data,
          followersCount:
            typeof data.followersCount === "number"
              ? data.followersCount
              : followers.length,
          followingCount:
            typeof data.followingCount === "number"
              ? data.followingCount
              : Array.isArray(data.following)
              ? data.following.length
              : 0,
          postsCount: authoredReports.length,
          isFollowing: isFollowed,
        } as UserProfile;

        openExternalProfile(targetProfile);
        return;
      }
    } catch (err) {
      console.warn("Firestore ID fetch notice:", err);
    }

    // 3. Try Firestore query by username
    try {
      const usersCol = collection(db, "users");
      const q = query(usersCol, where("username", "==", cleanUsername));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const foundDoc = querySnap.docs[0];
        const data = foundDoc.data();
        const followers = Array.isArray(data.followers) ? data.followers : [];
        const isFollowed =
          followingNormalizedSet.has(foundDoc.id.toLowerCase()) ||
          (data.username &&
            followingNormalizedSet.has(
              data.username.replace(/^@/, "").toLowerCase()
            )) ||
          followers.some(
            (f: string) =>
              f.replace(/^@/, "").toLowerCase() === userProfile.id.toLowerCase() ||
              (userProfile.username &&
                f.replace(/^@/, "").toLowerCase() ===
                  userProfile.username.replace(/^@/, "").toLowerCase())
          );

        const authoredReports = reports.filter((r) => {
          const rAuthorId = r.authorId?.toLowerCase();
          const rAuthorUsername = r.authorUsername?.replace(/^@/, "").toLowerCase();
          return (
            rAuthorId === foundDoc.id.toLowerCase() ||
            rAuthorUsername === cleanUsername
          );
        });

        const targetProfile: UserProfile = {
          id: foundDoc.id,
          ...data,
          followersCount:
            typeof data.followersCount === "number"
              ? data.followersCount
              : followers.length,
          followingCount:
            typeof data.followingCount === "number"
              ? data.followingCount
              : Array.isArray(data.following)
              ? data.following.length
              : 0,
          postsCount:
            typeof data.postsCount === "number" && data.postsCount > 0
              ? data.postsCount
              : authoredReports.length,
          isFollowing: isFollowed,
        } as UserProfile;

        openExternalProfile(targetProfile);
        return;
      }
    } catch (err) {
      console.warn("Firestore username fetch notice:", err);
    }

    // 4. Try backend API fallback
    try {
      const res = await fetch(`/api/users/${cleanId}`);
      if (res.ok) {
        const targetProfile: UserProfile = await res.json();
        const isFollowed =
          followingNormalizedSet.has(targetProfile.id.toLowerCase()) ||
          (targetProfile.username &&
            followingNormalizedSet.has(
              targetProfile.username.replace(/^@/, "").toLowerCase()
            )) ||
          targetProfile.isFollowing ||
          false;
        openExternalProfile({
          ...targetProfile,
          isFollowing: isFollowed,
        });
        return;
      }
    } catch (err) {
      console.warn("API user fetch notice:", err);
    }

    // 5. Fallback from existing reports author data
    const matchedReport = reports.find(
      (r) =>
        r.authorId === cleanId ||
        r.authorUsername?.replace(/^@/, "").toLowerCase() === cleanUsername
    );
    if (matchedReport) {
      const isFollowed =
        followingNormalizedSet.has(matchedReport.authorId.toLowerCase()) ||
        (matchedReport.authorUsername &&
          followingNormalizedSet.has(
            matchedReport.authorUsername.replace(/^@/, "").toLowerCase()
          )) ||
        false;

      const matchingReports = reports.filter(
        (r) =>
          r.authorId === matchedReport.authorId ||
          r.authorUsername?.replace(/^@/, "").toLowerCase() === cleanUsername
      );

      const fallbackProfile: UserProfile = {
        id: matchedReport.authorId,
        fullName: matchedReport.authorName,
        username: matchedReport.authorUsername?.replace(/^@/, "") || cleanUsername,
        bio: `Active civic contributor in Open Desh.`,
        location: matchedReport.location?.city || "Jharkhand, India",
        websiteUrl: "",
        avatarUrl:
          matchedReport.authorAvatar ||
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80",
        category: matchedReport.authorCategory || "citizen",
        followersCount: isFollowed ? 1 : 0,
        followingCount: 0,
        postsCount: matchingReports.length,
        systemScore: 0,
        publicRating: 0,
        reviewsCount: 0,
        verified:
          matchedReport.authorCategory === "department" ||
          matchedReport.authorCategory === "representative",
        isFollowing: isFollowed,
      };

      openExternalProfile(fallbackProfile);
      return;
    }
  };

  // When a leader is clicked in LeaderTracker, synchronize their profile
  const handleSelectLeaderProfile = (leader: Leader) => {
    const isLeaderSelf =
      isLoggedIn &&
      (
        leader.id?.toLowerCase() === userProfile.id?.toLowerCase() ||
        (currentUser?.uid && leader.id?.toLowerCase() === currentUser.uid.toLowerCase()) ||
        (leader.userId && leader.userId.toLowerCase() === userProfile.id?.toLowerCase()) ||
        (currentUser?.uid && leader.userId && leader.userId.toLowerCase() === currentUser.uid.toLowerCase()) ||
        (userProfile.username && leader.username?.replace(/^@/, "").toLowerCase() === userProfile.username.replace(/^@/, "").toLowerCase())
      );

    if (isLeaderSelf) {
      setSelectedViewingProfile(null);
      navigateTo("profile", true);
      return;
    }

    const isFollowed =
      (userProfile.following || []).includes(leader.id) ||
      (leader.userId && (userProfile.following || []).includes(leader.userId)) ||
      (leader.username &&
        (userProfile.following || []).includes(
          leader.username.replace(/^@/, "")
        )) ||
      leader.isFollowing ||
      false;

    const leaderProfile: UserProfile = {
      id: leader.id,
      fullName: leader.name,
      username: leader.username.replace(/^@/, ""),
      bio: leader.bio,
      location: leader.location,
      websiteUrl:
        leader.websiteUrl || `https://instagram.com/${leader.username}`,
      avatarUrl: leader.image,
      category: "representative",
      representativeDetails: {
        party: leader.party,
        position: leader.title,
        constituency: leader.constituency,
        termYears: "2024-2029",
        legislativeBody: "State Assembly",
      },
      followersCount:
        typeof leader.followersCount === "number"
          ? leader.followersCount
          : leader.category === "ruling"
          ? 380000
          : 210000,
      followingCount: 18,
      postsCount: 8235,
      systemScore: leader.systemScore,
      publicRating: leader.publicRating,
      reviewsCount: leader.reviewsCount || 14000,
      reviews: leader.reviews || [],
      verified: true,
      isFollowing: isFollowed,
    };
    openExternalProfile(leaderProfile);
  };

  const handleOpenCompose = () => {
    requireAuth(() => {
      setComposeInitialMention(null);
      navigateTo("compose");
    }, "file and report a civic grievance");
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
          unreadNotificationsCount={unreadNotificationsCount}
          isLoggedIn={isLoggedIn}
          onOpenLogin={() => {
            setAuthActionReason("Sign in to unlock verified citizen actions.");
            navigateTo("login");
          }}
          onLogout={handleLogout}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
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
        {/* Navigation Header - Rendered on dashboard/aitutor etc., but Profile, Settings, Search, Compose, Login, Connect, Notifications, Budget, Leader, Infrastructure, PostDetail & Edit Profile use their own custom X-style header */}
        {currentView !== "profile" &&
          currentView !== "profile_edit" &&
          currentView !== "login" &&
          currentView !== "settings" &&
          currentView !== "search" &&
          currentView !== "compose" &&
          currentView !== "connect" &&
          currentView !== "notifications" &&
          currentView !== "budget" &&
          currentView !== "leader" &&
          currentView !== "infrastructure" &&
          currentView !== "verification" &&
          currentView !== "post_detail" &&
          currentView !== "post" && (
            <Header
              currentView={currentView}
              onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
              onNavigate={navigateTo}
              userProfile={userProfile}
              searchQuery={bookmarkSearchQuery}
              onSearchQueryChange={setBookmarkSearchQuery}
              bookmarkedCount={bookmarkedReports.length}
              unreadNotificationsCount={unreadNotificationsCount}
              isLoggedIn={isLoggedIn}
              visible={isNavVisible}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
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
              onSelectPost={handleSelectPost}
              onDeleteReport={handleDeleteReport}
              onTogglePinReport={handleTogglePinReport}
              onMuteUser={handleMuteUser}
              mutedUsers={mutedUsers}
              loading={loadingReports}
              isNavVisible={isNavVisible}
              selectedCategory={selectedCategory}
              onOpenInstallModal={() => setIsInstallModalOpen(true)}
            />
          )}

          {/* DEDICATED POST DETAILS & THREAD VIEW (Twitter/X Style) */}
          {(currentView === "post_detail" || currentView === "post") && (
            <PostDetailView
              report={
                reports.find((r) => r.id === selectedPostId) ||
                reports[0] || {
                  id: "unknown",
                  authorId: "unknown",
                  authorName: "Citizen",
                  authorUsername: "citizen",
                  authorAvatar: userProfile.avatarUrl,
                  authorCategory: "citizen",
                  category: "Infrastructure",
                  text: "Post not found or has been moved.",
                  location: { lat: 23.3441, lng: 85.3096, city: "Jharkhand" },
                  timestamp: "Recently",
                  status: "Open",
                  departmentStatusLevel: 0,
                  likesCount: 0,
                  reReportsCount: 0,
                  repliesCount: 0,
                }
              }
              userProfile={userProfile}
              onBack={() => navigateTo("dashboard")}
              onLike={handleLikeReport}
              onReReport={handleReReport}
              onBookmark={handleBookmark}
              onReply={handleReply}
              onLikeReply={handleLikeReply}
              onReReportReply={handleReReportReply}
              onUpdateStatus={handleUpdateStatus}
              onSelectUser={handleSelectUserProfile}
              onToggleFollow={handleToggleFollow}
              onDeleteReport={handleDeleteReport}
              onTogglePinReport={handleTogglePinReport}
              onMuteUser={handleMuteUser}
              mutedUsers={mutedUsers}
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

          {/* DEDICATED FULL-PAGE VERIFICATION PORTAL (No Modal) */}
          {currentView === "verification" && (
            <VerificationView
              userProfile={userProfile}
              onSave={async (updated) => {
                await handleUpdateProfile(updated);
              }}
              onCancel={() => navigateTo("profile")}
            />
          )}

          {currentView === "compose" && (
            <ComposeGrievanceView
              userProfile={userProfile}
              leaders={leaders}
              initialMention={composeInitialMention || undefined}
              onCancel={() => {
                setComposeInitialMention(null);
                navigateTo("dashboard");
              }}
              onSubmit={async (data) => {
                await handleCreateReport(data);
                setComposeInitialMention(null);
                navigateTo("dashboard");
              }}
            />
          )}

          {currentView === "aitutor" && <HelpView />}

          {(currentView === "connect" || currentView === "leader") && (
            <ConnectHubView
              userProfile={userProfile}
              leaders={leaders}
              reports={reports}
              onBack={() => navigateTo("dashboard")}
              onSelectUser={handleSelectUserProfile}
              onSelectLeaderProfile={handleSelectLeaderProfile}
              onToggleFollow={handleToggleFollow}
              onRateLeader={async (leaderId, rating, comment) => {
                await handleRateUser(leaderId, rating, comment);
              }}
              initialTab={currentView === "leader" ? "leaders" : "leaders"}
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
              onSelectPost={handleSelectPost}
              onDeleteReport={handleDeleteReport}
              onTogglePinReport={handleTogglePinReport}
              onMuteUser={handleMuteUser}
              mutedUsers={mutedUsers}
              searchQuery={bookmarkSearchQuery}
              onSearchQueryChange={setBookmarkSearchQuery}
            />
          )}

          {currentView === "profile" && (
            <ProfileView
              key={activeProfileToRender.id}
              userProfile={activeProfileToRender}
              activeUser={userProfile}
              isLoggedIn={isLoggedIn}
              allReports={reports}
              userReports={reports.filter((r) => {
                const targetUname = activeProfileToRender.username
                  ?.replace(/^@/, "")
                  .toLowerCase();
                const targetId = activeProfileToRender.id?.toLowerCase();
                const rAuthorUname = r.authorUsername
                  ?.replace(/^@/, "")
                  .toLowerCase();
                const rAuthorId = r.authorId?.toLowerCase();

                const isAuthor =
                  (targetId && rAuthorId === targetId) ||
                  (targetUname && rAuthorUname === targetUname);

                const isTagged =
                  targetUname &&
                  (r.taggedOfficials?.some(
                    (t) => t.replace(/^@/, "").toLowerCase() === targetUname
                  ) ||
                    r.routedDepartment?.toLowerCase().includes(targetUname));

                return (
                  isAuthor ||
                  (activeProfileToRender.category === "department" && isTagged) ||
                  (activeProfileToRender.category === "representative" && isTagged)
                );
              })}
              onBack={() => {
                setSelectedViewingProfile(null);
                navigateTo("dashboard");
              }}
              onNavigateToEditProfile={() => navigateTo("profile_edit")}
              onNavigateToVerification={() => navigateTo("verification")}
              onUpdateProfile={handleUpdateProfile}
              onRateUser={async (rating, comment) => {
                await handleRateUser(activeProfileToRender.id, rating, comment);
              }}
              onReplyToReview={handleReplyToReview}
              onToggleFollow={handleToggleFollow}
              onMentionUser={handleMentionProfile}
              onNavigateToPost={(reportId) => {
                handleSelectPost(reportId);
              }}
              onLikeReport={handleLikeReport}
              onReReport={handleReReport}
              onBookmark={handleBookmark}
              onReply={handleReply}
              onDeleteReport={handleDeleteReport}
              onTogglePinReport={handleTogglePinReport}
              onMuteUser={handleMuteUser}
              mutedUsers={mutedUsers}
              onSelectUser={handleSelectUserProfile}
              onClaimProfile={handleClaimProfile}
            />
          )}

          {currentView === "settings" && (
            <SettingsView
              userProfile={userProfile}
              onUpdateProfile={handleUpdateProfile}
              onNavigate={navigateTo}
              onBackToHome={() => navigateTo("dashboard")}
              onOpenInstallModal={() => setIsInstallModalOpen(true)}
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
              onSelectPost={handleSelectPost}
              onLikeReport={handleLikeReport}
              onReReport={handleReReport}
              onBookmark={handleBookmark}
              onReply={handleReply}
              onDeleteReport={handleDeleteReport}
              onTogglePinReport={handleTogglePinReport}
              onMuteUser={handleMuteUser}
              mutedUsers={mutedUsers}
              onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            />
          )}

          {currentView === "notifications" && (
            <NotificationsView
              notifications={userNotifications}
              reports={reports}
              userProfile={userProfile}
              onMarkAsRead={handleMarkNotificationAsRead}
              onMarkAllAsRead={handleMarkAllNotificationsAsRead}
              onClearAll={handleClearAllNotifications}
              onSelectPost={(postId) => handleSelectPost(postId)}
              onSelectUser={(userId) => handleSelectUserProfile(userId)}
              onLikeReport={handleLikeReport}
              onReReport={handleReReport}
              onBookmark={handleBookmark}
              onBack={() => navigateTo("dashboard")}
            />
          )}

          {currentView === "budget" && (
            <BudgetView
              onBack={() => navigateTo("dashboard")}
              onOpenCompose={(mention, defaultText) => {
                setComposeInitialMention(mention || null);
                navigateTo("compose");
              }}
            />
          )}

          {currentView === "help" && <HelpView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Hidden during full-screen Compose, Login, Profile views, and Post Detail thread view) */}
      {currentView !== "compose" &&
        currentView !== "login" &&
        currentView !== "profile_edit" &&
        currentView !== "post_detail" &&
        currentView !== "post" &&
        currentView !== "profile" &&
        currentView !== "public-profile" && (
          <BottomNav
            currentView={currentView}
            onNavigate={navigateTo}
            onOpenCreateReport={handleOpenCompose}
            unreadNotificationsCount={unreadNotificationsCount}
            visible={isNavVisible}
          />
        )}

      {/* Global Indian Language Selection Modal */}
      <LanguageSelectModal />

      {/* PWA Install App Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
}


