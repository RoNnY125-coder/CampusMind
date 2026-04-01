function requireServerEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`[CampusMind] Missing required server env: ${key}`);
  return val;
}

function optionalEnv(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

// Getter-based access so validation runs at request-time, not module load.
export const env = {
  // Server-only (never sent to browser)
  get GROQ_API_KEY() {
    return requireServerEnv("GROQ_API_KEY");
  },
  get HINDSIGHT_API_KEY() {
    return requireServerEnv("HINDSIGHT_API_KEY");
  },
  get SUPABASE_SERVICE_ROLE_KEY() {
    return requireServerEnv("SUPABASE_SERVICE_ROLE_KEY");
  },

  // Public / safe in browser (no throwing)
  get NEXT_PUBLIC_SUPABASE_URL() {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  },

  // Optional
  get HINDSIGHT_BASE_URL() {
    return optionalEnv("HINDSIGHT_BASE_URL", "https://api.hindsight.vectorize.io");
  },
} as const;
