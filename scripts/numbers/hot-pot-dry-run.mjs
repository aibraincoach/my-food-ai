// Read an existing, single-owner private snapshot. No DB/API/model imports.
import fs from'node:fs';import path from'node:path';import{createHash}from'node:crypto';import{fileURLToPath}from'node:url';
import{excludeSharedItem,thinPotMeat,thinPotPortion,PINNED_SOURCE,sharedPotKind,sharedPotContext}from'../../src/lib/nutrition/hot-pot.ts';
import{sittingGroups}from'../../src/lib/posts/sitting-groups.ts';
const args=process.argv.slice(2),get=flag=>{const i=args.indexOf(flag);return i<0?undefined:args[i+1];},input=get('--input'),output=get('--output'),owner=get('--owner');
if(!input||!output||!owner)throw Error('Use --input existing-private-snapshot --output private-directory --owner snapshot-owner-label');
const repo=path.resolve(fileURLToPath(new URL('../../',import.meta.url))),out=path.resolve(output);
if(out===repo||out.startsWith(repo+path.sep))throw Error('Private output must stay outside the checkout');
fs.mkdirSync(out,{recursive:true,mode:0o700});fs.chmodSync(out,0o700);
if(fs.existsSync(out+'/dry-run.json'))throw Error('Dry-run already exists; inspect it instead of silently repeating');
const bytes=fs.readFileSync(input),posts=JSON.parse(bytes),number=value=>value==null||!String(value).trim()?null:Number.isFinite(Number(value))?Number(value):null;
if(!Array.isArray(posts))throw Error('Snapshot must be posts[]');
const priorCoverage=get('--prior-context')?JSON.parse(fs.readFileSync(get('--prior-context'))):undefined;
const mapped=posts.map((post,index)=>{
 if(!post||typeof post.id!=='string'||!Array.isArray(post.items)||!post.items.every(item=>typeof item.name==='string'))throw Error('Invalid snapshot post/items');
 const context={caption:post.caption??'',names:post.items.map(i=>i.name),items:post.items.map(i=>({name:i.name,portionText:i.portion_text}))};
 const newlyCovered=priorCoverage?.[index]?.context===false&&sharedPotContext(context);
 const items=post.items.map(item=>{
  const before=number(item.calories),grams=number(item.portion_grams),pinned=PINNED_SOURCE.test(item.source_ref??'')||item.gtin!=null;
  const excluded=!pinned&&excludeSharedItem(item.name,context),portion=thinPotPortion({name:item.name,portionText:item.portion_text,portionGrams:grams},context),thin=!pinned&&Boolean(thinPotMeat({name:item.name,portionText:item.portion_text},context));
  const weightSensitivity=excluded?0:!pinned&&portion.adjusted&&grams>0&&before!==null?before*portion.grams/grams:before;
  return{id:item.id,name:item.name,sourceRef:item.source_ref??null,beforeGrams:grams,beforeKcal:before,excluded,pinned,newlyCoveredShared:Boolean(newlyCovered&&excluded&&sharedPotKind(item.name)),afterSharedKcal:excluded?0:before,portionGrams:pinned?grams:portion.grams,portionSource:portion.adjusted?portion.source??null:null,weightOnlyKcal:weightSensitivity,leanReferenceUnresolved:thin&&!excluded,finalKnownKcal:excluded?0:thin?null:before};
 });
 return{id:post.id,ownerId:owner,eatenAt:post.eaten_at,items};
});
const sum=(items,key)=>{const known=items.filter(i=>i[key]!==null).reduce((n,i)=>n+i[key],0),missing=items.filter(i=>i[key]===null).map(i=>({id:i.id,name:i.name}));return{known,kcal:missing.length?null:known,unresolved:missing};};
const groups=sittingGroups(mapped).map((posts,index)=>{
 const items=posts.flatMap(p=>p.items);
 return{index,posts:posts.map(p=>p.id),from:posts[0].eatenAt,to:posts.at(-1).eatenAt,before:sum(items,'beforeKcal'),exactAfterRuleA:sum(items,'afterSharedKcal'),weightOnlySensitivityNotFinalLean:sum(items,'weightOnlyKcal'),finalKnownSubtotal:sum(items,'finalKnownKcal'),changes:items.filter(i=>i.excluded||i.portionGrams!==i.beforeGrams||i.leanReferenceUnresolved)};
});
const all=mapped.flatMap(p=>p.items),result={method:'Existing private snapshot only; rule(a) exact; weight-only retains prior density and is NOT final lean nutrition; unresolved lean rows remain unknown, never zero',inputSha256:createHash('sha256').update(bytes).digest('hex'),policySha256:createHash('sha256').update(fs.readFileSync(new URL('../../src/lib/nutrition/hot-pot.ts',import.meta.url))).digest('hex'),groups,day:{before:sum(all,'beforeKcal'),exactAfterRuleA:sum(all,'afterSharedKcal'),weightOnlySensitivityNotFinalLean:sum(all,'weightOnlyKcal'),finalKnownSubtotal:sum(all,'finalKnownKcal')},newConjunctionCoverage:{posts:mapped.filter(p=>p.items.some(i=>i.newlyCoveredShared)).length,rows:all.filter(i=>i.newlyCoveredShared).length}};
fs.writeFileSync(out+'/dry-run.json',JSON.stringify(result,null,2),{mode:0o600});
console.log(JSON.stringify({privateDryRunWritten:true,inputOnly:true,noModelOrDatabaseCalls:true,hasUnresolvedLeanReferences:result.day.finalKnownSubtotal.unresolved.length>0,newConjunctionCoverage:result.newConjunctionCoverage}));
