import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client — SERVER ONLY.
 * Uses the service role key which bypasses Row Level Security.
 * Never import this in Client Components or expose the key to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      // Disable session persistence — this client is stateless and server-only
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}