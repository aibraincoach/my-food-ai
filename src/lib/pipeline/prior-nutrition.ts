import {MACRO_NUTRIENT_IDS} from '../nutrition/totals';
import {mextFoodNumber} from '../mext/record';
import {foodApproximation} from "@/lib/fdc/approximation-metadata";
import { FOOD_MATCH_VERSION } from "@/lib/fdc/version";

type PriorItem = { name: string; item_nutrition: unknown };
type PriorTrace = { request_text: string; response_text: string | null; fdc_id: number | null; reference_ref?:string|null; error: string | null; started_at: string };
function object(value: unknown): Record<string, unknown> | null {
  for (let count = 0; count < 4 && typeof value === "string"; count++) {
    try { value = JSON.parse(value); } catch { return null; }
  }
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

// Cached searches alone do not establish which record supplied an item's nutrition.
export function priorNutritionTrusted(items: readonly PriorItem[], traces: readonly PriorTrace[]): boolean {
  const decisions = [...traces].sort((a,b)=>Date.parse(b.started_at)-Date.parse(a.started_at)).flatMap(trace => {
    if (trace.error) return [];
    const request = object(trace.request_text), response = object(trace.response_text);
    const selected = request?.event === "food_resolution" && response?.source === "selected";
    const copied = request?.event === "nutrition_reuse" && request.source === "copied" && typeof request.sourceItem === "string" && request.sourceItem.length > 0 && response?.source === "copied";
    return request && response && (selected || copied) ? [{ trace, request, response, copied }] : [];
  });
  return items.length > 0 && items.every(item => {
    const raw = Array.isArray(item.item_nutrition) ? item.item_nutrition[0] : item.item_nutrition;
    const nutrition = raw !== null && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string,unknown> : null;
    if (nutrition&&foodApproximation(nutrition))return false;
    if(!nutrition)return false;
    const mext=mextFoodNumber(nutrition.source_ref);
    if(!(['calories','protein_g','carbs_g','fat_g'] as const).every(key=>
      typeof nutrition[key]==='number'&&Number.isFinite(nutrition[key])&&(nutrition[key] as number)>=0
      ||mext!==null&&nutrition[key]===null&&Array.isArray(nutrition.micronutrients)&&nutrition.micronutrients.some(n=>n&&typeof n==='object'&&n.nutrientId===MACRO_NUTRIENT_IDS[key]&&n.value===null&&n.marker==='trace')))return false;
    const latest = decisions.find(decision => typeof decision.request.name === "string" && decision.request.name.trim().toLowerCase() === item.name.trim().toLowerCase());
    if(mext!==null)return latest?.request.matcherVersion===FOOD_MATCH_VERSION&&latest.trace.reference_ref===nutrition.source_ref
      &&(!latest.copied||latest.response.source_ref===nutrition.source_ref);
    const sourceId = Number(nutrition.source_ref);
    if (!Number.isSafeInteger(sourceId) || sourceId <= 0) return false;
    return latest?.request.matcherVersion === FOOD_MATCH_VERSION && latest.trace.fdc_id === sourceId
      && (!latest.copied || Number(latest.response.source_ref) === sourceId);
  });
}
