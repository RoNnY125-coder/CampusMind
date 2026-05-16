import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

    try {
        const db = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );

        const { data } = await db
            .from('chat_messages')
            .select('id, role, content, created_at')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        return NextResponse.json({ messages: data ?? [] });
    } catch (e) {
        console.error('[session-messages] error:', e);
        return NextResponse.json({ messages: [] });
    }
}
