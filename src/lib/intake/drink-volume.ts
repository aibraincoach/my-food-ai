/** Read an explicit ml token only; grams and package names never imply volume. */
export function photoDrinkVolume(portionText:string|null|undefined):number|null {
 const volume=portionText?.match(/(?:^|[\s(])(\d+(?:\.\d+)?)\s*ml\b/i);
 if(!volume)return null;
 const ml=Math.round(Number(volume[1]));
 return Number.isFinite(ml)&&ml>=1&&ml<=5000?ml:null;
}
