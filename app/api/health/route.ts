import { NextResponse } from "next/server"
import { retainMemory, recallMemories } from "@/lib/memory"
import { env } from "@/lib/env";

export async function GET() {
    let groqConfigured = false;
    try {
        groqConfigured = !!env.GROQ_API_KEY;
    } catch {
        groqConfigured = false;
    }

    let memoryOk = false
    let memoryError = ""
    try {
        await retainMemory("health-check", "health check ping", "system")
        await recallMemories("health-check", "health check")
        memoryOk = true
    } catch (e: any) {
        memoryError = e.message
    }

    return NextResponse.json({
        ok: memoryOk,
        memoryConnected: memoryOk,
        memoryError: memoryError || null,
        groqConfigured,
        timestamp: new Date().toISOString()
    })
}
