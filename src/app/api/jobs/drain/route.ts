import {machineMessage} from '@/i18n/machine-messages';
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { holdsActiveLease } from "@/lib/queue/lease";
import { runWorker } from "@/lib/worker/drain";

export const maxDuration = 300;

export async function GET(request: Request) {
  const holder = new URL(request.url).searchParams.get("holder");
  if (!holder) return NextResponse.json({ error: machineMessage("route_cd5a3ccf711c") }, { status: 400 });
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: machineMessage("route_423154fc3564") }, { status: 503 });
  }
  try {
    if (!(await holdsActiveLease(admin, holder))) {
      return NextResponse.json({ error: machineMessage("route_a9503f04e5ab") }, { status: 409 });
    }
    await runWorker(admin, holder, async () => {
      const response = await fetch(new URL("/api/jobs/tick", request.url), {
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(machineMessage("route_5935b5454120",{"v0":response.status}));
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : machineMessage("route_938bb7a3785c") },
      { status: 500 }
    );
  }
}
