import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import {
  ReportIssue,
  Leader,
  InfrastructureProject,
  UserProfile,
  UserCategory,
  UserReview,
  ThreadedReply,
} from "../types";
import {
  INITIAL_LEADERS,
  INITIAL_REPORTS,
  INITIAL_INFRASTRUCTURE,
  INITIAL_USERS,
  INITIAL_USER_PROFILE,
} from "../data/seedData";

// Helper to sanitize Firestore documents
function sanitizeData<T>(data: T): any {
  return JSON.parse(JSON.stringify(data));
}

// 1. Fetch Reports with Firestore direct + Auto-Seed
export async function getReportsDirect(): Promise<ReportIssue[]> {
  try {
    const repRef = collection(db, "reports");
    const snapshot = await getDocs(repRef);

    if (!snapshot.empty) {
      const reports: ReportIssue[] = [];
      snapshot.forEach((docSnap) => {
        reports.push(docSnap.data() as ReportIssue);
      });
      // Sort newest first
      return reports.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
    } else {
      // Seed Firestore with initial reports
      for (const rep of INITIAL_REPORTS) {
        try {
          await setDoc(doc(db, "reports", rep.id), sanitizeData(rep));
        } catch (e) {
          console.warn("Seeding report error:", e);
        }
      }
      return INITIAL_REPORTS;
    }
  } catch (err) {
    console.warn("Firestore reports fetch notice (using local seed fallback):", err);
    return INITIAL_REPORTS;
  }
}

// 2. Fetch Leaders with Firestore direct + Auto-Seed
export async function getLeadersDirect(): Promise<Leader[]> {
  try {
    const leadRef = collection(db, "leaders");
    const snapshot = await getDocs(leadRef);

    if (!snapshot.empty) {
      const leaders: Leader[] = [];
      snapshot.forEach((docSnap) => {
        leaders.push(docSnap.data() as Leader);
      });
      return leaders;
    } else {
      // Seed Firestore with initial leaders
      for (const leader of INITIAL_LEADERS) {
        try {
          await setDoc(doc(db, "leaders", leader.id), sanitizeData(leader));
        } catch (e) {
          console.warn("Seeding leader error:", e);
        }
      }
      return INITIAL_LEADERS;
    }
  } catch (err) {
    console.warn("Firestore leaders fetch notice (using local seed fallback):", err);
    return INITIAL_LEADERS;
  }
}

// 3. Fetch Infrastructure Projects with Firestore direct + Auto-Seed
export async function getInfrastructureDirect(): Promise<InfrastructureProject[]> {
  try {
    const infraRef = collection(db, "infrastructure");
    const snapshot = await getDocs(infraRef);

    if (!snapshot.empty) {
      const projects: InfrastructureProject[] = [];
      snapshot.forEach((docSnap) => {
        projects.push(docSnap.data() as InfrastructureProject);
      });
      return projects;
    } else {
      // Seed Firestore with initial infrastructure projects
      for (const proj of INITIAL_INFRASTRUCTURE) {
        try {
          await setDoc(doc(db, "infrastructure", proj.id), sanitizeData(proj));
        } catch (e) {
          console.warn("Seeding infra project error:", e);
        }
      }
      return INITIAL_INFRASTRUCTURE;
    }
  } catch (err) {
    console.warn("Firestore infrastructure fetch notice (using local seed fallback):", err);
    return INITIAL_INFRASTRUCTURE;
  }
}

// 4. Save New Grievance Report to Firestore
export async function saveReportToFirestore(report: ReportIssue): Promise<void> {
  try {
    const repDoc = doc(db, "reports", report.id);
    await setDoc(repDoc, sanitizeData(report));
  } catch (err) {
    console.warn("Error saving report directly to Firestore:", err);
  }
}

// 5. Toggle Like in Firestore
export async function toggleLikeInFirestore(reportId: string, userId: string, isCurrentlyLiked: boolean): Promise<void> {
  try {
    const repDoc = doc(db, "reports", reportId);
    await updateDoc(repDoc, {
      likesCount: increment(isCurrentlyLiked ? -1 : 1),
      likedBy: isCurrentlyLiked ? arrayRemove(userId) : arrayUnion(userId),
    });
  } catch (err) {
    console.warn("Firestore like toggle notice:", err);
  }
}

// 6. Toggle Re-Report in Firestore
export async function toggleReReportInFirestore(reportId: string, userId: string, isCurrentlyReReported: boolean): Promise<void> {
  try {
    const repDoc = doc(db, "reports", reportId);
    await updateDoc(repDoc, {
      reReportsCount: increment(isCurrentlyReReported ? -1 : 1),
      reReportedBy: isCurrentlyReReported ? arrayRemove(userId) : arrayUnion(userId),
    });
  } catch (err) {
    console.warn("Firestore re-report toggle notice:", err);
  }
}

