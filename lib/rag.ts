// lib/rag.ts
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";

let groqClient: Groq | null = null;

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  return groqClient;
}

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export interface RelevantClub {
  club_id:    string;
  club_name:  string;
  chunk_text: string;
  category:   string;
  contact:    string;
  similarity: number;
}

/**
 * Embed a user query using Groq nomic-embed-text-v1-5
 */
async function embedQuery(query: string): Promise<number[]> {
  const response = await getGroqClient().embeddings.create({
    model: "nomic-embed-text-v1-5",
    input: query,
  });
  return response.data[0].embedding as number[];
}

/**
 * Get the UUID of a college by its slug
 */
export async function getCollegeId(slug: string): Promise<string | null> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("colleges")
    .select("id")
    .eq("slug", slug)
    .single();
  return data?.id ?? null;
}

/**
 * Retrieve the top-k most relevant clubs for a query.
 * Falls back to empty array on any error so the chat never breaks.
 */
export async function retrieveRelevantClubs(
  query:     string,
  collegeId: string,
  topK:      number = 5
): Promise<RelevantClub[]> {
  try {
    const embedding = await embedQuery(query);
    const db = supabaseAdmin();

    const { data, error } = await db.rpc("match_clubs", {
      query_embedding: JSON.stringify(embedding),
      college_filter:  collegeId,
      match_count:     topK,
    });

    if (error) {
      console.error("[rag] match_clubs error:", error);
      return [];
    }

    return (data as RelevantClub[]) ?? [];
  } catch (e) {
    console.error("[rag] retrieveRelevantClubs error:", e);
    return [];
  }
}

/**
 * Format retrieved clubs into a readable context block for injection into the system prompt.
 */
export function formatClubContext(clubs: RelevantClub[]): string {
  if (clubs.length === 0) {
    return "No specific clubs found for this query. Use your general knowledge about the college.";
  }

  return clubs
    .map((c, i) =>
      `[Club ${i + 1}]\n${c.chunk_text}`
    )
    .join("\n\n");
}
