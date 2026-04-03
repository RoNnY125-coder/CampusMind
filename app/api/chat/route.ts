export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getOrCreateSession, getSessionMessages, saveMessage, updateSessionTitle } from "@/lib/chat-db";
import type { ChatRequest } from "@/lib/types";

const systemPrompt = `You are CampusMind, a warm and intelligent AI assistant for college students in India.
You help students with academics, campus life, clubs, events, career advice, and general queries.

RULES:
1. Be warm, friendly and helpful, like a knowledgeable senior student.
2. Keep responses concise (2-4 sentences) unless more detail is needed.
3. For academic questions, give practical actionable advice.
4. End each response with one relevant follow-up question to keep the conversation going.
5. If asked about events or deadlines, remind them to check their college notice board.
6. You support students across all branches: CSE, ECE, Mechanical, Civil, IT, MBA and more.`;

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

    console.log("[chat] request start", { userId, sessionId: session.id, history: promptHistory.length });

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
