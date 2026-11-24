import {englishIntl} from './fixtures/english-intl.mjs';
import {servingsMessageValues} from '../src/i18n/servings.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {servingsText} from '../src/lib/posts/servings.ts';

test('the servings control says serving for one or a part, servings above one (#1124)',()=>{
 for(const [value,want] of [[1,'1 serving'],[2,'2 servings'],[1.5,'1½ servings'],[0.5,'½ serving'],[0.25,'¼ serving'],[0.1,'0.1 servings'],[50,'50 servings'],[1.25,'1¼ servings']])assert.equal(servingsText(value),want,String(value));
});
test('the meal header shows the words beside the pencil; its name says what it edits and its count (#1124, #1134)',()=>{
 const source=readFileSync(new URL('../src/components/PostDetailHeader.tsx',import.meta.url),'utf8');
 const t=englishIntl.useTranslations('postMenu');
 for(const value of[0.25,1,1.5,2])assert.equal(t('editServings',{amount:t('servingAmount',servingsMessageValues(value))}),`Edit servings, ${servingsText(value)}`);
 const start=source.indexOf("aria-label={t('editServings',{amount:servingText(saved)})}");assert.ok(start>0,'the accessible name includes the count and unit');
 const button=source.slice(start,source.indexOf('</button>',start));
 assert.ok(button.includes('>{servingText(saved)} <span className="text-muted" aria-hidden>✎</span>'),button);
 assert.ok(!button.includes('{servingsLabel(saved)} <span'));
 assert.match(button,/className="[^"]*\bmin-h-tap\b[^"]*"/,'the closed control meets the 44 px tap size');
 assert.match(button,/className="[^"]*-my-3\b[^"]*"/,'its margin keeps the header row height');
 assert.doesNotMatch(source,/aria-label="Edit servings"/);
});
test('a failed meal does not show the servings control (#1124)',()=>{
 const source=readFileSync(new URL('../src/components/PostDetail.tsx',import.meta.url),'utf8');
 assert.match(source,/const showServings=detail\.post\.analysis_initialized_at!=null&&!detail\.isDrink&&detail\.post\.status!=='failed';/);
});
