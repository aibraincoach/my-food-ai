import type {SupabaseClient} from '@supabase/supabase-js';
import {getFoodById} from '@/lib/fdc/client';
import {scaleNutrition, type ScaledNutrition} from '@/lib/fdc/nutrients';
import {ioError} from '@/lib/worker/errors';
import {rescaleStoredNutrition, toNumber, type Numeric, type NutritionRow} from './totals';

export function storedNutrition(n: ScaledNutrition, id: string): NutritionRow {
 return {post_item_id:id, calories:n.calories,protein_g:n.proteinG,carbs_g:n.carbsG,fat_g:n.fatG,
  fibre_g:n.fibreG,sugar_g:n.sugarG,sodium_mg:n.sodiumMg,micronutrients:n.micronutrients as NutritionRow['micronutrients'],source_ref:n.sourceRef};
}

// Follow pending revisions until the last resolved identity, stopping at a name
// change. A coalesced recompute may never populate intermediate revisions.
export async function resolvePortionNutrition(admin: SupabaseClient, postId: string, priorId: string | null,
 name: string, grams: Numeric): Promise<NutritionRow | null> {
 const seen=new Set<string>();
 while(priorId){
  if(seen.has(priorId))throw new Error('Invalid item revision chain.');seen.add(priorId);
  const {data:prior,error,status}=await admin.from('post_items').select('id,name,portion_grams,supersedes')
   .eq('id',priorId).eq('post_id',postId).maybeSingle();
  if(error)throw ioError('Prior item could not be read.',error,status);
  if(!prior||prior.name!==name)return null;
  const {data:row,error:nutritionError,status:nutritionStatus}=await admin.from('item_nutrition')
   .select('post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref')
   .eq('post_item_id',priorId).maybeSingle();
  if(nutritionError)throw ioError('Prior nutrition could not be read.',nutritionError,nutritionStatus);
  if(row){
   const nutrition=row as NutritionRow;
   const hasAmounts=[nutrition.calories,nutrition.protein_g,nutrition.carbs_g,nutrition.fat_g,...(Array.isArray(nutrition.micronutrients)?nutrition.micronutrients:[]).map(n=>n.value)].some(n=>n!=null);
   if(nutrition.source_ref && (toNumber(prior.portion_grams)<=0 || !hasAmounts)) {
    const id=Number(nutrition.source_ref);
    const food=await getFoodById(admin,id);
    return storedNutrition(scaleNutrition(food,grams==null?null:toNumber(grams)),priorId);
   }
   return rescaleStoredNutrition(nutrition,prior.portion_grams,grams);
  }
  priorId=prior.supersedes;
 }
 return null;
}
