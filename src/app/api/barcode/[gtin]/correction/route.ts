import {CaptureFailureError} from '@/lib/posts/capture-failure';
import { capUser } from "@/lib/limits/user-cap";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canonicalGtin, parseBarcodeCorrection } from "@/lib/posts/barcode-correction";
export async function PUT(request:Request,context:{params:Promise<{gtin:string}>}){
 const client=await createClient();const {data:{user}}=await client.auth.getUser();
 if(!user)return NextResponse.json({message_code: "route_ac6a88b19530"},{status:401});
 const capped = await capUser(user.id, "correct"); if (capped) return capped;
 const gtin=canonicalGtin((await context.params).gtin);if(!gtin)return NextResponse.json({message_code: "route_a0bfaf1ff24f"},{status:400});
 try{
  const correction=parseBarcodeCorrection(await request.json());
  const {error}=await client.from("barcode_corrections").upsert({...correction,gtin,user_id:user.id,updated_at:new Date().toISOString()},{onConflict:"gtin,user_id"});
  if(error)return NextResponse.json({message_code: "route_f050ad5fac73"},{status:500});
  return NextResponse.json({saved:true});
 }catch(error){return NextResponse.json({message_code: error instanceof CaptureFailureError ? error.failure.code : "route_6adae2229057"},{status:400});}
}
