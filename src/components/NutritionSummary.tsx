'use client';
import {sumNutrition,formatCalories,formatNutrition,type NutritionLike} from '@/lib/nutrition/totals';
export default function NutritionSummary({items}:{items:NutritionLike[]}) {
 const totals=sumNutrition(items);
 const cells=[{value:formatCalories(totals.calories),label:'kcal'},{value:`${formatNutrition(totals.protein_g)} g`,label:'protein'},{value:`${formatNutrition(totals.carbs_g)} g`,label:'carbs'},{value:`${formatNutrition(totals.fat_g)} g`,label:'fat'}];
 return <section aria-label="Consumed summary" className="mx-inset mt-[10px] grid grid-cols-4 overflow-hidden rounded-field border border-hairline">
  {cells.map(cell=><div key={cell.label} className="flex flex-col items-center border-l border-hairline py-[10px] first:border-l-0"><span className="text-month tabular-nums">{cell.value}</span><span className="text-label text-muted">{cell.label}</span></div>)}
 </section>;
}
