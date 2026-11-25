import {CaptureFailureError} from '@/lib/posts/capture-failure';
import { capUser } from "@/lib/limits/user-cap";
import { after, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveProduct } from "@/lib/fdc/barcode-resolver";
import { barcodeNutrition } from "@/lib/fdc/barcode-product";
import { canonicalGtin } from "@/lib/posts/barcode-correction";
import { editPostItem, isUuid, parseItemEdit } from "@/lib/posts/items";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message_code: "route_ac6a88b19530" }, { status: 401 });
 const capped = await capUser(user.id, "correct"); if (capped) return capped;
  const { id } = await context.params;
  if (!isUuid(id)) return NextResponse.json({ message_code: "route_9c5ac1fe3dd7" }, { status: 404 });
  // Authorize with the user's RLS-scoped client before constructing an admin
  // write. The RPC repeats ownership under its transaction's post lock.
  const { data: post, error: readError } = await supabase.from("posts").select("id").eq("id", id).maybeSingle();
  if (readError) return NextResponse.json({ message_code: "route_2ead7e1dfe1f" }, { status: 500 });
  if (!post) return NextResponse.json({ message_code: "route_9c5ac1fe3dd7" }, { status: 404 });
  const body=await request.json().catch(()=>null);
  if(body?.action==="correct_product"){
    const gtin=typeof body.gtin==="string"?canonicalGtin(body.gtin):null;
    if(!gtin)return NextResponse.json({message_code: "route_a0bfaf1ff24f"},{status:400});
    const admin=createAdminClient();
    const {data:item}=await admin.from("post_items").select("id,portion_grams,portion_text").eq("post_id",id).eq("gtin",gtin).is("superseded_at",null).maybeSingle();
    if(!item)return NextResponse.json({message_code: "route_8c7731532010"},{status:404});
    const product=await resolveProduct(gtin,user.id,{withoutLookup:true});
    if(!product)return NextResponse.json({message_code: "route_8c7731532010"},{status:404});
    const match=/^([0-9]+(?:[.][0-9]+)?) (g|ml)$/.exec(item.portion_text??"");
    const amount=item.portion_grams!==null?Number(item.portion_grams):match?Number(match[1]):null;
    const unit=item.portion_grams!==null?"g":match?.[2];
    if(!amount||unit!==product.basisUnit)return NextResponse.json({message_code: "route_887223813ce1"},{status:422});
    const {data,error}=await admin.rpc("correct_barcode_item",{p_post:id,p_user:user.id,p_gtin:gtin,p_name:product.name,p_amount:amount,p_unit:unit,p_nutrition:barcodeNutrition(product,amount),p_message:{code:"productCorrected",values:{name:product.name}}});
    if(error)return NextResponse.json({message_code: "route_966cabcb23ac"},{status:error.code==="40001"?409:500});
    after(async()=>{try{await fetch(new URL("/api/jobs/tick",request.url),{cache:"no-store",signal:AbortSignal.timeout(10000)});}catch{}});
    return NextResponse.json({item_id:data});
  }
  let edit;
  try { edit = parseItemEdit(body); }
  catch (error) { return NextResponse.json({ message_code: error instanceof CaptureFailureError ? error.failure.code : "route_0a3373b55c5d" }, { status: 400 }); }
  const result = await editPostItem(createAdminClient(), id, user.id, edit);
  if (result.error) {
    const code = result.error.code;
    if (code === "UNIT") return NextResponse.json({ message_code: "route_f7c2b232a4b4" }, { status: 422 });
    const status = code === "42501" ? 404 : (code === "40001" || code === "55000") ? 409 : code?.startsWith("22") ? 400 : 500;
    const message_code = code === "55000" ? "route_3fc5cb4fef22" : status === 409 ? "route_397499279570" : status === 400 ? "route_18a223594571" : status === 404 ? "route_9c5ac1fe3dd7" : "route_6d3417bf1ab7";
    return NextResponse.json({ message_code }, { status });
  }
  after(async () => {
    // The committed job remains queued if the best-effort tick fails.
    try { await fetch(new URL("/api/jobs/tick", request.url), { cache: "no-store", signal: AbortSignal.timeout(10_000) }); } catch { /* picked up by the next tick */ }
  });
  return NextResponse.json({ item_id: result.itemId });
}
