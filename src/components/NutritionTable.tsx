import {useLocale,useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/locales';
import {formatEnergy,formatNutrient,formatMicroNutrient} from '@/i18n/format';
import {foodApproximation} from '@/lib/fdc/approximation-metadata';
import {mealSources} from '@/lib/nutrition/meal-sources';
import OpenFoodFactsAttribution from './OpenFoodFactsAttribution';
import { nutritionGaps, gapSentence, NUTRIENT_KEYS, sumNutrition, type CurrentItem } from "@/lib/nutrition/totals";

import {nutritionTableRows} from "@/lib/nutrition/table";


export default function NutritionTable({ items }: { items: CurrentItem[] }) {
 const tn=useTranslations('nutrition'),labels=useTranslations('nutrients');
  const t=useTranslations('card'),tp=useTranslations('post'),locale=useLocale() as Locale;
  const estimated=items.filter(item=>foodApproximation(item)?.kind==='estimate');
  const sources=mealSources(items);
  const sourceLabels=sources.filter(source=>!['unrecorded','partial'].includes(source.kind)).map(source=>t(({usda:'sourceUsda',off:'sourceOff',saved:'sourceSaved',label:'sourceLabel',estimate:'sourceEstimate',mext:'sourceMext',entered:'sourceEntered',amount:'sourceAmount'} as const)[source.kind as 'usda'|'off'|'saved'|'label'|'estimate'|'mext'|'entered'|'amount']));
  const totals = sumNutrition(items);
  const rows = nutritionTableRows(items,tn,labels,locale);
  const gap=gapSentence(nutritionGaps(totals,NUTRIENT_KEYS),tn,locale,items.map(item=>({name:item.name,sourceRef:item.source_ref})),true);
  return <section className="px-screen-x pt-grid" aria-label={tp('consumedNutrition')}>
    {gap ? <p className="text-meta text-muted">{tn('knownValues')}{locale==='ja'?'':' '}{gap}</p> : null}
    <table className="w-full border-collapse text-detail tabular-nums"><caption className="sr-only">{t('tableCaption')}</caption>
      <tbody>{rows.map((row, index) => <tr key={`${index}:${row.name}:${row.unit}`} className={`h-table-row border-b border-hairline ${index === 0 ? "font-medium text-text" : "text-muted"}`}>
        <th scope="row" className="py-grid text-left" style={{ fontWeight: "inherit" }}><span data-i18n-server-wording={row.unmappedName?'nutrient-name':undefined}>{row.name}</span>{row.unavailable?.length?tp('unavailableFoods',{foods:row.unavailable.join(locale==='ja'?'、':', ')}):""}</th>
        <td className="whitespace-nowrap py-grid pl-grid text-right">{row.value===null?t('unavailable'):row.micro?formatMicroNutrient(locale,row.value):row.unit.toLowerCase()==='kcal'?formatEnergy(locale,row.value):formatNutrient(locale,row.value)}{row.value === null ? "" : ` ${row.unit}`}</td>
      </tr>)}</tbody>
    </table>
    <div className="pt-sheet-top text-label text-muted" data-meal-sources>
      {sourceLabels.length>0&&<p>{t('sourceLead',{sources:sourceLabels.join(locale==='ja'?'、':', ')})}</p>}
      {sources.filter(source=>source.kind==='unrecorded').map(source=><p key={source.kind}>{t('sourceUnrecorded',{foods:source.foods.join(locale==='ja'?'、':', ')})}</p>)}
      {sources.filter(source=>source.kind==='partial').flatMap(source=>source.foods.map(food=><p key={'partial:'+food}>{t('sourcePartial',{food})}</p>))}
    </div>
    {estimated.map(item=><p key={item.id} className="text-label text-muted">{t('estimateNote',{name:item.name})}</p>)}
    {items.some(item=>item.source_ref?.startsWith("off:")) && <OpenFoodFactsAttribution/>}
  </section>;
}
