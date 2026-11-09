import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { selectItem, targetRotation } from './src/logic.js';
const data = JSON.parse(await readFile(new URL('./public/questions.json', import.meta.url), 'utf8'));
assert.equal(data.schemaVersion, 1); assert.equal(data.modes.length, 2);
const ids = new Set();
for (const [modeIndex, mode] of data.modes.entries()) {
 const all = mode.categories.flatMap(c => c.items); assert.equal(all.length, [55,45][modeIndex]);
 for (const item of all) { assert.ok(item.id && item.topic && item.question); assert.ok(!ids.has(item.id)); ids.add(item.id); }
 let used = [], last;
 for (let i = 0; i < all.length; i++) { const pick = selectItem(mode, used, () => .42, last); assert.ok(!pick.reset); assert.ok(!used.includes(pick.item.id)); assert.ok(pick.category.items.includes(pick.item)); used.push(pick.item.id); last = pick.item.id; const index = mode.categories.indexOf(pick.category); const rotation = targetRotation(i*1700, index, mode.categories.length); const center = (index + .5)*360/mode.categories.length; assert.ok(Math.abs((rotation + center) % 360) < 1e-8 || Math.abs((rotation + center) % 360 - 360) < 1e-8); }
 const reset = selectItem(mode, used, () => 0, last); assert.ok(reset.reset); assert.notEqual(reset.item.id, last);
}
assert.equal(ids.size,100); console.log('Doğrulama başarılı: 100 soru, benzersiz ID, seçim, kategori eşleşmesi ve döngü sıfırlama.');
