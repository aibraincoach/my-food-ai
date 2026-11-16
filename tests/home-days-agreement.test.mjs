// node --import tsx --test tests/home-days-agreement.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import {createClient} from '@supabase/supabase-js';
import {getDayTotals,getDays} from '../src/lib/posts/days.ts';
import {hydrationSoFar} from '../src/lib/intake/hydration.ts';

const day='2026-10-31';
// A stand-in for PostgREST that applies the status and question filters each reader sends.
function database(tables){
 return createClient('https://fixture.invalid','fixture',{global:{fetch:async input=>{
  const url=new URL(input instanceof Request?input.url:String(input)),table=url.pathname.split('/').at(-1);
  let rows=tables[table]??[];
  const status=url.searchParams.get('status');
  if(status?.startsWith('eq.'))rows=rows.filter(row=>row.status===status.slice(3));
  if(status?.startsWith('in.('))rows=rows.filter(row=>status.slice(4,-1).split(',').map(value=>value.replaceAll('"','')).includes(row.status));
  if(table==='posts'&&url.searchParams.get('or')==='(needs_input.is.null,status.eq.failed)')rows=rows.filter(row=>row.needs_input==null||row.status==='failed');
  return Response.json(rows);
 }}});
}
const nutrition=calories=>({calories,protein_g:5,carbs_g:10,fat_g:4,fibre_g:0,sugar_g:0,sodium_mg:0,micronutrients:[]});
const meal=(id,status,calories,needs_input=null)=>({id,status,needs_input,caption:id,eaten_at:`${day}T12:00:00Z`,post_media:[],current_post_items:status==='ready'?[{id:`item-${id}`,name:id,portion_grams:100,item_nutrition:[nutrition(calories)]}]:[]});

test('a finished meal that still has a question counts in Home\'s day circle exactly as it does on Days',async()=>{
 const question={short:'Clarification needed',question:'Was the rice fried?',options:[]};
 const db=database({posts:[meal('plain','ready',100),meal('asked','ready',200,question),meal('held','needs_input',400,question),meal('working','processing',800)]});
 const [circle]=await getDayTotals(db,'u','UTC',[day]);
 const [days]=await getDays(db,'u','UTC',day,day);
 assert.equal(days.totals.calories,300,'Days counts both finished meals and neither unfinished one');
 assert.equal(circle.kcal,days.totals.calories);
 assert.deepEqual(circle.posts.map(post=>post.id).sort(),days.posts.map(post=>post.id).sort());
});

test('a rum and cola adds the same caffeine to the day on Home and on Days',async()=>{
 const logged_at=`${day}T20:00:00Z`;
 const rum={id:'rum',post_id:'night',name:'Rum and coke',portion_grams:220,portion_text:'220 ml',item_nutrition:[{...nutrition(150),food_category:'Liquor and cocktails',micronutrients:[
  {nutrientId:1018,nutrientName:'Alcohol, ethyl',unitName:'G',basis:'portion',value:13.9},
  {nutrientId:1057,nutrientName:'Caffeine',unitName:'MG',basis:'portion',value:20}]}]};
 const db=database({
  posts:[{...meal('night','ready',150),eaten_at:logged_at,current_post_items:[rum]}],
  current_post_items:[rum],
  intake_logs:[
   {kind:'caffeine',amount:95,ml:240,label:'Coffee',logged_at:`${day}T08:00:00Z`,post_id:null,source:'sheet',post_item_id:null},
   {kind:'alcohol',amount:14,ml:220,label:'Rum and coke',logged_at,post_id:'night',source:'item',post_item_id:'rum'}],
 });
 const home=await hydrationSoFar(db,'u',day,'UTC',`${day}T23:59:59Z`);
 const [days]=await getDays(db,'u','UTC',day,day);
 assert.equal(home.caffeineMg,115,'the feed counts the coffee and the cola in the rum');
 assert.equal(days.intake.caffeine,home.caffeineMg);
});
