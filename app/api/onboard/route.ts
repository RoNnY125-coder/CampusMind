import { NextResponse } from 'next/server';
import { retainMemory, studentBank } from '@/lib/hindsight';

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
