export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server';
import Groq from "groq-sdk"
import { recallMemories, retainMemory, studentBank, CAMPUS_BANK } from '@/lib/hindsight';
import { buildSystemPrompt } from '@/lib/groq';
import type { ChatRequest } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { message, userId, history = [] } = (await request.json()) as ChatRequest;

    // Groq client initialized HERE inside the function, not outside
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
    const [profileMems, contextMems, campusMems] = await Promise.all([
      recallMemories(studentBank(userId), 'profile student name branch year interests'),
      recallMemories(studentBank(userId), message),
      recallMemories(CAMPUS_BANK, message),
    ]);

    // Deduplicate student memories (union of a + b by id)
    const studentMemoriesMap = new Map();
    [...profileMems, ...contextMems].forEach((m) => {
      studentMemoriesMap.set(m.id, m);
    });
    const studentMems = Array.from(studentMemoriesMap.values());

    // Build system prompt with memories
    const systemPrompt = buildSystemPrompt(studentMems, campusMems);

    // Stream from Groq
    const chatCompletion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
    });

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
          controller.close();
          // After stream closes, retain the memory (non-blocking)
          retainMemory(studentBank(userId), `Student asked: ${message}`, 'chat')
            .catch((e) => console.error('Failed to retain memory:', e));
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
