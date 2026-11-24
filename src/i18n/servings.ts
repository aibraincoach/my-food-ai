import {roundServings,servingsLabel} from '@/lib/posts/servings';
// Preserve the existing English unit choice: glyph fractions below one use singular,
// while decimal quantities and amounts above one use plural. count selects grammar only.
export function servingsMessageValues(value:number):{amount:string;count:number} {
 const amount=servingsLabel(value);
 return {amount,count:roundServings(value)>1||amount.includes('.')?2:1};
}
