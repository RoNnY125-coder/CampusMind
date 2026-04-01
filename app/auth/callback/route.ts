import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboard";
  const errorParam = searchParams.get("error_description") ?? searchParams.get("error");

  if (errorParam) {
    console.error("[auth/callback] OAuth error:", errorParam);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorParam)}`);
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/callback] exchangeCodeForSession:", error.message);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) {
      const email = user.email ?? "";
      const name =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        email.split("@")[0] ??
        "Student";
      const { error: upsertError } = await supabaseServer().from("students").upsert(
        {
          id: user.id,
          email,
          name,
          has_onboarded: false,
        },
        { onConflict: "id" }
      );
      if (upsertError) {
        console.error("[auth/callback] students upsert:", upsertError.message);
      }
    }
  }

  return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : `/${next}`}`);
}
