import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checkWording} from '../src/lib/pipeline/wording-check.ts';
const baseline=JSON.parse(readFileSync(new URL('./fixtures/wording-en-baseline.json',import.meta.url),'utf8'));
const japanese=JSON.parse(readFileSync(new URL('./fixtures/wording-ja.json',import.meta.url),'utf8'));
test('English hits preserve the frozen main word-rule cases',()=>{
 for(const row of baseline.cases)assert.deepEqual(checkWording(row.text,'en').hits,row.hits,row.text);
});
for(const [index,row] of japanese.entries())test('PM Japanese lexical sample '+(index+1)+' '+row.expect,()=>{
 assert.equal(checkWording(row.text,'ja').ok,row.expect==='pass',row.text);
});
test('Japanese also checks English words while preserving food-name word boundaries',()=>{
 assert.deepEqual(checkWording('今日のgoalは2000 kcal','ja').hits,['goal']);
 assert.equal(checkWording('Spring rollsとごはん','ja').ok,true);
});
test('NFKC removes Japanese whitespace but punctuation stays a boundary',()=>{
 assert.equal(checkWording('目・標','ja').ok,true);
 assert.equal(checkWording('ごはんを食べ、きれいに飲みました。','ja').ok,true);
 assert.equal(checkWording('ア ド バ イ ス','ja').ok,false);
 assert.equal(checkWording('ｱﾄﾞﾊﾞｲｽ','ja').ok,false);
 assert.equal(checkWording('食べ残し。残り100 kcal','ja').ok,false);
 assert.equal(checkWording('食べ残し','ja').ok,true);
});
test('unknown or omitted wording locale fails instead of falling back to English',()=>{
 assert.throws(()=>checkWording('a fact','fr'),/locale/i);
 assert.throws(()=>checkWording('a fact'),/locale/i);
});

test('approved food names are masked without hiding an adjacent banned phrase',()=>{
 for(const name of ['オニオンリング','ダンプリング','スプリングロール','スプリングオニオン','イカリング','パイナップルリング']){
  assert.equal(checkWording(name+'を食べました。','ja').ok,true,name);
  assert.equal(checkWording(name+'リングが完成しました。','ja').ok,false,name);
 }
 for(const fact of ['全部食べきりました。','ごはんは食べきれませんでした。','食べ残しは500 kcal分あります。','スープより麺の方が多く食べました。','食べ方がきれいです。','片方が空でした。','両方が混ざっていました。'])assert.equal(checkWording(fact,'ja').ok,true,fact);
 for(const text of ['のこりは600 kcalです。','ノコリは600 kcalです。','ごはんが少しのこっています。','ごはんがノコッています。','野菜を食べた方がいいです。','野菜を食べた方が良いです。','水を飲んだ方が好ましいです。','野菜を食べた方が望ましいです。','水を飲んで下さい。','水を飲んでください。'])assert.equal(checkWording(text,'ja').ok,false,text);
});

test('English normalizes compatibility forms before word matching',()=>{assert.deepEqual(checkWording('ＧＯＡＬ','en').hits,['goal']);});

test('approved phrases mask longest first and never join banned fragments across them',async()=>{
 const {wordingRules,wordingHits}=await import('../src/lib/wording/check.ts');
 const rules=wordingRules({match:'substring',banned:['禁止','不可'],allow:['禁止食品','禁止食品不可'],notes:[]});
 assert.deepEqual(wordingHits('禁止食品不可',rules),[]);
 assert.deepEqual(wordingHits('禁止食品不可禁止',rules),['禁止']);
 assert.deepEqual(wordingHits('禁禁止食品不可止',rules),[]);
 assert.throws(()=>wordingRules({...rules,allow:['禁']}),/whole phrases/);
});
test('the inventory uses the same unchanged English banned phrases',async()=>{
 const {BANNED,bannedHits}=await import('../scripts/wording-inventory.mjs');
 assert.deepEqual(BANNED,baseline.banned);
 for(const row of baseline.cases)assert.deepEqual(bannedHits(row.text),row.hits,row.text);
});
