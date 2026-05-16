import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/**
 * Creates or updates the `students` row for the authenticated user.
 * Requires `Authorization: Bearer <access_token>` from the client session.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return NextResponse.json({ error: "Missing Authorization bearer token" }, { status: 401 });
  }

  const admin = supabaseServer();
  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token);

  if (userError || !user) {
    console.error("[ensure-profile] getUser failed:", userError?.message);
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  const email = user.email ?? "";
  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    email.split("@")[0] ??
    "Student";

  const { data: existingUser, error: queryError } = await admin.from("students").select("has_onboarded").eq("id", user.id).maybeSingle();
  let hasOnboarded = false;

  if (queryError) {
    console.error("[ensure-profile] query failed:", queryError);
    return NextResponse.json({ error: "Failed to check existing profile" }, { status: 500 });
  }

  if (existingUser) {
    hasOnboarded = existingUser.has_onboarded;
  } else {
    const { error: insertError } = await admin.from("students").insert({
      id: user.id,
      email,
      name,
      has_onboarded: false,
    });

    if (insertError) {
      console.error("[ensure-profile] insert failed:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, userId: user.id, hasOnboarded });
}
