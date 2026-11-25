import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectLocaleFormats,checkLocaleFormats} from '../scripts/check-locale-formats.mjs';
for(const [name,source] of [
 ['fixed number locale',`new Intl.NumberFormat('en-US').format(1200)`],
 ['fixed date locale',`date.toLocaleDateString("en-US")`],
 ['number without locale','amount.toLocaleString()'],
 ['date without locale','date.toLocaleDateString()'],
 ['time without locale','date.toLocaleTimeString()'],
 ['unmarked English writer',"const locale='en';"]
])test('format guard rejects '+name,()=>assert.equal(inspectLocaleFormats(source,'src/lib/probe.ts').failures.length,1));
test('active locale, format boundary and annotated stored English remain allowed',()=>{
 assert.deepEqual(inspectLocaleFormats('amount.toLocaleString(locale); date.toLocaleTimeString(locale);','src/lib/probe.ts').failures,[]);
 assert.deepEqual(inspectLocaleFormats("new Intl.NumberFormat('en-US')",'src/i18n/format.ts').failures,[]);
 const result=inspectLocaleFormats("// Stored reply boundary #1219\nconst locale='en';",'src/lib/probe.ts');assert.deepEqual(result.failures,[]);assert.equal(result.allowed.length,1);
});
test('all source files obey locale boundaries; list each allowed English writer',()=>{
 const result=checkLocaleFormats();for(const row of result.allowed)console.log(JSON.stringify(row));assert.deepEqual(result.failures,[]);
});
