import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{checkErrorDisplays,checkAllErrorDisplays}from'../scripts/check-error-displays.mjs';
test('bookmark notice and thread/card retry state have one key-only display path',()=>{
 for(const [file,raw]of[['PostActions','notice.message'],['Thread','error.message'],['PostCard','retryError.message']]){
  const source=fs.readFileSync('src/components/'+file+'.tsx','utf8');assert.equal(source.includes(raw),false);assert.equal(source.includes('{message:string}'),false);
 }
 const thread=fs.readFileSync('src/components/Thread.tsx','utf8');
 assert.match(thread,/failureReason:post.fail_reason\?\?null/);
 assert.match(thread,/tp\(failureMessageKey\(error.failureReason\)\)/,'the reason-specific worker failure key is rendered with the viewer translator');
 const actions=fs.readFileSync('src/components/PostActions.tsx','utf8');
 assert.match(actions,/setNoticeError\(\{key:d.messageKey\?\?'cannotSave'\}\)/);
 assert.ok(checkErrorDisplays('setNoticeError({message:detail.message})').length,'bookmark setter now belongs to error-sink guard');
 assert.deepEqual(checkAllErrorDisplays().failures,[]);
});
