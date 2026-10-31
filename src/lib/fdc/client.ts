import { recordCall } from "@/lib/trace/record";
// USDA FoodData Central search with a Postgres cache (item 10).
// Base https://api.nal.usda.gov/fdc/v1, api_key query parameter.
// 1,000 requests/hour per IP then 429 plus a one-hour block, hence the
// cache: every query hits fdc_cache first and only misses reach FDC.
// Server-only: reads FDC_API_KEY from the environment.
import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError, ioError } from "@/lib/worker/errors";
import { portionsFromDetail, type FoodPortion } from "@/lib/nutrition/units";

const FDC_BASE_URL = "https://api.nal.usda.gov/fdc/v1";
// Include prepared-food references and version their larger candidate window.
export const FDC_SEARCH_CACHE_KIND = "fdc-search-v2";
export const FDC_SEARCH_PAGE_SIZE = 30;
export const FDC_SEARCH_DATA_TYPES = ["Foundation", "SR Legacy", "Survey (FNDDS)", "Branded"];

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
  foodCategory?: string;
  brandOwner?: string;
  // Gram weights the food states for cups and pieces (detail lookups only).
  portions?: FoodPortion[];
}

// A thirty-hit lookup would overflow the trace's 60KB text limit if every
// micronutrient were repeated. Keep every candidate identity and the core
// values used to select it; full consumed nutrients remain on item_nutrition.
export function foodSearchTrace(foods: FdcFood[]) {
  const core = new Set([1008,2047,2048,1003,1004,1005]);
  return {projection:"candidate-identities-and-core-nutrients",foods:foods.map(food=>({
    fdcId:food.fdcId,description:food.description.slice(0,500),dataType:food.dataType,
    servingSizeUnit:food.servingSizeUnit?.slice(0,32),
    nutrients:food.foodNutrients.filter(n=>core.has(n.nutrientId)).slice(0,6).map(n=>({id:n.nutrientId,value:n.value,unit:n.unitName.slice(0,32)})),
  }))};
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
      foodCategory: typeof food.foodCategory === "string" ? food.foodCategory : undefined,
      brandOwner: typeof food.brandOwner === "string" ? food.brandOwner : undefined,
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

// Cache first; on a miss POST /foods/search and store the raw response.
// Throws on transport errors and on FDC 429/5xx (requeueable); a 400
// fails at once.
export async function searchFoods(
  admin: SupabaseClient,
  query: string,
  signal?: AbortSignal
): Promise<FdcFood[]> {
  const normalized = normalizeQuery(query);
  const key = `${FDC_SEARCH_CACHE_KIND}:${normalized}`;
  const readCache = async (cacheKey: string) => {
    const request=admin.from("fdc_cache").select("response").eq("query",cacheKey);
    const {data,error,status}=await (signal?request.abortSignal(signal):request).maybeSingle<{response:unknown}>();
    if(error)throw ioError("Food cache could not be read.",error,status);
    return data?.response;
  };
  const cached = await readCache(key) as {kind?:unknown;query?:unknown;payload?:{foods?:unknown}} | undefined;
  if(cached?.kind===FDC_SEARCH_CACHE_KIND&&cached.query===normalized&&Array.isArray(cached.payload?.foods))return recordCall("fdc", {query,source:"cache",catalogVersion:FDC_SEARCH_CACHE_KIND}, async()=>asFoods(cached.payload), foods=>({text:{source:"cache",...foodSearchTrace(foods)}}));
  // v1 and unversioned caches omit prepared dishes and retain only five hits.
  // Do not let those old candidate sets hide the coverage fix indefinitely.
  return recordCall("fdc", { query, source:"network" }, async () => {
  const params = new URLSearchParams({ api_key: fdcApiKey() });
  const response = await fetch(
    `${FDC_BASE_URL}/foods/search?${params.toString()}`, {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({query:query.trim(),dataType:FDC_SEARCH_DATA_TYPES,pageSize:FDC_SEARCH_PAGE_SIZE}), signal,
    }
  );
  if (!response.ok) {
    throw new ApiError(
      response.status,
      await response.text(),
      `fdc: search failed with ${response.status}.`
    );
  }
  const payload = (await response.json()) as unknown;
  const cacheWrite = admin.from("fdc_cache").upsert(
    { query: key, response: {kind:FDC_SEARCH_CACHE_KIND,query:normalized,payload} },
    { onConflict: "query" }
  );
  await (signal ? cacheWrite.abortSignal(signal) : cacheWrite);
  return asFoods(payload);
  }, (foods) => ({ text: {source:"network",...foodSearchTrace(foods)} }));
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
    servingSizeUnit: typeof food.servingSizeUnit === "string" ? food.servingSizeUnit : undefined,
    portions: portionsFromDetail(payload)};
}

export async function getFoodById(admin: SupabaseClient, id: number, signal?:AbortSignal): Promise<FdcFood> {
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("fdc: invalid retained food identity.");
  const key = `fdc-detail:${id}`;
  const cacheQuery=admin.from("fdc_cache").select("response").eq("query",key);
  if(signal)cacheQuery.abortSignal(signal);
  const {data:cached,error,status}=await cacheQuery.maybeSingle();
  if (error) throw ioError("Retained food cache could not be read.", error, status);
  if (cached) {
    const entry=cached.response as {kind?:unknown;fdcId?:unknown;payload?:unknown};
    try {
      if(entry?.kind==='fdc-detail-v1'&&entry.fdcId===id)return await recordCall("fdc",{fdcId:id,source:"cache"},async()=>parseFoodDetail(entry.payload,id),food=>({text:{source:"cache",food},fdcId:id}));
      if(entry&&!entry.kind)return await recordCall("fdc",{fdcId:id,source:"legacy_cache"},async()=>parseFoodDetail(entry,id),food=>({text:{source:"legacy_cache",food},fdcId:id}));
    } catch { /* A legacy search-key collision is a cache miss, never permanent failure. */ }
  }
  return recordCall("fdc", { fdcId: id, source:"network" }, async () => {
  const params = new URLSearchParams({format: "full", api_key: fdcApiKey()});
  const response = await fetch(`${FDC_BASE_URL}/food/${id}?${params}`, {signal: signal?AbortSignal.any([signal,AbortSignal.timeout(30000)]):AbortSignal.timeout(30000)});
  if (!response.ok) throw new ApiError(response.status, await response.text(), "Retained food could not be loaded.");
  const payload: unknown = await response.json();
  const food = parseFoodDetail(payload, id);
  const save=admin.from("fdc_cache").upsert({query:key,response:{kind:"fdc-detail-v1",fdcId:id,payload}},{onConflict:"query"});
  if(signal)save.abortSignal(signal);
  const {error:saveError,status:saveStatus}=await save;
  if (saveError) throw ioError("Retained food cache could not be saved.", saveError, saveStatus);
  return food;
  }, (food) => ({ text: food, fdcId: food.fdcId }));
}
