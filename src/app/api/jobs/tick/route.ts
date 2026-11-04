import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { queueTick } from "@/lib/queue/tick";

// Public, idempotent tick: queues work and hands draining to /api/jobs/drain.
export const maxDuration = 300;

const bootAt = Date.now();
let served = false;

export async function GET(request: Request) {
  const cold = !served; served = true;
  if (cold) console.info("tick cold", Date.now() - bootAt);
  const headers = {"x-tick-cold": cold ? "1" : "0"};
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Worker is not configured." }, { status: 503, headers });
  }
  try {
    const holder = randomUUID();
    const status = await queueTick(admin, holder);
    if (status.started) {
      const drainUrl = new URL("/api/jobs/drain", request.url);
      drainUrl.searchParams.set("holder", holder);
      after(() => fetch(drainUrl, { cache: "no-store", signal: AbortSignal.timeout(290_000) })
        .then((response) => { if (!response.ok) throw new Error(`Drain failed: ${response.status}`); }));
    }
    return NextResponse.json({
      queued: status.queued,
      running: status.running,
      traffic: status.traffic,
    }, { headers });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Tick failed." },
      { status: 500, headers }
    );
  }
}
