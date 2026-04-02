"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<Session | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const refreshSession = useCallback(async () => {
    console.log("[auth] refreshSession start");
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("[auth] getSession error:", error.message);
      setSession(null);
      setUser(null);
      return null;
    }
    console.log("[auth] refreshSession result:", data.session?.user?.id ?? "no-session");
    setSession(data.session);
    setUser(data.session?.user ?? null);
    return data.session;
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    const settleAuth = (source: string, nextSession: Session | null) => {
      if (!mounted) return;
      console.log("[auth] settle:", source, nextSession?.user?.id ?? "no-session");
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    };

    void (async () => {
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error(`[auth] initial getSession attempt ${attempt}:`, error.message);
        } else {
          console.log(
            `[auth] initial getSession attempt ${attempt}:`,
            data.session?.user?.id ?? "no-session"
          );
        }

        if (data.session) {
          settleAuth(`initial-getSession-${attempt}`, data.session);
          return;
        }

        if (attempt < 5) {
          await new Promise((resolve) => window.setTimeout(resolve, 250));
        }
      }
      settleAuth("initial-getSession-timeout", null);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, nextSession: Session | null) => {
        console.log("[auth] onAuthStateChange:", event, nextSession?.user?.id ?? "no-session");
        settleAuth(`auth-event-${event}`, nextSession);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("[auth] signOut error:", error.message);
    setSession(null);
    setUser(null);
  }, [supabase.auth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      signOut,
      refreshSession,
    }),
    [user, session, loading, signOut, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSupabaseAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useSupabaseAuth must be used within SupabaseAuthProvider");
  }
  return ctx;
}
