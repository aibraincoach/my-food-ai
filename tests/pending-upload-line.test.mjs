import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pendingUploadLine,PHOTO_NOT_POSTED} from '../src/lib/posts/pending-upload-line.ts';

test('a new readable photo failure names its Try again and Delete controls',()=>{
 assert.equal(pendingUploadLine({state:'failed'}),'Not posted yet. Try again, or delete it.');
 assert.doesNotMatch(PHOTO_NOT_POSTED,/phone|kept|saved/i);
 assert.equal(pendingUploadLine({state:'uploading'}),'Uploading photo…');
});
test('a new lost photo names Delete this post and never the chip’s Remove or an ignored retry',()=>{
 for(const kind of [undefined,'drink'])assert.equal(pendingUploadLine({kind,state:'failed',photoLost:true}),'Photo lost. Delete this post.');
 const card=readFileSync(new URL('../src/components/PostCard.tsx',import.meta.url),'utf8');
 assert.match(card,/upload\.state==='failed'&&!upload\.photoLost&&!upload\.previewUrl&&/);
});
test('a lost added or leftovers photo names only the photo, never deletion of the posted meal',()=>{
 for(const notEaten of [false,true])assert.equal(pendingUploadLine({state:'failed',photoLost:true,attachment:{postId:'posted-meal',notEaten}}),'Photo lost. Delete this photo.');
});
test('an added or leftovers photo failure never claims the existing meal is not posted',()=>{
 for(const notEaten of [false,true])assert.equal(pendingUploadLine({state:'failed',attachment:{postId:'posted-meal',notEaten}}),'Photo not uploaded yet. Try again, or delete this photo.');
});
test('a failed caption keeps AGY’s retention sentence',()=>{
 assert.equal(pendingUploadLine({state:'failed',text:true}),'Could not confirm the save. Your caption is kept on this phone.');
 assert.equal(pendingUploadLine({state:'uploading',text:true}),'Posting caption…');
});
test('failed selections keep AGY’s retention sentence and ordinary in-flight labels',()=>{
 for(const kind of ['drink','copy','food'])assert.equal(pendingUploadLine({kind,state:'failed'}),'Could not confirm the save. Your selection is kept on this phone.');
 assert.deepEqual(['drink','copy','food'].map(kind=>pendingUploadLine({kind,state:'uploading'})),['Saving drink…','Saving copy…','Saving food…']);
 assert.equal(pendingUploadLine({kind:'food',state:'uploading',removing:true}),'Removing pending post…');
});
test('the card delegates the line and the chip’s words remain separate and unchanged',()=>{
 const card=readFileSync(new URL('../src/components/PostCard.tsx',import.meta.url),'utf8');assert.match(card,/\{pendingUploadLine\(upload\)\}/);assert.doesNotMatch(card,/The photo is kept on this phone/);
 const manager=readFileSync(new URL('../src/lib/posts/upload-manager.ts',import.meta.url),'utf8');assert.match(manager,/PHOTO_NOT_KEPT = 'This photo was not kept\. Remove this post and take a new photo\.'/);
});