// 7. Add Reply to Report in Firestore
export async function addReplyInFirestore(reportId: string, reply: ThreadedReply): Promise<void> {
  try {
    const repDoc = doc(db, "reports", reportId);
    await updateDoc(repDoc, {
      repliesCount: increment(1),
      replies: arrayUnion(sanitizeData(reply)),
    });
  } catch (err) {
    console.warn("Firestore reply notice:", err);
  }
}

// 7b. Update Entire Replies Tree in Firestore (for reply likes, reply rereports, nested replies)
export async function updateReportRepliesInFirestore(reportId: string, replies: ThreadedReply[]): Promise<void> {
  try {
    const repDoc = doc(db, "reports", reportId);
    await updateDoc(repDoc, {
      replies: sanitizeData(replies),
    });
  } catch (err) {
    console.warn("Firestore update replies notice:", err);
  }
}

// 8. Submit Voter Review for a Leader in Firestore
export async function submitLeaderReviewInFirestore(leaderId: string, review: UserReview): Promise<void> {
  try {
    const leadDoc = doc(db, "leaders", leaderId);
    await updateDoc(leadDoc, {
      reviewsCount: increment(1),
      reviews: arrayUnion(sanitizeData(review)),
    });
  } catch (err) {
    console.warn("Firestore leader review notice:", err);
  }
}

// 8b. Submit User / Business Review to Firestore users collection
export async function submitUserReviewInFirestore(userId: string, review: UserReview): Promise<void> {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      reviewsCount: increment(1),
      reviews: arrayUnion(sanitizeData(review)),
    });
  } catch (err) {
    console.warn("Firestore user review notice:", err);
  }
}

// 9. Update Report Official Action Status in Firestore
export async function updateReportStatusInFirestore(
  reportId: string,
  level: number,
  status: string,
  notes?: string,
  claimedByDept?: string,
  claimedByOfficer?: string,
  resolvedImageUrl?: string
): Promise<void> {
  try {
    const repDoc = doc(db, "reports", reportId);
    const updatePayload: Record<string, any> = {
      departmentStatusLevel: level,
      status: status,
    };
    if (notes) {
      updatePayload.departmentNotes = notes;
    }
    if (claimedByDept) {
      updatePayload.claimedByDept = claimedByDept;
    }
    if (claimedByOfficer) {
      updatePayload.claimedByOfficer = claimedByOfficer;
    }
    if (resolvedImageUrl) {
      updatePayload.resolvedImageUrl = resolvedImageUrl;
    }
    if (level > 0) {
      updatePayload.claimedAt = "Just now";
    }
    await updateDoc(repDoc, updatePayload);
  } catch (err) {
    console.warn("Firestore status update notice:", err);
  }
}

// 10. Explicit Seeder that writes all collections immediately to Firestore
export async function seedAllCollectionsToFirestore(): Promise<void> {
  try {
    // Seed Leaders
    for (const leader of INITIAL_LEADERS) {
      await setDoc(doc(db, "leaders", leader.id), sanitizeData(leader), { merge: true });
    }
    // Seed Reports
    for (const rep of INITIAL_REPORTS) {
      await setDoc(doc(db, "reports", rep.id), sanitizeData(rep), { merge: true });
    }
    // Seed Infrastructure
    for (const proj of INITIAL_INFRASTRUCTURE) {
      await setDoc(doc(db, "infrastructure", proj.id), sanitizeData(proj), { merge: true });
    }
    // Seed System Users
    for (const [uid, uProf] of Object.entries(INITIAL_USERS)) {
      await setDoc(doc(db, "users", uid), sanitizeData(uProf), { merge: true });
    }
    console.log("Firestore: All collections successfully populated in Asia database!");
  } catch (err) {
    console.warn("Firestore seeding notice:", err);
  }
}

// 11. Fetch All Registered Official Authorities & Leaders from Firestore
export interface RegisteredAuthority {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  category: UserCategory;
  role: string;
  badge: string;
  departmentCode?: string;
  party?: string;
  verified: boolean;
  location?: string;
  jurisdictionRegion?: string;
  constituency?: string;
}

