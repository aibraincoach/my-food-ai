// Reference data only. A food number is an opaque MEXT identity, never a USDA id.
export type MextMarker = 'Tr' | '-' | null;
export type MextMeasurement = {
  value: number | null;
  marker: MextMarker;
  unitName: string;
  estimated: boolean;
  source_tag: string | null;
  reason?: 'no_equivalent';
};
export type MextIdentityStatus = 'joined' | 'no_english' | 'group_mismatch' | 'identity_changed' | 'english_name_ambiguous';
export type MextRecord = {
  foodNumber: string;
  nameJa: string;
  nameEn: string | null;
  foodGroup: string;
  identityStatus: MextIdentityStatus;
  nutrients: Record<string,MextMeasurement>;
};

const statuses = new Set<MextIdentityStatus>(['joined','no_english','group_mismatch','identity_changed','english_name_ambiguous']);
const object = (value:unknown):Record<string,unknown>|null => value!==null && typeof value==='object' && !Array.isArray(value) ? value as Record<string,unknown> : null;
const invalid = ():never => { throw new Error('MEXT reference record is invalid.'); };

export function mextFoodNumber(sourceRef:unknown):string|null {
  return typeof sourceRef==='string' ? /^mext:([0-9]{5})$/.exec(sourceRef)?.[1]??null : null;
}

export function mextSourceRef(foodNumber:string):string {
  if(!/^[0-9]{5}$/.test(foodNumber))throw new Error('MEXT food number is invalid.');
  return `mext:${foodNumber}`;
}

export function parseMextRecord(raw:unknown):MextRecord {
  const row=object(raw);
  if(!row || typeof row.food_number!=='string' || !/^[0-9]{5}$/.test(row.food_number)
    || typeof row.name_ja!=='string' || !row.name_ja.trim()
    || (row.name_en!==null && typeof row.name_en!=='string')
    || typeof row.food_group!=='string' || !/^(0[1-9]|1[0-8])$/.test(row.food_group)
    || !statuses.has(row.identity_status as MextIdentityStatus))return invalid();
  if(row.identity_status==='joined' && (typeof row.name_en!=='string' || !/[A-Za-z]/.test(row.name_en)))return invalid();
  const values=object(row.nutrients);
  if(!values || !Object.keys(values).length)return invalid();
  const nutrients:Record<string,MextMeasurement>={};
  for(const [id,rawValue] of Object.entries(values)) {
    const entry=object(rawValue);
    if(!/^[1-9][0-9]*$/.test(id) || !entry || typeof entry.estimated!=='boolean'
      || typeof entry.unitName!=='string' || !['G','MG','UG','KCAL','IU'].includes(entry.unitName)
      || ![null,'Tr','-'].includes(entry.marker as MextMarker)
      || (entry.source_tag!==null && typeof entry.source_tag!=='string'))return invalid();
    const marker=entry.marker as MextMarker;
    if(marker===null ? typeof entry.value!=='number' || !Number.isFinite(entry.value) : entry.value!==null)return invalid();
    if(entry.source_tag===null && (entry.reason!=='no_equivalent' || marker!=='-'))return invalid();
    nutrients[id]={value:entry.value as number|null,marker,unitName:entry.unitName,
      estimated:entry.estimated,source_tag:entry.source_tag as string|null,
      ...(entry.reason==='no_equivalent'?{reason:'no_equivalent' as const}:{})};
  }
  return {foodNumber:row.food_number,nameJa:row.name_ja,nameEn:row.name_en as string|null,
    foodGroup:row.food_group,identityStatus:row.identity_status as MextIdentityStatus,nutrients};
}
