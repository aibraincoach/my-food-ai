import type { ResolvedProduct } from '@/lib/fdc/barcode-product';
import type { StoredNutrient } from '@/lib/nutrition/totals';
export interface DrinkNutrition {
 calories:number|null;protein_g:number|null;carbs_g:number|null;fat_g:number|null;fibre_g:number|null;sugar_g:number|null;sodium_mg:number|null;
 micronutrients:StoredNutrient[];source_ref:string|null;food_category:string|null;
}
export interface PhotoDrink {
 name:string;ml:number;caffeineMg:number|null;kcal:number|null;source:'read from the can'|'estimated from the photo';
 grams:number|null;nutrition:DrinkNutrition;
}
export interface PhotoDrinkReading {id:string;position:number;drinks:PhotoDrink[];allDrinks:boolean}
export function scalePhotoDrink(drink:PhotoDrink,ml:number):PhotoDrink {
 const ratio=ml/drink.ml;
 const nutrition={...drink.nutrition};
 for(const key of ['calories','protein_g','carbs_g','fat_g','fibre_g','sugar_g','sodium_mg'] as const)nutrition[key]=nutrition[key]===null?null:nutrition[key]*ratio;
 nutrition.micronutrients=nutrition.micronutrients.map(n=>({...n,value:n.value===null?null:Number(n.value)*ratio}));
 return {...drink,ml,grams:drink.grams===null?null:drink.grams*ratio,kcal:nutrition.calories,caffeineMg:drink.caffeineMg===null?null:drink.caffeineMg*ratio,nutrition};
}
export function photoDrinkProduct(drink:PhotoDrink):ResolvedProduct {
 const n=drink.nutrition;
 return {gtin:'',fdcId:Number(n.source_ref)||0,name:drink.name,brand:null,basisUnit:'ml',servingSize:drink.ml,servingSizeUnit:'ml',servingText:null,packageWeight:`${drink.ml} ml`,micronutrients:[],foodCategory:n.food_category,
 source:'own',per100g:Object.fromEntries(['calories','protein_g','carbs_g','fat_g','fibre_g','sugar_g','sodium_mg'].map(k=>[k,n[k as keyof DrinkNutrition]===null?null:Number(n[k as keyof DrinkNutrition])*100/drink.ml])) as unknown as ResolvedProduct['per100g']};
}
