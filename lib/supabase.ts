import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️  Supabase URL or Anon Key is missing. Check your .env.local file.');
}

const safeUrl = SUPABASE_URL || "https://placeholder.supabase.co";
const safeAnonKey = SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(safeUrl, safeAnonKey);
