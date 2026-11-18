import{addSnapshotEvidence}from'./correction-evidence.mjs';
import{createHash}from'node:crypto';import{parseArgs}from'node:util';import path from'node:path';import{privateDir,writeJson,readRows,readJson,isMain,validPrefix,refuseExisting}from'./study-io.mjs';
const md5=value=>createHash('md5').update(value).digest('hex');
const order=(a,b)=>md5(a.meal).localeCompare(md5(b.meal))||a.meal.localeCompare(b.meal);
export function chooseSample(rows,{flagged=[]}={}){
 const byMeal=new Map();
 for(const row of rows){if(!validPrefix(row.meal))throw Error('Invalid meal prefix.');const meal=byMeal.get(row.meal)??{meal:row.meal,meal_id:row.meal_id??null,foods:[],photos:[]};if(meal.meal_id&&row.meal_id&&meal.meal_id!==row.meal_id)throw Error('Ambiguous meal prefix.');meal.foods.push(row);for(const photo of row.photos??[])if(!meal.photos.some(p=>p.path===photo.path))meal.photos.push(photo);byMeal.set(row.meal,meal);}
 const meals=[...byMeal.values()];for(const m of meals)m.foods.sort((a,b)=>String(a.item).localeCompare(String(b.item)));
 const leftovers=meals.filter(m=>m.photos.some(p=>p.not_eaten)||m.foods.some(f=>f.not_eaten_g!=null)).sort(order),leftIds=new Set(leftovers.map(m=>m.meal)),flagIds=new Set(flagged.map(f=>f.meal));
 const a=leftovers.slice(0,22),controls=meals.filter(m=>!leftIds.has(m.meal)&&!flagIds.has(m.meal)).sort(order),c=controls.slice(0,8),b=[];
 for(const f of flagged){const m=byMeal.get(f.meal);if(m&&!leftIds.has(m.meal)&&!b.some(x=>x.meal===m.meal)&&b.length<30-a.length-c.length)b.push(m);}
 const selected=[...a.map(m=>({...m,group:'a'})),...b.map(m=>({...m,group:'b'})),...c.map(m=>({...m,group:'c'}))];
 return{meals:selected,controls_available:controls.length,omitted_leftovers:leftovers.slice(22).map(m=>m.meal),population:{meals:meals.length,leftovers:leftovers.length,flagged_non_leftovers:meals.filter(m=>flagIds.has(m.meal)&&!leftIds.has(m.meal)).length,sampled:selected.length,unsampled:meals.length-selected.length}};
}
if(isMain(import.meta.url)){try{const{values}=parseArgs({options:{rows:{type:'string'},mismatch:{type:'string'},out:{type:'string'},snapshots:{type:'string'}}});if(!values.rows||!values.mismatch||!values.out)throw Error('Required: --rows=<jsonl> --mismatch=<flagged.jsonl or JSON> --out=<private directory>.');const dir=privateDir(values.out),file=path.join(dir,'sample.json');refuseExisting(file);let flags;try{flags=readJson(values.mismatch);}catch{flags=readRows(values.mismatch);}let sample=chooseSample(readRows(values.rows),{flagged:Array.isArray(flags)?flags:flags.flagged??(flags.meal?[flags]:[])});if(values.snapshots)sample=addSnapshotEvidence(sample,values.snapshots);writeJson(file,sample);console.log(JSON.stringify({sampled:sample.meals.length,controls:sample.meals.filter(m=>m.group==='c').length,omitted_leftovers:sample.omitted_leftovers.length}));}catch(e){console.error(e.message);process.exitCode=1;}}
