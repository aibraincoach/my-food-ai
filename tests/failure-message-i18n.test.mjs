import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{createTranslator}from'next-intl';import{failureMessageKey}from'../src/lib/worker/failure-message.ts';
const rows=[['fdc: PRIVATE','failureDatabaseBusy','The food database was busy. Try again in a minute.','食品データベースが混み合っていました。1分ほど待ってから、もう一度お試しください。'],['meta: PRIVATE','failureAnalysisRefused','The analysis service refused this request. Try again.','解析サービスがこのリクエストを拒否しました。もう一度お試しください。'],['PRIVATE','failureMeal','This meal could not be analysed. Please try again.','この食事を解析できませんでした。もう一度お試しください。']];
for(const locale of['en','ja'])test('failed-meal prefix copy in '+locale+' preserves privacy and fixed goldens',()=>{
 const messages=JSON.parse(fs.readFileSync(new URL('../messages/'+locale+'.json',import.meta.url))),t=createTranslator({locale,messages:messages.post,onError:e=>{throw e;}});
 for(const[reason,key,en,ja]of rows){assert.equal(failureMessageKey(reason),key);const text=t(key);assert.equal(text,locale==='en'?en:ja);assert.doesNotMatch(text,/PRIVATE/);}
 assert.equal(failureMessageKey(null),'failureMeal');assert.equal(failureMessageKey(undefined),'failureMeal');
});
