import { createResponseRetrying404 } from "./retry404";
import { sameMealPrompt, sameMealSchema } from "@/lib/prompts/spark/same-meal";

type Comparison = { prior: string; currentCaption: string | null; pastCaption: string | null };

// Reuse is an optimization: only a complete, strictly boolean confirmation may copy nutrition.
export async function confirmSameMeal(photos: readonly Uint8Array[], context: Comparison): Promise<boolean> {
  for (const maxOutputTokens of [2048, 8192]) {
    const result = await createResponseRetrying404({
      model: "muse-spark-1.3", instructions: sameMealPrompt,
      input: [{ role: "user", content: [
        { type: "input_text", text: JSON.stringify({ prior: context.prior, current_caption: context.currentCaption, past_caption: context.pastCaption, image_order: ["current", "past"] }) },
        ...photos.map(photo => ({ type: "input_image", image_url: `data:image/jpeg;base64,${Buffer.from(photo).toString("base64")}` })),
      ] }],
      text: { format: { type: "json_schema", name: "same_meal", strict: true, schema: sameMealSchema } },
      max_output_tokens: maxOutputTokens,
    });
    if (result.refusal) return false;
    if (result.status === "incomplete" && maxOutputTokens === 2048) continue;
    if (result.status !== "completed" || !result.outputText) return false;
    try {
      const value: unknown = JSON.parse(result.outputText);
      return typeof value === "object" && value !== null && !Array.isArray(value)
        && Object.keys(value).length === 1 && typeof (value as { same_meal?: unknown }).same_meal === "boolean"
        && (value as { same_meal: boolean }).same_meal;
    } catch { return false; }
  }
  return false;
}
