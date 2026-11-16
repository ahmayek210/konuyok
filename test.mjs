import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { selectItem, targetRotation, updateHistory } from './src/logic.js';
const data = JSON.parse(await readFile(new URL('./public/questions.json', import.meta.url), 'utf8'));
assert.equal(data.schemaVersion, 1);
assert.equal(data.secretMode.id, 'gizli-kisisel');
const ids = new Set(), questions = new Set();
for (const mode of [...data.modes, data.secretMode]) {
  assert.ok(mode.categories.length);
  for (const category of mode.categories) for (const item of category.items) {
    assert.ok(item.id && item.topic && item.question);
    assert.ok(!ids.has(item.id)); ids.add(item.id);
    const q = item.question.toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
    assert.ok(!questions.has(q), `Tekrarlanan soru: ${q}`); questions.add(q);
    if (item.intensity != null) assert.ok(Number.isInteger(item.intensity) && item.intensity >= 1 && item.intensity <= 5);
    if (item.weight != null) assert.ok(Number.isFinite(item.weight) && item.weight > 0);
  }
  const all = mode.categories.flatMap(c => c.items), history = { used: [], last: null };
  for (let i = 0; i < all.length; i++) {
    const choice = selectItem(mode, history.used, () => .42, history.last);
    assert.ok(!choice.reset && !history.used.includes(choice.item.id));
    Object.assign(history, updateHistory(history, choice));
    const index = mode.categories.indexOf(choice.category), rotation = targetRotation(i * 1700, index, mode.categories.length);
    assert.ok(Math.abs((rotation + (index + .5) * 360 / mode.categories.length) % 360) < 1e-8);
  }
  const choice = selectItem(mode, history.used, () => 0, history.last);
  assert.ok(choice.reset); if (all.length > 1) assert.notEqual(choice.item.id, history.last);
}
const sample = { categories: [{id:'a',items:[{id:'a1', intensity:1}, {id:'a2', intensity:1}, {id:'a3', intensity:1}]},{id:'b',items:[{id:'b1', intensity:2}]}] };
assert.equal(selectItem(sample, [], () => .6).category.id, 'b');
assert.equal(selectItem(sample, ['b1'], () => .9).category.id, 'a');
assert.equal(selectItem(sample, [], () => 0, null, 5).empty, true);
const filteredReset = selectItem(sample, ['a1','a2','a3','b1'], () => 0, 'a3', 1);
assert.ok(filteredReset.reset); assert.deepEqual(updateHistory({used:['a1','a2','a3','b1']}, filteredReset).used, ['b1', 'a1']);
assert.equal(selectItem({categories:[]}).empty, true);
console.log(`Doğrulama başarılı: ${ids.size} benzersiz soru; seçim, geçmiş ve çark eşleşmesi.`);
