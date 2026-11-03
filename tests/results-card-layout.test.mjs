// node --import tsx --test tests/results-card-layout.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { ImageResponse } from 'next/og.js';
import { PNG } from 'pngjs';
import { readFile } from 'node:fs/promises';
import { ResultsCard } from '../src/components/ResultsCard.tsx';

test('actual PNG puts meal details and leftovers below macros inside the left margin', async () => {
  const fonts = await Promise.all([300, 400, 500, 600].map(async weight => ({ name: 'Manrope', data: await readFile(new URL(`../src/assets/fonts/Manrope-${weight}.ttf`, import.meta.url)), weight, style: 'normal' })));
  const data = { kind: 'meal', kcal: 157, macros: { protein: 5.8, carbs: 30.9, fat: 0.9 }, items: [{ name: 'Plain spaghetti', grams: 100 }], waterLine: 'Water in this meal: 69 ml · Consumed today: 319 ml', footer: 'leftovers (not eaten): 100 g · 157 kcal' };
  const response = new ImageResponse(React.createElement(ResultsCard, { data, size: 1080, fontFamily: 'Manrope' }), { width: 1080, height: 1080, fonts });
  const png = PNG.sync.read(Buffer.from(await response.arrayBuffer()));
  assert.equal(png.width, 1080);
  assert.equal(png.height, 1080);
  // Inspect rasterized ink, not the React tree: the old fragment rendered these
  // rows to the right of the macros, outside the PNG's available width.
  for (const [label, top, bottom] of [['food', 805, 845], ['water', 875, 915], ['leftovers', 945, 985]]) {
    let ink = 0;
    for (let y = top; y < bottom; y++) for (let x = 88; x < 650; x++) {
      const index = (y * png.width + x) * 4;
      if (png.data[index] < 180 && png.data[index + 1] < 180 && png.data[index + 2] < 180) ink++;
    }
    assert.ok(ink > 300, `${label} must be visible below the macros within the card`);
  }
});
