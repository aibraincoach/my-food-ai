import {formatNumber} from '@/i18n/format';
import {nutritionTranslator} from '@/i18n/nutrition';
import {cardTranslator} from '@/i18n/card';
import type {Locale} from '@/i18n/locales';
import {drinkGlyph,type DrinkGlyph} from '@/lib/intake/drink-glyph';
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPostHydrationData, type DrinkCardData, type HydrationRecord } from "@/lib/intake/hydration";
import { formatCalories, formatNutrition, sumNutrition, toNumber, nutritionGaps, gapSentence, type Numeric, type NutritionLike, type StoredNutrient, type NutritionGap } from "@/lib/nutrition/totals";

export type CardItem = NutritionLike & { source_ref?:string|null; id?:string; name: string; portion_grams: Numeric; portion_text?: string | null; micronutrients?: StoredNutrient[]; not_eaten_grams?:number|null;not_eaten_count_text?:string|null;not_eaten_calories?:number|null;supersedes?:string|null };
export interface CardWording {
 alcoholic:boolean; alcoholG:number; glyph:DrinkGlyph;
 drink?:Pick<DrinkCardData,'label'|'caffeineMg'|'source'>;
 foodWaterMl:number;
 itemDrinks:{ml:number;label:string;caffeineMg:number}[];
 gaps:NutritionGap[];
 reasons:{name:string;sourceRef:unknown}[];
 leftovers?:{texts:string[];calories:number|null};
}
export interface CardData {
  /** Request-time presentation inputs; no English string parsing on a locale switch. */
  wording?:CardWording;
  kind: "meal" | "drink";
  glyph?:DrinkGlyph;
  drinkLabel?:string;
  drinkDetail?:string;
  dayDrinks?:{glyph:DrinkGlyph;ml:number}[];
  /** An instant, formatted in the viewing device's zone by the live wrapper. */
  time?: string;
  amountMl?: number;
  drinkLine?: string;
  caffeineMg?: number;
  hydration?: HydrationRecord;
  kcal?: number | null;
  macros?: { protein: number | null; carbs: number | null; fat: number | null };
  items?: { name: string; grams: number | null; portionText?: string }[];
  gap?: string;
  waterLine?: string;
  mealDrinkLine?: string;
  footer?: string;
}
export interface CardSource {
  dayDrinks?:{glyph:DrinkGlyph;ml:number}[];
  items: CardItem[];
  eaten_at?: string;
  eatenAt?: string;
  drink?: DrinkCardData | null;
  kind?: "meal" | "drink";
  foodWaterMl?: number;
  itemDrinks?: import("@/lib/intake/hydration").ItemDrinkRecord[];
  dayHydration?: HydrationRecord;
  footer?: string;
}

/** All live cards and stored PNGs use this one presentation data builder. */
export function cardDataFromRow(source: CardSource, locale:Locale): CardData {
  const totals = sumNutrition(source.items);
  const drink = source.drink;
  const hydration = source.dayHydration ?? (drink ? { totalMl: drink.totalMl, drinksMl: drink.drinksMl, foodMl: drink.foodMl, caffeineMg: drink.dayCaffeineMg ?? drink.caffeineMg } : undefined);
  const alcoholic=drink?.kind==='alcohol'||Boolean(source.itemDrinks?.some(row=>row.kind==='alcohol'))||source.items.some(item=>item.micronutrients?.some(n=>n.nutrientId===1018&&n.basis==='portion'&&Number(n.value)>=0.5));
  const linkedAlcohol=source.itemDrinks?.filter(row=>row.kind==='alcohol');
  const alcoholG=drink?.kind==='alcohol'?(drink.alcoholG??0):linkedAlcohol?.length?linkedAlcohol.reduce((sum,row)=>sum+(row.alcoholG??0),0):source.items.reduce((total,item)=>total+(Number(item.micronutrients?.find(n=>n.nutrientId===1018&&n.basis==='portion')?.value)||0),0);
  const label=drink?.label??source.items.map(item=>item.name).join(' · ');
  const glyph=drinkGlyph(label,alcoholic?'alcohol':(drink?.caffeineMg??0)>0?'caffeine':'water');
  const omitted=source.items.filter(item=>item.not_eaten_grams!=null);
  const remainderCalories=omitted.map(item=>item.not_eaten_calories??null);
  const card:CardData={
    glyph,drinkLabel:label,dayDrinks:drink?.dayDrinks??source.dayDrinks,
    kind: drink || source.kind === "drink" || (source.items.length>0&&source.items.every(item=>item.id&&source.itemDrinks?.some(row=>row.post_item_id===item.id))) ? "drink" : "meal",
    time:source.eaten_at??source.eatenAt,amountMl:drink?.ml,caffeineMg:drink?.caffeineMg,hydration,
    kcal:totals.calories,macros:{protein:totals.protein_g,carbs:totals.carbs_g,fat:totals.fat_g},
    items:source.items.map(item=>({name:item.name,grams:item.portion_grams==null?null:toNumber(item.portion_grams),...(item.portion_grams==null&&/^\d+(?:\.\d+)? ml$/i.test(item.portion_text??'')?{portionText:item.portion_text!}:{})})),
    footer:source.footer,
    wording:{
      alcoholic,alcoholG,glyph,drink:drink?{label:drink.label,caffeineMg:drink.caffeineMg,source:drink.source}:undefined,
      foodWaterMl:source.foodWaterMl??0,itemDrinks:(source.itemDrinks??[]).map(row=>({ml:row.ml,label:row.label,caffeineMg:row.caffeineMg})),
      gaps:nutritionGaps(totals),reasons:source.items.map(item=>({name:item.name,sourceRef:item.source_ref})),
      leftovers:source.footer===undefined&&omitted.length?{texts:omitted.map(item=>item.not_eaten_count_text??`${Math.round(item.not_eaten_grams!)} g`),calories:remainderCalories.some(value=>value===null)?null:remainderCalories.reduce<number>((sum,value)=>sum+(value??0),0)}:undefined,
    },
  };
  return localizeCardData(card,locale);
}

