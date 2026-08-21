import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const { name, year, branch, interests, clubs, college, userId } = await request.json();

        if (!userId || !name || !branch || !college) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );

        // Fetch the college_id for the given college name
        const { data: collegeData, error: collegeError } = await db
            .from('colleges')
            .select('id')
            .eq('name', college)
            .single();

        if (collegeError || !collegeData) {
            console.error('College not found:', collegeError);
            return NextResponse.json({ error: 'Invalid college selected' }, { status: 400 });
        }

        const { error: dbError } = await db
            .from('students')
            .update({
                name,
                year,
                branch,
                interests,
                clubs,
                college_id: collegeData.id,
                has_onboarded: true,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

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
