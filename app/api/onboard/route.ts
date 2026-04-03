import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
 
export async function POST(request: Request) {
  try {
    const { name, year, branch, interests, clubs, userId } = await request.json();
 
    if (!userId || !name || !branch) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
 
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
 
    // Skip DB write if userId is a crypto UUID fallback (no real DB row)
    const isFallbackId = !userId.includes('-') || userId.length < 30;
    
    if (!isFallbackId) {
      const { error: dbError } = await db
        .from('students')
        .upsert({
          id:            userId,
          name,
          year,
          branch,
          interests,
          clubs,
          has_onboarded: true,
          updated_at:    new Date().toISOString(),
        });
 
      if (dbError) {
        console.error('[onboard] DB error:', dbError);
        // Don't fail — let the user through anyway
      }
    }
 
    return NextResponse.json({ ok: true, userId });
  } catch (error) {
    console.error('[onboard] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
