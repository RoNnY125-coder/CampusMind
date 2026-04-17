import { createClient } from "@supabase/supabase-js";

export interface StudentProfile {
  name: string;
  year: string;
  branch: string;
  interests: string[];
  clubs: string[];
  hasOnboarded: boolean;
}

export async function getStudentProfile(userId: string): Promise<StudentProfile | null> {
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data, error } = await db
      .from("students")
      .select("name, year, branch, interests, clubs, has_onboarded")
      .eq("id", userId)
      .single();

    if (error || !data) return null;

    return {
      name: data.name,
      year: data.year,
      branch: data.branch,
      interests: Array.isArray(data.interests) ? data.interests : [],
      clubs: Array.isArray(data.clubs) ? data.clubs : [],
      hasOnboarded: data.has_onboarded,
    };
  } catch {
    return null;
  }
}
