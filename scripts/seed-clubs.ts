// scripts/seed-clubs.ts
// Run with: npx tsx scripts/seed-clubs.ts

import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";
import { CLUBS } from "../lib/clubs";
import * as fs from "fs";
import * as path from "path";

// Manually load .env.local for standalone script execution
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

async function embedText(text: string): Promise<number[]> {
  try {
    const response = await groq.embeddings.create({
      model: "nomic-embed-text-v1.5",
      input: text,
    });
    return response.data[0].embedding as number[];
  } catch (e: any) {
    if (e?.status === 404) {
      // Fallback to dash version if dot version fails
      const response = await groq.embeddings.create({
        model: "nomic-embed-text-v1-5",
        input: text,
      });
      return response.data[0].embedding as number[];
    }
    throw e;
  }
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
    // Check if club exists
    const { data: existingClub } = await supabase
      .from("clubs")
      .select("id")
      .eq("college_id", collegeId)
      .eq("name", club.name)
      .maybeSingle();

    let clubId: string;
    if (existingClub) {
      clubId = existingClub.id;
      const { error: updateError } = await supabase
        .from("clubs")
        .update({
          category:    club.cat,
          description: club.desc,
          contact:     club.contact,
          tags:        club.tags,
          is_active:   true,
        })
        .eq("id", clubId);
      
      if (updateError) {
        console.error(`Failed to update club "${club.name}":`, updateError);
        continue;
      }
    } else {
      const { data: newClub, error: insertError } = await supabase
        .from("clubs")
        .insert({
          college_id:  collegeId,
          name:        club.name,
          category:    club.cat,
          description: club.desc,
          contact:     club.contact,
          tags:        club.tags,
          is_active:   true,
        })
        .select("id")
        .single();
      
      if (insertError || !newClub) {
        console.error(`Failed to insert club "${club.name}":`, insertError);
        continue;
      }
      clubId = newClub.id;
    }

    // Delete old embedding for this club (clean re-seed)
    await supabase
      .from("club_embeddings")
      .delete()
      .eq("club_id", clubId);

    // Generate and store embedding
    const chunkText = buildChunkText(club);
    try {
      const embedding = await embedText(chunkText);
      const { error: embedError } = await supabase
        .from("club_embeddings")
        .insert({
          club_id:    clubId,
          chunk_text: chunkText,
          embedding:  JSON.stringify(embedding),
        });

      if (embedError) {
        console.error(`Embedding insert failed for "${club.name}":`, embedError);
      } else {
        console.log(`✓ ${club.name}`);
      }
    } catch (e) {
      console.warn(`! Skipping embedding for "${club.name}" (Model unavailable or error)`);
    }
  }

  console.log("\nDone. All clubs processed.");
}

main().catch(console.error);
