import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const causes = ['food','record','weight','value','not_eaten'];
export const fieldBasis = {record:'record',grams:'g',kcal:'kcal_per_portion',not_eaten_g:'g',not_eaten_kcal:'kcal_per_portion'};
export const findingSchema = {
 type:'object', additionalProperties:false,
 properties:{
  item_id:{type:'string'}, cause:{type:'string',enum:causes},
  field:{type:'string',enum:Object.keys(fieldBasis)},
  action:{type:'string',enum:['none','recheck_record','set_weight','restore_snapshot']},
  expected_value:{anyOf:[{type:'number'},{type:'string'},{type:'null'}]},
  basis:{type:'string',enum:['record','g','kcal_per_portion','unknown']},
  loss_of_available_value:{type:'string',enum:['yes','no','unknown']},
  evidence_row_ids:{type:'array',items:{type:'string'}}
 },
 required:['item_id','cause','field','action','expected_value','basis','loss_of_available_value','evidence_row_ids']
};
export function validFinding(f) {
 return f && uuid.test(f.item_id??'') && causes.includes(f.cause) && Object.hasOwn(fieldBasis,f.field)
  && ['none','recheck_record','set_weight','restore_snapshot'].includes(f.action)
  && (f.expected_value===null || typeof f.expected_value==='string' || Number.isFinite(f.expected_value))
  && ['record','g','kcal_per_portion','unknown'].includes(f.basis)
  && ['yes','no','unknown'].includes(f.loss_of_available_value)
  && Array.isArray(f.evidence_row_ids) && f.evidence_row_ids.every(id=>typeof id==='string'&&id.length>0)
  && new Set(f.evidence_row_ids).size===f.evidence_row_ids.length;
}
const sha = text => createHash('sha256').update(text).digest('hex');
const itemValues = item => ({record:item.nutrition?.source_ref??null,grams:item.portion_grams??null,kcal:item.nutrition?.calories??null,not_eaten_g:item.not_eaten_grams??null,not_eaten_kcal:item.not_eaten_calories??null});

// An optional EXISTING 08-snapshot.sql ledger supplies prior state. No database read or new snapshot is taken here.
export function addSnapshotEvidence(sample, file) {
 const result=structuredClone(sample),source=fs.realpathSync(file);
 for (const line of fs.readFileSync(source,'utf8').split('\n').filter(Boolean)) {
  const snapshot=JSON.parse(line);
  if(!uuid.test(snapshot.post?.id??'') || snapshot.post.status!=='ready' || !Array.isArray(snapshot.items) || !Array.isArray(snapshot.comments)) throw Error('Invalid existing snapshot.');
  const meal=result.meals.find(m=>m.meal_id===snapshot.post.id);
  if(!meal) throw Error('Snapshot is outside the owner study meals.');
  const prior=snapshot.items.filter(i=>i.superseded_at===null);
  if(!prior.length || prior.some(i=>!uuid.test(i.id??'') || i.post_id!==snapshot.post.id)) throw Error('Snapshot has no valid earlier item rows.');
  for(const food of meal.foods) {
   const old=prior.find(i=>i.id===food.item_id || i.id===food.supersedes);
   if(!old) continue; // No name-based guess links two different foods.
   const digest=sha(line),id=`snapshot:${digest}:${old.id}`;
   food.evidence_rows??=[];
   if(food.evidence_rows.some(e=>e.id===id)) continue;
   food.evidence_rows.push({id,kind:'snapshot',meal_id:meal.meal_id,item_id:food.item_id,source_item_id:old.id,
    values:itemValues(old),basis:fieldBasis,source_row_ids:['post_items:'+old.id,...(old.nutrition?['item_nutrition:'+old.id]:[])],
    snapshot:{source_file:source,sha256:digest,meal_id:meal.meal_id,old_ids:prior.map(i=>i.id)}});
  }
 }
 return result;
}
function snapshotExists(evidence,meal,food,field) {
 try {
  const meta=evidence.snapshot;
  if(!meta || meta.meal_id!==meal.meal_id || !Array.isArray(meta.old_ids) || !meta.old_ids.length) return false;
  const line=fs.readFileSync(path.resolve(meta.source_file),'utf8').split('\n').find(line=>sha(line)===meta.sha256);
  if(!line) return false;
  const snapshot=JSON.parse(line),prior=snapshot.items?.filter(i=>i.superseded_at===null)??[];
  const old=prior.find(i=>i.id===evidence.source_item_id && (i.id===food.item_id || i.id===food.supersedes));
  return snapshot.post?.id===meal.meal_id && snapshot.post.status==='ready' && Array.isArray(snapshot.comments)
   && old?.post_id===meal.meal_id && JSON.stringify(prior.map(i=>i.id))===JSON.stringify(meta.old_ids)
   && itemValues(old)[field]===evidence.values?.[field];
 } catch {return false;}
}

