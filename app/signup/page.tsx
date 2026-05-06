"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Moon } from "lucide-react";
import { motion } from "framer-motion";
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

  const handleSignup = async (event: FormEvent) => {
    event.preventDefault();
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
        options: { emailRedirectTo: getOAuthCallbackUrl() },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session?.access_token) {
        await ensureStudentProfile(data.session.access_token);
        router.push("/onboard");
        router.refresh();
        return;
      }

      setInfo("Check your email for a confirmation link. After confirming, you can sign in.");
    } catch (err) {
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
        options: { redirectTo: getOAuthCallbackUrl() },
      });
      if (oauthErr) throw oauthErr;
    } catch (err) {
      console.error("[signup] Google sign-in failed:", getOAuthErrorMessage(err));
      clearOAuthRedirectPath();
      setError(getOAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="screen-shell flex min-h-screen items-center justify-center px-4">
      <button onClick={() => router.back()} className="back-btn" aria-label="Go back">
        Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="form-card screen-content"
        style={{ margin: 0 }}
      >
        <div className="form-logo-row" style={{ justifyContent: "center", marginBottom: 20 }}>
          <Moon size={20} className="form-logo-icon" style={{ color: "var(--accent2)" }} />
          <div className="form-logo-text">CampusMind</div>
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--text)", textAlign: "center", marginBottom: 6 }}>
          Create An Account
        </h1>
        <p className="form-subtitle" style={{ textAlign: "center" }}>Sign up with email or Google</p>

        {(error || oauthError) && (
          <p style={{ color: "var(--red)", fontSize: 13, background: "var(--red-bg)", border: "1px solid rgba(252,165,165,0.2)", borderRadius: "var(--r-md)", padding: "10px 14px", marginBottom: 16 }}>
            {error || oauthError}
          </p>
        )}
        {info && (
          <p style={{ color: "var(--accent2)", fontSize: 13, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "var(--r-md)", padding: "10px 14px", marginBottom: 16 }}>
            {info}
          </p>
        )}

        <button type="button" onClick={handleGoogle} disabled={isLoading} className="btn btn-ghost" style={{ width: "100%", marginBottom: 16, padding: 14 }}>
          Continue with Google
        </button>

        <div style={{ position: "relative", marginBottom: 24 }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center" }}>
            <div style={{ width: "100%", borderTop: "1px solid var(--border2)" }} />
          </div>
          <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
            <span style={{ background: "rgba(18,18,18,0.78)", padding: "0 12px", fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>or email</span>
          </div>
        </div>

        <form onSubmit={handleSignup}>
          <div className="form-field">
            <label className="field-label" htmlFor="signup-email">Email</label>
            <input id="signup-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your username" required autoComplete="email" className="form-input" />
          </div>
          <div className="form-field">
            <label className="field-label" htmlFor="signup-password">Password</label>
            <input id="signup-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required minLength={6} autoComplete="new-password" className="form-input" />
          </div>
          <div className="form-field" style={{ marginBottom: 24 }}>
            <label className="field-label" htmlFor="signup-confirm">Confirm password</label>
            <input id="signup-confirm" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Repeat your password" required minLength={6} autoComplete="new-password" className="form-input" />
          </div>
          <button type="submit" disabled={isLoading} className="form-submit">
            {isLoading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <span className="inline-flex items-center justify-center gap-2">Create account <ArrowRight size={16} /></span>}
          </button>
        </form>

        <p style={{ color: "var(--muted)", fontSize: 12, textAlign: "center", marginTop: 24 }}>
          Already have an account? <Link href="/login" style={{ color: "var(--accent2)", textDecoration: "none", fontWeight: 700 }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
