import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { holdsActiveLease } from "@/lib/queue/lease";
import { runWorker } from "@/lib/worker/drain";

export const maxDuration = 300;

export async function GET(request: Request) {
  const holder = new URL(request.url).searchParams.get("holder");
  if (!holder) return NextResponse.json({ error: "Missing holder." }, { status: 400 });
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Worker is not configured." }, { status: 503 });
  }
  try {
    if (!(await holdsActiveLease(admin, holder))) {
      return NextResponse.json({ error: "Not the lease holder." }, { status: 409 });
    }
    await runWorker(admin, holder, async () => {
      const response = await fetch(new URL("/api/jobs/tick", request.url), {
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`Worker re-tick failed: ${response.status}`);
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Drain failed." },
      { status: 500 }
    );
  }
}
