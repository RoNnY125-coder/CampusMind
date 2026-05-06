"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogIn, Moon } from "lucide-react";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) setError(decodeURIComponent(err));
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (data.session?.access_token) {
        await ensureStudentProfile(data.session.access_token);
      }

      router.push("/onboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");

    try {
      persistOAuthRedirectPath("/onboard");
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: getOAuthCallbackUrl() },
      });
      if (oauthErr) throw oauthErr;
    } catch (err) {
      console.error("[login] Google sign-in failed:", getOAuthErrorMessage(err));
      clearOAuthRedirectPath();
      setError(getOAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-shell flex min-h-screen items-center justify-center px-4">
      <button onClick={() => router.push("/")} className="back-btn" aria-label="Go back">
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
          Welcome Back
        </h1>
        <p className="form-subtitle" style={{ textAlign: "center" }}>Sign in to your campus assistant</p>

        {error && (
          <p style={{ color: "var(--red)", fontSize: 13, background: "var(--red-bg)", border: "1px solid rgba(252,165,165,0.2)", borderRadius: "var(--r-md)", padding: "10px 14px", marginBottom: 16 }}>
            {error}
          </p>
        )}

        <button type="button" onClick={handleGoogle} disabled={loading} className="btn btn-ghost" style={{ width: "100%", marginBottom: 16, padding: 14 }}>
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

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              required
              autoComplete="email"
              className="form-input"
            />
          </div>

          <div className="form-field" style={{ marginBottom: 24 }}>
            <label className="field-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="form-input"
            />
          </div>

          <button type="submit" disabled={loading} className="form-submit">
            <span className="inline-flex items-center justify-center gap-2">
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <LogIn size={16} />}
            </span>
          </button>
        </form>

        <p style={{ color: "var(--muted)", fontSize: 12, textAlign: "center", marginTop: 24 }}>
          New here?{" "}
          <button type="button" onClick={() => router.push("/signup")} style={{ color: "var(--accent2)", background: "transparent", border: 0, cursor: "pointer", fontWeight: 700 }}>
            Create an account
          </button>
        </p>
      </motion.div>
    </div>
  );
}
