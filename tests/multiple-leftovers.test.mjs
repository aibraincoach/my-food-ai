import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {beforeLeftovers,carryLeftovers,retainedNutrition} from '../src/lib/pipeline/leftovers.ts';
import {cardDataFromRow} from '../src/lib/pipeline/card-data.ts';
import {checkWording} from '../src/lib/pipeline/wording-check.ts';
import {user} from './db/helpers.mjs';
const item={id:'food',name:'Toast',portion_grams:60,portion_text:'60 g',not_eaten_grams:40,not_eaten_calories:80,count_text:null,not_eaten_count_text:'40 g',calories:120,protein_g:6,carbs_g:12,fat_g:3,fibre_g:null,sugar_g:null,sodium_mg:null,micronutrients:[],source_ref:'123',box:null,mask_path:null,source:'model'};
test('photo correction subtracts existing leftovers exactly once and retains exact consumed nutrition',()=>{
 const gross=beforeLeftovers(item);assert.equal(gross.portion_grams,100);
 const row=carryLeftovers({name:item.name,portion_grams:100,portion_text:'100 g',nutrition:{...retainedNutrition(item),calories:200}},item);
 assert.equal(row.portion_grams,60);assert.equal(row.nutrition.calories,120);assert.equal(row.not_eaten_grams,40);assert.equal(row.not_eaten_calories,80);
 const twice=carryLeftovers({...row,portion_grams:beforeLeftovers({...item,...row}).portion_grams}, {...item,...row});assert.equal(twice.portion_grams,60);assert.equal(twice.not_eaten_grams,40);
 const resized=carryLeftovers({...row,portion_grams:150,nutrition:{...row.nutrition,calories:300}},item);assert.equal(resized.portion_grams,110);assert.ok(Math.abs(resized.nutrition.calories-220)<1e-9);assert.equal(resized.not_eaten_calories,80);
 assert.throws(()=>carryLeftovers({...row,portion_grams:30},item),/smaller/);
});
test('fully uneaten foods and cumulative footer keep their recorded calories after more revisions',()=>{
 const prior={...item,portion_grams:0,not_eaten_grams:100,not_eaten_calories:200,calories:0};
 const row=carryLeftovers({name:prior.name,portion_grams:100,portion_text:'100 g',nutrition:retainedNutrition(prior)},prior);
 assert.equal(row.nutrition.calories,0);assert.equal(row.portion_grams,0);assert.equal(row.not_eaten_calories,200);
 const card=cardDataFromRow({items:[{...prior,...row,not_eaten_count_text:'100 g'}]});assert.equal(card.footer,'leftovers (not eaten): 100 g · 200 kcal');
 assert.equal(checkWording(card.footer).ok,true);assert.equal(checkWording('leftovers (not eaten)').ok,true);assert.equal(checkWording('100 calories left').ok,false);
});
test('two independent leftovers photos accumulate, retry once, survive ordinary correction, and stay owner-scoped',async()=>{
 const owner=await user(1);const migration=readFileSync(new URL('../supabase/migrations/0028_multiple_leftovers.sql',import.meta.url),'utf8');
 const sql=`\\set ON_ERROR_STOP on
begin;
set local lock_timeout='5s';set local statement_timeout='30s';
select exists(select 1 from information_schema.columns where table_schema='public' and table_name='post_items' and column_name='not_eaten_calories') as multiple_leftovers_installed \\gset
\\if :multiple_leftovers_installed
\\else
${migration}
\\endif
select '${owner.user.id}'::uuid as owner,gen_random_uuid() as post,gen_random_uuid() as job1,gen_random_uuid() as job2,gen_random_uuid() as job3 \\gset
insert into public.posts(id,user_id,caption,status,analysis_initialized_at) values(:'post',:'owner','Two plates: toast and pasta','processing',now());
insert into public.post_media(post_id,storage_path,position,width,height,not_eaten) values
 (:'post',:'owner'||'/'||:'post'||'/0.jpg',0,100,100,false),(:'post',:'owner'||'/'||:'post'||'/1.jpg',1,100,100,false);
insert into public.post_media(post_id,storage_path,position,width,height,not_eaten) values(:'post',:'owner'||'/'||:'post'||'/2.jpg',2,100,100,true) returning id as photo1 \\gset
insert into public.post_media(post_id,storage_path,position,width,height,not_eaten) values(:'post',:'owner'||'/'||:'post'||'/3.jpg',3,100,100,true) returning id as photo2 \\gset
insert into public.post_items(post_id,name,portion_grams,source) values(:'post','Toast',100,'model') returning id as item \\gset
insert into public.item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,micronutrients) values(:'item',200,10,20,5,'[]');
insert into public.jobs(id,post_id,kind,status,payload) values(:'job1',:'post','remainder','running',jsonb_build_object('post_ownership',true,'remainder_photo_id',:'photo1'));
update public.posts set active_job_id=:'job1' where id=:'post';
select jsonb_build_array(jsonb_build_object('old_id',:'item','portion_grams',60,'portion_text','60 g','not_eaten_grams',40,'not_eaten_calories',80,'nutrition',jsonb_build_object('calories',120,'protein_g',6,'carbs_g',12,'fat_g',3,'micronutrients','[]'::jsonb)))::text as first \\gset
select public.apply_post_remainder(:'post',:'job1',:'photo1',array[:'item'::uuid],:'first','leftovers (not eaten): 40 g · 80 kcal.');
select public.apply_post_remainder(:'post',:'job1',:'photo1',array[:'item'::uuid],:'first','Duplicate must not appear');
select id as next_item from public.current_post_items where post_id=:'post' \\gset
update public.jobs set status='finished' where id=:'job1';
insert into public.jobs(id,post_id,kind,status,payload) values(:'job2',:'post','remainder','running',jsonb_build_object('post_ownership',true,'remainder_photo_id',:'photo2'));
update public.posts set active_job_id=:'job2' where id=:'post';
select jsonb_build_array(jsonb_build_object('old_id',:'next_item','portion_grams',30,'portion_text','30 g','not_eaten_grams',70,'not_eaten_calories',140,'nutrition',jsonb_build_object('calories',60,'protein_g',3,'carbs_g',6,'fat_g',1.5,'micronutrients','[]'::jsonb)))::text as second \\gset
select public.apply_post_remainder(:'post',:'job2',:'photo2',array[:'next_item'::uuid],:'second','leftovers (not eaten): 30 g · 60 kcal.');
select public.apply_post_remainder(:'post',:'job2',:'photo2',array[:'next_item'::uuid],:'second','Duplicate must not appear');
select id as last_item from public.current_post_items where post_id=:'post' \\gset
update public.jobs set status='finished' where id=:'job2';
insert into public.jobs(id,post_id,kind,status,payload) values(:'job3',:'post','correct','running','{"post_ownership":true,"photo_added":true,"correction_from_sequence":0,"correction_pending_ids":[]}');
update public.posts set active_job_id=:'job3' where id=:'post';
select jsonb_build_array(jsonb_build_object('name','Toast','supersedes',:'last_item','portion_grams',30,'portion_text','30 g','nutrition',jsonb_build_object('calories',60,'protein_g',3,'carbs_g',6,'fat_g',1.5,'micronutrients','[]'::jsonb)))::text as correction \\gset
select public.persist_photo_correction(:'post',:'job3',array[:'last_item'::uuid],:'correction','Consumed: 60 kcal.');
select set_config('leftovers.post',:'post',true);
do $$ begin
 if (select count(*) from public.post_media where post_id=current_setting('leftovers.post')::uuid and not_eaten)<>2 then raise exception 'Photo record lost';end if;
 if not exists(select 1 from public.current_post_items where post_id=current_setting('leftovers.post')::uuid and portion_grams=30 and not_eaten_grams=70 and not_eaten_calories=140) then raise exception 'Cumulative record lost';end if;
 if (select count(*) from public.post_comments where post_id=current_setting('leftovers.post')::uuid)<>3 then raise exception 'Retry duplicated history';end if;
 if (select count(*) from public.jobs where post_id=current_setting('leftovers.post')::uuid and payload ? 'leftover_items')<>2 then raise exception 'Per-photo receipt lost';end if;
 begin update public.post_media set not_eaten=true where post_id=current_setting('leftovers.post')::uuid and position=0;raise exception 'First photo accepted';exception when check_violation then null;end;
end $$;
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',gen_random_uuid(),'role','authenticated')::text,true);
do $$ begin if exists(select 1 from public.post_media where post_id=current_setting('leftovers.post')::uuid) or exists(select 1 from public.current_post_items where post_id=current_setting('leftovers.post')::uuid) then raise exception 'Other user read leftovers';end if;end $$;
reset role;
-- A changed consumed quantity must not inherit an obsolete pieces/slices count.
select id as before_count from public.current_post_items where post_id=:'post' \\gset
update public.post_items set count_text='3 of 5 pieces' where id=:'before_count';
insert into public.post_items(post_id,name,portion_grams,source,supersedes) values(:'post','Toast',20,'model',:'before_count') returning id as changed_count \\gset
select set_config('leftovers.changed_count',:'changed_count',true);
do $$ begin if not exists(select 1 from public.post_items where id=current_setting('leftovers.changed_count')::uuid and not_eaten_grams=70 and not_eaten_calories=140 and count_text is null) then raise exception 'Changed quantity inherited stale count or lost leftovers';end if;end $$;
rollback;
`;
 const result=spawnSync('psql',['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL],{input:sql,encoding:'utf8',timeout:60000});assert.equal(result.status,0,result.stderr);
});

test('remainder worker reads its own photo and adds the new deduction to earlier photo quantities and calories',async()=>{
 const {createClient}=await import('@supabase/supabase-js');const {default:remainder}=await import('../src/lib/worker/jobs/remainder.ts');
 const saved=globalThis.fetch,priorKey=process.env.MODEL_API_KEY;process.env.MODEL_API_KEY='fixture';let applied,photoQuery;
 globalThis.fetch=async(_input,init)=>{let body={};try{body=JSON.parse(init?.body??'{}')}catch{}if(!body.model)return new Response(null,{status:201});return Response.json({id:'remainder',status:'completed',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify({items:[{index:0,remaining_grams:30,total_count:null,remaining_count:null,unit:null}]})}]}]});};
 const db=createClient('http://127.0.0.1:1','fixture',{global:{fetch:async(input,init)=>{const url=new URL(input),path=url.pathname;
  if(path.endsWith('/post_media')){photoQuery=url.searchParams.get('id');return Response.json({id:'photo2',storage_path:'owner/post/3.jpg'});}
  if(path.endsWith('/posts'))return Response.json({user_id:'owner',analysis_initialized_at:'2026-11-02T00:00:00Z'});
  if(path.endsWith('/current_post_items'))return Response.json([item]);
  if(path.endsWith('/item_nutrition'))return Response.json([{...retainedNutrition(item),post_item_id:item.id}]);
  if(path.includes('/storage/'))return new Response(new Uint8Array([1]),{headers:{'Content-Type':'image/jpeg'}});
  if(path.endsWith('/apply_post_remainder')){applied=JSON.parse(init.body);return Response.json({message:'captured fixture save',code:'40001'},{status:409});}
  throw Error('Unexpected worker fixture route '+path);
 }}});
 try{await assert.rejects(remainder(db,{id:'job',post_id:'post',payload:{remainder_photo_id:'photo2'}}));assert.equal(photoQuery,'eq.photo2');assert.ok(applied);const row=applied.p_items[0];assert.equal(row.portion_grams,30);assert.equal(row.not_eaten_grams,70);assert.equal(row.not_eaten_calories,140);assert.equal(row.nutrition.calories,60);assert.match(applied.p_reply,/^leftovers \(not eaten\):/);}finally{globalThis.fetch=saved;if(priorKey===undefined)delete process.env.MODEL_API_KEY;else process.env.MODEL_API_KEY=priorKey;}
});
