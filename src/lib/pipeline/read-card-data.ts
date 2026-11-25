import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';
import {getPostHydrationData} from '@/lib/intake/hydration';
import {cardTranslator} from '@/i18n/card';
import {nutritionTranslator} from '@/i18n/nutrition';
import {cardDataFromRow,type CardData,type CardItem} from './card-data';

/** Read presentation fields with owner-scoped access; callers may provide their
 * atomic nutrition snapshot, preserving the renderer's publication fingerprint. */
export async function readCardData(db: SupabaseClient, userId: string, post: { id: string; eaten_at: string; items: CardItem[] }, zone = "UTC"): Promise<CardData> {
  const values = await getPostHydrationData(db, userId, [{ ...post, items: post.items.map(item => ({ ...item, micronutrients: item.micronutrients ?? [] })) }], zone);
  // Stored card text remains English until #1219; viewers localize its wording data.
  return cardDataFromRow({ ...post, ...values[post.id] },'en',{t:cardTranslator('en'),tn:nutritionTranslator('en')});
}
