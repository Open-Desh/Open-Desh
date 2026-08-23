import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  increment,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  ReportIssue,
  Leader,
  InfrastructureProject,
  UserProfile,
  UserCategory,
  UserReview,
  ThreadedReply,
  BudgetHierarchyNode,
} from "../types";
import { REAL_INDIAN_BUDGET_DATA } from "../data/realBudgetData";
import { INITIAL_USERS } from "../data/seedData";

// Helper to sanitize Firestore documents
function sanitizeData<T>(data: T): any {
  return JSON.parse(JSON.stringify(data));
}

// 1. Fetch Reports directly from Firestore
export async function getReportsDirect(): Promise<ReportIssue[]> {
  try {
    const repRef = collection(db, "reports");
    const snapshot = await getDocs(repRef);

    if (!snapshot.empty) {
      const reports: ReportIssue[] = [];
      snapshot.forEach((docSnap) => {
        reports.push(docSnap.data() as ReportIssue);
      });
      return reports.sort((a, b) => {
        const timeA = typeof a.createdAt === "number" ? a.createdAt : new Date(a.createdAt || a.timestamp).getTime() || 0;
        const timeB = typeof b.createdAt === "number" ? b.createdAt : new Date(b.createdAt || b.timestamp).getTime() || 0;
        return timeB - timeA;
      });
    }
    return [];
  } catch (err) {
    console.warn("Firestore reports fetch notice:", err);
    return [];
  }
}

// 2. Fetch Leaders directly from Firestore
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
    }
    return [];
  } catch (err) {
    console.warn("Firestore leaders fetch notice:", err);
    return [];
  }
}

// 3. Fetch Infrastructure Projects directly from Firestore
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
    }
    return [];
  } catch (err) {
    console.warn("Firestore infrastructure fetch notice:", err);
    return [];
  }
}

// 4. Save New Grievance Report safely to Firestore ({ merge: true } added)
export async function saveReportToFirestore(report: ReportIssue): Promise<void> {
  try {
    const repDoc = doc(db, "reports", report.id);
    await setDoc(repDoc, sanitizeData(report), { merge: true });
  } catch (err) {
    console.warn("Error saving report directly to Firestore:", err);
  }
}

