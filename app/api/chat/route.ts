import { NextResponse } from 'next/server';
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
    const stream = await streamChatCompletion(message, systemPrompt);

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

          // After stream closes, retain the memory (non-blocking)
          retainMemory(
            studentBank(userId),
            `Student asked: ${message}`,
            'chat'
          ).catch((e) => console.error('Failed to retain memory:', e));
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
