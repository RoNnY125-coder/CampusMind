import { createSupabaseBrowserClient } from "./supabase/browser";

/** Single browser Supabase client (session persisted via @supabase/ssr + storage). */
export const supabase = createSupabaseBrowserClient();