export async function getRegisteredAuthoritiesDirect(): Promise<RegisteredAuthority[]> {
  const authoritiesMap = new Map<string, RegisteredAuthority>();

  // 1. Load initial hardcoded seeds first as baseline
  Object.values(INITIAL_USERS).forEach((u) => {
    if (u.category === "department" || u.category === "representative") {
      const uname = u.username.toLowerCase();
      authoritiesMap.set(uname, {
        id: u.id,
        username: u.username,
        fullName: u.fullName,
        avatarUrl: u.avatarUrl,
        category: u.category,
        role: u.departmentDetails?.designation || u.representativeDetails?.position || (u.category === "department" ? "Official Department" : "Elected Representative"),
        badge: u.departmentDetails?.officialBadge || u.representativeDetails?.party || "Verified Profile",
        departmentCode: u.departmentDetails?.departmentCode,
        party: u.representativeDetails?.party,
        verified: u.verified ?? true,
        location: u.location,
        jurisdictionRegion: u.departmentDetails?.jurisdictionRegion,
        constituency: u.representativeDetails?.constituency,
      });
    }
  });

  INITIAL_LEADERS.forEach((l) => {
    const uname = l.username.toLowerCase();
    if (!authoritiesMap.has(uname)) {
      authoritiesMap.set(uname, {
        id: l.id,
        username: l.username,
        fullName: l.name,
        avatarUrl: l.image,
        category: "representative",
        role: l.title,
        badge: l.party,
        party: l.party,
        verified: true,
        location: l.location,
        constituency: l.constituency,
      });
    }
  });

  try {
    // 2. Fetch live users from Firestore `users` collection
    const usersRef = collection(db, "users");
    const userSnaps = await getDocs(usersRef);
    userSnaps.forEach((docSnap) => {
      const data = docSnap.data() as UserProfile;
      if (data && (data.category === "department" || data.category === "representative" || data.verified)) {
        const uname = data.username?.toLowerCase();
        if (uname) {
          authoritiesMap.set(uname, {
            id: data.id || docSnap.id,
            username: data.username,
            fullName: data.fullName,
            avatarUrl: data.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
            category: data.category || "citizen",
            role: data.departmentDetails?.designation || data.representativeDetails?.position || (data.category === "department" ? "Govt Dept" : "Citizen"),
            badge: data.departmentDetails?.officialBadge || data.representativeDetails?.party || (data.verified ? "Verified" : "Citizen"),
            departmentCode: data.departmentDetails?.departmentCode,
            party: data.representativeDetails?.party,
            verified: data.verified ?? true,
            location: data.location,
            jurisdictionRegion: data.departmentDetails?.jurisdictionRegion,
            constituency: data.representativeDetails?.constituency,
          });
        }
      }
    });

    // 3. Fetch live leaders from Firestore `leaders` collection
    const leadersRef = collection(db, "leaders");
    const leaderSnaps = await getDocs(leadersRef);
    leaderSnaps.forEach((docSnap) => {
      const l = docSnap.data() as Leader;
      if (l && l.username) {
        const uname = l.username.toLowerCase();
        authoritiesMap.set(uname, {
          id: l.id || docSnap.id,
          username: l.username,
          fullName: l.name,
          avatarUrl: l.image,
          category: "representative",
          role: l.title,
          badge: l.party,
          party: l.party,
          verified: true,
          location: l.location,
          constituency: l.constituency,
        });
      }
    });
  } catch (err) {
    console.warn("Notice: Firestore authorities fetch fallback to seeded profiles:", err);
  }

  return Array.from(authoritiesMap.values());
}

