import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {servingsText} from '../src/lib/posts/servings.ts';

test('the servings control says serving for one or a part, servings above one (#1124)',()=>{
 for(const [value,want] of [[1,'1 serving'],[2,'2 servings'],[1.5,'1½ servings'],[0.5,'½ serving'],[0.25,'¼ serving'],[0.1,'0.1 serving'],[50,'50 servings'],[1.25,'1¼ servings']])assert.equal(servingsText(value),want,String(value));
});
test('the meal header shows the words beside the pencil and keeps its accessible name (#1124)',()=>{
 const source=readFileSync(new URL('../src/components/PostDetailHeader.tsx',import.meta.url),'utf8');
 const button=source.slice(source.indexOf('aria-label="Edit servings"'),source.indexOf('</button>',source.indexOf('aria-label="Edit servings"')));
 assert.ok(button.includes('>{servingsText(saved)} <span className="text-muted" aria-hidden>✎</span>'),button);
 assert.ok(!button.includes('{servingsLabel(saved)} <span'));
});
test('a failed meal does not show the servings control (#1124)',()=>{
 const source=readFileSync(new URL('../src/components/PostDetail.tsx',import.meta.url),'utf8');
 assert.match(source,/const showServings=detail\.post\.analysis_initialized_at!=null&&!detail\.isDrink&&detail\.post\.status!=='failed';/);
});
