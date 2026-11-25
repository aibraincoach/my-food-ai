import {nutritionTranslator,type NutritionTranslator} from '@/i18n/nutrition';
import {isLocale,type Locale} from '@/i18n/locales';
import {formatMicroNutrient} from '@/i18n/format';
import {sumMicronutrients, sumNutrition, UNNAMED_ITEM, type CurrentItem} from './totals';
import {keepsCaffeine} from '@/lib/intake/alcohol';
const core = [
  {"key": "calories", "unit": "kcal", "message": "core_calories"},
  {"key": "protein_g", "unit": "g", "message": "core_protein_g"},
  {"key": "carbs_g", "unit": "g", "message": "core_carbs_g"},
  {"key": "fat_g", "unit": "g", "message": "core_fat_g"},
  {"key": "fibre_g", "unit": "g", "message": "core_fibre_g"},
  {"key": "sugar_g", "unit": "g", "message": "core_sugar_g"},
  {"key": "sodium_mg", "unit": "mg", "message": "core_sodium_mg"}
] as const;
const macroIds = new Set([1008,1062,2047,2048,1003,1004,1005,1079,2000,1063,1093]);
const macroAliases = ['energy','protein','total lipid fat','carbohydrate by difference','fiber total dietary','fibre','sugars total','sugars total including nlea','sugars total nlea','sodium na'];
const nutrientMessages = {
  1051: 'nutrient_1051',
  1057: 'nutrient_1057',
  1087: 'nutrient_1087',
  1089: 'nutrient_1089',
  1090: 'nutrient_1090',
  1091: 'nutrient_1091',
  1092: 'nutrient_1092',
  1095: 'nutrient_1095',
  1098: 'nutrient_1098',
  1101: 'nutrient_1101',
  1103: 'nutrient_1103',
  1104: 'nutrient_1104',
  1105: 'nutrient_1105',
  1106: 'nutrient_1106',
  1109: 'nutrient_1109',
  1110: 'nutrient_1110',
  1114: 'nutrient_1114',
  1162: 'nutrient_1162',
  1165: 'nutrient_1165',
  1166: 'nutrient_1166',
  1167: 'nutrient_1167',
  1175: 'nutrient_1175',
  1177: 'nutrient_1177',
  1178: 'nutrient_1178',
  1180: 'nutrient_1180',
  1185: 'nutrient_1185',
  1186: 'nutrient_1186',
  1190: 'nutrient_1190',
  1253: 'nutrient_1253',
  1258: 'nutrient_1258',
  1292: 'nutrient_1292',
  1293: 'nutrient_1293'} as const;
const preferred = [1092,1087,1089,1090,1095,1106,1162,1114,1178,1177,1253] as const;
function unit(value: string): string {
  const upper=value.toUpperCase();
  return upper==='UG'||upper==='MCG'||upper==='ΜG'?'µg':upper==='IU'?'IU':upper==='KJ'?'kJ':value.toLowerCase();
}
export function nutritionTableRows(items: CurrentItem[], t: NutritionTranslator, locale: Locale) {
  if(!isLocale(locale))throw new Error('Nutrition locale is required.');
  // USDA canonical identity/sort order remains English; only labels are viewed.
  const english=nutritionTranslator('en');
  const names=Object.fromEntries(Object.entries(nutrientMessages).map(([id,key])=>[id,english(key)]));
  const macroNames=new Set([...core.map(row=>english(row.message).toLowerCase()),...macroAliases]);
  const totals=sumNutrition(items);
  const nutrients=items.map(item=>({...item,micronutrients:item.micronutrients.filter(row=>{
    const name=(row.nutrientName??row.name??'').toLowerCase().replace(/[(),]/g,' ').replace(/\s+/g,' ').trim();
    if(row.nutrientId===1057&&!keepsCaffeine({name:item.name,food_category:(item as {food_category?:string|null}).food_category,micronutrients:item.micronutrients}))return false;
    return !macroIds.has(row.nutrientId??-1)&&!macroNames.has(name);
  }).map(row=>({...row,nutrientName:names[row.nutrientId??-1]??row.nutrientName??row.name,unitName:unit(row.unitName??row.unit??'')}))}));
  const micros=sumMicronutrients(nutrients,{withNutrientIds:true}).sort((a,b)=>{
    const order=preferred.map(id=>names[id]);
    const rank=(name:string)=>order.includes(name)?order.indexOf(name):order.length;
    return rank(a.name)-rank(b.name);
  });
  const foods=(values:string[]|undefined)=>values?.map(name=>name===UNNAMED_ITEM?t('anItem'):name);
  return [...core.map(({message,key,unit})=>({name:t(message),unit,value:totals[key],unavailable:foods(totals.missing?.[key]),micro:false})),...micros.map(({nutrientId,...row})=>({...row,name:nutrientId!=null&&nutrientId in nutrientMessages?t(nutrientMessages[nutrientId as keyof typeof nutrientMessages]):row.name,...(row.unavailable?{unavailable:foods(row.unavailable)}:{}),micro:true}))];
}
export function formatTableNutrient(value: number, locale: Locale): string {
  if(!isLocale(locale))throw new Error('Nutrition locale is required.');
  return formatMicroNutrient(locale,value);
}
