/** Only identity/portion input is durable. Nutrition remains server-resolved. */
export type FoodRequest = {fdc_id:number;query:string;eaten_at:string} | {gtin:string;amount:number;unit:string;eaten_at:string} | {label_reading_id:string;servings:number;name:string;gtin?:string;eaten_at:string;photo:{path:string;width:number;height:number}};
