import test from 'node:test';
import assert from 'node:assert/strict';
import {getProfileGrid} from '../src/lib/posts/grid.ts';
import {sumNutrition,unavailableFoods} from '../src/lib/nutrition/totals.ts';
const eaten='2026-10-31T08:00:00Z';
const nutrition=(id,calories)=>({post_item_id:id,calories,protein_g:calories===null?null:10,carbs_g:calories===null?null:20,fat_g:calories===null?null:5,fibre_g:null,sugar_g:null,sodium_mg:null,micronutrients:[],source_ref:null});
function fixture({signFails=false}={}){
 const calls=[];const posts=[{id:'meal',caption:'breakfast',status:'ready',eaten_at:eaten,post_media:[{kind:'card',position:0,storage_path:'old-card.png'}]},{id:'drink',caption:'water',status:'ready',eaten_at:eaten,post_media:[{kind:'card',position:0,storage_path:'old-drink-card.png'}]},{id:'photo',caption:'plate',status:'ready',eaten_at:eaten,post_media:[{kind:'card',position:0,storage_path:'old-first-card.png'},{kind:'photo',position:1,storage_path:'owner/photo/1.jpg'}]}];
 const items=[{id:'known',post_id:'meal',name:'toast',portion_grams:60},{id:'unknown',post_id:'meal',name:'coffee',portion_grams:240},{id:'water',post_id:'drink',name:'Water',portion_grams:null},{id:'photo-item',post_id:'photo',name:'rice',portion_grams:100}];
 const rows=[nutrition('known',257.6),nutrition('unknown',null),nutrition('water',0),nutrition('photo-item',130)];
 const db={
  from(table){
   const filters=[];let offset=0,upper=199;
   const chain={
    select(){return chain},eq(k,v){filters.push([k,v]);return chain},order(){return chain},
    in(k,v){filters.push([k,v]);return chain},range(a,b){offset=a;upper=b;return chain},
    then(resolve){
     calls.push({table,filters});
     const result=table==='posts'?posts:table==='current_post_items'?items.filter(x=>filters.find(([k])=>k==='post_id')[1].includes(x.post_id)):table==='item_nutrition'?rows.filter(x=>filters.find(([k])=>k==='post_item_id')[1].includes(x.post_item_id)):table==='intake_logs'?[{post_id:'drink'}]:[];
     return Promise.resolve({data:result.slice(offset,upper+1),error:null}).then(resolve);
    }
   };
   return chain;
  },
  storage:{from(){return {
   async createSignedUrls(paths){calls.push({sign:paths});return signFails?{data:null,error:{message:'down'}}:{data:paths.map(path=>({path,signedUrl:'signed:'+path,error:null})),error:null};}
  };}}
 };
 return {db,calls};
}
test('caption-only grid uses current known nutrition and identifies omissions, never old card pixels',async()=>{
 const {db,calls}=fixture();const posts=await getProfileGrid(db,'owner');const meal=posts.find(p=>p.id==='meal');
 assert.equal(meal.photoUrl,null);assert.equal(meal.calories,257.6);assert.deepEqual(new Set(unavailableFoods(sumNutrition(meal.items))),new Set(['coffee','toast']));
 assert.equal(meal.items.length,2);assert.equal(posts.find(p=>p.id==='drink').isDrink,true);
 assert.equal(posts.find(p=>p.id==='photo').photoUrl,'signed:owner/photo/1.feed.jpg');
 assert.deepEqual(calls.find(c=>c.sign).sign,['owner/photo/1.feed.jpg']);
 assert.equal(calls.filter(c=>c.table==='current_post_items').length,1);assert.equal(calls.filter(c=>c.table==='item_nutrition').length,1);assert.equal(calls.filter(c=>c.table==='intake_logs').length,1);
 assert.deepEqual(calls.find(c=>c.table==='posts').filters,[['user_id','owner']]);
});
test('failed photo signing uses current nutrition fallback instead of old generated card',async()=>{
 const {db}=fixture({signFails:true});const posts=await getProfileGrid(db,'owner');const post=posts.find(p=>p.id==='photo');assert.equal(post.photoUrl,null);assert.equal(post.calories,130);assert.equal(sumNutrition(post.items).calories,130);
});
