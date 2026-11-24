import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createTranslator} from 'next-intl';
import {servingsMessageValues} from '../src/i18n/servings.ts';
import {servingsText} from '../src/lib/posts/servings.ts';
import {onError,getMessageFallback} from '../src/i18n/strict.ts';
import {checkCaptureNamespaces} from '../scripts/check-capture-namespaces.mjs';
import {readingLintTargets} from '../scripts/eslint-i18n.mjs';
import {ESLint} from 'eslint';
const dict=Object.fromEntries(['en','ja'].map(locale=>[locale,JSON.parse(fs.readFileSync(new URL('../messages/'+locale+'.json',import.meta.url),'utf8'))]));
const translator=(locale,namespace)=>createTranslator({locale,messages:dict[locale][namespace],onError,getMessageFallback});

test('servings English is identical for every existing glyph/decimal form and Japanese keeps quantities',()=>{
 const en=translator('en','postMenu'),ja=translator('ja','postMenu');
 for(const value of[0.1,0.25,0.33,0.5,0.67,0.75,1,1.25,1.5,2,2.1,12,50]){
  const values=servingsMessageValues(value);
  assert.equal(en('servingAmount',values),servingsText(value));
  assert.equal(ja('servingAmount',values),values.amount+'食分');
 }
});
test('counted reading messages keep 0/1/2 and their English wording in each locale',()=>{
 for(const locale of['en','ja'])for(const count of[0,1,2]){
  const t=translator(locale,'thread'),p=translator(locale,'post');
  const label=t.rich('commentsCount',{count,amount:String(count),number:chunks=>chunks});
  assert.equal(label,locale==='en'?`Comments ${count}`:`コメント ${count}`);
  assert.equal(p('showAll',{count,amount:String(count)}),locale==='en'?`Show all ${count}`:`すべて表示（${count}）`);
 }
});
test('drink totals retain exact base sentence and unknown qualifier in all four combinations',()=>{
 for(const alcoholState of['other','present'])for(const unavailableState of['other','yes']){
  const values={ml:'750',caffeine:'80',alcohol:'14',alcoholState,unavailableState};
  const en=translator('en','postMenu')('drinkTodaySummary',values),ja=translator('ja','postMenu')('drinkTodaySummary',values);
  assert.equal(en,'Today: 750 ml · 80 mg caffeine'+(alcoholState==='present'?' · 14 g alcohol':'')+(unavailableState==='yes'?' · alcohol unavailable':''));
  assert.equal(ja,'今日：750 ml · カフェイン 80 mg'+(alcoholState==='present'?' · アルコール 14 g':'')+(unavailableState==='yes'?' · アルコール量は不明':''));
 }
});
for(const missing of['post','postMenu','thread'])test('source graph rejects missing reading namespace '+missing,()=>{
 const supplied=['navigation','errors','card','capture','feed','post','postMenu','thread'].filter(namespace=>namespace!==missing);
 assert.throws(()=>checkCaptureNamespaces(undefined,undefined,supplied),new RegExp('Missing capture-provider namespace '+missing+' for'));
});
test('each converted reading file rejects a planted visible literal',async()=>{
 const eslint=new ESLint();
 for(const filePath of readingLintTargets){
  const [result]=await eslint.lintText("function probe(){setError('Untranslated fixed failure');}",{filePath});
  assert.ok(result.messages.some(message=>message.ruleId==='messages/no-fixed-text'),filePath);
 }
});
