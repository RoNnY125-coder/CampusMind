import { NextResponse } from "next/server";
import { retainMemory, studentBank } from "@/lib/hindsight";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
    const { name, year, branch, interests = [], clubs = [] } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Missing Authorization bearer token" }, { status: 401 });
    }

    const admin = supabaseServer();
    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(token);

    if (userError || !user) {
      console.error("[onboard] getUser failed:", userError?.message);
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    if (!name || !year || !branch) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const userId = user.id;
    console.log("[onboard] saving student profile", { userId });

    const { error: dbError } = await admin.from("students").upsert(
      {
        id: userId,
        email: user.email ?? null,
        name,
        year,
        branch,
        interests,
        clubs,
        has_onboarded: true,
      },
      { onConflict: "id" }
    );

    if (dbError) {
      console.error("[onboard] Supabase error:", dbError);
      return NextResponse.json({ error: dbError.message || "Failed to save profile" }, { status: 500 });
    }

    const memoriesToRetain = [
      { content: `Student's name is ${name}`, type: "world" as const },
      { content: `${name} is in ${year} studying ${branch}`, type: "observation" as const },
      { content: `${name} is interested in: ${interests.join(", ")}`, type: "observation" as const },
      { content: `${name} has joined: ${clubs.join(", ")}`, type: "experience" as const },
      { content: `Onboarded on ${new Date().toLocaleDateString("en-IN")}`, type: "experience" as const },
    ];

    const results = await Promise.allSettled(
      memoriesToRetain.map((memory) => retainMemory(studentBank(userId), memory.content, memory.type))
    );

    const failed = results.filter((result) => result.status === "rejected");
    if (failed.length > 0) {
      console.error(`[onboard] Failed to retain ${failed.length}/${results.length} memories`);
      failed.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(`[onboard] memory ${index + 1} error:`, result.reason);
        }
      });
    } else {
      console.log(`[onboard] Retained ${results.length} onboarding memories`);
    }

    return NextResponse.json({ ok: true, userId });
  } catch (error) {
    console.error("[onboard] route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
