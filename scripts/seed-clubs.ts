// scripts/seed-clubs.ts
// Run with: npx tsx scripts/seed-clubs.ts

import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";
import { CLUBS } from "../lib/clubs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

async function embedText(text: string): Promise<number[]> {
  const response = await groq.embeddings.create({
    model: "nomic-embed-text-v1-5",
    input: text,
  });
  return response.data[0].embedding as number[];
}

function buildChunkText(club: typeof CLUBS[0]): string {
  return `Club name: ${club.name}
Category: ${club.cat}
Description: ${club.desc}
Tags: ${club.tags.join(", ")}
Contact: ${club.contact}`;
}

async function main() {
  console.log("Fetching VIT Bhopal college ID...");
  const { data: college, error: collegeError } = await supabase
    .from("colleges")
    .select("id")
    .eq("slug", "vit-bhopal")
    .single();

  if (collegeError || !college) {
    console.error("College not found. Run the SQL migration first.", collegeError);
    process.exit(1);
  }

  const collegeId = college.id;
  console.log(`College ID: ${collegeId}`);
  console.log(`Seeding ${CLUBS.length} clubs...`);

  for (const club of CLUBS) {
    // Upsert club
    const { data: clubRow, error: clubError } = await supabase
      .from("clubs")
      .upsert({
        college_id:  collegeId,
        name:        club.name,
        category:    club.cat,
        description: club.desc,
        contact:     club.contact,
        tags:        club.tags,
        is_active:   true,
      }, { onConflict: "name,college_id" })
      .select("id")
      .single();

    if (clubError || !clubRow) {
      console.error(`Failed to upsert club "${club.name}":`, clubError);
      continue;
    }

    // Delete old embedding for this club (clean re-seed)
    await supabase
      .from("club_embeddings")
      .delete()
      .eq("club_id", clubRow.id);

    // Generate and store embedding
    const chunkText = buildChunkText(club);
    try {
      const embedding = await embedText(chunkText);
      const { error: embedError } = await supabase
        .from("club_embeddings")
        .insert({
          club_id:    clubRow.id,
          chunk_text: chunkText,
          embedding:  JSON.stringify(embedding),
        });

      if (embedError) {
        console.error(`Embedding insert failed for "${club.name}":`, embedError);
      } else {
        console.log(`✓ ${club.name}`);
      }
    } catch (e) {
      console.error(`Embedding generation failed for "${club.name}":`, e);
    }

    // Rate limit guard — Groq embeddings: 30 req/min on free tier
    await new Promise((r) => setTimeout(r, 2100));
  }

  console.log("\nDone. All clubs embedded.");
}

main().catch(console.error);
