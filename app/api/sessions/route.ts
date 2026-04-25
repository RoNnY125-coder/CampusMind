import { NextResponse } from "next/server";
import { getStudentSessions, deleteAllSessions } from "@/lib/chat-db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const sessions = await getStudentSessions(userId);
  return NextResponse.json({ sessions });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    await deleteAllSessions(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[sessions] delete error:", error);
    return NextResponse.json({ error: "Failed to delete sessions" }, { status: 500 });
  }
}

