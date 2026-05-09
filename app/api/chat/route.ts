export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import {
  getOrCreateSession,
  getSessionMessages,
  saveMessage,
  updateSessionTitle,
} from "@/lib/chat-db";
import { formatClubContext, getCollegeId, retrieveRelevantClubs } from "@/lib/rag";
import { getStudentProfile, type StudentProfile } from "@/lib/student-profile";
import type { ChatRequest } from "@/lib/types";
import { logger } from "@/lib/logger";

const MODEL = "llama-3.3-70b-versatile";
const MAX_TOKENS = 1024;
const HISTORY_LIMIT = 6;

let cachedCollegeId: string | null = null;

async function getOrFetchCollegeId() {
  if (!cachedCollegeId) cachedCollegeId = await getCollegeId("vit-bhopal");
  return cachedCollegeId;
}

function normalizeClientProfile(profile: ChatRequest["userProfile"]): StudentProfile | null {
  if (!profile?.name) return null;

  return {
    name: profile.name,
    college: profile.college || "VIT Bhopal University",
    collegeId: null,
    branch: profile.branch || "Not specified",
    year: profile.year || "Not specified",
    interests: [],
    clubs: profile.clubs ? profile.clubs.split(",").map((club) => club.trim()).filter(Boolean) : [],
    hasOnboarded: true,
  };
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

function buildSystemPrompt(profile: StudentProfile | null, clubContext: string) {
  const name = profile?.name || "Student";
  const college = profile?.college || "VIT Bhopal University";
  const branch = profile?.branch || "Not specified";
  const year = profile?.year || "Not specified";
  const interests = profile?.interests?.length ? profile.interests.join(", ") : "Not specified yet";
  const clubs = profile?.clubs?.length ? profile.clubs.join(", ") : "Not specified yet";

  return `You are CampusMind, an intelligent campus assistant for ${college}.
Your job is to help students discover clubs, chapters, communities, and campus opportunities using the real club data below.

STUDENT PROFILE
- Name: ${name}
- First name: ${firstName(name)}
- College: ${college}
- Branch: ${branch}
- Year: ${year}
- Known interests: ${interests}
- Clubs of interest: ${clubs}

REAL CLUB DATA
${clubContext}

RULES
1. Always address the student by first name.
2. Personalise every answer using their branch, year, and club interests.
3. Recommend only clubs from REAL CLUB DATA. If none match, ask a short clarifying question.
4. Recommend 3-5 clubs max unless the student asks for more.
5. For a specific club question, include its name, category, description, and contact if present.
6. Return valid JSON only. No markdown fences, no preamble, no trailing text.

RESPONSE FORMAT
{
  "text": "Conversational response here.",
  "recommendations": ["Exact Club Name 1", "Exact Club Name 2"]
}`;
}

function toPromptHistory(messages: Awaited<ReturnType<typeof getSessionMessages>>, fallback: ChatRequest["history"]) {
  if (messages.length > 0) {
    return messages
      .map((message) => ({ role: message.role as "user" | "assistant", content: message.content }))
      .slice(0, -1)
      .slice(-HISTORY_LIMIT);
  }

  return fallback.slice(-HISTORY_LIMIT).map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

async function loadProfileAndSession(userId: string, sessionId?: string) {
  const profilePromise = getStudentProfile(userId);
  const sessionPromise = getOrCreateSession(userId, sessionId).catch((error) => {
    logger.error("[chat] session persistence unavailable:", error);
    return null;
  });

  const [profile, session] = await Promise.all([profilePromise, sessionPromise]);
  return { profile, session };
}

async function saveChatMessage(
  sessionId: string | null,
  userId: string,
  role: "user" | "assistant",
  content: string
) {
  if (!sessionId) return;

  try {
    await saveMessage(sessionId, userId, role, content);
  } catch (error) {
    logger.error("[chat] message persistence unavailable:", error);
  }
}

async function loadPromptHistory(
  sessionId: string | null,
  fallback: ChatRequest["history"]
) {
  if (!sessionId) return toPromptHistory([], fallback);

  try {
    const messages = await getSessionMessages(sessionId, HISTORY_LIMIT + 1);
    return toPromptHistory(messages, fallback);
  } catch (error) {
    logger.error("[chat] history unavailable:", error);
    return toPromptHistory([], fallback);
  }
}

async function updateTitleIfAvailable(sessionId: string | null, title: string) {
  if (!sessionId) return;

  try {
    await updateSessionTitle(sessionId, title);
  } catch (error) {
    logger.error("[chat] session title update failed:", error);
  }
}

async function resolveCollegeId(profile: StudentProfile | null) {
  if (profile?.collegeId) return profile.collegeId;

  try {
    return await getOrFetchCollegeId();
  } catch (error) {
    logger.error("[chat] college lookup unavailable:", error);
    return null;
  }
}

async function buildClubContext(message: string, collegeId: string | null) {
  if (!collegeId) {
    return "No club data available. Ask the student what they want to explore next.";
  }

  try {
    const clubs = await retrieveRelevantClubs(message, collegeId, 5);
    return formatClubContext(clubs);
  } catch (error) {
    logger.error("[chat] club retrieval unavailable:", error);
    return "Club search is temporarily unavailable. Answer generally and ask a clarifying question.";
  }
}

export async function POST(request: Request) {
  try {
    const { message, userId, history = [], sessionId, userProfile } =
      (await request.json()) as ChatRequest;

    logger.debug("[chat] incoming request:", { userId, sessionId, messageLength: message?.length });

    if (!message || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      logger.error("[chat] GROQ_API_KEY is not configured.");
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 503 });
    }

    const groq = new Groq({ apiKey });
    const { profile: storedProfile, session } = await loadProfileAndSession(userId, sessionId);
    const profile = storedProfile ?? normalizeClientProfile(userProfile);
    const collegeId = await resolveCollegeId(profile);
    const activeSessionId = session?.id ?? null;

    logger.debug("[chat] profile resolved:", { 
      hasStoredProfile: !!storedProfile, 
      collegeId, 
      activeSessionId 
    });

    if (!sessionId) {
      const title = message.length > 50 ? `${message.slice(0, 50)}...` : message;
      await updateTitleIfAvailable(activeSessionId, title);
    }

    await saveChatMessage(activeSessionId, userId, "user", message);
    const clubContext = await buildClubContext(message, collegeId);
    const promptHistory = await loadPromptHistory(activeSessionId, history);
    const systemPrompt = buildSystemPrompt(profile, clubContext);

    logger.debug("[chat] prompt context built", { 
      historyLength: promptHistory.length,
      clubContextLength: clubContext.length 
    });

    const chatCompletion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...promptHistory,
        { role: "user", content: message },
      ],
      temperature: 0.4,
      max_tokens: MAX_TOKENS,
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
          logger.error("[chat] stream error:", error);
        } finally {
          controller.close();
          if (fullResponse.trim()) {
            await saveChatMessage(activeSessionId, userId, "assistant", fullResponse);
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        ...(activeSessionId ? { "X-Session-Id": activeSessionId } : {}),
      },
    });
  } catch (error) {
    logger.error("[chat] route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

