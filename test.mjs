import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import {
  historyKey, intensityAvailability, intensityFilter, personalDefault, personalTap,
  selectItem, targetRotation, updateHistory
} from './src/logic.js';
import { guesses, stories, nextGuess, nextStory } from './src/games.js';
const data = JSON.parse(await readFile(new URL('./public/questions.json', import.meta.url), 'utf8'));
assert.equal(data.schemaVersion, 1);
assert.deepEqual(data.modes.map(mode => mode.id), ['eglence', 'kisisel']);
assert.equal(data.secretMode.id, 'gizli-kisisel');
const [entertainment, personal] = data.modes;
assert.equal(createHash('sha256').update(JSON.stringify(entertainment)).digest('hex'),
  '2ce2a0cfb17d5393c75009034d581b3c29c313e4aa7f0d418d6b1879a3e1220b',
  'Kişisel çark güncellemesi Eğlence soru bankasını değiştirmemeli.');
const normalize = text => text.normalize('NFC').toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const ids = new Set(), questions = new Set();
for (const mode of [...data.modes, data.secretMode]) {
  assert.ok(mode.categories.length);
  for (const category of mode.categories) {
    assert.ok(Array.isArray(category.items) && category.items.length, category.id);
    for (const item of category.items) {
      assert.ok([item.id, item.topic, item.question].every(value => typeof value === 'string' && value.trim()));
      assert.ok(!ids.has(item.id), item.id);
      ids.add(item.id);
      const q = normalize(item.question);
      assert.ok(q && !questions.has(q), `Tekrarlanan soru: ${q}`);
      questions.add(q);
    }
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
let taps = 0;
for (let i=1;i<=7;i++) { const result=personalTap(taps,'kisisel',false); taps=result.count; assert.equal(result.action, i===7?'secret':'normal'); }
assert.equal(personalTap(6,'eglence',false).count,0);
assert.deepEqual(personalTap(4,'kisisel',true), {count:0,action:'normal'});
let game={index:0,player:'A',stage:'predict'};
assert.equal(nextGuess(game,'compare').stage,'predict');
game=nextGuess(game,'reveal'); assert.equal(game.stage,'answer');
game=nextGuess(game,'compare'); assert.equal(game.stage,'compare');
game=nextGuess(game,'next'); assert.deepEqual(game,{index:1,player:'B',stage:'predict'});
let tale={index:0,step:0}; for(let i=0;i<3;i++) tale=nextStory(tale); assert.equal(tale.step,3);
assert.ok(guesses.length>=20 && stories.length>=10 && stories.every(s=>s.length===4));
const weighted={categories:[{id:'one',items:[{id:'x',weight:1},{id:'y',weight:3}]}]};
let values=[0,.2]; assert.equal(selectItem(weighted,[],()=>values.shift()).item.id,'x');
values=[0,.3]; assert.equal(selectItem(weighted,[],()=>values.shift()).item.id,'y');
console.log('Gizli mod, ağırlıklar ve iki oyun akışı doğrulandı.');
// Category probability must not depend on the number of questions in a slice.
let seed = 1234567;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
let categoryCounts = {a:0,b:0};
for (let i=0; i<10000; i++) categoryCounts[selectItem(sample, [], random).category.id]++;
assert.ok(Math.abs(categoryCounts.a - categoryCounts.b) < 400, JSON.stringify(categoryCounts));
for (const mode of [...data.modes, data.secretMode]) {
  const categoryIds = new Set();
  for (const category of mode.categories) {
    assert.ok(category.id && category.label && !categoryIds.has(category.id)); categoryIds.add(category.id);
    for (const item of category.items) {
      assert.ok(Number.isInteger(item.intensity) && item.intensity >= 1 && item.intensity <= 5, item.id);
      assert.ok(Number.isFinite(item.weight) && item.weight > 0, item.id);
      if (item.followUps) assert.ok(Array.isArray(item.followUps) && item.followUps.every(text => typeof text === 'string' && text.trim()));
      const chosen = selectItem({categories:[{...category,items:[item]}]}, [], () => 0, null, item.intensity);
      assert.equal(chosen.item.id, item.id);
    }
  }
}
const oldHistory = {used:['a1','b1'],last:'b1'};
assert.deepEqual(updateHistory(oldHistory,{item:{id:'a2'},resetIds:[]}),{used:['a1','b1','a2'],last:'a2'});
console.log('Şema, eski geçmiş ve kategori dağılımı doğrulandı:', categoryCounts);
const available = intensityAvailability(sample, '2');
assert.deepEqual([...available.available].sort(), [1,2]);
assert.equal(available.selected, '2'); assert.equal(available.changed, false);
const unavailable = intensityAvailability(sample, '5');
assert.equal(unavailable.selected, ''); assert.equal(unavailable.changed, true);
assert.equal(intensityAvailability(sample, '').changed, false);
assert.deepEqual([...intensityAvailability({categories:[{items:[{id:'old'}]}]}).available], [2]);
assert.equal(intensityAvailability({categories:[]}, '1').changed, true);
for (const mode of [...data.modes, data.secretMode]) {
  const levels = intensityAvailability(mode).available;
  for (const item of mode.categories.flatMap(c => c.items)) assert.ok(levels.has(item.intensity ?? 2));
}
const itemsOf = mode => mode.categories.flatMap(category => category.items);
const personalItems = [...itemsOf(personal), ...itemsOf(data.secretMode)];
const bankExpectations = [
  { mode: personal, count: 280, categories: 7, levels: [5, 9, 10, 10, 6], safe: [1, 2, 3] },
  { mode: data.secretMode, count: 100, categories: 5, levels: [0, 2, 4, 6, 8], safe: [2, 3] }
];
for (const { mode, count, categories, levels, safe } of bankExpectations) {
  const bank = itemsOf(mode);
  assert.equal(bank.length, count);
  assert.equal(mode.categories.length, categories);
  const withFollowUps = bank.filter(item => item.followUps?.length);
  assert.ok(withFollowUps.length / count >= .5 && withFollowUps.length / count <= .65, mode.id);
  assert.ok(bank.every(item => !item.followUps || item.followUps.length <= 2));
  for (const category of mode.categories) {
    const counts = levels.map((_, index) => category.items.filter(item => item.intensity === index + 1).length);
    assert.deepEqual(counts, levels, category.id);
  }

  const filter = intensityFilter(personalDefault(mode.id));
  assert.deepEqual(filter, safe);
  const eligible = bank.filter(item => safe.includes(item.intensity));
  let history = { used: [], last: null };
  for (let i = 0; i < eligible.length; i++) {
    const choice = selectItem(mode, history.used, random, history.last, filter);
    assert.ok(safe.includes(choice.item.intensity) && !choice.reset && !history.used.includes(choice.item.id));
    history = updateHistory(history, choice);
  }
  const bold = selectItem(mode, history.used, random, history.last, intensityFilter('5'));
  assert.equal(bold.item.intensity, 5);
  history = updateHistory(history, bold);
  const availableInAll = selectItem(mode, bank.filter(item => item.id !== bold.item.id).map(item => item.id), random, null, intensityFilter(''));
  assert.equal(availableInAll.item.id, bold.item.id);
  const reset = selectItem(mode, history.used, random, history.last, filter);
  assert.ok(reset.reset && safe.includes(reset.item.intensity));
  assert.ok(updateHistory(history, reset).used.includes(bold.item.id));
}
const personalReset = selectItem(personal, itemsOf(personal).map(item => item.id), () => 0,
  personal.categories[0].items[0].id, intensityFilter(personalDefault(personal.id)));
assert.ok(personalReset.reset);
assert.notEqual(personalReset.item.id, personal.categories[0].items[0].id);
assert.equal(historyKey('eglence'), 'konuyok-eglence');
assert.equal(historyKey('kisisel'), 'konuyok-kisisel-v2');
assert.equal(historyKey('gizli-kisisel'), 'konuyok-gizli-kisisel-v2');
assert.equal(personalDefault('eglence'), '');

// Word overlap catches obvious rewrites with trivial word swaps.
const signatures = [...itemsOf(entertainment), ...personalItems].map(item => ({
  id: item.id,
  words: new Set(normalize(item.question).split(' '))
}));
for (const [index, first] of signatures.entries()) {
  for (let other = index + 1; other < signatures.length; other++) {
    const second = signatures[other];
    let shared = 0;
    for (const word of first.words) if (second.words.has(word)) shared++;
    const similarity = 2 * shared / (first.words.size + second.words.size);
    assert.ok(similarity < .84, `Benzer sorular: ${first.id} / ${second.id} (${similarity})`);
  }
}
const followUps = [...itemsOf(entertainment), ...personalItems].flatMap(item => item.followUps || []).map(normalize);
assert.ok(followUps.every(text => text && !questions.has(text)));
assert.equal(new Set(followUps).size, followUps.length);
console.log(`Kişisel setler, güvenli başlangıç, sürümlü geçmiş ve ${followUps.length} benzersiz devam sorusu doğrulandı.`);
