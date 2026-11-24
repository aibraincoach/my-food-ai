import { capUser } from "@/lib/limits/user-cap";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchFoods } from "@/lib/fdc/client";
import { ApiError } from "@/lib/worker/errors";
import { caloriesPerServing, servingPortion } from "@/lib/fdc/serving";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message_code: "route_ac6a88b19530" }, { status: 401 });
 const capped = await capUser(user.id, "fdc_search"); if (capped) return capped;
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!query || query.length > 160) return NextResponse.json({ message_code: "route_dc1086e62b87" }, { status: 400 });
  try {
    const foods = await searchFoods(createAdminClient(), query);
    return NextResponse.json({ foods: foods.slice(0, 5).map((food) => { const portion = servingPortion(food); return { id: food.fdcId, description: food.description, serving_amount: portion.amount, serving_unit: portion.unit, calories: caloriesPerServing(food) }; }) },
      { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ message_code: "route_ea88574adf4a" }, { status: error instanceof ApiError && error.status === 429 ? 429 : 502 });
  }
}
