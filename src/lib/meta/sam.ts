// SAM 3.1 segmentation step (item 8). One streaming request with the
// single concept "food item"; records parsed with @meta-sam/parser.
// Zero records is normal. Server-only: reads MODEL_API_KEY from the
// environment and is called only from the worker and scripts.
import {
  decodeMaskToRaster,
  parseImageStream,
  recordsOfKind,
} from "@meta-sam/parser";
import {
  MetaApiError,
  createMetaClient,
} from "./client";

export interface RegionBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface FoodRegion {
  index: number;
  box: RegionBox;
  areaFraction: number;
  confidence: number | null;
  raster: Uint8Array;
  rasterWidth: number;
  rasterHeight: number;
}

function toMetaApiError(error: unknown, fallback: string): MetaApiError {
  if (error instanceof MetaApiError) return error;
  const status =
    typeof (error as { status?: unknown }).status === "number"
      ? ((error as { status: number }).status as number)
      : 500;
  const message =
    error instanceof Error ? error.message : fallback;
  return new MetaApiError(status, `sam: ${message}`);
}

function identityNumber(identity: string): number | null {
  const tail = identity.split(":").pop();
  const parsed = tail === undefined ? NaN : Number(tail);
  return Number.isInteger(parsed) ? (parsed as number) : null;
}

// Box N (objectId "N") pairs with mask N (identity "image:*:N"); the
// stream interleaves them as box, mask, box, mask. Pair on the number
// and drop anything unpaired.
export async function segmentFoodRegions(
  image: Uint8Array,
  mime: string,
  photoWidth: number,
  photoHeight: number
): Promise<FoodRegion[]> {
  const client = createMetaClient();
  const imageUrl = `data:${mime};base64,${Buffer.from(image).toString("base64")}`;
  let stream;
  try {
    stream = await client.responses.create({
      model: "sam-3.1",
      input: [
        {
          type: "message",
          role: "user",
          content: [
            { type: "input_text", text: "food item" },
            { type: "input_image", image_url: imageUrl, detail: "auto" },
          ],
        },
      ],
      stream: true,
      metadata: { mask_encoding: "one_bit", include_confidence: "true" },
    });
  } catch (error) {
    throw toMetaApiError(error, "segmentation request failed.");
  }
  let result;
  try {
    const parsed = parseImageStream(stream);
    for await (const {} of parsed) {
      // Drain; the result accumulates until the stream ends.
    }
    result = await parsed.finalResult;
  } catch (error) {
    throw toMetaApiError(error, "segmentation stream failed.");
  }
  if (result.outcome.status !== "completed") {
    throw new MetaApiError(500, "sam: stream ended incomplete.");
  }
  const boxes = [...recordsOfKind(result.records, "box")].sort(
    (a, b) => Number(a.objectId) - Number(b.objectId)
  );
  const masks = [...recordsOfKind(result.records, "mask")].sort((a, b) => {
    const x = identityNumber(a.identity) ?? Number.MAX_SAFE_INTEGER;
    const y = identityNumber(b.identity) ?? Number.MAX_SAFE_INTEGER;
    return x - y;
  });
  const maskByIndex = new Map<number, (typeof masks)[number]>();
  for (const mask of masks) {
    const n = identityNumber(mask.identity);
    if (n !== null && !maskByIndex.has(n)) maskByIndex.set(n, mask);
  }
  const photoArea = photoWidth * photoHeight;
  const regions: FoodRegion[] = [];
  for (const box of boxes) {
    const index = Number(box.objectId);
    if (!Number.isInteger(index)) continue;
    const mask = maskByIndex.get(index);
    if (!mask) continue;
    const boxWidth = Math.max(0, box.right - box.left);
    const boxHeight = Math.max(0, box.bottom - box.top);
    regions.push({
      index,
      box: { left: box.left, top: box.top, right: box.right, bottom: box.bottom },
      areaFraction: photoArea > 0 ? (boxWidth * boxHeight) / photoArea : 0,
      confidence: box.confidence ?? mask.confidence ?? null,
      raster: decodeMaskToRaster(mask.mask),
      rasterWidth: mask.mask.width,
      rasterHeight: mask.mask.height,
    });
  }
  return regions;
}
