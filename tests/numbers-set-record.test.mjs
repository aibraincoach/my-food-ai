import test from 'node:test';
import assert from 'node:assert/strict';
import {parseArgs,parseSetRecordFoods,setRecordOutcome} from '../scripts/numbers/reanalyse.mjs';
const line=extra=>JSON.stringify({meal:'11111111',item:'22222222',fdc:2709168,description:'Lemon, raw',...extra});
test('set-record accepts explicit record choices and rejects invalid or duplicate choices',()=>{
 for(const fdc of [undefined,null,0,-1,1.2,'2709168',9007199254740992])assert.throws(()=>parseSetRecordFoods(line({fdc})),/record|fdc/i);
 assert.throws(()=>parseSetRecordFoods(line()+'\n'+line()),/twice|duplicate/i);
 const request=parseArgs(['run','--mode=set-record','--foods-file=choices','--ledger=/tmp/out'],()=>line());
 assert.equal(request.foods.get('11111111')[0].fdc,2709168);
 assert.throws(()=>parseArgs(['run','--mode=anything','--ledger=/tmp/out']),/mode/);
});
const item=(id,name,calories=20,source_ref='old')=>({id,name,portion_grams:10,portion_text:'10 g',supersedes:null,superseded_at:null,nutrition:{post_item_id:id,calories,source_ref,micronutrients:[{nutrientId:1003,value:1,unitName:'G',basis:'portion'}]}});
const before=()=>({post:{status:'ready'},items:[item('a','Lemon wedge'),item('b','Rice',100)]});
const after=()=>({post:{status:'ready'},items:[{...item('x','Lemon wedge',2.9,'2709168'),supersedes:'a'},{...item('y','Rice',100),supersedes:'b'}]});
const foods=[{item:'a',fdc:2709168}];
test('set-record keeps exact chosen record and records old micronutrient values',()=>{
 const r=setRecordOutcome(before(),after(),foods);assert.equal(r.reason,null);assert.equal(r.values_removed[0].entry.value,1);
});
for(const [label,mutate]of [
 ['failed',a=>a.post.status='failed'],['question',a=>a.post.status='needs_input'],
 ['other nutrition',a=>a.items[1].nutrition.calories=101],['other record',a=>a.items[1].nutrition.source_ref='new'],
 ['other name',a=>a.items[1].name='Changed'],['other grams',a=>a.items[1].portion_grams=11],
 ['target record',a=>a.items[0].nutrition.source_ref='9'],['unknown calories',a=>a.items[0].nutrition.calories=null],
 ['target name',a=>a.items[0].name='Changed'],['target grams',a=>a.items[0].portion_grams=11],
 ['food count',a=>a.items.pop()],
])test(`set-record puts back ${label}`,()=>{const a=after();mutate(a);assert.ok(setRecordOutcome(before(),a,foods).reason);});

test('set-record dry run only reads and creates no ledger or snapshots',async t=>{
 const {mkdtempSync,writeFileSync,chmodSync,existsSync,readFileSync,rmSync}=await import('node:fs');
 const {tmpdir}=await import('node:os');const path=await import('node:path');const {spawnSync}=await import('node:child_process');
 const dir=mkdtempSync(path.join(tmpdir(),'set-record-dry-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const meal='11111111-1111-4111-8111-111111111111',food='22222222-2222-4222-8222-222222222222';
 const snap={post:{id:meal,status:'ready'},items:[{id:food,name:'Lemon wedge',superseded_at:null,nutrition:{source_ref:'168946'}}]};
 writeFileSync(path.join(dir,'choices'),line());
 const bin=path.join(dir,'psql');writeFileSync(bin,`#!${process.execPath}
const fs=require('node:fs'),a=process.argv.slice(2);fs.appendFileSync(process.env.FAKE_LOG,JSON.stringify(a)+'\\n');
if(a.includes('-f')){if(!a[a.indexOf('-f')+1].endsWith('/08-snapshot.sql'))process.exit(9);console.log(process.env.FAKE_SNAPSHOT);}
else{const q=fs.readFileSync(0,'utf8');if(!q.includes('left(id::text, 8)'))process.exit(8);console.log('11111111 '+process.env.FAKE_MEAL);}
`);chmodSync(bin,0o700);
 const log=path.join(dir,'log'),ledger=path.join(dir,'ledger');
 const run=spawnSync(process.execPath,['scripts/numbers/reanalyse.mjs','run','--mode=set-record','--foods-file='+path.join(dir,'choices'),'--ledger='+ledger,'--dry-run'],{encoding:'utf8',timeout:10000,env:{PATH:dir+path.delimiter+process.env.PATH,SUPABASE_DB_URL:'postgres://localhost:1/disposable',FAKE_MEAL:meal,FAKE_SNAPSHOT:JSON.stringify(snap),FAKE_LOG:log}});
 assert.equal(run.status,0,run.stdout+run.stderr);assert.match(run.stdout,/168946 -> 2709168/);assert.equal(existsSync(ledger),false);
 assert.equal(readFileSync(log,'utf8').trim().split('\n').length,2);
});
