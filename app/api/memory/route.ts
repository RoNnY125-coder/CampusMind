import { NextResponse } from 'next/server';
import { recallMemories, studentBank } from '@/lib/hindsight';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const query = searchParams.get('query') || '';

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    const memories = await recallMemories(studentBank(userId), query);

    return NextResponse.json({
      memories,
      count: memories.length,
    });
  } catch (error) {
    console.error('Memory recall error:', error);
    return NextResponse.json(
      { memories: [] }
    );
  }
}
