// Centralized, typed env access. Import from here, not process.env.
function requireServerEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`[CampusMind] Missing required server env: ${key}`);
  return val;
}

function optionalEnv(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

export const GROQ_API_KEY = () => requireServerEnv("GROQ_API_KEY");
export const HINDSIGHT_API_KEY = () => requireServerEnv("HINDSIGHT_API_KEY");
export const SUPABASE_SERVICE_KEY = () => requireServerEnv("SUPABASE_SERVICE_ROLE_KEY");
export const NEXTAUTH_SECRET = () => requireServerEnv("NEXTAUTH_SECRET");
export const HINDSIGHT_BASE_URL = () =>
  optionalEnv("HINDSIGHT_BASE_URL", "https://api.hindsight.vectorize.io");

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
