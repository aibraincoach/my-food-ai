import {DRINK_TILES,TILE_SIZES} from './intake';
import {TEA_REFERENCES} from './tea-references';

const teaLabels=new Set([
 ...Object.values(TEA_REFERENCES).flatMap(tea=>TILE_SIZES[3].map(size=>`${tea.name}, ${size.word}`)),
 ...TILE_SIZES[3].map(size=>`Tea, ${size.word}`),
]);
export function tileUsageIndex(row:{label:unknown;source:unknown}):number{
 // Preference only. Copied sheet rows retain the tile label; an owner can also
 // craft one via saved_meals JSON. This never selects a nutrition reference.
 if(row.source==='sheet'&&typeof row.label==='string'&&teaLabels.has(row.label))return 3;
 // Preserve the other five tiles' existing preference logic.
 return DRINK_TILES.findIndex((tile,index)=>index!==3&&TILE_SIZES[index].some(size=>row.label===`${tile.name}, ${size.word}`));
}
