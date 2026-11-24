# Original 18 test assertion audit

All 18 are the original tests in their original files. No test was replaced. The final original-nine-file run passed 24/24 (including the six originally passing tests): the original-nine-file test receipt (24/24).

Counts below are static assert call sites within each original test callback, including nested callbacks; unchanged shared fixture assertions are outside this count. Conditional branches and loops affect runtime executions. No assert call site was removed.

| Original test | File | Before | After |
|---|---|---:|---:|
| answered old IDs reconcile once on focus and settle through their user channel without a timer | tests/answer-readiness.test.mjs | 5 | 5 |
| source wording: all reference foods | tests/approved-source-copy.test.mjs | 6 | 6 |
| source wording: one estimate in a mixed meal | tests/approved-source-copy.test.mjs | 6 | 6 |
| source wording: closest record | tests/approved-source-copy.test.mjs | 6 | 6 |
| source wording: Open Food Facts barcode | tests/approved-source-copy.test.mjs | 6 | 6 |
| source wording: label and personal drink | tests/approved-source-copy.test.mjs | 6 | 6 |
| source wording: old unknown source | tests/approved-source-copy.test.mjs | 6 | 6 |
| parallel Home streams share one totals read and pass that snapshot into Feed | tests/home-day-totals.test.mjs | 6 | 6 |
| Home feed and Today each perform one read per render | tests/home-day-totals.test.mjs | 2 | 2 |
| when the shared read of today fails, the circles and the feed still get every total and the Today column keeps its browser fallback | tests/home-day-totals.test.mjs | 5 | 5 |
| questions share immutable thumbnail identities; media waits for events and account changes discard old reads | tests/needs-input-batch.test.mjs | 15 | 15 |
| a question inserted on another session reaches the strip through the user channel, with zero idle reads | tests/question-channel-discovery.test.mjs | 4 | 4 |
| ten simulated idle minutes with a pending meal cause no reads or redraws on Home and Days; day change still refreshes once | tests/readiness-cpu.test.mjs | 5 | 5 |
| readiness channels follow the authenticated account and release on sign-out and unmount | tests/readiness-cpu.test.mjs | 9 | 9 |
| reconnect catch-up runs once per reconnect after the first subscribe, with a 30-second per-tab gap and visible failure | tests/readiness-cpu.test.mjs | 9 | 9 |
| mounted readiness observer skips initial Home reloads but still refreshes an observed completion and other tabs | tests/readiness-refresh.test.mjs | 16 | 16 |
| Home settles an already-ready tracked meal when its first subscription connects, without another event or timer | tests/readiness-subscribe-gap.test.mjs | 4 | 4 |
| the meal header shows the words beside the pencil; its name says what it edits and its count (#1124, #1134) | tests/servings-words.test.mjs | 6 | 9 |

The one changed source-contract assertion binds the pencil label to servingText(saved) and its translated editServings key, replacing the old literal/servingsText source anchor. The existing tap-size, margin, pencil, failed-meal and English unit assertions remain. New English and Japanese label/amount goldens cover 0, 0.25, 1, 1.5 and 2; the separate ICU plural test covers raw counts 0/1/2 in both languages. Zero is below the valid input minimum; the unused servingsText export was removed under the planner 17:33 ruling. Fixed expected strings replace it as the English reference. The one English difference is out-of-range zero: 0 serving becomes 0 servings, below the valid minimum 0.1; valid inputs retain base wording. The old helper separate unit assertion now exercises the ICU message directly with fixed expectations; its assert call count is unchanged.

Assertion/source-anchor diff:

```diff
diff --git a/tests/servings-words.test.mjs b/tests/servings-words.test.mjs
index 7142f124..0ed84466 100644
--- a/tests/servings-words.test.mjs
+++ b/tests/servings-words.test.mjs
@@ -1,16 +1,27 @@
+import {createTranslator} from 'next-intl';
+import {englishIntl} from './fixtures/english-intl.mjs';
+import {servingsMessageValues} from '../src/i18n/servings.ts';
 import test from 'node:test';
 import assert from 'node:assert/strict';
 import {readFileSync} from 'node:fs';
-import {servingsText} from '../src/lib/posts/servings.ts';
 
 test('the servings control says serving for one or a part, servings above one (#1124)',()=>{
- for(const [value,want] of [[1,'1 serving'],[2,'2 servings'],[1.5,'1½ servings'],[0.5,'½ serving'],[0.25,'¼ serving'],[0.1,'0.1 servings'],[50,'50 servings'],[1.25,'1¼ servings']])assert.equal(servingsText(value),want,String(value));
+ const t=englishIntl.useTranslations('postMenu');
+ for(const [value,want] of [[0,'0 servings'],[1,'1 serving'],[2,'2 servings'],[1.5,'1½ servings'],[0.5,'½ serving'],[0.25,'¼ serving'],[0.1,'0.1 servings'],[50,'50 servings'],[1.25,'1¼ servings']])assert.equal(t('servingAmount',servingsMessageValues(value)),want,String(value));
 });
 test('the meal header shows the words beside the pencil; its name says what it edits and its count (#1124, #1134)',()=>{
  const source=readFileSync(new URL('../src/components/PostDetailHeader.tsx',import.meta.url),'utf8');
- const start=source.indexOf('aria-label={`Edit servings, ${servingsText(saved)}`}');assert.ok(start>0,'the accessible name includes the count and unit');
+ const t=englishIntl.useTranslations('postMenu');
+ for(const [value,expected] of[[0,'0 servings'],[0.25,'¼ serving'],[1,'1 serving'],[1.5,'1½ servings'],[2,'2 servings']])assert.equal(t('editServings',{amount:t('servingAmount',servingsMessageValues(value))}),`Edit servings, ${expected}`);
+ const jaMessages=JSON.parse(readFileSync(new URL('../messages/ja.json',import.meta.url),'utf8'));
+ const ja=createTranslator({locale:'ja',namespace:'postMenu',messages:jaMessages});
+ for(const value of[0,0.25,1,1.5,2]){
+  assert.equal(ja('servingAmount',servingsMessageValues(value)),servingsMessageValues(value).amount+'食分');
+  assert.equal(ja('editServings',{amount:ja('servingAmount',servingsMessageValues(value))}),`食分の数を編集、${servingsMessageValues(value).amount}食分`);
+ }
+ const start=source.indexOf("aria-label={t('editServings',{amount:servingText(saved)})}");assert.ok(start>0,'the accessible name includes the count and unit');
  const button=source.slice(start,source.indexOf('</button>',start));
- assert.ok(button.includes('>{servingsText(saved)} <span className="text-muted" aria-hidden>✎</span>'),button);
+ assert.ok(button.includes('>{servingText(saved)} <span className="text-muted" aria-hidden>✎</span>'),button);
  assert.ok(!button.includes('{servingsLabel(saved)} <span'));
  assert.match(button,/className="[^"]*\bmin-h-tap\b[^"]*"/,'the closed control meets the 44 px tap size');
  assert.match(button,/className="[^"]*-my-3\b[^"]*"/,'its margin keeps the header row height');
```
