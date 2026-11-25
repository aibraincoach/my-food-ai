import {foodRequestKey} from "@/lib/posts/food-operation";
import { capUser } from "@/lib/limits/user-cap";
import {captureZone} from "@/lib/posts/capture-zone";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchFoods } from "@/lib/fdc/client";
import { scaleNutrition } from "@/lib/fdc/nutrients";
import { servingPortion } from "@/lib/fdc/serving";
import { validGtin, amountInBasis, barcodeNutrition } from "@/lib/fdc/barcode";
import { validEatenAt } from "@/lib/posts/eaten-at";
import { resolveProduct } from "@/lib/fdc/barcode-resolver";
import { labelNutrition, parseLabelReading } from "@/lib/meta/label";
import { canonicalGtin } from "@/lib/posts/barcode-correction";
import { markReady } from "@/lib/pipeline/persist";
import { ApiError } from "@/lib/worker/errors";

// Logs a food picked from an FDC search as a ready post: no model call and no queue. The food is re-resolved on the
// server from the same search the client ran, so a client can never supply nutrition values of its own.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message_code: "route_ac6a88b19530" }, { status: 401 });
  const body = await request.json().catch(() => null) as { time_zone?:unknown; owner_id?:unknown; operation_id?:unknown; fdc_id?: unknown; query?: unknown; eaten_at?: unknown; gtin?: unknown; amount?: unknown; unit?: unknown; photo?: unknown; nutrition?: unknown; label_reading_id?: unknown; servings?: unknown; name?: unknown } | null;
  if (body && Object.hasOwn(body, "nutrition")) return NextResponse.json({ message_code: "route_b7ca1f666882" }, { status: 400 });
  if(body?.owner_id!==undefined&&body.owner_id!==user.id)return NextResponse.json({message_code: "route_bb967e31cbfd"},{status:404});
  const operationId=body?.operation_id;
  if(typeof operationId!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(operationId))return NextResponse.json({message_code: "route_836c626dd8b0"},{status:400});
  const timeZone = captureZone(body?.time_zone);
  if (!timeZone) return NextResponse.json({message_code: "captureZoneRequired"}, {status: 400});
  const capped = await capUser(user.id, "post"); if (capped) return capped;
  const requestKey=body?foodRequestKey({...body,time_zone:timeZone} as Record<string,unknown>):'';
  const publish=(admin:ReturnType<typeof createAdminClient>,args:Record<string,unknown>)=>
    admin.rpc('publish_food_operation',{...args,p_operation_id:operationId,p_request_key:requestKey,p_render_zone:timeZone});
  const finish=async(id:string,admin:ReturnType<typeof createAdminClient>)=>{try{await markReady(id,admin,undefined,{notify:false});}catch{console.error('Food card repair remains queued.');}};
  const receiptAdmin=createAdminClient();

  const {data:receipt,error}=await receiptAdmin.from('food_post_operations').select('user_id,request_key,post_id,cancelled').eq('operation_id',operationId).maybeSingle();
  if(error)return NextResponse.json({message_code: "route_7e7874d9008c"},{status:503});
  if(receipt){
    if(receipt.user_id!==user.id)return NextResponse.json({message_code: "route_47befe454974"},{status:404});
    if(receipt.cancelled)return NextResponse.json({message_code: "route_7302ac89b495"},{status:410});
    if(receipt.request_key!==requestKey)return NextResponse.json({message_code: "route_1502498aacbf"},{status:409});
    const {data:post,error:postError}=receipt.post_id?await receiptAdmin.from('posts').select('id').eq('id',receipt.post_id).eq('user_id',user.id).is('deleted_at',null).maybeSingle():{data:null,error:null};
    if(postError)return NextResponse.json({message_code: "route_b4e630f7aeff"},{status:503});
    if(!post)return NextResponse.json({message_code: "route_4683d1a2d3e1"},{status:410});
    // Selection facts are not needed for an existing receipt. The same RPC
    // rechecks its key/owner and repairs a C1 null zone under its transaction.
    const replay=await publish(receiptAdmin,{p_user_id:user.id,p_eaten_at:null,p_name:null,p_grams:null,p_nutrition:null});
    if(replay.error)return NextResponse.json({message_code:replay.error.code==='PT400'?'captureZoneRequired':'unknownFailure'},{status:replay.error.code?.startsWith('PT')?Number(replay.error.code.slice(2)):503});
    await finish(replay.data as string,receiptAdmin);return NextResponse.json({post_id:post.id},{status:201});
  }
  if(body?.label_reading_id !== undefined){
    if(typeof body.label_reading_id!=="string" || typeof body.servings!=="number" || !Number.isFinite(body.servings) || body.servings<0.25 || body.servings>50 || (body.name!==undefined && (typeof body.name!=="string" || body.name.trim().length>80)))return NextResponse.json({message_code: "route_7015e9b9acc8"},{status:400});
    const {data:stored,error:readError}=await supabase.from("label_readings").select("reading,photo_path").eq("id",body.label_reading_id).eq("user_id",user.id).maybeSingle();
    if(readError||!stored)return NextResponse.json({message_code: "route_3dbac83a74f4"},{status:404});
    const photo=body.photo as {path?:unknown;width?:unknown;height?:unknown}|undefined;
    if(!photo || photo.path!==stored.photo_path)return NextResponse.json({message_code: "route_58e8c760062c"},{status:400});
    const eatenAt=body.eaten_at===undefined?new Date().toISOString():validEatenAt(body.eaten_at as string);
    const gtin=typeof body.gtin==="string"?canonicalGtin(body.gtin):null;
    if(!eatenAt || (body.gtin!==undefined&&!gtin))return NextResponse.json({message_code: "route_d8890d6f2376"},{status:400});
    try{
      const reading=parseLabelReading(stored.reading);const nutrition=labelNutrition(reading,body.servings);
      const name=typeof body.name==="string"&&body.name.trim()?body.name.trim():"Packaged food";
      const admin=createAdminClient();
      const grams=reading.serving?reading.serving.amount*body.servings:body.servings;
      const per100=reading.serving?labelNutrition(reading,100/reading.serving.amount):null;
      const correction=gtin&&reading.serving&&per100?{gtin,name,serving_amount:reading.serving.amount,serving_unit:reading.serving.unit,per_100:Object.fromEntries(["calories","protein_g","carbs_g","fat_g","fibre_g","sugar_g","sodium_mg"].map(key=>[key,per100[key as keyof typeof per100]]))}:null;
      const {data,error}=await publish(admin,{p_user_id:user.id,p_eaten_at:eatenAt,p_name:name,p_grams:grams,p_nutrition:{...nutrition,source_ref:`label:${body.label_reading_id}`,...(gtin?{gtin}:{})},p_photo:photo,...(correction?{p_barcode_correction:correction}:{})});
      if(error)return NextResponse.json({message_code: "route_c119c11ebaae"},{status:error.code?.startsWith("PT")?Number(error.code.slice(2)):error.code?.startsWith("22")?400:500});
      await finish(data as string,admin);
      return NextResponse.json({post_id:data},{status:201});
    }catch{return NextResponse.json({message_code: "route_bb3ca709a35b"},{status:400});}
  }
  if (body?.gtin !== undefined) {
    if (typeof body.gtin !== "string" || !validGtin(body.gtin) || typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount <= 0 || typeof body.unit !== "string")
      return NextResponse.json({ message_code: "route_28585ec931c3" }, { status: 400 });
    const eatenAt = body.eaten_at === undefined ? new Date().toISOString() : validEatenAt(body.eaten_at as string);
    if (!eatenAt) return NextResponse.json({ message_code: "route_22819daf8128" }, { status: 400 });
    let photo: { path: string; width: number; height: number } | null = null;
    if (body.photo !== undefined) {
      const input = body.photo as { path?: unknown; width?: unknown; height?: unknown } | null;
      if (!input || typeof input.path !== "string" || !new RegExp(`^${user.id}/[0-9a-f-]{36}/0[.]jpg$`).test(input.path)
        || !Number.isSafeInteger(input.width) || !Number.isSafeInteger(input.height)
        || (input.width as number) < 1 || (input.width as number) > 4096 || (input.height as number) < 1 || (input.height as number) > 4096)
        return NextResponse.json({ message_code: "route_2b5c661add89" }, { status: 400 });
      photo = { path: input.path, width: input.width as number, height: input.height as number };
    }
    try {
      const product = await resolveProduct(body.gtin,user.id);
      if (!product) return NextResponse.json({ message_code: "route_eb53cdb7f215" }, { status: 404 });
      const amount = amountInBasis(body.amount, body.unit, product.basisUnit);
      if (amount === null || amount > 100000) return NextResponse.json({ message_code: "route_8a9239da8a05" }, { status: 400 });
      const args: Record<string, unknown> = { p_user_id: user.id, p_eaten_at: eatenAt, p_name: product.name.slice(0, 160), p_grams: amount, p_nutrition: {...barcodeNutrition(product, amount),gtin:product.gtin} };
      if (photo) args.p_photo = photo;
      const { data, error } = await publish(createAdminClient(), args);
      if (error) return NextResponse.json({  message_code: error.code?.startsWith("22") ? "route_55f1bddd8582" : "error_0795a0b4a0a6" }, { status: error.code?.startsWith("PT") ? Number(error.code.slice(2)) : error.code?.startsWith("22") ? 400 : 500 });
      await finish(data as string,createAdminClient());
      return NextResponse.json({ post_id: data as string }, { status: 201 });
    } catch (error) {
      return NextResponse.json({ message_code: "route_fc3f44ef874c" }, { status: error instanceof ApiError && error.status === 429 ? 429 : 502 });
    }
  }
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  if (!Number.isSafeInteger(body?.fdc_id) || (body!.fdc_id as number) <= 0 || query.length < 2 || query.length > 160)
    return NextResponse.json({ message_code: "route_f24bd2262b30" }, { status: 400 });
  const eatenAt = body!.eaten_at === undefined ? new Date().toISOString() : validEatenAt(body!.eaten_at as string);
  if (!eatenAt) return NextResponse.json({ message_code: "route_22819daf8128" }, { status: 400 });
  try {
    const admin = createAdminClient();
    const food = (await searchFoods(admin, query)).find((row) => row.fdcId === body!.fdc_id);
    if (!food) return NextResponse.json({ message_code: "route_f97ebd5857bc" }, { status: 409 });
    const portion = servingPortion(food);
    const n = scaleNutrition(food, portion.amount, null, portion.unit);
    const { data, error } = await publish(admin, { p_user_id: user.id, p_eaten_at: eatenAt, p_name: food.description.slice(0, 160), p_grams: portion.amount,
      p_nutrition: { calories: n.calories, protein_g: n.proteinG, carbs_g: n.carbsG, fat_g: n.fatG, fibre_g: n.fibreG, sugar_g: n.sugarG, sodium_mg: n.sodiumMg, micronutrients: n.micronutrients, source_ref: n.sourceRef, portion_unit: portion.unit } });
    if (error?.code === "42501") return NextResponse.json({ message_code: "route_ac6a88b19530" }, { status: 401 });
    if (error) return NextResponse.json({  message_code: error.code?.startsWith("22") ? "route_90f611283783" : "error_0795a0b4a0a6" }, { status: error.code?.startsWith("PT") ? Number(error.code.slice(2)) : error.code?.startsWith("22") ? 400 : 500 });
    await finish(data as string,admin);
    return NextResponse.json({ post_id: data as string }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message_code: "route_ea88574adf4a" }, { status: error instanceof ApiError && error.status === 429 ? 429 : 502 });
  }
}


// Cancel shares the publication lock: an already committed lost response is
// hidden, and a request arriving later cannot publish a discarded selection.
export async function DELETE(request:Request){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({message_code: "route_ac6a88b19530"},{status:401});
 const capped=await capUser(user.id,"post");if(capped)return capped;
 const body=await request.json().catch(()=>null) as {operation_id?:unknown;owner_id?:unknown}|null;
 if(body?.owner_id!==user.id)return NextResponse.json({message_code: "route_bb967e31cbfd"},{status:404});
 if(typeof body.operation_id!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.operation_id))return NextResponse.json({message_code: "route_836c626dd8b0"},{status:400});
 const {data,error}=await createAdminClient().rpc("cancel_food_operation",{p_operation_id:body.operation_id,p_user_id:user.id});
 if(error)return NextResponse.json({message_code: "route_3dafcce53b7d"},{status:error.code==='42501'?404:error.code?.startsWith('PT')?Number(error.code.slice(2)):503});
 return NextResponse.json({post_id:data},{status:200});
}
