import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getOAuthRedirectCookieName,
  normalizeAuthRedirectPath,
} from "@/lib/auth/oauth";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const cookieStore = await cookies();
  const nextFromCookie = cookieStore.get(getOAuthRedirectCookieName())?.value;
  const next = normalizeAuthRedirectPath(nextFromCookie);
  const errorParam =
    searchParams.get("error_description") ??
    searchParams.get("error") ??
    searchParams.get("message");

  cookieStore.set(getOAuthRedirectCookieName(), "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });

  if (errorParam) {
    console.error("[auth/callback] OAuth provider error:", {
      error: searchParams.get("error"),
      errorDescription: searchParams.get("error_description"),
      message: searchParams.get("message"),
    });
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorParam)}`);
  }

  if (!code) {
    console.error("[auth/callback] Missing authorization code.", {
      search: searchParams.toString(),
    });
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Missing OAuth code from Google.")}`
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const message = error.message.includes("Unable to exchange external code")
      ? "Google sign-in could not be completed. Check that the exact /auth/callback URL is registered in Supabase and Google Cloud."
      : error.message;

    console.error("[auth/callback] exchangeCodeForSession failed:", {
      message: error.message,
      code: error.code,
      status: error.status,
    });

    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("[auth/callback] getUser failed:", userError.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Signed in, but failed to load the user session.")}`
    );
  }

  if (!user?.id) {
    console.error("[auth/callback] No user returned after OAuth exchange.");
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Signed in, but no authenticated user was returned.")}`
    );
  }

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
    console.error("[auth/callback] students upsert failed:", upsertError.message);
  }

  return NextResponse.redirect(new URL(next, origin));
}
