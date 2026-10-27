import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { queueTick } from "@/lib/queue/tick";
import { runWorker } from "@/lib/worker/drain";

// Public, idempotent tick: starts the worker in the background with after()
// if work waits and none runs. Returns depth and traffic.
export async function GET() {
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
      after(() => runWorker(admin, holder));
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
