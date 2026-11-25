import type {ScaledNutrition} from '../fdc/nutrients';
import {USDA_CANONICAL_NAMES} from '../nutrition/usda-canonical-names';
import type {MextFood} from './match';
import {mextSourceRef} from './record';

// MEXT is per 100 edible grams. No volume, cup, piece or refuse-ratio conversion.
export function scaleMextNutrition(food:MextFood,grams:number|null):ScaledNutrition {
  const factor=grams!==null&&Number.isFinite(grams)&&grams>0?grams/100:null;
  const sourceRef=mextSourceRef(food.foodNumber);
  const micronutrients=Object.entries(food.nutrients).map(([key,nutrient],index)=>({
    nutrientId:Number(key),nutrientName:USDA_CANONICAL_NAMES[Number(key)]??key,
    unitName:nutrient.unitName,value:factor===null||nutrient.value===null?null:nutrient.value*factor,
    basis:'portion' as const,
    ...(nutrient.marker!==null?{marker:nutrient.marker==='Tr'?'trace':'not_measured'}:{}),
    ...(food.approximation&&index===0?{approximation:{...food.approximation,sourceRef}}:{}),
  }));
  const value=(id:string)=>factor===null||food.nutrients[id]?.value==null?null:food.nutrients[id].value*factor;
  return {calories:value('1008'),proteinG:value('1003'),carbsG:value('1005'),fatG:value('1004'),
    fibreG:value('1079'),sugarG:value('2000'),sodiumMg:value('1093'),micronutrients,sourceRef,foodCategory:null};
}
