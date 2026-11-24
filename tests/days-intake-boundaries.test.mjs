import {captureEnglish} from './fixtures/capture-wording.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
import * as days from '../src/lib/posts/days.ts';
import {emptyIntake} from '../src/lib/intake/intake.ts';
import {sumNutrition} from '../src/lib/nutrition/totals.ts';
const date='2026-11-02',month=date.slice(0,7);
const summary={days:[{day:date,posts:1,pending:0,ready:true,kcal:100}],posted:1};
function module(file,readers){
 const exports={};
 vm.runInNewContext(ts.transpileModule(readFileSync(new URL(`../src/${file}`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,URL,Date,require(name){
  if(name==='@/lib/posts/days')return{...days,...readers};
  if(name==='next/headers')return{cookies:async()=>({get:()=>undefined})};
  if(name==='next/server')return{NextResponse:Response};
  if(name==='next/navigation')return{redirect(){throw Error('unexpected redirect');}};
  if(name==='@/lib/auth/verified-user')return{verifiedUserId:async()=> 'owner'};
  if(name==='@/lib/supabase/server')return{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'owner'}}})}})};
  if(name==='@/lib/nutrition/totals')return{sumNutrition};
  if(name==='@/lib/intake/intake')return{emptyIntake};
  if(name==='react/jsx-runtime')return{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  if(name.startsWith('@/components/'))return{__esModule:true,default:name};
  throw Error(name);
 }});return exports;
}
test('month API failure remains HTTP 503 with preserved meals, never a partial success',async()=>{
 const {GET}=module('app/api/days/route.ts',{getMonthSummary:async()=>{throw new days.MonthIntakeError(month,summary);}});
 const response=await GET(new Request(`http://local/api/days?month=${month}`));
 assert.equal(response.status,503);assert.match(response.headers.get('cache-control'),/no-store/);
 const body=await response.json();assert.deepEqual(body,{message_code:'monthlyDrinksLoadFailed',month,summary});assert.equal(captureEnglish(body.message_code),'Couldn’t load monthly drinks.');
});
test('day API preserves unavailable intake while successful empty reads remain empty',async()=>{
 for(const failed of [true,false]){
  const day={date,posts:[],totals:sumNutrition([]),intake:null,pending:0};
  const {GET}=module('app/api/days/route.ts',{getDays:async()=>failed?[day]:[]});
  const response=await GET(new Request(`http://local/api/days?date=${date}`));assert.equal(response.status,200);
  assert.deepEqual((await response.json()).day.intake,failed?null:emptyIntake());
 }
});
test('server-rendered month intake failure reaches DaysView with meals and failure marker',async()=>{
 const {default:screen}=module('components/DaysScreen.tsx',{getEarliestPostDate:async()=>date,getMonthSummary:async(_db,_owner,_zone,requested)=>{throw new days.MonthIntakeError(requested,summary);}});
 const tree=await screen({tz:'UTC'});const view=tree.props.children[1];
 assert.ok(view.props.initialMonthErrors.length>0);
 for(const failed of view.props.initialMonthErrors)assert.equal(view.props.initialMonths[failed].days[0].posts,1);
});
