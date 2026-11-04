import { createResponseRetrying404 } from "./retry404";
import { MetaApiError } from "./client";
import { labelPrompt } from "@/lib/prompts/spark/label";
import schema from "@/lib/prompts/spark/label.schema.json";
import type { BarcodeNutrition } from "@/lib/fdc/barcode-product";
import sharp from "sharp";
export interface LabelReading {
 is_label:boolean; serving:{amount:number;unit:"g"|"ml"}|null;
 per_serving:({kcal:number|null}&Omit<BarcodeNutrition,"calories">)|null;
 product_name:string|null;box:{x:number;y:number;w:number;h:number}|null;
}
export function parseLabelReading(raw:unknown):LabelReading{
 if(!raw||typeof raw!=="object")throw Error("The label could not be read.");
 const b=raw as LabelReading;
 if(typeof b.is_label!=="boolean")throw Error("The label could not be read.");
 if(b.serving && (!Number.isFinite(b.serving.amount)||b.serving.amount<=0||b.serving.amount>100000||!["g","ml"].includes(b.serving.unit)))throw Error("The serving could not be read.");
 if(b.per_serving)for(const key of ["kcal","protein_g","carbs_g","fat_g","fibre_g","sugar_g","sodium_mg"] as const){const value=b.per_serving[key];if(value!==null&&(typeof value!=="number"||!Number.isFinite(value)||value<0||value>100000))throw Error("The nutrition could not be read.");}
 if(b.product_name!==null&&typeof b.product_name!=="string")throw Error("The name could not be read.");
 if(b.box && (![b.box.x,b.box.y,b.box.w,b.box.h].every(v=>Number.isFinite(v)&&v>=0&&v<=1)||b.box.x+b.box.w>1.001||b.box.y+b.box.h>1.001))b.box=null;
 return b;
}
function macroCompleteness(reading: LabelReading): number {
 const panel = reading.per_serving;
 if (!panel) return 0;
 return [panel.protein_g, panel.carbs_g, panel.fat_g].filter(value => value !== null).length;
}
async function cropLabelBox(image: Uint8Array, box: NonNullable<LabelReading["box"]>, mime: string): Promise<Uint8Array> {
 const meta = await sharp(image).metadata();
 const width = meta.width ?? 0;
 const height = meta.height ?? 0;
 if (!width || !height) return image;
 const padX = box.w * 0.1;
 const padY = box.h * 0.1;
 const left = Math.max(0, Math.floor((box.x - padX) * width));
 const top = Math.max(0, Math.floor((box.y - padY) * height));
 const right = Math.min(width, Math.ceil((box.x + box.w + padX) * width));
 const bottom = Math.min(height, Math.ceil((box.y + box.h + padY) * height));
 const output = await sharp(image).extract({ left, top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) }).toBuffer();
 return new Uint8Array(output);
}
async function readLabelOnce(image: Uint8Array, mime: string, effort: "low" | "medium"): Promise<LabelReading> {
 const out=await createResponseRetrying404({model:"muse-spark-1.3",reasoning:{effort},instructions:labelPrompt,input:[{type:"message",role:"user",content:[{type:"input_image",image_url:`data:${mime};base64,${Buffer.from(image).toString("base64")}`}]}],text:{format:{type:"json_schema",name:"label",strict:true,schema}},max_output_tokens:2048});
 if(out.refusal||out.status!=="completed"||!out.outputText)throw new MetaApiError(500,"The label could not be read.");
 return parseLabelReading(JSON.parse(out.outputText));
}
export async function readNutritionLabel(image:Uint8Array,mime="image/jpeg"):Promise<LabelReading>{
 let reading=await readLabelOnce(image,mime,"low");
 const panel=reading.per_serving;
 const needsRetry=panel&&[panel.protein_g,panel.carbs_g,panel.fat_g].some(value=>value===null)&&reading.box;
 if(needsRetry&&reading.box){
  try{
   const cropped=await cropLabelBox(image,reading.box,mime);
   const retry=await readLabelOnce(cropped,mime,"medium");
   if(macroCompleteness(retry)>macroCompleteness(reading))reading=retry;
  }catch{/* Keep the first reading when the crop retry fails. */}
 }
 return reading;
}
export function labelNutrition(reading:LabelReading,servings:number){
 if(!reading.is_label||!reading.per_serving)throw Error("A readable nutrition panel is required.");
 const {kcal,...values}=reading.per_serving;
 const scaled={calories:kcal===null?null:kcal*servings,...Object.fromEntries(Object.entries(values).map(([key,v])=>[key,v===null?null:v*servings])),micronutrients:[],source_ref:"label"} as Record<string, unknown>;
 if(reading.serving)scaled.portion_unit=reading.serving.unit;
 else scaled.portion_unit="serving";
 return scaled as {calories:number|null;protein_g:number|null;carbs_g:number|null;fat_g:number|null;fibre_g:number|null;sugar_g:number|null;sodium_mg:number|null;micronutrients:[];source_ref:string;portion_unit:string};
}
