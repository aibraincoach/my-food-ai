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
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await context.params;
  if (!isUuid(id)) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  // Authorize with the user's RLS-scoped client before constructing an admin
  // write. The RPC repeats ownership under its transaction's post lock.
  const { data: post, error: readError } = await supabase.from("posts").select("id").eq("id", id).maybeSingle();
  if (readError) return NextResponse.json({ error: "Meal could not be loaded." }, { status: 500 });
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  const body=await request.json().catch(()=>null);
  if(body?.action==="correct_product"){
    const gtin=typeof body.gtin==="string"?canonicalGtin(body.gtin):null;
    if(!gtin)return NextResponse.json({error:"Invalid barcode."},{status:400});
    const admin=createAdminClient();
    const {data:item}=await admin.from("post_items").select("id,portion_grams,portion_text").eq("post_id",id).eq("gtin",gtin).is("superseded_at",null).maybeSingle();
    if(!item)return NextResponse.json({error:"Product not found."},{status:404});
    const product=await resolveProduct(gtin,user.id,{withoutLookup:true});
    if(!product)return NextResponse.json({error:"Product not found."},{status:404});
    const match=/^([0-9]+(?:[.][0-9]+)?) (g|ml)$/.exec(item.portion_text??"");
    const amount=item.portion_grams!==null?Number(item.portion_grams):match?Number(match[1]):null;
    const unit=item.portion_grams!==null?"g":match?.[2];
    if(!amount||unit!==product.basisUnit)return NextResponse.json({error:"The corrected unit must match this post's portion."},{status:422});
    const {data,error}=await admin.rpc("correct_barcode_item",{p_post:id,p_user:user.id,p_gtin:gtin,p_name:product.name,p_amount:amount,p_unit:unit,p_nutrition:barcodeNutrition(product,amount)});
    if(error)return NextResponse.json({error:"The product could not be corrected."},{status:error.code==="40001"?409:500});
    after(async()=>{try{await fetch(new URL("/api/jobs/tick",request.url),{cache:"no-store",signal:AbortSignal.timeout(10000)});}catch{}});
    return NextResponse.json({item_id:data});
  }
  let edit;
  try { edit = parseItemEdit(body); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid edit." }, { status: 400 }); }
  const result = await editPostItem(createAdminClient(), id, user.id, edit);
  if (result.error) {
    const code = result.error.code;
    if (code === "UNIT") return NextResponse.json({ error: "No weight is known for that unit with this food. Enter grams or ounces." }, { status: 422 });
    const status = code === "42501" ? 404 : (code === "40001" || code === "55000") ? 409 : code?.startsWith("22") ? 400 : 500;
    const message = code === "55000" ? "Wait for the initial meal analysis before editing." : status === 409 ? "This item changed. Reload and try again." : status === 400 ? "Invalid item details." : status === 404 ? "Post not found." : "The item could not be saved.";
    return NextResponse.json({ error: message }, { status });
  }
  after(async () => {
    // The committed job remains queued if the best-effort tick fails.
    try { await fetch(new URL("/api/jobs/tick", request.url), { cache: "no-store", signal: AbortSignal.timeout(10_000) }); } catch { /* picked up by the next tick */ }
  });
  return NextResponse.json({ item_id: result.itemId });
}
