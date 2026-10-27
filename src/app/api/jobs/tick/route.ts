import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { queueTick } from "@/lib/queue/tick";
import { runWorker } from "@/lib/worker/drain";

// Public, idempotent tick: starts the worker in the background with after()
// if work waits and none runs. Returns depth and traffic.
// Allows the 60 s drain window plus the largest (60 s) retry delay.
export const maxDuration = 300;

export async function GET(request: Request) {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Worker is not configured." }, { status: 503 });
  }
  try {
    const holder = randomUUID();
    const status = await queueTick(admin, holder);
    if (status.started) {
      after(() => runWorker(admin, holder, async () => {
        const response = await fetch(new URL("/api/jobs/tick", request.url), {
          cache: "no-store",
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) throw new Error(`Worker re-tick failed: ${response.status}`);
      }));
    }
    return NextResponse.json({
      queued: status.queued,
      running: status.running,
      traffic: status.traffic,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Tick failed." },
      { status: 500 }
    );
  }
}
