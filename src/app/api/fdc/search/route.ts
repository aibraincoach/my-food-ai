import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchFoods } from "@/lib/fdc/client";
import { ApiError } from "@/lib/worker/errors";
import { caloriesPerServing, servingGrams } from "@/lib/fdc/serving";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!query || query.length > 160) return NextResponse.json({ error: "Enter a food name up to 160 characters." }, { status: 400 });
  try {
    const foods = await searchFoods(createAdminClient(), query);
    return NextResponse.json({ foods: foods.slice(0, 5).map((food) => ({ id: food.fdcId, description: food.description, serving_g: servingGrams(food), calories: caloriesPerServing(food) })) },
      { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ error: "Food search is temporarily unavailable." }, { status: error instanceof ApiError && error.status === 429 ? 429 : 502 });
  }
}
