export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server';
import Groq from "groq-sdk"
import { recallMemories, retainMemory, studentBank, CAMPUS_BANK } from '@/lib/hindsight';
import { buildSystemPrompt, streamChatCompletion } from '@/lib/groq';
import type { ChatRequest } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { message, userId } = (await request.json()) as ChatRequest;

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check required environment variables
    if (!process.env.GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Server not configured: GROQ_API_KEY missing. Check .env.local' },
        { status: 503 }
      );
    }

    // Parallel recall from both banks
    const [studentMems, campusMems] = await Promise.all([
      recallMemories(studentBank(userId), message),
      recallMemories(CAMPUS_BANK, message),
    ]);

    // Build system prompt with memories
    const systemPrompt = buildSystemPrompt(studentMems, campusMems);

    // Stream from Groq
    const chatCompletion = await streamChatCompletion(message, systemPrompt);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of chatCompletion) {
            const text = chunk.choices[0]?.delta?.content || ""
            if (text) controller.enqueue(new TextEncoder().encode(text))
          }
        } catch (e) {
          console.error("Stream error:", e)
        } finally {
          controller.close()
          retainMemory("student_" + userId, `Student said: "${message}"`, "chat")
        }
      }
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
