"use client";

import { useEffect, useState } from "react";
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

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) setOauthError(decodeURIComponent(err));
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: getOAuthCallbackUrl(),
        },
      });

      if (signUpError) {
        console.error("[signup] signUp:", signUpError.message);
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      if (data.session?.access_token) {
        await ensureStudentProfile(data.session.access_token);
        router.push("/onboard");
        router.refresh();
        return;
      }

      setInfo(
        "Check your email for a confirmation link. After confirming, you can sign in."
      );
    } catch (err) {
      console.error("[signup] unexpected:", err);
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

      const { data, error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getOAuthCallbackUrl(),
          skipBrowserRedirect: true,
        },
      });

      if (oauthErr) {
        throw oauthErr;
      }

      if (!data?.url) {
        throw new Error("Supabase did not return a Google authorization URL.");
      }

      window.location.assign(data.url);
      return;
    } catch (err) {
      clearOAuthRedirectPath();
      const message = getOAuthErrorMessage(err);
      console.error("[signup] Google OAuth start failed:", err);
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

        <h1 className="text-2xl font-bold text-white text-center mb-2">Create account</h1>
        <p className="text-gray-400 text-sm text-center mb-8">Sign up with email or Google</p>

        {(error || oauthError) && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mb-4">
            {error || oauthError}
          </p>
        )}
        {info && (
          <p className="text-blue-300 text-sm bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 mb-4">
            {info}
          </p>
        )}

        <button
          type="button"
          onClick={handleGoogle}
          disabled={isLoading}
          className="w-full mb-4 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/15 bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
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

        <form onSubmit={handleSignup} className="space-y-4">
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
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              required
              minLength={6}
              autoComplete="new-password"
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
                Create account <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-gray-500 text-xs text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
