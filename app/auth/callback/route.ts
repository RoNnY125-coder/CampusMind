import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/chat';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Cookie setting can fail in middleware — ignore
          }
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[callback] exchange error:', error.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  if (!data.user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`);
  }

  // Sync user to students table using service role
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: existing } = await adminDb
      .from('students')
      .select('id, has_onboarded')
      .eq('email', data.user.email!)
      .single();

    if (!existing) {
      await adminDb.from('students').insert({
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.full_name
          ?? data.user.user_metadata?.name
          ?? data.user.email!.split('@')[0],
        has_onboarded: false,
      });
      return NextResponse.redirect(`${origin}/onboard`);
    }

    return NextResponse.redirect(
      `${origin}${existing.has_onboarded ? '/chat' : '/onboard'}`
    );
  } catch (dbError) {
    console.error('[callback] DB sync error:', dbError);
    // Still redirect to chat even if DB sync fails
    return NextResponse.redirect(`${origin}/chat`);
  }
}
