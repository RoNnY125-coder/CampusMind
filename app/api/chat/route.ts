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

const MAX_TOKENS = 1024;
const HISTORY_LIMIT = 10;

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

    // Fetch student profile for personalised context
    let studentProfile: any = null;
    if (userId && !userId.startsWith('fallback-') && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const db = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { auth: { persistSession: false } }
        );
        const { data } = await db
          .from('students')
          .select('name, year, branch, interests, clubs')
          .eq('id', userId)
          .single();
        studentProfile = data;
      } catch (e) {
        console.error('[chat] Failed to fetch student profile:', e);
      }
    }

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

    const systemPrompt = `You are CampusMind — a sharp, friendly senior student at ${studentProfile?.branch || 'college'} who helps juniors navigate campus life.

STUDENT CONTEXT (use this naturally in conversation, never announce that you're using it):
- Name: ${studentProfile?.name || 'the student'}
- Year: ${studentProfile?.year || 'college student'}
- Branch: ${studentProfile?.branch || 'engineering'}
- Interests: ${studentProfile?.interests?.join(', ') || 'general'}
- Clubs: ${studentProfile?.clubs?.join(', ') || 'none yet'}

HOW TO TALK — THIS IS CRITICAL:
- Talk like a real person texting a friend. Short. Direct. Genuine.
- NEVER start with "Hi!", "Hello!", "Sure!", "Great question!", "Absolutely!", "Of course!" — these are banned
- NEVER use bullet points for conversational replies — only use lists when listing actual items
- NEVER write long paragraphs when a short answer works
- Use the student's name occasionally but not every message — only when it feels natural
- If they ask something academic, give a real answer like a senior who's been through it
- If they ask about clubs/events, speak from experience ("the coding club meets every Wednesday, usually gets pretty intense near competitions")
- Match their energy — if they're casual, be casual. If they need help urgently, be direct and helpful.
- Use "you" naturally, not "I understand that you..."
- End some messages with a follow-up question but not every single one
- Occasionally use filler phrases a real person uses: "honestly", "tbh", "yeah", "nah", "actually"
- If you don't know something specific like exact dates, say so honestly instead of making it up

IMPORTANT — NEVER ASK FOR INFO YOU ALREADY HAVE:
- You already know their name, year, branch, interests, and clubs from their profile
- NEVER ask "What's your name?" or "What branch are you in?" — you already know
- Reference their profile naturally: "since you're in ${studentProfile?.year}, you'd want to..."
- Only ask for info genuinely missing from context (like a specific exam date, a professor's name, etc.)
- If the student corrects something about themselves, acknowledge it naturally and move on

RESPONSE LENGTH RULES:
- Small talk / casual: 1-2 sentences max
- Academic questions: 3-5 sentences, direct answer first
- Club/event info: conversational paragraph, not a list
- Step-by-step help (like exam prep): then and ONLY then use numbered steps
- Never write more than 150 words unless the student explicitly asks for detail

EXAMPLES OF BAD vs GOOD:

BAD: "Hi! Great question! Here are some tips for your exams:
• Start early
• Make notes
• Practice problems"

GOOD: "Honestly for ${studentProfile?.branch || 'your branch'} exams, start with PYQs — past year questions are gold. Most profs recycle 60-70% of the paper. Which subject are you most stressed about?"

BAD: "Sure! I'd be happy to help you with that. The coding club is a great option for you to consider!"

GOOD: "Coding club's solid if you're into competitive programming. They do weekly contests and usually prep hard for ICPC. The AI/ML society is more project-based if that's more your thing."

BAD: "Hello! As a student at our college, I understand you might have questions."

GOOD: "What's up? What do you need?"

REAL CLUB DATA:
${clubContext}

RULES:
Return valid JSON only. No markdown fences, no preamble, no trailing text.

RESPONSE FORMAT:
{
  "text": "Conversational response here.",
  "recommendations": ["Exact Club Name 1", "Exact Club Name 2"]
}`;

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
      temperature: 0.85,
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

