/** The consumed record is the original quantity minus the photographed quantity. */
export interface RemainderEstimate { index:number; remaining_grams:number; total_count:number|null; remaining_count:number|null; unit:string|null }
export function remainderRule(grams:number, estimate:RemainderEstimate) {
 if(!Number.isFinite(grams)||grams<0||!Number.isFinite(estimate.remaining_grams))throw new Error('Invalid photo quantities.');
 const notEaten=Math.min(grams,Math.max(0,Math.round(estimate.remaining_grams)));
 const consumed=Math.max(0,grams-notEaten);
 const total=estimate.total_count, count=estimate.remaining_count;
 const unit=estimate.unit?.trim();
 const counted=Number.isInteger(total)&&Number.isInteger(count)&&total!>0&&count!>=0&&count!<=total!&&!!unit&&unit.length<=32;
 return { consumedGrams:consumed, notEatenGrams:notEaten,
  countText:counted?`${total!-count!} of ${total} ${unit}`:null,
  notEatenCountText:counted?`${count} ${unit}`:null,
  consumedText:counted?`${total!-count!} of ${total} ${unit}`:`${Math.round(consumed)} g`,
  notEatenText:counted?`${count} ${unit}`:`${Math.round(notEaten)} g` };
}
