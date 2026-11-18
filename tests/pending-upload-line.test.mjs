// node --import tsx --test tests/pending-upload-line.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pendingUploadLine,PHOTO_NOT_POSTED} from '../src/lib/posts/pending-upload-line.ts';
import {PHOTO_NOT_KEPT} from '../src/lib/posts/upload-manager.ts';

// #1075: a failed photo no longer claims the photo is kept on this phone; every other line is unchanged.
test('a failed photo says what to do, not where the photo is kept',()=>{
  assert.equal(pendingUploadLine({state:'failed'}),PHOTO_NOT_POSTED);
  assert.doesNotMatch(PHOTO_NOT_POSTED,/phone|kept|saved/i);
  assert.equal(pendingUploadLine({state:'uploading'}),'Uploading photo…');
  assert.equal(pendingUploadLine({state:'failed',text:true}),'Could not confirm the save. Your caption is kept on this phone.');
  assert.equal(pendingUploadLine({state:'uploading',text:true}),'Posting caption…');
  assert.equal(pendingUploadLine({kind:'food',state:'failed'}),'Could not confirm the save. Your selection is kept on this phone.');
  assert.deepEqual(['drink','copy','food'].map(kind=>pendingUploadLine({kind,state:'uploading'})),['Saving drink…','Saving copy…','Saving food…']);
  assert.equal(pendingUploadLine({kind:'food',state:'uploading',removing:true}),'Removing pending post…');
});
test('the card shows the shared line and keeps no copy of the old sentence',()=>{
  const card=readFileSync(new URL('../src/components/PostCard.tsx',import.meta.url),'utf8');
  assert.match(card,/\{pendingUploadLine\(upload\)\}/);
  assert.doesNotMatch(card,/The photo is kept on this phone/);
});
test('a photo that was not kept shows AGY\'s not-kept line and the card offers no retry (#1093)',()=>{
  assert.equal(pendingUploadLine({state:'failed',photoLost:true}),PHOTO_NOT_KEPT);
  assert.equal(pendingUploadLine({kind:'drink',state:'failed',photoLost:true}),PHOTO_NOT_KEPT);
  assert.doesNotMatch(PHOTO_NOT_KEPT,/try again|retry/i);
  const card=readFileSync(new URL('../src/components/PostCard.tsx',import.meta.url),'utf8');
  assert.match(card,/upload\.state==='failed'&&!upload\.photoLost&&!upload\.previewUrl&&/);
});
