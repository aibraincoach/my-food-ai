/** Only identity/portion input is durable. Nutrition remains server-resolved. */
export type FoodRequest = {fdc_id:number;query:string;eaten_at:string} | {gtin:string;amount:number;unit:string;eaten_at:string};
