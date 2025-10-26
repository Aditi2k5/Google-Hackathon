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

// ✅ 1. Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// ✅ 2. Initialize
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// ✅ 3. Google Sign-In / Sign-Up
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Create user record in Firestore if not exists
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
        createdAt: new Date(),
        authProvider: "google",
      });
    }

    localStorage.setItem("user", JSON.stringify(user));
    return user;
  } catch (err: any) {
    console.error("Google Sign-In Error:", err);
    throw err;
  }
}

// ✅ 4. Email/Password Sign-Up with Username
export async function signUpWithEmail(
  email: string,
  password: string,
  username: string
) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // Add username to Firebase user profile
    await updateProfile(user, { displayName: username });

    // Save user in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: username,
      createdAt: new Date(),
      authProvider: "email",
    });

    localStorage.setItem("user", JSON.stringify(user));
    return user;
  } catch (err: any) {
    console.error("Sign-Up Error:", err);
    throw err;
  }
}

// ✅ 5. Email/Password Sign-In
export async function signInWithEmail(email: string, password: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    localStorage.setItem("user", JSON.stringify(user));
    return user;
  } catch (err: any) {
    console.error("Sign-In Error:", err);
    throw err;
  }
}

// ✅ 6. Sign-Out
export async function signOutUser() {
  try {
    await signOut(auth);
    localStorage.removeItem("user");
  } catch (err: any) {
    console.error("Sign-Out Error:", err);
    throw err;
  }
}

// ✅ 7. Auth helpers
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, (user) => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
    callback(user);
  });
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export function isAuthenticated(): boolean {
  return !!auth.currentUser || !!localStorage.getItem("user");
}
