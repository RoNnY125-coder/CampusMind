import { NextResponse } from 'next/server';
import { retainMemory, studentBank } from '@/lib/hindsight';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { name, year, branch, interests, clubs, userId } = await request.json();

    if (!userId || !name || !branch) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`🎓 Onboarding student: ${name} (${userId})`);

    // Upsert user profile in Supabase
    const { error: dbError } = await supabase
        .from('students')
        .upsert({ 
            id: userId,
            name,
            year,
            branch,
            interests,
            clubs,
            has_onboarded: true
        });

    if (dbError) {
        console.error('❌ Supabase error:', dbError);
        return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
    }

    // Retain all onboarding data with proper error handling
    const memoriesToRetain = [
      { content: `Student's name is ${name}`, type: 'world' },
      { content: `${name} is in ${year} studying ${branch}`, type: 'observation' },
      { content: `${name} is interested in: ${interests.join(', ')}`, type: 'observation' },
      { content: `${name} has joined: ${clubs.join(', ')}`, type: 'experience' },
      {
        content: `Onboarded on ${new Date().toLocaleDateString('en-IN')}`,
        type: 'experience',
      },
    ];

    const results = await Promise.allSettled(
      memoriesToRetain.map((mem) =>
        retainMemory(studentBank(userId), mem.content, mem.type)
      )
    );

    // Check if all memories were retained successfully
    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      console.error(
        `⚠️  Failed to retain ${failed.length}/${results.length} memories`
      );
      failed.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(`Memory ${i + 1} error:`, r.reason);
        }
      });
    } else {
      console.log(`✅ All ${results.length} memories retained successfully`);
    }

    return NextResponse.json({ ok: true, userId });
  } catch (error) {
    console.error('❌ Onboard route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
