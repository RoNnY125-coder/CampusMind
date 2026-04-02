"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brain, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ensureStudentProfile } from "@/lib/auth-helpers";
import {
  clearOAuthRedirectPath,
  getOAuthCallbackUrl,
  getOAuthErrorMessage,
  persistOAuthRedirectPath,
} from "@/lib/auth/oauth";

export default function LoginPage() {
  const router = useRouter();
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) setOauthError(decodeURIComponent(err));
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        console.error("[login] signInWithPassword:", signInError.message);
        setError(signInError.message);
        setIsLoading(false);
        return;
      }

      const session = data.session;
      if (!session?.access_token) {
        setError("No session returned. Try again or confirm your email.");
        setIsLoading(false);
        return;
      }

      const ensured = await ensureStudentProfile(session.access_token);
      if (!ensured.ok) {
        console.warn("[login] ensure profile:", ensured.error);
      }

      const { data: row } = await supabase
        .from("students")
        .select("has_onboarded")
        .eq("id", session.user.id)
        .single();

      router.push(row?.has_onboarded ? "/chat" : "/onboard");
      router.refresh();
    } catch (err) {
      console.error("[login] unexpected:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    setError("");
    setOauthError(null);

    try {
      persistOAuthRedirectPath("/onboard");

      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getOAuthCallbackUrl(),
        },
      });

      if (oauthErr) {
        throw oauthErr;
      }
    } catch (err) {
      clearOAuthRedirectPath();
      const message = getOAuthErrorMessage(err);
      console.error("[login] Google OAuth start failed:", err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-10 justify-center">
          <Brain className="text-blue-500 w-6 h-6" />
          <span className="text-white font-semibold text-lg">CampusMind</span>
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-2">Welcome back</h1>
        <p className="text-gray-400 text-sm text-center mb-8">Sign in with email or Google</p>

        {(error || oauthError) && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mb-4">
            {error || oauthError}
          </p>
        )}

        <button
          type="button"
          onClick={handleGoogle}
          disabled={isLoading}
          className="w-full mb-4 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/15 bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wide">
            <span className="bg-black px-2 text-gray-500">or email</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@student.edu"
              required
              autoComplete="email"
              className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="current-password"
              className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 shadow-glow-blue hover:shadow-glow-blue-lg mt-2"
            style={{ background: "linear-gradient(135deg, #2563eb, #06b6d4)" }}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-gray-500 text-xs text-center mt-6">
          No account?{" "}
          <Link href="/signup" className="text-blue-400 hover:text-blue-300">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
