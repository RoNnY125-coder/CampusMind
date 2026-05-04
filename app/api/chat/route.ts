// app/api/chat/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import {
  getOrCreateSession,
  getSessionMessages,
  saveMessage,
  updateSessionTitle,
} from "@/lib/chat-db";
import { getStudentProfile } from "@/lib/student-profile";
import { retrieveRelevantClubs, formatClubContext, getCollegeId } from "@/lib/rag";
import type { ChatRequest } from "@/lib/types";

// Cache college ID in memory — it never changes at runtime
let cachedCollegeId: string | null = null;

async function getOrFetchCollegeId(): Promise<string | null> {
  if (cachedCollegeId) return cachedCollegeId;
  cachedCollegeId = await getCollegeId("vit-bhopal");
  return cachedCollegeId;
}

function buildSystemPrompt(
  profile: {
    name: string;
    year: string;
    college: string;
    branch: string;
    interests: string[];
    clubs: string[];
  } | null,
  clubContext: string
): string {
  const pName    = profile?.name     || "Student";
  const pCollege = profile?.college  || "VIT Bhopal University";
  const pBranch  = profile?.branch   || "Not specified";
  const pYear    = profile?.year     || "Not specified";
  const pInterests = (profile?.interests?.length ?? 0) > 0
    ? profile!.interests.join(", ")
    : "Not specified yet";

  return `You are CampusMind, an intelligent and friendly campus assistant for ${pCollege}.
Your ONLY job is to help students discover clubs, chapters, and communities using the REAL CLUB DATA provided below.

## STUDENT PROFILE
- Name: ${pName}
- College: ${pCollege}
- Branch: ${pBranch}
- Year: ${pYear}
- Known Interests: ${pInterests}

## REAL CLUB DATA (retrieved for this query — use ONLY these clubs):
${clubContext}

## STRICT RULES
1. ONLY recommend clubs from the REAL CLUB DATA section above. Never invent or hallucinate club names.
2. If no clubs match, say so honestly and suggest the student rephrase or explore broadly.
3. Always address the student by their first name (${pName.split(" ")[0]}).
4. Recommend 3–5 clubs max unless the student explicitly asks for more.
5. For each recommended club: mention its name, why it matches their interest, and the contact.
6. Be warm and conversational — like a helpful senior student, not a robot.
7. If the student's message is general (e.g. "hi", "help"), ask what they're interested in before recommending.
8. ALL RESPONSES MUST BE VALID JSON ONLY — no markdown outside the JSON object.

## REQUIRED RESPONSE FORMAT (JSON only, no extra text):
{
  "text": "Your conversational response here. Address them by name.",
  "recommendations": ["Exact Club Name 1", "Exact Club Name 2"]
}

If no recommendations apply, return an empty array: "recommendations": []`;
}

export async function POST(request: Request) {
  try {
    const { message, userId, history = [], sessionId } =
      (await request.json()) as ChatRequest;

    if (!message || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured" },
        { status: 503 }
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Run profile fetch + session creation in parallel
    const [profile, session] = await Promise.all([
      getStudentProfile(userId),
      getOrCreateSession(userId, sessionId),
    ]);

    // Use student's own college_id if available, fallback to VIT Bhopal
    const collegeId = profile?.collegeId ?? await getOrFetchCollegeId();

    if (!sessionId) {
      const title = message.length > 50 ? `${message.slice(0, 50)}...` : message;
      await updateSessionTitle(session.id, title);
    }

    // Save user message
    await saveMessage(session.id, userId, "user", message);

    // RAG: retrieve relevant clubs for this specific query
    let clubContext = "No club data available. Advise the student to contact the DSW office.";
    if (collegeId) {
      const relevantClubs = await retrieveRelevantClubs(message, collegeId, 5);
      clubContext = formatClubContext(relevantClubs);
    }

    // Load chat history from DB
    const dbHistory = await getSessionMessages(session.id, 40);
    const promptHistory =
      dbHistory.length > 0
        ? dbHistory.map((msg) => ({ role: msg.role as "user" | "assistant", content: msg.content }))
        : history.map((msg) => ({ role: msg.role, content: msg.content }));

    const systemPrompt = buildSystemPrompt(profile, clubContext);

    console.log("[chat] request start", {
      userId,
      sessionId: session.id,
      historyLength: promptHistory.length,
      profileLoaded: !!profile,
      collegeId,
      clubContextLength: clubContext.length,
    });

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...promptHistory,
        { role: "user", content: message },
      ],
      temperature: 0.4,
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
          console.log("[chat] request complete", {
            userId,
            sessionId: session.id,
          });
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
