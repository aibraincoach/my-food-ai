import { toNumber, sumMicronutrients, type CurrentItem, type NutritionLike } from "@/lib/nutrition/totals";

function number(value: number | null) {
  return value === null ? "—" : new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

export default function NutritionTable({ items }: { items: CurrentItem[] }) {
  const core: { name: string; key: keyof NutritionLike; unit: string }[] = [
    { name: "Calories", key: "calories", unit: "kcal" }, { name: "Protein", key: "protein_g", unit: "g" },
    { name: "Carbs", key: "carbs_g", unit: "g" }, { name: "Fat", key: "fat_g", unit: "g" },
    { name: "Fibre", key: "fibre_g", unit: "g" }, { name: "Sugar", key: "sugar_g", unit: "g" },
    { name: "Sodium", key: "sodium_mg", unit: "mg" },
  ];
  const rows = [...core.map(({ name, key, unit }) => ({ name, unit,
    value: items.some((item) => item[key] == null) ? null : items.reduce((total, item) => total + toNumber(item[key]), 0),
  })), ...sumMicronutrients(items)];
  return <section className="px-screen-x pt-grid" aria-label="Consumed nutrition">
    <table className="w-full border-collapse text-detail tabular-nums"><caption className="sr-only">Consumed nutrition from USDA FoodData Central</caption>
      <tbody>{rows.map((row, index) => <tr key={`${index}:${row.name}:${row.unit}`} className={`h-table-row border-b border-hairline ${index === 0 ? "font-medium text-text" : "text-muted"}`}>
        <th scope="row" className="py-grid text-left" style={{ fontWeight: "inherit" }}>{row.name}</th>
        <td className="whitespace-nowrap py-grid pl-grid text-right">{number(row.value)}{row.value === null ? "" : ` ${row.unit}`}</td>
      </tr>)}</tbody>
    </table>
    <p className="pt-sheet-top text-meta text-muted">Nutrition values from USDA FoodData Central.</p>
  </section>;
}
