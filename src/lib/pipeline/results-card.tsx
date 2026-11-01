import { renderTimeZone, readStoredCardData } from "./render-zone";
import { ioError } from "@/lib/worker/errors";
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ResultsCard } from "@/components/ResultsCard";
import { tokens } from "@/lib/theme/tokens";
import { isOwnedGeneratedCardPath } from "@/lib/media/paths";
import { normalizeStoredNutrition, type CurrentItem } from "@/lib/nutrition/totals";

import { type DrinkCardData } from "@/lib/intake/hydration";

type Snapshot = {
  user_id: string;
  eaten_at: string;
  fingerprint: string;
  items: { item: CurrentItem; nutrition: (CurrentItem & { post_item_id: string }) | null }[];
};
let fontData: Promise<[Buffer, Buffer, Buffer, Buffer]> | undefined;
function fonts() {
  fontData ??= Promise.all([
    readFile(join(process.cwd(), "src/assets/fonts/Manrope-300.ttf")),
    readFile(join(process.cwd(), "src/assets/fonts/Manrope-400.ttf")),
    readFile(join(process.cwd(), "src/assets/fonts/Manrope-500.ttf")),
    readFile(join(process.cwd(), "src/assets/fonts/Manrope-600.ttf")),
  ]);
  return fontData;
}

export async function renderResultsCard(admin: SupabaseClient, postId: string, jobId?: string, variant?: DrinkCardData, zone?: string): Promise<boolean> {
  if(zone!==undefined)await renderTimeZone(admin,postId,zone);
  const { data, error, status } = await admin.rpc("results_card_snapshot", { p_post_id: postId });
  if (error) throw ioError(`Card snapshot failed: ${error.message}`, error, status);
  const snapshot = data as Snapshot | null;
  if (!snapshot || snapshot.items.some(({ nutrition }) => !nutrition)) return false;
  const nutrition = snapshot.items.map(({ item, nutrition }) => ({...normalizeStoredNutrition(nutrition!, item.portion_grams),name:item.name}));
  const source = { id: postId, eaten_at: snapshot.eaten_at,
    items: snapshot.items.map(({item}, index) => ({ ...item, ...nutrition[index] })) };
  // Model-free drinks have just read this timeline after their atomic commit.
  // Reuse that record while still rendering nutrition from this fingerprinted snapshot.
  const cardData = await readStoredCardData(admin,snapshot.user_id,source,undefined,variant);
  const [light, regular, medium, semibold] = await fonts();
  const size = tokens.card.outputSize;
  const response = new ImageResponse(<ResultsCard data={cardData}
    size={size} fontFamily="Manrope"
  />, { width: size, height: size, fonts: [
    { name: "Manrope", data: light, weight: 300, style: "normal" },
    { name: "Manrope", data: regular, weight: 400, style: "normal" },
    { name: "Manrope", data: medium, weight: 500, style: "normal" },
    { name: "Manrope", data: semibold, weight: 600, style: "normal" },
  ] });
  // A fixed overwritten card.png can show stale bytes after a correction or
  // racing render. Each generation is immutable; only its DB pointer changes.
  const path = `${snapshot.user_id}/${postId}/cards/${randomUUID()}/card.png`;
  const upload = await admin.storage.from("media").upload(path, await response.arrayBuffer(), { contentType: "image/png", upsert: false });
  if (upload.error) throw ioError(`Card upload failed: ${upload.error.message}`, upload.error);
  const published = await admin.rpc("publish_results_card", { p_post_id: postId, p_fingerprint: snapshot.fingerprint, p_storage_path: path, p_size: size, p_job_id: jobId ?? null });
  if (published.error) {
    // An ambiguous network response may have committed publication. Keep its
    // object rather than break a successfully committed media pointer.
    throw ioError(`Card publication failed: ${published.error.message}`, published.error, published.status);
  }
  if (!published.data?.published) {
    await admin.storage.from("media").remove([path]);
    return false;
  }
  // Treat stored metadata as untrusted: historical client-writable rows must
  // never turn service-role cleanup into deletion of another meal's object.
  if (published.data.old_path !== path && isOwnedGeneratedCardPath(published.data.old_path, snapshot.user_id, postId)) {
    await admin.storage.from("media").remove([published.data.old_path]);
  }
  return true;
}
