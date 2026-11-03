import test from 'node:test';
import assert from 'node:assert/strict';
import {beginBookmark,finishBookmark} from '../src/lib/posts/save-optimistic.ts';
test('save selection changes synchronously and blocks a repeated tap',()=>{const next=beginBookmark({id:null,pending:false});assert.equal(next.id,'pending');assert.equal(next.pending,true);assert.equal(beginBookmark(next),next);});
test('failed save returns previous selection, successful save retains server id',()=>{const before={id:'saved-id',pending:false};assert.equal(beginBookmark(before).id,null);assert.deepEqual(finishBookmark(before,null,true),before);assert.deepEqual(finishBookmark({id:null,pending:false},'new-id'),{id:'new-id',pending:false});});