// 12. Check Real-Time Username Uniqueness against Firestore users, leaders & system seeds
export async function checkUsernameAvailability(
  username: string,
  currentUserId: string,
  currentUsername?: string
): Promise<{ available: boolean; reason?: string }> {
  const clean = username.trim().toLowerCase().replace(/^@/, "");

  if (!clean) {
    return { available: false, reason: "Username cannot be empty." };
  }

  // Format validation: 3 to 30 characters, alphanumeric and underscore only
  const usernameRegex = /^[a-z0-9_]{3,30}$/;
  if (!usernameRegex.test(clean)) {
    if (clean.length < 3) {
      return {
        available: false,
        reason: "Username must be at least 3 characters long.",
      };
    }
    if (clean.length > 30) {
      return {
        available: false,
        reason: "Username cannot exceed 30 characters.",
      };
    }
    return {
      available: false,
      reason:
        "Username can only contain lowercase letters, numbers, and underscores (_). No spaces or special symbols.",
    };
  }

  // If user is keeping their current username, it's always valid
  if (
    currentUsername &&
    clean === currentUsername.trim().toLowerCase().replace(/^@/, "")
  ) {
    return { available: true };
  }

  // 1. Check local seed users
  for (const [uid, uProf] of Object.entries(INITIAL_USERS)) {
    if (
      uid !== currentUserId &&
      uProf.username?.toLowerCase() === clean
    ) {
      return {
        available: false,
        reason: `@${clean} is already registered in the system. Please choose another handle.`,
      };
    }
  }

  // 2. Check local seed leaders
  for (const leader of INITIAL_LEADERS) {
    if (
      leader.id !== currentUserId &&
      (leader as any).userId !== currentUserId &&
      leader.username?.toLowerCase() === clean
    ) {
      return {
        available: false,
        reason: `@${clean} is reserved for an official representative profile.`,
      };
    }
  }

  // 3. Check Firestore `users` collection
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", clean));
    const snap = await getDocs(q);
    for (const docSnap of snap.docs) {
      if (docSnap.id !== currentUserId) {
        return {
          available: false,
          reason: `@${clean} is already taken by another registered citizen/official.`,
        };
      }
    }
  } catch (err) {
    console.warn("Firestore username query warning:", err);
  }

  // 4. Check Firestore `leaders` collection
  try {
    const leadersRef = collection(db, "leaders");
    const qLeaders = query(leadersRef, where("username", "==", clean));
    const snapLeaders = await getDocs(qLeaders);
    for (const docSnap of snapLeaders.docs) {
      if (docSnap.id !== currentUserId) {
        return {
          available: false,
          reason: `@${clean} is already taken by an official leader profile.`,
        };
      }
    }
  } catch (err) {
    console.warn("Firestore leader query warning:", err);
  }

  // 5. Query Express API backend validation if available
  try {
    const res = await fetch(
      `/api/users/check-username/${encodeURIComponent(clean)}?currentUserId=${encodeURIComponent(
        currentUserId
      )}`
    );
    if (res.ok) {
      const data = await res.json();
      if (!data.available) {
        return {
          available: false,
          reason: data.reason || `@${clean} is already taken.`,
        };
      }
    }
  } catch {
    // Non-blocking fallback
  }

  return { available: true };
}

// 13. Toggle Follow / Unfollow in Firestore Database for Users & Leaders
export async function toggleFollowInFirestore(
  currentUserId: string,
  targetUserIdOrUsername: string,
  isFollowing: boolean
) {
  try {
    const cleanTarget = targetUserIdOrUsername.replace(/^@/, "").trim();
    const userRef = doc(db, "users", currentUserId);

    // Find actual target document
    let targetRef = doc(db, "users", cleanTarget);
    let targetSnap = await getDoc(targetRef).catch(() => null);

    if (!targetSnap || !targetSnap.exists()) {
      // Query by username in users collection
      const q = query(
        collection(db, "users"),
        where("username", "==", cleanTarget.toLowerCase())
      );
      const snap = await getDocs(q).catch(() => null);
      if (snap && !snap.empty) {
        targetRef = snap.docs[0].ref;
        targetSnap = snap.docs[0];
      }
    }

    if (isFollowing) {
      // User is currently following -> UNFOLLOW
      await updateDoc(userRef, {
        following: arrayRemove(cleanTarget, targetRef.id),
        followingCount: increment(-1),
      }).catch(async () => {
        await setDoc(
          userRef,
          {
            following: [],
            followingCount: 0,
          },
          { merge: true }
        );
      });

      if (targetSnap && targetSnap.exists()) {
        await updateDoc(targetRef, {
          followers: arrayRemove(currentUserId),
          followersCount: increment(-1),
        }).catch(async () => {
          await setDoc(
            targetRef,
            {
              followers: [],
              followersCount: 0,
            },
            { merge: true }
          );
        });
      }

      // If target is in leaders collection
      const leaderRef = doc(db, "leaders", cleanTarget);
      await updateDoc(leaderRef, {
        followers: arrayRemove(currentUserId),
        followersCount: increment(-1),
      }).catch(() => {});
    } else {
      // User is not following -> FOLLOW
      await updateDoc(userRef, {
        following: arrayUnion(cleanTarget, targetRef.id),
        followingCount: increment(1),
      }).catch(async () => {
        await setDoc(
          userRef,
          {
            following: [cleanTarget, targetRef.id],
            followingCount: 1,
          },
          { merge: true }
        );
      });

      if (targetSnap && targetSnap.exists()) {
        await updateDoc(targetRef, {
          followers: arrayUnion(currentUserId),
          followersCount: increment(1),
        }).catch(async () => {
          await setDoc(
            targetRef,
            {
              followers: [currentUserId],
              followersCount: 1,
            },
            { merge: true }
          );
        });
      }

      // If target is in leaders collection
      const leaderRef = doc(db, "leaders", cleanTarget);
      await updateDoc(leaderRef, {
        followers: arrayUnion(currentUserId),
        followersCount: increment(1),
      }).catch(() => {});
    }
  } catch (err) {
    console.warn("Follow Firestore notice:", err);
  }
}

