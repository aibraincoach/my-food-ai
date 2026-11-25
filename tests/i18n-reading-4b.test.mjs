import {nutritionTranslator} from '../src/i18n/nutrition.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createTranslator} from 'next-intl';
import {onError,getMessageFallback} from '../src/i18n/strict.ts';
import {formatDate} from '../src/i18n/format.ts';
import {calendarDayValues} from '../src/i18n/days.ts';
import {checkRootSiblingNamespaces,checkAgentNamespaces} from '../scripts/check-capture-namespaces.mjs';
const dict=Object.fromEntries(['en','ja'].map(locale=>[locale,JSON.parse(fs.readFileSync(new URL('../messages/'+locale+'.json',import.meta.url),'utf8'))]));
const translator=(locale,namespace)=>createTranslator({locale,messages:dict[locale][namespace],onError,getMessageFallback});
for(const locale of ['en','ja'])for(const count of [0,1,2])test(`${locale}: Days, search and agent counted sentences at ${count}`,()=>{
 const days=translator(locale,'days'),search=translator(locale,'search'),agents=translator(locale,'agents');
 const values={count,amount:String(count),kcal:'1,200',pending:'yes',unfinished:'2'};
 const meal=count===1?'meal':'meals';
 assert.equal(days('postedCount',values),locale==='en'?(count===0?'No days logged':`${count} ${count===1?'day':'days'} logged`):(count===0?'記録した日はありません':`${count}日分記録`));
 assert.equal(days('consumedSummary',values),locale==='en'?`Consumed: 1,200 kcal · ${count} ${meal} · 2 not finished`:`摂取：1,200 kcal · ${count}件の食事 · 2件が未完了`);
 assert.equal(days('mealCount',values),locale==='en'?`${count} ${meal} · 2 not finished`:`${count}件の食事 · 2件が未完了`);
 assert.equal(search('postCount',{count}),locale==='en'?`${count} ${count===1?'post':'posts'}`:`${count}件の投稿`);
 assert.equal(agents('connectedCount',values),locale==='en'?`${count} connected`:`${count}件接続中`);
 assert.equal(agents('readMeals',{count}),locale==='en'?`Read ${count} ${meal}`:`${count}件の食事を閲覧しました`);
 assert.equal(days('cellSummary',{date:'2026-11-24',hasDay:'yes',count,hasPending:'no',unfinished:'0',hasIntake:'no',ready:'no',kcal:'0',hasGap:'no',gap:''}),locale==='en'?`2026-11-24, ${count} ${meal}`:`2026-11-24、${count}件の食事`);
});
for(const locale of ['en','ja'])test(`${locale}: calendar sentence preserves every branch and the held server gap`,()=>{
 const t=translator(locale,'days');
 const base={date:'2026-11-24',hasDay:'yes',count:2,hasPending:'no',unfinished:'1',hasIntake:'no',ready:'no',kcal:'1,200',hasGap:'no',gap:'GAPTEXT'};
 for(const [flags,en,ja]of[
  [{hasDay:'no'},'2026-11-24','2026-11-24'],
  [{},'2026-11-24, 2 meals','2026-11-24、2件の食事'],
  [{hasPending:'yes'},'2026-11-24, 2 meals, 1 not finished','2026-11-24、2件の食事、1件が未完了'],
  [{hasIntake:'yes'},'2026-11-24, 2 meals, drank','2026-11-24、2件の食事、飲んだ'],
  [{ready:'yes'},'2026-11-24, 2 meals, 1,200 kcal','2026-11-24、2件の食事、1,200 kcal'],
  [{hasPending:'yes',hasIntake:'yes',ready:'yes',hasGap:'yes'},'2026-11-24, 2 meals, 1 not finished, drank, 1,200 kcal, GAPTEXT','2026-11-24、2件の食事、1件が未完了、飲んだ、1,200 kcal、GAPTEXT'],
 ])assert.equal(t('cellSummary',{...base,...flags}),locale==='en'?en:ja);
 const empty=calendarDayValues(locale,'2026-11-24',undefined,nutritionTranslator(locale));assert.equal(t('cellSummary',empty),'2026-11-24');
 const actual=calendarDayValues(locale,'2026-11-24',{day:'2026-11-24',posts:1,pending:0,intake:true,ready:true,kcal:1200},nutritionTranslator(locale));
 assert.equal(t('cellSummary',actual),locale==='en'?'2026-11-24, 1 meal, drank, 1,200 kcal':'2026-11-24、1件の食事、飲んだ、1,200 kcal');
});
test('the phone calendar month token is localized before the first-day message',()=>{
 const date=Date.UTC(2026,10,1,12);
 assert.equal(translator('en','days')('firstOfMonth',{month:formatDate('en',date,'UTC',{month:'short'})}),'Nov 1');
 assert.equal(translator('ja','days')('firstOfMonth',{month:formatDate('ja',date,'UTC',{month:'short'})}),'11月1日');
});
test('root chrome and standalone Agents reject omitted namespace before runtime',()=>{
 const source=fs.readFileSync(new URL('../src/app/layout.tsx',import.meta.url),'utf8');
 assert.ok(checkRootSiblingNamespaces().files>1);
 assert.throws(()=>checkRootSiblingNamespaces(undefined,source.replace('shortcuts:messages.shortcuts,','')),/Missing root-provider namespace shortcuts/);
 assert.ok(checkAgentNamespaces().files>1);
 assert.throws(()=>checkAgentNamespaces(undefined,['postMenu']),/Missing capture-provider namespace agents/);
 assert.throws(()=>checkAgentNamespaces(undefined,['agents']),/Missing capture-provider namespace postMenu/);
});
