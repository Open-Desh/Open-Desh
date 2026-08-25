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

// 4b. Save / Update User Profile safely to Firestore ({ merge: true } with deep sanitization)
export async function saveUserProfileToFirestore(
  userIdOrProfile: string | UserProfile,
  profileData?: Partial<UserProfile>
): Promise<void> {
  try {
    const uid = typeof userIdOrProfile === "string" ? userIdOrProfile : userIdOrProfile.id;
    const dataToSave = typeof userIdOrProfile === "string" ? (profileData || {}) : userIdOrProfile;
    const userDocRef = doc(db, "users", uid);
    const sanitized = sanitizeData({
      ...dataToSave,
      id: uid,
      updatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
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
    // 1. Save to dedicated 'reviews' collection
    const reviewDocRef = doc(db, "reviews", review.id || `rev_${Date.now()}`);
    await setDoc(reviewDocRef, {
      ...sanitizeData(review),
      targetId: leaderId,
      targetType: "representative",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }, { merge: true });

    // 2. Also update leader document with review & increment count
    const leadDoc = doc(db, "leaders", leaderId);
    await updateDoc(leadDoc, {
      reviewsCount: increment(1),
      reviews: arrayUnion(sanitizeData(review)),
    });
  } catch (err) {
    console.warn("Firestore leader review notice:", err);
  }
}

// 8b. Submit User / Business / Department Review to Firestore
export async function submitUserReviewInFirestore(userId: string, review: UserReview, targetType: string = "profile"): Promise<void> {
  try {
    // 1. Save to dedicated 'reviews' collection
    const reviewDocRef = doc(db, "reviews", review.id || `rev_${Date.now()}`);
    await setDoc(reviewDocRef, {
      ...sanitizeData(review),
      targetId: userId,
      targetType,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }, { merge: true });

    // 2. Also update user document with review & increment count
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      reviewsCount: increment(1),
      reviews: arrayUnion(sanitizeData(review)),
    });
  } catch (err) {
    console.warn("Firestore user review notice:", err);
  }
}

// 8c. Save 100-Point Performance Score & 5 Pillars to dedicated 'performance_scores' collection
export async function savePerformanceScoreInFirestore(
  targetId: string,
  systemScore: number,
  criteria: Array<{
    label: string;
    weight: number;
    scoreAwarded: number;
    description: string;
    publicSource: string;
    sourceUrl?: string;
    sourceType?: string;
  }>,
  metadata?: {
    category?: string;
    constituency?: string;
    department?: string;
    title?: string;
  }
): Promise<void> {
  try {
    const scoreDocRef = doc(db, "performance_scores", targetId);
    const payload = {
      targetId,
      systemScore,
      pillars: {
        slaRedressal: criteria[0] || null,
        fundUtilization: criteria[1] || null,
        legislativeParticipation: criteria[2] || null,
        groundAudit: criteria[3] || null,
        citizenTrust: criteria[4] || null,
      },
      criteria: sanitizeData(criteria),
      metadata: metadata ? sanitizeData(metadata) : {},
      algorithmVersion: "100-Point Civic SLA Index v2.5",
      updatedAt: Date.now(),
    };
    await setDoc(scoreDocRef, payload, { merge: true });

    // Also update parent profile summary
    const userDocRef = doc(db, "users", targetId);
    await setDoc(userDocRef, {
      systemScore,
      systemScoreBreakdown: {
        algorithmVersion: "100-Point Civic SLA Index v2.5",
        lastCalculated: new Date().toISOString(),
        criteria: sanitizeData(criteria),
      },
    }, { merge: true });
  } catch (err) {
    console.warn("Firestore performance score save notice:", err);
  }
}

// 8d. Fetch 100-Point Performance Score from 'performance_scores' collection
export async function fetchPerformanceScoreFromFirestore(targetId: string): Promise<any | null> {
  try {
    const scoreDocRef = doc(db, "performance_scores", targetId);
    const docSnap = await getDoc(scoreDocRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (err) {
    console.warn("Firestore fetch score notice:", err);
  }
  return null;
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

  try {
    const usersRef = collection(db, "users");
    const userSnaps = await getDocs(usersRef);
    userSnaps.forEach((docSnap) => {
      const data = docSnap.data() as UserProfile;
      if (data) {
        const uid = data.id || docSnap.id;
        const isOfficial = data.category === "department" || data.category === "representative" || data.verified;
        
        if (isOfficial) {
          const uname = data.username?.toLowerCase().replace(/^@/, "");
          if (uname) {
            authoritiesMap.set(uname, {
              id: uid,
              username: data.username.replace(/^@/, ""),
              fullName: data.fullName || data.username,
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
      if (l && l.username) {
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
          verified: Boolean(l.verified !== false),
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

// 11b. Seeder disabled - Data is strictly preserved as-is in Firestore
export async function seedPoliceProfilesToFirestore(): Promise<void> {
  return;
}

// 11c. Purge disabled - User/Admin Firestore data is never deleted or rewritten
export async function purgeOldMockDataFromFirestore(): Promise<void> {
  return;
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

    if (!snapshot.empty) {
      const budgets: BudgetHierarchyNode[] = [];
      snapshot.forEach((docSnap) => {
        budgets.push(docSnap.data() as BudgetHierarchyNode);
      });
      return budgets;
    }

    return REAL_INDIAN_BUDGET_DATA;
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
    await setDoc(budgetDoc, sanitized);
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
      return setDoc(budgetDoc, sanitized);
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

// 22. Submit Content Violation / Flag to Firestore
export async function submitContentFlagInFirestore(flagData: {
  reportId: string;
  reportText: string;
  authorId: string;
  authorUsername?: string;
  reportedByUserId: string;
  reportedByUsername?: string;
  categoryKey: string;
  categoryTitle: string;
  subCategory?: string;
  customDetails?: string;
  createdAt: string;
}): Promise<void> {
  try {
    const flagId = `flag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const flagDoc = doc(db, "moderation_flags", flagId);
    await setDoc(flagDoc, sanitizeData({ ...flagData, id: flagId }), { merge: true });
    
    // Also update report document with flag count
    const repDoc = doc(db, "reports", flagData.reportId);
    await updateDoc(repDoc, {
      flagsCount: increment(1),
      lastFlaggedAt: flagData.createdAt,
    }).catch(() => {});
  } catch (err) {
    console.warn("Error submitting content flag to Firestore:", err);
  }
}
