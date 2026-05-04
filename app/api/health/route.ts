import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
    let groqConfigured = false;
    try {
        groqConfigured = !!env.GROQ_API_KEY;
    } catch {
        groqConfigured = false;
    }

    let supabaseConfigured = false;
    try {
        supabaseConfigured = !!env.NEXT_PUBLIC_SUPABASE_URL && !!env.SUPABASE_SERVICE_ROLE_KEY;
    } catch {
        supabaseConfigured = false;
    }

    return NextResponse.json({
        ok: groqConfigured && supabaseConfigured,
        groqConfigured,
        supabaseConfigured,
        timestamp: new Date().toISOString()
    });
}
