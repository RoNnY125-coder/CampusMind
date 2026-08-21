"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ensureStudentProfile } from "@/lib/auth-helpers";

export default function ImplicitHandlerPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Authenticating...");

  useEffect(() => {
    async function handleAuth() {
      // Supabase automatically parses the hash and sets the session locally
      // We just need to check if we have a session
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          setStatus("Profile sync...");
          const result = await ensureStudentProfile(session.access_token);
          if (result.hasOnboarded) {
            router.push("/chat");
          } else {
            router.push("/onboard");
          }
        } else {
          router.push("/login?error=no_session_found");
        }
      } catch (err) {
        console.error("Implicit auth error:", err);
        router.push("/login?error=implicit_auth_failed");
      }
    }

    handleAuth();
  }, [router]);

  return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
      <p style={{ color: 'var(--text, #fff)' }}>{status}</p>
    </div>
  );
}
