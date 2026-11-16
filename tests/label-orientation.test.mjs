// node --import tsx --test tests/label-orientation.test.mjs
// A phone label photo stored landscape with EXIF orientation 6 is cropped in its upright frame.
// No database, live model call or API key: fetch is stubbed and only /responses is answered.
import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';

async function rotatedLabelPhoto() {
  // Stored 200x100; orientation 6 shows it upright as 100x200. The stored left 50 columns are red,
  // which become the top 50 rows once rotated. Everything else is blue.
  const red = await sharp({ create: { width: 50, height: 100, channels: 3, background: { r: 255, g: 0, b: 0 } } }).png().toBuffer();
  return sharp({ create: { width: 200, height: 100, channels: 3, background: { r: 0, g: 0, b: 255 } } })
    .composite([{ input: red, left: 0, top: 0 }]).jpeg({ quality: 95 }).withMetadata({ orientation: 6 }).toBuffer();
}

test('a rotation-6 label photo is read upright and cropped at the label', async () => {
  const photo = await rotatedLabelPhoto();
  const stored = await sharp(photo).metadata();
  assert.deepEqual([stored.width, stored.height, stored.orientation], [200, 100, 6]);

  const keys = ['MODEL_API_KEY', 'MODEL_API_BASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SECRET_KEY'];
  const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  process.env.MODEL_API_KEY = 'fixture-not-a-secret';
  process.env.MODEL_API_BASE_URL = 'http://label-fixture.invalid/v1';
  delete process.env.NEXT_PUBLIC_SUPABASE_URL; delete process.env.SUPABASE_SECRET_KEY; // trace write fails closed, no DB
  const sent = [], other = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input instanceof Request ? input.url : input);
    if (!url.endsWith('/responses')) { other.push(url); throw new Error('unexpected request'); }
    sent.push(JSON.parse(init.body));
    // The first reading misses protein and points at the top band of the upright photo, forcing the crop retry.
    const reading = {
      is_label: true, serving: { amount: 40, unit: 'g' }, product_name: 'Fixture',
      per_serving: { kcal: 200, protein_g: sent.length === 1 ? null : 7, carbs_g: 30, fat_g: 5, fibre_g: null, sugar_g: null, sodium_mg: null },
      box: { x: 0.2, y: 0.05, w: 0.6, h: 0.1 },
    };
    return Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(reading) }] }] });
  };
  try {
    const { readNutritionLabel } = await import('../src/lib/meta/label.ts');
    const reading = await readNutritionLabel(new Uint8Array(photo));
    assert.equal(sent.length, 2, 'the crop retry ran');
    assert.deepEqual(other, [], 'no request left the model stub');
    assert.equal(reading.per_serving.protein_g, 7);

    const images = await Promise.all(sent.map(async body => {
      const buffer = Buffer.from(body.input[0].content[0].image_url.split(',')[1], 'base64');
      const meta = await sharp(buffer).metadata();
      const [r, , b] = (await sharp(buffer).stats()).channels.map(channel => channel.mean);
      return { width: meta.width, height: meta.height, r, b };
    }));
    assert.deepEqual([images[0].width, images[0].height], [100, 200], 'first read sees the upright portrait');
    const crop = images[1];
    assert.ok(crop.width > crop.height, `crop ${crop.width}x${crop.height} is the wide label band`);
    assert.ok(crop.width >= 70 && crop.width <= 75 && crop.height >= 22 && crop.height <= 27, `crop ${crop.width}x${crop.height}`);
    assert.ok(crop.r > 240 && crop.b < 20, `crop is the red label block, got r=${crop.r} b=${crop.b}`);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of keys) if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key];
  }
});
