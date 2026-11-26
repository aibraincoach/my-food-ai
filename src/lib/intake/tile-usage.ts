import {DRINK_TILES,TILE_SIZES} from './intake';
import {TEA_REFERENCES} from './tea-references';

function embedded(value:unknown):Record<string,unknown>|null{
 if(Array.isArray(value))return value.length===1?embedded(value[0]):null;
 return value!==null&&typeof value==='object'?value as Record<string,unknown>:null;
}
export function tileUsageIndex(row:{label:unknown;posts?:unknown}):number{
 const post=embedded(row.posts),item=embedded(post?.post_items),nutrition=embedded(item?.item_nutrition);
 const ref=nutrition?.source_ref;
 // A renamed or copied tea is still that tea. Text is not supplier identity.
 if(Object.values(TEA_REFERENCES).some(tea=>ref===String(tea.fdcId)))return 3;
 // The other five tiles retain their existing preference logic. A non-tea
 // nutrition reference must never enter the tea bucket via its display label.
 return DRINK_TILES.findIndex((tile,index)=>index!==3&&TILE_SIZES[index].some(size=>row.label===`${tile.name}, ${size.word}`));
}
