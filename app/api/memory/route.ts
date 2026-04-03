import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    const { data, error } = await db
      .from("chat_messages")
      .select("id, content, role, created_at")
      .eq("student_id", userId)
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("[memory] DB error:", error);
      return NextResponse.json({ memories: [] });
    }

    const memories = (data ?? []).map((message) => ({
      id: message.id,
      content: message.content.slice(0, 120),
      type: "experience" as const,
      created_at: message.created_at,
      tags: [],
    }));

    return NextResponse.json({ memories });
  } catch (error) {
    console.error("[memory] error:", error);
    return NextResponse.json({ memories: [] });
  }
}
