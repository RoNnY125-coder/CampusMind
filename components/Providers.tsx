"use client";

import { SupabaseAuthProvider } from "@/components/SupabaseAuthProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
}
