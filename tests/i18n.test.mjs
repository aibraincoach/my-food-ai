import test from 'node:test';
import assert from 'node:assert/strict';
import {checkMessages,readMessages} from '../scripts/check-messages.mjs';
import {resolveLocale} from '../src/i18n/locales.ts';
import {formatNumber,formatDate} from '../src/i18n/format.ts';
import {onError,getMessageFallback} from '../src/i18n/strict.ts';
import {createTranslator} from 'next-intl';
import {ESLint} from 'eslint';

const sample=()=>({en:{button:'Save',items:'{count, plural, one {# item} other {# items}}'},ja:{button:'保存',items:'{count, plural, other {#件}}'}});
test('all real files pass and Japanese plural categories may differ',()=>{
 assert.equal(checkMessages(readMessages()).keys,143);
 assert.equal(checkMessages(sample()).keys,2);
});
for(const fault of ['missing','extra','empty','notString','placeholder','argumentType','selectOptions','invalidIcu','noJapanese']) {
 test(`message validation refuses ${fault}`,()=>{
  const value=sample();
  if(fault==='missing')delete value.ja.button;
  if(fault==='extra')value.ja.extra='追加';
  if(fault==='empty')value.ja.button='  ';
  if(fault==='notString')value.ja.button=9;
  if(fault==='placeholder')value.ja.items='{amount, plural, other {#件}}';
  if(fault==='argumentType')value.ja.items='{count}';
  if(fault==='selectOptions'){value.en.items='{choice, select, yes {Yes} other {No}}';value.ja.items='{choice, select, no {いいえ} other {はい}}';}
  if(fault==='invalidIcu')value.en.items=value.ja.items='{broken';
  if(fault==='noJapanese')delete value.ja;
  assert.throws(()=>checkMessages(value));
 });
}
test('ICU nested arguments and rich-text tags cannot drift',()=>{
 const input={en:{x:'<strong>{n, plural, other {{name}}}</strong>'},ja:{x:'<strong>{n, plural, other {{person}}}</strong>'}};
 assert.throws(()=>checkMessages(input),/ICU mismatch/);
 input.ja.x='<b>{n, plural, other {{name}}}</b>';
 assert.throws(()=>checkMessages(input),/ICU mismatch/);
});
test('cookie overrides weighted supported phone language; otherwise the stated default is English',()=>{
 assert.equal(resolveLocale('ja','en-US'),'ja');
 assert.equal(resolveLocale('en','ja-JP'),'en');
 assert.equal(resolveLocale(undefined,'en;q=0.5,ja-JP;q=0.9'),'ja');
 assert.equal(resolveLocale('xx','de,ja;q=0.7'),'ja');
 assert.equal(resolveLocale(undefined,'ja;q=0,en;q=0.5'),'en');
 assert.equal(resolveLocale(undefined,'ja;q=NaN,fr'),'en');
 assert.equal(resolveLocale(undefined,null),'en');
});
test('strict next-intl hooks throw for missing keys and malformed ICU instead of displaying fallback text',()=>{
 const t=createTranslator({locale:'ja',messages:{ok:'保存',broken:'{bad'},onError,getMessageFallback});
 assert.equal(t('ok'),'保存');
 assert.throws(()=>t('missing'));
 // Supplying values exercises ICU parsing; without them the library's
 // string fast path returns the raw string. Build validation rejects it first.
 assert.throws(()=>t('broken',{}));
 const error=new Error('lost message');assert.throws(()=>getMessageFallback({error}),e=>e===error);
});
test('format helpers use the chosen locale and explicit zone with no implicit server zone',()=>{
 assert.equal(formatNumber('ja',1234.5),new Intl.NumberFormat('ja').format(1234.5));
 const date=new Date('2026-11-22T18:00:00Z'),options={dateStyle:'long'};
 assert.equal(formatDate('ja',date,'Asia/Tokyo',options),'2026年11月23日');
 assert.equal(formatDate('en',date,'UTC',options),'November 22, 2026');
});
test('converted-scope lint rejects JSX text, attributes and visible error strings',async()=>{
 const eslint=new ESLint();
 const cases=[
  ['jsx','export default function X(){return <span>Fixed label</span>;}','react/jsx-no-literals'],
  ['attribute','export default function X(){return <input aria-label="Fixed label"/>;}','messages/no-fixed-text'],
  ['placeholder','export default function X(){return <input placeholder={`Fixed label`}/>;}','messages/no-fixed-text'],
  ['error',"setError('Fixed error');",'messages/no-fixed-text'],
  ['json',"NextResponse.json({error:'Fixed error'});",'messages/no-fixed-text'],
 ];
 for(const [name,source,rule] of cases){
  const [result]=await eslint.lintText(source,{filePath:'src/components/i18n/Probe.tsx'});
  assert.ok(result.messages.some(m=>m.ruleId===rule),name);
 }
 const [good]=await eslint.lintText("export default function X(){const t=useTranslations('language');return <input aria-label={t('label')}/>;}",{filePath:'src/components/i18n/Probe.tsx'});
 assert.ok(!good.messages.some(m=>m.ruleId==='messages/no-fixed-text'||m.ruleId==='react/jsx-no-literals'));
});
