import { gtinCandidates } from "@/lib/fdc/gtin";
import type { BarcodeCorrection, BarcodeNutrition } from "@/lib/fdc/barcode-product";
const nutrients = ["calories","protein_g","carbs_g","fat_g","fibre_g","sugar_g","sodium_mg"] as const;
export function parseBarcodeCorrection(input: unknown): BarcodeCorrection {
  if (!input || typeof input!=="object" || Array.isArray(input)) throw Error("Enter the product details.");
  const b=input as Record<string,unknown>; const result:BarcodeCorrection={source:"user"};
  const name=typeof b.name==="string"?b.name.trim().replace(/\s+/g," "):"";
  if(!name || name.length>80) throw Error("Enter a name up to 80 characters.");
  result.name=name;
  for(const field of ["pack","serving"] as const){
    const amount=b[`${field}_amount`],unit=b[`${field}_unit`];
    if(amount!=null && (typeof amount!=="number" || !Number.isFinite(amount)||amount<=0||amount>100000)) throw Error("Enter a valid pack and serving amount.");
    if(unit!=null && unit!=="g" && unit!=="ml") throw Error("Choose grams or millilitres.");
    if(amount!=null && unit==null) throw Error("Choose the amount's unit.");
    result[`${field}_amount`]=amount==null?null:amount as number;
    result[`${field}_unit`]=unit==null?null:unit as "g"|"ml";
  }
  if(b.per_100!=null){
    if(typeof b.per_100!=="object" || Array.isArray(b.per_100))throw Error("Enter valid nutrition values.");
    const n=b.per_100 as Record<string,unknown>; const out={} as BarcodeNutrition;
    for(const key of nutrients){const v=n[key];if(v!=null&&(typeof v!=="number"||!Number.isFinite(v)||v<0||v>100000))throw Error("Nutrition must be a non-negative number.");out[key]=v==null?null:v as number;}
    result.per_100=out;
  }
  return result;
}
export const canonicalGtin=(raw:string)=>gtinCandidates(raw)[0]?.padStart(14,"0")??null;
