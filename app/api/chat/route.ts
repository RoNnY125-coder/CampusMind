import { NextResponse } from "next/server"
import { Groq } from "groq-sdk"
import { recallMemories, retainMemory } from "@/lib/hindsight"

export async function POST(request: Request) {
    try {
        const { message, userId, history } = await request.json()

        const [studentMemories, campusKnowledge] = await Promise.all([
            recallMemories("student_" + userId, message),
            recallMemories("campus_knowledge", message),
        ])

        const systemPrompt = `You are CampusMind, a smart campus AI assistant that personally remembers each student.

## YOUR MEMORY OF THIS STUDENT:
${studentMemories.length ? studentMemories.map((m: string) => `- ${m}`).join("\n") : "No memories yet — greet them warmly and ask about their interests."}

## CAMPUS KNOWLEDGE:
${campusKnowledge.length ? campusKnowledge.map((m: string) => `- ${m}`).join("\n") : "No campus data loaded yet."}

Always reference relevant memories naturally. Be warm, helpful, and specific to this student.`

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                ...history,
                { role: "user", content: message }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 1,
            max_completion_tokens: 1024,
            top_p: 1,
            stream: true,
            stop: null
        })

        // Stream response back to client
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of chatCompletion) {
                    const text = chunk.choices[0]?.delta?.content || ""
                    if (text) controller.enqueue(encoder.encode(text))
                }
                controller.close()
                // Retain after stream ends (fire and forget)
                retainMemory("student_" + userId, `Student said: "${message}"`, "chat")
            }
        })

        return new Response(stream, {
            headers: { "Content-Type": "text/plain; charset=utf-8", "Transfer-Encoding": "chunked" }
        })

    } catch (error: any) {
        console.error("Chat route error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
