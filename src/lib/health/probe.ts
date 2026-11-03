import { createAdminClient } from "@/lib/supabase/admin";

type Check = {ok: boolean; ms: number};
export type Health = {database: Check; model: Check};

// Cache in-flight work as well as completed probes: concurrent health requests
// must not fan out into separate database/model requests.
export function createHealthProbe(
  database: (signal: AbortSignal) => Promise<boolean>,
  model: (signal: AbortSignal) => Promise<boolean>,
  now: () => number = Date.now,
) {
  let cached: Promise<Health> | undefined;
  let expires = 0;
  return async (): Promise<Health> => {
    if (cached && now() < expires) return cached;
    const check = async (run: (signal: AbortSignal) => Promise<boolean>): Promise<Check> => {
      const started = now();
      const signal = AbortSignal.timeout(3000);
      let onAbort: (() => void) | undefined;
      try {
        const timeout = new Promise<boolean>(resolve => {onAbort = () => resolve(false); signal.addEventListener("abort", onAbort, {once:true});});
        const ok = await Promise.race([run(signal), timeout]);
        return {ok, ms: Math.max(0, now() - started)};
      } catch {
        return {ok:false, ms:Math.max(0, now() - started)};
      } finally {
        if (onAbort) signal.removeEventListener("abort", onAbort);
      }
    };
    expires = Number.POSITIVE_INFINITY;
    cached = Promise.all([check(database), check(model)]).then(([database, model]) => {
      expires = now() + 60_000;
      return {database, model};
    });
    return cached;
  };
}

export const probeHealth = createHealthProbe(
  async signal => {
    const {error} = await createAdminClient().from("profiles").select("id", {head:true}).limit(1).abortSignal(signal);
    return !error;
  },
  async signal => {
    const key = process.env.MODEL_API_KEY;
    if (!key) return false;
    const base = process.env.MODEL_API_BASE_URL || "https://api.meta.ai/v1";
    const response = await fetch(`${base.replace(/\/$/, "")}/models`, {headers:{Authorization:`Bearer ${key}`}, signal, cache:"no-store"});
    // Only transport availability is needed; never return provider diagnostics.
    await response.body?.cancel();
    return response.ok;
  },
);
