import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gtinCandidates } from "@/lib/fdc/barcode";
import { resolveProduct } from "@/lib/fdc/barcode-resolver";
import { ApiError } from "@/lib/worker/errors";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const code = new URL(request.url).searchParams.get("code")?.trim() ?? "";
  if (!gtinCandidates(code).length) return NextResponse.json({ error: "That is not a valid product barcode." }, { status: 400 });
  try {
    const product = await resolveProduct(code,user.id);
    if (!product) return NextResponse.json({ error: "No nutrition was found for that barcode." }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
    return NextResponse.json({ product }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ error: "Barcode lookup is temporarily unavailable." }, { status: error instanceof ApiError && error.status === 429 ? 429 : 502 });
  }
}
