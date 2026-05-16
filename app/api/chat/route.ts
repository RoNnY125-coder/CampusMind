export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import Groq from "groq-sdk";
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const { message, userId, history = [], sessionId } = await request.json();

        if (!message || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json({ error: 'GROQ_API_KEY missing' }, { status: 503 });
        }

        // Fetch student profile from Supabase
        let studentProfile: any = null;
        let currentSessionId = sessionId;

        try {
            const db = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { persistSession: false } }
            );

            const { data: student } = await db
                .from('students')
                .select('name, year, branch, interests, clubs')
                .eq('id', userId)
                .single();

            studentProfile = student;

            // Create or get session
            if (!currentSessionId) {
                const { data: newSession } = await db
                    .from('chat_sessions')
                    .insert({
                        student_id: userId,
                        title: message.slice(0, 60),
                    })
                    .select('id')
                    .single();
                currentSessionId = newSession?.id ?? null;
            }

            // Save user message
            if (currentSessionId) {
                await db.from('chat_messages').insert({
                    session_id: currentSessionId,
                    student_id: userId,
                    role: 'user',
                    content: message,
                });
            }
        } catch (e) {
            console.error('[chat] DB error:', e);
        }

        // Build sharp system prompt with student context
        const name = studentProfile?.name || 'there';
        const year = studentProfile?.year || 'college';
        const branch = studentProfile?.branch || 'engineering';
        const interests = studentProfile?.interests?.join(', ') || 'general topics';
        const clubs = studentProfile?.clubs?.join(', ') || 'none yet';

        const systemPrompt = `You are CampusMind — a sharp, knowledgeable senior student at college helping ${name}.

STUDENT PROFILE (use naturally, never announce you're using it):
- Name: ${name} | Year: ${year} | Branch: ${branch}
- Interests: ${interests}
- Clubs: ${clubs}

HOW TO RESPOND — CRITICAL:
- Talk like a real person, not a chatbot. Short, direct, genuine.
- NEVER start with "Hi!", "Hello!", "Sure!", "Great question!", "Absolutely!" — BANNED
- NEVER use bullet points for conversational replies
- Match their energy — casual question = casual answer
- Use their name occasionally but not every message
- For academic help: give the real answer first, details after
- For club/event questions: speak from experience, be specific
- Keep replies under 100 words unless they explicitly ask for detail
- Temperature: warm but efficient — like a helpful senior, not a customer service bot
- NEVER ask for info you already have (name, branch, year, interests)

RESPONSE EXAMPLES:
BAD: "Hi! Great question! Here are some tips: • Study early • Make notes"
GOOD: "PYQs are your best bet for ${branch} exams — most profs reuse 60-70% of questions. Which subject?"

BAD: "Hello ${name}! I understand you're asking about clubs."
GOOD: "Coding club's solid if you're into CP. They do weekly contests. What's your level?"`;

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const chatCompletion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                ...history.slice(-10).map((msg: any) => ({
                    role: msg.role,
                    content: msg.content,
                })),
                { role: 'user', content: message },
            ],
            temperature: 0.85,
            max_tokens: 512,
            stream: true,
        });

        let fullResponse = '';

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of chatCompletion) {
                        const text = chunk.choices[0]?.delta?.content || '';
                        if (text) {
                            fullResponse += text;
                            controller.enqueue(new TextEncoder().encode(text));
                        }
                    }
                } catch (e) {
                    console.error("Stream error:", e);
                } finally {
                    controller.close();

                    // Save assistant response to DB (non-blocking)
                    if (currentSessionId && fullResponse) {
                        const db = createClient(
                            process.env.NEXT_PUBLIC_SUPABASE_URL!,
                            process.env.SUPABASE_SERVICE_ROLE_KEY!,
                            { auth: { persistSession: false } }
                        );
                        db.from('chat_messages').insert({
                            session_id: currentSessionId,
                            student_id: userId,
                            role: 'assistant',
                            content: fullResponse,
                        }).catch(console.error);

                        // Update session updated_at
                        db.from('chat_sessions')
                            .update({ updated_at: new Date().toISOString() })
                            .eq('id', currentSessionId)
                            .catch(console.error);
                    }
                }
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
                "X-Session-Id": currentSessionId ?? '',
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
