import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parseDrinkInput,postDrink} from '../src/lib/intake/post-drink.ts';
import {TEA_REFERENCES,teaCaffeine} from '../src/lib/intake/tea-references.ts';
import {tileDrinkKey,readDrinkReceipt} from '../src/lib/intake/drink-operation.ts';
import {tileUsageIndex} from '../src/lib/intake/tile-usage.ts';
const operation={id:'11111111-1111-4111-8111-111111111111',key:'a'.repeat(64),eatenAt:'2026-01-01T12:00:00Z'};
for(const [id,caffeine,fdcId] of [['tea-black',60,173227],['tea-green',36,171917],['tea-oolong',48,174120]])test(`${id} publishes its own cited record and caffeine, independent of display label`,async()=>{
 const reference=TEA_REFERENCES[id];assert.equal(reference.fdcId,fdcId);let saved;
 const admin={from(table){if(table==='posts')return{update(){return this;},eq(){return this;},is(){return this;},select(){return this;},async maybeSingle(){return{data:{render_time_zone:'UTC'},error:null};}};
 if(table!=='fdc_cache')throw Error('optional hydration omitted');let key;return{select(){return this;},eq(_c,value){key=value;return this;},async maybeSingle(){assert.equal(key,`fdc-detail:${reference.fdcId}`);return{data:{response:{kind:'fdc-detail-v1',fdcId:reference.fdcId,payload:{fdcId:reference.fdcId,description:reference.description,dataType:'SR Legacy',foodNutrients:[{nutrient:{id:1057,name:'Caffeine',unitName:'mg'},amount:reference.caffeinePer100g}]}}},error:null};}};},async rpc(_name,args){saved=args;return{data:'post',error:null};}};
 const input=parseDrinkInput({tile:3,tea_id:id});assert.equal(input.id,id);assert.equal(teaCaffeine(id,300),caffeine);
 const oldError=console.error;console.error=()=>{};try{await postDrink(admin,'owner',{...input,label:'Renamed drink'},'UTC',operation);}finally{console.error=oldError;}
 assert.equal(saved.p_caffeine_mg,caffeine);assert.equal(saved.p_nutrition.source_ref,String(reference.fdcId));assert.equal(saved.p_nutrition.micronutrients.find(n=>n.nutrientId===1057).value,caffeine);
});
test('legacy tile3 means black; invalid identities are refused',()=>{
 assert.equal(parseDrinkInput({tile:3}).id,'tea-black');
 for(const body of [{tile:3,tea_id:'tea-matcha'},{tile:3,tea_id:null},{tile:1,tea_id:'tea-green'},{tile:3,ml:70}])assert.equal(parseDrinkInput(body),null);
});
test('old hash is unchanged and replays the receipt; new explicit tea identities differ',async()=>{
 const body={tile:3};const old=createHash('sha256').update(JSON.stringify({tile:3,ml:null,kind:null,custom:null,eaten_at:null,zone:'UTC'})).digest('hex');
 assert.equal(tileDrinkKey(body,'UTC'),old);
 const keys=['tea-black','tea-green','tea-oolong'].map(tea_id=>tileDrinkKey({...body,tea_id},'UTC'));assert.equal(new Set([old,...keys]).size,4);
 const admin={from(table){return{select(){return this;},eq(){return this;},is(){return this;},async maybeSingle(){return{data:table==='posts'?{id:'old-post'}:{user_id:'owner',kind:'tile',request_key:old,post_id:'old-post',cancelled:false},error:null};}};}};
 assert.deepEqual(await readDrinkReceipt(admin,'owner',operation.id,old,'tile'),{postId:'old-post'});
});
test('tea preference bucket uses stored identity, never a Tea label',()=>{
 const row=(label,ref)=>({label,posts:{post_items:[{item_nutrition:{source_ref:ref}}]}});
 for(const ref of ['173227','171917','174120'])assert.equal(tileUsageIndex(row('Tea, mug',ref)),3);
 assert.equal(tileUsageIndex(row('Tea cake','1234')),-1);assert.equal(tileUsageIndex(row('Tea, mug','1234')),-1);
 assert.equal(tileUsageIndex(row('Coffee, cup','1234')),1);
});
for(const defect of ['missing caffeine','wrong identity'])test(`tea ${defect} fails before publication without another source`,async()=>{
 let writes=0,reads=0;const ref=TEA_REFERENCES['tea-green'];
 const admin={from(table){assert.equal(table,'fdc_cache');reads++;return{select(){return this;},eq(_c,key){assert.equal(key,'fdc-detail:171917');return this;},async maybeSingle(){return{data:{response:{kind:'fdc-detail-v1',fdcId:171917,payload:{fdcId:171917,dataType:'SR Legacy',description:defect==='wrong identity'?'Black tea':ref.description,foodNutrients:[]}}},error:null};}};},async rpc(){writes++;}};
 await assert.rejects(postDrink(admin,'owner',parseDrinkInput({tile:3,tea_id:'tea-green'}),'UTC',operation),defect==='wrong identity'?/identity changed/:/caffeine is not available/);assert.equal(writes,0);assert.equal(reads,1);
});
