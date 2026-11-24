import {useTranslations} from 'next-intl';
import {foodApproximation} from '@/lib/fdc/approximation-metadata';
import OpenFoodFactsAttribution from './OpenFoodFactsAttribution';
import { nutritionGaps, gapSentence, GAP_LEAD, NUTRIENT_KEYS, formatCalories, formatNutrition, sumNutrition, type CurrentItem } from "@/lib/nutrition/totals";

import {nutritionTableRows, formatTableNutrient} from "@/lib/nutrition/table";

function number(value: number | null, unit: string) {
  return value === null ? "unavailable" : unit.toLowerCase() === "kcal" ? formatCalories(value) : formatNutrition(value);
}

export default function NutritionTable({ items }: { items: CurrentItem[] }) {
  const t=useTranslations('card');
  const estimated=items.filter(item=>foodApproximation(item)?.kind==='estimate');
  const totals = sumNutrition(items);
  const rows = nutritionTableRows(items);
  const gap=gapSentence(nutritionGaps(totals,NUTRIENT_KEYS),items.map(item=>({name:item.name,sourceRef:item.source_ref})),true);
  return <section className="px-screen-x pt-grid" aria-label="Consumed nutrition">
    {gap ? <p className="text-meta text-muted">{GAP_LEAD} {gap}</p> : null}
    <table className="w-full border-collapse text-detail tabular-nums"><caption className="sr-only">{t('tableCaption')}</caption>
      <tbody>{rows.map((row, index) => <tr key={`${index}:${row.name}:${row.unit}`} className={`h-table-row border-b border-hairline ${index === 0 ? "font-medium text-text" : "text-muted"}`}>
        <th scope="row" className="py-grid text-left" style={{ fontWeight: "inherit" }}>{row.name}{row.unavailable?.length?` · unavailable: ${row.unavailable.join(", ")}`:""}</th>
        <td className="whitespace-nowrap py-grid pl-grid text-right">{row.micro&&row.value!==null?formatTableNutrient(row.value):number(row.value,row.unit)}{row.value === null ? "" : ` ${row.unit}`}</td>
      </tr>)}</tbody>
    </table>
    <p className="pt-sheet-top text-label text-muted">{t('sourceNote')}</p>
    {estimated.map(item=><p key={item.id} className="text-label text-muted">{t('estimateNote',{name:item.name})}</p>)}
    {items.some(item=>item.source_ref?.startsWith("off:")) && <OpenFoodFactsAttribution/>}
  </section>;
}
