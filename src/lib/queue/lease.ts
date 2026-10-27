import type { SupabaseClient } from "@supabase/supabase-js";

// A lease older than its TTL is reclaimable inside try_acquire_worker_lease.
export async function tryAcquireLease(
  admin: SupabaseClient,
  holder: string,
  ttlSeconds = 300
): Promise<boolean> {
  const { data, error } = await admin.rpc("try_acquire_worker_lease", {
    p_holder: holder,
    ttl_seconds: ttlSeconds,
  });
  if (error) throw new Error(`acquire lease failed: ${error.message}`);
  return data === true;
}

export async function releaseLease(admin: SupabaseClient, holder: string): Promise<void> {
  const { error } = await admin.rpc("release_worker_lease", { p_holder: holder });
  if (error) throw new Error(`release lease failed: ${error.message}`);
}

export async function renewLease(
  admin: SupabaseClient,
  holder: string,
  ttlSeconds = 300
): Promise<void> {
  await tryAcquireLease(admin, holder, ttlSeconds);
}