/** The one formatter for initial card building and reader-language changes. */
export function localizeCardData(card:CardData,locale:Locale):CardData {
 const tn=nutritionTranslator(locale);
 const words=card.wording;
 if(!words){if(locale==='en')return card;throw new Error('Card presentation inputs are unavailable for this language.');}
 const t=cardTranslator(locale),drink=words.drink;
 const kcal=card.kcal==null?t('unavailable'):formatCalories(card.kcal,tn,locale);
 const caffeineTotal=words.itemDrinks.reduce((sum,row)=>sum+row.caffeineMg,0);
 return {...card,
   drinkDetail:words.alcoholic?(words.alcoholG>0?t('alcoholDetail',{grams:formatNutrition(words.alcoholG,tn,locale),drinks:(words.alcoholG/14).toFixed(1)}):t('alcoholUnavailable')):words.glyph==='coffee'?t('caffeineDetail',{amount:formatNutrition(card.caffeineMg??0,tn,locale)}):`${formatNutrition(card.amountMl??0,tn,locale)} ml`,
   drinkLine:drink?`${drink.label}${drink.caffeineMg?` · ${t('caffeineDetail',{amount:formatNutrition(drink.caffeineMg,tn,locale)})} · ${kcal} kcal`:drink.source==='item'?` · ${kcal} kcal`:''}`:undefined,
   gap:gapSentence(words.gaps,tn,locale,words.reasons,false),
   waterLine:words.foodWaterMl>=50&&card.hydration?t('waterLine',{meal:formatNumber(locale,Math.round(words.foodWaterMl)),day:formatNumber(locale,card.hydration.totalMl)}):undefined,
   mealDrinkLine:!drink&&words.itemDrinks.length?t('mealDrinks',{drinks:words.itemDrinks.map(row=>`${formatNumber(locale,Math.round(row.ml))} ml ${row.label}`).join(' · ')})+(caffeineTotal>0?t('caffeineSuffix',{amount:Math.round(caffeineTotal)}):''):undefined,
   footer:words.leftovers?t('leftovers',{amounts:words.leftovers.texts.join(', '),calories:words.leftovers.calories===null?t('unavailable'):formatCalories(words.leftovers.calories,tn,locale)}):card.footer,
 };
}

export const buildCardData = cardDataFromRow;

/** Read presentation fields with owner-scoped access; callers may provide their
 * atomic nutrition snapshot, preserving the renderer's publication fingerprint. */
export async function readCardData(db: SupabaseClient, userId: string, post: { id: string; eaten_at: string; items: CardItem[] }, zone = "UTC"): Promise<CardData> {
  const values = await getPostHydrationData(db, userId, [{ ...post, items: post.items.map(item => ({ ...item, micronutrients: item.micronutrients ?? [] })) }], zone);
  // Stored card text remains English until #1219; viewers localize its wording data.
  return cardDataFromRow({ ...post, ...values[post.id] },'en');
}
