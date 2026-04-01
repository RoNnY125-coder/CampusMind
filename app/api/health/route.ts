import { NextResponse } from "next/server"
import { retainMemory, recallMemories } from "@/lib/hindsight"
import { env } from "@/lib/env";

export async function GET() {
    let groqConfigured = false;
    try {
        groqConfigured = !!env.GROQ_API_KEY;
    } catch {
        groqConfigured = false;
    }

    let hindsightOk = false
    let hindsightError = ""
    try {
        await retainMemory("campus_knowledge", "health check ping", "system")
        await recallMemories("campus_knowledge", "health check")
        hindsightOk = true
    } catch (e: any) {
        hindsightError = e.message
    }

    return NextResponse.json({
        ok: hindsightOk,
        hindsightConnected: hindsightOk,
        hindsightError: hindsightError || null,
        groqConfigured,
        baseUrl: env.HINDSIGHT_BASE_URL,
        timestamp: new Date().toISOString()
    })
}
