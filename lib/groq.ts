import Groq from 'groq-sdk';
import type { MemoryUnit } from './types';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function streamChatCompletion(
  userMessage: string,
  systemPrompt: string
) {
  const stream = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userMessage,
      },
    ],
    temperature: 0.7,
    max_tokens: 1024,
    stream: true,
  });

  return stream;
}

export function buildSystemPrompt(
  studentMemories: MemoryUnit[],
  campusMemories: MemoryUnit[]
): string {
  const studentMemContent =
    studentMemories.length > 0
      ? studentMemories.map((m) => m.content).join('\n')
      : 'No memories yet — greet them warmly and ask about their interests.';

  const campusMemContent = campusMemories
    .map((m) => m.content)
    .join('\n');

  return `You are CampusMind, a warm and intelligent AI assistant for college students. You have persistent memory of each student's interests, clubs, events attended, and deadlines thanks to the Hindsight memory system.

WHAT YOU REMEMBER ABOUT THIS STUDENT:
${studentMemContent}

CAMPUS KNOWLEDGE YOU HAVE ACCESS TO:
${campusMemContent}

RULES:
1. Always use student memories to personalize every response. If you recall something, say it: "I remember you're in 2nd year CSE..." or "Based on your interest in coding..."
2. Proactively surface upcoming deadlines if mentioned in memories and relevant to the query.
3. Suggest events matching their known interests — be specific, not generic.
4. Keep responses concise (2–4 sentences) unless asked for detail.
5. Be warm, campus-native in tone — like a senior student who knows everything.
6. End each response with one relevant follow-up question to deepen personalization.
7. If you learn something new about the student from their message, acknowledge it: "Got it, I'll remember that you..."`;
}
