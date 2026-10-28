import { checkWording } from "./wording-check";
export { checkWording } from "./wording-check";
export type ConsumedTotals = { calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null };
export function plainConsumed(totals: ConsumedTotals): string {
  const value = (n: number | null) => n !== null && Number.isFinite(n) ? String(Math.round(n * 10) / 10) : "unavailable";
  return `Consumed: ${value(totals.calories)} kcal · ${value(totals.protein_g)} g protein · ${value(totals.carbs_g)} g carbs · ${value(totals.fat_g)} g fat.`;
}
// One rewrite only; the saved fallback comes from USDA numbers, never model estimates.
export async function safeSummary(text: string, totals: ConsumedTotals): Promise<string> {
  const check = checkWording(text);
  if (check.ok) return text;
  const { createResponse } = await import("@/lib/meta/client");
  try {
    const result = await createResponse({
      model: "muse-spark-1.3",
      instructions: `Rewrite the summary without these words: ${check.hits.join(", ")}. State only what was consumed. Preserve the supplied numbers.`,
      input: [{ role: "user", content: [{type:"input_text",text:JSON.stringify({summary:text,totals})}] }],
      text: { format: { type: "json_schema", name: "wording", strict: true, schema: {
        type: "object", properties: { summary: {type:"string"} }, required:["summary"], additionalProperties:false,
      } } }, max_output_tokens: 512,
    });
    if (result.status === "completed" && result.outputText) {
      const rewritten: unknown = JSON.parse(result.outputText);
      if (typeof rewritten === "object" && rewritten !== null && "summary" in rewritten && typeof rewritten.summary === "string" && checkWording(rewritten.summary).ok) return rewritten.summary;
    }
  } catch { /* Keep the meal's data even if a wording-only rewrite fails. */ }
  return plainConsumed(totals);
}
