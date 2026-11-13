import assert from 'node:assert/strict';
import test from 'node:test';
import { constrainMemoryCrop, memoryCropSource, memoryCoverScale } from '../src/utils/memoryCrop.ts';
for (const [name, width, height] of [['landscape', 6000, 4000], ['portrait', 3000, 5000], ['square', 4000, 4000]]) {
  test(`${name}: drag and zoom always cover frame; export matches preview`, () => {
    for (const zoom of [0.1, 1, 1.5, 4, 10]) {
      for (const x of [-10000, -53, 0, 91, 10000]) {
        for (const y of [-10000, -37, 0, 81, 10000]) {
          const crop = constrainMemoryCrop(width, height, { zoom, x, y });
          const source = memoryCropSource(width, height, crop);
          assert.ok(crop.zoom >= 1 && crop.zoom <= 4);
          assert.ok(source.x >= -1e-9 && source.y >= -1e-9);
          assert.ok(source.x + source.width <= width + 1e-9);
          assert.ok(source.y + source.height <= height + 1e-9);
          assert.ok(Math.abs(source.width / source.height - 4 / 3) < 1e-9);
          const scale = memoryCoverScale(width, height) * crop.zoom;
          assert.ok(Math.abs((source.x - width / 2) * scale + crop.x + 200) < 1e-9);
          assert.ok(Math.abs((source.y - height / 2) * scale + crop.y + 150) < 1e-9);
          for (const screen of [320, 375, 400, 430]) {
            const renderedWidth = screen - 72;
            const left = renderedWidth * (0.5 + crop.x / 400 - width * scale / 800);
            const right = left + renderedWidth * width * scale / 400;
            assert.ok(left <= 1e-9 && right >= renderedWidth - 1e-9);
          }
        }
      }
    }
  });
}

for (const [width, height] of [[6000, 4000], [3000, 5000], [4000, 4000], [100, 3000]]) {
  test(`avatar ${width}x${height}: square crop covers circular preview at mobile widths`, () => {
    for (const zoom of [0.1, 1, 1.5, 4, 10]) {
      for (const x of [-10000, -53, 0, 91, 10000]) {
        for (const y of [-10000, -37, 0, 81, 10000]) {
          const crop = constrainMemoryCrop(width, height, { zoom, x, y }, 400);
          const source = memoryCropSource(width, height, crop, 400);
          assert.ok(crop.zoom >= 1 && crop.zoom <= 4);
          assert.equal(source.width, source.height);
          assert.ok(source.x >= -1e-9 && source.y >= -1e-9);
          assert.ok(source.x + source.width <= width + 1e-9);
          assert.ok(source.y + source.height <= height + 1e-9);
          const scale = memoryCoverScale(width, height, 400) * crop.zoom;
          for (const screen of [320, 375, 400, 430]) {
            const frame = Math.min(screen - 32, 384) - 32;
            // The same source rectangle must map to the full visible square.
            assert.ok(Math.abs(((source.x - width / 2) * scale + crop.x + 200) * frame / 400) < 1e-8);
            assert.ok(Math.abs(((source.y - height / 2) * scale + crop.y + 200) * frame / 400) < 1e-8);
          }
        }
      }
    }
    const centered = constrainMemoryCrop(width, height, { zoom: 2, x: 0, y: 0 }, 400);
    assert.equal(centered.zoom, 2);
    const reset = memoryCropSource(width, height, { zoom: 1, x: 0, y: 0 }, 400);
    assert.ok(Math.abs(reset.x - (width - reset.width) / 2) < 1e-9);
    assert.ok(Math.abs(reset.y - (height - reset.height) / 2) < 1e-9);
  });
}
