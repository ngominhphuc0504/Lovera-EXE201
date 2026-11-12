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
