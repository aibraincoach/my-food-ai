import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchFoods } from "@/lib/fdc/client";
import { scaleNutrition } from "@/lib/fdc/nutrients";
import { servingGrams } from "@/lib/fdc/serving";
import { lookupBarcode, validGtin, amountInBasis, barcodeNutrition } from "@/lib/fdc/barcode";
import { validEatenAt } from "@/lib/posts/eaten-at";
import { ApiError } from "@/lib/worker/errors";

// Logs a food picked from an FDC search as a ready post: no model call and no queue. The food is re-resolved on the
// server from the same search the client ran, so a client can never supply nutrition values of its own.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { fdc_id?: unknown; query?: unknown; eaten_at?: unknown; gtin?: unknown; amount?: unknown; unit?: unknown; photo?: unknown; nutrition?: unknown } | null;
  if (body && Object.hasOwn(body, "nutrition")) return NextResponse.json({ error: "Nutrition is resolved by the server." }, { status: 400 });
  if (body?.gtin !== undefined) {
    if (typeof body.gtin !== "string" || !validGtin(body.gtin) || typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount <= 0 || typeof body.unit !== "string")
      return NextResponse.json({ error: "Choose a valid barcode and amount." }, { status: 400 });
    const eatenAt = body.eaten_at === undefined ? new Date().toISOString() : validEatenAt(body.eaten_at as string);
    if (!eatenAt) return NextResponse.json({ error: "Invalid time eaten." }, { status: 400 });
    let photo: { path: string; width: number; height: number } | null = null;
    if (body.photo !== undefined) {
      const input = body.photo as { path?: unknown; width?: unknown; height?: unknown } | null;
      if (!input || typeof input.path !== "string" || !new RegExp(`^${user.id}/[0-9a-f-]{36}/0[.]jpg$`).test(input.path)
        || !Number.isSafeInteger(input.width) || !Number.isSafeInteger(input.height)
        || (input.width as number) < 1 || (input.width as number) > 4096 || (input.height as number) < 1 || (input.height as number) > 4096)
        return NextResponse.json({ error: "Invalid pack photo." }, { status: 400 });
      photo = { path: input.path, width: input.width as number, height: input.height as number };
    }
    try {
      const product = await lookupBarcode(body.gtin);
      if (!product) return NextResponse.json({ error: "Not in the database" }, { status: 404 });
      const amount = amountInBasis(body.amount, body.unit, product.basisUnit);
      if (amount === null || amount > 100000) return NextResponse.json({ error: "Choose an amount in the product's own unit." }, { status: 400 });
      const args: Record<string, unknown> = { p_user_id: user.id, p_eaten_at: eatenAt, p_name: product.name.slice(0, 160), p_grams: amount, p_nutrition: barcodeNutrition(product, amount) };
      if (photo) args.p_photo = photo;
      const { data, error } = await createAdminClient().rpc("create_food_post", args);
      if (error) return NextResponse.json({ error: error.code?.startsWith("22") ? "The pack photo or portion could not be saved." : "The meal could not be saved." }, { status: error.code?.startsWith("22") ? 400 : 500 });
      return NextResponse.json({ post_id: data as string }, { status: 201 });
    } catch (error) {
      return NextResponse.json({ error: "Barcode lookup is temporarily unavailable." }, { status: error instanceof ApiError && error.status === 429 ? 429 : 502 });
    }
  }
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  if (!Number.isSafeInteger(body?.fdc_id) || (body!.fdc_id as number) <= 0 || query.length < 2 || query.length > 160)
    return NextResponse.json({ error: "Choose a food from the search results." }, { status: 400 });
  const eatenAt = body!.eaten_at === undefined ? new Date().toISOString() : validEatenAt(body!.eaten_at as string);
  if (!eatenAt) return NextResponse.json({ error: "Invalid time eaten." }, { status: 400 });
  try {
    const admin = createAdminClient();
    const food = (await searchFoods(admin, query)).find((row) => row.fdcId === body!.fdc_id);
    if (!food) return NextResponse.json({ error: "That food is no longer in the results. Search again." }, { status: 409 });
    const grams = servingGrams(food);
    const n = scaleNutrition(food, grams);
    const { data, error } = await admin.rpc("create_food_post", { p_user_id: user.id, p_eaten_at: eatenAt, p_name: food.description.slice(0, 160), p_grams: grams,
      p_nutrition: { calories: n.calories, protein_g: n.proteinG, carbs_g: n.carbsG, fat_g: n.fatG, fibre_g: n.fibreG, sugar_g: n.sugarG, sodium_mg: n.sodiumMg, micronutrients: n.micronutrients, source_ref: n.sourceRef } });
    if (error?.code === "42501") return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    if (error) return NextResponse.json({ error: error.code?.startsWith("22") ? "That food could not be logged." : "The meal could not be saved." }, { status: error.code?.startsWith("22") ? 400 : 500 });
    return NextResponse.json({ post_id: data as string }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Food search is temporarily unavailable." }, { status: error instanceof ApiError && error.status === 429 ? 429 : 502 });
  }
}
