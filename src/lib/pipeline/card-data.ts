import type { SupabaseClient } from "@supabase/supabase-js";
import { getPostHydrationData, type DrinkCardData, type HydrationRecord } from "@/lib/intake/hydration";
import { sumNutrition, toNumber, unavailableFoods, type Numeric, type NutritionLike, type StoredNutrient } from "@/lib/nutrition/totals";

export type CardItem = NutritionLike & { name: string; portion_grams: Numeric; portion_text?: string | null; micronutrients?: StoredNutrient[]; not_eaten_grams?:number|null;not_eaten_count_text?:string|null;not_eaten_calories?:number|null;supersedes?:string|null };
export interface CardData {
  kind: "meal" | "drink";
  /** An instant, formatted in the viewing device's zone by the live wrapper. */
  time?: string;
  amountMl?: number;
  drinkLine?: string;
  caffeineMg?: number;
  hydration?: HydrationRecord;
  kcal?: number | null;
  macros?: { protein: number | null; carbs: number | null; fat: number | null };
  items?: { name: string; grams: number | null }[];
  unavailable?: string[];
  waterLine?: string;
  footer?: string;
}
export interface CardSource {
  items: CardItem[];
  eaten_at?: string;
  eatenAt?: string;
  drink?: DrinkCardData | null;
  kind?: "meal" | "drink";
  foodWaterMl?: number;
  dayHydration?: HydrationRecord;
  footer?: string;
}

/** All live cards and stored PNGs use this one presentation data builder. */
export function cardDataFromRow(source: CardSource): CardData {
  const totals = sumNutrition(source.items);
  const drink = source.drink;
  const hydration = source.dayHydration ?? (drink ? { totalMl: drink.totalMl, drinksMl: drink.drinksMl, foodMl: drink.foodMl, caffeineMg: drink.dayCaffeineMg ?? drink.caffeineMg } : undefined);
  return {
    kind: drink || source.kind === "drink" ? "drink" : "meal",
    time: source.eaten_at ?? source.eatenAt,
    amountMl: drink?.ml,
    caffeineMg: drink?.caffeineMg,
    drinkLine: drink ? `${drink.label}${drink.caffeineMg ? ` · ${Math.round(drink.caffeineMg)} mg caffeine · ${totals.calories === null ? "unavailable" : Math.round(totals.calories)} kcal` : ""}` : undefined,
    hydration,
    kcal: totals.calories,
    macros: { protein: totals.protein_g, carbs: totals.carbs_g, fat: totals.fat_g },
    items: source.items.map(item => ({ name: item.name, grams: item.portion_grams == null ? null : toNumber(item.portion_grams) })),
    unavailable: unavailableFoods(totals),
    waterLine: (source.foodWaterMl ?? 0) >= 50 && hydration ? `Water in this meal: ${Math.round(source.foodWaterMl!).toLocaleString("en-US")} ml · Consumed today: ${hydration.totalMl.toLocaleString("en-US")} ml` : undefined,
    footer: source.footer ?? remainderFooter(source.items),
  };
}
export const buildCardData = cardDataFromRow;

/** Read presentation fields with owner-scoped access; callers may provide their
 * atomic nutrition snapshot, preserving the renderer's publication fingerprint. */
export async function readCardData(db: SupabaseClient, userId: string, post: { id: string; eaten_at: string; items: CardItem[] }, zone = "UTC"): Promise<CardData> {
  const sources=post.items.filter(item=>item.not_eaten_grams!=null&&item.supersedes&&item.not_eaten_calories===undefined);
  const originalCalories=new Map<string,number|null>();
  if(sources.length){
    const {data,error}=await db.from('post_items').select('id,portion_grams,item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref)').eq('post_id',post.id).in('id',sources.map(item=>item.supersedes!));
    if(error)throw Error('Original meal nutrition could not be read.');
    for(const parent of data??[]){const nutrition=Array.isArray(parent.item_nutrition)?parent.item_nutrition[0]:parent.item_nutrition;originalCalories.set(parent.id,nutrition?.calories==null?null:toNumber(nutrition.calories));}
  }
  const items=post.items.map(item=>{if(!item.supersedes||item.not_eaten_grams==null||item.not_eaten_calories!==undefined)return item;const kcal=originalCalories.get(item.supersedes);const grams=toNumber(item.portion_grams)+item.not_eaten_grams;return {...item,not_eaten_calories:item.not_eaten_grams===0?0:kcal==null||grams<=0?null:kcal*item.not_eaten_grams/grams};});
  const values = await getPostHydrationData(db, userId, [{ ...post, items: post.items.map(item => ({ ...item, micronutrients: item.micronutrients ?? [] })) }], zone);
  return cardDataFromRow({ ...post, items, ...values[post.id] });
}

function remainderFooter(items:CardItem[]):string|undefined {
 const omitted=items.filter(item=>item.not_eaten_grams!=null);
 if(!omitted.length)return undefined;
 const texts=omitted.map(item=>item.not_eaten_count_text??`${Math.round(item.not_eaten_grams!)} g`);
 const calories=omitted.map(item=>{const consumed=toNumber(item.portion_grams),rest=item.not_eaten_grams!;return item.not_eaten_calories!==undefined?item.not_eaten_calories:rest===0?0:consumed>0&&item.calories!=null?toNumber(item.calories)*rest/consumed:null;});
 const kcal=calories.some(value=>value===null)?'unavailable':Math.round(calories.reduce<number>((sum,value)=>sum+(value??0),0)).toLocaleString('en-US');
 return `Not eaten: ${texts.join(', ')} · ${kcal} kcal`;
}
