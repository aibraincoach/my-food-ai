import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canonicalGtin, parseBarcodeCorrection } from "@/lib/posts/barcode-correction";
export async function PUT(request:Request,context:{params:Promise<{gtin:string}>}){
 const client=await createClient();const {data:{user}}=await client.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in required."},{status:401});
 const gtin=canonicalGtin((await context.params).gtin);if(!gtin)return NextResponse.json({error:"Invalid barcode."},{status:400});
 try{
  const correction=parseBarcodeCorrection(await request.json());
  const {error}=await client.from("barcode_corrections").upsert({...correction,gtin,user_id:user.id,updated_at:new Date().toISOString()},{onConflict:"gtin,user_id"});
  if(error)return NextResponse.json({error:"The correction could not be saved."},{status:500});
  return NextResponse.json({saved:true});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invalid product."},{status:400});}
}
