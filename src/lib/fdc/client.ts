// USDA FoodData Central search with a Postgres cache (item 10).
// Base https://api.nal.usda.gov/fdc/v1, api_key query parameter.
// 1,000 requests/hour per IP then 429 plus a one-hour block, hence the
// cache: every query hits fdc_cache first and only misses reach FDC.
// Server-only: reads FDC_API_KEY from the environment.
import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError, ioError } from "@/lib/worker/errors";

const FDC_BASE_URL = "https://api.nal.usda.gov/fdc/v1";
const DATA_TYPES = "Foundation,SR Legacy,Branded";

export interface FdcNutrient {
  nutrientId: number;
  nutrientName: string;
  unitName: string;
  value: number;
}

export interface FdcFood {
  fdcId: number;
  description: string;
  dataType: string;
  foodNutrients: FdcNutrient[];
  servingSize?: number;
  servingSizeUnit?: string;
}

function fdcApiKey(): string {
  const key = process.env.FDC_API_KEY;
  if (!key) {
    throw new Error("fdc: FDC_API_KEY is not set.");
  }
  return key;
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function asFoods(payload: unknown): FdcFood[] {
  if (typeof payload !== "object" || payload === null) return [];
  const foods = (payload as { foods?: unknown }).foods;
  if (!Array.isArray(foods)) return [];
  const out: FdcFood[] = [];
  for (const entry of foods) {
    if (typeof entry !== "object" || entry === null) continue;
    const food = entry as Record<string, unknown>;
    if (
      typeof food.fdcId !== "number" ||
      typeof food.description !== "string" ||
      typeof food.dataType !== "string" ||
      !Array.isArray(food.foodNutrients)
    ) {
      continue;
    }
    const nutrients: FdcNutrient[] = [];
    for (const raw of food.foodNutrients as unknown[]) {
      if (typeof raw !== "object" || raw === null) continue;
      const nutrient = raw as Record<string, unknown>;
      if (
        typeof nutrient.nutrientId !== "number" ||
        typeof nutrient.nutrientName !== "string" ||
        typeof nutrient.unitName !== "string" ||
        typeof nutrient.value !== "number"
      ) {
        continue;
      }
      nutrients.push({
        nutrientId: nutrient.nutrientId,
        nutrientName: nutrient.nutrientName,
        unitName: nutrient.unitName,
        value: nutrient.value,
      });
    }
    out.push({
      fdcId: food.fdcId,
      description: food.description,
      dataType: food.dataType,
      foodNutrients: nutrients,
      servingSize:
        typeof food.servingSize === "number" ? food.servingSize : undefined,
      servingSizeUnit:
        typeof food.servingSizeUnit === "string"
          ? food.servingSizeUnit
          : undefined,
    });
  }
  return out;
}

// Cache first; on a miss GET /foods/search and store the raw response.
// Throws on transport errors and on FDC 429/5xx (requeueable); a 400
// fails at once.
export async function searchFoods(
  admin: SupabaseClient,
  query: string
): Promise<FdcFood[]> {
  const key = normalizeQuery(query);
  const { data: cached, error: cacheError } = await admin
    .from("fdc_cache")
    .select("response")
    .eq("query", key)
    .maybeSingle<{ response: unknown }>();
  if (!cacheError && cached) {
    return asFoods(cached.response);
  }
  const params = new URLSearchParams({
    query: query.trim(),
    dataType: DATA_TYPES,
    pageSize: "5",
    api_key: fdcApiKey(),
  });
  const response = await fetch(
    `${FDC_BASE_URL}/foods/search?${params.toString()}`
  );
  if (!response.ok) {
    throw new ApiError(
      response.status,
      await response.text(),
      `fdc: search failed with ${response.status}.`
    );
  }
  const payload = (await response.json()) as unknown;
  await admin.from("fdc_cache").upsert(
    { query: key, response: payload as Record<string, unknown> },
    { onConflict: "query" }
  );
  return asFoods(payload);
}

// The full USDA detail shape carries nutrient.id/name/unitName and amount.
// https://fdc.nal.usda.gov/api-guide/ — GET /food/{fdcId}, format=full.
export function parseFoodDetail(payload: unknown, expectedId: number): FdcFood {
  const food = payload as Record<string, unknown> | null;
  if (!food || food.fdcId !== expectedId || typeof food.description !== "string"
    || typeof food.dataType !== "string" || !Array.isArray(food.foodNutrients)) throw new ApiError(502, "", "fdc: invalid food detail.");
  const nutrients: FdcNutrient[] = [];
  for (const raw of food.foodNutrients) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    const nutrient = row.nutrient as Record<string, unknown> | undefined;
    if (nutrient && typeof nutrient.id === "number" && typeof nutrient.name === "string"
      && typeof nutrient.unitName === "string" && typeof row.amount === "number" && Number.isFinite(row.amount)) {
      nutrients.push({nutrientId: nutrient.id, nutrientName: nutrient.name, unitName: nutrient.unitName, value: row.amount});
    }
  }
  return {fdcId: expectedId, description: food.description, dataType: food.dataType, foodNutrients: nutrients,
    servingSize: typeof food.servingSize === "number" ? food.servingSize : undefined,
    servingSizeUnit: typeof food.servingSizeUnit === "string" ? food.servingSizeUnit : undefined};
}

export async function getFoodById(admin: SupabaseClient, id: number): Promise<FdcFood> {
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("fdc: invalid retained food identity.");
  const key = `fdc-detail:${id}`;
  const {data: cached, error, status} = await admin.from("fdc_cache").select("response").eq("query", key).maybeSingle();
  if (error) throw ioError("Retained food cache could not be read.", error, status);
  if (cached) return parseFoodDetail(cached.response, id);
  const params = new URLSearchParams({format: "full", api_key: fdcApiKey()});
  const response = await fetch(`${FDC_BASE_URL}/food/${id}?${params}`, {signal: AbortSignal.timeout(30000)});
  if (!response.ok) throw new ApiError(response.status, await response.text(), "Retained food could not be loaded.");
  const payload: unknown = await response.json();
  const food = parseFoodDetail(payload, id);
  const {error: saveError, status: saveStatus} = await admin.from("fdc_cache").upsert({query: key, response: payload}, {onConflict: "query"});
  if (saveError) throw ioError("Retained food cache could not be saved.", saveError, saveStatus);
  return food;
}
