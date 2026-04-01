import { supabaseServer } from "./supabase-server";

export async function getOrCreateSession(studentId: string, sessionId?: string) {
  const db = supabaseServer();

  if (sessionId) {
    const { data } = await db
      .from("chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("student_id", studentId)
      .single();
    if (data) return data;
  }

  const { data, error } = await db
    .from("chat_sessions")
    .insert({ student_id: studentId, title: "New Chat" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveMessage(
  sessionId: string,
  studentId: string,
  role: "user" | "assistant",
  content: string
) {
  const db = supabaseServer();
  const { error } = await db.from("chat_messages").insert({
    session_id: sessionId,
    student_id: studentId,
    role,
    content,
  });
  if (error) console.error("[chat-db] saveMessage error:", error);
}

export async function getSessionMessages(sessionId: string, limit = 50) {
  const db = supabaseServer();
  const { data, error } = await db
    .from("chat_messages")
    .select("role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) return [];
  return data ?? [];
}

export async function getStudentSessions(studentId: string) {
  const db = supabaseServer();
  const { data } = await db
    .from("chat_sessions")
    .select("id, title, created_at, updated_at")
    .eq("student_id", studentId)
    .order("updated_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function updateSessionTitle(sessionId: string, title: string) {
  const db = supabaseServer();
  await db
    .from("chat_sessions")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", sessionId);
}
