"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogIn, Moon } from "lucide-react";
import ParticleField from "@/components/ParticleField";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/onboard");
  };

  return (
    <div className="screen-shell flex min-h-screen items-center justify-center px-4">
      <ParticleField />

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

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your username"
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

          {error && <span className="field-error" style={{ marginBottom: 16 }}>{error}</span>}

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
