import {roundServings,servingsLabel} from '@/lib/posts/servings';
// Preserve the existing English unit choice: glyph fractions below one use singular,
// while decimal quantities and amounts above one use plural. count selects grammar only.
// Zero is outside valid input (minimum 0.1), and uses the message's zero plural.
export function servingsMessageValues(value:number):{amount:string;count:number} {
 const amount=servingsLabel(value);
 return {amount,count:roundServings(value)===0?0:roundServings(value)>1||amount.includes('.')?2:1};
}
