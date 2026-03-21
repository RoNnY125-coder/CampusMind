export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server';
<<<<<<< HEAD
import { recallMemories, retainMemory, reflectOnQuery, studentBank, CAMPUS_BANK } from '@/lib/hindsight';
import { buildSystemPrompt, streamChatCompletion } from '@/lib/groq';
=======
import Groq from "groq-sdk"
import { recallMemories, retainMemory, studentBank, CAMPUS_BANK } from '@/lib/hindsight';
import { buildSystemPrompt } from '@/lib/groq';
>>>>>>> f701be9011e1222a741ff88772d4deef23211701
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
    const [studentMems, campusMems] = await Promise.all([
      recallMemories(studentBank(userId), message),
      recallMemories(CAMPUS_BANK, message),
    ]);

    // Build system prompt with memories
    const systemPrompt = buildSystemPrompt(studentMems, campusMems);

<<<<<<< HEAD
    // Stream from Groq, passing the chat history
    const stream = await streamChatCompletion(message, systemPrompt, history);

    // Create a ReadableStream response
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(new TextEncoder().encode(content));
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();

          // After stream closes, reflect and retain the memory (non-blocking)
          reflectOnQuery(studentBank(userId), message)
            .then((reflection) => {
              const memoryContent = reflection || message;
              return retainMemory(studentBank(userId), memoryContent, 'observation');
            })
            .catch((e) => console.error('Failed to retain memory:', e));
        }
      },
=======
    // Stream from Groq
    const chatCompletion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
>>>>>>> f701be9011e1222a741ff88772d4deef23211701
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
