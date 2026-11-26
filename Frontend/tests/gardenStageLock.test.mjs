import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';

// Render the real component offline. Existing image imports need no binary payload in HTML tests.
const compiled = buildSync({
  stdin: { contents: `
    import React from 'react';
    import { renderToStaticMarkup } from 'react-dom/server';
    import { GardenScreen } from './components/screens/GardenScreen';
    const person = { id: 'one', name: 'One', avatar: '/test-avatar.png', email: '', status: 'Available', isOnline: false };
    export const render = points => renderToStaticMarkup(React.createElement(GardenScreen, {
      couple: { userA: person, userB: {...person, id: 'two', name: 'Two'}, isPaired: true, startDate: '2026-01-01' },
      lovePoints: points, history: [], onWater() {}, onFertilize() {}, onSunbath() {}, onSaveMemory() {},
    }));`, resolveDir: fileURLToPath(new URL('../src/', import.meta.url)), loader: 'tsx' },
  bundle: true, write: false, platform: 'node', format: 'cjs',
  external: ['react', 'react-dom/server'], loader: { '.png': 'empty', '.jpg': 'empty' },
}).outputFiles[0].text;
const module = { exports: {} };
new Function('require', 'module', 'exports', compiled)(createRequire(import.meta.url), module, module.exports);
const render = module.exports.render;

for (const [points, current] of [[0, 1], [99, 1], [100, 2], [299, 2], [300, 3], [499, 3], [500, 4], [999, 4], [1000, 5]]) {
  test(`${points} points, stage ${current}: only completed and current levels are selectable`, () => {
    const html = render(points);
    const buttons = [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map(match => match[0]);
    for (let stage = 1; stage <= 5; stage++) {
      const label = stage < current ? 'Đã đạt' : stage === current ? 'Đang chăm' : 'Chưa mở khóa';
      const button = buttons.find(markup => markup.includes(`aria-label="Cấp ${stage}: ${label}"`));
      assert.ok(button, `Missing correct label for stage ${stage}`);
      assert.equal(/\bdisabled=""/.test(button), stage > current);
      if (stage > current) assert.ok(button.includes('lucide-lock'));
      if (stage === current) assert.ok(button.includes('aria-current="step"'));
    }
    assert.ok(!html.includes('Đang chiêm ngưỡng'));
    // The stage-5 raster tree must never render while it is locked.
    if (current < 5) assert.ok(!/<img[^>]*alt="Cổ Thụ/.test(html));
  });
}
