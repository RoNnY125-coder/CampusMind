"use client";

import { SessionProvider } from "next-auth/react";
import { SupabaseAuthProvider } from "@/components/SupabaseAuthProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SupabaseAuthProvider>{children}</SupabaseAuthProvider>
    </SessionProvider>
  );
}
