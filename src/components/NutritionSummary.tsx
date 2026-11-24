'use client';
import {useLocale,useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/locales';
import {formatEnergy,formatNutrient} from '@/i18n/format';
import {sumNutrition,type NutritionLike} from '@/lib/nutrition/totals';
export default function NutritionSummary({items}:{items:NutritionLike[]}) {
 const t=useTranslations('post'),tc=useTranslations('card'),locale=useLocale() as Locale;
 const totals=sumNutrition(items);
 const cells=[{value:formatEnergy(locale,totals.calories),label:'kcal'},{value:`${formatNutrient(locale,totals.protein_g)} g`,label:tc('protein')},{value:`${formatNutrient(locale,totals.carbs_g)} g`,label:tc('carbs')},{value:`${formatNutrient(locale,totals.fat_g)} g`,label:tc('fat')}];
 return <section aria-label={t('consumedSummary')} className="mx-inset mt-[10px] grid grid-cols-4 overflow-hidden rounded-field border border-hairline">
  {cells.map(cell=><div key={cell.label} className="flex flex-col items-center border-l border-hairline py-[10px] first:border-l-0"><span className="text-month tabular-nums">{cell.value}</span><span className="text-label text-muted">{cell.label}</span></div>)}
 </section>;
}
