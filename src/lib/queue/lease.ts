import { ioError } from "@/lib/worker/errors";
import type { SupabaseClient } from "@supabase/supabase-js";

// A lease older than its TTL is reclaimable inside try_acquire_worker_lease.
export async function tryAcquireLease(
  admin: SupabaseClient,
  holder: string,
  ttlSeconds = 300
): Promise<boolean> {
  const { data, error, status } = await admin.rpc("try_acquire_worker_lease", {
    p_holder: holder,
    ttl_seconds: ttlSeconds,
  });
  if (error) throw ioError(`acquire lease failed: ${error.message}`, error, status);
  return data === true;
}

export async function releaseLease(admin: SupabaseClient, holder: string): Promise<void> {
  const { error, status } = await admin.rpc("release_worker_lease", { p_holder: holder });
  if (error) throw ioError(`release lease failed: ${error.message}`, error, status);
}

export async function renewLease(
  admin: SupabaseClient,
  holder: string,
  ttlSeconds = 300
): Promise<void> {
  const { data, error, status } = await admin.rpc("renew_worker_lease", {
    p_holder: holder, ttl_seconds: ttlSeconds,
  });
  if (error) throw ioError(`renew lease failed: ${error.message}`, error, status);
  if (data !== true) throw ioError("Worker lease is no longer held.", null);
}

/** True when this holder owns the singleton worker lease and it has not expired. */
export async function holdsActiveLease(admin: SupabaseClient, holder: string): Promise<boolean> {
  const { data, error, status } = await admin
    .from("worker_lease")
    .select("holder,expires_at")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw ioError(`read lease failed: ${error.message}`, error, status);
  if (!data?.holder || data.holder !== holder || !data.expires_at) return false;
  return Date.parse(data.expires_at) > Date.now();
}
