
export const MEAL_SOURCE_KINDS = ['usda','off','saved','label','estimate','mext','entered','amount','unrecorded','partial'] as const;
export type MealSourceKind = typeof MEAL_SOURCE_KINDS[number];
type SourceItem = {name:string;source_ref?:string|null;micronutrients?:unknown};
export type MealSource = {kind:MealSourceKind;foods:string[]};

// Provenance is recorded data. Food names are labels, never evidence of a source.
export function mealSources(items:readonly SourceItem[]):MealSource[] {
 const groups = new Map<MealSourceKind, Set<string>>();
 const add=(kind:MealSourceKind,name:string)=>{const foods=groups.get(kind)??new Set<string>();foods.add(name);groups.set(kind,foods);};
 for(const item of items){
  const ref=item.source_ref;
  let kind:MealSourceKind;
  if(ref==null)kind='unrecorded';
  else if(/^\d+$/.test(ref))kind='usda';
  else if(/^off:.+/.test(ref))kind='off';
  else if(/^barcode-own:.+/.test(ref))kind='saved';
  else if(/^barcode:.+/.test(ref))kind='unrecorded';
  else if(ref==='label'||/^label:.+/.test(ref))kind='label';
  else if(/^estimate:.+/.test(ref))kind='estimate';
  else if(/^mext:[0-9]{5}$/.test(ref))kind='mext';
  else if(ref==='user:drink-tile'||ref==='user:drink-volume')kind='amount';
  else if(/^user:drink-correction:.+/.test(ref))kind='entered';
  else if(/^user:photo-drink:.+/.test(ref)){add('entered',item.name);add('partial',item.name);continue;}
  else if(ref.startsWith('unavailable:'))continue;
  else throw Error('Unknown nutrition source reference.');
  add(kind,item.name);
 }
 return MEAL_SOURCE_KINDS.flatMap(kind=>groups.has(kind)?[{kind,foods:[...groups.get(kind)!]}]:[]);
}
