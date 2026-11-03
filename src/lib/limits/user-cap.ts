import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type CapRoute = "label" | "transcribe" | "fdc_search" | "fdc_barcode" | "post" | "correct" | "drink_identify";

/** The owner chose availability when the counter itself is unavailable. */
export async function capUser(userId: string, route: CapRoute, db = createAdminClient()): Promise<NextResponse | null> {
  try {
    const { data, error } = await db.rpc("user_hit", { p_user_id: userId, p_route: route });
    if (error) {
      console.error(`user cap check failed ${route}`);
      return null;
    }
    if (data === false) {
      const now = Date.now();
      const seconds = Math.max(1, Math.ceil((Math.floor(now / 3_600_000) * 3_600_000 + 3_600_000 - now) / 1000));
      return NextResponse.json({ error: "You have made a lot of requests this hour. Try again later." }, {
        status: 429,
        headers: { "Retry-After": String(seconds), "Cache-Control": "private, no-store" },
      });
    }
  } catch {
    console.error(`user cap check failed ${route}`);
  }
  return null;
}
