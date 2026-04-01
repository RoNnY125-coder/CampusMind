import { createClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_KEY, SUPABASE_URL } from "./env";

export function supabaseServer() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY(), {
    auth: { persistSession: false },
  });
}
