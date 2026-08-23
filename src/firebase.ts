import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore Database (Connects to the default Firestore database of the project)
export const db = getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Auth Helper Functions
export async function loginWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Google Auth error:", error);
    throw error;
  }
}

export async function loginWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error: any) {
    if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
      // Auto create if new user for smoother onboarding
      const created = await createUserWithEmailAndPassword(auth, email, pass);
      return created.user;
    }
    throw error;
  }
}

export async function signUpWithEmail(email: string, pass: string, name?: string): Promise<FirebaseUser> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (name && result.user) {
    await updateProfile(result.user, { displayName: name });
  }
  return result.user;
}

export async function loginAsGuest(customName?: string): Promise<FirebaseUser> {
  const result = await signInAnonymously(auth);
  if (customName && result.user) {
    await updateProfile(result.user, { displayName: customName });
  }
  return result.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged };
export type { FirebaseUser };

// Test connection safely on startup
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const testDoc = await getDoc(doc(db, "reports", "test_connection"));
    return true;
  } catch (error: any) {
    if (error?.message?.includes("the client is offline")) {
      console.warn("Firestore: Client is offline or initializing.");
    }
    return false;
  }
}

// Error handling helper
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
    },
    operationType,
    path,
  };
  console.warn("Firestore Diagnostic Log:", JSON.stringify(errInfo));
}
