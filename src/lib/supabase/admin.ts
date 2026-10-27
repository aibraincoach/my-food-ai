import { createClient } from "@supabase/supabase-js";

// Service-role client for server-only use (profile creation, worker, queue).
// Never imported by client components.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error("createAdminClient: Supabase URL or secret key is missing.");
  }
  return createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
