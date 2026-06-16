import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * POST /api/account/delete
 *
 * Securely deletes the authenticated user's account:
 *   1. Verifies the caller has a valid Supabase session (anon client, cookies).
 *   2. Deletes all rows in `analyses` where user_id = current user.
 *   3. Deletes the user from Supabase Auth via the admin client (service role).
 *
 * The service role key never leaves the server.
 */
export async function POST() {
  // ── 1. Verify session ──────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in and try again." },
      { status: 401 }
    );
  }

  const userId = user.id;

  // ── 2. Delete user's analyses ──────────────────────────────────────────────
  const { error: analysesError } = await supabase
    .from("analyses")
    .delete()
    .eq("user_id", userId);

  if (analysesError) {
    console.error("[account/delete] Failed to delete analyses:", analysesError);
    return NextResponse.json(
      { error: "Failed to delete your reports. Please try again." },
      { status: 500 }
    );
  }

  // ── 3. Delete analysis cache rows belonging to this user (if column exists) ─
  // Non-critical — fire and forget; don't fail the whole request if this errors
  try {
    await supabase.from("analysis_cache").delete().eq("user_id", userId);
  } catch {
    // analysis_cache may not have a user_id column — that's fine
  }

  // ── 4. Delete the user from Supabase Auth via admin client ─────────────────
  const admin = createAdminClient();
  const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId);

  if (deleteUserError) {
    console.error("[account/delete] Failed to delete auth user:", deleteUserError);
    return NextResponse.json(
      {
        error:
          "Your reports were deleted but we couldn't remove your account. Please contact support.",
      },
      { status: 500 }
    );
  }

  console.log(`[account/delete] Successfully deleted user ${userId}`);
  return NextResponse.json({ success: true }, { status: 200 });
}