"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { User } from "firebase/auth";
import { 
  onAuthChange, 
  signInWithEmail as firebaseSignIn,
  signUpWithEmail as firebaseSignUp,
  signInWithGoogle as firebaseGoogleSignIn,
  signOutUser as firebaseSignOut
} from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth changes
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    await firebaseSignUp(email, password, username);
  };

  const signIn = async (email: string, password: string) => {
    await firebaseSignIn(email, password);
  };

  const signInWithGoogle = async () => {
    await firebaseGoogleSignIn();
  };

  const logOut = async () => {
    await firebaseSignOut();
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        signUp, 
        signIn, 
        signInWithGoogle, 
        logOut 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};