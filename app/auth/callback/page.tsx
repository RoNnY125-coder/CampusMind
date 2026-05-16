"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabaseAuth } from "@/components/SupabaseAuthProvider";
import { ensureStudentProfile } from "@/lib/auth-helpers";
import { getOAuthRedirectCookieName, normalizeAuthRedirectPath } from "@/lib/auth/oauth";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useSupabaseAuth();
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    const errorParam =
      searchParams.get("error_description") ||
      searchParams.get("error") ||
      searchParams.get("message");

    if (errorParam) {
      router.push(`/login?error=${encodeURIComponent(errorParam)}`);
      return;
    }

    if (session && !processed) {
      setProcessed(true);
      ensureStudentProfile(session.access_token).then((result) => {
        const cookies = document.cookie.split(";").reduce((acc, cookie) => {
          const [name, value] = cookie.split("=").map((c) => c.trim());
          acc[name] = value;
          return acc;
        }, {} as Record<string, string>);

        const nextPathRaw = cookies[getOAuthRedirectCookieName()];
        const next = normalizeAuthRedirectPath(decodeURIComponent(nextPathRaw || ""));

        document.cookie = `${getOAuthRedirectCookieName()}=; Path=/; Max-Age=0; SameSite=Lax`;

        let redirectPath = next;
        if (result.hasOnboarded && next === "/onboard") {
          redirectPath = "/chat";
        } else if (!result.hasOnboarded && next === "/chat") {
          redirectPath = "/onboard";
        }

        router.push(redirectPath);
      });
    }
  }, [session, processed, router, searchParams]);

  return (
    <div className="screen-shell flex min-h-screen items-center justify-center">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
        <div style={{ width: 48, height: 48, border: "4px solid rgba(212,212,212,0.25)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <p style={{ fontFamily: "var(--font-body)", color: "var(--text2)" }}>Completing sign in...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="screen-shell flex min-h-screen items-center justify-center">
        <div style={{ width: 48, height: 48, border: "4px solid rgba(212,212,212,0.25)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
