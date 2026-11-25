'use client';
import {useLocale,useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/locales';
import {formatEnergy,formatNutrient} from '@/i18n/format';
import {sumNutrition,type NutritionLike,type StoredNutrient} from '@/lib/nutrition/totals';
export default function NutritionSummary({items}:{items:(NutritionLike & {micronutrients?:StoredNutrient[]})[]}) {
 const t=useTranslations('post'),tc=useTranslations('card'),tn=useTranslations('nutrition'),locale=useLocale() as Locale;
 const totals=sumNutrition(items);
 const energy=totals.traceOnly?.includes('calories')?tn('trace'):formatEnergy(locale,totals.calories);
 const macro=(key:'protein_g'|'carbs_g'|'fat_g')=>totals.traceOnly?.includes(key)?tn('trace'):`${formatNutrient(locale,totals[key])} g`;
 const cells=[{value:energy,label:'kcal'},{value:macro('protein_g'),label:tc('protein')},{value:macro('carbs_g'),label:tc('carbs')},{value:macro('fat_g'),label:tc('fat')}];
 return <section aria-label={t('consumedSummary')} className="mx-inset mt-[10px] grid grid-cols-4 overflow-hidden rounded-field border border-hairline">
  {cells.map(cell=><div key={cell.label} className="flex flex-col items-center border-l border-hairline py-[10px] first:border-l-0"><span className="text-month tabular-nums">{cell.value}</span><span className="text-label text-muted">{cell.label}</span></div>)}
  {totals.trace&&Object.keys(totals.trace).some(key=>!totals.traceOnly?.includes(key as import('@/lib/nutrition/totals').NutrientKey))?<p className="col-span-4 text-meta text-muted">{tn('includesTraceAmounts')}</p>:null}
 </section>;
}
