import { NextResponse } from 'next/server';

// The old mem0-based seed route is deprecated.
// Club seeding is now done via: npm run seed:clubs
// which uses scripts/seed-clubs.ts to populate Supabase + pgvector embeddings.

export async function POST() {
  return NextResponse.json({
    deprecated: true,
    message:
      'This endpoint is deprecated. Use `npm run seed:clubs` to seed club data into Supabase with pgvector embeddings.',
  });
}
