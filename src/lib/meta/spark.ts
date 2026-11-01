// Muse Spark 1.3 item naming and portions (item 9). Non-streaming
// /v1/responses with strict JSON output against the identify schema.
// Server-only: reads MODEL_API_KEY from the environment.
import { readNeedsInput, type NeedsInput } from "@/lib/pipeline/needs-input";
import { MetaApiError } from "./client";
import { createResponseRetrying404 } from "./retry404";
import { identifyPrompt, identifySchema } from "@/lib/prompts";

export interface IdentifyRegion {
  index: number;
  box: { left: number; top: number; right: number; bottom: number };
  areaFraction: number;
}

export interface IdentifiedItem {
  regionIndex: number | null;
  name: string;
  portionText: string | null;
  portionGrams: number | null;
  confidence: number | null;
}

export interface IdentifiedMeal {
  nutritionLabel?: boolean;
  items: IdentifiedItem[];
  summary: string;
  needsInput: NeedsInput | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function invalidIdentify(): MetaApiError {
  return new MetaApiError(500, "spark: identify output failed validation.");
}

// Validate the parsed JSON against the identify schema shape. Unknown
// region indexes are coerced to null (caption-only) so item 10 never
// attaches a mask path to a region SAM did not return.
function parseIdentifiedMeal(
  text: string,
  knownRegions: Set<number>
): IdentifiedMeal {
  let payload: unknown;
  try {
    payload = JSON.parse(text) as unknown;
  } catch {
    throw invalidIdentify();
  }
  if (!isRecord(payload)) throw invalidIdentify();
  const { items, summary } = payload;
  if (!Array.isArray(items) || typeof summary !== "string") {
    throw invalidIdentify();
  }
  const out: IdentifiedItem[] = [];
  for (const entry of items) {
    if (!isRecord(entry)) throw invalidIdentify();
    const regionIndex =
      entry.region_index === null || entry.region_index === undefined
        ? null
        : entry.region_index;
    if (regionIndex !== null && typeof regionIndex !== "number") {
      throw invalidIdentify();
    }
    const { name, portion_text, portion_grams, confidence } = entry;
    if (typeof name !== "string") throw invalidIdentify();
    if (
      (portion_text !== null &&
        portion_text !== undefined &&
        typeof portion_text !== "string") ||
      (portion_grams !== null &&
        portion_grams !== undefined &&
        typeof portion_grams !== "number") ||
      (confidence !== null &&
        confidence !== undefined &&
        typeof confidence !== "number")
    ) {
      throw invalidIdentify();
    }
    const index =
      typeof regionIndex === "number" && knownRegions.has(regionIndex)
        ? regionIndex
        : null;
    out.push({
      regionIndex: index,
      name,
      portionText:
        typeof portion_text === "string" ? portion_text : null,
      portionGrams:
        typeof portion_grams === "number" ? portion_grams : null,
      confidence: typeof confidence === "number" ? confidence : null,
    });
  }
  return { nutritionLabel: payload.nutrition_label === true, items: out, summary, needsInput: readNeedsInput(payload.needs_input) };
}

function regionLines(regions: IdentifyRegion[]): string {
  if (regions.length === 0) return "(no regions; name from the whole image)";
  return regions
    .map(
      (r) =>
        `${r.index}: [${r.box.left},${r.box.top},${r.box.right},${r.box.bottom}] area ${r.areaFraction.toFixed(3)}`
    )
    .join("\n");
}

export async function identifyItems(
  image: Uint8Array | null,
  mime: string,
  caption: string | null,
  regions: IdentifyRegion[],
  prior = ""
): Promise<IdentifiedMeal> {
  // Caption-only posts have no photo: the call is text-only and every
  // returned item lands in captionOnly (region_index null).
  const content: Record<string, unknown>[] = [];
  if (image) {
    content.push({
      type: "input_image",
      image_url: `data:${mime};base64,${Buffer.from(image).toString("base64")}`,
    });
  }
  const text =
    `Caption: ${caption && caption.trim() ? caption.trim() : "(none)"}\n` +
    `Regions (index, box left/top/right/bottom in source pixels, area fraction):\n${regionLines(regions)}`;
  const known = new Set(regions.map((r) => r.index));
  // Output allowance is not a work target; low effort avoids discarded warm-up calls.
  const maxTokens = 8192;
  const out = await createResponseRetrying404({
      model: "muse-spark-1.3",
      reasoning: { effort: "low" },
      instructions: identifyPrompt + (prior ? `\n${prior}` : ""),
      input: [
        {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text }, ...content],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "identify",
          schema: identifySchema,
          strict: true,
        },
      },
      max_output_tokens: maxTokens,
    });
  if (out.refusal) {
    throw new MetaApiError(500, "spark: model refused the identify call.");
  }
  if (out.status !== "completed" || out.outputText === null) {
    throw new MetaApiError(
      500,
      `spark: identify ended with status ${out.status}.`
    );
  }
  return parseIdentifiedMeal(out.outputText, known);
}
