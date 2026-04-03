export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server';
import Groq from "groq-sdk"
import { recallMemories, retainMemory } from '@/lib/memory';
import { buildSystemPrompt } from '@/lib/groq';
import { getOrCreateSession, getSessionMessages, saveMessage, updateSessionTitle } from '@/lib/chat-db';
import { env } from '@/lib/env';
import type { ChatRequest } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { message, userId, history = [], sessionId } = (await request.json()) as ChatRequest & {
      sessionId?: string;
    };

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const groq = new Groq({ apiKey: env.GROQ_API_KEY });
    const session = await getOrCreateSession(userId, sessionId);

    if (!sessionId) {
      const title = message.length > 50 ? `${message.slice(0, 50)}...` : message;
      await updateSessionTitle(session.id, title);
    }

    await saveMessage(session.id, userId, 'user', message);

    const dbHistory = await getSessionMessages(session.id, 40);

    // Parallel recall from both banks
    const [studentMems, campusMems] = await Promise.all([
      recallMemories(userId, message),
      recallMemories('campus_shared', message),
    ]);

    // Build system prompt with memories
    const systemPrompt = buildSystemPrompt(studentMems, campusMems);

    // Stream from Groq
    const chatCompletion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...dbHistory.map((msg: any) => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
    });

    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        const meta = JSON.stringify({ sessionId: session.id }) + "\n__META_END__\n";
        controller.enqueue(new TextEncoder().encode(meta));
        try {
          for await (const chunk of chatCompletion) {
            const text = chunk.choices[0]?.delta?.content || ""
            if (text) {
              fullResponse += text;
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
        } catch (e) {
          console.error("Stream error:", e)
        } finally {
          controller.close();
          Promise.all([
            saveMessage(session.id, userId, 'assistant', fullResponse),
            retainMemory(userId, `Student asked: ${message}`, 'chat'),
          ]).catch((e) => console.error('Post-stream save error:', e));
        }
      }
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Session-Id": session.id,
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
