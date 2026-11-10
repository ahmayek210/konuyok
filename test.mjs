import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { selectItem, targetRotation } from './src/logic.js';

const data = JSON.parse(await readFile(new URL('./public/questions.json', import.meta.url), 'utf8'));
assert.equal(data.schemaVersion, 1);
assert.equal(data.modes.length, 2);

const ids = new Set();
const questions = new Set();
let count = 0;
for (const [modeIndex, mode] of data.modes.entries()) {
  assert.equal(mode.categories.length, [8, 7][modeIndex]);
  const all = mode.categories.flatMap(category => category.items);
  assert.equal(all.length, [129, 111][modeIndex]);
  const categoryIds = new Set();
  for (const category of mode.categories) {
    assert.ok(category.id && category.label && category.items.length > 0);
    assert.ok(!categoryIds.has(category.id));
    categoryIds.add(category.id);
    for (const item of category.items) {
      assert.ok(item.id && item.topic && item.question);
      assert.ok(!ids.has(item.id));
      ids.add(item.id);
      const normalized = item.question.toLocaleLowerCase('tr').replace(/\\s+/g, ' ').trim();
      assert.ok(!questions.has(normalized), 'Tekrarlanan soru: ' + item.question);
      questions.add(normalized);
      count++;
    }
  }
  const used = [];
  let last = null;
  for (let i = 0; i < all.length; i++) {
    const pick = selectItem(mode, used, () => .42, last);
    assert.ok(!pick.reset);
    assert.ok(!used.includes(pick.item.id));
    assert.ok(pick.category.items.includes(pick.item));
    used.push(pick.item.id);
    last = pick.item.id;
    const index = mode.categories.indexOf(pick.category);
    const rotation = targetRotation(i * 1700, index, mode.categories.length);
    const center = (index + .5) * 360 / mode.categories.length;
    assert.ok(Math.abs((rotation + center) % 360) < 1e-8 || Math.abs((rotation + center) % 360 - 360) < 1e-8);
  }
  const reset = selectItem(mode, used, () => 0, last);
  assert.ok(reset.reset);
  assert.notEqual(reset.item.id, last);
}
assert.equal(count, 240);
assert.equal(ids.size, 240);
assert.equal(questions.size, 240);
console.log('Doğrulama başarılı: 240 benzersiz soru, 15 kategori, seçim, eşleşme ve döngü sıfırlama.');
