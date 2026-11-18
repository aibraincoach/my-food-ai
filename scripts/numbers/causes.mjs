import path from 'node:path';
import {parseArgs} from 'node:util';
import {privateDir,writeJson,privateWrite,readJson,isMain,refuseExisting} from './study-io.mjs';
import {correctionFor} from './correction-evidence.mjs';
const fields=['food','record','weight','value','not_eaten'];
export function analyseCauses(input) {
 const meals=input.meals??[],causes=fields.map(cause=>({cause,groups:Object.fromEntries(['a','b','c'].map(group=>[group,meals.filter(m=>m.group===group&&m.verdict[cause]==='wrong').map(m=>m.meal)]))}));
 causes.sort((a,b)=>Object.values(b.groups).flat().length-Object.values(a.groups).flat().length||fields.indexOf(a.cause)-fields.indexOf(b.cause));
 const controls=meals.filter(m=>m.group==='c'),wrong=controls.filter(m=>fields.some(f=>m.verdict[f]==='wrong')).length;
 const cannot_tell=controls.filter(m=>fields.some(f=>m.verdict[f]==='cannot tell')).length,corrections=[],withheld=[];
 for(const meal of meals) {
  for(const finding of meal.verdict.findings??[]) {
   const result=correctionFor(meal,finding);
   if(result.recommendation) corrections.push(result.recommendation);
   else withheld.push({meal:meal.meal,meal_id:meal.meal_id??null,item_id:finding.item_id??null,script:null,reason:result.reason,finding,evidence_row_ids:finding.evidence_row_ids??[]});
  }
  for(const cause of fields.filter(c=>meal.verdict[c]==='wrong')) {
   if((meal.verdict.findings??[]).some(f=>f.cause===cause)) continue;
   withheld.push({meal:meal.meal,meal_id:meal.meal_id??null,item_id:null,script:null,reason:cause==='value'?'no restore evidence':'no structured correction evidence',finding:null,evidence_row_ids:[]});
  }
 }
 const outcomes=Object.fromEntries(fields.map(question=>[question,Object.fromEntries(['a','b','c'].map(group=>[group,Object.fromEntries(['right','wrong','cannot tell'].map(outcome=>[outcome,meals.filter(m=>m.group===group&&m.verdict[question]===outcome).length]))]))]));
 return {causes,outcomes,controls:{wrong,sampled:controls.length,share:controls.length?wrong/controls.length:null,cannot_tell},corrections,withheld,
  unjudged:meals.filter(m=>fields.some(f=>m.verdict[f]==='cannot tell')).map(m=>m.meal)};
}
if(isMain(import.meta.url)) {
 try {
  const {values}=parseArgs({options:{verdicts:{type:'string'},out:{type:'string'},corrections:{type:'boolean',default:false}}});
  if(!values.verdicts||!values.out) throw Error('Required: --verdicts=<verdicts.json> --out=<private directory>.');
  const dir=privateDir(values.out),result=analyseCauses(readJson(values.verdicts)),file=path.join(dir,values.corrections?'corrections.json':'causes.json');
  refuseExisting(file);writeJson(file,values.corrections?{recommendations:result.corrections,withheld:result.withheld}:result);
  if(values.corrections) privateWrite(path.join(dir,'corrections.txt'),[...result.corrections,...result.withheld].map(row=>JSON.stringify(row)).join('\n')+'\n');
  console.log(JSON.stringify({controls:result.controls,corrections:result.corrections.length,withheld:result.withheld.length}));
 }catch(e){console.error(e.message);process.exitCode=1;}
}
