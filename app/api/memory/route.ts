import { NextResponse } from "next/server";
import { listMemories } from "@/lib/memory";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const memories = await listMemories(userId);
  return NextResponse.json({ memories });
}
