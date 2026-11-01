import { createAdminClient } from "@/lib/supabase/admin";
import { gtinCandidates, lookupBarcode } from "./barcode";
import { mergeProduct, type BarcodeCorrection } from "./barcode-product";

export async function resolveProduct(raw: string, userId: string) {
  const gtin = gtinCandidates(raw)[0]?.padStart(14,"0");
  if (!gtin) return null;
  const admin = createAdminClient();
  const [personal, shared] = await Promise.all([
    admin.from("barcode_corrections").select("name,pack_amount,pack_unit,serving_amount,serving_unit,per_100,source").eq("gtin",gtin).eq("user_id",userId).maybeSingle(),
    admin.rpc("barcode_shared_name",{p_gtin:gtin}),
  ]);
  if (personal.error || shared.error) throw new Error("Product corrections could not be read.");
  const own = personal.data as BarcodeCorrection | null;
  // A complete label correction is usable even if FDC has no record or is offline.
  let base = null;
  try { base = await lookupBarcode(gtin); } catch(error) { if (!(own?.source === "label" && own.per_100)) throw error; }
  return mergeProduct(gtin,base,own,shared.data as string|null);
}
