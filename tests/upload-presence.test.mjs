import test from 'node:test';
import assert from 'node:assert/strict';

test('memory presence starts empty and the real manager registers a live reader', async () => {
 const {hasMemoryUploads} = await import('../src/lib/posts/upload-presence.ts');
 assert.equal(hasMemoryUploads(), false);
 const {uploadManager} = await import('../src/lib/posts/upload-manager.ts');
 const list = uploadManager.list;
 try {
  uploadManager.list = () => [];
  assert.equal(hasMemoryUploads(), false);
  uploadManager.list = () => [{id:'pending'}];
  assert.equal(hasMemoryUploads(), true);
  uploadManager.list = () => [{id:'posted',postId:'meal'}];
  assert.equal(hasMemoryUploads(), false);
 } finally { uploadManager.list = list; }
});
