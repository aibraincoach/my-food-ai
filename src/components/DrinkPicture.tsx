import type {DrinkGlyph} from '@/lib/intake/drink-glyph';
import {tokens} from '@/lib/theme/tokens';
const paths:Record<DrinkGlyph,string[]>={
 coffee:['M4 8h13v8a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z','M17 9h2a3 3 0 0 1 0 6h-2','M3 23h18','M7 2v3M11 1v4M15 2v3'],
 water:['M5 3h14l-2 20H7Z','M6 13c2-2 4 2 6 0s4 2 6 0'],
 cocktail:['M3 3h18L12 14Z','M12 14v9M7 23h10','M6 7h12'],
 wine:['M7 2h10l1 7a6 6 0 0 1-12 0Z','M12 15v8M7 23h10','M6 8h12'],
 beer:['M5 5h13l-1 18H6Z','M18 8h3v10h-4','M8 9v10M12 9v10M15 9v10','M5 5c-2-4 3-5 5-3 2-3 6-2 6 0 3-1 5 1 2 3'],
 tumbler:['M5 3h14l-2 20H7Z','M6 10h12']
};
export function DrinkPicture({glyph,size}:{glyph:DrinkGlyph;size:number}){
 return <svg width={size} height={size} viewBox="0 0 24 26" fill="none" stroke={tokens.colors.text} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-label={glyph}><title>{glyph}</title>{paths[glyph].map((d,index)=><path key={index} d={d}/>)}</svg>;
}
