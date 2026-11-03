import type {CapturedLocation} from '@/lib/location/capture';
export interface TileDrinkRequest { tile:number; ml:number; eaten_at:string; time_zone:string }
export interface PhotoDrinksRequest {
 upload_id:string; caption:string; eaten_at:string; location:CapturedLocation|null; save_as_meal:boolean;
 readings:{reading_id:string;selections:{index:number;ml:number}[]}[];
}
