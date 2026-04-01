import { NextResponse } from 'next/server';
import { retainMemory, recallMemories, CAMPUS_BANK } from '@/lib/hindsight';
import { CAMPUS_DATA } from '@/lib/campus-data';

export async function POST() {
  try {
    // Check if already seeded
    const existing = await recallMemories(CAMPUS_BANK, 'college');

    if (existing.length > 0) {
      return NextResponse.json({ alreadySeeded: true, count: existing.length });
    }

    // Seed all campus data
    const results = await Promise.allSettled(
      CAMPUS_DATA.map((item) =>
        retainMemory(CAMPUS_BANK, item, 'world')
      )
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    console.log(
      `✅ Seeded ${successful}/${CAMPUS_DATA.length} campus knowledge items`
    );

    return NextResponse.json({
      seeded: successful,
      total: CAMPUS_DATA.length,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Seeding failed' },
      { status: 500 }
    );
  }
}
