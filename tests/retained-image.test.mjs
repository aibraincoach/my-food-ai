// node --import tsx --test tests/retained-image.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import {imageIdentity,retainedImageUrl} from '../src/lib/media/retained-image.ts';
test('new signing tokens keep the working immutable image while failures use the fresh capability',()=>{
 const first='https://storage.invalid/media/owner/photo.feed.jpg?token=old',fresh=first.replace('old','new');
 const read={path:imageIdentity(first),url:first,failed:false};
 assert.equal(retainedImageUrl(read,fresh),first);
 assert.equal(retainedImageUrl({...read,failed:true},fresh),fresh);
 assert.equal(retainedImageUrl(read,fresh.replace('/owner/','/other/')),fresh.replace('/owner/','/other/'));
 assert.equal(retainedImageUrl(read,fresh.replace('storage.invalid','different.invalid')),fresh.replace('storage.invalid','different.invalid'));
 assert.equal(retainedImageUrl(read,fresh.replace('photo.feed','correction.feed')),fresh.replace('photo.feed','correction.feed'));
 assert.equal(retainedImageUrl({path:imageIdentity(fresh),url:fresh,failed:false},fresh+'&new-signature=1'),fresh);
});
