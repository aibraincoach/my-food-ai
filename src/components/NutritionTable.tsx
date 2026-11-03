import { NUTRIENT_KEYS, unavailableFoods, formatCalories, formatNutrition, sumNutrition, type CurrentItem } from "@/lib/nutrition/totals";

import {nutritionTableRows, formatTableNutrient} from "@/lib/nutrition/table";

function number(value: number | null, unit: string) {
  return value === null ? "unavailable" : unit.toLowerCase() === "kcal" ? formatCalories(value) : formatNutrition(value);
}

export default function NutritionTable({ items }: { items: CurrentItem[] }) {
  const totals = sumNutrition(items);
  const rows = nutritionTableRows(items);
  return <section className="px-screen-x pt-grid" aria-label="Consumed nutrition">
    {unavailableFoods(totals,NUTRIENT_KEYS).length ? <p className="text-meta text-muted">Known nutrition shown. Nutrition unavailable: {unavailableFoods(totals,NUTRIENT_KEYS).join(", ")}</p> : null}
    <table className="w-full border-collapse text-detail tabular-nums"><caption className="sr-only">Consumed nutrition from USDA FoodData Central</caption>
      <tbody>{rows.map((row, index) => <tr key={`${index}:${row.name}:${row.unit}`} className={`h-table-row border-b border-hairline ${index === 0 ? "font-medium text-text" : "text-muted"}`}>
        <th scope="row" className="py-grid text-left" style={{ fontWeight: "inherit" }}>{row.name}{row.unavailable?.length?` · unavailable: ${row.unavailable.join(", ")}`:""}</th>
        <td className="whitespace-nowrap py-grid pl-grid text-right">{row.micro&&row.value!==null?formatTableNutrient(row.value):number(row.value,row.unit)}{row.value === null ? "" : ` ${row.unit}`}</td>
      </tr>)}</tbody>
    </table>
    <p className="pt-sheet-top text-label text-muted">Nutrition values from USDA FoodData Central.</p>
  </section>;
}
