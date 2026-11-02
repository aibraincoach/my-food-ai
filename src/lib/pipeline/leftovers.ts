import {toNumber,rescaleStoredNutrition,type CurrentItem,type NutritionRow,type NutritionLike} from '@/lib/nutrition/totals';

/** Corrections see the meal before deductions. Each persisted deduction is then
 * reapplied once, independently of what an ordinary added photo shows. */
export function beforeLeftovers(item:CurrentItem):CurrentItem {
 if(item.not_eaten_grams==null)return item;
 const grams=toNumber(item.portion_grams)+item.not_eaten_grams;
 return {...item,calories:item.calories==null||item.not_eaten_calories==null?null:toNumber(item.calories)+item.not_eaten_calories,portion_grams:grams,portion_text:`${grams} g`};
}
export function retainedNutrition(item:CurrentItem){
 return {calories:item.calories,protein_g:item.protein_g,carbs_g:item.carbs_g,fat_g:item.fat_g,fibre_g:item.fibre_g,sugar_g:item.sugar_g,sodium_mg:item.sodium_mg,micronutrients:item.micronutrients,source_ref:item.source_ref};
}
export function carryLeftovers<T extends {portion_grams:number|null;portion_text:string|null;nutrition:NutritionLike & {micronutrients:unknown[];source_ref:string|null}}>(row:T,prior?:CurrentItem):T & {not_eaten_grams?:number|null;not_eaten_calories?:number|null;not_eaten_count_text?:string|null;count_text?:string|null} {
 if(prior?.not_eaten_grams==null)return row;
 if(row.portion_grams==null||row.portion_grams<prior.not_eaten_grams)throw Error('The meal quantity cannot be smaller than its recorded leftovers.');
 const grams=row.portion_grams-prior.not_eaten_grams;
 // Unchanged gross amounts retain exact consumed nutrition, including a fully
 // uneaten item whose zero portion cannot be scaled back into a food reference.
 const unchanged=(!('name' in row)||row.name===prior.name)&&row.portion_grams===toNumber(prior.portion_grams)+prior.not_eaten_grams;
 return {...row,portion_grams:grams,portion_text:unchanged?prior.portion_text:`${grams} g`,nutrition:unchanged?retainedNutrition(prior):rescaleStoredNutrition({...row.nutrition,post_item_id:prior.id} as NutritionRow,row.portion_grams,grams),not_eaten_grams:prior.not_eaten_grams,not_eaten_calories:prior.not_eaten_calories??null,count_text:unchanged?prior.count_text:null,not_eaten_count_text:prior.not_eaten_count_text};
}
