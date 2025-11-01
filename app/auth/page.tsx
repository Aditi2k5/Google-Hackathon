"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import * as Tabs from "@radix-ui/react-tabs";
import { Mail, Lock, Loader2, User, CheckCircle2 } from "lucide-react";
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  getCurrentUser,
} from "@/lib/firebase";

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check if user is already authenticated
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      
      // Show success briefly before redirect
      setSuccess("Signed in successfully!");
      
      // Use replace to prevent back button issues
      setTimeout(() => {
        router.replace("/dashboard");
      }, 500);
    } catch (err: any) {
      setError(err.message || "Sign-in failed");
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await signUpWithEmail(email, password, username);
      
      // Show success message
      setSuccess("Account created! Redirecting to sign in...");
      
      // Clear form
      setEmail("");
      setPassword("");
      setUsername("");
      
      // Switch to sign-in tab after a brief delay
      setTimeout(() => {
        setActiveTab("signin");
        setSuccess("Please sign in with your new account");
        setLoading(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Sign-up failed");
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await signInWithGoogle();
      
      // Show success briefly
      setSuccess("Signed in with Google!");
      
      // Redirect to dashboard
      setTimeout(() => {
        router.replace("/dashboard");
      }, 500);
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 sm:px-6 md:px-8">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="glass-news p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-2 typewriter-headline">
              Newsroom Forge
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              AI-Powered News Drafting Platform
            </p>
          </div>

          <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
            <Tabs.List className="grid w-full grid-cols-2 glass-sm mb-1">
              <Tabs.Trigger
                value="signin"
                disabled={loading}
                className={`text-xs sm:text-sm py-2 rounded-t-md transition-all ${
                  activeTab === "signin"
                    ? "bg-white/10 text-indigo-500 font-bold shadow"
                    : "text-muted-foreground bg-transparent"
                }`}
              >
                Sign In
              </Tabs.Trigger>
              <Tabs.Trigger
                value="signup"
                disabled={loading}
                className={`text-xs sm:text-sm py-2 rounded-t-md transition-all ${
                  activeTab === "signup"
                    ? "bg-white/10 text-indigo-500 font-bold shadow"
                    : "text-muted-foreground bg-transparent"
                }`}
              >
                Sign Up
              </Tabs.Trigger>
            </Tabs.List>

            {/* Sign In */}
            <Tabs.Content value="signin" className="space-y-4 mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <AuthInput
                  label="Email"
                  type="email"
                  icon={<Mail />}
                  value={email}
                  onChange={setEmail}
                  disabled={loading}
                  required
                />
                <AuthInput
                  label="Password"
                  type="password"
                  icon={<Lock />}
                  value={password}
                  onChange={setPassword}
                  disabled={loading}
                  required
                />
                
                <AnimatePresence mode="wait">
                  {error && <ErrorMessage text={error} />}
                  {success && <SuccessMessage text={success} />}
                </AnimatePresence>
                
                <SubmitButton text="Sign In" loading={loading} />
              </form>
            </Tabs.Content>

            {/* Sign Up */}
            <Tabs.Content value="signup" className="space-y-4 mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <AuthInput
                  label="Username"
                  type="text"
                  icon={<User />}
                  value={username}
                  onChange={setUsername}
                  disabled={loading}
                  required
                  minLength={3}
                />
                <AuthInput
                  label="Email"
                  type="email"
                  icon={<Mail />}
                  value={email}
                  onChange={setEmail}
                  disabled={loading}
                  required
                />
                <AuthInput
                  label="Password"
                  type="password"
                  icon={<Lock />}
                  value={password}
                  onChange={setPassword}
                  disabled={loading}
                  required
                  minLength={6}
                />
                
                <AnimatePresence mode="wait">
                  {error && <ErrorMessage text={error} />}
                  {success && <SuccessMessage text={success} />}
                </AnimatePresence>
                
                <SubmitButton text="Sign Up" loading={loading} />
              </form>
            </Tabs.Content>
          </Tabs.Root>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="px-2 bg-background text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign-In */}
          <Button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full glass-sm border border-white/20 hover:bg-white/10 py-5 sm:py-6 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating...
              </>
            ) : (
              <>
                <svg
                  className="mr-2 h-4 sm:h-5 w-4 sm:w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </>
            )}
          </Button>
        </Card>
      </motion.div>
    </main>
  );
}

function AuthInput({ label, type, icon, value, onChange, disabled, required, minLength }: any) {
  return (
    <div className="space-y-2">
      <label className="text-xs sm:text-sm font-medium">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-3 text-muted-foreground">{icon}</div>
        <Input
          type={type}
          placeholder={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          minLength={minLength}
          className="glass-sm pl-10 py-5 sm:py-6 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}

function ErrorMessage({ text }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm"
    >
      {text}
    </motion.div>
  );
}

function SuccessMessage({ text }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs sm:text-sm flex items-center gap-2"
    >
      <CheckCircle2 className="h-4 w-4" />
      {text}
    </motion.div>
  );
}

function SubmitButton({ text, loading }: any) {
  return (
    <Button
      type="submit"
      disabled={loading}
      className="w-full glass-sm bg-indigo-500 hover:bg-indigo-600 text-white py-5 sm:py-6 text-sm sm:text-base shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {text}...
        </>
      ) : (
        text
      )}
    </Button>
  );
}