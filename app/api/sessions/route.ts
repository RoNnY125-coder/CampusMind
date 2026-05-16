import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    try {
        const db = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );

        const { data } = await db
            .from('chat_sessions')
            .select('id, title, created_at, updated_at')
            .eq('student_id', userId)
            .order('updated_at', { ascending: false })
            .limit(20);

        return NextResponse.json({ sessions: data ?? [] });
    } catch (e) {
        console.error('[sessions] error:', e);
        return NextResponse.json({ sessions: [] });
    }
}