// 4b. Save / Update User Profile safely to Firestore ({ merge: true } added)
export async function saveUserProfileToFirestore(userProfile: UserProfile): Promise<void> {
  try {
    const userDocRef = doc(db, "users", userProfile.id);
    const sanitized = sanitizeData({
      ...userProfile,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(userDocRef, sanitized, { merge: true });
  } catch (err) {
    console.warn("Error saving user profile to Firestore:", err);
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

// 7b. Update Entire Replies Tree in Firestore
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

// 10. Seeder disabled - Data is strictly preserved as-is in Firestore
export async function seedAllCollectionsToFirestore(): Promise<void> {
  return;
}

// 11. Fetch All Registered Official Authorities & Leaders strictly from Firestore
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
  const validPoliceIds = new Set(Object.keys(INITIAL_USERS));

  Object.values(INITIAL_USERS).forEach((u) => {
    if (u && (u.category === "department" || u.category === "representative" || u.verified)) {
      const uname = u.username?.toLowerCase().replace(/^@/, "");
      if (uname) {
        authoritiesMap.set(uname, {
          id: u.id,
          username: u.username.replace(/^@/, ""),
          fullName: u.fullName,
          avatarUrl: u.avatarUrl || "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=120&auto=format&fit=crop&q=80",
          category: u.category || "department",
          role: u.departmentDetails?.designation || u.representativeDetails?.position || (u.category === "department" ? "Police / Govt Dept" : "Citizen"),
          badge: u.departmentDetails?.officialBadge || u.representativeDetails?.party || "Official HQ",
          departmentCode: u.departmentDetails?.departmentCode,
          party: u.representativeDetails?.party,
          verified: u.verified ?? true,
          location: u.location,
          jurisdictionRegion: u.departmentDetails?.jurisdictionRegion,
          constituency: u.representativeDetails?.constituency,
        });
      }
    }
  });

  try {
    const usersRef = collection(db, "users");
    const userSnaps = await getDocs(usersRef);
    userSnaps.forEach((docSnap) => {
      const data = docSnap.data() as UserProfile;
      if (data) {
        const uid = data.id || docSnap.id;
        const isPolice = validPoliceIds.has(uid);
        const isOfficial = (data.category === "department" && isPolice) || (data.category === "representative" && !uid.startsWith("lead_")) || data.verified;
        
        if (isOfficial) {
          const uname = data.username?.toLowerCase().replace(/^@/, "");
          if (uname) {
            authoritiesMap.set(uname, {
              id: uid,
              username: data.username.replace(/^@/, ""),
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
      }
    });

    const leadersRef = collection(db, "leaders");
    const leaderSnaps = await getDocs(leadersRef);
    leaderSnaps.forEach((docSnap) => {
      const l = docSnap.data() as Leader;
      if (l && l.username && !l.id.startsWith("lead_")) {
        const uname = l.username.toLowerCase().replace(/^@/, "");
        authoritiesMap.set(uname, {
          id: l.id || docSnap.id,
          username: l.username.replace(/^@/, ""),
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
    console.warn("Notice: Firestore authorities fetch:", err);
  }

  return Array.from(authoritiesMap.values());
}

// 11b. Seed police profiles safely to Firestore
export async function seedPoliceProfilesToFirestore(): Promise<void> {
  try {
    const departmentProfiles = Object.values(INITIAL_USERS).filter(
      (u) => u.category === "department" && u.id.startsWith("user_")
    );
    const writePromises = departmentProfiles.map(async (profile) => {
      const userRef = doc(db, "users", profile.id);
      const sanitized = sanitizeData({
        ...profile,
        updatedAt: new Date().toISOString(),
      });
      return setDoc(userRef, sanitized, { merge: true });
    });
    await Promise.all(writePromises);
  } catch (err) {
    console.warn("Firestore police profiles seed notice:", err);
  }
}

// 11c. Purge old mock data from Firestore
export async function purgeOldMockDataFromFirestore(): Promise<void> {
  try {
    const validPoliceIds = new Set(Object.keys(INITIAL_USERS));

    const leadersRef = collection(db, "leaders");
    const leaderSnaps = await getDocs(leadersRef);
    leaderSnaps.forEach(async (d) => {
      try {
        await deleteDoc(doc(db, "leaders", d.id));
      } catch (e) {
        console.warn("Error deleting legacy leader:", d.id, e);
      }
    });

    const usersRef = collection(db, "users");
    const userSnaps = await getDocs(usersRef);
    userSnaps.forEach(async (d) => {
      const id = d.id;
      const data = d.data() as any;
      const name = (data.fullName || data.name || "").toLowerCase();
      const username = (data.username || "").toLowerCase();
      const category = (data.category || "").toLowerCase();
      const isPolice = validPoliceIds.has(id);

      const isUnapprovedDept = category === "department" && !isPolice;
      const isLegacyMock =
        id.startsWith("lead_") ||
        id.startsWith("dept_") ||
        id === "guest_citizen" ||
        category === "contractor" ||
        name.includes("gurugram") ||
        name.includes("bijli") ||
        name.includes("jharkhand bijli") ||
        name.includes("jbvnl") ||
        name.includes("gmda") ||
        name.includes("rajesh") ||
        name.includes("afcons") ||
        name.includes("wabag") ||
        name.includes("contractor") ||
        name.includes("rahul tiwari") ||
        name.includes("national highway") ||
        name.includes("nhai") ||
        username.includes("gmda") ||
        username.includes("jbvnl") ||
        username.includes("rahul") ||
        username.includes("rajesh") ||
        (id.startsWith("user_") && !isPolice);

      if (!isPolice && (isUnapprovedDept || isLegacyMock)) {
        try {
          await deleteDoc(doc(db, "users", id));
          console.log("Purged unauthorized dummy document from Firestore users:", id, name);
        } catch (e) {
          console.warn("Error deleting legacy mock user:", id, e);
        }
      }
    });

    const infraRef = collection(db, "infrastructure");
    const infraSnaps = await getDocs(infraRef);
    infraSnaps.forEach(async (d) => {
      try {
        await deleteDoc(doc(db, "infrastructure", d.id));
      } catch (e) {
        console.warn("Error deleting legacy mock infra:", d.id, e);
      }
    });
  } catch (err) {
    console.warn("Purge old mock data notice:", err);
  }
}

// 12. Check Real-Time Username Uniqueness
export async function checkUsernameAvailability(
  username: string,
  currentUserId: string,
  currentUsername?: string
): Promise<{ available: boolean; reason?: string }> {
  const clean = username.trim().toLowerCase().replace(/^@/, "");

  if (!clean) {
    return { available: false, reason: "Username cannot be empty." };
  }

  const usernameRegex = /^[a-z0-9_]{3,30}$/;
  if (!usernameRegex.test(clean)) {
    if (clean.length < 3) {
      return { available: false, reason: "Username must be at least 3 characters long." };
    }
    if (clean.length > 30) {
      return { available: false, reason: "Username cannot exceed 30 characters." };
    }
    return {
      available: false,
      reason: "Username can only contain lowercase letters, numbers, and underscores (_). No spaces or special symbols.",
    };
  }

  if (currentUsername && clean === currentUsername.trim().toLowerCase().replace(/^@/, "")) {
    return { available: true };
  }

  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", clean));
    const snap = await getDocs(q);
    for (const docSnap of snap.docs) {
      if (docSnap.id !== currentUserId) {
        return { available: false, reason: `@${clean} is already taken by another registered citizen/official.` };
      }
    }
  } catch (err) {
    console.warn("Firestore username query warning:", err);
  }

  try {
    const leadersRef = collection(db, "leaders");
    const qLeaders = query(leadersRef, where("username", "==", clean));
    const snapLeaders = await getDocs(qLeaders);
    for (const docSnap of snapLeaders.docs) {
      if (docSnap.id !== currentUserId) {
        return { available: false, reason: `@${clean} is already taken by an official leader profile.` };
      }
    }
  } catch (err) {
    console.warn("Firestore leader query warning:", err);
  }

  try {
    const res = await fetch(
      `/api/users/check-username/${encodeURIComponent(clean)}?currentUserId=${encodeURIComponent(currentUserId)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (!data.available) {
        return { available: false, reason: data.reason || `@${clean} is already taken.` };
      }
    }
  } catch {
    // Non-blocking fallback
  }

  return { available: true };
}

// 13. Delete Report from Firestore
export async function deleteReportInFirestore(reportId: string): Promise<void> {
  try {
    const repDoc = doc(db, "reports", reportId);
    await deleteDoc(repDoc);
  } catch (err) {
    console.warn("Firestore delete report notice:", err);
  }
}

// 14. Toggle Pin Report in Firestore
export async function togglePinReportInFirestore(reportId: string, isPinned: boolean): Promise<void> {
  try {
    const repDoc = doc(db, "reports", reportId);
    await updateDoc(repDoc, { isPinned });
  } catch (err) {
    console.warn("Firestore pin report notice:", err);
  }
}

// 15. Toggle Follow / Unfollow in Firestore Database
export async function toggleFollowInFirestore(
  currentUserId: string,
  targetUserIdOrUsername: string,
  isFollowing: boolean
) {
  try {
    const cleanTarget = targetUserIdOrUsername.replace(/^@/, "").trim();
    const userRef = doc(db, "users", currentUserId);

    let targetRef = doc(db, "users", cleanTarget);
    let targetSnap = await getDoc(targetRef).catch(() => null);

    if (!targetSnap || !targetSnap.exists()) {
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
      await updateDoc(userRef, {
        following: arrayRemove(cleanTarget, targetRef.id),
        followingCount: increment(-1),
      }).catch(async () => {
        await setDoc(userRef, { following: [], followingCount: 0 }, { merge: true });
      });

      if (targetSnap && targetSnap.exists()) {
        await updateDoc(targetRef, {
          followers: arrayRemove(currentUserId),
          followersCount: increment(-1),
        }).catch(async () => {
          await setDoc(targetRef, { followers: [], followersCount: 0 }, { merge: true });
        });
      }

      const leaderRef = doc(db, "leaders", cleanTarget);
      await updateDoc(leaderRef, {
        followers: arrayRemove(currentUserId),
        followersCount: increment(-1),
      }).catch(() => {});
    } else {
      await updateDoc(userRef, {
        following: arrayUnion(cleanTarget, targetRef.id),
        followingCount: increment(1),
      }).catch(async () => {
        await setDoc(userRef, { following: [cleanTarget, targetRef.id], followingCount: 1 }, { merge: true });
      });

      if (targetSnap && targetSnap.exists()) {
        await updateDoc(targetRef, {
          followers: arrayUnion(currentUserId),
          followersCount: increment(1),
        }).catch(async () => {
          await setDoc(targetRef, { followers: [currentUserId], followersCount: 1 }, { merge: true });
        });
      }

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

// 16. Fetch Budgets from Firestore
export async function getBudgetsDirect(): Promise<BudgetHierarchyNode[]> {
  try {
    const budgetRef = collection(db, "budgets");
    const snapshot = await getDocs(budgetRef);

    if (!snapshot.empty && snapshot.docs.length >= REAL_INDIAN_BUDGET_DATA.length) {
      const budgets: BudgetHierarchyNode[] = [];
      snapshot.forEach((docSnap) => {
        budgets.push(docSnap.data() as BudgetHierarchyNode);
      });
      return budgets;
    }

    return await seedRealBudgetsToFirestore();
  } catch (err) {
    console.warn("Firestore budgets fetch notice, using verified real dataset:", err);
    return REAL_INDIAN_BUDGET_DATA;
  }
}

// 17. Save / Update Budget Node in Firestore
export async function saveBudgetToFirestore(budget: BudgetHierarchyNode): Promise<void> {
  try {
    const budgetDoc = doc(db, "budgets", budget.id);
    const sanitized = sanitizeData({
      ...budget,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(budgetDoc, sanitized, { merge: true });
  } catch (err) {
    console.warn("Firestore save budget notice:", err);
  }
}

// 18. Seed & Sync Complete Real Indian Budget Dataset
export async function seedRealBudgetsToFirestore(): Promise<BudgetHierarchyNode[]> {
  try {
    const writePromises = REAL_INDIAN_BUDGET_DATA.map(async (budgetNode) => {
      const budgetDoc = doc(db, "budgets", budgetNode.id);
      const sanitized = sanitizeData({
        ...budgetNode,
        updatedAt: new Date().toISOString(),
      });
      return setDoc(budgetDoc, sanitized, { merge: true });
    });
    await Promise.all(writePromises);
  } catch (err) {
    console.warn("Firestore budget batch sync notice:", err);
  }
  return REAL_INDIAN_BUDGET_DATA;
}

// 19. Claim Official Department / Police Profile in Firestore
export async function claimOfficialProfileInFirestore(
  profileId: string,
  credentials: {
    email: string;
    authUid?: string;
    officerName: string;
    designation: string;
    departmentCode?: string;
  }
): Promise<Partial<UserProfile>> {
  try {
    const userDocRef = doc(db, "users", profileId);
    const nowIso = new Date().toISOString();
    
    const updatePayload: Record<string, any> = {
      isClaimed: true,
      isClaimable: false,
      claimedByEmail: credentials.email,
      claimedAt: nowIso,
      claimedByOfficerName: credentials.officerName,
      email: credentials.email,
      verified: true,
      verificationStatus: "approved",
      updatedAt: nowIso,
    };

    if (credentials.authUid) {
      updatePayload.userId = credentials.authUid;
      updatePayload.claimedByUid = credentials.authUid;
    }

    if (credentials.designation || credentials.departmentCode) {
      updatePayload["departmentDetails.designation"] = credentials.designation;
      if (credentials.departmentCode) {
        updatePayload["departmentDetails.departmentCode"] = credentials.departmentCode;
      }
      updatePayload["departmentDetails.officialBadge"] = "Official Verified Department";
    }

    await setDoc(userDocRef, sanitizeData(updatePayload), { merge: true });

    return {
      isClaimed: true,
      isClaimable: false,
      claimedByEmail: credentials.email,
      claimedAt: nowIso,
      claimedByOfficerName: credentials.officerName,
      email: credentials.email,
      verified: true,
      verificationStatus: "approved",
    };
  } catch (err) {
    console.error("Error claiming official profile in Firestore:", err);
    throw err;
  }
}
