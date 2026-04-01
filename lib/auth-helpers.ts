/**
 * Ensures a `students` row exists for the signed-in Supabase user (server-side, service role).
 * Call after sign-in / sign-up when you have a valid access token.
 */
export async function ensureStudentProfile(accessToken: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/auth/ensure-profile", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      console.error("[ensureStudentProfile]", res.status, data.error);
      return { ok: false, error: data.error ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[ensureStudentProfile]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}
