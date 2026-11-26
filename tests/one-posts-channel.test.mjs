// node --test tests/one-posts-channel.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';

// #1095: the tab's one channel (PostReadinessListener) announces every change to the owner's posts as post-readiness.
// No card, upload card or meal page opens a posts channel of its own. Feed's one feed-inserts channel stays: it is per
// tab, not per post, and carries its own reconnect catch-up (#1096).
const read=name=>readFileSync(new URL(`../src/components/${name}.tsx`,import.meta.url),'utf8');
test('only the tab listener and the feed opens a channel on posts',()=>{
  const owners=readdirSync(new URL('../src/components/',import.meta.url)).filter(file=>file.endsWith('.tsx'))
    .filter(file=>/\.channel\([^)]*\)\s*\.on\(\s*["']postgres_changes["'],\s*\{[^}]*table:\s*["']posts["']/s.test(read(file.slice(0,-4))))
    .sort();
  assert.deepEqual(owners,['Feed.tsx','PostReadinessListener.tsx']);
  assert.equal([...read('Feed').matchAll(/\.channel\(/g)].length,1,'Feed keeps only feed-inserts');
});
test('the card, the upload card and the meal page listen for this post\'s post-readiness',()=>{
  for(const name of ['RealtimePost','OutlineOverlay'])assert.match(read(name),/addEventListener\(["']post-readiness["'],\s*changed\)/,name);
  const feed=read('Feed');const card=feed.slice(feed.indexOf('function UploadHydratedCard('));
  assert.match(card.slice(0,card.indexOf('\n}\n')),/addEventListener\('post-readiness',changed\)/);
});
test('a deletion reaches the meal page by post-deleted in this tab and by a read on return (#1095)',()=>{
  const overlay=read('OutlineOverlay');
  assert.match(overlay,/addEventListener\("post-deleted", deleted\)/);
  assert.match(overlay,/const deleted = \(event: Event\) => \{ if \(\(event as CustomEvent<\{id\?: string\}>\)\.detail\?\.id === postId\) router\.replace\("\/"\); \};/);
  assert.match(overlay,/const stopReturn = onTabReturn\(/,'the return read is not limited to an updating meal');
  assert.match(overlay,/if \(!data\) \{ router\.replace\("\/"\); return; \}/);
  assert.match(read('NeedsInputStrip'),/if\(response\.ok\)\{remove\(post\.id\);if\(post\.held\)window\.dispatchEvent\(new CustomEvent\('post-deleted',\{detail:\{id:post\.id\}\}\)\);\}/);
});