// All decisions use structured fields plus rows present in the study, NEVER notes.
export function correctionFor(meal,finding) {
 const denied=reason=>({reason:finding?.cause==='value'&&reason==='no structured correction evidence'?'no restore evidence':reason});
 if(!uuid.test(meal.meal_id??'') || !validFinding(finding) || finding.action==='none') return denied('no structured correction evidence');
 const food=meal.foods?.find(f=>f.item_id===finding.item_id);
 if(!food || meal.verdict?.[finding.cause]!=='wrong' || finding.basis!==fieldBasis[finding.field]) return denied('no structured correction evidence');
 const rows=food.evidence_rows??[],evidence=finding.evidence_row_ids.map(id=>rows.find(e=>e.id===id));
 if(evidence.some(e=>!e || e.meal_id!==meal.meal_id || e.item_id!==food.item_id)) return denied(finding.action==='restore_snapshot'?'no restore evidence':'no structured correction evidence');
 const current=evidence.find(e=>e.kind==='current' && Object.hasOwn(e.values??{},finding.field) && e.values[finding.field]===food[finding.field] && e.basis?.[finding.field]===finding.basis);
 if(!current) return denied(finding.action==='restore_snapshot'?'no restore evidence':'no structured correction evidence');
 if(finding.action==='set_weight') {
  if(food.not_eaten_g!=null)return denied('served weight on a leftovers food');
  if(!['plate or bowl','hand','cutlery','pack size'].includes(meal.verdict.weight_reference))return denied('no size reference');
 }
 let script,snapshot;
 if(finding.action==='restore_snapshot') {
  const prior=evidence.filter(e=>['snapshot','earlier-state'].includes(e.kind));
  if(finding.loss_of_available_value!=='yes' || finding.cause!=='value' || !Object.hasOwn(food,finding.field) || food[finding.field]!==null
    || !Number.isFinite(finding.expected_value) || finding.expected_value<0 || prior.length!==1
    || prior[0].values?.[finding.field]!==finding.expected_value || prior[0].basis?.[finding.field]!==finding.basis
    || !snapshotExists(prior[0],meal,food,finding.field)) return denied('no restore evidence');
  script='13-restore.sql';snapshot=prior[0].snapshot;
 } else {
  if(finding.loss_of_available_value!=='no' || evidence.some(e=>e.kind!=='current')) return denied('no structured correction evidence');
  if(finding.action==='recheck_record' && finding.cause==='record' && finding.field==='record'
    && typeof finding.expected_value==='string' && finding.expected_value.trim() && !/^(unknown|none|cannot tell)$/i.test(finding.expected_value.trim())) script='24-recheck.sql';
  if(finding.action==='set_weight' && finding.cause==='weight' && finding.field==='grams'
    && Number.isFinite(food.grams) && food.grams>0 && Number.isFinite(finding.expected_value) && finding.expected_value>0) script='21-portion.sql';
 }
 if(!script) return denied('no structured correction evidence');
 return {recommendation:{meal:meal.meal,meal_id:meal.meal_id,item_id:food.item_id,food:food.name,cause:finding.cause,script,
  finding:structuredClone(finding),evidence_row_ids:[...finding.evidence_row_ids],source_row_ids:[...new Set(evidence.flatMap(e=>e.source_row_ids??[e.id]))],...(snapshot?{snapshot}:{}),notes:meal.verdict.notes??''}};
}
