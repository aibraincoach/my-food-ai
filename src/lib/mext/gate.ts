import {energyFits} from '../fdc/nutrients';
import {checkRecord,type FoodKind} from '../fdc/record-kind';
import {excludedComponents} from '../fdc/exclusions';
import {referenceProteinMismatch} from '../fdc/protein-reference';
import type {MextRecord} from './record';

// Official food groups, never inferred by translating Japanese names.
const GROUP_KIND:Record<string,FoodKind|null>={
  '01':'grain','02':'vegetable','03':'sweet','04':'legume','05':'legume',
  '06':'vegetable','07':'fruit','08':'vegetable','09':'vegetable','10':'seafood',
  '11':'meat','12':'egg','13':'dairy','14':'fat','15':'sweet','16':'drink',
  '17':'condiment','18':null,
};
export function groupKind(group:string):FoodKind|null {
  if(!Object.hasOwn(GROUP_KIND,group))throw new Error('MEXT food group is invalid.');
  return GROUP_KIND[group];
}

// H15.1: USDA still consumes strong signals only. A MEXT component cannot stand
// for the whole compound; other weak signals remain evidence for the chooser.
export function mextCandidateEligible(name:string,caption:string,food:MextRecord):boolean {
  if(food.identityStatus!=='joined'||!food.nameEn)return false;
  const energy={foodNutrients:Object.entries(food.nutrients).flatMap(([key,n])=>n.value===null?[]:[{nutrientId:Number(key),nutrientName:key,unitName:n.unitName,value:n.value}])};
  if(!energyFits(name,energy))return false;
  const record={description:food.nameEn,category:null,kind:groupKind(food.foodGroup),kcalPer100g:food.nutrients['1008']?.value};
  const check=checkRecord(name,record);
  return check.strong.length===0&&!check.weak.some(signal=>signal.startsWith('part:'))
    &&!referenceProteinMismatch(name,food.nameEn)
    &&excludedComponents(food.nameEn,`${name} ${caption}`).length===0;
}
