import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const { name, year, branch, interests, clubs, userId } = await request.json();

        if (!userId || !name || !branch) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );

        const { error: dbError } = await db
            .from('students')
            .upsert({
                id: userId,
                name,
                year,
                branch,
                interests,
                clubs,
                has_onboarded: true,
                updated_at: new Date().toISOString(),
            });

        if (dbError) {
            console.error('Supabase error:', dbError);
            return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
        }

        return NextResponse.json({ ok: true, userId });
    } catch (error) {
        console.error('Onboard error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
