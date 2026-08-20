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
} from "firebase/firestore";
import { db, auth } from "../firebase";
import {
  ReportIssue,
  Leader,
  InfrastructureProject,
  UserProfile,
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

// 8. Submit Voter Review for a Leader in Firestore
export async function submitLeaderReviewInFirestore(leaderId: string, review: UserReview): Promise<void> {
  try {
    const leadDoc = doc(db, "leaders", leaderId);
    await updateDoc(leadDoc, {
      reviewsCount: increment(1),
      reviews: arrayUnion(sanitizeData(review)),
    });
  } catch (err) {
    console.warn("Firestore review notice:", err);
  }
}

// 9. Fetch User Profile
export async function getUserProfileDirect(userId: string): Promise<UserProfile | null> {
  try {
    const userDocSnap = await getDoc(doc(db, "users", userId));
    if (userDocSnap.exists()) {
      return userDocSnap.data() as UserProfile;
    }
    if (INITIAL_USERS[userId]) {
      return INITIAL_USERS[userId];
    }
    return null;
  } catch (err) {
    console.warn("Error fetching user profile:", err);
    return INITIAL_USERS[userId] || null;
  }
}
