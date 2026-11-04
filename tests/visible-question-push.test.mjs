// node --import tsx --test tests/visible-question-push.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import Module, { createRequire } from 'node:module';

test('beside-meal question push uses the needs-a-reply gate on posts.question', async () => {
  const originalLoad = Module._load;
  const delivered = [];
  Module._load = function (name, ...args) {
    if (name === 'web-push') return { sendNotification: async (_subscription, payload) => delivered.push(JSON.parse(payload)) };
    return originalLoad.call(this, name, ...args);
  };
  let sendPostPush;
  try { ({ sendPostPush } = createRequire(import.meta.url)('../src/lib/push/send.ts')); } finally { Module._load = originalLoad; }
  const names = ['NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT'];
  const previous = names.map((name) => process.env[name]);
  for (const name of names) process.env[name] = 'fixture';
  try {
    const subscription = [{ id: 's', endpoint: 'https://fcm.googleapis.com/fixture', keys: { p256dh: 'A'.repeat(87), auth: 'A'.repeat(22) } }];
    const admin = (row) => ({
      from(table) {
        const data = table === 'posts' ? row : subscription;
        const q = { select() { return q; }, eq() { return q; }, order() { return q; }, limit() { return q; }, maybeSingle() { return q; }, then(resolve) { return Promise.resolve({ data, error: null }).then(resolve); } };
        return q;
      },
      storage: { from: () => { throw new Error('a push must not sign or read any storage object'); } },
    });
    delivered.length = 0;
    await sendPostPush(admin({ user_id: 'owner', status: 'ready', needs_input: null, question: { question: 'Which beer is it?' } }), 'p', 'Which beer is it?');
    assert.equal(delivered.length, 1);
    assert.equal(delivered[0].title, 'Your meal needs a reply');
    assert.deepEqual(Object.keys(delivered[0]).sort(), ['postId', 'title']);

    delivered.length = 0;
    await sendPostPush(admin({ user_id: 'owner', status: 'ready', needs_input: null, question: { question: 'Which beer is it?' } }), 'p', 'A different question');
    assert.equal(delivered.length, 0);

    delivered.length = 0;
    await sendPostPush(admin({ user_id: 'owner', status: 'ready', question: null }), 'p', 'Which beer is it?');
    assert.equal(delivered.length, 0);
  } finally {
    names.forEach((name, i) => { if (previous[i] === undefined) delete process.env[name]; else process.env[name] = previous[i]; });
  }
});
