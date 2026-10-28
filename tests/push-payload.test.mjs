// node --import tsx --test tests/push-payload.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import Module, { createRequire } from 'node:module';

test('a push carries generic text only: no question, image or meal content', async () => {
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
    for (const [status, question] of [['ready', undefined], ['needs_input', 'How much rice did you eat?']]) {
      delivered.length = 0;
      const touched = [];
      const admin = {
        from(table) {
          touched.push(table);
          const data = table === 'posts' ? { user_id: 'owner', status, needs_input: question ? { question } : null }
            : [{ id: 's', endpoint: 'https://fcm.googleapis.com/fixture', keys: { p256dh: 'A'.repeat(87), auth: 'A'.repeat(22) } }];
          const q = { select() { return q; }, eq() { return q; }, order() { return q; }, limit() { return q; }, maybeSingle() { return q; }, then(resolve) { return Promise.resolve({ data, error: null }).then(resolve); } };
          return q;
        },
        storage: { from: () => { throw new Error('a push must not sign or read any storage object'); } },
      };
      await sendPostPush(admin, 'meal', question);
      assert.equal(delivered.length, 1);
      assert.deepEqual(Object.keys(delivered[0]).sort(), ['postId', 'title']);
      assert.ok(!JSON.stringify(delivered[0]).includes('rice'), 'the question text must not be in the payload');
      assert.ok(!touched.includes('post_media'), 'no media is read for a notification');
    }
  } finally {
    names.forEach((name, i) => { if (previous[i] === undefined) delete process.env[name]; else process.env[name] = previous[i]; });
  }
});
