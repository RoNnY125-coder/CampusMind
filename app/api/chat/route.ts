export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getOrCreateSession, getSessionMessages, saveMessage, updateSessionTitle } from "@/lib/chat-db";
import { getStudentProfile } from "@/lib/student-profile";
import type { ChatRequest } from "@/lib/types";

function buildSystemPrompt(profile: {
  name: string;
  year: string;
  college: string;
  branch: string;
  interests: string[];
  clubs: string[];
} | null): string {
  const pName = profile?.name || "Student";
  const pCollege = profile?.college || "VIT Bhopal University";
  const pBranch = profile?.branch || "Not specified";
  const pYear = profile?.year || "Not specified";
  const pClubs = (profile?.clubs && profile.clubs.length > 0) ? profile.clubs.join(", ") : "Not specified";

  return `You are CampusMind, an intelligent and friendly campus assistant for ${pCollege}. Your job is to help students discover the best clubs, chapters, and communities based on their personal interests, hobbies, skills, and goals.

## STUDENT PROFILE (use this to personalise every response):
- Name: ${pName}
- College: ${pCollege}
- Branch/Department: ${pBranch}
- Academic Year: ${pYear}
- Clubs of Interest: ${pClubs}

Always address the student by their first name. Tailor club recommendations to their branch and year. Reference their clubs of interest when relevant.

## YOUR BEHAVIOR RULES:
1. Always start by asking the student about their interests if they haven't mentioned any.
2. Match clubs to interests precisely.
3. Recommend max 3-5 clubs unless asked for more.
4. If the user asks to list all clubs, provide a broad overview instead of dumping all.
5. Be friendly, encouraging, and conversational — not robotic.
6. Handle vague interests logically: "make friends" -> cultural clubs, "career" -> technical clubs.
7. ALL RESPONSES MUST BE STRICTLY VALID JSON. DO NOT INCLUDE ANY MARKDOWN formatting (like \`\`\`json) outside the JSON object.

## REQUIRED RESPONSE FORMAT (JSON ONLY):
{
  "text": "Your conversational response here. Address them by name and explain why you picked these clubs.",
  "recommendations": ["Exact Club Name 1", "Exact Club Name 2"]
}`;
}

export async function POST(request: Request) {
  try {
    const { message, userId, history = [], sessionId } = (await request.json()) as ChatRequest;

    if (!message || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 503 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Fetch student profile to personalize the system prompt
    const profile = await getStudentProfile(userId);

    const session = await getOrCreateSession(userId, sessionId);

    if (!sessionId) {
      const title = message.length > 50 ? `${message.slice(0, 50)}...` : message;
      await updateSessionTitle(session.id, title);
    }

    await saveMessage(session.id, userId, "user", message);

    const dbHistory = await getSessionMessages(session.id, 40);
    const promptHistory =
      dbHistory.length > 0
        ? dbHistory.map((msg) => ({ role: msg.role, content: msg.content }))
        : history.map((msg) => ({ role: msg.role, content: msg.content }));

    const systemPrompt = buildSystemPrompt(profile);

    console.log("[chat] request start", { userId, sessionId: session.id, history: promptHistory.length, profileLoaded: !!profile });

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...promptHistory,
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
      response_format: { type: "json_object" },
    });

    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of chatCompletion) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (!text) continue;
            fullResponse += text;
            controller.enqueue(new TextEncoder().encode(text));
          }
        } catch (error) {
          console.error("[chat] stream error:", error);
        } finally {
          controller.close();
          if (fullResponse.trim()) {
            await saveMessage(session.id, userId, "assistant", fullResponse);
          }
          console.log("[chat] request complete", { userId, sessionId: session.id });
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Session-Id": session.id,
      },
    });
  } catch (error) {
    console.error("[chat] route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
