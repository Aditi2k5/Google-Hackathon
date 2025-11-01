// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  User,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configure Google Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ 
  prompt: "select_account",
  // Reduce latency by disabling unnecessary scopes
});

// Helper to save user data to Firestore (non-blocking for better performance)
async function saveUserToFirestore(user: User, authProvider: string) {
  const userRef = doc(db, "users", user.uid);
  
  // Check if user exists
  const snap = await getDoc(userRef);
  
  if (!snap.exists()) {
    // Save user data
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      createdAt: new Date(),
      authProvider,
      lastLogin: new Date(),
    });
  } else {
    // Update last login
    await setDoc(userRef, { lastLogin: new Date() }, { merge: true });
  }
}

// Helper to store essential user info in localStorage
function cacheUserLocally(user: User) {
  if (typeof window !== "undefined") {
    localStorage.setItem("userEmail", user.email || "");
    localStorage.setItem("userName", user.displayName || "");
    localStorage.setItem("userPhoto", user.photoURL || "");
    localStorage.setItem("userId", user.uid);
  }
}

// Google Sign-In / Sign-Up
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Cache user info immediately for faster UI updates
    cacheUserLocally(user);

    // Save to Firestore in background (don't wait)
    saveUserToFirestore(user, "google").catch(console.error);

    return user;
  } catch (err: any) {
    console.error("Google Sign-In Error:", err);
    
    // Provide user-friendly error messages
    if (err.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in cancelled. Please try again.");
    } else if (err.code === "auth/popup-blocked") {
      throw new Error("Popup blocked. Please allow popups for this site.");
    } else if (err.code === "auth/network-request-failed") {
      throw new Error("Network error. Please check your connection.");
    }
    
    throw new Error(err.message || "Google sign-in failed");
  }
}

// Email/Password Sign-Up with Username
export async function signUpWithEmail(
  email: string,
  password: string,
  username: string
) {
  try {
    // Create account
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // Update profile with username
    await updateProfile(user, { displayName: username });

    // Cache user info immediately
    cacheUserLocally(user);

    // Save to Firestore in background
    saveUserToFirestore(user, "email").catch(console.error);

    return user;
  } catch (err: any) {
    console.error("Sign-Up Error:", err);
    
    // User-friendly error messages
    if (err.code === "auth/email-already-in-use") {
      throw new Error("Email already in use. Please sign in instead.");
    } else if (err.code === "auth/weak-password") {
      throw new Error("Password should be at least 6 characters.");
    } else if (err.code === "auth/invalid-email") {
      throw new Error("Invalid email address.");
    }
    
    throw new Error(err.message || "Sign-up failed");
  }
}

// Email/Password Sign-In
export async function signInWithEmail(email: string, password: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // Cache user info immediately
    cacheUserLocally(user);

    // Update last login in background
    saveUserToFirestore(user, "email").catch(console.error);

    return user;
  } catch (err: any) {
    console.error("Sign-In Error:", err);
    
    // User-friendly error messages
    if (err.code === "auth/user-not-found") {
      throw new Error("No account found with this email. Please sign up.");
    } else if (err.code === "auth/wrong-password") {
      throw new Error("Incorrect password. Please try again.");
    } else if (err.code === "auth/invalid-email") {
      throw new Error("Invalid email address.");
    } else if (err.code === "auth/too-many-requests") {
      throw new Error("Too many failed attempts. Please try again later.");
    }
    
    throw new Error(err.message || "Sign-in failed");
  }
}

// Sign-Out
export async function signOutUser() {
  try {
    await signOut(auth);
    
    // Clear local storage
    if (typeof window !== "undefined") {
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      localStorage.removeItem("userPhoto");
      localStorage.removeItem("userId");
    }
  } catch (err: any) {
    console.error("Sign-Out Error:", err);
    throw new Error("Sign-out failed. Please try again.");
  }
}

// Auth state observer
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      cacheUserLocally(user);
    } else {
      // Clear cache on sign out
      if (typeof window !== "undefined") {
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");
        localStorage.removeItem("userPhoto");
        localStorage.removeItem("userId");
      }
    }
    callback(user);
  });
}

// Get current user
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// Check if authenticated
export function isAuthenticated(): boolean {
  return !!auth.currentUser;
}