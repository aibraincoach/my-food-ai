import test from 'node:test';
import assert from 'node:assert/strict';
import {formatModelCommentLabels} from '../src/lib/posts/comment-label.ts';

test('legacy heading normalizes without changing the recorded quantity or consumed summary',()=>{
 const body='Not eaten: 100 g · 157 kcal. Consumed: 0 g · 0 kcal.';
 assert.equal(formatModelCommentLabels(body),'Leftovers · not eaten: 100 g · 157 kcal. Consumed: 0 g · 0 kcal.');
});
test('actual already-prefixed model reply remains identical and normalization is idempotent',()=>{
 const body='Leftovers · not eaten: 100 g · 157 kcal. Consumed: 0 g · 0 kcal.';
 assert.equal(formatModelCommentLabels(body),body);
 assert.equal(formatModelCommentLabels(formatModelCommentLabels(body)),body);
 const multiline='Correction\n  not eaten: 50 g\nConsumed: 50 g';
 assert.equal(formatModelCommentLabels(formatModelCommentLabels(multiline)),formatModelCommentLabels(multiline));
});
test('ordinary sentences and user wording are not rewritten as display headings',()=>{
 for(const body of ['The food was not eaten: it was shared.','I left leftovers · not eaten: please keep this wording.','No food was eaten.'])assert.equal(formatModelCommentLabels(body),body);
});
