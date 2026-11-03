import {createHash} from 'node:crypto';
// Bind an idempotence receipt to the immutable selection. Upload renewal can
// change its owned storage path, but cannot change the selected food/portion.
export function foodRequestKey(body:Record<string,unknown>): string {
 const fields=['fdc_id','query','eaten_at','gtin','amount','unit','label_reading_id','servings','name'];
 return createHash('sha256').update(JSON.stringify({...Object.fromEntries(fields.map(key=>[key,body[key]??null])),photo:body.photo!==undefined})).digest('hex');
}
