import {sumMicronutrients, sumNutrition, type CurrentItem, type NutritionLike} from './totals';
const core: {name: string; key: keyof NutritionLike; unit: string}[] = [
  {name:'Calories',key:'calories',unit:'kcal'},{name:'Protein',key:'protein_g',unit:'g'},
  {name:'Carbs',key:'carbs_g',unit:'g'},{name:'Fat',key:'fat_g',unit:'g'},
  {name:'Fibre',key:'fibre_g',unit:'g'},{name:'Sugar',key:'sugar_g',unit:'g'},
  {name:'Sodium',key:'sodium_mg',unit:'mg'},
];
const macroIds = new Set([1008,1062,2047,2048,1003,1004,1005,1079,2000,1063,1093]);
const macroNames = new Set([...core.map(row=>row.name.toLowerCase()),'energy','protein','total lipid fat','carbohydrate by difference','fiber total dietary','fibre','sugars total','sugars total including nlea','sugars total nlea','sodium na']);
const names: Record<number,string> = {
  1051:'Water',1057:'Caffeine',1087:'Calcium',1089:'Iron',1090:'Magnesium',1091:'Phosphorus',1092:'Potassium',1095:'Zinc',1098:'Copper',1101:'Manganese',1103:'Selenium',
  1104:'Vitamin A (IU)',1105:'Retinol',1106:'Vitamin A',1109:'Vitamin E',1110:'Vitamin D (IU)',1114:'Vitamin D',
  1162:'Vitamin C',1165:'Thiamin (B1)',1166:'Riboflavin (B2)',1167:'Niacin (B3)',1175:'Vitamin B6',1177:'Folate',1178:'Vitamin B12',1180:'Choline',1185:'Vitamin K',1186:'Folate (DFE)',
  1253:'Cholesterol',1258:'Saturated fat',1292:'Monounsaturated fat',1293:'Polyunsaturated fat',
};
const preferred = ['Potassium','Calcium','Iron','Magnesium','Zinc','Vitamin A','Vitamin C','Vitamin D','Vitamin B12','Folate','Cholesterol'];
function unit(value: string): string {
  const upper=value.toUpperCase();
  return upper==='UG'||upper==='MCG'||upper==='ΜG'?'µg':upper==='IU'?'IU':upper==='KJ'?'kJ':value.toLowerCase();
}
export function nutritionTableRows(items: CurrentItem[]) {
  const totals=sumNutrition(items);
  const nutrients=items.map(item=>({...item,micronutrients:item.micronutrients.filter(row=>{
    const name=(row.nutrientName??row.name??'').toLowerCase().replace(/[(),]/g,' ').replace(/\s+/g,' ').trim();
    return !macroIds.has(row.nutrientId??-1)&&!macroNames.has(name);
  }).map(row=>({...row,nutrientName:names[row.nutrientId??-1]??row.nutrientName??row.name,unitName:unit(row.unitName??row.unit??'')}))}));
  const micros=sumMicronutrients(nutrients).sort((a,b)=>{
    const rank=(name:string)=>preferred.includes(name)?preferred.indexOf(name):preferred.length;
    return rank(a.name)-rank(b.name);
  });
  return [...core.map(({name,key,unit})=>({name,unit,value:totals[key],unavailable:totals.missing?.[key],micro:false})),...micros.map(row=>({...row,micro:true}))];
}
export function formatTableNutrient(value: number): string {
  if(value>0&&value<0.01)return '<0.01';
  return value.toLocaleString('en-US',{maximumFractionDigits:2});
}
